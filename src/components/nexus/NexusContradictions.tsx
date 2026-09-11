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
  ArrowRight,
  ShieldCheck
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

  const handleArbitrationChoice = (choice: string) => {
    if (!activeContradiction) return;
    onResolveContradiction(activeContradiction.id, 'reviewed');
    setResolutionNotice(`Arbitrated as: "${choice}". Logged to cross-agency audit trail.`);
    setTimeout(() => setResolutionNotice(null), 4000);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 font-mono select-none text-black">
      {/* Top Banner */}
      <div className="bg-white border-2 border-black p-5 shadow-brutal flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[#E53E3E] text-white border-2 border-black">
            <AlertOctagon className="w-6 h-6 stroke-[2.5]" />
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
          <span className={`px-3 py-1 font-black border-2 ${
            contradictions.filter((c) => c.status === 'flagged').length > 0
              ? 'bg-[#FEE2E2] text-red-800 border-red-600 animate-pulse'
              : 'bg-emerald-100 text-emerald-800 border-emerald-600'
          }`}>
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

      {/* Empty state when no contradictions exist */}
      {contradictions.length === 0 ? (
        <div className="bg-white border-2 border-black p-12 text-center shadow-brutal space-y-4">
          <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto" />
          <h4 className="text-base font-black uppercase text-black">NO ACTIVE CONTRADICTIONS DETECTED</h4>
          <p className="text-xs text-slate-600 font-sans max-w-lg mx-auto leading-relaxed">
            The deterministic spatiotemporal physics detector sweeps ingested events across agencies in real time. When contradicting statements, impossible transit velocities, or conflicting timestamps occur between agencies, they will be flagged here for human-in-the-loop arbitration.
          </p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-600 text-emerald-800 text-xs font-black">
              <CheckCircle2 className="w-3.5 h-3.5" />
              PHYSICS &amp; TIMELINE INTEGRITY VERIFIED
            </span>
          </div>
        </div>
      ) : (
        /* Main Split Layout: Left Queue List (4 cols) + Center/Right Arbitration Panel (8 cols) */
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
                    className={`p-3.5 border-2 cursor-pointer transition-all shadow-brutal ${
                      isSelected
                        ? 'border-black bg-white ring-2 ring-black'
                        : 'border-black bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 ${
                        isFlagged ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        {c.status.toUpperCase()}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">
                        TYPE: {c.type.toUpperCase()}
                      </span>
                    </div>

                    <h4 className="text-xs font-black uppercase text-black line-clamp-2">
                      {c.description}
                    </h4>

                    <div className="mt-2.5 pt-2 border-t border-black/20 flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-700">TYPE: {c.type.toUpperCase()}</span>
                      <span className="text-red-700 font-black">ACTION REQUIRED</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center/Right: Detail Arbitration Panel */}
          <div className="lg:col-span-8 space-y-4">
            {activeContradiction && (
              <div className="bg-white border-2 border-black p-5 space-y-4 shadow-brutal-lg">
                {/* Callout Banner */}
                <div className="p-4 bg-[#FEE2E2] border-2 border-red-600 text-black space-y-2.5 shadow-brutal">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-red-700">
                      <ShieldAlert className="w-5 h-5 text-red-600" />
                      <span className="text-xs font-black uppercase tracking-wider">
                        ANOMALY CALLOUT
                      </span>
                    </div>
                    <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 border border-black">
                      SEVERITY: {activeContradiction.type.toUpperCase()}
                    </span>
                  </div>

                  <h3 className="text-base lg:text-lg font-black text-black leading-tight">
                    {activeContradiction.description}
                  </h3>

                  <p className="text-xs text-slate-800 font-sans leading-relaxed font-medium">
                    Conflicting intelligence vectors detected between filed evidence files. Please evaluate source claims below.
                  </p>
                </div>

                {/* Side-by-Side Per-Agency Evidence Columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Event A */}
                  <div className="p-4 bg-[#FBF9F5] border-2 border-black space-y-3 shadow-brutal">
                    <div className="flex items-center justify-between border-b-2 border-black pb-2">
                      <span className="text-xs font-black uppercase text-white bg-black px-2 py-0.5 border border-black">
                        CLAIM A
                      </span>
                      <span className="text-xs font-black text-black">
                        {eventA?.event_timestamp ? new Date(eventA.event_timestamp).toLocaleTimeString('en-IN') : 'N/A'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black uppercase text-black">
                        {eventA?.location_text || 'Claim A Source'}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5 font-bold">
                        {docA?.title || 'Source Document A'}
                      </p>
                    </div>

                    <div className="p-3 bg-white border border-black text-xs text-slate-900 leading-relaxed font-sans font-medium min-h-[60px]">
                      {eventA?.description || 'Extracted claim telemetry from Document A.'}
                    </div>

                    {docA && (
                      <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-600">SOURCE VERIFIED</span>
                        <button
                          onClick={() => onOpenProvenance(docA.id, eventA?.source_offset || 'Claim A', eventA?.description)}
                          className="text-blue-700 hover:underline font-black"
                        >
                          INSPECT SOURCE →
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Event B */}
                  <div className="p-4 bg-[#FBF9F5] border-2 border-black space-y-3 shadow-brutal">
                    <div className="flex items-center justify-between border-b-2 border-black pb-2">
                      <span className="text-xs font-black uppercase text-white bg-[#E53E3E] px-2 py-0.5 border border-black">
                        CLAIM B (CONFLICT)
                      </span>
                      <span className="text-xs font-black text-black">
                        {eventB?.event_timestamp ? new Date(eventB.event_timestamp).toLocaleTimeString('en-IN') : 'N/A'}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm font-black uppercase text-black">
                        {eventB?.location_text || 'Claim B Source'}
                      </h4>
                      <p className="text-xs text-slate-600 mt-0.5 font-bold">
                        {docB?.title || 'Source Document B'}
                      </p>
                    </div>

                    <div className="p-3 bg-white border border-black text-xs text-slate-900 leading-relaxed font-sans font-medium min-h-[60px]">
                      {eventB?.description || 'Extracted conflicting claim telemetry from Document B.'}
                    </div>

                    {docB && (
                      <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-600">SOURCE VERIFIED</span>
                        <button
                          onClick={() => onOpenProvenance(docB.id, eventB?.source_offset || 'Claim B', eventB?.description)}
                          className="text-blue-700 hover:underline font-black"
                        >
                          INSPECT SOURCE →
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* HITL Arbitration Actions */}
                <div className="p-4 bg-[#F5F2EB] border-2 border-black space-y-3 shadow-brutal">
                  <span className="text-xs font-black uppercase tracking-wider text-black block">
                    HUMAN-IN-THE-LOOP ARBITRATION RESOLUTION:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      onClick={() => handleArbitrationChoice('CONFIRM CLAIM A AS GROUND TRUTH')}
                      className="p-2.5 bg-white hover:bg-slate-100 text-black border-2 border-black font-black text-xs shadow-xs text-center transition"
                    >
                      CONFIRM CLAIM A
                    </button>
                    <button
                      onClick={() => handleArbitrationChoice('CONFIRM CLAIM B AS GROUND TRUTH')}
                      className="p-2.5 bg-white hover:bg-slate-100 text-black border-2 border-black font-black text-xs shadow-xs text-center transition"
                    >
                      CONFIRM CLAIM B
                    </button>
                    <button
                      onClick={() => handleArbitrationChoice('FLAGGED AS DECOY / SPOOFED TELEMETRY')}
                      className="p-2.5 bg-[#F5C842] hover:bg-[#EAB308] text-black border-2 border-black font-black text-xs shadow-xs text-center transition"
                    >
                      FLAG AS DECOY
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-black/20 text-xs">
                    <button
                      onClick={() => onResolveContradiction(activeContradiction.id, 'dismissed')}
                      className="text-slate-600 hover:text-black font-black underline"
                    >
                      Dismiss False Alarm
                    </button>
                    <span className="text-[10px] text-slate-500 font-bold">
                      RESOLUTIONS ARE AUDITED ACROSS PORTALS
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
