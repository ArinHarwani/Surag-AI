'use client';

import React, { useState } from 'react';
import { useInvestigation } from '@/lib/store/investigation-context';
import {
  AlertOctagon,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { formatTimeIST } from '@/lib/utils/formatDate';

export function ContradictionBanner() {
  const {
    contradictions,
    events,
    documents,
    updateContradictionStatus,
    setSelectedEvent,
    setProvenanceFocus,
  } = useInvestigation();

  const flaggedContradictions = contradictions.filter((c) => c.status === 'flagged');
  const [isExpanded, setIsExpanded] = useState(true);

  if (flaggedContradictions.length === 0) return null;

  return (
    <div className="bg-rose-950/90 border-b border-rose-500/50 text-slate-100 backdrop-blur z-30 transition-all">
      <div className="max-w-[1920px] mx-auto px-4 py-2">
        {/* Banner Alert Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-rose-500/20 border border-rose-500/40 rounded text-rose-400 animate-pulse">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-900 text-rose-200 border border-rose-700">
                  CRITICAL CONTRADICTION ALERT ({flaggedContradictions.length})
                </span>
                <span className="text-xs font-semibold text-rose-200">
                  Deterministic conflict detected between cross-agency statements & optical telemetry
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-mono text-rose-300 hover:text-white flex items-center gap-1 bg-rose-900/50 border border-rose-700/60 px-2.5 py-1 rounded transition"
          >
            <span>{isExpanded ? 'Collapse Details' : 'Expand Details'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expanded Contradiction Cards */}
        {isExpanded && (
          <div className="mt-3 space-y-3 pb-1">
            {flaggedContradictions.map((con) => {
              const evtA = events.find((e) => e.id === con.event_a_id);
              const evtB = events.find((e) => e.id === con.event_b_id);
              const docA = documents.find((d) => d.id === evtA?.document_id);
              const docB = documents.find((d) => d.id === evtB?.document_id);

              return (
                <div
                  key={con.id}
                  className="bg-slate-950/90 border border-rose-500/40 rounded-lg p-3.5 shadow-lg space-y-3"
                >
                  {/* Contradiction Plain-Language Explanation */}
                  <div className="text-xs text-slate-100 font-sans leading-relaxed bg-rose-950/40 p-2.5 rounded border border-rose-900/60">
                    <span className="font-bold text-rose-300 font-mono mr-1">
                      [{con.type.toUpperCase()} CONTRADICTION]:
                    </span>
                    {con.description}
                  </div>

                  {/* Conflicting Event Comparison Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                    {/* Event A (Jodhpur side) */}
                    <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-cyan-400 font-bold">
                        <span>EVENT A (Recorded Evidence)</span>
                        <span>Offset: {evtA?.source_offset || 'Line 14-22'}</span>
                      </div>
                      <div className="text-slate-200">{evtA?.description}</div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-cyan-400" />
                          <span>{evtA?.location_text}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-cyan-400" />
                          <span suppressHydrationWarning>
                            {evtA?.event_timestamp ? formatTimeIST(evtA.event_timestamp, false) : ''}
                          </span>
                        </span>
                      </div>
                      {evtA && (
                        <button
                          onClick={() => {
                            setSelectedEvent(evtA);
                            setProvenanceFocus({
                              documentId: evtA.document_id,
                              sourceOffset: evtA.source_offset,
                              title: docA?.title,
                              mediaType: docA?.file_type,
                              snippet: docA?.content_text,
                            });
                          }}
                          className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mt-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect Event A Source File</span>
                        </button>
                      )}
                    </div>

                    {/* Event B (Kota side) */}
                    <div className="p-2.5 bg-slate-900/80 border border-slate-800 rounded space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-amber-400 font-bold">
                        <span>EVENT B (Conflicting Claim)</span>
                        <span>Offset: {evtB?.source_offset || 'Line 1-8'}</span>
                      </div>
                      <div className="text-slate-200">{evtB?.description}</div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-400" />
                          <span>{evtB?.location_text}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span suppressHydrationWarning>
                            {evtB?.event_timestamp ? formatTimeIST(evtB.event_timestamp, false) : ''}
                          </span>
                        </span>
                      </div>
                      {evtB && (
                        <button
                          onClick={() => {
                            setSelectedEvent(evtB);
                            setProvenanceFocus({
                              documentId: evtB.document_id,
                              sourceOffset: evtB.source_offset,
                              title: docB?.title,
                              mediaType: docB?.file_type,
                              snippet: docB?.content_text,
                            });
                          }}
                          className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 mt-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Inspect Event B Source File</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Human-in-the-Loop Confirmation / Dismissal */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs font-mono">
                    <span className="text-slate-400">Human-in-the-Loop Analyst Action:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateContradictionStatus(con.id, 'dismissed')}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-semibold flex items-center gap-1 transition"
                      >
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Dismiss as False Alarm</span>
                      </button>

                      <button
                        onClick={() => updateContradictionStatus(con.id, 'reviewed')}
                        className="px-3.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-semibold flex items-center gap-1 shadow transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Contradiction (Bust Alibi)</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
