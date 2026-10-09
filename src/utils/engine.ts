import {
  RouletteColor,
  RoundLog,
  SimulationStats,
  StrategyConfig,
  MonteCarloRun,
  MonteCarloSummary,
  CycleStats
} from '../types/roulette';
import {
  getNumberColor,
  DEFAULT_STRATEGY_CONFIG,
  RED_NUMBERS
} from '../constants/roulette';
import { getCryptoRouletteNumber } from './cryptoRng';

// Tirage matériel cryptographique non biaisé de niveau casino (0-36)
export function getRandomRouletteNumber(): number {
  if (typeof window !== 'undefined' && window.crypto) {
    return getCryptoRouletteNumber();
  }
  return Math.floor(Math.random() * 37);
}

export interface EngineState {
  config: StrategyConfig;
  bankroll: number;
  phase: 'OBSERVATION' | 'BETTING';
  consecutiveColor: RouletteColor | null;
  consecutiveCount: number;
  betColor: RouletteColor | null;
  currentStep: number; // 1 to 8 when betting, 0 when observing
  spinIndex: number;
  cycleStartSpin: number;
  cycleLossAccumulated: number;
  isBroke: boolean;
  history: RoundLog[];
  stats: SimulationStats;
}

export function createInitialStats(initialBankroll: number): SimulationStats {
  return {
    totalSpins: 0,
    spinsBet: 0,
    spinsObserved: 0,
    currentBankroll: initialBankroll,
    initialBankroll: initialBankroll,
    netProfit: 0,
    peakBankroll: initialBankroll,
    lowestBankroll: initialBankroll,
    maxDrawdown: 0,
    maxDrawdownPercent: 0,
    totalWagered: 0,
    consecutiveLossesRecord: 0,
    redCount: 0,
    blackCount: 0,
    greenCount: 0,
    cycles: {
      totalCycles: 0,
      cyclesWon: 0,
      cyclesLost: 0,
      stepWinDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 },
      totalProfitFromWins: 0,
      totalLossFromCrashes: 0,
    },
  };
}

export function createInitialEngine(config: StrategyConfig = DEFAULT_STRATEGY_CONFIG): EngineState {
  return {
    config,
    bankroll: config.initialBankroll,
    phase: 'OBSERVATION',
    consecutiveColor: null,
    consecutiveCount: 0,
    betColor: null,
    currentStep: 0,
    spinIndex: 0,
    cycleStartSpin: 0,
    cycleLossAccumulated: 0,
    isBroke: false,
    history: [],
    stats: createInitialStats(config.initialBankroll),
  };
}

// Exécute 1 tirage sur l'état courant et retourne le nouvel état
export function stepEngine(
  state: EngineState,
  forcedNumber?: number
): { newState: EngineState; roundLog: RoundLog } {
  if (state.isBroke) {
    // Joueur ruiné
    const roundLog: RoundLog = {
      spinIndex: state.spinIndex,
      number: 0,
      color: 'green',
      phase: state.phase,
      consecutiveCount: state.consecutiveCount,
      observedColor: state.consecutiveColor,
      betColor: null,
      betAmount: 0,
      stepIndex: 0,
      outcome: 'SKIPPED',
      netProfitRound: 0,
      cycleProfit: 0,
      bankroll: state.bankroll,
    };
    return { newState: state, roundLog };
  }

  const rolledNumber = forcedNumber !== undefined ? forcedNumber : getRandomRouletteNumber();
  const rolledColor = getNumberColor(rolledNumber);
  const nextSpinIndex = state.spinIndex + 1;

  // Cloner les compteurs de couleurs
  let redCount = state.stats.redCount;
  let blackCount = state.stats.blackCount;
  let greenCount = state.stats.greenCount;

  if (rolledColor === 'red') redCount++;
  else if (rolledColor === 'black') blackCount++;
  else greenCount++;

  let newBankroll = state.bankroll;
  let newPhase = state.phase;
  let newConsecutiveColor = state.consecutiveColor;
  let newConsecutiveCount = state.consecutiveCount;
  let newBetColor = state.betColor;
  let newCurrentStep = state.currentStep;
  let newCycleLossAccumulated = state.cycleLossAccumulated;
  let isBroke: boolean = state.isBroke;

  const cycleStats: CycleStats = {
    ...state.stats.cycles,
    stepWinDistribution: { ...state.stats.cycles.stepWinDistribution },
  };

  let betAmount = 0;
  let roundOutcome: 'WIN' | 'LOSS' | 'OBSERVED' | 'SKIPPED' = 'OBSERVED';
  let netProfitRound = 0;
  let roundCycleProfit = 0;
  let cycleEvent: RoundLog['cycleEvent'];
  let totalWagered = state.stats.totalWagered;
  let spinsBet = state.stats.spinsBet;
  let spinsObserved = state.stats.spinsObserved;
  let consecutiveLossesRecord = state.stats.consecutiveLossesRecord;

  if (state.phase === 'OBSERVATION') {
    spinsObserved++;
    // Pas de mise en phase d'observation
    betAmount = 0;
    roundOutcome = 'OBSERVED';

    if (rolledColor === 'green') {
      // Le zéro casse la série d'observation
      newConsecutiveColor = null;
      newConsecutiveCount = 0;
    } else if (rolledColor === state.consecutiveColor) {
      newConsecutiveCount++;
    } else {
      newConsecutiveColor = rolledColor;
      newConsecutiveCount = 1;
    }

    // Vérifier si le déclencheur est activé (ex: 2 consécutifs)
    if (newConsecutiveCount >= state.config.consecutiveTrigger && newConsecutiveColor !== null) {
      // Déclenchement ! Le tour suivant sera en phase BETTING
      newPhase = 'BETTING';
      newBetColor = newConsecutiveColor === 'red' ? 'black' : 'red';
      newCurrentStep = 1;
      newCycleLossAccumulated = 0;
      cycleEvent = 'TRIGGERED';
    }
  } else {
    // PHASE DE MISE (BETTING)
    spinsBet++;
    const stepIdx = state.currentStep;
    betAmount = state.config.betProgression[stepIdx - 1] || state.config.betProgression[state.config.betProgression.length - 1];

    // Vérifier si la bankroll permet de miser la somme requise pour ce palier
    if (newBankroll < betAmount) {
      // Le joueur ne peut pas doubler (fonds insuffisants pour ce palier, ex: 640 € requis alors qu'il reste 365 €)
      // La séquence s'arrête en Stop-Loss prématuré
      roundCycleProfit = -newCycleLossAccumulated;
      cycleStats.totalCycles++;
      cycleStats.cyclesLost++;
      cycleStats.totalLossFromCrashes += newCycleLossAccumulated;

      const playerCanKeepPlaying = newBankroll >= state.config.baseBet;
      const isPlayerBroke = !playerCanKeepPlaying;

      const roundLog: RoundLog = {
        spinIndex: nextSpinIndex,
        number: rolledNumber,
        color: rolledColor,
        phase: 'BETTING',
        consecutiveCount: state.consecutiveCount,
        observedColor: state.consecutiveColor,
        betColor: state.betColor,
        betAmount,
        stepIndex: stepIdx,
        outcome: 'SKIPPED',
        netProfitRound: 0,
        cycleProfit: roundCycleProfit,
        bankroll: newBankroll,
        cycleEvent: 'CRASH_STOP_LOSS',
      };

      return {
        newState: {
          ...state,
          bankroll: newBankroll,
          phase: 'OBSERVATION',
          consecutiveColor: null,
          consecutiveCount: 0,
          betColor: null,
          currentStep: 0,
          cycleLossAccumulated: 0,
          isBroke: isPlayerBroke,
          spinIndex: nextSpinIndex,
          history: [roundLog, ...state.history.slice(0, 199)],
          stats: {
            ...state.stats,
            totalSpins: nextSpinIndex,
            spinsObserved: state.stats.spinsObserved + 1,
            currentBankroll: newBankroll,
            cycles: cycleStats,
            redCount,
            blackCount,
            greenCount,
          },
        },
        roundLog,
      };
    }

    totalWagered += betAmount;

    // Résolution du pari
    if (rolledColor === state.betColor) {
      // GAIN !
      roundOutcome = 'WIN';
      netProfitRound = betAmount; // Gain brut = 2x mise, donc net = +betAmount
      newBankroll += netProfitRound;

      // Bénéfice net du cycle : Toujours égal à la mise de base (ex: 5 €)
      roundCycleProfit = state.config.baseBet;
      cycleEvent = 'WON';

      // Clôture du cycle
      cycleStats.totalCycles++;
      cycleStats.cyclesWon++;
      cycleStats.stepWinDistribution[stepIdx] = (cycleStats.stepWinDistribution[stepIdx] || 0) + 1;
      cycleStats.totalProfitFromWins += roundCycleProfit;

      // Retour immédiat en phase d'observation : remise stricte des compteurs à 0
      newPhase = 'OBSERVATION';
      newBetColor = null;
      newCurrentStep = 0;
      newCycleLossAccumulated = 0;
      newConsecutiveColor = null;
      newConsecutiveCount = 0;
    } else {
      // PERTE
      roundOutcome = 'LOSS';
      let lossAmount = betAmount;
      if (rolledColor === 'green' && state.config.zeroRule === 'partage') {
        lossAmount = betAmount / 2;
      }
      netProfitRound = -lossAmount;
      newBankroll -= lossAmount;
      newCycleLossAccumulated += lossAmount;

      // Vérification du record de pertes consécutives
      if (stepIdx > consecutiveLossesRecord) {
        consecutiveLossesRecord = stepIdx;
      }

      if (stepIdx < state.config.maxSteps) {
        // Progression au palier suivant
        newCurrentStep = stepIdx + 1;
        cycleEvent = 'PROGRESSION';
        // On reste sur la même couleur cible
      } else {
        // PLAFOND ATTEINT (8ème mise perdue = 640 €) : STOP-LOSS
        cycleEvent = 'CRASH_STOP_LOSS';
        roundCycleProfit = -newCycleLossAccumulated;

        cycleStats.totalCycles++;
        cycleStats.cyclesLost++;
        cycleStats.totalLossFromCrashes += newCycleLossAccumulated;

        // Réinitialisation stricte en phase d'observation avec compteurs remis à 0
        newPhase = 'OBSERVATION';
        newBetColor = null;
        newCurrentStep = 0;
        newCycleLossAccumulated = 0;
        newConsecutiveColor = null;
        newConsecutiveCount = 0;
      }
    }
  }

  // Vérifier faillite
  if (newBankroll <= 0) {
    newBankroll = Math.max(0, newBankroll);
    isBroke = true;
  }

  // Calcul du Drawdown
  const peakBankroll = Math.max(state.stats.peakBankroll, newBankroll);
  const lowestBankroll = Math.min(state.stats.lowestBankroll, newBankroll);
  const currentDrawdown = peakBankroll - newBankroll;
  const maxDrawdown = Math.max(state.stats.maxDrawdown, currentDrawdown);
  const maxDrawdownPercent = peakBankroll > 0 ? (maxDrawdown / peakBankroll) * 100 : 0;
  const netProfit = newBankroll - state.config.initialBankroll;

  const newStats: SimulationStats = {
    totalSpins: nextSpinIndex,
    spinsBet,
    spinsObserved,
    currentBankroll: newBankroll,
    initialBankroll: state.config.initialBankroll,
    netProfit,
    peakBankroll,
    lowestBankroll,
    maxDrawdown,
    maxDrawdownPercent,
    totalWagered,
    cycles: cycleStats,
    consecutiveLossesRecord,
    redCount,
    blackCount,
    greenCount,
  };

  const roundLog: RoundLog = {
    spinIndex: nextSpinIndex,
    number: rolledNumber,
    color: rolledColor,
    phase: state.phase,
    consecutiveCount: state.consecutiveCount,
    observedColor: state.consecutiveColor,
    betColor: state.betColor,
    betAmount,
    stepIndex: state.currentStep,
    outcome: roundOutcome,
    netProfitRound,
    cycleProfit: roundCycleProfit,
    bankroll: newBankroll,
    cycleEvent,
  };

  // Conserver jusqu'à 300 tours récents dans l'historique UI
  const newHistory = [roundLog, ...state.history.slice(0, 299)];

  const newState: EngineState = {
    config: state.config,
    bankroll: newBankroll,
    phase: newPhase,
    consecutiveColor: newConsecutiveColor,
    consecutiveCount: newConsecutiveCount,
    betColor: newBetColor,
    currentStep: newCurrentStep,
    spinIndex: nextSpinIndex,
    cycleStartSpin: state.cycleStartSpin,
    cycleLossAccumulated: newCycleLossAccumulated,
    isBroke,
    history: newHistory,
    stats: newStats,
  };

  return { newState, roundLog };
}

// Exécute un lot de N tirages à grande vitesse
export function runBatch(
  initialState: EngineState,
  spinCount: number
): { finalState: EngineState; logs: RoundLog[]; bankrollCurve: { spin: number; bankroll: number; netProfit: number }[] } {
  let state = initialState;
  const logs: RoundLog[] = [];
  const bankrollCurve: { spin: number; bankroll: number; netProfit: number }[] = [
    { spin: state.spinIndex, bankroll: state.bankroll, netProfit: state.stats.netProfit }
  ];

  const sampleStep = Math.max(1, Math.floor(spinCount / 200));

  for (let i = 0; i < spinCount; i++) {
    if (state.isBroke) break;
    const { newState, roundLog } = stepEngine(state);
    state = newState;
    logs.push(roundLog);

    if (i % sampleStep === 0 || i === spinCount - 1) {
      bankrollCurve.push({
        spin: state.spinIndex,
        bankroll: state.bankroll,
        netProfit: state.stats.netProfit,
      });
    }
  }

  return { finalState: state, logs, bankrollCurve };
}

// Lookup rapide pour vitesse maximale dans la boucle Monte Carlo
const IS_RED_TABLE = new Uint8Array(37);
RED_NUMBERS.forEach((n) => {
  IS_RED_TABLE[n] = 1;
});

// Simulation Monte Carlo Haute-Performance : capable d'exécuter des millions de tirages en quelques millisecondes
export function runMonteCarloSimulation(
  config: StrategyConfig,
  totalRuns: number = 500,
  spinsPerRun: number = 500
): { summary: MonteCarloSummary; runs: MonteCarloRun[] } {
  const runs: MonteCarloRun[] = [];
  let ruinCount = 0;
  let profitableRuns = 0;
  let totalFinalBankroll = 0;
  let totalCrashes = 0;
  let maxDrawdownOverall = 0;
  let bestOutcome = -Infinity;
  let worstOutcome = Infinity;

  const finalBankrolls: number[] = [];
  const progression = config.betProgression;
  const maxSteps = config.maxSteps;
  const trigger = config.consecutiveTrigger;
  const initialBankroll = config.initialBankroll;

  for (let r = 0; r < totalRuns; r++) {
    let bankroll = initialBankroll;
    let phase = 0; // 0 = OBSERVATION, 1 = BETTING
    let streakColor = 0; // 0 = none, 1 = red, 2 = black
    let streakCount = 0;
    let currentStep = 0;
    let targetColor = 0; // 1 = red, 2 = black
    let crashesCount = 0;
    let wonCount = 0;
    let peak = bankroll;
    let maxDrawdown = 0;
    let isBroke = false;

    for (let s = 0; s < spinsPerRun; s++) {
      // Tirage rapide d'un numéro 0-36
      const roll = (Math.random() * 37) | 0;
      const rollColor = roll === 0 ? 0 : IS_RED_TABLE[roll] === 1 ? 1 : 2;

      if (phase === 0) {
        // Phase d'observation
        if (rollColor === 0) {
          streakColor = 0;
          streakCount = 0;
        } else if (rollColor === streakColor) {
          streakCount++;
        } else {
          streakColor = rollColor;
          streakCount = 1;
        }

        if (streakCount >= trigger && streakColor !== 0) {
          phase = 1;
          targetColor = streakColor === 1 ? 2 : 1; // Pari sur la couleur opposée
          currentStep = 1;
        }
      } else {
        // Phase de mise active
        const bet = progression[currentStep - 1] || progression[progression.length - 1];

        if (bankroll < bet) {
          // Fonds insuffisants pour ce palier (ex: le joueur a 365 € mais la mise demandée est 640 €)
          // La séquence s'arrête en Stop-Loss : le joueur conserve ses fonds restants
          crashesCount++;
          phase = 0;
          currentStep = 0;
          streakColor = 0;
          streakCount = 0;

          // Le joueur n'est en faillite que s'il n'a même plus de quoi payer la mise de départ (ex: < 5 €)
          if (bankroll < progression[0]) {
            isBroke = true;
            break;
          }
          continue;
        }

        if (rollColor === targetColor) {
          // Gain : remise stricte des compteurs d'observation à 0
          bankroll += bet;
          wonCount++;
          phase = 0;
          currentStep = 0;
          streakColor = 0;
          streakCount = 0;
        } else {
          // Perte
          bankroll -= bet;
          if (currentStep < maxSteps) {
            currentStep++;
          } else {
            // Plafond de mise atteint (Crash) : remise des compteurs à 0
            crashesCount++;
            phase = 0;
            currentStep = 0;
            streakColor = 0;
            streakCount = 0;
          }
        }

        if (bankroll > peak) peak = bankroll;
        const dd = peak - bankroll;
        if (dd > maxDrawdown) maxDrawdown = dd;

        if (bankroll < progression[0]) {
          isBroke = true;
          break;
        }
      }
    }

    const netProfit = bankroll - initialBankroll;
    if (isBroke || bankroll < progression[0]) ruinCount++;
    if (netProfit > 0) profitableRuns++;

    totalFinalBankroll += bankroll;
    totalCrashes += crashesCount;
    finalBankrolls.push(bankroll);

    if (maxDrawdown > maxDrawdownOverall) maxDrawdownOverall = maxDrawdown;
    if (netProfit > bestOutcome) bestOutcome = netProfit;
    if (netProfit < worstOutcome) worstOutcome = netProfit;

    // Conserver jusqu'à 2 000 runs individuels pour éviter de saturer la RAM
    if (r < 2000) {
      runs.push({
        runId: r + 1,
        finalBankroll: bankroll,
        netProfit,
        isBroke,
        maxDrawdown,
        crashesCount,
        cyclesWonCount: wonCount,
      });
    }
  }

  finalBankrolls.sort((a, b) => a - b);
  const medianFinalBankroll = finalBankrolls[Math.floor(finalBankrolls.length / 2)] || 0;

  const summary: MonteCarloSummary = {
    totalRuns,
    spinsPerRun,
    ruinCount,
    ruinRate: (ruinCount / totalRuns) * 100,
    profitableRuns,
    profitableRate: (profitableRuns / totalRuns) * 100,
    averageFinalBankroll: totalFinalBankroll / totalRuns,
    medianFinalBankroll,
    bestOutcome,
    worstOutcome,
    averageCrashes: totalCrashes / totalRuns,
    totalCrashes,
    maxDrawdownOverall,
  };

  return { summary, runs };
}
