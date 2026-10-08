export type RouletteColor = 'red' | 'black' | 'green';

export interface RouletteNumber {
  number: number;
  color: RouletteColor;
}

export type StrategyPhase = 'OBSERVATION' | 'BETTING';

export interface StrategyConfig {
  initialBankroll: number;
  baseBet: number; // 5 €
  consecutiveTrigger: number; // 2 consécutifs
  maxSteps: number; // 8 tours
  betProgression: number[]; // [5, 10, 20, 40, 80, 160, 320, 640]
  zeroRule: 'loss' | 'partage'; // 'loss' = standard casino, 'partage' = 50% remboursé
  stopLossBankroll?: number; // Arrêt d'urgence si bankroll totale descend sous ce seuil
  takeProfitBankroll?: number; // Arrêt si bankroll atteint cet objectif
}

export interface SpinResult {
  spinIndex: number;
  number: number;
  color: RouletteColor;
  timestamp: number;
}

export interface RoundLog {
  spinIndex: number;
  number: number;
  color: RouletteColor;
  phase: StrategyPhase;
  consecutiveCount: number;
  observedColor: RouletteColor | null;
  betColor: RouletteColor | null;
  betAmount: number;
  stepIndex: number; // 1 to 8 when BETTING, 0 when OBSERVATION
  outcome: 'WIN' | 'LOSS' | 'OBSERVED' | 'SKIPPED';
  netProfitRound: number;
  cycleProfit: number;
  bankroll: number;
  cycleEvent?: 'TRIGGERED' | 'WON' | 'PROGRESSION' | 'CRASH_STOP_LOSS';
}

export interface CycleStats {
  totalCycles: number;
  cyclesWon: number;
  cyclesLost: number; // Crashes at step 8
  stepWinDistribution: Record<number, number>; // step 1 to 8 -> count
  totalProfitFromWins: number;
  totalLossFromCrashes: number;
}

export interface SimulationStats {
  totalSpins: number;
  spinsBet: number;
  spinsObserved: number;
  currentBankroll: number;
  initialBankroll: number;
  netProfit: number;
  peakBankroll: number;
  lowestBankroll: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  totalWagered: number;
  cycles: CycleStats;
  consecutiveLossesRecord: number;
  redCount: number;
  blackCount: number;
  greenCount: number;
}

export interface MonteCarloRun {
  runId: number;
  finalBankroll: number;
  netProfit: number;
  isBroke: boolean;
  maxDrawdown: number;
  crashesCount: number;
  cyclesWonCount: number;
}

export interface MonteCarloSummary {
  totalRuns: number;
  spinsPerRun: number;
  ruinCount: number;
  ruinRate: number; // %
  profitableRuns: number;
  profitableRate: number; // %
  averageFinalBankroll: number;
  medianFinalBankroll: number;
  bestOutcome: number;
  worstOutcome: number;
  averageCrashes: number;
}
