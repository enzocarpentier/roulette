import React, { useEffect, useState } from 'react';
import { EUROPEAN_WHEEL_ORDER, getNumberColor } from '../constants/roulette';
import { RouletteColor } from '../types/roulette';

interface RouletteWheelProps {
  lastNumber: number | null;
  isSpinning: boolean;
}

export const RouletteWheel: React.FC<RouletteWheelProps> = ({ lastNumber, isSpinning }) => {
  const [rotation, setRotation] = useState<number>(0);

  useEffect(() => {
    if (lastNumber !== null) {
      const numberIndex = EUROPEAN_WHEEL_ORDER.indexOf(lastNumber);
      if (numberIndex !== -1) {
        const sliceAngle = 360 / 37;
        // Ajouter plusieurs tours complets (ex: 4-6 tours) pour l'effet de rotation
        const extraTurns = (4 + Math.floor(Math.random() * 2)) * 360;
        const targetAngle = extraTurns + (360 - numberIndex * sliceAngle);
        setRotation((prev) => prev + targetAngle);
      }
    }
  }, [lastNumber]);

  const lastColor: RouletteColor = lastNumber !== null ? getNumberColor(lastNumber) : 'green';

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
      {/* Roue visuelle */}
      <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center">
        {/* Curseur indicateur supérieur */}
        <div className="absolute -top-3 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.8)]" />

        {/* Cercle extérieur décoratif doré/bronze */}
        <div className="absolute inset-0 rounded-full border-4 border-amber-600/40 shadow-[0_0_30px_rgba(245,158,11,0.15)] pointer-events-none" />

        {/* Roue rotative SVG */}
        <div
          className="w-full h-full rounded-full overflow-hidden transition-transform ease-out"
          style={{
            transform: `rotate(${rotation}deg)`,
            transitionDuration: isSpinning ? '2.5s' : '0s',
          }}
        >
          <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-2xl">
            <circle cx="200" cy="200" r="195" fill="#1e293b" stroke="#334155" strokeWidth="4" />

            {EUROPEAN_WHEEL_ORDER.map((num, idx) => {
              const sliceAngle = 360 / 37;
              const angleStart = idx * sliceAngle;
              const angleMid = angleStart + sliceAngle / 2;
              const color = getNumberColor(num);

              let fillColor = '#0f172a';
              if (color === 'red') fillColor = '#dc2626';
              if (color === 'black') fillColor = '#1e293b';
              if (color === 'green') fillColor = '#16a34a';

              // Convert polar to cartesian
              const radStart = ((angleStart - 90) * Math.PI) / 180;
              const radEnd = (((angleStart + sliceAngle) - 90) * Math.PI) / 180;
              const x1 = 200 + 190 * Math.cos(radStart);
              const y1 = 200 + 190 * Math.sin(radStart);
              const x2 = 200 + 190 * Math.cos(radEnd);
              const y2 = 200 + 190 * Math.sin(radEnd);

              // Path segment
              const pathData = `M 200 200 L ${x1} ${y1} A 190 190 0 0 1 ${x2} ${y2} Z`;

              // Position du texte
              const textRad = ((angleMid - 90) * Math.PI) / 180;
              const textX = 200 + 165 * Math.cos(textRad);
              const textY = 200 + 165 * Math.sin(textRad);

              return (
                <g key={num}>
                  <path d={pathData} fill={fillColor} stroke="#0f172a" strokeWidth="1" />
                  <text
                    x={textX}
                    y={textY}
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    dominantBaseline="central"
                    transform={`rotate(${angleMid}, ${textX}, ${textY})`}
                  >
                    {num}
                  </text>
                </g>
              );
            })}

            {/* Centre de la roulette */}
            <circle cx="200" cy="200" r="95" fill="#090d16" stroke="#d97706" strokeWidth="3" />
            <circle cx="200" cy="200" r="70" fill="#1e293b" stroke="#334155" strokeWidth="2" />
          </svg>
        </div>

        {/* Moyeu central affichant le dernier numéro */}
        <div className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-slate-950/90 border-2 border-amber-500/50 flex flex-col items-center justify-center shadow-2xl backdrop-blur-sm z-10">
          {lastNumber !== null ? (
            <>
              <span
                className={`text-3xl font-black ${
                  lastColor === 'red'
                    ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]'
                    : lastColor === 'black'
                    ? 'text-slate-300 drop-shadow-[0_0_10px_rgba(148,163,184,0.4)]'
                    : 'text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.8)]'
                }`}
              >
                {lastNumber}
              </span>
              <span className="text-[10px] tracking-wider uppercase font-semibold text-slate-400">
                {lastColor === 'red' ? 'Rouge' : lastColor === 'black' ? 'Noir' : 'Zéro'}
              </span>
            </>
          ) : (
            <span className="text-xs text-slate-500 font-medium">Prêt</span>
          )}
        </div>
      </div>
    </div>
  );
};
