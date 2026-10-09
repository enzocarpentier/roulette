import React, { useState, useEffect } from 'react';
import {
  logger,
  AppLogEntry,
  LogCategory,
} from '../utils/actionLogger';
import {
  X,
  Copy,
  Check,
  Download,
  Trash2,
  Terminal,
  Filter,
  Eye,
  Coins,
  TrendingUp,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface ActionLogsPanelProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const ActionLogsPanel: React.FC<ActionLogsPanelProps> = ({ onClose, isModal = false }) => {
  const [logs, setLogs] = useState<AppLogEntry[]>([]);
  const [copied, setCopied] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = logger.subscribe((newLogs) => {
      setLogs(newLogs);
    });
    return () => unsubscribe();
  }, []);

  const handleCopyLogs = async () => {
    const text = logger.exportFormattedText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback si clipboard API non supporté
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadLogs = () => {
    const text = logger.exportFormattedText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `roulette-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Voulez-vous vraiment effacer tous les logs enregistrés ?')) {
      logger.clear();
    }
  };

  const filteredLogs = logs.filter((l) => {
    if (selectedCategory === 'ALL') return true;
    if (selectedCategory === 'SPINS_AND_BETS') return ['SPIN', 'BET', 'OBSERVE'].includes(l.category);
    if (selectedCategory === 'RESULTS') return ['WIN', 'LOSS', 'STOP_LOSS'].includes(l.category);
    return l.category === selectedCategory;
  });

  const getBadgeStyle = (cat: LogCategory) => {
    switch (cat) {
      case 'WIN':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'LOSS':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'STOP_LOSS':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30 font-bold';
      case 'BET':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
      case 'OBSERVE':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'SPIN':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'CONFIG':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/30';
    }
  };

  return (
    <div className={`w-full flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 overflow-hidden ${isModal ? 'max-w-4xl max-h-[92vh]' : 'min-h-[500px]'}`}>
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>Journal des Actions & Logs Système</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {logs.length} Événements
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Chaque tirage, mise, gain, changement de réglage et événement est horodaté et copiable en 1 clic
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLogs}
            className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-lg ${
              copied
                ? 'bg-emerald-600 text-white shadow-emerald-900/30'
                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/30'
            }`}
            title="Copier tous les logs au format texte pour les envoyer au développeur"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copié dans le presse-papier !</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copier les Logs (pour le Dev)</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadLogs}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            title="Télécharger les logs (.txt)"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleClear}
            className="p-2 rounded-xl bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 transition cursor-pointer"
            title="Vider les logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

        {/* Filter bar */}
        <div className="p-3 bg-slate-950/40 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filtrer :
            </span>
            {[
              { id: 'ALL', label: 'Tous' },
              { id: 'SPINS_AND_BETS', label: 'Tours & Paris' },
              { id: 'RESULTS', label: 'Gains & Pertes' },
              { id: 'STOP_LOSS', label: 'Stop-Loss' },
              { id: 'CONFIG', label: 'Paramètres' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedCategory(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  selectedCategory === f.id
                    ? 'bg-cyan-500 text-slate-950'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-400">
            Affichage : <strong className="text-white">{filteredLogs.length}</strong> / {logs.length}
          </div>
        </div>

        {/* Log Stream Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-xs bg-slate-950/70">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <Terminal className="w-8 h-8 opacity-40" />
              <p>Aucun log enregistré pour le moment.</p>
              <p className="text-[11px] text-slate-600">
                Lancez des tirages ou modifiez des paramètres sur l'application pour voir les logs défiler en direct !
              </p>
            </div>
          ) : (
            filteredLogs.map((entry) => (
              <div
                key={entry.id}
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition cursor-pointer"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] text-slate-500 select-all">
                      [{entry.timestamp}]
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${getBadgeStyle(
                        entry.category
                      )}`}
                    >
                      {entry.category}
                    </span>

                    <span className="font-semibold text-slate-200">
                      {entry.title}
                    </span>
                  </div>

                  {entry.bankroll !== undefined && (
                    <span className="text-[11px] font-black text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                      Solde : {entry.bankroll.toLocaleString('fr-FR')} €
                    </span>
                  )}
                </div>

                {entry.details && (
                  <div className="mt-1.5 text-[11px] text-slate-400 font-sans pl-1 border-l-2 border-slate-800">
                    {entry.details}
                  </div>
                )}

                {/* Données JSON étendues si cliqué */}
                {entry.data && expandedId === entry.id && (
                  <pre className="mt-2 p-2 bg-slate-950 rounded-lg text-[10px] text-cyan-300/80 overflow-x-auto border border-slate-800">
                    {JSON.stringify(entry.data, null, 2)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span>
            💡 Astuce : Cliquez sur <strong>Copier les Logs</strong> pour coller tout l'historique directement dans votre message avec le dev.
          </span>
          <span className="text-slate-500">Auto-sauvegardé en session</span>
        </div>
      </div>
  );
};

export interface ActionLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActionLogsModal: React.FC<ActionLogsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <ActionLogsPanel onClose={onClose} isModal={true} />
    </div>
  );
};
