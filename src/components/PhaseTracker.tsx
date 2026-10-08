import React from 'react';
import { EngineState } from '../utils/engine';
import { Eye, Zap, ShieldAlert, Award } from 'lucide-react';

interface PhaseTrackerProps {
  state: EngineState;
}

export const PhaseTracker: React.FC<PhaseTrackerProps> = ({ state }) => {
  const { phase, consecutiveColor, consecutiveCount, betColor, currentStep, config } = state;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md">
      {/* En-tête de phase */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          {phase === 'OBSERVATION' ? (
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Eye className="w-5 h-5 animate-pulse" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5 animate-bounce" />
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Phase en cours
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  phase === 'OBSERVATION'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                {phase === 'OBSERVATION' ? 'OBSERVATION NEUTRE' : 'MISES ÉVOLUTIVES (MARTINGALE)'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-100 mt-0.5">
              {phase === 'OBSERVATION'
                ? 'Analyse sans engagement de jetons'
                : `Attaque en cours sur le ${betColor === 'red' ? 'Rouge' : 'Noir'} (Tour ${currentStep}/8)`}
            </h3>
          </div>
        </div>

        {/* Badge d'action immédiate */}
        <div className="text-right">
          {phase === 'OBSERVATION' ? (
            <div className="text-xs text-slate-400">
              Condition :{' '}
              <span className="font-semibold text-slate-200">
                {config.consecutiveTrigger} fois la même couleur
              </span>
            </div>
          ) : (
            <div className="text-xs text-amber-400 font-semibold flex items-center gap-1.5 justify-end">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Mise active : {config.betProgression[currentStep - 1]} €
            </div>
          )}
        </div>
      </div>

      {/* Détail selon la phase */}
      {phase === 'OBSERVATION' ? (
        <div className="mt-4 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Progression du déclencheur (Trigger)</span>
            <span className="font-medium text-slate-200">
              {consecutiveColor ? (
                <>
                  Série :{' '}
                  <span
                    className={
                      consecutiveColor === 'red' ? 'text-red-400 font-bold' : 'text-slate-300 font-bold'
                    }
                  >
                    {consecutiveColor === 'red' ? 'Rouge' : 'Noir'}
                  </span>{' '}
                  ({consecutiveCount} / {config.consecutiveTrigger})
                </>
              ) : (
                'En attente du premier tirage'
              )}
            </span>
          </div>

          {/* Jauge visuelle de déclencheur */}
          <div className="grid grid-cols-2 gap-2">
            <div
              className={`p-3 rounded-xl border text-center transition-all ${
                consecutiveColor === 'red' && consecutiveCount >= 1
                  ? 'bg-red-950/40 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                  : 'bg-slate-950/40 border-slate-800/80 opacity-60'
              }`}
            >
              <div className="text-xs text-slate-400">1er tour identique</div>
              <div className="text-sm font-bold text-slate-200 mt-1">
                {consecutiveCount >= 1 && consecutiveColor ? (
                  <span className={consecutiveColor === 'red' ? 'text-red-400' : 'text-slate-200'}>
                    ✓ 1 {consecutiveColor === 'red' ? 'Rouge' : 'Noir'}
                  </span>
                ) : (
                  '...'
                )}
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border text-center transition-all ${
                consecutiveCount >= 2
                  ? 'bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'bg-slate-950/40 border-slate-800/80 opacity-60'
              }`}
            >
              <div className="text-xs text-slate-400">2ème tour identique (Trigger)</div>
              <div className="text-sm font-bold text-slate-200 mt-1">
                {consecutiveCount >= 2 ? (
                  <span className="text-emerald-400 font-black animate-pulse">
                    ⚡ DÉCLENCHÉ ! Mise opposée
                  </span>
                ) : (
                  'En attente'
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Échelle des 8 paliers de mises */
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold text-slate-300">Échelle de progression (Max 8 paliers) :</span>
            <span className="text-amber-400">Plafond strict : 640 € (Total risque: 1 275 €)</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {config.betProgression.map((amount, idx) => {
              const stepNumber = idx + 1;
              const isActive = currentStep === stepNumber;
              const isPast = currentStep > stepNumber;
              const isCeiling = stepNumber === config.maxSteps;

              return (
                <div
                  key={stepNumber}
                  className={`relative p-2.5 rounded-xl border text-center transition-all duration-300 ${
                    isActive
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-2 ring-amber-400/50 scale-105 z-10'
                      : isPast
                      ? 'bg-red-950/30 border-red-900/50 text-red-400/60'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                  }`}
                >
                  {isCeiling && (
                    <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-1 py-0.2 text-[9px] font-black uppercase tracking-tight bg-red-600 text-white rounded-full">
                      Plafond
                    </div>
                  )}
                  <div className="text-[10px] uppercase font-semibold text-slate-400">
                    T{stepNumber}
                  </div>
                  <div
                    className={`text-sm font-black mt-0.5 ${
                      isActive ? 'text-amber-300 text-base' : ''
                    }`}
                  >
                    {amount} €
                  </div>
                </div>
              );
            })}
          </div>

          {/* Règles de clôture du cycle */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-900/40 text-emerald-300 flex items-center gap-2">
              <Award className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>
                <strong>Gain au tour {currentStep} :</strong> +{config.baseBet} € net encaissés ➔ Retour
                Observation.
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-red-950/30 border border-red-900/40 text-red-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-400" />
              <span>
                <strong>Perte du tour 8 (640€) :</strong> Stop-Loss strict ➔ Perte de 1 275 € actée.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
