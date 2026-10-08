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
  DEFAULT_STRATEGY_CONFIG
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

    // Vérifier si la bankroll permet de miser
    if (newBankroll < betAmount) {
      // Ne peut pas miser la somme requise
      isBroke = true;
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
        cycleProfit: 0,
        bankroll: newBankroll,
        cycleEvent: 'CRASH_STOP_LOSS',
      };
      return {
        newState: {
          ...state,
          isBroke: true,
          spinIndex: nextSpinIndex,
          history: [roundLog, ...state.history.slice(0, 199)],
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

      // Retour immédiat en phase d'observation
      newPhase = 'OBSERVATION';
      newBetColor = null;
      newCurrentStep = 0;
      newCycleLossAccumulated = 0;

      // La couleur qui vient de sortir initialise l'observation
      newConsecutiveColor = rolledColor;
      newConsecutiveCount = 1;
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

        // Réinitialisation stricte en phase d'observation
        newPhase = 'OBSERVATION';
        newBetColor = null;
        newCurrentStep = 0;
        newCycleLossAccumulated = 0;

        if (rolledColor === 'green') {
          newConsecutiveColor = null;
          newConsecutiveCount = 0;
        } else {
          newConsecutiveColor = rolledColor;
          newConsecutiveCount = 1;
        }
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

// Simulation Monte Carlo : exécute M sessions de N tirages chacune
export function runMonteCarloSimulation(
  config: StrategyConfig,
  totalRuns: number = 200,
  spinsPerRun: number = 500
): { summary: MonteCarloSummary; runs: MonteCarloRun[] } {
  const runs: MonteCarloRun[] = [];
  let ruinCount = 0;
  let profitableRuns = 0;
  let totalFinalBankroll = 0;
  let totalCrashes = 0;
  let bestOutcome = -Infinity;
  let worstOutcome = Infinity;

  const finalBankrolls: number[] = [];

  for (let r = 0; r < totalRuns; r++) {
    let state = createInitialEngine(config);

    for (let s = 0; s < spinsPerRun; s++) {
      if (state.isBroke) break;
      const { newState } = stepEngine(state);
      state = newState;
    }

    const netProfit = state.bankroll - config.initialBankroll;
    if (state.isBroke || state.bankroll <= 0) ruinCount++;
    if (netProfit > 0) profitableRuns++;

    totalFinalBankroll += state.bankroll;
    totalCrashes += state.stats.cycles.cyclesLost;
    finalBankrolls.push(state.bankroll);

    if (netProfit > bestOutcome) bestOutcome = netProfit;
    if (netProfit < worstOutcome) worstOutcome = netProfit;

    runs.push({
      runId: r + 1,
      finalBankroll: state.bankroll,
      netProfit,
      isBroke: state.isBroke,
      maxDrawdown: state.stats.maxDrawdown,
      crashesCount: state.stats.cycles.cyclesLost,
      cyclesWonCount: state.stats.cycles.cyclesWon,
    });
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
  };

  return { summary, runs };
}
