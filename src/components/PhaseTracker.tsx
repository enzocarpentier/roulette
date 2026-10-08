import React from 'react';
import { EngineState } from '../utils/engine';
import { Eye, Zap, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface PhaseTrackerProps {
  state: EngineState;
}

export const PhaseTracker: React.FC<PhaseTrackerProps> = ({ state }) => {
  const { phase, consecutiveColor, consecutiveCount, betColor, currentStep, config } = state;
  const currentBetAmount =
    phase === 'BETTING' ? config.betProgression[currentStep - 1] || config.baseBet : 0;

  const totalSequenceLoss = config.betProgression.reduce((a, b) => a + b, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
      {/* 1. Grand bandeau de statut compréhensible en 1 seconde */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          phase === 'OBSERVATION'
            ? 'bg-blue-950/30 border-blue-500/40'
            : 'bg-amber-950/30 border-amber-500/50 shadow-[0_0_25px_rgba(245,158,11,0.15)]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              phase === 'OBSERVATION'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
            }`}
          >
            {phase === 'OBSERVATION' ? <Eye className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  phase === 'OBSERVATION'
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'bg-amber-500/20 text-amber-300'
                }`}
              >
                {phase === 'OBSERVATION' ? 'Phase 1 : Observation' : 'Phase 2 : Mise Active'}
              </span>
              <span className="text-xs text-slate-400">
                {phase === 'OBSERVATION' ? '(0 € misé)' : `(Palier ${currentStep} sur 8)`}
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-white mt-1">
              {phase === 'OBSERVATION' ? (
                consecutiveColor ? (
                  <>
                    En attente :{' '}
                    <span
                      className={consecutiveColor === 'red' ? 'text-red-400' : 'text-slate-200'}
                    >
                      1 {consecutiveColor === 'red' ? 'Rouge' : 'Noir'}
                    </span>{' '}
                    détecté. Encore 1 pour parier !
                  </>
                ) : (
                  'Le système observe les tirages sans miser'
                )
              ) : (
                <>
                  Pari en cours :{' '}
                  <span className="text-amber-300 font-black">{currentBetAmount} €</span> sur le{' '}
                  <span
                    className={
                      betColor === 'red'
                        ? 'text-red-400 uppercase font-black'
                        : 'text-slate-200 uppercase font-black'
                    }
                  >
                    {betColor === 'red' ? 'Rouge' : 'Noir'}
                  </span>
                </>
              )}
            </h3>
          </div>
        </div>
      </div>

      {/* 2. Ce qui se passe selon la phase */}
      {phase === 'OBSERVATION' ? (
        <div className="mt-4 p-4 bg-slate-950/50 rounded-2xl border border-slate-800/80">
          <div className="text-xs font-semibold text-slate-300 mb-2 flex flex-wrap items-center justify-between gap-1">
            <span>Règle de déclenchement :</span>
            <span className="text-blue-300 font-bold">
              Attendre {config.consecutiveTrigger} fois la même couleur (Progression : {consecutiveCount} / {config.consecutiveTrigger})
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {Array.from({ length: config.consecutiveTrigger }, (_, i) => i + 1).map((step) => {
              const isFilled = consecutiveCount >= step && consecutiveColor !== null;
              const isTriggerStep = step === config.consecutiveTrigger;

              return (
                <div
                  key={step}
                  className={`flex-1 min-w-[80px] p-2.5 rounded-xl border text-center transition ${
                    isFilled && isTriggerStep
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400 font-bold shadow-lg shadow-emerald-900/20'
                      : isFilled
                      ? 'bg-slate-900 border-slate-600'
                      : 'bg-slate-950 border-slate-800 opacity-50'
                  }`}
                >
                  <div className="text-[10px] text-slate-400 font-medium">
                    {isTriggerStep ? `${step}ème (Trigger)` : `${step}ème tirage`}
                  </div>
                  <div className="text-xs font-bold mt-1">
                    {isFilled ? (
                      isTriggerStep ? (
                        '⚡ DÉCLENCHÉ'
                      ) : (
                        <span className={consecutiveColor === 'red' ? 'text-red-400' : 'text-slate-200'}>
                          ✓ {consecutiveColor === 'red' ? 'Rouge' : 'Noir'}
                        </span>
                      )
                    ) : (
                      '...'
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Échelle des paliers jusqu'au plafond de 640 € */
        <div className="mt-4 p-4 bg-slate-950/50 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2.5">
            <span className="font-semibold text-slate-300">
              Progression x2 ({config.betProgression.length} paliers jusqu'au plafond) :
            </span>
            <span className="text-red-400 font-medium">
              Plafond max : {config.betProgression[config.betProgression.length - 1]} € (Perte totale: {totalSequenceLoss} €)
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {config.betProgression.map((amount: number, idx: number) => {
              const stepNum = idx + 1;
              const isActive = currentStep === stepNum;
              const isPast = currentStep > stepNum;
              const isCeiling = idx === config.betProgression.length - 1;

              return (
                <div
                  key={stepNum}
                  className={`flex-1 min-w-[50px] p-2 rounded-xl border text-center transition duration-200 relative ${
                    isActive
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-400/50 scale-105 z-10 shadow-lg'
                      : isPast
                      ? 'bg-red-950/30 border-red-900/40 text-red-400/60'
                      : 'bg-slate-900/60 border-slate-800 text-slate-500'
                  }`}
                >
                  {isCeiling && (
                    <div className="text-[8px] font-black uppercase text-red-400 tracking-tighter">
                      Plafond
                    </div>
                  )}
                  <div className="text-[10px] uppercase font-bold text-slate-400">T{stepNum}</div>
                  <div className={`text-xs sm:text-sm font-black mt-0.5 ${isActive ? 'text-amber-300 font-black' : ''}`}>
                    {amount}€
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Si victoire : +{config.baseBet} € net encaissés ➔ Retour à l'observation
            </div>
            <div className="flex items-center gap-1.5 text-red-400 font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              Si échec au dernier tour ({config.betProgression[config.betProgression.length - 1]} €) : Arrêt strict (-{totalSequenceLoss} €)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
