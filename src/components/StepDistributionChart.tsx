import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
} from 'recharts';
import { CycleStats } from '../types/roulette';

interface StepDistributionChartProps {
  cycles: CycleStats;
  maxSteps: number;
}

export const StepDistributionChart: React.FC<StepDistributionChartProps> = ({
  cycles,
  maxSteps,
}) => {
  const chartData = [];

  for (let s = 1; s <= maxSteps; s++) {
    chartData.push({
      step: `Tour ${s}`,
      wins: cycles.stepWinDistribution[s] || 0,
      type: 'win',
    });
  }

  chartData.push({
    step: 'Crash Plafond',
    wins: cycles.cyclesLost,
    type: 'crash',
  });

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">
            Résolution des Cycles par Palier
          </h3>
          <p className="text-xs text-slate-400">
            À quel palier de la séquence de mise les cycles sont-ils remportés ?
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="text-slate-300">Cycles Gagnés (+5€)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
            <span className="text-slate-300">Plafond Dépassé (-1 275€)</span>
          </div>
        </div>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="step" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as { step: string; wins: number; type: string };
                  return (
                    <div className="bg-slate-950 border border-slate-700 p-2.5 rounded-xl shadow-2xl text-xs">
                      <div className="font-bold text-slate-200">{item.step}</div>
                      <div className="mt-1">
                        Occurrences :{' '}
                        <span className="font-black text-amber-400">{item.wins} fois</span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.type === 'win'
                          ? 'Gain net cycle : +5 €'
                          : 'Perte cumulée : -1 275 €'}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="wins" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.type === 'win' ? '#10b981' : '#ef4444'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
