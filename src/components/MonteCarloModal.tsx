import React, { useState } from 'react';
import { StrategyConfig, MonteCarloSummary, MonteCarloRun } from '../types/roulette';
import { runMonteCarloSimulation } from '../utils/engine';
import { Play, X, BarChart3, ShieldCheck, Skull, DollarSign, Activity } from 'lucide-react';
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
  const [runsCount, setRunsCount] = useState<number>(300);
  const [spinsPerRun, setSpinsPerRun] = useState<number>(500);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<{ summary: MonteCarloSummary; runs: MonteCarloRun[] } | null>(
    null
  );

  if (!isOpen) return null;

  const handleRunSimulation = () => {
    setIsRunning(true);
    // Timeout pour permettre au navigateur d'afficher le spinner
    setTimeout(() => {
      const simResult = runMonteCarloSimulation(config, runsCount, spinsPerRun);
      setResult(simResult);
      setIsRunning(false);
    }, 50);
  };

  // Préparer les données pour l'histogramme de distribution des profits
  const getHistogramData = () => {
    if (!result) return [];
    const buckets: Record<string, number> = {
      '<-1000€ (Crashs)': 0,
      '-1000 à -500€': 0,
      '-500 à 0€': 0,
      '0 à +200€': 0,
      '+200 à +500€': 0,
      '>+500€': 0,
    };

    result.runs.forEach((r) => {
      if (r.netProfit <= -1000) buckets['<-1000€ (Crashs)']++;
      else if (r.netProfit < -500) buckets['-1000 à -500€']++;
      else if (r.netProfit < 0) buckets['-500 à 0€']++;
      else if (r.netProfit <= 200) buckets['0 à +200€']++;
      else if (r.netProfit <= 500) buckets['+200 à +500€']++;
      else buckets['>+500€']++;
    });

    return Object.entries(buckets).map(([range, count]) => ({
      range,
      count,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Stress-Test Monte Carlo (Simulations Massives)
              </h2>
              <p className="text-xs text-slate-400">
                Tester la stratégie sur des centaines de joueurs indépendants
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Paramètres du test */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Nombre de Joueurs (Sessions)
            </label>
            <select
              value={runsCount}
              onChange={(e) => setRunsCount(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value={100}>100 Joueurs</option>
              <option value={300}>300 Joueurs</option>
              <option value={500}>500 Joueurs</option>
              <option value={1000}>1 000 Joueurs</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Tirages par Session
            </label>
            <select
              value={spinsPerRun}
              onChange={(e) => setSpinsPerRun(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value={200}>200 Tours (~2 heures)</option>
              <option value={500}>500 Tours (~5 heures)</option>
              <option value={1000}>1 000 Tours (~10 heures)</option>
            </select>
          </div>

          <button
            onClick={handleRunSimulation}
            disabled={isRunning}
            className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-purple-900/30"
          >
            {isRunning ? (
              <span className="animate-pulse">Calcul en cours...</span>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Lancer l'Analyse
              </>
            )}
          </button>
        </div>

        {/* Résultats */}
        {result && (
          <div className="mt-5 space-y-4">
            {/* KPI Cards Monte Carlo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Joueurs Gagnants</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-black text-emerald-400">
                  {result.summary.profitableRate.toFixed(1)} %
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {result.summary.profitableRuns} / {result.summary.totalRuns} en profit
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Taux de Ruine</span>
                  <Skull className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-xl font-black text-red-400">
                  {result.summary.ruinRate.toFixed(1)} %
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {result.summary.ruinCount} faillites totales
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Solde Moyen Final</span>
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-black text-slate-100">
                  {Math.round(result.summary.averageFinalBankroll)} €
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Départ : {config.initialBankroll} €
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Crashs Moyens/Joueur</span>
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-xl font-black text-purple-300">
                  {result.summary.averageCrashes.toFixed(2)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Séries de 8 pertes</div>
              </div>
            </div>

            {/* Distribution Chart */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
                Distribution des Profits / Pertes sur les {result.summary.totalRuns} Joueurs
              </h4>
              <div className="h-48 w-full">
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
                              <span className="text-purple-400 font-bold">{item.count} joueurs</span>
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

            {/* Analyse Mathématique Explicative */}
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-900/50 text-xs text-purple-200 leading-relaxed">
              <strong className="text-white">Analyse mathématique du système :</strong>
              <p className="mt-1">
                Chaque cycle gagné rapporte <strong>+5 €</strong>. Un échec au 8ème palier (640 €) coûte exactement <strong>-1 275 €</strong>. Il faut donc réussir{' '}
                <strong>255 cycles consécutifs sans aucun crash</strong> pour rentabiliser une seule série noire.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
