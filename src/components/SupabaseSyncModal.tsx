import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { SimulationStats, StrategyConfig } from '../types/roulette';
import { Database, Upload, CheckCircle, AlertCircle, X, RefreshCw } from 'lucide-react';

interface SavedSimulation {
  id?: string;
  name: string;
  created_at?: string;
  total_spins: number;
  net_profit: number;
  final_bankroll: number;
  cycles_won: number;
  cycles_lost: number;
  max_drawdown: number;
  config: StrategyConfig;
}

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: SimulationStats;
  config: StrategyConfig;
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({
  isOpen,
  onClose,
  stats,
  config,
}) => {
  const [simulationName, setSimulationName] = useState<string>('');
  const [savedSims, setSavedSims] = useState<SavedSimulation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(
    null
  );

  useEffect(() => {
    if (isOpen) {
      loadSavedSimulations();
    }
  }, [isOpen]);

  const loadSavedSimulations = async () => {
    setLoading(true);
    setMessage(null);
    try {
      // 1. Tenter depuis Supabase
      const { data, error } = await supabase
        .from('roulette_simulations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        // Fallback localStorage
        const local = localStorage.getItem('roulette_saved_simulations');
        if (local) {
          setSavedSims(JSON.parse(local));
        }
        setMessage({
          text: "Connecté à Supabase. Note : table 'roulette_simulations' en attente de création SQL ou stockage local actif.",
          type: 'info',
        });
      } else if (data) {
        setSavedSims(data);
      }
    } catch {
      const local = localStorage.getItem('roulette_saved_simulations');
      if (local) setSavedSims(JSON.parse(local));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!simulationName.trim()) {
      setMessage({ text: 'Veuillez saisir un nom pour la simulation.', type: 'error' });
      return;
    }

    setLoading(true);
    const newSim: SavedSimulation = {
      name: simulationName.trim(),
      created_at: new Date().toISOString(),
      total_spins: stats.totalSpins,
      net_profit: stats.netProfit,
      final_bankroll: stats.currentBankroll,
      cycles_won: stats.cycles.cyclesWon,
      cycles_lost: stats.cycles.cyclesLost,
      max_drawdown: stats.maxDrawdown,
      config,
    };

    // Sauvegarde locale systématique
    const existingLocal = JSON.parse(
      localStorage.getItem('roulette_saved_simulations') || '[]'
    ) as SavedSimulation[];
    const updatedLocal = [newSim, ...existingLocal.slice(0, 19)];
    localStorage.setItem('roulette_saved_simulations', JSON.stringify(updatedLocal));

    try {
      // Sauvegarde dans Supabase
      const { error } = await supabase.from('roulette_simulations').insert([newSim]);
      if (error) {
        setMessage({
          text: `Simulation enregistrée localement ! (Pour la partager en ligne via Supabase, créez la table 'roulette_simulations').`,
          type: 'info',
        });
      } else {
        setMessage({
          text: `Simulation sauvegardée sur Supabase avec succès ! Votre pote peut la consulter.`,
          type: 'success',
        });
      }
    } catch {
      setMessage({
        text: 'Enregistré localement dans votre navigateur.',
        type: 'info',
      });
    } finally {
      setLoading(false);
      setSimulationName('');
      loadSavedSimulations();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Synchronisation Supabase</h2>
              <p className="text-xs text-slate-400">
                Sauvegarder et partager vos résultats de simulation avec votre ami
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

        {/* Formulaire de sauvegarde */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
            Sauvegarder la session courante ({stats.totalSpins} tirages)
          </h3>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ex: Test 500 tours - Martingale 8 paliers"
              value={simulationName}
              onChange={(e) => setSimulationName(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleSave}
              disabled={loading || stats.totalSpins === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-emerald-900/30 transition"
            >
              <Upload className="w-4 h-4" />
              Sauvegarder
            </button>
          </div>

          {message && (
            <div
              className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
                message.type === 'success'
                  ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                  : message.type === 'error'
                  ? 'bg-red-950/40 border border-red-500/30 text-red-300'
                  : 'bg-blue-950/40 border border-blue-500/30 text-blue-300'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </div>

        {/* Historique des sauvegardes */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Simulations Enregistrées
            </h3>
            <button
              onClick={loadSavedSimulations}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Actualiser
            </button>
          </div>

          <div className="space-y-2">
            {savedSims.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs bg-slate-950/40 rounded-xl border border-slate-800">
                Aucune simulation enregistrée pour le moment.
              </div>
            ) : (
              savedSims.map((sim, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-200">{sim.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {sim.total_spins} tours • {sim.cycles_won} cycles gagnés • {sim.cycles_lost} crashs
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-black ${
                        sim.net_profit >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {sim.net_profit > 0 ? `+${sim.net_profit}` : sim.net_profit} €
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Solde : {sim.final_bankroll} €
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Info configuration Supabase SQL */}
        <div className="mt-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400">
          <span className="font-semibold text-slate-300">Astuce Supabase :</span> Pour activer la table en direct dans votre console Supabase, exécutez dans le SQL Editor :
          <pre className="mt-1.5 p-2 bg-slate-900 rounded border border-slate-800 font-mono text-[10px] text-emerald-400 overflow-x-auto">
{`create table if not exists roulette_simulations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamptz default now(),
  total_spins integer,
  net_profit numeric,
  final_bankroll numeric,
  cycles_won integer,
  cycles_lost integer,
  max_drawdown numeric,
  config jsonb
);`}
          </pre>
        </div>
      </div>
    </div>
  );
};
