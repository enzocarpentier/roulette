import React, { useState, useEffect, useRef } from 'react';
import { DevComment, CommentType } from '../types/feedback';
import { supabase } from '../lib/supabase';
import {
  MessageSquarePlus,
  X,
  Bug,
  Lightbulb,
  CheckCircle2,
  Trash2,
  List,
  Eye,
  EyeOff,
  Send,
  HelpCircle,
} from 'lucide-react';

export const DevFeedbackOverlay: React.FC = () => {
  const [comments, setComments] = useState<DevComment[]>(() => {
    try {
      const saved = localStorage.getItem('roulette_dev_comments');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [isAddingPin, setIsAddingPin] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [hidePins, setHidePins] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<string | null>(null);

  // Épingle en cours de création
  const [pendingCoords, setPendingCoords] = useState<{ xPct: number; yPct: number } | null>(null);
  const [authorName, setAuthorName] = useState(() => {
    return localStorage.getItem('roulette_comment_author') || 'Enzo';
  });
  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState<CommentType>('improvement');

  const containerRef = useRef<HTMLDivElement>(null);

  // Sauvegarder dans localStorage et tenter Supabase
  useEffect(() => {
    localStorage.setItem('roulette_dev_comments', JSON.stringify(comments));
    localStorage.setItem('roulette_comment_author', authorName);
  }, [comments, authorName]);

  // Synchronisation Supabase au chargement
  useEffect(() => {
    const syncFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('roulette_dev_comments')
          .select('*')
          .order('createdAt', { ascending: false });

        if (!error && data && data.length > 0) {
          setComments(data);
        }
      } catch {
        // Silencieux si table non configurée
      }
    };
    syncFromSupabase();
  }, []);

  // Détection du clic sur l'écran en mode ajout d'épingle
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (!isAddingPin) return;

      // Ignorer si on clique sur la barre d'annulation supérieure
      const target = e.target as HTMLElement;
      if (target.closest('.dev-pin-ignore')) return;

      const doc = document.documentElement;
      const scrollWidth = Math.max(doc.scrollWidth, window.innerWidth);
      const scrollHeight = Math.max(doc.scrollHeight, window.innerHeight);

      const xPct = Math.min(98, Math.max(2, (e.pageX / scrollWidth) * 100));
      const yPct = Math.min(98, Math.max(2, (e.pageY / scrollHeight) * 100));

      setPendingCoords({ xPct, yPct });
      setIsAddingPin(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAddingPin(false);
        setPendingCoords(null);
      }
    };

    if (isAddingPin) {
      document.addEventListener('click', handleDocumentClick, true);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAddingPin]);

  const handleSaveComment = async () => {
    if (!pendingCoords || !commentText.trim()) return;

    const newComment: DevComment = {
      id: `comment_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      author: authorName.trim() || 'Anonyme',
      text: commentText.trim(),
      type: commentType,
      xPct: pendingCoords.xPct,
      yPct: pendingCoords.yPct,
      createdAt: new Date().toISOString(),
      resolved: false,
    };

    const updated = [newComment, ...comments];
    setComments(updated);
    setPendingCoords(null);
    setCommentText('');

    // Sauvegarde Supabase
    try {
      await supabase.from('roulette_dev_comments').insert([newComment]);
    } catch {
      // Ignorer si table absente
    }
  };

  const handleToggleResolve = async (id: string) => {
    const updated = comments.map((c) =>
      c.id === id ? { ...c, resolved: !c.resolved } : c
    );
    setComments(updated);

    try {
      const item = updated.find((c) => c.id === id);
      if (item) {
        await supabase
          .from('roulette_dev_comments')
          .update({ resolved: item.resolved })
          .eq('id', id);
      }
    } catch {
      // Fallback local
    }
  };

  const handleDeleteComment = async (id: string) => {
    const updated = comments.filter((c) => c.id !== id);
    setComments(updated);
    if (selectedCommentId === id) setSelectedCommentId(null);

    try {
      await supabase.from('roulette_dev_comments').delete().eq('id', id);
    } catch {
      // Fallback local
    }
  };

  const pendingCount = comments.filter((c) => !c.resolved).length;

  return (
    <div ref={containerRef} className="pointer-events-none">
      {/* 1. Bandeau supérieur quand le mode dépose est actif */}
      {isAddingPin && (
        <div className="fixed top-0 left-0 right-0 z-50 pointer-events-auto dev-pin-ignore bg-amber-500 text-slate-950 px-4 py-2.5 shadow-2xl flex items-center justify-between font-bold text-xs animate-bounce">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-950 animate-ping" />
            <span>MODE COMMENTAIRE ACTIF : Cliquez n'importe où sur l'écran pour déposer votre remarque</span>
          </div>
          <button
            onClick={() => setIsAddingPin(false)}
            className="px-3 py-1 rounded-lg bg-slate-950 text-white hover:bg-slate-900 transition text-xs font-semibold"
          >
            Annuler (Échap)
          </button>
        </div>
      )}

      {/* 2. Boutons flottants en bas à droite */}
      <div className="fixed bottom-5 right-5 z-40 pointer-events-auto flex items-center gap-2">
        <button
          onClick={() => setHidePins(!hidePins)}
          className="p-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 shadow-2xl backdrop-blur-md transition cursor-pointer"
          title={hidePins ? 'Afficher les épingles' : 'Masquer les épingles'}
        >
          {hidePins ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-emerald-400" />}
        </button>

        <button
          onClick={() => setShowDrawer(!showDrawer)}
          className="relative px-3.5 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-2xl backdrop-blur-md text-xs font-bold transition flex items-center gap-2 cursor-pointer"
        >
          <List className="w-4 h-4 text-purple-400" />
          <span>Remarques Dev</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setIsAddingPin(true)}
          className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-2xl shadow-amber-500/30 transition flex items-center gap-2 cursor-pointer active:scale-95"
        >
          <MessageSquarePlus className="w-4 h-4" />
          <span>Poser un Commentaire</span>
        </button>
      </div>

      {/* 3. Modal de saisie lorsqu'un clic a été effectué */}
      {pendingCoords && (
        <div className="fixed inset-0 z-50 pointer-events-auto flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl text-slate-100 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white">Ajouter une note pour le dev</h3>
              </div>
              <button
                onClick={() => setPendingCoords(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Votre Nom</label>
                <input
                  type="text"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="Ex: Enzo, Mon Pote, etc."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Type de remarque</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'bug', label: 'Bug / Problème', icon: Bug, color: 'text-red-400 border-red-500/40 bg-red-950/20' },
                    { id: 'improvement', label: 'Amélioration', icon: Lightbulb, color: 'text-blue-400 border-blue-500/40 bg-blue-950/20' },
                    { id: 'note', label: 'Idée / Note', icon: HelpCircle, color: 'text-amber-400 border-amber-500/40 bg-amber-950/20' },
                  ].map((t) => {
                    const Icon = t.icon;
                    const isActive = commentType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setCommentType(t.id as CommentType)}
                        className={`p-2 rounded-xl border text-center transition cursor-pointer text-xs font-semibold flex flex-col items-center gap-1 ${
                          isActive
                            ? `${t.color} ring-2 ring-amber-400 shadow`
                            : 'bg-slate-950 border-slate-800 text-slate-400'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px]">{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Description du problème ou de l'idée
                </label>
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Ex: Le bouton est trop petit, changer la couleur de cette carte, corriger ce bug..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-400"
                  autoFocus
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setPendingCoords(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveComment}
                disabled={!commentText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Déposer l'épingle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Affichage des épingles posées sur la page */}
      {!hidePins && (
        <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden">
          {comments.map((comment, idx) => {
            const isSelected = selectedCommentId === comment.id;
            const badgeNumber = idx + 1;

            return (
              <div
                key={comment.id}
                className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${comment.xPct}%`,
                  top: `${comment.yPct}%`,
                }}
              >
                {/* Pastille Épingle */}
                <button
                  onClick={() =>
                    setSelectedCommentId(isSelected ? null : comment.id)
                  }
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shadow-2xl transition transform hover:scale-110 cursor-pointer ${
                    comment.resolved
                      ? 'bg-slate-700 text-slate-300 border border-slate-500 opacity-60'
                      : comment.type === 'bug'
                      ? 'bg-red-500 text-white ring-4 ring-red-500/30'
                      : comment.type === 'improvement'
                      ? 'bg-blue-500 text-white ring-4 ring-blue-500/30'
                      : 'bg-amber-400 text-slate-950 ring-4 ring-amber-400/30'
                  }`}
                  title={`${comment.author} : ${comment.text}`}
                >
                  {comment.resolved ? '✓' : badgeNumber}
                </button>

                {/* Popover détaillé lors du clic sur l'épingle */}
                {isSelected && (
                  <div className="absolute left-8 -top-4 z-50 w-72 bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl text-slate-100 text-xs animate-scale-up">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            comment.type === 'bug'
                              ? 'bg-red-400'
                              : comment.type === 'improvement'
                              ? 'bg-blue-400'
                              : 'bg-amber-400'
                          }`}
                        />
                        <span className="font-bold text-white">{comment.author}</span>
                        <span className="text-[10px] text-slate-400 uppercase">
                          ({comment.type})
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedCommentId(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="mt-2 text-slate-200 leading-relaxed font-sans break-words">
                      {comment.text}
                    </p>

                    <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <button
                        onClick={() => handleToggleResolve(comment.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg font-semibold transition cursor-pointer ${
                          comment.resolved
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {comment.resolved ? 'Résolu ✓' : 'Marquer résolu'}
                      </button>

                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-400 hover:text-red-300 p-1 transition cursor-pointer"
                        title="Supprimer la remarque"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Tiroir latéral (Drawer) listant toutes les remarques */}
      {showDrawer && (
        <div className="fixed inset-y-0 right-0 z-50 pointer-events-auto w-80 sm:w-96 bg-slate-900 border-l border-slate-800 p-5 shadow-2xl flex flex-col text-slate-100 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <List className="w-4 h-4 text-purple-400" />
                Liste des Remarques Dev
              </h3>
              <p className="text-[11px] text-slate-400">
                {comments.length} retours ({pendingCount} à traiter)
              </p>
            </div>
            <button
              onClick={() => setShowDrawer(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
            {comments.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                Aucune remarque déposée pour l'instant. Cliquez sur « Poser un Commentaire » pour épingler un problème ou une idée.
              </div>
            ) : (
              comments.map((c, i) => (
                <div
                  key={c.id}
                  className={`p-3 rounded-2xl border transition ${
                    c.resolved
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                      : c.type === 'bug'
                      ? 'bg-red-950/20 border-red-500/30'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-white">
                      #{i + 1} {c.author}
                    </span>
                    <span
                      className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${
                        c.type === 'bug'
                          ? 'bg-red-500/20 text-red-300'
                          : c.type === 'improvement'
                          ? 'bg-blue-500/20 text-blue-300'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}
                    >
                      {c.type}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-sans">{c.text}</p>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <button
                      onClick={() => handleToggleResolve(c.id)}
                      className={`flex items-center gap-1 font-semibold ${
                        c.resolved ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {c.resolved ? 'Résolu' : 'À faire'}
                    </button>

                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
