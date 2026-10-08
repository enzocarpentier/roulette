import { useState, useEffect, useRef } from 'react';
import {
  createInitialEngine,
  stepEngine,
  runBatch,
  EngineState,
} from './utils/engine';
import { StrategyConfig } from './types/roulette';
import { DEFAULT_STRATEGY_CONFIG, computeProgression } from './constants/roulette';
import { generateRandomHexSeed, sha256 } from './utils/cryptoRng';
import { RealisticRouletteWheel } from './components/RealisticRouletteWheel';
import { RouletteTable } from './components/RouletteTable';
import { CasinoBillboard } from './components/CasinoBillboard';
import { PhaseTracker } from './components/PhaseTracker';
import { StatsCards } from './components/StatsCards';
import { BetConfigBar } from './components/BetConfigBar';
import { BankrollChart } from './components/BankrollChart';
import { StepDistributionChart } from './components/StepDistributionChart';
import { LiveControls } from './components/LiveControls';
import { HistoryTable } from './components/HistoryTable';
import { MonteCarloModal } from './components/MonteCarloModal';
import { SupabaseSyncModal } from './components/SupabaseSyncModal';
import { ProvablyFairModal } from './components/ProvablyFairModal';
import { DevFeedbackOverlay } from './components/DevFeedbackOverlay';
import {
  BarChart3,
  Database,
  AlertOctagon,
  RotateCcw,
  ShieldCheck,
  LayoutGrid,
  TrendingUp,
  ListFilter,
  BarChart2,
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

  // Onglet actif pour la partie inférieure (évite la surcharge visuelle)
  const [activeTab, setActiveTab] = useState<'table' | 'chart' | 'history' | 'stats'>('table');

  // Provably Fair Cryptographic Seeds
  const [serverSeed, setServerSeed] = useState<string>('');
  const [serverSeedHash, setServerSeedHash] = useState<string>('');
  const [clientSeed, setClientSeed] = useState<string>('roulette-client-seed-2026');

  // Modals
  const [showMonteCarlo, setShowMonteCarlo] = useState<boolean>(false);
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

  // Changement direct de la mise de départ (ex: 1€, 2€, 5€, 10€, 20€...)
  const handleChangeBaseBet = (newBaseBet: number) => {
    const newProgression = computeProgression(newBaseBet);
    const newConfig: StrategyConfig = {
      ...config,
      baseBet: newBaseBet,
      maxSteps: newProgression.length,
      betProgression: newProgression,
    };
    setConfig(newConfig);
    setIsPlaying(false);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    const freshEngine = createInitialEngine(newConfig);
    setEngineState(freshEngine);
    setLastRolledNumber(null);
    setBankrollCurve([{ spin: 0, bankroll: newConfig.initialBankroll, netProfit: 0 }]);
  };

  // Changement direct du capital de départ
  const handleChangeBankroll = (newBankroll: number) => {
    const newConfig: StrategyConfig = {
      ...config,
      initialBankroll: newBankroll,
    };
    setConfig(newConfig);
    setIsPlaying(false);
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
    const freshEngine = createInitialEngine(newConfig);
    setEngineState(freshEngine);
    setLastRolledNumber(null);
    setBankrollCurve([{ spin: 0, bankroll: newBankroll, netProfit: 0 }]);
  };

  // Exécuter 1 tour
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
    setBankrollCurve([{ spin: 0, bankroll: config.initialBankroll, netProfit: 0 }]);
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
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Header Clair et Épuré */}
      <header className="sticky top-0 z-40 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-xl">
              🎰
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Simulateur Roulette Européenne
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Stratégie Martingale 8 Paliers
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Trigger 2 couleurs identiques • Stop-Loss strict au 8ème tour
              </p>
            </div>
          </div>

          {/* Outils secondaires */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProvablyFair(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Provably Fair</span>
            </button>

            <button
              onClick={() => setShowMonteCarlo(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 hover:text-purple-200 border border-purple-500/30 text-xs font-bold transition shadow-sm"
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
              <span>Stress-Test (1000 Joueurs)</span>
            </button>

            <button
              onClick={() => setShowSupabase(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sauvegarder</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-5">
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
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition shadow-lg cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Recharger & Réinitialiser
            </button>
          </div>
        )}

        {/* 1. SÉLECTEUR DE MISE DE DÉPART ET CAPITAL (PROÉMINENT ET SIMPLE) */}
        <BetConfigBar
          baseBet={config.baseBet}
          initialBankroll={config.initialBankroll}
          onChangeBaseBet={handleChangeBaseBet}
          onChangeBankroll={handleChangeBankroll}
        />

        {/* 2. 4 CARTES KPIS SIMPLES & LISIBLES */}
        <StatsCards stats={engineState.stats} />

        {/* 3. SCÈNE DE JEU PRINCIPALE (ROUE À GAUCHE + ÉTAT & COMMANDES À DROITE) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Roue Physique Canvas (5 cols) */}
          <div className="lg:col-span-5">
            <RealisticRouletteWheel
              winningNumber={lastRolledNumber}
              isSpinning={isSpinning}
            />
          </div>

          {/* État de la Stratégie & Commandes (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <PhaseTracker state={engineState} />
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
        </div>

        {/* 4. ONGLETS DE VUE (ÉVITE LA SURCHARGE COGNITIVE) */}
        <div className="space-y-4 pt-2">
          {/* Barre d'onglets */}
          <div className="flex border-b border-slate-800 gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold transition cursor-pointer ${
                activeTab === 'table'
                  ? 'bg-slate-900 border-t-2 border-emerald-500 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-emerald-400" />
              Tapis de Jeu & Jetons
            </button>

            <button
              onClick={() => setActiveTab('chart')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold transition cursor-pointer ${
                activeTab === 'chart'
                  ? 'bg-slate-900 border-t-2 border-emerald-500 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Graphique du Capital
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold transition cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-slate-900 border-t-2 border-emerald-500 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ListFilter className="w-4 h-4 text-emerald-400" />
              Historique des Tours
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-bold transition cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-slate-900 border-t-2 border-emerald-500 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-amber-400" />
              Totem & Stats Casino
            </button>
          </div>

          {/* Contenu selon l'onglet actif */}
          <div>
            {activeTab === 'table' && (
              <RouletteTable
                activeBetColor={engineState.betColor}
                activeBetAmount={activeBetAmount}
                lastWinningNumber={lastRolledNumber}
              />
            )}

            {activeTab === 'chart' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-8">
                  <BankrollChart
                    data={bankrollCurve}
                    initialBankroll={config.initialBankroll}
                  />
                </div>
                <div className="lg:col-span-4">
                  <StepDistributionChart
                    cycles={engineState.stats.cycles}
                    maxSteps={config.maxSteps}
                  />
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <HistoryTable logs={engineState.history} />
            )}

            {activeTab === 'stats' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <CasinoBillboard history={engineState.history} />
                <StepDistributionChart
                  cycles={engineState.stats.cycles}
                  maxSteps={config.maxSteps}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-slate-800/80 bg-slate-950 text-center text-xs text-slate-500">
        Simulateur de Stratégie Roulette Européenne • React + Vite + Tailwind + Web Audio
      </footer>

      {/* Modals */}
      <MonteCarloModal
        isOpen={showMonteCarlo}
        onClose={() => setShowMonteCarlo(false)}
        config={config}
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

      {/* Système d'annotation et commentaires dev n'importe où sur l'app */}
      <DevFeedbackOverlay />
    </div>
  );
}
