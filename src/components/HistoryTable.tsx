import React, { useState } from 'react';
import { RoundLog } from '../types/roulette';
import { Download, ListFilter } from 'lucide-react';

interface HistoryTableProps {
  logs: RoundLog[];
}

export const HistoryTable: React.FC<HistoryTableProps> = ({ logs }) => {
  const [filter, setFilter] = useState<'ALL' | 'BETS_ONLY' | 'EVENTS_ONLY'>('ALL');

  const filteredLogs = logs.filter((log) => {
    if (filter === 'BETS_ONLY') return log.phase === 'BETTING';
    if (filter === 'EVENTS_ONLY')
      return log.cycleEvent === 'WON' || log.cycleEvent === 'CRASH_STOP_LOSS' || log.cycleEvent === 'TRIGGERED';
    return true;
  });

  const exportCSV = () => {
    if (logs.length === 0) return;
    const headers = [
      'Tirage',
      'Numero',
      'Couleur',
      'Phase',
      'Palier_Tour',
      'Pari_Couleur',
      'Mise_EUR',
      'Resultat',
      'Profit_Tour_EUR',
      'Evenement_Cycle',
      'Capital_Apres_Tirage_EUR',
    ];

    const rows = logs.map((log) => [
      log.spinIndex,
      log.number,
      log.color,
      log.phase,
      log.stepIndex,
      log.betColor || 'AUCUN',
      log.betAmount,
      log.outcome,
      log.netProfitRound,
      log.cycleEvent || '',
      log.bankroll,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `roulette_simulation_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-emerald-400" />
            Journal d'Audit des Tirages
          </h3>
          <p className="text-xs text-slate-400">
            Détail tour par tour avec suivi des déclenchements et résolutions ({logs.length} enregistrés)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filtres */}
          <div className="inline-flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-xs">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                filter === 'ALL'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilter('BETS_ONLY')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                filter === 'BETS_ONLY'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mises seules
            </button>
            <button
              onClick={() => setFilter('EVENTS_ONLY')}
              className={`px-2.5 py-1 rounded font-medium transition ${
                filter === 'EVENTS_ONLY'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Événements clés
            </button>
          </div>

          <button
            onClick={exportCSV}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-96 rounded-xl border border-slate-800">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 sticky top-0 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Tirage</th>
              <th className="py-2.5 px-3">Numéro</th>
              <th className="py-2.5 px-3">Phase</th>
              <th className="py-2.5 px-3">Mise engagée</th>
              <th className="py-2.5 px-3">Palier</th>
              <th className="py-2.5 px-3">Résultat Tour</th>
              <th className="py-2.5 px-3">Événement Cycle</th>
              <th className="py-2.5 px-3 text-right">Capital</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                  Aucun tirage à afficher. Lancez la simulation pour voir les données.
                </td>
              </tr>
            ) : (
              filteredLogs.slice(0, 100).map((log) => {
                return (
                  <tr
                    key={log.spinIndex}
                    className={`hover:bg-slate-800/40 transition ${
                      log.cycleEvent === 'CRASH_STOP_LOSS'
                        ? 'bg-red-950/30'
                        : log.cycleEvent === 'WON'
                        ? 'bg-emerald-950/20'
                        : ''
                    }`}
                  >
                    <td className="py-2 px-3 text-slate-400 font-medium">#{log.spinIndex}</td>

                    {/* Numéro avec pastille couleur */}
                    <td className="py-2 px-3">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-white text-[11px] ${
                          log.color === 'red'
                            ? 'bg-red-600'
                            : log.color === 'black'
                            ? 'bg-slate-800 border border-slate-700'
                            : 'bg-emerald-600'
                        }`}
                      >
                        {log.number}
                      </span>
                    </td>

                    {/* Phase */}
                    <td className="py-2 px-3">
                      {log.phase === 'OBSERVATION' ? (
                        <span className="text-slate-400 text-[11px]">Observation</span>
                      ) : (
                        <span className="text-amber-400 font-bold text-[11px]">
                          Attaque {log.betColor === 'red' ? 'Rouge' : 'Noir'}
                        </span>
                      )}
                    </td>

                    {/* Mise */}
                    <td className="py-2 px-3">
                      {log.betAmount > 0 ? (
                        <span className="font-semibold text-slate-200">{log.betAmount} €</span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Palier */}
                    <td className="py-2 px-3">
                      {log.stepIndex > 0 ? (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            log.stepIndex === 8
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          T{log.stepIndex}/8
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>

                    {/* Résultat tour */}
                    <td className="py-2 px-3">
                      {log.outcome === 'WIN' ? (
                        <span className="text-emerald-400 font-bold">+{log.netProfitRound} €</span>
                      ) : log.outcome === 'LOSS' ? (
                        <span className="text-red-400 font-bold">{log.netProfitRound} €</span>
                      ) : (
                        <span className="text-slate-500">Observé</span>
                      )}
                    </td>

                    {/* Événement Cycle */}
                    <td className="py-2 px-3 font-sans">
                      {log.cycleEvent === 'WON' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          ✓ Cycle Gagné (+5€)
                        </span>
                      ) : log.cycleEvent === 'CRASH_STOP_LOSS' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          ⚠ STOP-LOSS (-1 275€)
                        </span>
                      ) : log.cycleEvent === 'TRIGGERED' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          ⚡ Trigger validé
                        </span>
                      ) : log.cycleEvent === 'PROGRESSION' ? (
                        <span className="text-amber-400/80 text-[10px]">Martingale x2</span>
                      ) : null}
                    </td>

                    {/* Solde final */}
                    <td className="py-2 px-3 text-right font-bold text-slate-100">
                      {log.bankroll.toLocaleString()} €
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
