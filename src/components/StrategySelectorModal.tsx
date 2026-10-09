import React, { useState } from 'react';
import {
  STRATEGY_DEFINITIONS,
  StrategyDefinition,
  StrategyKey,
} from '../constants/strategies';
import {
  X,
  ChevronRight,
  Sparkles,
  Check,
  Scale,
  Lightbulb,
} from 'lucide-react';

interface StrategySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStrategyId: StrategyKey;
  onSelectStrategy: (def: StrategyDefinition) => void;
  isInitialOnboarding?: boolean;
}

export const StrategySelectorModal: React.FC<StrategySelectorModalProps> = ({
  isOpen,
  onClose,
  currentStrategyId,
  onSelectStrategy,
  isInitialOnboarding = false,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'RECOMMENDED' | 'SAFE' | 'COVERAGE' | 'PROGRESSION'>('ALL');
  const [expandedId, setExpandedId] = useState<StrategyKey | null>(null);

  if (!isOpen) return null;

  const strategiesList = Object.values(STRATEGY_DEFINITIONS);

  const filteredStrategies = strategiesList.filter((s) => {
    if (filter === 'RECOMMENDED') return s.id === 'martingale_observation' || s.id === 'paroli';
    if (filter === 'SAFE') return s.riskLevel === 'FAIBLE' || s.riskLevel === 'MODÉRÉ';
    if (filter === 'COVERAGE') return s.id === 'romanosky' || s.id === 'james_bond';
    if (filter === 'PROGRESSION') return s.id === 'martingale_observation' || s.id === 'dalembert' || s.id === 'fibonacci';
    return true;
  });

  const getThemeColors = (theme: StrategyDefinition['badgeTheme']) => {
    switch (theme) {
      case 'purple':
        return {
          border: 'border-purple-500/40 hover:border-purple-500',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          btn: 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/30',
          accent: 'text-purple-400',
        };
      case 'emerald':
        return {
          border: 'border-emerald-500/40 hover:border-emerald-500',
          badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          btn: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30',
          accent: 'text-emerald-400',
        };
      case 'blue':
        return {
          border: 'border-blue-500/40 hover:border-blue-500',
          badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
          btn: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/30',
          accent: 'text-blue-400',
        };
      case 'amber':
        return {
          border: 'border-amber-500/40 hover:border-amber-500',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          btn: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/30',
          accent: 'text-amber-400',
        };
      case 'indigo':
        return {
          border: 'border-indigo-500/40 hover:border-indigo-500',
          badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          btn: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/30',
          accent: 'text-indigo-400',
        };
      case 'rose':
        return {
          border: 'border-rose-500/40 hover:border-rose-500',
          badge: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
          btn: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30',
          accent: 'text-rose-400',
        };
    }
  };

  const getRiskMeter = (score: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full ${
              i <= score
                ? score >= 4
                  ? 'bg-red-400'
                  : score >= 3
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
                : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/80">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-2xl">
              🎯
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white">
                  Hub des Stratégies de Roulette
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> 6 Systèmes
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Sélectionnez votre stratégie avant de tester le simulateur en conditions réelles
              </p>
            </div>
          </div>

          {!isInitialOnboarding && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-semibold mr-1">Filtrer par type :</span>
            {[
              { id: 'ALL', label: 'Toutes (6)' },
              { id: 'RECOMMENDED', label: '⭐ Recommandées' },
              { id: 'SAFE', label: '🛡️ Capital Protégé' },
              { id: 'COVERAGE', label: '🎯 Haute Couverture' },
              { id: 'PROGRESSION', label: '📈 Progressions' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filter === f.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 hidden sm:block">
            Cliquez sur une carte pour configurer la roulette
          </div>
        </div>

        {/* Strategies Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/70">
          {filteredStrategies.map((strat) => {
            const theme = getThemeColors(strat.badgeTheme);
            const isCurrent = strat.id === currentStrategyId;
            const isExpanded = expandedId === strat.id;

            return (
              <div
                key={strat.id}
                className={`flex flex-col justify-between p-5 rounded-3xl bg-slate-900 border transition-all ${
                  isCurrent
                    ? 'border-emerald-500/80 bg-slate-900/95 ring-1 ring-emerald-500/40 shadow-xl shadow-emerald-950/40'
                    : `border-slate-800 hover:border-slate-700 bg-slate-900/80`
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${theme.badge}`}
                        >
                          {strat.badge}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-black text-white leading-tight">
                        {strat.name}
                      </h3>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-medium mb-3 leading-relaxed">
                    {strat.tagline}
                  </p>

                  {/* Explication Simple & Pédagogique */}
                  <div className="mb-4 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-950/40 border border-amber-500/25">
                    <div className="flex items-start gap-2.5">
                      <div className="p-1 rounded-lg bg-amber-500/20 text-amber-300 shrink-0 mt-0.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
                      </div>
                      <div className="text-xs leading-relaxed text-slate-200">
                        <span className="font-black text-amber-300 block mb-1 text-[11px] uppercase tracking-wider">
                          💡 En clair (Comment ça marche) :
                        </span>
                        <p className="text-slate-300 leading-normal">
                          {strat.simpleExplanation}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-xs mb-4">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-1">
                        Niveau Risque
                      </span>
                      <div className="flex items-center gap-1.5">
                        {getRiskMeter(strat.riskScore)}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                        Taux Séance (~2h)
                      </span>
                      <span className="font-black text-emerald-400 text-xs">
                        {strat.shortTermWinRate}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 block mb-0.5">
                        Capital Idéal
                      </span>
                      <span className="font-black text-amber-300 text-xs">
                        {strat.recommendedBankroll.toLocaleString()} €
                      </span>
                    </div>
                  </div>

                  {/* Rules Preview or Expanded */}
                  {isExpanded ? (
                    <div className="space-y-3 mb-4 text-xs animate-in fade-in duration-200">
                      <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
                        <span className="font-bold text-slate-300 block mb-2">
                          📋 Règles du système :
                        </span>
                        <ul className="space-y-1.5 text-slate-400">
                          {strat.rules.map((r, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-emerald-400 font-bold">•</span>
                              <span>{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
                          <strong className="block text-emerald-400 mb-1">Points forts :</strong>
                          {strat.pros.join(' • ')}
                        </div>
                        <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300">
                          <strong className="block text-red-400 mb-1">Inconvénients :</strong>
                          {strat.cons.join(' • ')}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                      {strat.description}
                    </p>
                  )}
                </div>

                {/* Card Bottom Actions */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : strat.id)}
                    className="text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer underline underline-offset-2"
                  >
                    {isExpanded ? 'Réduire les détails' : 'Voir les règles complètes'}
                  </button>

                  <button
                    onClick={() => {
                      onSelectStrategy(strat);
                      onClose();
                    }}
                    className={`py-2 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md ${
                      isCurrent
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
                        : `${theme.btn}`
                    }`}
                  >
                    {isCurrent ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Stratégie Active</span>
                      </>
                    ) : (
                      <>
                        <span>Lancer ce Système</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Educational Note */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Vérité mathématique :</strong> La roulette européenne a un avantage fixe de 2,70% pour le casino. Les stratégies modifient la façon d'encaisser les gains et de gérer le risque, mais n'éliminent pas le hasard.
            </span>
          </div>

          {isInitialOnboarding && (
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
            >
              Passer directement au simulateur ➔
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
