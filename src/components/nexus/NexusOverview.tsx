'use client';

import React from 'react';
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
  Cpu,
  Layers,
  Search,
  ExternalLink,
  ChevronRight
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
  const pendingRelationships = relationships.filter((r) => r.status === 'ai_suggested');
  const flaggedContradictions = contradictions.filter((c) => c.status === 'flagged');

  return (
    <div className="p-4 lg:p-6 space-y-4 font-mono select-none text-black">
      {/* 1. TOP BLACK COMMAND BANNER (Matches Reference Screenshot 1) */}
      <div className="bg-[#111111] text-white p-5 border-2 border-black shadow-brutal-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="bg-[#E53E3E] text-white font-black text-[10px] px-2.5 py-0.5 uppercase tracking-wider">
              LEVEL 4 CRISIS
            </span>
            <span className="text-[#F5C842] font-black text-xs uppercase tracking-wider">
              DUAL JURISDICTION // STRICT EYES ONLY
            </span>
          </div>

          <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-white">
            CASE #16: AARAV SINGH (MARWAR SYNDICATE)
          </h1>
        </div>

        {/* Right side inside black box: Joint Telemetry & Delta Latency */}
        <div className="flex items-center space-x-6 text-xs border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              JOINT TELEMETRY
            </span>
            <div className="flex items-center space-x-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span className="text-white font-black text-xs">
                JODHPUR COMMISSIONERATE ↔ KOTA SIU
              </span>
            </div>
          </div>

          <div className="border-l border-slate-800 pl-6">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              DELTA LATENCY
            </span>
            <span className="text-[#F5C842] font-black text-xs block mt-0.5">
              18ms // ZERO UNCOMMITTED
            </span>
          </div>
        </div>
      </div>

      {/* 2. ROW OF 5 KPI CARDS (Matches Reference Screenshot 1) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* KPI 1: TOTAL INGESTED */}
        <div className="bg-white border-2 border-black p-4 shadow-brutal flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-700 font-bold">
            <span className="uppercase tracking-wider">TOTAL INGESTED</span>
            <span className="text-blue-600 font-black">📁</span>
          </div>
          <div className="my-2">
            <div className="text-3xl lg:text-4xl font-black text-black">
              {documents.length}
            </div>
            <p className="text-[11px] text-slate-600 font-bold mt-0.5">
              Assets (Multi-Modal)
            </p>
          </div>
        </div>

        {/* KPI 2: EXTRACTED ENTITIES */}
        <div className="bg-white border-2 border-black p-4 shadow-brutal flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-700 font-bold">
            <span className="uppercase tracking-wider">EXTRACTED ENTITIES</span>
            <span className="text-purple-600 font-black">✛</span>
          </div>
          <div className="my-2">
            <div className="text-3xl lg:text-4xl font-black text-black">
              {entities.length}
            </div>
            <p className="text-[11px] text-slate-600 font-bold mt-0.5">
              Active Graph Nodes
            </p>
          </div>
        </div>

        {/* KPI 3: AI CONFIDENCE */}
        <div className="bg-white border-2 border-black p-4 shadow-brutal flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-slate-700 font-bold">
            <span className="uppercase tracking-wider">AI CONFIDENCE</span>
            <span className="text-cyan-600 font-black">📡</span>
          </div>
          <div className="my-2">
            <div className="text-3xl lg:text-4xl font-black text-black">
              91.8%
            </div>
            <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
              ↑ +1.4% fusion drift
            </p>
          </div>
        </div>

        {/* KPI 4: CONTRADICTIONS (Red Card in Ref) */}
        <div className="bg-[#FEE2E2] border-2 border-black p-4 shadow-brutal flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] text-red-900 font-black">
            <span className="uppercase tracking-wider">CONTRADICTIONS</span>
            <span className="text-red-600 font-black">⚠</span>
          </div>
          <div className="my-2">
            <div className="text-3xl lg:text-4xl font-black text-[#E53E3E]">
              {flaggedContradictions.length} CRIT
            </div>
            <p className="text-[11px] text-red-800 font-bold mt-0.5">
              Dual-Review Required
            </p>
          </div>
        </div>

        {/* KPI 5: FACT CRYPTOLOCKS (Yellow Card in Ref) */}
        <div className="bg-[#F5C842] border-2 border-black p-4 shadow-brutal flex flex-col justify-between col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-[11px] text-black font-black">
            <span className="uppercase tracking-wider">FACT CRYPTOLOCKS</span>
            <Lock className="w-4 h-4 text-black" />
          </div>
          <div className="my-2">
            <div className="text-3xl lg:text-4xl font-black text-black">
              {documents.length} / {documents.length}
            </div>
            <p className="text-[11px] text-black font-black mt-0.5">
              Immutable Consensus
            </p>
          </div>
        </div>
      </div>

      {/* 3. TWO-COLUMN PANEL: MULTI-MODAL VAULT INGEST & PIPELINE TICKER (Matches Reference Screenshot 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: MULTI-MODAL VAULT INGEST (7 cols) */}
        <div className="lg:col-span-7 bg-white border-2 border-black p-5 shadow-brutal flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b-2 border-black pb-2.5 mb-3">
              <div className="flex items-center space-x-2">
                <UploadCloud className="w-5 h-5 text-black" />
                <h3 className="text-sm font-black uppercase tracking-wider text-black">
                  MULTI-MODAL VAULT INGEST
                </h3>
              </div>
              <span className="bg-slate-200 text-slate-800 font-black text-[10px] px-2 py-0.5 border border-black">
                FIPS-140-3 COMPLIANT
              </span>
            </div>

            {/* Clickable Dashed Dropzone */}
            <div
              onClick={onOpenUpload}
              className="border-2 border-dashed border-black bg-[#FBF9F5] p-6 text-center cursor-pointer transition hover:bg-white hover:border-[#F5C842] space-y-3"
            >
              <div className="w-10 h-10 mx-auto rounded-full bg-black text-[#F5C842] flex items-center justify-center font-bold">
                <UploadCloud className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-xs font-black uppercase text-black">
                  DRAG &amp; DROP MULTI-MODAL EVIDENCE
                </h4>
                <p className="text-[11px] text-slate-600 font-bold uppercase mt-1">
                  AUDIO INTERCEPTS, 4K CCTV SURVEILLANCE, RAW PDF INTEL, EXIF METADATA, VOIP PCAP DUMPS
                </p>
              </div>

              {/* Modality Tag Pills (Matches reference screenshot 1) */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                <span className="px-2 py-1 text-[10px] font-black border border-black bg-white">
                  AUDIO (.FLAC, .WAV)
                </span>
                <span className="px-2 py-1 text-[10px] font-black border border-black bg-white">
                  VIDEO (.H265, .MP4)
                </span>
                <span className="px-2 py-1 text-[10px] font-black border border-black bg-white">
                  DOCUMENT (.PDF, .EML)
                </span>
                <span className="px-2 py-1 text-[10px] font-black border border-black bg-white">
                  RAW PACKET (.PCAP)
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-200">
            <div className="flex items-center space-x-2 text-[11px] text-slate-700 font-bold">
              <span className="w-2 h-2 rounded-full bg-[#F5C842] border border-black" />
              <span>Auto-Pipeline: Entity OCR + Diarization Engine v4.2</span>
            </div>

            <button
              onClick={onOpenUpload}
              className="w-full sm:w-auto px-5 py-2.5 bg-black hover:bg-slate-900 text-[#F5C842] font-black text-xs border border-black shadow-brutal flex items-center justify-center space-x-2 transition active:translate-x-0.5 active:translate-y-0.5"
            >
              <span>INGEST TO SECURE VAULT</span>
            </button>
          </div>
        </div>

        {/* Right Column: PIPELINE TICKER (5 cols) */}
        <div className="lg:col-span-5 bg-white border-2 border-black p-5 shadow-brutal flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b-2 border-black pb-2.5 mb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-black uppercase tracking-wider text-black">
                  PIPELINE TICKER
                </h3>
              </div>
              <span className="text-[10px] font-black text-red-600 uppercase">
                3 ACTIVE RUNS
              </span>
            </div>

            {/* Pipeline Stage Progress Bars (Matches Reference Screenshot 1) */}
            <div className="space-y-3">
              {/* Stage 1 */}
              <div className="p-3 border border-black bg-[#FBF9F5] space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-red-700 flex items-center space-x-1">
                    <span>■ AUDIO DIARIZATION</span>
                  </span>
                  <span className="text-blue-700">78% [SPEAKER-3]</span>
                </div>
                <div className="w-full bg-slate-200 h-2 border border-black">
                  <div className="bg-blue-600 h-full w-[78%]" />
                </div>
                <div className="text-[10px] text-slate-600 font-mono truncate">
                  wiretap_Intercept_CHIMERA_091023.flac → 4 unique vocal signatures
                </div>
              </div>

              {/* Stage 2 */}
              <div className="p-3 border border-black bg-[#FBF9F5] space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-yellow-800 flex items-center space-x-1">
                    <span>■ FACE RECOGNITION VECTORS</span>
                  </span>
                  <span className="text-emerald-700">100% [MATCH 94.2%]</span>
                </div>
                <div className="w-full bg-slate-200 h-2 border border-black">
                  <div className="bg-[#F5C842] h-full w-full" />
                </div>
                <div className="text-[10px] text-slate-600 font-mono truncate">
                  Rotterdam_Harbour_Cam_C4.mp4 → Suspect #4 (Aarav S.)
                </div>
              </div>

              {/* Stage 3 */}
              <div className="p-3 border border-black bg-[#FBF9F5] space-y-1.5">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="text-blue-700 flex items-center space-x-1">
                    <span>■ GEO-SPATIAL EXTRACTION</span>
                  </span>
                  <span className="text-blue-700">42% [RESOLVING AIS]</span>
                </div>
                <div className="w-full bg-slate-200 h-2 border border-black">
                  <div className="bg-blue-500 h-full w-[42%]" />
                </div>
                <div className="text-[10px] text-slate-600 font-mono truncate">
                  Satellite_RadSat_Pass_419.tiff → Lat 26.2978, Lon 73.0232
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-600 font-bold uppercase">
            <span>GPU ACCELERATOR: 4x H100 SXM</span>
            <span>THROUGHPUT: 1.8 GB/s</span>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM ROW: PENDING AI LINK HYPOTHESES & CRITICAL CONTRADICTION CENTER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Pending AI Link Hypotheses (6 cols) */}
        <div className="lg:col-span-6 bg-white border-2 border-black p-5 shadow-brutal space-y-3">
          <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
            <div className="flex items-center space-x-2">
              <Network className="w-5 h-5 text-black" />
              <h3 className="text-sm font-black uppercase tracking-wider text-black">
                PENDING AI LINK HYPOTHESES
              </h3>
            </div>
            <span className="bg-[#F5C842] text-black font-black text-[10px] px-2 py-0.5 border border-black">
              {pendingRelationships.length} CANDIDATES
            </span>
          </div>

          <p className="text-[11px] text-slate-600 font-bold uppercase">
            REQUIRES DUAL ANALYST COMMIT FOR GRAPH PROPAGATION
          </p>

          <div className="space-y-2.5">
            {pendingRelationships.map((rel) => {
              const sourceEntity = entities.find((e) => e.id === rel.source_entity_id);
              const targetEntity = entities.find((e) => e.id === rel.target_entity_id);

              return (
                <div
                  key={rel.id}
                  className="p-3 border-2 border-black bg-[#FBF9F5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-brutal text-xs"
                >
                  <div>
                    <div className="flex items-center space-x-2 font-black">
                      <span className="text-[#0284C7]">{sourceEntity?.name || 'Aarav Singh'}</span>
                      <span className="text-black">──[{rel.relationship_type}]──▶</span>
                      <span className="text-[#D97706]">{targetEntity?.name || 'Silver Bolero'}</span>
                    </div>
                    <p className="text-[11px] text-slate-700 font-medium mt-1">
                      {rel.explanation || rel.description}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button
                      onClick={() => onDismissRelationship(rel.id)}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-red-700 font-black border border-black text-[11px]"
                    >
                      DISMISS
                    </button>
                    <button
                      onClick={() => onConfirmRelationship(rel.id)}
                      className="px-3 py-1 bg-[#F5C842] hover:bg-[#EAB308] text-black font-black border border-black text-[11px] shadow-sm"
                    >
                      CONFIRM
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Critical Contradiction Center (6 cols) */}
        <div className="lg:col-span-6 bg-white border-2 border-black p-5 shadow-brutal space-y-3">
          <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
            <div className="flex items-center space-x-2">
              <AlertOctagon className="w-5 h-5 text-red-600" />
              <h3 className="text-sm font-black uppercase tracking-wider text-black">
                CRITICAL CONTRADICTION CENTER
              </h3>
            </div>
            <span className="bg-[#FEE2E2] text-red-700 font-black text-[10px] px-2 py-0.5 border border-red-500">
              ACTION MANDATORY
            </span>
          </div>

          <p className="text-[11px] text-slate-600 font-bold uppercase">
            CROSS-AGENCY FACT CONFLICT DETECTED
          </p>

          <div className="p-4 border-2 border-black bg-[#FEE2E2] shadow-brutal space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-red-800">
                TEMPORAL TRANSIT COLLISION
              </span>
              <span className="text-[10px] font-bold text-slate-700">10-SEP 22:45 IST</span>
            </div>
            <div className="text-base font-black text-black">
              390 KM IN 15 MINUTES = 1,560 KM/H
            </div>
            <p className="text-xs text-slate-800 font-sans leading-relaxed">
              Jodhpur Witness logged Aarav Singh at Mehrangarh Clock Tower (22:30 IST). Kota SIU logged the suspect at Chambal River Bridge (22:45 IST). Requires analyst resolution.
            </p>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-700 uppercase">
                Probable: Body-Double Decoy / Cloned Plates
              </span>
              <button
                onClick={() => onSelectTab('contradictions')}
                className="px-3 py-1.5 bg-black text-[#F5C842] font-black text-xs border border-black shadow-sm flex items-center space-x-1"
              >
                <span>RESOLVE CONFLICT</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
