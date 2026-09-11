'use client';

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useInvestigation } from '@/lib/store/investigation-context';
import { Document, AgencySlug } from '@/types/investigation';
import { Link2, X, Send, ChevronDown } from 'lucide-react';

interface ConnectionRequestModalProps {
  onClose: () => void;
  requestingAgency: AgencySlug;
  caseId: string;
  caseName: string;
  documents: Document[];
}

const PARTNER_AGENCY: Record<AgencySlug, { slug: AgencySlug; label: string; color: string }> = {
  jodhpur: { slug: 'kota', label: 'Kota Police CID', color: '#D97706' },
  kota: { slug: 'jodhpur', label: 'Jodhpur Police HQ', color: '#0284C7' },
};

function ConnectionRequestModalInner({
  onClose,
  requestingAgency,
  caseName,
  documents,
}: ConnectionRequestModalProps) {
  const { sendConnectionRequest } = useInvestigation();

  const partner = PARTNER_AGENCY[requestingAgency];
  const defaultBrief = [
    `Case: ${caseName}`,
    `Evidence items: ${documents.length} file(s)`,
    documents.length > 0
      ? `Latest evidence: ${documents[0].title}`
      : '',
    `\nThis case may have cross-jurisdictional relevance. Requesting access for joint investigation.`,
  ]
    .filter(Boolean)
    .join('\n');

  const [brief, setBrief] = useState(defaultBrief);
  const [sent, setSent] = useState(false);

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

  const handleSend = () => {
    sendConnectionRequest(requestingAgency, partner.slug, brief);
    setSent(true);
    setTimeout(onClose, 1800);
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-lg bg-white border-2 border-black shadow-brutal-lg font-mono text-black">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-black bg-black text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#F5C842] flex items-center justify-center">
              <Link2 className="w-4 h-4 text-black" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest">REPORT / CONNECT TO</h2>
              <p className="text-[10px] text-slate-400 font-bold">Send a cross-agency connection request</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {sent ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 border-2 border-emerald-600 flex items-center justify-center mx-auto">
              <Send className="w-6 h-6 text-emerald-700" />
            </div>
            <p className="text-sm font-black uppercase tracking-wider text-emerald-700">
              Request Sent to {partner.label}
            </p>
            <p className="text-xs text-slate-600 font-bold font-sans">
              The target agency will see a pending request notification in their portal.
            </p>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            {/* Target Agency */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5">
                Target Agency
              </label>
              <div
                className="flex items-center gap-2 p-3 border-2 border-black"
                style={{ backgroundColor: partner.color + '18' }}
              >
                <span
                  className="text-[10px] font-black px-2 py-1 text-white uppercase"
                  style={{ backgroundColor: partner.color }}
                >
                  {partner.slug.toUpperCase()}
                </span>
                <span className="text-xs font-bold text-slate-700">{partner.label}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-auto opacity-30" />
              </div>
              <p className="text-[10px] text-slate-500 font-bold mt-1">
                Only connected agencies in the system are listed.
              </p>
            </div>

            {/* Brief Snapshot */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5">
                Case Brief Snapshot <span className="text-slate-500 font-normal">(editable before sending)</span>
              </label>
              <textarea
                rows={6}
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                className="w-full bg-[#FBF9F5] border-2 border-black text-xs font-medium text-black p-2.5 outline-none focus:bg-white font-sans resize-none"
              />
              <p className="text-[10px] text-slate-500 font-bold mt-1">
                This snapshot is shared with the target agency. They will see it before deciding to Accept or Reject.
              </p>
            </div>

            {/* Info box */}
            <div className="p-3 bg-blue-50 border-2 border-blue-400 text-[11px] font-bold text-blue-800 font-sans leading-relaxed">
              ℹ️ Once accepted, {partner.label} will gain full read/write access to this case.
              Evidence added by either agency will sync in real-time to both portals.
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-white border-2 border-black text-xs font-black hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!brief.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-black text-[#F5C842] font-black text-xs border-2 border-black shadow-brutal disabled:opacity-40 hover:bg-slate-900 transition active:translate-x-0.5 active:translate-y-0.5"
              >
                <Send className="w-4 h-4" />
                SEND CONNECTION REQUEST
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ConnectionRequestModal(props: ConnectionRequestModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const root = document.getElementById('modal-root');
  if (!root) return null;
  return ReactDOM.createPortal(<ConnectionRequestModalInner {...props} />, root);
}
