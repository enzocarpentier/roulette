import React, { useState } from 'react';
import { StrategyConfig, MonteCarloSummary, MonteCarloRun } from '../types/roulette';
import { runMonteCarloSimulation } from '../utils/engine';
import { computeProgression } from '../constants/roulette';
import {
  Play,
  X,
  ShieldCheck,
  Skull,
  DollarSign,
  Activity,
  AlertTriangle,
  Flame,
  Coins,
  Eye,
  Wallet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface MonteCarloModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: StrategyConfig;
}

export const MonteCarloModal: React.FC<MonteCarloModalProps> = ({ isOpen, onClose, config }) => {
  // Paramètres de volume poussés à l'extrême
  const [runsCount, setRunsCount] = useState<number>(1000);
  const [spinsPerRun, setSpinsPerRun] = useState<number>(1000);

  // Paramètres de stratégie personnalisables dans le stress-test
  const [baseBet, setBaseBet] = useState<number>(config.baseBet);
  const [consecutiveTrigger, setConsecutiveTrigger] = useState<number>(config.consecutiveTrigger);
  const [initialBankroll, setInitialBankroll] = useState<number>(config.initialBankroll);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<{ summary: MonteCarloSummary; runs: MonteCarloRun[] } | null>(
    null
  );

  if (!isOpen) return null;

  const handleRunSimulation = () => {
    setIsRunning(true);
    setTimeout(() => {
      // Calculer la progression jusqu'au plafond de 640€
      const progression = computeProgression(baseBet);
      const testConfig: StrategyConfig = {
        ...config,
        baseBet,
        consecutiveTrigger,
        initialBankroll,
        maxSteps: progression.length,
        betProgression: progression,
      };

      const simResult = runMonteCarloSimulation(testConfig, runsCount, spinsPerRun);
      setResult(simResult);
      setIsRunning(false);
    }, 40);
  };

  // Histogramme dynamique adapté au capital
  const getHistogramData = () => {
    if (!result) return [];
    const b = initialBankroll;
    const buckets: Record<string, number> = {
      'Ruine totale (0€)': 0,
      [`Perte forte (<-${Math.round(b * 0.5)}€)`]: 0,
      'Légère perte': 0,
      'Petit gain (+1 à +200€)': 0,
      'Bon gain (+200 à +1000€)': 0,
      'Jackpot (>+1000€)': 0,
    };

    result.runs.forEach((r) => {
      if (r.finalBankroll <= 0 || r.isBroke) {
        buckets['Ruine totale (0€)']++;
      } else if (r.netProfit <= -Math.round(b * 0.5)) {
        buckets[`Perte forte (<-${Math.round(b * 0.5)}€)`]++;
      } else if (r.netProfit < 0) {
        buckets['Légère perte']++;
      } else if (r.netProfit <= 200) {
        buckets['Petit gain (+1 à +200€)']++;
      } else if (r.netProfit <= 1000) {
        buckets['Bon gain (+200 à +1000€)']++;
      } else {
        buckets['Jackpot (>+1000€)']++;
      }
    });

    return Object.entries(buckets).map(([range, count]) => ({
      range,
      count,
    }));
  };

  const progressionPreview = computeProgression(baseBet);
  const maxLossSequence = progressionPreview.reduce((a, b) => a + b, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Stress-Test Monte Carlo Extrême</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Jusqu'à 10 000 Sessions
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Simulez des cohortes massives de joueurs pour tester la résistance mathématique du système
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. PARAMÈTRES POUSSÉS À L'EXTRÊME */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-2">
            <Flame className="w-4 h-4 text-purple-400" />
            Paramètres du Test & Stratégie
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Volume Joueurs */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Nombre de Joueurs
              </label>
              <select
                value={runsCount}
                onChange={(e) => setRunsCount(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
              >
                <option value={100}>100 Joueurs</option>
                <option value={500}>500 Joueurs</option>
                <option value={1000}>1 000 Joueurs</option>
                <option value={2500}>2 500 Joueurs</option>
                <option value={5000}>5 000 Joueurs</option>
                <option value={10000}>10 000 Joueurs (Extrême)</option>
              </select>
            </div>

            {/* Tirages par Session */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Tours par Session
              </label>
              <select
                value={spinsPerRun}
                onChange={(e) => setSpinsPerRun(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
              >
                <option value={200}>200 Tours (~2h)</option>
                <option value={500}>500 Tours (~5h)</option>
                <option value={1000}>1 000 Tours (~10h)</option>
                <option value={2500}>2 500 Tours (~25h)</option>
                <option value={5000}>5 000 Tours (~50h)</option>
                <option value={10000}>10 000 Tours (~100h)</option>
              </select>
            </div>

            {/* Somme de Mise de Départ */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Coins className="w-3 h-3 text-amber-400" />
                Mise de Départ
              </label>
              <select
                value={baseBet}
                onChange={(e) => setBaseBet(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-amber-300 focus:outline-none focus:border-amber-500"
              >
                <option value={1}>1 €</option>
                <option value={2}>2 €</option>
                <option value={5}>5 € (défaut)</option>
                <option value={10}>10 €</option>
                <option value={20}>20 €</option>
                <option value={50}>50 €</option>
              </select>
            </div>

            {/* Tours de répète avant de miser (Trigger) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Eye className="w-3 h-3 text-blue-400" />
                Tours Observés (Répète)
              </label>
              <select
                value={consecutiveTrigger}
                onChange={(e) => setConsecutiveTrigger(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-blue-300 focus:outline-none focus:border-blue-500"
              >
                <option value={1}>1 fois (immédiat)</option>
                <option value={2}>2 fois (défaut)</option>
                <option value={3}>3 fois d'affilée</option>
                <option value={4}>4 fois d'affilée</option>
                <option value={5}>5 fois d'affilée</option>
                <option value={6}>6 fois d'affilée</option>
              </select>
            </div>

            {/* Capital Initial */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Wallet className="w-3 h-3 text-emerald-400" />
                Capital Initial
              </label>
              <select
                value={initialBankroll}
                onChange={(e) => setInitialBankroll(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-emerald-300 focus:outline-none focus:border-emerald-500"
              >
                <option value={500}>500 €</option>
                <option value={1000}>1 000 € (défaut)</option>
                <option value={maxLossSequence}>{maxLossSequence.toLocaleString()} € ({progressionPreview.length} paliers complets)</option>
                <option value={1500}>1 500 €</option>
                <option value={3000}>3 000 €</option>
                <option value={5000}>5 000 €</option>
                <option value={10000}>10 000 €</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2 border-t border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
              <div>
                Volume total du test :{' '}
                <strong className="text-white">
                  {(runsCount * spinsPerRun).toLocaleString()} tirages simulés
                </strong>{' '}
                • Plafond : <strong className="text-amber-400">640 €</strong> ({progressionPreview.length} paliers / Perte max séquence : -{maxLossSequence.toLocaleString()} €)
              </div>

              <button
                onClick={handleRunSimulation}
                disabled={isRunning}
                className="py-2.5 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black text-xs flex items-center gap-2 transition shadow-lg shadow-purple-900/30 cursor-pointer"
              >
                {isRunning ? (
                  <span className="animate-pulse">Calcul de millions de tours...</span>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    Lancer le Test Extrême
                  </>
                )}
              </button>
            </div>

            {/* Note pédagogique sur l'absorption de la séquence par le capital */}
            {initialBankroll < maxLossSequence ? (
              <div className="text-[11px] text-amber-300/90 flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>
                  <strong>Information Capital :</strong> Avec {initialBankroll.toLocaleString()} € de capital, vous absorbez jusqu'au 7ème palier (320 €). Pour financer les 8 paliers complets jusqu'au plafond de 640 € dès le départ, il faut un capital de {maxLossSequence.toLocaleString()} €. Si une série de pertes survient, la séquence s'arrête en Stop-Loss dès que vos fonds restants ne permettent plus de doubler.
                </span>
              </div>
            ) : (
              <div className="text-[11px] text-emerald-300/90 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>
                  <strong>Capital Optimal :</strong> Vos {initialBankroll.toLocaleString()} € permettent d'absorber l'intégralité des {progressionPreview.length} paliers jusqu'au plafond de 640 € (-{maxLossSequence.toLocaleString()} €).
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 2. RÉSULTATS DU TEST */}
        {result && (
          <div className="mt-5 space-y-4">
            {/* Cartes KPI extrêmes */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Joueurs en Profit</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400">
                  {result.summary.profitableRate.toFixed(1)} %
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {result.summary.profitableRuns.toLocaleString()} / {result.summary.totalRuns.toLocaleString()} joueurs
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Taux de Ruine</span>
                  <Skull className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-red-400">
                  {result.summary.ruinRate.toFixed(1)} %
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {result.summary.ruinCount.toLocaleString()} faillites totales
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Solde Moyen Final</span>
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-100">
                  {Math.round(result.summary.averageFinalBankroll).toLocaleString()} €
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Départ : {initialBankroll.toLocaleString()} €
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Total Crashs Plafond</span>
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-red-400">
                  {result.summary.totalCrashes.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Moyenne : {result.summary.averageCrashes.toFixed(2)} / joueur
                </div>
              </div>
            </div>

            {/* Extrêmes observés */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-400">Meilleur résultat individuel :</span>
                <div className="text-base font-black text-emerald-400 mt-0.5">
                  {result.summary.bestOutcome >= 0 ? `+${result.summary.bestOutcome.toLocaleString()}` : `${result.summary.bestOutcome.toLocaleString()}`} €
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-400">Pire résultat individuel :</span>
                <div className="text-base font-black text-red-400 mt-0.5">
                  {result.summary.worstOutcome > 0 ? `+${result.summary.worstOutcome.toLocaleString()}` : `${result.summary.worstOutcome.toLocaleString()}`} €
                </div>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                <span className="text-slate-400">Pire Drawdown (chute max) :</span>
                <div className="text-base font-black text-amber-400 mt-0.5">
                  -{result.summary.maxDrawdownOverall.toLocaleString()} €
                </div>
              </div>
            </div>

            {/* Histogramme de distribution */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                Distribution des Résultats sur les {result.summary.totalRuns.toLocaleString()} Joueurs
              </h4>
              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getHistogramData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="range" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload as { range: string; count: number };
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-xs">
                              <span className="font-bold text-slate-200">{item.range}</span> :{' '}
                              <span className="text-purple-400 font-bold">
                                {item.count.toLocaleString()} joueurs (
                                {((item.count / result.summary.totalRuns) * 100).toFixed(1)}%)
                              </span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" fill="#a855f7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
