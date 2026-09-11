'use client';

import React, { useState } from 'react';
import { 
  FolderArchive, 
  Network, 
  ShieldCheck, 
  AlertOctagon, 
  Lock, 
  UploadCloud, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  Clock,
  Radio,
  FileText,
  Activity,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Document, Entity, Relationship, Contradiction, Event } from '@/types/investigation';

interface NexusOverviewProps {
  documents: Document[];
  entities: Entity[];
  relationships: Relationship[];
  contradictions: Contradiction[];
  events: Event[];
  onOpenUpload: () => void;
  onSelectTab: (tab: any) => void;
  onConfirmRelationship: (relId: string) => void;
  onDismissRelationship: (relId: string) => void;
  onOpenProvenance: (docId: string, offset: string, snippet?: string) => void;
}

export const NexusOverview: React.FC<NexusOverviewProps> = ({
  documents,
  entities,
  relationships,
  contradictions,
  events,
  onOpenUpload,
  onSelectTab,
  onConfirmRelationship,
  onDismissRelationship,
  onOpenProvenance
}) => {
  const [expandedHypothesis, setExpandedHypothesis] = useState(true);

  const pendingRelationships = relationships.filter((r) => r.status === 'ai_suggested');
  const flaggedContradictions = contradictions.filter((c) => c.status === 'flagged');

  return (
    <div className="space-y-6 font-mono select-none">
      {/* 1. Row of 5 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* KPI 1: Ingested Evidence */}
        <div className="p-4 rounded bg-[#EDE9E0] border-l-4 border-l-[#0284C7] shadow-sm text-slate-950 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[10px] uppercase font-bold tracking-wider">INGESTED EVIDENCE</span>
            <FolderArchive className="w-4 h-4 text-[#0284C7]" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-black tracking-tight">{documents.length}</span>
            <span className="text-xs text-slate-600 ml-1">DOSSIERS</span>
          </div>
          <div className="text-[10px] text-slate-600 flex items-center justify-between pt-1 border-t border-slate-300">
            <span>MULTI-MODAL</span>
            <span className="text-emerald-700 font-bold">100% CUSTODY HASH</span>
          </div>
        </div>

        {/* KPI 2: Tracked Entities */}
        <div className="p-4 rounded bg-[#EDE9E0] border-l-4 border-l-[#F4C430] shadow-sm text-slate-950 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[10px] uppercase font-bold tracking-wider">TRACKED ENTITIES</span>
            <Network className="w-4 h-4 text-[#D97706]" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-black tracking-tight">{entities.length}</span>
            <span className="text-xs text-slate-600 ml-1">SUBJECTS</span>
          </div>
          <div className="text-[10px] text-slate-600 flex items-center justify-between pt-1 border-t border-slate-300">
            <span>GRAPH TOPOLOGY</span>
            <span className="text-[#B45309] font-bold">2 CROSS-AGENCY</span>
          </div>
        </div>

        {/* KPI 3: AI Inference Confidence */}
        <div className="p-4 rounded bg-[#EDE9E0] border-l-4 border-l-emerald-600 shadow-sm text-slate-950 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[10px] uppercase font-bold tracking-wider">AI CONFIDENCE</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-black tracking-tight">91.4%</span>
            <span className="text-xs text-slate-600 ml-1">AVG CONF</span>
          </div>
          <div className="text-[10px] text-slate-600 flex items-center justify-between pt-1 border-t border-slate-300">
            <span>RAW SCORE MAP</span>
            <span className="text-emerald-700 font-bold">HIGH CONFIDENCE</span>
          </div>
        </div>

        {/* KPI 4: Contradictions */}
        <div className="p-4 rounded bg-[#EDE9E0] border-l-4 border-l-red-600 shadow-sm text-slate-950 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[10px] uppercase font-bold tracking-wider">CONTRADICTIONS</span>
            <AlertOctagon className="w-4 h-4 text-red-600" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-black tracking-tight text-red-700">{flaggedContradictions.length}</span>
            <span className="text-xs text-red-700 font-bold ml-1">ACTIVE</span>
          </div>
          <div className="text-[10px] text-slate-600 flex items-center justify-between pt-1 border-t border-slate-300">
            <span>PHYSICAL SPEED</span>
            <span className="text-red-700 font-black animate-pulse">FLAGGED CRITICAL</span>
          </div>
        </div>

        {/* KPI 5: Crypto-Locks */}
        <div className="p-4 rounded bg-[#EDE9E0] border-l-4 border-l-purple-600 shadow-sm text-slate-950 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600">
            <span className="text-[10px] uppercase font-bold tracking-wider">CRYPTO-LOCKS</span>
            <Lock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-black tracking-tight">4/4</span>
            <span className="text-xs text-slate-600 ml-1">SEALED</span>
          </div>
          <div className="text-[10px] text-slate-600 flex items-center justify-between pt-1 border-t border-slate-300">
            <span>EVIDENCE CUSTODY</span>
            <span className="text-purple-800 font-bold">SHA-256 INTACT</span>
          </div>
        </div>
      </div>

      {/* 2. Two-Column Panel Row: Ingestion Drop-Zone + Live Pipeline Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left (7 cols): Ingestion Drop-Zone */}
        <div className="lg:col-span-7 bg-[#111318] border border-[#232731] rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <UploadCloud className="w-4 h-4 text-[#F4C430]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                INGESTION GATEWAY // MULTI-MODAL EVIDENCE VAULT
              </h3>
            </div>
            <span className="text-[10px] bg-[#1C202A] text-slate-400 px-2 py-0.5 rounded border border-[#2A2F3D]">
              TRACK A / TRACK B SYNC
            </span>
          </div>

          <div
            onClick={onOpenUpload}
            className="border-2 border-dashed border-[#2E3444] hover:border-[#F4C430] bg-[#090A0D]/80 hover:bg-[#090A0D] p-6 rounded-lg text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 group"
          >
            <div className="p-3 rounded-full bg-[#161920] group-hover:bg-[#F4C430]/10 text-slate-400 group-hover:text-[#F4C430] transition">
              <UploadCloud className="w-7 h-7" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                DRAG &amp; DROP EVIDENCE FILE OR CLICK TO BROWSE
              </p>
              <p className="text-[11px] text-slate-500 mt-1 font-sans">
                Accepts Witness Statements (.txt), ANPR CCTV Frames (.png), Radio Wiretaps (.mp3), Video (.mp4)
              </p>
            </div>
            <div className="flex items-center space-x-2 pt-1">
              {['.TXT', '.PNG', '.MP3', '.MP4', '.JSON'].map((ext) => (
                <span key={ext} className="text-[9px] font-bold bg-[#1C202A] text-slate-300 px-2 py-0.5 rounded border border-[#2A2F3D]">
                  {ext}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400">
            <span>SUPPORTED: TEXT OCR, AUDIO DIARIZATION, OPTICAL BBOX</span>
            <button
              onClick={() => onSelectTab('vault')}
              className="text-[#F4C430] hover:underline flex items-center space-x-1 font-bold"
            >
              <span>OPEN FULL EVIDENCE VAULT ({documents.length})</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right (5 cols): Live Pipeline Ticker */}
        <div className="lg:col-span-5 bg-[#111318] border border-[#232731] rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                LIVE PIPELINE TICKER
              </h3>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>4 JOBS IDLE / READY</span>
            </span>
          </div>

          {/* Progress Bar Ticker Jobs */}
          <div className="space-y-3 my-1">
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-slate-300 font-bold">1. OPTICAL CCTV / ANPR OCR</span>
                <span className="text-emerald-400 font-bold">100% COMPLETE</span>
              </div>
              <div className="w-full h-1.5 bg-[#1C202A] rounded overflow-hidden">
                <div className="h-full bg-emerald-500 w-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-slate-300 font-bold">2. WIRETAP AUDIO DIARIZATION</span>
                <span className="text-emerald-400 font-bold">100% TIMECODED</span>
              </div>
              <div className="w-full h-1.5 bg-[#1C202A] rounded overflow-hidden">
                <div className="h-full bg-emerald-500 w-full" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-slate-300 font-bold">3. POSTGRES GRAPH RELATION DEDUCTION</span>
                <span className="text-[#F4C430] font-bold">91.4% CONF</span>
              </div>
              <div className="w-full h-1.5 bg-[#1C202A] rounded overflow-hidden">
                <div className="h-full bg-[#F4C430] w-[91%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-slate-300 font-bold">4. DETERMINISTIC SPATIOTEMPORAL SCAN</span>
                <span className="text-red-400 font-bold">1 CONFLICT DETECTED</span>
              </div>
              <div className="w-full h-1.5 bg-[#1C202A] rounded overflow-hidden">
                <div className="h-full bg-red-500 w-full" />
              </div>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[#1E232E] text-[10px] text-slate-500 flex items-center justify-between">
            <span>ZERO SILENT TRUTH: HITL CONFIRMATION REQUIRED</span>
            <span className="text-slate-300 font-bold">GROQ LLAMA-3.3-70B</span>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Pending Hypotheses & Contradiction Center Teaser */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left (7 cols): Pending Hypotheses & AI Suggestions */}
        <div className="lg:col-span-7 bg-[#111318] border border-[#232731] rounded-lg p-5">
          <div className="flex items-center justify-between mb-3 border-b border-[#1E232E] pb-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#F4C430]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                PENDING HYPOTHESES &amp; AI SUGGESTIONS ({pendingRelationships.length})
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">HUMAN-IN-THE-LOOP (HITL)</span>
          </div>

          <div className="space-y-2.5">
            {pendingRelationships.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                All AI suggestions verified. No pending relationship hypotheses.
              </div>
            ) : (
              pendingRelationships.map((rel) => {
                const sourceEnt = entities.find((e) => e.id === rel.source_entity_id);
                const targetEnt = entities.find((e) => e.id === rel.target_entity_id);

                return (
                  <div
                    key={rel.id}
                    className="p-3 bg-[#EDE9E0] rounded border-l-4 border-l-[#F4C430] text-slate-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="space-y-1 max-w-md">
                      <div className="flex items-center space-x-2 text-[10px]">
                        <span className="bg-black text-[#F4C430] px-1.5 py-0.2 rounded font-black uppercase">
                          AI SUGGESTION
                        </span>
                        <span className="font-bold text-slate-700">
                          {Math.round(rel.confidence * 100)}% CONFIDENCE
                        </span>
                      </div>
                      <p className="text-xs font-bold leading-tight">
                        <span className="text-[#0284C7]">{sourceEnt?.name || 'Subject A'}</span>
                        <span className="text-slate-600 font-mono text-[11px] mx-1.5">[{rel.relationship_type.toUpperCase()}]</span>
                        <span className="text-[#D97706]">{targetEnt?.name || 'Subject B'}</span>
                      </p>
                      <p className="text-[11px] text-slate-700 font-sans line-clamp-1">
                        {rel.description}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => onConfirmRelationship(rel.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-black tracking-wider transition shadow active:scale-95"
                      >
                        CONFIRM FACT
                      </button>
                      <button
                        onClick={() => onDismissRelationship(rel.id)}
                        className="px-2 py-1 bg-slate-300 hover:bg-red-200 text-slate-800 hover:text-red-900 rounded text-[10px] font-bold transition"
                      >
                        DISMISS
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right (5 cols): Contradiction Center Teaser */}
        <div className="lg:col-span-5 bg-[#111318] border border-red-900/60 rounded-lg p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 border-b border-[#1E232E] pb-2">
            <div className="flex items-center space-x-2">
              <AlertOctagon className="w-4 h-4 text-red-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-red-400">
                CRITICAL CONTRADICTION TEASER
              </h3>
            </div>
            <span className="text-[10px] bg-red-950 text-red-300 border border-red-800 px-2 py-0.5 rounded font-black animate-pulse">
              1 IMPOSSIBILITY
            </span>
          </div>

          <div className="p-3.5 bg-red-950/40 border border-red-800/80 rounded space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-red-300 font-bold uppercase">TEMPORAL PHYSICS CONFLICT</span>
              <span className="text-slate-400 font-mono">DELTA: 15 MINS</span>
            </div>
            <p className="text-xs font-bold text-white leading-relaxed">
              Aarav Singh sighted at Jodhpur Clock Tower (22:30 IST) vs Chambal River Bridge Kota (22:45 IST).
            </p>
            <div className="p-2 rounded bg-black/60 text-[10px] text-red-300 font-mono">
              390 KM IN 15 MINS &gt; 1,560 KM/H REQUIRED VELOCITY
            </div>
          </div>

          <div className="mt-4 pt-2 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">STATUS: FLAGGED FOR ARBITRATION</span>
            <button
              onClick={() => onSelectTab('contradictions')}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-black flex items-center space-x-1 transition shadow-md shadow-red-600/30"
            >
              <span>OPEN ARBITRATION CENTER</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
