'use client';

import React, { useState } from 'react';
import { 
  AlertOctagon, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ExternalLink,
  MapPin,
  FileText,
  Music,
  Camera,
  Layers
} from 'lucide-react';
import { Contradiction, Event, Document } from '@/types/investigation';

interface NexusContradictionsProps {
  contradictions: Contradiction[];
  events: Event[];
  documents: Document[];
  onResolveContradiction: (id: string, status: 'reviewed' | 'dismissed') => void;
  onOpenProvenance: (docId: string, offset: string, snippet?: string) => void;
}

export const NexusContradictions: React.FC<NexusContradictionsProps> = ({
  contradictions,
  events,
  documents,
  onResolveContradiction,
  onOpenProvenance
}) => {
  const [selectedId, setSelectedId] = useState<string>(contradictions[0]?.id || '');

  const activeContradiction = contradictions.find((c) => c.id === selectedId) || contradictions[0];

  const eventA = events.find((e) => e.id === activeContradiction?.event_a_id);
  const eventB = events.find((e) => e.id === activeContradiction?.event_b_id);

  const docA = documents.find((d) => d.id === eventA?.document_id);
  const docB = documents.find((d) => d.id === eventB?.document_id);

  const auditLog = [
    {
      time: '2026-09-10 23:05:12 IST',
      action: 'DETERMINISTIC SPATIOTEMPORAL TRIGGER',
      detail: 'Velocity > 1500 km/h detected between Event A and Event B.',
      status: 'FLAGGED'
    },
    {
      time: '2026-09-10 23:06:40 IST',
      action: 'GROQ LLAMA-3.3 FORENSIC INFERENCE',
      detail: 'Generated physical impossibility explanation citing Jodhpur and Kota logs.',
      status: 'EXPLAINED'
    },
    {
      time: '2026-09-10 23:10:00 IST',
      action: 'REALTIME CROSS-AGENCY DISPATCH',
      detail: 'Pushed notification alert to both Jodhpur-HQ and Kota-CID command consoles.',
      status: 'DISPATCHED'
    }
  ];

  return (
    <div className="space-y-5 font-mono select-none">
      {/* Top Header */}
      <div className="bg-[#111318] p-4 rounded-lg border border-red-900/60 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded bg-red-600 text-white font-bold animate-pulse">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-red-400">
              CONTRADICTION ARBITRATION CENTER
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Automated spatiotemporal collision arbitration between Jodhpur Police and Kota Police.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-[10px] bg-red-950 text-red-300 border border-red-800 px-2.5 py-1 rounded font-bold">
            {contradictions.filter((c) => c.status === 'flagged').length} UNRESOLVED ANOMALIES
          </span>
        </div>
      </div>

      {/* Main Split Layout: Left Queue List (4 cols) + Center/Right Arbitration Panel (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Scrollable Queue List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest px-1">
            <span>FLAGGED CONFLICT QUEUE</span>
            <span>{contradictions.length} ITEMS</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {contradictions.map((c) => {
              const isSelected = c.id === activeContradiction?.id;
              const isFlagged = c.status === 'flagged';

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#EDE9E0] text-slate-950 border-[#F4C430] shadow-md'
                      : 'bg-[#111318] text-slate-300 border-[#232731] hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center space-x-1.5 text-[10px] font-bold">
                      <span className={`w-2 h-2 rounded-full ${isFlagged ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
                      <span className="uppercase">{c.type} CONFLICT</span>
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${
                        isFlagged
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold truncate">
                    Aarav Singh: Jodhpur vs Kota Collision
                  </h4>

                  <div className="mt-2 pt-2 border-t border-slate-700/40 flex items-center justify-between text-[10px]">
                    <span className="font-mono opacity-70">JPD ↔ KPD</span>
                    <span className="font-bold">10-SEP 22:45 IST</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center/Right: Detail Arbitration Panel */}
        <div className="lg:col-span-8 space-y-4">
          {activeContradiction ? (
            <div className="bg-[#111318] border border-[#232731] rounded-lg p-5 space-y-5">
              {/* Shared Impossibility Callout Banner */}
              <div className="p-4 rounded bg-red-950/60 border-2 border-red-500 text-white space-y-2 shadow-lg animate-classified-glow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-red-400">
                    <ShieldAlert className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-wider">
                      SPATIOTEMPORAL IMPOSSIBILITY BANNER
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded">
                    HIGH SEVERITY
                  </span>
                </div>

                <p className="text-xs font-bold leading-relaxed font-sans">
                  {activeContradiction.description}
                </p>

                <div className="pt-2 border-t border-red-800/80 flex flex-wrap items-center justify-between text-[10px] text-red-200">
                  <span>DISTANCE: 390 KM // TIME DELTA: 15 MINUTES</span>
                  <span className="font-bold text-white">IMPLIED VELOCITY: ~1,560 KM/H</span>
                </div>
              </div>

              {/* Side-by-Side Per-Agency Evidence Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column: Jodhpur Police Evidence */}
                <div className="p-4 rounded bg-[#EDE9E0] border border-slate-300 text-slate-950 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                    <span className="text-[10px] font-black uppercase text-[#0284C7] bg-sky-100 px-2 py-0.5 rounded border border-sky-300">
                      JODHPUR POLICE EVIDENCE
                    </span>
                    <span className="text-[10px] font-mono text-slate-600">22:30 IST</span>
                  </div>

                  {/* Visual Proof Preview */}
                  <div className="aspect-video bg-white rounded border border-slate-300 p-2.5 flex flex-col justify-between font-mono text-[10px]">
                    <div className="flex items-center justify-between text-slate-600 font-bold">
                      <span className="flex items-center space-x-1">
                        <FileText className="w-3.5 h-3.5 text-[#0284C7]" />
                        <span>WITNESS STATEMENT #042</span>
                      </span>
                      <span>RAJIV RATHORE</span>
                    </div>
                    <p className="text-slate-800 font-sans line-clamp-3 text-[11px] leading-snug">
                      &ldquo;I witnessed suspect Aarav Singh driving White Scorpio near Mehrangarh Fort South Ascent. He stopped by Clock Tower...&rdquo;
                    </p>
                    <span className="text-[#0284C7] font-bold">LOCATION: MEHRANGARH CLOCK TOWER</span>
                  </div>

                  <button
                    onClick={() => onOpenProvenance(eventA?.document_id || 'doc-jod-witness-01', 'Line 5-8', eventA?.description)}
                    className="w-full py-1.5 bg-[#0284C7] hover:bg-[#0369a1] text-white rounded text-[11px] font-bold transition flex items-center justify-center space-x-1"
                  >
                    <span>INSPECT JODHPUR SOURCE</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                {/* Right Column: Kota Police Evidence */}
                <div className="p-4 rounded bg-[#EDE9E0] border border-slate-300 text-slate-950 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                    <span className="text-[10px] font-black uppercase text-[#D97706] bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      KOTA POLICE EVIDENCE
                    </span>
                    <span className="text-[10px] font-mono text-slate-600">22:45 IST</span>
                  </div>

                  {/* Visual Proof Preview */}
                  <div className="aspect-video bg-[#111318] text-white rounded border border-slate-300 p-2.5 flex flex-col justify-between font-mono text-[10px]">
                    <div className="flex items-center justify-between text-[#F4C430] font-bold">
                      <span className="flex items-center space-x-1">
                        <Camera className="w-3.5 h-3.5 text-[#F4C430]" />
                        <span>ANPR CAMERA 09</span>
                      </span>
                      <span className="text-emerald-400">MATCH 91.4%</span>
                    </div>
                    <div className="text-slate-300 text-[11px] font-sans">
                      Automated ANPR logged suspect exiting Silver Bolero (RJ-20-CA-8812) at Chambal River Bridge toll plaza.
                    </div>
                    <span className="text-[#F4C430] font-bold">LOCATION: CHAMBAL BRIDGE KOTA</span>
                  </div>

                  <button
                    onClick={() => onOpenProvenance(eventB?.document_id || 'doc-kota-cctv-02', 'Line 5-8', eventB?.description)}
                    className="w-full py-1.5 bg-[#D97706] hover:bg-[#b45309] text-white rounded text-[11px] font-bold transition flex items-center justify-center space-x-1"
                  >
                    <span>INSPECT KOTA SOURCE</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Arbitration Action Controls */}
              <div className="pt-3 border-t border-[#232731] flex flex-wrap items-center justify-between gap-3">
                <span className="text-[10px] text-slate-400 uppercase font-bold">
                  ANALYST ARBITRATION ACTIONS:
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onResolveContradiction(activeContradiction.id, 'reviewed')}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-black flex items-center space-x-1.5 shadow transition active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>CONFIRM AS DECOY / SPLIT ENTITY</span>
                  </button>
                  <button
                    onClick={() => onResolveContradiction(activeContradiction.id, 'dismissed')}
                    className="px-3.5 py-1.5 bg-[#1C202A] hover:bg-red-950 text-slate-300 hover:text-red-300 border border-[#2E3444] hover:border-red-800 rounded text-xs font-bold transition"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>DISMISS CONFLICT</span>
                  </button>
                  <button
                    onClick={() => alert('Secondary optical sweep scheduled across NH-25 & NH-27 toll cameras.')}
                    className="px-3 py-1.5 bg-[#1C202A] hover:bg-[#2A303F] text-slate-300 border border-[#2E3444] rounded text-xs font-bold transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 text-xs">
              No contradiction selected.
            </div>
          )}

          {/* Bottom Stream: Chronological Audit Log */}
          <div className="bg-[#111318] border border-[#232731] rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-[#1E232E] pb-2">
              <span>CHRONOLOGICAL ARBITRATION AUDIT STREAM</span>
              <span>SHA-256 LEDGER</span>
            </div>

            <div className="space-y-2">
              {auditLog.map((log, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-[#090A0D] rounded border border-[#1E232E] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-[#F4C430] font-mono text-[10px] font-bold">{log.time}</span>
                    <span className="text-slate-200 font-bold">{log.action}:</span>
                    <span className="text-slate-400 text-[11px] font-sans">{log.detail}</span>
                  </div>
                  <span className="text-[9px] bg-[#1C202A] text-slate-300 px-2 py-0.5 rounded border border-[#2A2F3D] font-bold shrink-0 self-start sm:self-auto">
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
