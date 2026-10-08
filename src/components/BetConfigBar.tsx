import React from 'react';
import { Coins, Wallet, Eye } from 'lucide-react';
import { computeProgression } from '../constants/roulette';

interface BetConfigBarProps {
  baseBet: number;
  initialBankroll: number;
  consecutiveTrigger: number;
  onChangeBaseBet: (bet: number) => void;
  onChangeBankroll: (bankroll: number) => void;
  onChangeTrigger: (trigger: number) => void;
}

export const BetConfigBar: React.FC<BetConfigBarProps> = ({
  baseBet,
  initialBankroll,
  consecutiveTrigger,
  onChangeBaseBet,
  onChangeBankroll,
  onChangeTrigger,
}) => {
  const progression = computeProgression(baseBet);
  const maxSequenceLoss = progression.reduce((a, b) => a + b, 0);

  const quickBets = [1, 2, 5, 10, 20];
  const quickTriggers = [1, 2, 3, 4, 5];
  const quickBankrolls = [500, 1000, 1500, 3000];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
        {/* 1. Sélection de la mise de départ */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Coins className="w-4 h-4 text-amber-400" />
            <span>1. Mise de Départ :</span>
            <span className="text-amber-300 font-black text-sm">{baseBet} €</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {quickBets.map((amount) => (
              <button
                key={amount}
                onClick={() => onChangeBaseBet(amount)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  baseBet === amount
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-105'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {amount} €
              </button>
            ))}

            {/* Champ personnalisé */}
            <div className="flex items-center gap-1 ml-1">
              <input
                type="number"
                min="1"
                max="500"
                value={baseBet}
                onChange={(e) => onChangeBaseBet(Math.max(1, Number(e.target.value) || 1))}
                className="w-14 bg-slate-950 border border-slate-700 rounded-xl px-2 py-1 text-xs text-center font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                placeholder="Autre"
              />
              <span className="text-xs text-slate-400">€</span>
            </div>
          </div>
        </div>

        {/* 2. Sélection du déclencheur d'observation */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Eye className="w-4 h-4 text-blue-400" />
            <span>2. Déclencheur (Attendre) :</span>
            <span className="text-blue-300 font-black text-sm">
              {consecutiveTrigger} {consecutiveTrigger > 1 ? 'fois' : 'fois'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {quickTriggers.map((times) => (
              <button
                key={times}
                onClick={() => onChangeTrigger(times)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                  consecutiveTrigger === times
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20 scale-105'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {times} {times === 2 ? '(défaut)' : 'fois'}
              </button>
            ))}

            {/* Champ personnalisé */}
            <div className="flex items-center gap-1 ml-1">
              <input
                type="number"
                min="1"
                max="20"
                value={consecutiveTrigger}
                onChange={(e) => onChangeTrigger(Math.max(1, Number(e.target.value) || 1))}
                className="w-12 bg-slate-950 border border-slate-700 rounded-xl px-2 py-1 text-xs text-center font-bold text-blue-300 focus:outline-none focus:border-blue-400"
              />
              <span className="text-xs text-slate-400">fois</span>
            </div>
          </div>
        </div>

        {/* 3. Sélection du capital de départ */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>3. Capital de Départ :</span>
            <span className="text-emerald-300 font-black text-sm">
              {initialBankroll.toLocaleString()} €
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {quickBankrolls.map((amount) => (
              <button
                key={amount}
                onClick={() => onChangeBankroll(amount)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  initialBankroll === amount
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 scale-105'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                {amount.toLocaleString()} €
              </button>
            ))}

            {/* Champ personnalisé */}
            <div className="flex items-center gap-1 ml-1">
              <input
                type="number"
                min="10"
                step="100"
                value={initialBankroll}
                onChange={(e) =>
                  onChangeBankroll(Math.max(10, Number(e.target.value) || 100))
                }
                className="w-16 bg-slate-950 border border-slate-700 rounded-xl px-2 py-1 text-xs text-center font-bold text-emerald-300 focus:outline-none focus:border-emerald-400"
              />
              <span className="text-xs text-slate-400">€</span>
            </div>
          </div>
        </div>
      </div>

      {/* Résumé clair des règles appliquées à cette mise */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div>
          Stratégie : Attendre{' '}
          <strong className="text-blue-300">
            {consecutiveTrigger} fois consécutives
          </strong>{' '}
          la même couleur ➔ Parier sur l'opposée avec progression x2 (
          <strong className="text-slate-200">{progression.length} paliers</strong> jusqu'à 640 €) :{' '}
          <strong className="text-slate-200">{progression.join('€ ➔ ')}€</strong>
        </div>
        <div>
          Perte max d'une série :{' '}
          <strong className="text-red-400">-{maxSequenceLoss.toLocaleString()} €</strong> • Gain net :{' '}
          <strong className="text-emerald-400">+{baseBet} €</strong>
        </div>
      </div>
    </div>
  );
};
