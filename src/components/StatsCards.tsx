import React from 'react';
import { SimulationStats } from '../types/roulette';
import { Wallet, TrendingUp, TrendingDown, Target, AlertTriangle, Layers, Percent } from 'lucide-react';

interface StatsCardsProps {
  stats: SimulationStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const isProfitable = stats.netProfit >= 0;
  const cycleWinRate =
    stats.cycles.totalCycles > 0
      ? ((stats.cycles.cyclesWon / stats.cycles.totalCycles) * 100).toFixed(1)
      : '0.0';

  const roi =
    stats.totalWagered > 0 ? ((stats.netProfit / stats.totalWagered) * 100).toFixed(2) : '0.00';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {/* 1. Capital Actuel */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Capital Actuel</span>
          <Wallet className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-xl md:text-2xl font-black text-slate-100">
          {stats.currentBankroll.toLocaleString()} €
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Départ : {stats.initialBankroll.toLocaleString()} €
        </div>
      </div>

      {/* 2. Bénéfice Net */}
      <div
        className={`p-4 rounded-2xl border shadow-lg backdrop-blur-md ${
          isProfitable
            ? 'bg-emerald-950/20 border-emerald-500/30'
            : 'bg-red-950/20 border-red-500/30'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Bénéfice Net</span>
          {isProfitable ? (
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
        </div>
        <div
          className={`text-xl md:text-2xl font-black ${
            isProfitable ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {stats.netProfit > 0 ? `+${stats.netProfit.toLocaleString()}` : stats.netProfit.toLocaleString()} €
        </div>
        <div className="text-[11px] text-slate-400 mt-1">ROI : {roi} %</div>
      </div>

      {/* 3. Cycles Réussis */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Cycles Gagnés</span>
          <Target className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-xl md:text-2xl font-black text-emerald-400">
          {stats.cycles.cyclesWon}
        </div>
        <div className="text-[11px] text-emerald-400/80 mt-1 font-semibold">
          +{stats.cycles.totalProfitFromWins.toLocaleString()} € (+5€/cycle)
        </div>
      </div>

      {/* 4. Séries Noires (Stop-Loss) */}
      <div
        className={`p-4 rounded-2xl border shadow-lg backdrop-blur-md ${
          stats.cycles.cyclesLost > 0
            ? 'bg-red-950/30 border-red-500/50'
            : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Stop-Loss (Crash)</span>
          <AlertTriangle
            className={`w-4 h-4 ${stats.cycles.cyclesLost > 0 ? 'text-red-400' : 'text-slate-500'}`}
          />
        </div>
        <div
          className={`text-xl md:text-2xl font-black ${
            stats.cycles.cyclesLost > 0 ? 'text-red-400' : 'text-slate-200'
          }`}
        >
          {stats.cycles.cyclesLost}
        </div>
        <div className="text-[11px] text-red-400/90 mt-1 font-semibold">
          -{stats.cycles.totalLossFromCrashes.toLocaleString()} € (1 275€/crash)
        </div>
      </div>

      {/* 5. Taux Réussite Cycles */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Taux Réussite Cycles</span>
          <Percent className="w-4 h-4 text-blue-400" />
        </div>
        <div className="text-xl md:text-2xl font-black text-slate-100">{cycleWinRate} %</div>
        <div className="text-[11px] text-slate-400 mt-1">
          {stats.cycles.totalCycles} cycles totaux
        </div>
      </div>

      {/* 6. Exposition & Drawdown */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span>Max Drawdown</span>
          <Layers className="w-4 h-4 text-amber-400" />
        </div>
        <div className="text-xl md:text-2xl font-black text-amber-400">
          -{stats.maxDrawdown.toLocaleString()} €
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Pire creux : {stats.maxDrawdownPercent.toFixed(1)} %
        </div>
      </div>
    </div>
  );
};
