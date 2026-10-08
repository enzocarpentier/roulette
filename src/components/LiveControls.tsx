import React from 'react';
import { Play, Pause, RotateCcw, FastForward, Dices } from 'lucide-react';

interface LiveControlsProps {
  onSpinOne: (forcedNum?: number) => void;
  onSpinBatch: (count: number) => void;
  onReset: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  playSpeed: number;
  onChangeSpeed: (speed: number) => void;
  isBroke: boolean;
}

export const LiveControls: React.FC<LiveControlsProps> = ({
  onSpinOne,
  onSpinBatch,
  onReset,
  isPlaying,
  onTogglePlay,
  playSpeed,
  onChangeSpeed,
  isBroke,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Dices className="w-4 h-4 text-emerald-400" />
          Commandes de Jeu
        </h3>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition"
          title="Remettre les compteurs à zéro"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Réinitialiser
        </button>
      </div>

      {/* Boutons d'action principaux */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Bouton Tirer 1 Tour */}
        <button
          onClick={() => onSpinOne()}
          disabled={isPlaying || isBroke}
          className="flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-black text-base shadow-lg shadow-emerald-900/30 transition active:scale-95 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current" />
          Tirer 1 Tour
        </button>

        {/* Bouton Mode Auto */}
        <button
          onClick={onTogglePlay}
          disabled={isBroke}
          className={`flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl font-black text-base transition shadow-lg active:scale-95 cursor-pointer ${
            isPlaying
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-5 h-5 fill-current animate-pulse" />
              Mettre en Pause
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              Lancer en Continu (Auto)
            </>
          )}
        </button>
      </div>

      {/* Vitesse et Lots rapides */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        {/* Vitesse */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Vitesse :</span>
          <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            {[
              { label: 'Normale (1s)', val: 1000 },
              { label: 'Rapide (300ms)', val: 300 },
              { label: 'Ultra (50ms)', val: 50 },
            ].map((spd) => (
              <button
                key={spd.val}
                onClick={() => onChangeSpeed(spd.val)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  playSpeed === spd.val
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lots rapides */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mr-1">
            <FastForward className="w-3.5 h-3.5 text-amber-400" />
            Simuler :
          </span>
          {[50, 200, 1000].map((batch) => (
            <button
              key={batch}
              onClick={() => onSpinBatch(batch)}
              disabled={isPlaying || isBroke}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-bold border border-slate-700 transition"
            >
              +{batch} tours
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
