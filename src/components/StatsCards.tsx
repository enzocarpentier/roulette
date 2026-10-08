import React from 'react';
import { SimulationStats } from '../types/roulette';
import { Wallet, TrendingUp, TrendingDown, CheckCircle2, ShieldAlert } from 'lucide-react';

interface StatsCardsProps {
  stats: SimulationStats;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const isProfitable = stats.netProfit >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Solde Actuel */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span className="font-semibold uppercase tracking-wider">Solde Actuel</span>
          <Wallet className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-2xl sm:text-3xl font-black text-slate-100">
          {stats.currentBankroll.toLocaleString()} €
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Capital départ : {stats.initialBankroll.toLocaleString()} €
        </div>
      </div>

      {/* 2. Bénéfice Net */}
      <div
        className={`p-4 rounded-2xl border shadow-md ${
          isProfitable
            ? 'bg-emerald-950/20 border-emerald-500/40'
            : 'bg-red-950/20 border-red-500/40'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span className="font-semibold uppercase tracking-wider">Bénéfice Net</span>
          {isProfitable ? (
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
        </div>
        <div
          className={`text-2xl sm:text-3xl font-black ${
            isProfitable ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {stats.netProfit > 0 ? `+${stats.netProfit.toLocaleString()}` : stats.netProfit.toLocaleString()} €
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Sur {stats.totalSpins} tirages
        </div>
      </div>

      {/* 3. Cycles Réussis */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span className="font-semibold uppercase tracking-wider">Cycles Gagnés</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="text-2xl sm:text-3xl font-black text-emerald-400">
          {stats.cycles.cyclesWon}
        </div>
        <div className="text-xs text-emerald-400/80 mt-1 font-medium">
          +{stats.cycles.totalProfitFromWins.toLocaleString()} € cumulés
        </div>
      </div>

      {/* 4. Séries Noires (Stop-Loss) */}
      <div
        className={`p-4 rounded-2xl border shadow-md ${
          stats.cycles.cyclesLost > 0
            ? 'bg-red-950/30 border-red-500/60'
            : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
          <span className="font-semibold uppercase tracking-wider">Séries Noires (Crash)</span>
          <ShieldAlert
            className={`w-4 h-4 ${stats.cycles.cyclesLost > 0 ? 'text-red-400' : 'text-slate-500'}`}
          />
        </div>
        <div
          className={`text-2xl sm:text-3xl font-black ${
            stats.cycles.cyclesLost > 0 ? 'text-red-400' : 'text-slate-200'
          }`}
        >
          {stats.cycles.cyclesLost}
        </div>
        <div className="text-xs text-red-400/80 mt-1 font-medium">
          {stats.cycles.cyclesLost > 0
            ? `-${stats.cycles.totalLossFromCrashes.toLocaleString()} € au total`
            : 'Aucun arrêt au 8ème palier'}
        </div>
      </div>
    </div>
  );
};
