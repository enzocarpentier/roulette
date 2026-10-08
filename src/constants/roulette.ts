import { RouletteColor, StrategyConfig } from '../types/roulette';

// Ordre physique standard des numéros sur la roue européenne (sens horaire)
export const EUROPEAN_WHEEL_ORDER: number[] = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10,
  5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

export const RED_NUMBERS: ReadonlySet<number> = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36
]);

export const BLACK_NUMBERS: ReadonlySet<number> = new Set([
  2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35
]);

export function getNumberColor(num: number): RouletteColor {
  if (num === 0) return 'green';
  if (RED_NUMBERS.has(num)) return 'red';
  return 'black';
}

// Configuration par défaut selon le cahier des charges exact
export const DEFAULT_STRATEGY_CONFIG: StrategyConfig = {
  initialBankroll: 1500, // Suffisant pour absorber 1 crash à 1 275 €
  baseBet: 5,
  consecutiveTrigger: 2, // 2 couleurs identiques consécutives
  maxSteps: 8, // 8 paliers maximums
  betProgression: [5, 10, 20, 40, 80, 160, 320, 640],
  zeroRule: 'loss', // Zéro = perte sur chance simple (standard casino)
  stopLossBankroll: 0,
  takeProfitBankroll: undefined,
};

export const CUMULATIVE_SEQUENCE_LOSS = 1275; // 5+10+20+40+80+160+320+640

export function computeProgression(baseBet: number, maxSteps: number = 8): number[] {
  const progression: number[] = [];
  let current = baseBet;
  for (let i = 0; i < maxSteps; i++) {
    progression.push(current);
    current *= 2;
  }
  return progression;
}
