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
  Layers,
  Sparkles,
  ArrowRight
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
  const [resolutionNotice, setResolutionNotice] = useState<string | null>(null);

  const activeContradiction = contradictions.find((c) => c.id === selectedId) || contradictions[0];

  const eventA = events.find((e) => e.id === activeContradiction?.event_a_id);
  const eventB = events.find((e) => e.id === activeContradiction?.event_b_id);

  const docA = documents.find((d) => d.id === eventA?.document_id);
  const docB = documents.find((d) => d.id === eventB?.document_id);

  const auditLog = [
    {
      time: '2026-09-10 23:05:12 IST',
      action: 'DETERMINISTIC PHYSICS CHECK',
      detail: 'Detected spatiotemporal velocity anomaly: 390 km transit in 15 mins (1,560 km/h).',
      status: 'FLAGGED'
    },
    {
      time: '2026-09-10 23:06:40 IST',
      action: 'CROSS-DOCUMENT COREFERENCE RESOLUTION',
      detail: 'Generated physical impossibility explanation citing Jodhpur Witness #042 and Kota ANPR Log #118.',
      status: 'EXPLAINED'
    },
    {
      time: '2026-09-10 23:10:00 IST',
      action: 'CROSS-AGENCY DISPATCH ALERT',
      detail: 'Broadcast collision notification to Jodhpur-HQ and Kota-CID command consoles.',
      status: 'DISPATCHED'
    }
  ];

  const handleArbitrationChoice = (choice: string) => {
    onResolveContradiction(activeContradiction.id, 'reviewed');
    setResolutionNotice(`Arbitrated as: "${choice}". Logged to cross-agency audit trail.`);
    setTimeout(() => setResolutionNotice(null), 4000);
  };

  return (
    <div className="p-5 space-y-5 font-mono select-none">
      {/* Top Header */}
      <div className="bg-[#12141A] p-4 rounded-lg border border-red-800/80 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded bg-red-600 text-white font-extrabold shadow-md shadow-red-600/30">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-red-400">
              CONTRADICTION ARBITRATION CENTER
            </h2>
            <p className="text-xs text-slate-200 mt-0.5">
              Automated spatiotemporal collision detection and cross-agency human-in-the-loop arbitration.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-xs bg-red-950 text-red-200 border border-red-700 px-3 py-1 rounded font-extrabold animate-pulse">
            {contradictions.filter((c) => c.status === 'flagged').length} UNRESOLVED ANOMALIES
          </span>
        </div>
      </div>

      {/* Resolution Notification Banner */}
      {resolutionNotice && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-lg text-emerald-200 text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{resolutionNotice}</span>
          </div>
          <span className="text-[10px] text-emerald-400">AUDIT COMMITTED</span>
        </div>
      )}

      {/* Main Split Layout: Left Queue List (4 cols) + Center/Right Arbitration Panel (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Scrollable Queue List */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300 font-extrabold uppercase tracking-widest px-1">
            <span>FLAGGED CONFLICT QUEUE</span>
            <span className="text-[#F4C430]">{contradictions.length} ITEMS</span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {contradictions.map((c) => {
              const isSelected = c.id === activeContradiction?.id;
              const isFlagged = c.status === 'flagged';

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#EDE9E0] text-black border-[#F4C430] shadow-xl'
                      : 'bg-[#12141A] text-slate-200 border-[#232731] hover:border-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center space-x-2 text-xs font-black">
                      <span className={`w-2.5 h-2.5 rounded-full ${isFlagged ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
                      <span className="uppercase">{c.type} CONFLICT</span>
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded font-black uppercase ${
                        isFlagged
                          ? 'bg-red-950 text-red-200 border border-red-700'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-black truncate">
                    Aarav Singh: Jodhpur vs Kota Impossible Velocity
                  </h4>

                  <div className="mt-2.5 pt-2 border-t border-slate-700/50 flex items-center justify-between text-xs font-bold">
                    <span className="font-mono text-slate-400">JODHPUR ↔ KOTA</span>
                    <span className="text-red-400">10-SEP 22:45 IST</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center/Right: Detail Arbitration Panel */}
        <div className="lg:col-span-8 space-y-4">
          {activeContradiction ? (
            <div className="bg-[#12141A] border border-[#232731] rounded-lg p-5 space-y-5 shadow-xl">
              {/* Shared Impossibility Callout Banner with High Contrast */}
              <div className="p-4 rounded-lg bg-red-950/80 border-2 border-red-500 text-white space-y-2.5 shadow-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-red-300">
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                    <span className="text-xs font-black uppercase tracking-wider">
                      PHYSICAL IMPOSSIBILITY CALLOUT
                    </span>
                  </div>
                  <span className="text-xs font-extrabold bg-red-600 text-white px-2.5 py-0.5 rounded shadow">
                    HIGH SEVERITY
                  </span>
                </div>

                <div className="text-lg lg:text-xl font-black text-white leading-tight">
                  390 KM IN 15 MINUTES = 1,560 KM/H
                </div>

                <p className="text-xs font-medium text-slate-100 font-sans leading-relaxed">
                  {activeContradiction.description}
                </p>

                <div className="pt-2 border-t border-red-800/80 flex flex-wrap items-center justify-between text-xs text-red-200 font-bold">
                  <span>DISTANCE: 390 KM // TIME DELTA: 15 MINUTES</span>
                  <span className="text-[#F4C430] font-black">CANNOT BOTH BE ACCURATE TRANSIT</span>
                </div>
              </div>

              {/* Side-by-Side Per-Agency Evidence Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column: Jodhpur Police Evidence */}
                <div className="p-4 rounded-lg bg-[#EDE9E0] border-2 border-slate-300 text-black space-y-3 shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                    <span className="text-xs font-black uppercase text-white bg-[#0284C7] px-2.5 py-0.5 rounded">
                      JODHPUR POLICE SIGHTING
                    </span>
                    <span className="text-xs font-bold text-slate-700">22:30 IST</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black uppercase text-black">
                      Mehrangarh South Clock Tower
                    </h4>
                    <p className="text-xs text-slate-700 mt-1 font-mono">
                      Witness Statement #042 (Rajiv Rathore)
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded border border-slate-300 text-xs text-slate-900 leading-relaxed font-sans shadow-inner">
                    "Identified Aarav Singh handing over duffel bag near Clock Tower at 22:30 IST before boarding White Scorpio."
                  </div>

                  <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-800">CONFIDENCE: 94%</span>
                    <button
                      onClick={() => onOpenProvenance(eventA?.document_id || 'doc-jod-witness-01', 'Line 5-8', 'Handover duffel bag near Clock Tower')}
                      className="text-xs text-indigo-900 hover:text-indigo-700 font-extrabold flex items-center space-x-1"
                    >
                      <span>INSPECT PROOF →</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Kota Police Evidence */}
                <div className="p-4 rounded-lg bg-[#EDE9E0] border-2 border-slate-300 text-black space-y-3 shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                    <span className="text-xs font-black uppercase text-white bg-[#D97706] px-2.5 py-0.5 rounded">
                      KOTA SIU SURVEILLANCE
                    </span>
                    <span className="text-xs font-bold text-slate-700">22:45 IST</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black uppercase text-black">
                      Chambal River Bridge Toll Plaza
                    </h4>
                    <p className="text-xs text-slate-700 mt-1 font-mono">
                      ANPR CCTV Surveillance Log #118
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded border border-slate-300 text-xs text-slate-900 leading-relaxed font-sans shadow-inner">
                    "ANPR Camera #09 facial recognition match 91.4% logging suspect exiting Silver Bolero (RJ-20-CA-8812) at 22:45 IST."
                  </div>

                  <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-800">CONFIDENCE: 91%</span>
                    <button
                      onClick={() => onOpenProvenance(eventB?.document_id || 'doc-kota-cctv-02', 'Line 5-8', 'Suspect exiting Silver Bolero at toll')}
                      className="text-xs text-indigo-900 hover:text-indigo-700 font-extrabold flex items-center space-x-1"
                    >
                      <span>INSPECT PROOF →</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Human-in-the-loop (HITL) Arbitration Actions */}
              <div className="p-4 rounded-lg bg-[#090A0D] border border-[#232731] space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
                  <span className="flex items-center space-x-2 text-white">
                    <Sparkles className="w-4 h-4 text-[#F4C430]" />
                    <span>ANALYST ARBITRATION ACTIONS:</span>
                  </span>
                  <span className="text-slate-400">SELECT VERIFIED HYPOTHESIS</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    onClick={() => handleArbitrationChoice('Body-Double Decoy Sighting')}
                    className="p-2.5 rounded bg-[#181B22] hover:bg-[#232731] border border-amber-500/40 text-amber-300 text-xs font-extrabold flex flex-col items-center justify-center text-center transition"
                  >
                    <span>FLAG BODY-DOUBLE DECOY</span>
                    <span className="text-[10px] text-slate-400 font-normal mt-0.5">Likely decoy operative in Kota</span>
                  </button>

                  <button
                    onClick={() => handleArbitrationChoice('Cloned License Plates')}
                    className="p-2.5 rounded bg-[#181B22] hover:bg-[#232731] border border-cyan-500/40 text-cyan-300 text-xs font-extrabold flex flex-col items-center justify-center text-center transition"
                  >
                    <span>FLAG CLONED VEHICLE PLATES</span>
                    <span className="text-[10px] text-slate-400 font-normal mt-0.5">Duplicate registration fraud</span>
                  </button>

                  <button
                    onClick={() => handleArbitrationChoice('False Surveillance Logging')}
                    className="p-2.5 rounded bg-[#181B22] hover:bg-[#232731] border border-red-500/40 text-red-300 text-xs font-extrabold flex flex-col items-center justify-center text-center transition"
                  >
                    <span>FLAG TAMPERED TELEMETRY</span>
                    <span className="text-[10px] text-slate-400 font-normal mt-0.5">Fabricated or skewed timestamp</span>
                  </button>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => onResolveContradiction(activeContradiction.id, 'dismissed')}
                    className="px-3 py-1.5 bg-[#181B22] hover:bg-[#232731] text-slate-400 hover:text-white border border-[#232731] text-xs font-bold rounded transition"
                  >
                    DISMISS AS NON-BLOCKING
                  </button>
                  <button
                    onClick={() => handleArbitrationChoice('Verified Anomaly Confirmed')}
                    className="px-4 py-1.5 bg-[#10B981] hover:bg-[#059669] text-black text-xs font-black rounded transition shadow-md"
                  >
                    CONFIRM RESOLUTION
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-[#12141A] border border-[#232731] rounded-lg text-center text-slate-400">
              No contradictions selected.
            </div>
          )}

          {/* Chronological Audit Log Stream */}
          <div className="bg-[#12141A] border border-[#232731] rounded-lg p-4 space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#232731] pb-2 text-xs font-black text-white">
              <span>CHRONOLOGICAL ARBITRATION AUDIT TRAIL</span>
              <span className="text-slate-400">{auditLog.length} EVENTS</span>
            </div>

            <div className="space-y-2">
              {auditLog.map((log, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-[#090A0D] border border-[#232731] rounded text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2 font-bold">
                      <span className="text-[#F4C430]">{log.action}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        {log.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200">{log.detail}</p>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px] shrink-0">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
