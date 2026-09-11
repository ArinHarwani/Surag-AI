'use client';

import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { useInvestigation } from '@/lib/store/investigation-context';
import { AgencySlug } from '@/types/investigation';
import { Link2, X, Check, XCircle, Clock, Volume2 } from 'lucide-react';

interface ConnectionRequestsPanelProps {
  onClose: () => void;
  currentPortalAgency: AgencySlug;
}

const AGENCY_LABELS: Record<AgencySlug, string> = {
  jodhpur: 'Jodhpur Police HQ',
  kota: 'Kota Police CID',
  jaipur: 'Jaipur Police HQ',
  ajmer: 'Ajmer District Police',
  jaisalmer: 'Jaisalmer Border Police',
};
const AGENCY_COLORS: Record<AgencySlug, string> = {
  jodhpur: '#0284C7',
  kota: '#D97706',
  jaipur: '#059669',
  ajmer: '#7C3AED',
  jaisalmer: '#DC2626',
};

function ConnectionRequestsPanelInner({
  onClose,
  currentPortalAgency,
}: ConnectionRequestsPanelProps) {
  const { connectionRequests, respondToConnectionRequest, documents, agencies } = useInvestigation();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Requests targeting THIS portal (incoming) + requests this portal sent (outgoing)
  const incoming = connectionRequests.filter(
    (r) => r.target_agency_slug === currentPortalAgency
  );
  const outgoing = connectionRequests.filter(
    (r) => r.requesting_agency_slug === currentPortalAgency
  );

  const handleRespond = (id: string, response: 'accepted' | 'rejected') => {
    respondToConnectionRequest(id, response, currentPortalAgency);
  };

  const statusBadge = (status: string) => {
    if (status === 'pending')
      return (
        <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-500 animate-pulse">
          <Clock className="w-3 h-3" /> PENDING
        </span>
      );
    if (status === 'accepted')
      return (
        <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-600">
          <Check className="w-3 h-3" /> ACCEPTED
        </span>
      );
    return (
      <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 bg-red-100 text-red-700 border border-red-500">
        <XCircle className="w-3 h-3" /> REJECTED
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-xl bg-white border-2 border-black shadow-brutal-lg font-mono text-black max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-black bg-black text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#F5C842] flex items-center justify-center">
              <Link2 className="w-4 h-4 text-black" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest">
                {currentPortalAgency === 'jodhpur'
                  ? 'INCOMING EVIDENCE & REQUESTS'
                  : 'CASE ACCESS & EVIDENCE TRANSMISSIONS'}
              </h2>
              <p className="text-[10px] text-slate-400 font-bold">
                Cross-agency evidence & case collaboration — {AGENCY_LABELS[currentPortalAgency]}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-6">
          {/* ── Incoming ── */}
          <section>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-black pb-2 mb-3">
              {currentPortalAgency === 'jodhpur'
                ? `INCOMING EVIDENCE TRANSMISSIONS (${incoming.length})`
                : `INCOMING REQUESTS (${incoming.length})`}
            </h3>
            {incoming.length === 0 ? (
              <p className="text-xs text-slate-500 font-bold font-sans">
                {currentPortalAgency === 'jodhpur'
                  ? 'No incoming evidence transmissions for this portal yet.'
                  : 'No incoming connection requests for this portal.'}
              </p>
            ) : (
              <div className="space-y-3">
                {incoming.map((req) => {
                  const isFromKota = req.requesting_agency_slug === 'kota';
                  return (
                    <div
                      key={req.id}
                      className={`border-2 border-black p-4 space-y-3 ${
                        req.status === 'pending' ? 'bg-amber-50' : 'bg-[#FBF9F5]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="text-[10px] font-black px-1.5 py-0.5 text-white uppercase"
                              style={{ backgroundColor: AGENCY_COLORS[req.requesting_agency_slug] }}
                            >
                              {isFromKota ? 'EVIDENCE TRANSMISSION' : req.requesting_agency_slug.toUpperCase()}
                            </span>
                            <span className="text-xs font-black text-black">
                              {AGENCY_LABELS[req.requesting_agency_slug]}
                            </span>
                          </div>
                          <p className="text-xs font-black text-black">{req.case_name}</p>
                          <p className="text-[10px] text-slate-500 font-bold">
                            Received: {new Date(req.created_at).toLocaleString('en-IN')}
                          </p>
                        </div>
                        {statusBadge(req.status)}
                      </div>

                      {/* Audio Player if audio evidence was transmitted */}
                      {(() => {
                        const relatedAudioDoc = documents.find(
                          (d) =>
                            d.file_type === 'audio' &&
                            (d.agency_id === agencies[req.requesting_agency_slug]?.id ||
                              d.uploaded_by?.toLowerCase().includes('kota'))
                        );
                        const rawAudio = req.media_url || relatedAudioDoc?.media_url;
                        const audioUrl = rawAudio
                          ? rawAudio
                              .replace(/^data:video\/mpeg/i, 'data:audio/mpeg')
                              .replace(/^data:video\/mp4/i, 'data:audio/mp4')
                          : null;

                        if (!audioUrl) return null;

                        return (
                          <div className="border-2 border-black bg-neutral-900 p-3 space-y-2 text-white shadow-brutal">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black uppercase text-[#F5C842] flex items-center gap-1.5 font-mono">
                                <Volume2 className="w-4 h-4 text-[#F5C842] shrink-0" />
                                TRANSMITTED AUDIO STREAM // LISTEN INTERCEPT
                              </span>
                              <span className="text-[9px] font-bold bg-emerald-950 text-emerald-300 px-2 py-0.5 border border-emerald-700">
                                PLAYABLE AUDIO
                              </span>
                            </div>
                            <audio controls className="w-full h-8" src={audioUrl} />
                          </div>
                        );
                      })()}

                      {/* Brief snapshot */}
                      <div className="bg-white border border-slate-300 p-3 text-xs text-slate-700 font-sans leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto">
                        <span className="font-mono font-bold text-slate-500 block mb-1 text-[10px]">EVIDENCE DOSSIER & TRANSCRIPT:</span>
                        {req.case_brief_snapshot}
                      </div>

                      {/* Accept / Reject actions (only for pending) */}
                      {req.status === 'pending' && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleRespond(req.id, 'accepted')}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs border-2 border-emerald-700 shadow-brutal transition active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            {isFromKota
                              ? 'ACCEPT EVIDENCE — Merge into Case'
                              : 'ACCEPT BRIEF — Join Investigation'}
                          </button>
                          <button
                            onClick={() => handleRespond(req.id, 'rejected')}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-red-50 text-red-700 font-black text-xs border-2 border-red-500 transition cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                            REJECT
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Outgoing ── */}
          <section>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b border-black pb-2 mb-3">
              {currentPortalAgency === 'kota'
                ? `TRANSMITTED EVIDENCE REPORTS (${outgoing.length})`
                : `SENT CASE REQUESTS (${outgoing.length})`}
            </h3>
            {outgoing.length === 0 ? (
              <p className="text-xs text-slate-500 font-bold font-sans">
                {currentPortalAgency === 'kota'
                  ? 'No evidence transmissions sent from this portal yet.'
                  : 'No connection requests sent from this portal yet.'}
              </p>
            ) : (
              <div className="space-y-3">
                {outgoing.map((req) => (
                  <div
                    key={req.id}
                    className="border-2 border-black p-4 bg-[#FBF9F5] space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black text-slate-600">
                            {req.requesting_agency_slug === 'kota' ? 'TRANSMITTED EVIDENCE → TO:' : 'SENT CASE BRIEF → TO:'}
                          </span>
                          <span
                            className="text-[10px] font-black px-1.5 py-0.5 text-white uppercase"
                            style={{ backgroundColor: AGENCY_COLORS[req.target_agency_slug] }}
                          >
                            {req.target_agency_slug.toUpperCase()}
                          </span>
                          <span className="text-xs font-black text-black">
                            {AGENCY_LABELS[req.target_agency_slug]}
                          </span>
                        </div>
                        <p className="text-xs font-black text-black">{req.case_name}</p>
                        <p className="text-[10px] text-slate-500 font-bold">
                          Sent: {new Date(req.created_at).toLocaleString('en-IN')}
                        </p>
                      </div>
                      {statusBadge(req.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export function ConnectionRequestsPanel(props: ConnectionRequestsPanelProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const root = document.getElementById('modal-root');
  if (!root) return null;
  return ReactDOM.createPortal(<ConnectionRequestsPanelInner {...props} />, root);
}
