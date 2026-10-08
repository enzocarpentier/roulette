import React, { useState } from 'react';
import { Play, Pause, RotateCcw, FastForward, Sliders, Dices } from 'lucide-react';
import { EUROPEAN_WHEEL_ORDER, getNumberColor } from '../constants/roulette';

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
  const [showForcedModal, setShowForcedModal] = useState<boolean>(false);

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            Contrôles de Simulation
          </h3>
          <p className="text-xs text-slate-400">
            Actionnez la roulette manuellement, en lecture continue ou en simulation par lots
          </p>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition border border-slate-700"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Réinitialiser
        </button>
      </div>

      {/* Rangée 1 : Boutons d'action immédiate */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Lancer 1 tour */}
        <button
          onClick={() => onSpinOne()}
          disabled={isPlaying || isBroke}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-lg shadow-emerald-900/20 transition active:scale-95"
        >
          <Play className="w-4 h-4" />
          Tirer 1 Tour
        </button>

        {/* Lecture Automatique */}
        <button
          onClick={onTogglePlay}
          disabled={isBroke}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition shadow-lg active:scale-95 ${
            isPlaying
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
          }`}
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4 animate-pulse" />
              Pause Auto
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Mode Auto Continu
            </>
          )}
        </button>

        {/* Forcer un numéro (mode testeur) */}
        <button
          onClick={() => setShowForcedModal(!showForcedModal)}
          disabled={isPlaying || isBroke}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 font-bold text-sm border border-slate-700 transition"
        >
          <Dices className="w-4 h-4 text-purple-400" />
          Forcer un Numéro (Test)
        </button>
      </div>

      {/* Sélecteur de test forcé repliable */}
      {showForcedModal && (
        <div className="mt-3 p-4 bg-slate-950/80 rounded-xl border border-purple-500/30">
          <div className="text-xs font-semibold text-purple-300 mb-2">
            Tester un scénario sur-mesure (ex: 2 Rouges consécutifs pour forcer le déclencheur) :
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
            {EUROPEAN_WHEEL_ORDER.slice().sort((a, b) => a - b).map((num) => {
              const col = getNumberColor(num);
              return (
                <button
                  key={num}
                  onClick={() => {
                    onSpinOne(num);
                    setShowForcedModal(false);
                  }}
                  className={`w-7 h-7 rounded text-xs font-bold transition flex items-center justify-center ${
                    col === 'red'
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : col === 'black'
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Rangée 2 : Vitesse & Lots rapides */}
      <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Vitesse */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium">Vitesse Auto :</span>
          <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800">
            {[
              { label: 'x1 (1s)', val: 1000 },
              { label: 'x3 (300ms)', val: 300 },
              { label: 'x10 (80ms)', val: 80 },
              { label: 'Max (20ms)', val: 20 },
            ].map((spd) => (
              <button
                key={spd.val}
                onClick={() => onChangeSpeed(spd.val)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  playSpeed === spd.val
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd.label}
              </button>
            ))}
          </div>
        </div>

        {/* Accélération par lots */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
            <FastForward className="w-3.5 h-3.5 text-amber-400" />
            Accélérer :
          </span>
          {[50, 200, 1000, 5000].map((batch) => (
            <button
              key={batch}
              onClick={() => onSpinBatch(batch)}
              disabled={isPlaying || isBroke}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 transition"
            >
              +{batch.toLocaleString()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
