import { useState } from 'react';
import { calculateProvablyFairNumber, sha256 } from '../utils/cryptoRng';
import { Shield, Key, Hash, CheckCircle, X, RefreshCw } from 'lucide-react';

interface ProvablyFairModalProps {
  isOpen: boolean;
  onClose: () => void;
  serverSeed: string;
  serverSeedHash: string;
  clientSeed: string;
  nonce: number;
  onUpdateClientSeed: (newSeed: string) => void;
  onRotateServerSeed: () => void;
}

export const ProvablyFairModal: React.FC<ProvablyFairModalProps> = ({
  isOpen,
  onClose,
  serverSeed,
  serverSeedHash,
  clientSeed,
  nonce,
  onUpdateClientSeed,
  onRotateServerSeed,
}) => {
  const [testServerSeed, setTestServerSeed] = useState('');
  const [testClientSeed, setTestClientSeed] = useState('');
  const [testNonce, setTestNonce] = useState<number>(0);
  const [verifyResult, setVerifyResult] = useState<{
    number: number;
    hmacHex: string;
    serverSeedHash: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleVerify = async () => {
    if (!testServerSeed.trim()) return;
    const computedHash = await sha256(testServerSeed.trim());
    const result = await calculateProvablyFairNumber(
      testServerSeed.trim(),
      testClientSeed.trim(),
      testNonce
    );

    setVerifyResult({
      number: result.number,
      hmacHex: result.hmacHex,
      serverSeedHash: computedHash,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                Garantie Cryptographique (Provably Fair)
              </h2>
              <p className="text-xs text-slate-400">
                Protocole standard HMAC-SHA256 certifié inviolable
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

        {/* Explication du protocole */}
        <div className="mt-4 p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200 leading-relaxed">
          <strong className="text-white">Comment l'équité est-elle prouvée ?</strong>
          <p className="mt-1">
            Avant chaque tirage, le casino s'engage sur un <strong>Server Seed Hash (SHA-256)</strong> immuable. Le résultat du tour est calculé mathématiquement à partir de votre propre graine (Client Seed) et d'un compteur (Nonce) via la formule :
          </p>
          <code className="block mt-2 p-2 bg-slate-950/80 rounded border border-emerald-500/20 font-mono text-[11px] text-emerald-400">
            Résultat = HMAC_SHA256(ServerSeed, ClientSeed + ":" + Nonce) % 37
          </code>
        </div>

        {/* Graines Actives de la Session */}
        <div className="mt-4 space-y-3 p-4 bg-slate-950/60 rounded-2xl border border-slate-800">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-amber-400" />
                Server Seed Hash (Engagement public actuel)
              </span>
              <button
                onClick={onRotateServerSeed}
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Changer de graine
              </button>
            </div>
            <input
              type="text"
              readOnly
              value={serverSeedHash}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-400" />
                Votre Client Seed (Modifiable librement)
              </label>
              <input
                type="text"
                value={clientSeed}
                onChange={(e) => onUpdateClientSeed(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Nonce actuel (Nombre de tirages)
              </label>
              <input
                type="text"
                readOnly
                value={nonce}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Outil de vérification indépendant */}
        <div className="mt-5 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Vérificateur Cryptographique Indépendant
            </h3>
            <button
              onClick={() => {
                setTestServerSeed(serverSeed);
                setTestClientSeed(clientSeed);
                setTestNonce(nonce);
              }}
              className="text-[11px] text-emerald-400 hover:underline"
            >
              Charger graines du tour actuel
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mb-3">
            Collez la graine serveur dévoilée d'une session passée pour recalculer le numéro exact :
          </p>

          <div className="space-y-2">
            <input
              type="text"
              placeholder="Server Seed dévoilé"
              value={testServerSeed}
              onChange={(e) => setTestServerSeed(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Client Seed"
                value={testClientSeed}
                onChange={(e) => setTestClientSeed(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
              />
              <input
                type="number"
                placeholder="Nonce"
                value={testNonce}
                onChange={(e) => setTestNonce(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
              />
            </div>

            <button
              onClick={handleVerify}
              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
            >
              Vérifier l'authenticité mathématique
            </button>
          </div>

          {verifyResult && (
            <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
                <CheckCircle className="w-4 h-4" />
                Numéro calculé : {verifyResult.number}
              </div>
              <div className="text-[10px] text-slate-400 font-mono break-all">
                HMAC : {verifyResult.hmacHex}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
