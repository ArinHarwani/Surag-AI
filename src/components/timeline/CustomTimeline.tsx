'use client';

import React, { useState, useMemo } from 'react';
import { useInvestigation } from '@/lib/store/investigation-context';
import { Event, TimestampConfidence } from '@/types/investigation';
import { formatDateIST, formatTimeIST } from '@/lib/utils/formatDate';
import {
  Clock,
  FileSearch,
  MapPin,
  AlertOctagon,
  CheckCircle2,
  HelpCircle,
  Eye,
  Filter,
  Layers,
} from 'lucide-react';

export function CustomTimeline() {
  const {
    events,
    documents,
    agencies,
    activeAgency,
    contradictions,
    selectedEvent,
    setSelectedEvent,
    setProvenanceFocus,
  } = useInvestigation();

  const [confidenceFilter, setConfidenceFilter] = useState<string>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');

  // Filter and sort events chronologically (sacred timeline order)
  const sortedEvents = useMemo(() => {
    let list = [...events];

    // Filter by agency if in agency view
    if (activeAgency) {
      const targetAgencyId = agencies[activeAgency]?.id;
      if (targetAgencyId) {
        list = list.filter((e) => {
          const doc = documents.find((d) => d.id === e.document_id);
          return doc?.agency_id === targetAgencyId;
        });
      }
    }

    // Filter by sector dropdown
    if (sectorFilter === 'jodhpur') {
      list = list.filter((e) => e.location_text.toLowerCase().includes('jodhpur') || e.location_text.toLowerCase().includes('mandore') || e.location_text.toLowerCase().includes('bilara'));
    } else if (sectorFilter === 'kota') {
      list = list.filter((e) => e.location_text.toLowerCase().includes('kota') || e.location_text.toLowerCase().includes('vigyan'));
    }

    // Filter by timestamp confidence
    if (confidenceFilter !== 'all') {
      list = list.filter((e) => e.event_timestamp_confidence === confidenceFilter);
    }

    return list.sort((a, b) => new Date(a.event_timestamp).getTime() - new Date(b.event_timestamp).getTime());
  }, [events, documents, activeAgency, agencies, sectorFilter, confidenceFilter]);

  const getConfidenceBadge = (conf: TimestampConfidence) => {
    switch (conf) {
      case 'exact':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
            EXACT TIME
          </span>
        );
      case 'approximate':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-950/80 text-amber-400 border border-amber-800">
            APPROXIMATE
          </span>
        );
      case 'inferred':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-950/80 text-purple-400 border border-purple-800">
            INFERRED
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
      {/* Timeline Controls Header */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded text-cyan-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-100 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <span>Sacred Forensic Timeline</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded">
                Dual Timestamp Verified
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">Real-world event time vs exact source offset</p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 outline-none"
          >
            <option value="all">All Jurisdictions</option>
            <option value="jodhpur">Jodhpur Sector</option>
            <option value="kota">Kota Sector</option>
          </select>

          <select
            value={confidenceFilter}
            onChange={(e) => setConfidenceFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 outline-none"
          >
            <option value="all">All Timestamp Types</option>
            <option value="exact">Exact Only</option>
            <option value="approximate">Approximate Only</option>
            <option value="inferred">Inferred Only</option>
          </select>
        </div>
      </div>

      {/* Timeline Scrollable Track */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sortedEvents.length === 0 ? (
          <div className="py-16 text-center text-slate-500 font-mono text-xs space-y-2">
            <Clock className="w-8 h-8 mx-auto text-slate-600 mb-1" />
            <p className="text-slate-400 font-semibold">No Timeline Events Recorded Yet</p>
            <p className="text-[11px] text-slate-600 max-w-xs mx-auto">
              Deposit evidence files into the vault. Extracted events with dual real-world timestamps and source offsets will appear here.
            </p>
          </div>
        ) : (
          sortedEvents.map((evt, idx) => {
          const doc = documents.find((d) => d.id === evt.document_id);
          const isJodhpur =
            doc?.agency_id === agencies.jodhpur?.id ||
            evt.location_text.toLowerCase().includes('jodhpur') ||
            evt.location_text.toLowerCase().includes('mandore') ||
            evt.location_text.toLowerCase().includes('bilara');

          const isContradiction = contradictions.some(
            (c) => (c.event_a_id === evt.id || c.event_b_id === evt.id) && c.status === 'flagged'
          );

          const isSelected = selectedEvent?.id === evt.id;

          const formattedDate = formatDateIST(evt.event_timestamp);
          const formattedTime = formatTimeIST(evt.event_timestamp, true);

          return (
            <div
              key={evt.id}
              onClick={() => setSelectedEvent(evt)}
              className={`relative pl-7 transition-all cursor-pointer group ${
                isSelected ? 'scale-[1.01]' : ''
              }`}
            >
              {/* Vertical connecting line */}
              {idx < sortedEvents.length - 1 && (
                <div className="absolute left-3 top-6 bottom-[-16px] w-0.5 bg-slate-800 group-hover:bg-slate-700" />
              )}

              {/* Timeline marker node */}
              <div
                className={`absolute left-1.5 top-1.5 w-3.5 h-3.5 rounded-full border-2 transition-all ${
                  isContradiction
                    ? 'bg-rose-500 border-rose-300 ring-4 ring-rose-500/20 animate-pulse'
                    : isJodhpur
                    ? 'bg-cyan-500 border-cyan-300'
                    : 'bg-amber-500 border-amber-300'
                }`}
              />

              {/* Event Card */}
              <div
                className={`p-3.5 rounded-lg border transition-all ${
                  isContradiction
                    ? 'bg-rose-950/20 border-rose-600/40 hover:border-rose-500'
                    : isSelected
                    ? 'bg-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                {/* Event Header: Real-World Time & Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span suppressHydrationWarning className="font-mono text-xs font-bold text-slate-200">
                      {formattedDate} • {formattedTime}
                    </span>
                    {getConfidenceBadge(evt.event_timestamp_confidence)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Agency Origin Badge */}
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        isJodhpur
                          ? 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {isJodhpur ? 'Jodhpur Police' : 'Kota Police'}
                    </span>

                    {/* Overall AI Grounding Confidence */}
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-900 px-1.5 py-0.5 rounded">
                      {Math.round(evt.confidence * 100)}% Conf
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-200 leading-relaxed font-sans mb-2.5">
                  {evt.description}
                </p>

                {/* Contradiction Alert if part of conflict */}
                {isContradiction && (
                  <div className="mb-2.5 p-2 bg-rose-950/70 border border-rose-500/40 rounded flex items-center gap-2 text-rose-300 text-xs font-mono">
                    <AlertOctagon className="w-4 h-4 shrink-0 text-rose-400 animate-pulse" />
                    <span>CONTRADICTION DETECTED: Physical transit or alibi conflict with other case events.</span>
                  </div>
                )}

                {/* Footer: Sacred Source Offset & Provenance Inspector */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                  {/* Location & Sacred Offset */}
                  <div className="flex items-center gap-3 text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      <span>{evt.location_text}</span>
                    </span>
                    <span>•</span>
                    <span className="bg-slate-950 px-2 py-0.5 rounded text-amber-300 border border-amber-900/40">
                      Offset: {evt.source_offset}
                    </span>
                  </div>

                  {/* Provenance Inspection Trigger */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setProvenanceFocus({
                        documentId: evt.document_id,
                        sourceOffset: evt.source_offset,
                        title: doc?.title,
                        mediaType: doc?.file_type,
                        snippet: doc?.content_text,
                      });
                    }}
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 hover:underline transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Provenance</span>
                  </button>
                </div>
              </div>
            </div>
          );
        }))}
      </div>
    </div>
  );
}
