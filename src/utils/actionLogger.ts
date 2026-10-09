// Système de logging temps-réel de toutes les actions et tirages de l'application

export type LogCategory = 
  | 'SPIN' 
  | 'OBSERVE' 
  | 'BET' 
  | 'WIN' 
  | 'LOSS' 
  | 'STOP_LOSS' 
  | 'CONFIG' 
  | 'SESSION';

export interface AppLogEntry {
  id: string;
  timestamp: string; // HH:mm:ss.SSS
  fullIsoTime: string;
  category: LogCategory;
  title: string;
  details?: string;
  data?: Record<string, any>;
  bankroll?: number;
  spinIndex?: number;
}

const STORAGE_KEY = 'roulette_action_logs_v1';
const MAX_LOGS = 1000;

class ActionLogger {
  private logs: AppLogEntry[] = [];
  private listeners: Set<(logs: AppLogEntry[]) => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const stored = sessionStorage.getItem(STORAGE_KEY);
        if (stored) {
          this.logs = JSON.parse(stored);
        }
      }
    } catch {
      this.logs = [];
    }
  }

  private saveToStorage() {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        // Sauvegarder les 500 derniers logs en session
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs.slice(-500)));
      }
    } catch {
      // Ignorer les erreurs de quota de stockage
    }
  }

  private notify() {
    const copy = [...this.logs];
    this.listeners.forEach((fn) => fn(copy));
  }

  public log(
    category: LogCategory,
    title: string,
    options: {
      details?: string;
      data?: Record<string, any>;
      bankroll?: number;
      spinIndex?: number;
    } = {}
  ): AppLogEntry {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;

    const entry: AppLogEntry = {
      id: `${now.getTime()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: timeStr,
      fullIsoTime: now.toISOString(),
      category,
      title,
      details: options.details,
      data: options.data,
      bankroll: options.bankroll,
      spinIndex: options.spinIndex,
    };

    this.logs.unshift(entry); // Plus récent en premier

    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(0, MAX_LOGS);
    }

    this.saveToStorage();
    this.notify();

    // Log console avec couleurs pour inspection DevTools
    const colors: Record<LogCategory, string> = {
      SPIN: '#a855f7',
      OBSERVE: '#3b82f6',
      BET: '#f59e0b',
      WIN: '#10b981',
      LOSS: '#ef4444',
      STOP_LOSS: '#dc2626',
      CONFIG: '#06b6d4',
      SESSION: '#64748b',
    };

    const style = `background: ${colors[category]}; color: #fff; font-weight: bold; padding: 2px 5px; border-radius: 4px;`;
    if (options.data) {
      console.log(`%c[${category}] ${entry.timestamp}`, style, title, options.details || '', options.data);
    } else {
      console.log(`%c[${category}] ${entry.timestamp}`, style, title, options.details || '');
    }

    return entry;
  }

  public getLogs(): AppLogEntry[] {
    return [...this.logs];
  }

  public clear(): void {
    this.logs = [];
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
    this.notify();
  }

  public subscribe(listener: (logs: AppLogEntry[]) => void): () => void {
    this.listeners.add(listener);
    listener([...this.logs]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public exportFormattedText(): string {
    const header = [
      `=== EXPORT DES LOGS ROULETTE ===`,
      `Date de l'export : ${new Date().toLocaleString('fr-FR')}`,
      `Total d'événements enregistrés : ${this.logs.length}`,
      `==================================\n`,
    ].join('\n');

    // Ordre chronologique pour lecture facile
    const chronological = [...this.logs].reverse();

    const lines = chronological.map((l) => {
      let str = `[${l.timestamp}] [${l.category.padEnd(9)}] ${l.title}`;
      if (l.bankroll !== undefined) {
        str += ` | Bankroll: ${l.bankroll.toLocaleString('fr-FR')} €`;
      }
      if (l.details) {
        str += ` | ${l.details}`;
      }
      if (l.data && Object.keys(l.data).length > 0) {
        str += ` | Détails: ${JSON.stringify(l.data)}`;
      }
      return str;
    });

    return `${header}${lines.join('\n')}\n\n=== FIN DE L'EXPORT ===`;
  }
}

export const logger = new ActionLogger();

import { RoundLog } from '../types/roulette';
import { EngineState } from './engine';

export function logRoundEvent(roundLog: RoundLog, newState: EngineState) {
  const colorFr = roundLog.color === 'red' ? 'Rouge' : roundLog.color === 'black' ? 'Noir' : 'Vert (0)';
  const betColorFr = roundLog.betColor === 'red' ? 'Rouge' : roundLog.betColor === 'black' ? 'Noir' : '';

  if (roundLog.outcome === 'OBSERVED') {
    if (roundLog.cycleEvent === 'TRIGGERED') {
      logger.log(
        'OBSERVE',
        `Tirage #${roundLog.spinIndex} : Sortie du ${roundLog.number} (${colorFr}) - DÉCLENCHEUR ATTEINT !`,
        {
          details: `${newState.config.consecutiveTrigger} fois ${colorFr} d'affilée observés. Prochain tour : mise sur ${colorFr === 'Rouge' ? 'NOIR' : 'ROUGE'}.`,
          bankroll: newState.bankroll,
          spinIndex: roundLog.spinIndex,
          data: { number: roundLog.number, color: roundLog.color, consecutiveCount: roundLog.consecutiveCount },
        }
      );
    } else {
      logger.log(
        'OBSERVE',
        `Tirage #${roundLog.spinIndex} : Sortie du ${roundLog.number} (${colorFr})`,
        {
          details: `Phase d'observation : ${newState.consecutiveCount} fois ${newState.consecutiveColor ? (newState.consecutiveColor === 'red' ? 'Rouge' : 'Noir') : 'aucune'} d'affilée (Objectif: ${newState.config.consecutiveTrigger}). Aucune mise engagée.`,
          bankroll: newState.bankroll,
          spinIndex: roundLog.spinIndex,
          data: { number: roundLog.number, color: roundLog.color, streak: newState.consecutiveCount },
        }
      );
    }
  } else if (roundLog.outcome === 'WIN') {
    logger.log(
      'WIN',
      `Tirage #${roundLog.spinIndex} : Sortie du ${roundLog.number} (${colorFr}) - GAIN (+${newState.config.baseBet} € net)`,
      {
        details: `Mise de ${roundLog.betAmount} € sur ${betColorFr} gagnante au palier ${roundLog.stepIndex}/${newState.config.maxSteps}. Solde : ${newState.bankroll} €. Compteurs d'observation remis à 0.`,
        bankroll: newState.bankroll,
        spinIndex: roundLog.spinIndex,
        data: { number: roundLog.number, color: roundLog.color, betAmount: roundLog.betAmount, step: roundLog.stepIndex, netProfit: roundLog.netProfitRound },
      }
    );
  } else if (roundLog.outcome === 'LOSS') {
    if (roundLog.cycleEvent === 'CRASH_STOP_LOSS') {
      logger.log(
        'STOP_LOSS',
        `Tirage #${roundLog.spinIndex} : Sortie du ${roundLog.number} (${colorFr}) - STOP-LOSS SÉQUENCE`,
        {
          details: `Plafond de 640 € atteint et perdu (Perte cycle: ${roundLog.cycleProfit} €). Solde restant : ${newState.bankroll} €. Compteurs d'observation remis à 0.`,
          bankroll: newState.bankroll,
          spinIndex: roundLog.spinIndex,
          data: { number: roundLog.number, color: roundLog.color, loss: roundLog.cycleProfit },
        }
      );
    } else {
      const nextBet = newState.config.betProgression[newState.currentStep - 1] || 0;
      logger.log(
        'LOSS',
        `Tirage #${roundLog.spinIndex} : Sortie du ${roundLog.number} (${colorFr}) - PERTE (Palier ${roundLog.stepIndex}/${newState.config.maxSteps})`,
        {
          details: `Mise de ${roundLog.betAmount} € sur ${betColorFr} perdue (-${roundLog.betAmount} €). Prochain tour : mise de ${nextBet} € sur ${betColorFr}.`,
          bankroll: newState.bankroll,
          spinIndex: roundLog.spinIndex,
          data: { number: roundLog.number, color: roundLog.color, lostBet: roundLog.betAmount, nextStep: newState.currentStep, nextBet },
        }
      );
    }
  } else if (roundLog.cycleEvent === 'CRASH_STOP_LOSS' && roundLog.outcome === 'SKIPPED') {
    logger.log(
      'STOP_LOSS',
      `Tirage #${roundLog.spinIndex} : Fonds insuffisants pour doubler`,
      {
        details: `Solde restant (${newState.bankroll} €) insuffisant pour engager le palier suivant (${roundLog.betAmount} €). Séquence clôturée en stop-loss. Compteurs remis à 0.`,
        bankroll: newState.bankroll,
        spinIndex: roundLog.spinIndex,
      }
    );
  }
}

