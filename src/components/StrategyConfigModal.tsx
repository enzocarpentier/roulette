import React, { useState } from 'react';
import { StrategyConfig } from '../types/roulette';
import { DEFAULT_STRATEGY_CONFIG } from '../constants/roulette';
import { Settings, X, RotateCcw, Check } from 'lucide-react';

interface StrategyConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: StrategyConfig;
  onSave: (newConfig: StrategyConfig) => void;
}

export const StrategyConfigModal: React.FC<StrategyConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
}) => {
  const [initialBankroll, setInitialBankroll] = useState(config.initialBankroll);
  const [baseBet, setBaseBet] = useState(config.baseBet);
  const [consecutiveTrigger, setConsecutiveTrigger] = useState(config.consecutiveTrigger);
  const [maxSteps, setMaxSteps] = useState(config.maxSteps);
  const [zeroRule, setZeroRule] = useState<'loss' | 'partage'>(config.zeroRule);

  if (!isOpen) return null;

  // Recalcule la progression x2
  const computeProgression = (base: number, steps: number) => {
    const list: number[] = [];
    let cur = base;
    for (let i = 0; i < steps; i++) {
      list.push(cur);
      cur *= 2;
    }
    return list;
  };

  const handleApply = () => {
    const newProgression = computeProgression(baseBet, maxSteps);
    onSave({
      initialBankroll,
      baseBet,
      consecutiveTrigger,
      maxSteps,
      betProgression: newProgression,
      zeroRule,
    });
    onClose();
  };

  const handleResetDefaults = () => {
    setInitialBankroll(DEFAULT_STRATEGY_CONFIG.initialBankroll);
    setBaseBet(DEFAULT_STRATEGY_CONFIG.baseBet);
    setConsecutiveTrigger(DEFAULT_STRATEGY_CONFIG.consecutiveTrigger);
    setMaxSteps(DEFAULT_STRATEGY_CONFIG.maxSteps);
    setZeroRule(DEFAULT_STRATEGY_CONFIG.zeroRule);
  };

  const progressionPreview = computeProgression(baseBet, maxSteps);
  const totalMaxRisk = progressionPreview.reduce((acc, v) => acc + v, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Paramètres de la Stratégie</h2>
              <p className="text-xs text-slate-400">Personnaliser les règles et les seuils</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Capital Initial (Bankroll)
            </label>
            <input
              type="number"
              value={initialBankroll}
              onChange={(e) => setInitialBankroll(Math.max(10, Number(e.target.value)))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Mise de base (Tour 1)
              </label>
              <input
                type="number"
                value={baseBet}
                onChange={(e) => setBaseBet(Math.max(1, Number(e.target.value)))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Déclencheur (Trigger)
              </label>
              <select
                value={consecutiveTrigger}
                onChange={(e) => setConsecutiveTrigger(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value={1}>1 couleur (immédiat)</option>
                <option value={2}>2 consécutifs (Cahier des charges)</option>
                <option value={3}>3 consécutifs</option>
                <option value={4}>4 consécutifs</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Nombre de paliers max
              </label>
              <select
                value={maxSteps}
                onChange={(e) => setMaxSteps(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value={5}>5 tours (max 80 € / perte: 155 €)</option>
                <option value={6}>6 tours (max 160 € / perte: 315 €)</option>
                <option value={7}>7 tours (max 320 € / perte: 635 €)</option>
                <option value={8}>8 tours (max 640 € / perte: 1 275 €)</option>
                <option value={9}>9 tours (max 1 280 € / perte: 2 555 €)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Règle du Zéro (0 vert)
              </label>
              <select
                value={zeroRule}
                onChange={(e) => setZeroRule(e.target.value as 'loss' | 'partage')}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="loss">Perte totale (Casino standard)</option>
                <option value="partage">Partage (50% remboursé)</option>
              </select>
            </div>
          </div>

          {/* Résumé de la suite */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="text-xs text-slate-400 mb-1">Progression des mises :</div>
            <div className="text-xs font-mono font-bold text-amber-300">
              {progressionPreview.join('€ ➔ ')}€
            </div>
            <div className="mt-2 text-[11px] text-red-400 font-semibold">
              Perte maximale d'une séquence arrêtée : {totalMaxRisk.toLocaleString()} €
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Par Défaut
          </button>

          <button
            onClick={handleApply}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 transition"
          >
            <Check className="w-4 h-4" />
            Enregistrer & Appliquer
          </button>
        </div>
      </div>
    </div>
  );
};
