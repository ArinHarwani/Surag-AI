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
    <div className="p-4 lg:p-6 space-y-4 font-mono select-none text-black">
      {/* Top Header */}
      <div className="bg-white p-4 border-2 border-black shadow-brutal flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-red-600 text-white font-extrabold border border-black shadow-sm">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-black">
              CONTRADICTION ARBITRATION CENTER
            </h2>
            <p className="text-xs text-slate-700 font-bold mt-0.5">
              Automated spatiotemporal collision detection and cross-agency human-in-the-loop arbitration.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="bg-[#FEE2E2] text-red-800 border-2 border-red-600 px-3 py-1 font-black animate-pulse">
            {contradictions.filter((c) => c.status === 'flagged').length} UNRESOLVED ANOMALIES
          </span>
        </div>
      </div>

      {/* Resolution Notification Banner */}
      {resolutionNotice && (
        <div className="p-3 bg-emerald-100 border-2 border-emerald-700 text-emerald-900 text-xs font-black flex items-center justify-between shadow-brutal animate-in fade-in duration-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{resolutionNotice}</span>
          </div>
          <span className="text-[10px] text-emerald-800 uppercase">AUDIT COMMITTED</span>
        </div>
      )}

      {/* Main Split Layout: Left Queue List (4 cols) + Center/Right Arbitration Panel (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Scrollable Queue List */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-widest px-1">
            <span>FLAGGED CONFLICT QUEUE</span>
            <span className="bg-black text-[#F5C842] px-1.5 py-0.5">{contradictions.length} ITEMS</span>
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {contradictions.map((c) => {
              const isSelected = c.id === activeContradiction?.id;
              const isFlagged = c.status === 'flagged';

              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`p-3.5 border-2 border-black cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#F5C842] text-black shadow-brutal font-black'
                      : 'bg-white text-black hover:bg-slate-100 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center space-x-1.5 text-xs font-black">
                      <span className={`w-2.5 h-2.5 rounded-full ${isFlagged ? 'bg-red-600 animate-ping' : 'bg-emerald-600'}`} />
                      <span className="uppercase">{c.type} CONFLICT</span>
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 font-black uppercase border border-black ${
                        isFlagged
                          ? 'bg-red-600 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  <h4 className="text-xs lg:text-sm font-black truncate">
                    Aarav Singh: Jodhpur vs Kota Impossible Velocity
                  </h4>

                  <div className="mt-2.5 pt-2 border-t border-black/20 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-700">JODHPUR ↔ KOTA</span>
                    <span className="text-red-700 font-black">10-SEP 22:45 IST</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center/Right: Detail Arbitration Panel */}
        <div className="lg:col-span-8 space-y-4">
          {activeContradiction ? (
            <div className="bg-white border-2 border-black p-5 space-y-4 shadow-brutal-lg">
              {/* Shared Impossibility Callout Banner (Matches Reference Theme) */}
              <div className="p-4 bg-[#FEE2E2] border-2 border-red-600 text-black space-y-2.5 shadow-brutal">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-red-700">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                    <span className="text-xs font-black uppercase tracking-wider">
                      PHYSICAL IMPOSSIBILITY CALLOUT
                    </span>
                  </div>
                  <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 border border-black">
                    CRITICAL SEVERITY
                  </span>
                </div>

                <div className="text-lg lg:text-xl font-black text-black leading-tight">
                  390 KM IN 15 MINUTES = 1,560 KM/H
                </div>

                <p className="text-xs text-slate-800 font-sans leading-relaxed font-medium">
                  {activeContradiction.description}
                </p>

                <div className="pt-2 border-t border-red-400 flex flex-wrap items-center justify-between text-xs font-black text-red-900">
                  <span>DISTANCE: 390 KM // TIME DELTA: 15 MINUTES</span>
                  <span className="bg-black text-[#F5C842] px-2 py-0.5">PHYSICAL ANOMALY</span>
                </div>
              </div>

              {/* Side-by-Side Per-Agency Evidence Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Left Column: Jodhpur Police Evidence */}
                <div className="p-4 bg-[#FBF9F5] border-2 border-black space-y-3 shadow-brutal">
                  <div className="flex items-center justify-between border-b-2 border-black pb-2">
                    <span className="text-xs font-black uppercase text-white bg-[#0284C7] px-2 py-0.5 border border-black">
                      JODHPUR POLICE SIGHTING
                    </span>
                    <span className="text-xs font-black text-black">22:30 IST</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black uppercase text-black">
                      Mehrangarh South Clock Tower
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 font-bold">
                      Witness Statement #042 (Rajiv Rathore)
                    </p>
                  </div>

                  <div className="p-3 bg-white border border-black text-xs text-slate-900 leading-relaxed font-sans font-medium">
                    &quot;Identified Aarav Singh handing over duffel bag near Clock Tower at 22:30 IST before boarding White Scorpio.&quot;
                  </div>

                  <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-xs">
                    <span className="font-black text-emerald-800">CONFIDENCE: 94%</span>
                    <button
                      onClick={() => onOpenProvenance(eventA?.document_id || 'doc-jod-witness-01', 'Line 5-8', 'Handover duffel bag near Clock Tower')}
                      className="text-xs text-blue-700 hover:underline font-black flex items-center space-x-1"
                    >
                      <span>INSPECT PROOF →</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Kota Police Evidence */}
                <div className="p-4 bg-[#FBF9F5] border-2 border-black space-y-3 shadow-brutal">
                  <div className="flex items-center justify-between border-b-2 border-black pb-2">
                    <span className="text-xs font-black uppercase text-white bg-[#D97706] px-2 py-0.5 border border-black">
                      KOTA SIU SURVEILLANCE
                    </span>
                    <span className="text-xs font-black text-black">22:45 IST</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black uppercase text-black">
                      Chambal River Bridge Toll Plaza
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 font-bold">
                      ANPR CCTV Surveillance Log #118
                    </p>
                  </div>

                  <div className="p-3 bg-white border border-black text-xs text-slate-900 leading-relaxed font-sans font-medium">
                    &quot;ANPR Camera #09 facial recognition match 91.4% logging suspect exiting Silver Bolero (RJ-20-CA-8812) at 22:45 IST.&quot;
                  </div>

                  <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-xs">
                    <span className="font-black text-emerald-800">CONFIDENCE: 91%</span>
                    <button
                      onClick={() => onOpenProvenance(eventB?.document_id || 'doc-kota-cctv-02', 'Line 5-8', 'Suspect exiting Silver Bolero at toll')}
                      className="text-xs text-blue-700 hover:underline font-black flex items-center space-x-1"
                    >
                      <span>INSPECT PROOF →</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Human-in-the-loop (HITL) Arbitration Actions */}
              <div className="p-4 bg-[#F5F2EB] border-2 border-black space-y-3 shadow-brutal">
                <div className="flex items-center justify-between text-xs font-black text-black">
                  <span className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-black" />
                    <span>ANALYST ARBITRATION ACTIONS:</span>
                  </span>
                  <span className="text-slate-600">SELECT RESOLUTION HYPOTHESIS</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => handleArbitrationChoice('Body-Double Decoy Sighting')}
                    className="p-3 bg-white hover:bg-[#F5C842] border-2 border-black text-black text-xs font-black flex flex-col items-center justify-center text-center transition shadow-xs"
                  >
                    <span>FLAG BODY-DOUBLE DECOY</span>
                    <span className="text-[10px] text-slate-600 font-bold mt-0.5">Decoy operative in Kota</span>
                  </button>

                  <button
                    onClick={() => handleArbitrationChoice('Cloned License Plates')}
                    className="p-3 bg-white hover:bg-[#F5C842] border-2 border-black text-black text-xs font-black flex flex-col items-center justify-center text-center transition shadow-xs"
                  >
                    <span>FLAG CLONED PLATES</span>
                    <span className="text-[10px] text-slate-600 font-bold mt-0.5">Duplicate registration fraud</span>
                  </button>

                  <button
                    onClick={() => handleArbitrationChoice('False Surveillance Logging')}
                    className="p-3 bg-white hover:bg-[#F5C842] border-2 border-black text-black text-xs font-black flex flex-col items-center justify-center text-center transition shadow-xs"
                  >
                    <span>FLAG TAMPERED TELEMETRY</span>
                    <span className="text-[10px] text-slate-600 font-bold mt-0.5">Skewed or corrupted log</span>
                  </button>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    onClick={() => onResolveContradiction(activeContradiction.id, 'dismissed')}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-black text-xs font-bold transition"
                  >
                    DISMISS NON-BLOCKING
                  </button>
                  <button
                    onClick={() => handleArbitrationChoice('Verified Anomaly Confirmed')}
                    className="px-4 py-1.5 bg-black text-[#F5C842] font-black text-xs border border-black shadow-brutal hover:bg-slate-900 transition"
                  >
                    CONFIRM RESOLUTION
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-white border-2 border-black text-center text-slate-600">
              No contradictions selected.
            </div>
          )}

          {/* Chronological Audit Log Stream */}
          <div className="bg-white border-2 border-black p-4 space-y-3 shadow-brutal">
            <div className="flex items-center justify-between border-b-2 border-black pb-2 text-xs font-black text-black">
              <span>CHRONOLOGICAL ARBITRATION AUDIT TRAIL</span>
              <span className="text-slate-600">{auditLog.length} EVENTS</span>
            </div>

            <div className="space-y-2">
              {auditLog.map((log, i) => (
                <div
                  key={i}
                  className="p-2.5 bg-[#FBF9F5] border border-black text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2 font-black">
                      <span className="text-black">{log.action}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-200 text-black border border-black">
                        {log.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-800 font-medium font-sans">{log.detail}</p>
                  </div>
                  <span className="text-slate-600 font-mono text-[11px] shrink-0 font-bold">{log.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
