import React from 'react';
import { RouletteColor } from '../types/roulette';
import { getNumberColor } from '../constants/roulette';

interface RouletteTableProps {
  activeBetColor: RouletteColor | null;
  activeBetAmount: number;
  lastWinningNumber: number | null;
}

export const RouletteTable: React.FC<RouletteTableProps> = ({
  activeBetColor,
  activeBetAmount,
  lastWinningNumber,
}) => {
  // Grille standard de roulette : 3 rangées de 12 colonnes
  const rows = [
    [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
    [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
    [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
  ];

  return (
    <div className="bg-emerald-950/70 border-2 border-amber-600/50 rounded-3xl p-4 sm:p-5 shadow-2xl backdrop-blur-md relative overflow-hidden">
      {/* Texture de feutrine de casino */}
      <div className="absolute inset-0 bg-[radial-gradient(#065f46_1px,transparent_1px)] [background-size:16px_16px] opacity-30 pointer-events-none" />

      {/* Titre & Table Limit */}
      <div className="flex items-center justify-between text-xs text-amber-200/90 mb-3 border-b border-amber-600/30 pb-2">
        <span className="font-bold uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          Tapis Français / Européen
        </span>
        <span className="font-semibold text-slate-300">
          Chances Simples : 1:1 • Zéro Unique
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="min-w-[620px] select-none text-xs">
          {/* Grille principale : Zéro + Numéros 1-36 */}
          <div className="flex border-2 border-amber-500/60 rounded-t-xl overflow-hidden bg-emerald-900/40">
            {/* Case 0 (Zéro vert) */}
            <div
              className={`w-14 flex items-center justify-center font-black text-lg border-r-2 border-amber-500/60 transition ${
                lastWinningNumber === 0
                  ? 'bg-emerald-500 text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.8)]'
                  : 'bg-emerald-800/80 text-emerald-100 hover:bg-emerald-700/80'
              }`}
            >
              0
            </div>

            {/* 3 Rangées de 12 colonnes */}
            <div className="flex-1 flex flex-col divide-y-2 divide-amber-500/60">
              {rows.map((row, rowIdx) => (
                <div key={rowIdx} className="flex divide-x-2 divide-amber-500/60 h-10">
                  {row.map((num) => {
                    const col = getNumberColor(num);
                    const isWinner = lastWinningNumber === num;
                    return (
                      <div
                        key={num}
                        className={`flex-1 flex items-center justify-center font-black text-sm transition relative ${
                          isWinner
                            ? 'bg-amber-300 text-slate-950 shadow-[inset_0_0_15px_rgba(255,255,255,1)] ring-2 ring-white z-10'
                            : col === 'red'
                            ? 'bg-red-800/90 text-white hover:bg-red-700'
                            : 'bg-slate-950/90 text-slate-100 hover:bg-slate-900'
                        }`}
                      >
                        {num}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Douzaines (1-12, 13-24, 25-36) */}
          <div className="flex border-x-2 border-b-2 border-amber-500/60 text-amber-200/90 font-bold text-center bg-emerald-900/50">
            <div className="w-14 border-r-2 border-amber-500/60" />
            <div className="flex-1 py-1.5 border-r-2 border-amber-500/60">1ère 12 (1 - 12)</div>
            <div className="flex-1 py-1.5 border-r-2 border-amber-500/60">2ème 12 (13 - 24)</div>
            <div className="flex-1 py-1.5">3ème 12 (25 - 36)</div>
          </div>

          {/* Chances Simples (Manque, Pair, Rouge, Noir, Impair, Passe) */}
          <div className="flex border-x-2 border-b-2 border-amber-500/60 rounded-b-xl text-center font-bold text-xs bg-emerald-900/60 h-14">
            <div className="w-14 border-r-2 border-amber-500/60" />

            <div className="flex-1 flex items-center justify-center border-r-2 border-amber-500/60 text-slate-300">
              1 - 18 (Manque)
            </div>

            <div className="flex-1 flex items-center justify-center border-r-2 border-amber-500/60 text-slate-300">
              PAIR
            </div>

            {/* Case ROUGE (avec jetons si pari actif) */}
            <div
              className={`flex-1 flex items-center justify-center border-r-2 border-amber-500/60 relative cursor-default transition ${
                activeBetColor === 'red'
                  ? 'bg-red-700/80 ring-2 ring-amber-300 shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                  : 'bg-red-900/40 text-red-300'
              }`}
            >
              <div className="flex flex-col items-center">
                <span className="font-black tracking-wider text-white">ROUGE</span>
                {activeBetColor === 'red' && activeBetAmount > 0 && (
                  <div className="absolute -top-3 animate-bounce">
                    <div className="w-8 h-8 rounded-full bg-amber-400 border-2 border-white shadow-xl flex items-center justify-center font-black text-[11px] text-slate-950">
                      {activeBetAmount}€
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Case NOIR (avec jetons si pari actif) */}
            <div
              className={`flex-1 flex items-center justify-center border-r-2 border-amber-500/60 relative cursor-default transition ${
                activeBetColor === 'black'
                  ? 'bg-slate-800 ring-2 ring-amber-300 shadow-[0_0_20px_rgba(148,163,184,0.5)]'
                  : 'bg-slate-950/60 text-slate-300'
              }`}
            >
              <div className="flex flex-col items-center">
                <span className="font-black tracking-wider text-white">NOIR</span>
                {activeBetColor === 'black' && activeBetAmount > 0 && (
                  <div className="absolute -top-3 animate-bounce">
                    <div className="w-8 h-8 rounded-full bg-amber-400 border-2 border-white shadow-xl flex items-center justify-center font-black text-[11px] text-slate-950">
                      {activeBetAmount}€
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center border-r-2 border-amber-500/60 text-slate-300">
              IMPAIR
            </div>

            <div className="flex-1 flex items-center justify-center text-slate-300">
              19 - 36 (Passe)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
