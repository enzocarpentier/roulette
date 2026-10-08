import React from 'react';
import { RoundLog } from '../types/roulette';
import { computeChiSquare } from '../utils/cryptoRng';
import { Flame, Snowflake, ShieldCheck, AlertCircle } from 'lucide-react';

interface CasinoBillboardProps {
  history: RoundLog[];
}

export const CasinoBillboard: React.FC<CasinoBillboardProps> = ({ history }) => {
  const totalSpins = history.length;

  // Calcul des fréquences de chaque numéro 0 à 36
  const frequencies: Record<number, number> = {};
  let redCount = 0;
  let blackCount = 0;
  let greenCount = 0;
  let evenCount = 0;
  let oddCount = 0;
  let lowCount = 0; // 1-18
  let highCount = 0; // 19-36

  history.forEach((h) => {
    frequencies[h.number] = (frequencies[h.number] || 0) + 1;
    if (h.color === 'red') redCount++;
    else if (h.color === 'black') blackCount++;
    else greenCount++;

    if (h.number > 0) {
      if (h.number % 2 === 0) evenCount++;
      else oddCount++;

      if (h.number <= 18) lowCount++;
      else highCount++;
    }
  });

  // Calcul du Chi-carré
  const chiResult = computeChiSquare(frequencies, totalSpins);

  // Numéros chauds (Hot) et froids (Cold)
  const sortedNumbers = Array.from({ length: 37 }, (_, i) => ({
    num: i,
    count: frequencies[i] || 0,
  })).sort((a, b) => b.count - a.count);

  const hotNumbers = sortedNumbers.slice(0, 4);
  const coldNumbers = sortedNumbers.slice(-4).reverse();

  // Pourcentages
  const redPct = totalSpins > 0 ? ((redCount / totalSpins) * 100).toFixed(1) : '48.6';
  const blackPct = totalSpins > 0 ? ((blackCount / totalSpins) * 100).toFixed(1) : '48.6';
  const greenPct = totalSpins > 0 ? ((greenCount / totalSpins) * 100).toFixed(1) : '2.7';

  const nonZeroTotal = evenCount + oddCount;
  const evenPct = nonZeroTotal > 0 ? ((evenCount / nonZeroTotal) * 100).toFixed(1) : '50.0';
  const oddPct = nonZeroTotal > 0 ? ((oddCount / nonZeroTotal) * 100).toFixed(1) : '50.0';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-2xl backdrop-blur-md flex flex-col justify-between">
      <div>
        {/* Header Totem Casino */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Totem Électronique de Casino
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {totalSpins} tirages
          </span>
        </div>

        {/* 1. Répartition Couleurs */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-xs font-semibold text-slate-300">
            <span>Rouge : {redPct}%</span>
            <span>Vert : {greenPct}%</span>
            <span>Noir : {blackPct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden flex bg-slate-950">
            <div style={{ width: `${redPct}%` }} className="bg-red-600" />
            <div style={{ width: `${greenPct}%` }} className="bg-emerald-500" />
            <div style={{ width: `${blackPct}%` }} className="bg-slate-700" />
          </div>
        </div>

        {/* 2. Répartition Pairs / Impairs */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Pair : <strong className="text-slate-200">{evenPct}%</strong></span>
            <span>Impair : <strong className="text-slate-200">{oddPct}%</strong></span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden flex bg-slate-950">
            <div style={{ width: `${evenPct}%` }} className="bg-blue-600" />
            <div style={{ width: `${oddPct}%` }} className="bg-purple-600" />
          </div>
        </div>

        {/* 3. Numéros Chauds & Froids */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 mb-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              Chauds (Hot)
            </div>
            <div className="flex items-center gap-1.5">
              {hotNumbers.map((item) => (
                <span
                  key={item.num}
                  className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center justify-center"
                  title={`${item.count} sorties`}
                >
                  {item.num}
                </span>
              ))}
            </div>
          </div>

          <div className="p-2.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-400 mb-1.5">
              <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
              Froids (Cold)
            </div>
            <div className="flex items-center gap-1.5">
              {coldNumbers.map((item) => (
                <span
                  key={item.num}
                  className="w-6 h-6 rounded-md bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 font-bold text-xs flex items-center justify-center"
                  title={`${item.count} sorties`}
                >
                  {item.num}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Test Statistique du Chi-Carré (Chi-Square) */}
      <div className="pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1">
            Test Chi-Deux ($\chi^2$) :
          </span>
          <span
            className={`font-bold flex items-center gap-1 ${
              chiResult.isFair ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {chiResult.isFair ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                Équitable (p &gt; 0.05)
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                Écart temporaire
              </>
            )}
          </span>
        </div>
        <div className="text-[10px] text-slate-500 mt-0.5">
          Score : {chiResult.chiSquare} (Seuil critique : {chiResult.criticalValue})
        </div>
      </div>
    </div>
  );
};
