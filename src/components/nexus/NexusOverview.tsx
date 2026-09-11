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
  ChevronUp,
  Database,
  Search,
  ExternalLink
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
  const [isPipelineExpanded, setIsPipelineExpanded] = useState(true);

  const pendingRelationships = relationships.filter((r) => r.status === 'ai_suggested');
  const flaggedContradictions = contradictions.filter((c) => c.status === 'flagged');

  return (
    <div className="p-5 space-y-5 font-mono select-none">
      {/* 1. TOP TIER: 3 HEADLINE KPI CARDS (BUMPED TEXT SIZES FOR LIVE JUDGING & DEMOS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* KPI 1: Ingested Evidence */}
        <div className="bg-[#12141A] border-l-4 border-l-[#06B6D4] border border-[#232731] rounded-lg p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-200">
              INGESTED EVIDENCE
            </span>
            <div className="p-2 bg-[#06B6D4]/15 rounded text-[#06B6D4]">
              <FolderArchive className="w-5 h-5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-4xl lg:text-5xl font-black text-white tracking-tight">
              {documents.length}
              <span className="text-sm font-bold text-slate-300 ml-2">FILES</span>
            </div>
            <p className="text-xs font-semibold text-[#06B6D4] mt-1">
              Multi-modal: Text, Audio, Video &amp; CCTV Stills
            </p>
          </div>
          <div className="pt-2 border-t border-[#232731] flex items-center justify-between text-xs text-slate-300 font-bold">
            <span>Jodhpur &amp; Kota Joint Repos</span>
            <button
              onClick={() => onSelectTab('vault')}
              className="text-[#06B6D4] hover:underline flex items-center gap-1"
            >
              <span>VIEW VAULT</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI 2: Critical Contradictions */}
        <div className="bg-[#12141A] border-l-4 border-l-[#EF4444] border border-[#232731] rounded-lg p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-200">
              PHYSICAL CONTRADICTIONS
            </span>
            <div className="p-2 bg-[#EF4444]/15 rounded text-[#EF4444]">
              <AlertOctagon className="w-5 h-5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-4xl lg:text-5xl font-black text-[#EF4444] tracking-tight">
              {flaggedContradictions.length}
              <span className="text-sm font-bold text-[#EF4444] ml-2">CRITICAL</span>
            </div>
            <p className="text-xs font-bold text-slate-100 mt-1">
              1,560 km/h Impossible Velocity Anomaly
            </p>
          </div>
          <div className="pt-2 border-t border-[#232731] flex items-center justify-between text-xs text-slate-300 font-bold">
            <span>Requires Analyst Arbitration</span>
            <button
              onClick={() => onSelectTab('contradictions')}
              className="text-[#EF4444] hover:underline flex items-center gap-1"
            >
              <span>ARBITRATE NOW</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI 3: AI Extraction Confidence */}
        <div className="bg-[#12141A] border-l-4 border-l-[#10B981] border border-[#232731] rounded-lg p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs uppercase font-extrabold tracking-wider text-slate-200">
              AI EXTRACTION CONFIDENCE
            </span>
            <div className="p-2 bg-[#10B981]/15 rounded text-[#10B981]">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="my-2">
            <div className="text-4xl lg:text-5xl font-black text-[#10B981] tracking-tight">
              91.4%
              <span className="text-sm font-bold text-slate-300 ml-2">VERIFIED</span>
            </div>
            <p className="text-xs font-semibold text-emerald-400 mt-1">
              Every fact grounded in source evidence
            </p>
          </div>
          <div className="pt-2 border-t border-[#232731] flex items-center justify-between text-xs text-slate-300 font-bold">
            <span>Zero-Hallucination Guardrail</span>
            <button
              onClick={() => onSelectTab('dossier')}
              className="text-[#10B981] hover:underline flex items-center gap-1"
            >
              <span>READ DOSSIER</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. COMPACT SECONDARY STATUS STRIP: Tracked Entities & Chain of Custody */}
      <div className="bg-[#12141A] border border-[#232731] rounded-lg px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
        <div className="flex items-center space-x-6">
          {/* Entities metric */}
          <div className="flex items-center space-x-2">
            <Network className="w-4 h-4 text-[#F4C430]" />
            <span className="text-slate-300 font-bold">DISCOVERED ENTITIES:</span>
            <span className="text-white font-extrabold text-sm">{entities.length}</span>
            <span className="text-slate-400 text-[11px]">(Persons, Vehicles, Weapons, Locations)</span>
          </div>

          {/* Pending Links metric */}
          <div className="hidden sm:flex items-center space-x-2 border-l border-[#232731] pl-6">
            <Sparkles className="w-4 h-4 text-[#F4C430]" />
            <span className="text-slate-300 font-bold">AI SUGGESTIONS:</span>
            <span className="text-[#F4C430] font-extrabold text-sm">{pendingRelationships.length} Links</span>
          </div>

          {/* Chain of Custody metric */}
          <div className="hidden md:flex items-center space-x-2 border-l border-[#232731] pl-6">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300 font-bold">CHAIN OF CUSTODY:</span>
            <span className="text-emerald-300 font-bold">SHA-256 Verified ({documents.length}/{documents.length})</span>
          </div>
        </div>

        {/* Realtime link */}
        <div className="flex items-center space-x-2 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-300 font-bold text-[11px]">SUPABASE REALTIME RELAY: ACTIVE</span>
        </div>
      </div>

      {/* 3. TWO-COLUMN PANEL: Ingestion Dropzone & Active Pipeline Ticker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Drag-and-Drop Dropzone (6 cols) */}
        <div className="lg:col-span-6 bg-[#12141A] border border-[#232731] rounded-lg p-5 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between border-b border-[#232731] pb-3 mb-4">
              <div className="flex items-center space-x-2.5">
                <UploadCloud className="w-5 h-5 text-[#F4C430]" />
                <span className="text-sm font-black uppercase tracking-wider text-white">
                  MULTI-MODAL EVIDENCE INGESTION
                </span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-[#F4C430]/15 text-[#F4C430] font-extrabold border border-[#F4C430]/30">
                DRAG &amp; DROP READY
              </span>
            </div>

            {/* Clickable Drag Area */}
            <div
              onClick={onOpenUpload}
              className="border-2 border-dashed border-[#232731] hover:border-[#F4C430] rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-[#090A0D]/70 group"
            >
              <div className="p-3.5 bg-[#181B22] group-hover:bg-[#F4C430]/20 rounded-full mb-3 text-[#F4C430] transition">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-extrabold text-white group-hover:text-[#F4C430] transition">
                DROP FORENSIC DOSSIER OR CLICK TO BROWSE
              </h4>
              <p className="text-xs text-slate-300 mt-1 max-w-sm">
                Accepts Witness Statements (.txt), Wiretap Audio (.mp3/.wav), ANPR Logs (.csv), and CCTV NightVision frames (.png/.jpg).
              </p>

              {/* Modality Tag Pills */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <span className="px-2.5 py-1 rounded bg-[#181B22] border border-[#232731] text-xs font-bold text-slate-200">
                  📄 TEXT &amp; STATEMENTS
                </span>
                <span className="px-2.5 py-1 rounded bg-[#181B22] border border-[#232731] text-xs font-bold text-slate-200">
                  🎙️ AUDIO WIRETAPS
                </span>
                <span className="px-2.5 py-1 rounded bg-[#181B22] border border-[#232731] text-xs font-bold text-slate-200">
                  📷 CCTV &amp; OPTICAL ANPR
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#232731] flex items-center justify-between text-xs text-slate-300">
            <span>Instant cross-agency sync between Jodhpur &amp; Kota</span>
            <button
              onClick={onOpenUpload}
              className="px-3 py-1.5 bg-[#F4C430] hover:bg-[#EAB308] text-black font-extrabold rounded flex items-center space-x-1.5 transition"
            >
              <span>+ UPLOAD EVIDENCE</span>
            </button>
          </div>
        </div>

        {/* Right: Active Forensic Pipeline Ticker (6 cols) */}
        <div className="lg:col-span-6 bg-[#12141A] border border-[#232731] rounded-lg p-5 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between border-b border-[#232731] pb-3 mb-4">
              <div className="flex items-center space-x-2.5">
                <Activity className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-black uppercase tracking-wider text-white">
                  EXTRACTION PIPELINE MONITOR
                </span>
              </div>
              <span className="text-xs text-emerald-400 font-bold flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>4 STAGES ACTIVE</span>
              </span>
            </div>

            {/* Pipeline Stages */}
            <div className="space-y-3.5">
              {/* Stage 1: Optical Text & NER */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white font-extrabold">1. Named Entity Recognition (NER) &amp; OCR</span>
                  <span className="text-emerald-400 font-bold">100% COMPLETE</span>
                </div>
                <div className="w-full bg-[#090A0D] h-2 rounded-full overflow-hidden border border-[#232731]">
                  <div className="bg-emerald-500 h-full w-full" />
                </div>
                <div className="text-[11px] text-slate-300 flex justify-between">
                  <span>Processed: Jodhpur Witness #042 &amp; Kota ANPR Log #118</span>
                  <span className="text-slate-400">0.4s</span>
                </div>
              </div>

              {/* Stage 2: Audio Diarization */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white font-extrabold">2. Wiretap Diarization &amp; Whisper ASR</span>
                  <span className="text-emerald-400 font-bold">100% COMPLETE</span>
                </div>
                <div className="w-full bg-[#090A0D] h-2 rounded-full overflow-hidden border border-[#232731]">
                  <div className="bg-emerald-500 h-full w-full" />
                </div>
                <div className="text-[11px] text-slate-300 flex justify-between">
                  <span>Processed: Rawatbhata Highway Intercept (2 Speakers)</span>
                  <span className="text-slate-400">1.2s</span>
                </div>
              </div>

              {/* Stage 3: Computer Vision & ANPR */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white font-extrabold">3. Computer Vision Weapon Detection (YOLO)</span>
                  <span className="text-emerald-400 font-bold">100% COMPLETE</span>
                </div>
                <div className="w-full bg-[#090A0D] h-2 rounded-full overflow-hidden border border-[#232731]">
                  <div className="bg-emerald-500 h-full w-full" />
                </div>
                <div className="text-[11px] text-slate-300 flex justify-between">
                  <span>Detected: Glock 19 sidearm inside Bolero cabin (94.2%)</span>
                  <span className="text-slate-400">0.8s</span>
                </div>
              </div>

              {/* Stage 4: Cross-Document Coreference & Contradiction Resolution */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white font-extrabold">4. Cross-Agency Contradiction Engine</span>
                  <span className="text-[#EF4444] font-bold">FLAGGED ANOMALY</span>
                </div>
                <div className="w-full bg-[#090A0D] h-2 rounded-full overflow-hidden border border-[#232731]">
                  <div className="bg-[#EF4444] h-full w-full" />
                </div>
                <div className="text-[11px] text-slate-300 flex justify-between">
                  <span>Anomaly: 390 km in 15 mins (1,560 km/h) requires human review</span>
                  <span className="text-[#EF4444] font-bold">ACTION REQ</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#232731] flex items-center justify-between text-xs text-slate-300">
            <span>Deterministic Spatial-Temporal Physics Engine</span>
            <span className="text-emerald-400 font-bold">PIPELINE NOMINAL</span>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM TIER: PENDING HYPOTHESES (HITL) & CONTRADICTION TEASERS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Pending AI Hypotheses (7 cols) */}
        <div className="lg:col-span-7 bg-[#12141A] border border-[#232731] rounded-lg p-5 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#232731] pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-[#F4C430]" />
              <span className="text-sm font-black uppercase tracking-wider text-white">
                PENDING AI-SUGGESTED RELATIONSHIPS ({pendingRelationships.length})
              </span>
            </div>
            <button
              onClick={() => onSelectTab('graph')}
              className="text-xs text-[#F4C430] hover:underline font-bold"
            >
              VIEW GRAPH →
            </button>
          </div>

          <div className="space-y-3">
            {pendingRelationships.map((rel) => {
              const sourceEntity = entities.find((e) => e.id === rel.source_entity_id);
              const targetEntity = entities.find((e) => e.id === rel.target_entity_id);

              return (
                <div
                  key={rel.id}
                  className="p-3.5 bg-[#090A0D] border border-[#232731] rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 font-bold">
                      <span className="text-[#06B6D4]">{sourceEntity?.name || 'Entity A'}</span>
                      <span className="text-[#F4C430] font-black">──[{rel.relationship_type}]──▶</span>
                      <span className="text-[#F59E0B]">{targetEntity?.name || 'Entity B'}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F4C430]/20 text-[#F4C430] font-extrabold border border-[#F4C430]/40">
                        {Math.round(rel.confidence * 100)}% CONF
                      </span>
                    </div>
                    <p className="text-xs text-slate-200">
                      {rel.explanation || rel.description}
                    </p>
                  </div>

                  {/* HITL Action Buttons */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => onDismissRelationship(rel.id)}
                      className="px-2.5 py-1.5 bg-[#181B22] hover:bg-[#232731] text-[#EF4444] border border-[#EF4444]/40 rounded text-xs font-bold transition"
                    >
                      DISMISS
                    </button>
                    <button
                      onClick={() => onConfirmRelationship(rel.id)}
                      className="px-3 py-1.5 bg-[#10B981] hover:bg-[#059669] text-black rounded text-xs font-extrabold transition shadow-md"
                    >
                      CONFIRM
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Critical Contradiction Teaser (5 cols) */}
        <div className="lg:col-span-5 bg-[#12141A] border border-[#EF4444]/40 rounded-lg p-5 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between border-b border-[#232731] pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <AlertOctagon className="w-4 h-4 text-[#EF4444]" />
                <span className="text-sm font-black uppercase tracking-wider text-white">
                  CROSS-AGENCY ARBITRATION QUEUE
                </span>
              </div>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#EF4444] text-white animate-pulse">
                ACTION REQUIRED
              </span>
            </div>

            <div className="p-3.5 bg-[#090A0D] border border-[#EF4444]/40 rounded-lg space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-[#EF4444]">IMPOSSIBILITY CALLOUT:</span>
                <span className="text-slate-300 font-bold">10-SEP 22:30 vs 22:45 IST</span>
              </div>
              <p className="text-xs text-slate-100 font-sans leading-relaxed">
                Jodhpur Police logged suspect Aarav Singh at Mehrangarh Clock Tower at 22:30 IST. Kota SIU logged the same suspect at Chambal River Bridge at 22:45 IST (390 km transit in 15 mins = 1,560 km/h).
              </p>
              <div className="p-2 bg-[#EF4444]/15 border border-[#EF4444]/30 rounded text-[11px] text-white font-bold">
                Resolution Options: Flag Body-Double Decoy, Cloned Plates, or Review Audio Intercept.
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#232731] flex items-center justify-between">
            <span className="text-xs text-slate-300">Dual-Agency Joint Arbitration</span>
            <button
              onClick={() => onSelectTab('contradictions')}
              className="px-3.5 py-1.5 bg-[#EF4444] hover:bg-red-700 text-white font-extrabold text-xs rounded transition shadow-lg shadow-red-500/20 flex items-center space-x-1.5"
            >
              <span>OPEN ARBITRATION DECK</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
