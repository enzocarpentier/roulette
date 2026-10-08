import React, { useRef, useEffect, useState, useCallback } from 'react';
import { EUROPEAN_WHEEL_ORDER, getNumberColor } from '../constants/roulette';
import { casinoAudio } from '../utils/audio';
import { Volume2, VolumeX, Eye } from 'lucide-react';

interface RealisticRouletteWheelProps {
  winningNumber: number | null;
  isSpinning: boolean;
  onSpinComplete?: () => void;
}

export const RealisticRouletteWheel: React.FC<RealisticRouletteWheelProps> = ({
  winningNumber,
  isSpinning,
  onSpinComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [displayNumber, setDisplayNumber] = useState<number | null>(winningNumber);

  // État de simulation physique
  const simRef = useRef({
    rotorAngle: 0,
    rotorSpeed: 0.005, // Vitesse résiduelle au repos
    ballAngle: 0,
    ballSpeed: 0,
    ballRadius: 180,
    ballState: 'IDLE' as 'IDLE' | 'TRACK' | 'DROP' | 'BOUNCE' | 'SETTLED',
    targetNumber: winningNumber,
    lastClickAngle: 0,
    bouncesRemaining: 0,
  });

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    casinoAudio.setMuted(next);
  };

  // Déclenchement d'un nouveau lancer physique
  useEffect(() => {
    if (isSpinning && winningNumber !== null) {
      const sim = simRef.current;
      sim.targetNumber = winningNumber;
      sim.ballState = 'TRACK';
      // Le rotor tourne dans le sens horaire
      sim.rotorSpeed = 0.06 + Math.random() * 0.02;
      // La bille est propulsée dans le sens anti-horaire à haute vitesse
      sim.ballSpeed = -(0.25 + Math.random() * 0.05);
      sim.ballRadius = 182;
      sim.bouncesRemaining = 5 + Math.floor(Math.random() * 3);
      setDisplayNumber(null);
    }
  }, [isSpinning, winningNumber]);

  // Boucle d'animation Canvas 60 FPS
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const sim = simRef.current;

    // Mise à jour de la physique
    if (sim.ballState === 'TRACK') {
      sim.rotorAngle += sim.rotorSpeed;
      sim.ballAngle += sim.ballSpeed;

      // Décélération par frottement aérodynamique
      sim.rotorSpeed = Math.max(0.015, sim.rotorSpeed * 0.998);
      sim.ballSpeed *= 0.988;

      // Jouer un petit clic quand la bille croise les losanges de déviation
      const clickDist = Math.abs(sim.ballAngle - sim.lastClickAngle);
      if (clickDist > Math.PI / 4) {
        sim.lastClickAngle = sim.ballAngle;
        if (Math.abs(sim.ballSpeed) > 0.08) {
          casinoAudio.playFretBounce(0.3);
        }
      }

      // Quand la vitesse chute, la force centrifuge faiblit : chute vers le rotor
      if (Math.abs(sim.ballSpeed) < 0.08) {
        sim.ballState = 'DROP';
      }
    } else if (sim.ballState === 'DROP') {
      sim.rotorAngle += sim.rotorSpeed;
      sim.ballAngle += sim.ballSpeed;
      sim.rotorSpeed = Math.max(0.008, sim.rotorSpeed * 0.995);
      sim.ballSpeed *= 0.97;

      // La bille descend vers les cases
      sim.ballRadius = Math.max(135, sim.ballRadius - 1.2);

      if (sim.ballRadius <= 138) {
        sim.ballState = 'BOUNCE';
      }
    } else if (sim.ballState === 'BOUNCE') {
      sim.rotorAngle += sim.rotorSpeed;
      sim.rotorSpeed = Math.max(0.004, sim.rotorSpeed * 0.994);

      if (sim.bouncesRemaining > 0) {
        // Rebondissements sur les frets
        sim.ballAngle += sim.rotorSpeed + (Math.random() - 0.5) * 0.03;
        sim.ballRadius = 135 + Math.sin(sim.bouncesRemaining * Math.PI) * 4;
        sim.bouncesRemaining--;
        casinoAudio.playFretBounce(0.6);
      } else {
        // Atterrissage dans la case cible
        sim.ballState = 'SETTLED';
        setDisplayNumber(sim.targetNumber);
        casinoAudio.playWinBell();
        if (onSpinComplete) onSpinComplete();
      }
    } else {
      // Repos : le rotor tourne à vitesse de croisière douce, la bille reste dans sa case
      sim.rotorAngle += 0.003;
      if (sim.targetNumber !== null) {
        const targetIndex = EUROPEAN_WHEEL_ORDER.indexOf(sim.targetNumber);
        const sliceAngle = (2 * Math.PI) / 37;
        sim.ballAngle = sim.rotorAngle + targetIndex * sliceAngle + sliceAngle / 2;
        sim.ballRadius = 132;
      }
    }

    // --- RENDU GRAPHIQUE RÉALISTE ---
    ctx.clearRect(0, 0, width, height);

    // 1. Cercle extérieur en Bois d'Acajou (Mahogany Rim)
    const rimGrad = ctx.createRadialGradient(cx, cy, 185, cx, cy, 215);
    rimGrad.addColorStop(0, '#2d1810');
    rimGrad.addColorStop(0.5, '#4a2511');
    rimGrad.addColorStop(0.8, '#6b361a');
    rimGrad.addColorStop(1, '#1a0d08');
    ctx.beginPath();
    ctx.arc(cx, cy, 215, 0, Math.PI * 2);
    ctx.fillStyle = rimGrad;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#d4af37';
    ctx.stroke();

    // Rivets dorés / Vis sur le rebord
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI * 2) / 16;
      const rx = cx + 205 * Math.cos(angle);
      const ry = cy + 205 * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(rx, ry, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#fef08a';
      ctx.fill();
    }

    // 2. Piste de la bille (Ball Track en laiton / argent)
    const trackGrad = ctx.createRadialGradient(cx, cy, 160, cx, cy, 185);
    trackGrad.addColorStop(0, '#1e293b');
    trackGrad.addColorStop(0.7, '#334155');
    trackGrad.addColorStop(1, '#0f172a');
    ctx.beginPath();
    ctx.arc(cx, cy, 185, 0, Math.PI * 2);
    ctx.fillStyle = trackGrad;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#94a3b8';
    ctx.stroke();

    // 8 Déflecteurs en losange (Losanges métalliques pour dévier la bille)
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const dx = cx + 165 * Math.cos(angle);
      const dy = cy + 165 * Math.sin(angle);
      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(3, 0);
      ctx.moveTo(0, 6);
      ctx.lineTo(-3, 0);
      ctx.closePath();
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.restore();
    }

    // 3. Le Rotor rotatif avec les 37 alvéoles
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(sim.rotorAngle);

    const sliceAngle = (Math.PI * 2) / 37;

    EUROPEAN_WHEEL_ORDER.forEach((num, idx) => {
      const aStart = idx * sliceAngle;
      const aEnd = aStart + sliceAngle;
      const color = getNumberColor(num);

      // Fond de case
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 150, aStart, aEnd);
      ctx.closePath();

      if (color === 'red') ctx.fillStyle = '#b91c1c';
      else if (color === 'black') ctx.fillStyle = '#0f172a';
      else ctx.fillStyle = '#15803d'; // Zéro vert
      ctx.fill();

      // Séparateur métallique en laiton (Fret)
      ctx.beginPath();
      ctx.moveTo(90 * Math.cos(aStart), 90 * Math.sin(aStart));
      ctx.lineTo(150 * Math.cos(aStart), 150 * Math.sin(aStart));
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#d4af37';
      ctx.stroke();

      // Numéro inscrit
      ctx.save();
      const aMid = aStart + sliceAngle / 2;
      ctx.rotate(aMid);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(num.toString(), 130, 0);
      ctx.restore();
    });

    // Anneau séparateur intérieur doré
    ctx.beginPath();
    ctx.arc(0, 0, 105, 0, Math.PI * 2);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#d4af37';
    ctx.stroke();

    // 4. Tourelle centrale en laiton / bronze (Turret / Cone)
    const coneGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 90);
    coneGrad.addColorStop(0, '#fef08a');
    coneGrad.addColorStop(0.3, '#d4af37');
    coneGrad.addColorStop(0.7, '#854d0e');
    coneGrad.addColorStop(1, '#451a03');
    ctx.beginPath();
    ctx.arc(0, 0, 90, 0, Math.PI * 2);
    ctx.fillStyle = coneGrad;
    ctx.fill();

    // Étoile à 8 branches de la tourelle
    for (let i = 0; i < 8; i++) {
      const armAngle = (i * Math.PI * 2) / 8;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(75 * Math.cos(armAngle), 75 * Math.sin(armAngle));
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#fef08a';
      ctx.stroke();
    }

    // Cabochon central
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#451a03';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#fef08a';
    ctx.stroke();

    ctx.restore(); // Fin du rotor

    // 5. La Bille en Ivoire (Ivorine Ball) avec ombre réaliste
    const bx = cx + sim.ballRadius * Math.cos(sim.ballAngle);
    const by = cy + sim.ballRadius * Math.sin(sim.ballAngle);

    // Ombre portée de la bille
    ctx.beginPath();
    ctx.arc(bx + 2, by + 3, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fill();

    // Bille 3D avec reflet
    const ballGrad = ctx.createRadialGradient(bx - 1.5, by - 1.5, 1, bx, by, 5.5);
    ballGrad.addColorStop(0, '#ffffff');
    ballGrad.addColorStop(0.7, '#e2e8f0');
    ballGrad.addColorStop(1, '#94a3b8');
    ctx.beginPath();
    ctx.arc(bx, by, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = ballGrad;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.fill();
    ctx.shadowBlur = 0;
  }, [onSpinComplete]);

  // Boucle requestAnimationFrame
  useEffect(() => {
    let animId: number;
    const loop = () => {
      renderFrame();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [renderFrame]);

  const lastColor = displayNumber !== null ? getNumberColor(displayNumber) : 'green';

  return (
    <div className="relative flex flex-col items-center p-5 bg-slate-900/90 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md">
      {/* Barre supérieure avec son et statut */}
      <div className="w-full flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Roue Casino Physique • 60 FPS
          </span>
        </div>

        <button
          onClick={toggleSound}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
          title={isMuted ? 'Activer le son' : 'Couper le son'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
        </button>
      </div>

      {/* Canvas physique haute définition */}
      <div className="relative flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={450}
          height={450}
          className="w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-96 drop-shadow-[0_10px_35px_rgba(0,0,0,0.8)]"
        />

        {/* Badge flottant du numéro gagnant */}
        {displayNumber !== null && (
          <div className="absolute top-2 right-2 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-slate-700 flex items-center gap-2 shadow-2xl animate-fade-in backdrop-blur-md">
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">Sorti :</span>
            <span
              className={`font-black text-sm px-2 py-0.5 rounded ${
                lastColor === 'red'
                  ? 'bg-red-600 text-white'
                  : lastColor === 'black'
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {displayNumber}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 text-[11px] text-slate-400 text-center">
        Double rotation indépendante (Rotor horaire + Bille anti-horaire) • Frets métalliques en laiton
      </div>
    </div>
  );
};
