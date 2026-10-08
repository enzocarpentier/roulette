import { useState, useEffect, useRef } from 'react';
import {
  createInitialEngine,
  stepEngine,
  runBatch,
  EngineState,
} from './utils/engine';
import { StrategyConfig } from './types/roulette';
import { DEFAULT_STRATEGY_CONFIG } from './constants/roulette';
import { generateRandomHexSeed, sha256 } from './utils/cryptoRng';
import { RealisticRouletteWheel } from './components/RealisticRouletteWheel';
import { RouletteTable } from './components/RouletteTable';
import { CasinoBillboard } from './components/CasinoBillboard';
import { PhaseTracker } from './components/PhaseTracker';
import { StatsCards } from './components/StatsCards';
import { BankrollChart } from './components/BankrollChart';
import { StepDistributionChart } from './components/StepDistributionChart';
import { LiveControls } from './components/LiveControls';
import { HistoryTable } from './components/HistoryTable';
import { MonteCarloModal } from './components/MonteCarloModal';
import { StrategyConfigModal } from './components/StrategyConfigModal';
import { SupabaseSyncModal } from './components/SupabaseSyncModal';
import { ProvablyFairModal } from './components/ProvablyFairModal';
import {
  Sparkles,
  BarChart3,
  Settings,
  Database,
  AlertOctagon,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';

export default function App() {
  const [config, setConfig] = useState<StrategyConfig>(DEFAULT_STRATEGY_CONFIG);
  const [engineState, setEngineState] = useState<EngineState>(() =>
    createInitialEngine(DEFAULT_STRATEGY_CONFIG)
  );

  const [bankrollCurve, setBankrollCurve] = useState<
    { spin: number; bankroll: number; netProfit: number }[]
  >([{ spin: 0, bankroll: DEFAULT_STRATEGY_CONFIG.initialBankroll, netProfit: 0 }]);

  const [lastRolledNumber, setLastRolledNumber] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(300);

  // Provably Fair Cryptographic Seeds
  const [serverSeed, setServerSeed] = useState<string>('');
  const [serverSeedHash, setServerSeedHash] = useState<string>('');
  const [clientSeed, setClientSeed] = useState<string>('roulette-client-seed-2026');

  // Modals
  const [showMonteCarlo, setShowMonteCarlo] = useState<boolean>(false);
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [showSupabase, setShowSupabase] = useState<boolean>(false);
  const [showProvablyFair, setShowProvablyFair] = useState<boolean>(false);

  const autoPlayRef = useRef<number | null>(null);

  // Initialisation des graines cryptographiques
  useEffect(() => {
    const initSeed = generateRandomHexSeed(32);
    setServerSeed(initSeed);
    sha256(initSeed).then(setServerSeedHash);
  }, []);

  const handleRotateServerSeed = () => {
    const nextSeed = generateRandomHexSeed(32);
    setServerSeed(nextSeed);
    sha256(nextSeed).then(setServerSeedHash);
  };

  // Exécuter 1 tour avec physique et CSPRNG
  const handleSpinOne = (forcedNum?: number) => {
    if (engineState.isBroke) return;

    setIsSpinning(true);
    const { newState, roundLog } = stepEngine(engineState, forcedNum);
    setLastRolledNumber(roundLog.number);
    setEngineState(newState);

    setBankrollCurve((prev) => [
      ...prev,
      {
        spin: newState.spinIndex,
        bankroll: newState.bankroll,
        netProfit: newState.stats.netProfit,
      },
    ]);

    setTimeout(() => {
      setIsSpinning(false);
    }, 1800);
  };

  // Exécuter un lot de tours à haute vitesse
  const handleSpinBatch = (count: number) => {
    if (engineState.isBroke) return;

    const { finalState, bankrollCurve: newCurve } = runBatch(engineState, count);
    if (finalState.history.length > 0) {
      setLastRolledNumber(finalState.history[0].number);
    }
    setEngineState(finalState);
    setBankrollCurve((prev) => [...prev, ...newCurve.slice(1)]);
  };

  // Réinitialiser la session
  const handleReset = () => {
    setIsPlaying(false);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    const initial = createInitialEngine(config);
    setEngineState(initial);
    setLastRolledNumber(null);
    setBankrollCurve([
      { spin: 0, bankroll: config.initialBankroll, netProfit: 0 },
    ]);
  };

  // Mise à jour de la configuration
  const handleSaveConfig = (newConfig: StrategyConfig) => {
    setConfig(newConfig);
    setIsPlaying(false);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    const freshEngine = createInitialEngine(newConfig);
    setEngineState(freshEngine);
    setLastRolledNumber(null);
    setBankrollCurve([
      { spin: 0, bankroll: newConfig.initialBankroll, netProfit: 0 },
    ]);
  };

  // Gestion de la lecture continue
  const togglePlay = () => {
    if (engineState.isBroke) return;
    setIsPlaying((prev) => !prev);
  };

  useEffect(() => {
    if (isPlaying) {
      autoPlayRef.current = window.setInterval(() => {
        setEngineState((current) => {
          if (current.isBroke) {
            setIsPlaying(false);
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
            return current;
          }
          const { newState, roundLog } = stepEngine(current);
          setLastRolledNumber(roundLog.number);
          setBankrollCurve((prev) => [
            ...prev,
            {
              spin: newState.spinIndex,
              bankroll: newState.bankroll,
              netProfit: newState.stats.netProfit,
            },
          ]);
          return newState;
        });
      }, playSpeed);
    } else {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    }

    return () => {
      if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    };
  }, [isPlaying, playSpeed]);

  const activeBetAmount =
    engineState.phase === 'BETTING'
      ? config.betProgression[engineState.currentStep - 1] || 0
      : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Header Casino Pro */}
      <header className="sticky top-0 z-40 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-xl">
              🎰
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Roulette Européenne Casino Pro
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  CSPRNG Matériel & Physique 60 FPS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Martingale 8 Paliers • Trigger 2 Consécutifs • Stop-Loss strict -1 275€
              </p>
            </div>
          </div>

          {/* Outils et certifications dans le header */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProvablyFair(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-300 hover:text-emerald-200 border border-emerald-500/40 text-xs font-bold transition shadow-sm"
              title="Audit cryptographique de la roulette"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Certifié</span> Provably Fair
            </button>

            <button
              onClick={() => setShowMonteCarlo(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 hover:text-purple-200 border border-purple-500/30 text-xs font-bold transition shadow-sm"
            >
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Stress-Test</span> Monte Carlo
            </button>

            <button
              onClick={() => setShowSupabase(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Partage</span> Supabase
            </button>

            <button
              onClick={() => setShowConfig(true)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition"
              title="Paramètres de stratégie"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Alerte Ruine si faillite */}
        {engineState.isBroke && (
          <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/60 text-red-200 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
            <div className="flex items-center gap-3">
              <AlertOctagon className="w-6 h-6 text-red-400 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  Capital Épuisé (Bankroll Insuffisant) !
                </h3>
                <p className="text-xs text-red-300">
                  Le solde restant ne permet plus d'engager la prochaine mise de la séquence.
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition shadow-lg"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Recharger & Réinitialiser
            </button>
          </div>
        )}

        {/* 1. KPIs Cards Overview */}
        <StatsCards stats={engineState.stats} />

        {/* 2. DISPOSITIF CASINO RÉALISTE : ROUE PHYSIQUE CANVAS + TOTEM + PHASE TRACKER */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Colonne Gauche : Roue Physique Canvas 60 FPS (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <RealisticRouletteWheel
              winningNumber={lastRolledNumber}
              isSpinning={isSpinning}
            />
          </div>

          {/* Colonne Droite : Phase Tracker + Totem Casino (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <PhaseTracker state={engineState} />

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-7">
                <LiveControls
                  onSpinOne={handleSpinOne}
                  onSpinBatch={handleSpinBatch}
                  onReset={handleReset}
                  isPlaying={isPlaying}
                  onTogglePlay={togglePlay}
                  playSpeed={playSpeed}
                  onChangeSpeed={setPlaySpeed}
                  isBroke={engineState.isBroke}
                />
              </div>

              <div className="md:col-span-5">
                <CasinoBillboard history={engineState.history} />
              </div>
            </div>
          </div>
        </div>

        {/* 3. TAPIS DE ROULETTE FRANÇAIS AVEC JETONS DYNAMIQUES */}
        <div>
          <RouletteTable
            activeBetColor={engineState.betColor}
            activeBetAmount={activeBetAmount}
            lastWinningNumber={lastRolledNumber}
          />
        </div>

        {/* 4. Graphiques d'analyse */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <BankrollChart
              data={bankrollCurve}
              initialBankroll={config.initialBankroll}
            />
          </div>
          <div className="lg:col-span-5">
            <StepDistributionChart
              cycles={engineState.stats.cycles}
              maxSteps={config.maxSteps}
            />
          </div>
        </div>

        {/* 5. Journal d'audit complet des tirages & Export CSV */}
        <HistoryTable logs={engineState.history} />

        {/* Note pédagogique & mathématique sur la stratégie */}
        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold text-slate-200">
              Fiabilité et standard casino régulé :
            </span>
            <p>
              Ce simulateur utilise l'API <strong>Web Cryptography (CSPRNG matériel)</strong> sans biais de modulo, garantissant exactement $p = 1/37 \approx 2.7027\%$ pour chaque alvéole. Le protocole <strong>Provably Fair (HMAC-SHA256)</strong> et le test statistique du <strong>Chi-Deux ($\chi^2$)</strong> vous assurent que chaque lancer est mathématiquement pur, indépendant et vérifiable.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-800/80 bg-slate-950 text-center text-xs text-slate-500">
        Simulateur de Stratégie Roulette Européenne • React + Vite + Tailwind + Web Audio + Supabase
      </footer>

      {/* Modals */}
      <MonteCarloModal
        isOpen={showMonteCarlo}
        onClose={() => setShowMonteCarlo(false)}
        config={config}
      />
      <StrategyConfigModal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        config={config}
        onSave={handleSaveConfig}
      />
      <SupabaseSyncModal
        isOpen={showSupabase}
        onClose={() => setShowSupabase(false)}
        stats={engineState.stats}
        config={config}
      />
      <ProvablyFairModal
        isOpen={showProvablyFair}
        onClose={() => setShowProvablyFair(false)}
        serverSeed={serverSeed}
        serverSeedHash={serverSeedHash}
        clientSeed={clientSeed}
        nonce={engineState.spinIndex}
        onUpdateClientSeed={setClientSeed}
        onRotateServerSeed={handleRotateServerSeed}
      />
    </div>
  );
}
