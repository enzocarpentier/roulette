import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';

interface BankrollChartProps {
  data: { spin: number; bankroll: number; netProfit: number }[];
  initialBankroll: number;
}

export const BankrollChart: React.FC<BankrollChartProps> = ({ data, initialBankroll }) => {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 bg-slate-900/60 rounded-2xl border border-slate-800">
        Lancez un ou plusieurs tours pour afficher la courbe d'évolution du capital.
      </div>
    );
  }

  const latestBankroll = data[data.length - 1]?.bankroll ?? initialBankroll;
  const isPositive = latestBankroll >= initialBankroll;

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-100">
            Évolution du Capital (Bankroll)
          </h3>
          <p className="text-xs text-slate-400">
            Trajectoire du solde en temps réel au fil des tirages de roulette
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            <span className="text-slate-400">Départ : {initialBankroll.toLocaleString()} €</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isPositive ? 'bg-emerald-400' : 'bg-red-400'
              }`}
            />
            <span className={isPositive ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
              Actuel : {latestBankroll.toLocaleString()} €
            </span>
          </div>
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="bankrollGradientGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="bankrollGradientRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

            <XAxis
              dataKey="spin"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              tickFormatter={(v) => `T${v}`}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(v) => `${v}€`}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as {
                    spin: number;
                    bankroll: number;
                    netProfit: number;
                  };
                  return (
                    <div className="bg-slate-950 border border-slate-700 p-2.5 rounded-xl shadow-2xl text-xs">
                      <div className="font-bold text-slate-300">Tirage n°{item.spin}</div>
                      <div className="mt-1 text-slate-100">
                        Solde :{' '}
                        <span className="font-black text-amber-400">
                          {item.bankroll.toLocaleString()} €
                        </span>
                      </div>
                      <div
                        className={`font-semibold ${
                          item.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        Bénéfice : {item.netProfit > 0 ? `+${item.netProfit}` : item.netProfit} €
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <ReferenceLine
              y={initialBankroll}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />

            <Area
              type="monotone"
              dataKey="bankroll"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={2.5}
              fillOpacity={1}
              fill={isPositive ? 'url(#bankrollGradientGreen)' : 'url(#bankrollGradientRed)'}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
