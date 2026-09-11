'use client';

import React from 'react';
import { 
  FolderArchive, 
  Network, 
  AlertOctagon, 
  Lock, 
  UploadCloud, 
  Clock, 
  FileText, 
  Activity, 
  Sparkles,
  ArrowRight, 
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  UserCheck,
  Eye,
  MapPin,
  Car,
  User,
  Radio,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { Document, Entity, Relationship, Contradiction, Event } from '@/types/investigation';
import { formatTimeIST } from '@/lib/utils/formatDate';

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

  // Sorted timeline events
  const timelineEvents = [...events].sort(
    (a, b) => new Date(a.event_timestamp).getTime() - new Date(b.event_timestamp).getTime()
  );

  // Evidence Authors data mapped to documents
  const authors = [
    {
      name: 'Inspector S. Rathore',
      unit: 'Jodhpur Police (Crime Branch)',
      badge: 'RJ-JOD-042',
      clearance: 'LEVEL 3 // SECRET',
      filesCount: documents.filter((d) => d.uploaded_by?.toLowerCase().includes('rathore') || d.agency_id?.includes('jodhpur')).length,
      icon: '👮‍♂️',
      docId: 'doc-jod-witness-01'
    },
    {
      name: 'Inspector V. Meena',
      unit: 'Kota CID (Special Intelligence Unit)',
      badge: 'RJ-KTA-118',
      clearance: 'LEVEL 3 // SECRET',
      filesCount: documents.filter((d) => d.uploaded_by?.toLowerCase().includes('meena') || d.title?.includes('ANPR')).length,
      icon: '🕵️‍♂️',
      docId: 'doc-kota-cctv-02'
    },
    {
      name: 'Technical Intercept Unit (TIU)',
      unit: 'Joint Cyber & Signals Wing (SIGINT)',
      badge: 'SIGINT-09A',
      clearance: 'LEVEL 4 // STRICT EYES ONLY',
      filesCount: documents.filter((d) => d.uploaded_by?.toLowerCase().includes('intercept') || d.file_type === 'audio').length,
      icon: '📡',
      docId: 'doc-wiretap-audio-03'
    },
    {
      name: 'State Highway Patrol Unit 4',
      unit: 'Rajasthan Highway Interdiction Group',
      badge: 'HWP-DIV4',
      clearance: 'LEVEL 2 // CONFIDENTIAL',
      filesCount: documents.filter((d) => d.uploaded_by?.toLowerCase().includes('patrol') || d.file_type === 'image').length,
      icon: '🚔',
      docId: 'doc-cctv-optical-04'
    }
  ];

  // ── EMPTY STATE ─────────────────────────────────────────────────────────────
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[70vh] p-8 font-mono text-black">
        <div className="w-full max-w-lg text-center space-y-6">
          <div className="w-16 h-16 bg-black flex items-center justify-center mx-auto border-2 border-black shadow-brutal">
            <FolderArchive className="w-8 h-8 text-[#F5C842]" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-widest text-black">NO ACTIVE CASE</h2>
            <p className="text-sm text-slate-600 font-bold mt-2 font-sans">
              This terminal has no case data loaded. Click{' '}
              <span className="font-black text-black">+ ADD NEW CASE</span> in the top-right to open a case and ingest your first evidence.
            </p>
          </div>
          <div className="text-left space-y-3 border-2 border-black p-5 bg-[#FBF9F5] shadow-brutal">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-3">HOW TO START:</p>
            {[
              { step: '01', label: 'Click "+ ADD NEW CASE" in the header' },
              { step: '02', label: 'Enter case name, FIR number & filing agency' },
              { step: '03', label: 'Attach text statement, audio intercept or image evidence' },
              { step: '04', label: 'AI extracts entities, timeline events & contradictions automatically' },
              { step: '05', label: 'Review Entity Graph, Timeline & Contradiction Centre' },
            ].map(({ step, label }) => (
              <div key={step} className="flex items-start gap-3">
                <span className="bg-black text-[#F5C842] font-black text-[11px] px-2 py-0.5 shrink-0">{step}</span>
                <span className="text-xs font-bold text-slate-700 font-sans">{label}</span>
              </div>
            ))}
          </div>
          <button
            onClick={onOpenUpload}
            className="w-full py-3 bg-[#F5C842] hover:bg-[#EAB308] text-black font-black text-sm border-2 border-black shadow-brutal flex items-center justify-center gap-2 transition active:translate-x-0.5 active:translate-y-0.5"
          >
            <FolderArchive className="w-5 h-5" />
            + ADD NEW CASE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 font-mono select-none text-black">
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: CASE COMMAND BANNER
      ───────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        {/* Command Title Banner */}
        <div className="bg-[#111111] text-white p-5 border-2 border-black shadow-brutal-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-[#E53E3E] text-white font-black text-[10px] px-2.5 py-0.5 uppercase tracking-wider">
                ACTIVE CASE
              </span>
              <span className="text-[#F5C842] font-black text-xs uppercase tracking-wider">
                DUAL JURISDICTION // JODHPUR COMMISSIONERATE ↔ KOTA SIU
              </span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-white">
              {documents[0]?.title ? documents[0].title.toUpperCase() : 'ACTIVE INVESTIGATION'}
            </h1>
            <p className="text-xs text-slate-300 font-sans mt-1.5 max-w-3xl leading-relaxed">
              {documents.length} evidence file{documents.length !== 1 ? 's' : ''} ingested across Jodhpur and Kota terminals.
              Synchronized intelligence fusion and cryptographic audit active.
            </p>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onOpenUpload}
              className="px-4 py-2.5 bg-[#F5C842] hover:bg-[#EAB308] text-black font-black text-xs border-2 border-black shadow-brutal flex items-center space-x-1.5 transition active:translate-x-0.5 active:translate-y-0.5"
            >
              <FolderArchive className="w-4 h-4 text-black" />
              <span>+ ADD NEW CASE</span>
            </button>
            <button
              onClick={() => onSelectTab('dossier')}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-black font-black text-xs border-2 border-black shadow-brutal flex items-center space-x-1.5 transition active:translate-x-0.5 active:translate-y-0.5"
            >
              <span>CASE DOSSIER</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Clean High-Contrast KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* KPI 1: Ingested Evidence */}
          <div 
            onClick={() => onSelectTab('vault')}
            className="bg-white border-2 border-black p-4 shadow-brutal cursor-pointer hover:bg-[#FBF9F5] transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-slate-700 font-bold">
              <span className="uppercase tracking-wider">INGESTED EVIDENCE</span>
              <FolderArchive className="w-4 h-4 text-blue-600" />
            </div>
            <div className="my-2">
              <div className="text-3xl lg:text-4xl font-black text-black">
                {documents.length}
              </div>
              <p className="text-[11px] text-slate-600 font-bold mt-0.5">
                Multi-Modal Files (100% Locked)
              </p>
            </div>
            <span className="text-[10px] font-black text-blue-700 flex items-center space-x-1 pt-1 border-t border-slate-200">
              <span>EXPLORE VAULT</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          {/* KPI 2: Extracted Entities */}
          <div 
            onClick={() => onSelectTab('graph')}
            className="bg-white border-2 border-black p-4 shadow-brutal cursor-pointer hover:bg-[#FBF9F5] transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-slate-700 font-bold">
              <span className="uppercase tracking-wider">EXTRACTED ENTITIES</span>
              <Network className="w-4 h-4 text-purple-600" />
            </div>
            <div className="my-2">
              <div className="text-3xl lg:text-4xl font-black text-black">
                {entities.length}
              </div>
              <p className="text-[11px] text-slate-600 font-bold mt-0.5">
                Persons, Vehicles, Weapons, Orgs
              </p>
            </div>
            <span className="text-[10px] font-black text-purple-700 flex items-center space-x-1 pt-1 border-t border-slate-200">
              <span>OPEN GRAPH &amp; MAP</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>

          {/* KPI 3: AI Fusion Confidence */}
          <div className="bg-white border-2 border-black p-4 shadow-brutal flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-700 font-bold">
              <span className="uppercase tracking-wider">AI FUSION CONFIDENCE</span>
              <Sparkles className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="my-2">
              <div className="text-3xl lg:text-4xl font-black text-black">
                91.8%
              </div>
              <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                ↑ Zero Uncommitted Delta (18ms)
              </p>
            </div>
            <span className="text-[10px] font-black text-slate-600 flex items-center space-x-1 pt-1 border-t border-slate-200">
              <span>DUAL CUSTODY CONSENSUS</span>
            </span>
          </div>

          {/* KPI 4: Contradictions */}
          <div 
            onClick={() => onSelectTab('contradictions')}
            className="bg-[#FEE2E2] border-2 border-black p-4 shadow-brutal cursor-pointer hover:bg-red-200 transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-red-900 font-black">
              <span className="uppercase tracking-wider">CONTRADICTIONS</span>
              <AlertOctagon className="w-4 h-4 text-red-600" />
            </div>
            <div className="my-2">
              <div className="text-3xl lg:text-4xl font-black text-[#E53E3E]">
                {flaggedContradictions.length} CRIT
              </div>
              <p className="text-[11px] text-red-800 font-bold mt-0.5">
                1,560 km/h Velocity Collision
              </p>
            </div>
            <span className="text-[10px] font-black text-red-800 flex items-center space-x-1 pt-1 border-t border-red-300">
              <span>RESOLVE ARBITRATION</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: TIMELINE PREVIEW (Clean Rajasthan Transit Sequence)
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-white border-2 border-black p-5 shadow-brutal space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-black" />
              <h2 className="text-base font-black uppercase tracking-wider text-black">
                CHRONOLOGICAL EVENT TIMELINE
              </h2>
            </div>
            <p className="text-xs text-slate-600 font-bold mt-0.5">
              Corridor Event Sequence across Jodhpur, Bilara, Kota &amp; Rawatbhata
            </p>
          </div>

          <button
            onClick={() => onSelectTab('timeline')}
            className="px-3.5 py-1.5 bg-[#F5C842] hover:bg-[#EAB308] text-black font-black text-xs border border-black shadow-brutal flex items-center space-x-1 self-start sm:self-auto"
          >
            <span>VIEW FULL MAP &amp; TIMELINE</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Horizontal Event Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {timelineEvents.map((evt, idx) => {
            const isConflict = evt.id === 'evt-kota-chambal' || evt.id === 'evt-jod-clocktower';
            return (
              <div
                key={evt.id}
                className={`p-3.5 border-2 border-black shadow-xs flex flex-col justify-between transition hover:-translate-y-0.5 ${
                  isConflict ? 'bg-[#FFF5F5] border-red-600' : 'bg-[#FBF9F5]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-black px-1.5 py-0.5 bg-black text-[#F5C842] border border-black">
                      #{idx + 1}
                    </span>
                    <span suppressHydrationWarning className={`text-[10px] font-black ${isConflict ? 'text-red-700' : 'text-slate-700'}`}>
                      {formatTimeIST(evt.event_timestamp, false)}
                    </span>
                  </div>

                  <h3 className="text-xs font-black text-black leading-tight mb-1">
                    {evt.location_text}
                  </h3>

                  <p className="text-[11px] text-slate-700 font-sans line-clamp-2 leading-relaxed">
                    {evt.description}
                  </p>
                </div>

                <div className="pt-2.5 mt-2 border-t border-slate-300 flex items-center justify-between text-[10px] font-bold">
                  <span className="text-slate-600 uppercase">
                    {Math.round(evt.confidence * 100)}% CONF
                  </span>
                  <button
                    onClick={() => onOpenProvenance(evt.document_id, evt.source_offset, evt.description)}
                    className="text-blue-700 hover:underline flex items-center space-x-0.5"
                  >
                    <span>CITE</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: GRAPHS PREVIEW (Intelligence Entity Network)
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-white border-2 border-black p-5 shadow-brutal space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <Network className="w-5 h-5 text-black" />
              <h2 className="text-base font-black uppercase tracking-wider text-black">
                INTELLIGENCE KNOWLEDGE GRAPH
              </h2>
            </div>
            <p className="text-xs text-slate-600 font-bold mt-0.5">
              Multi-Agency Cross-Referenced Entities &amp; Real-Time Edge Hypotheses
            </p>
          </div>

          <button
            onClick={() => onSelectTab('graph')}
            className="px-3.5 py-1.5 bg-black text-[#F5C842] hover:bg-slate-900 font-black text-xs border border-black shadow-brutal flex items-center space-x-1 self-start sm:self-auto"
          >
            <span>OPEN FULL ENTITY GRAPH</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Entity Network Cards Display */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Key Entities Badges Strip (4 cols) */}
          <div className="lg:col-span-5 space-y-2.5">
            <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
              PRIMARY CASE ENTITIES ({entities.length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {entities.map((ent) => {
                let badgeColor = 'bg-emerald-100 text-emerald-900 border-emerald-500';
                if (ent.type === 'vehicle') badgeColor = 'bg-amber-100 text-amber-900 border-amber-500';
                if (ent.type === 'weapon') badgeColor = 'bg-red-100 text-red-900 border-red-500';
                if (ent.type === 'organization') badgeColor = 'bg-purple-100 text-purple-900 border-purple-500';

                return (
                  <div
                    key={ent.id}
                    onClick={() => onSelectTab('graph')}
                    className="p-2.5 border border-black bg-[#FBF9F5] hover:bg-white cursor-pointer transition shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 border ${badgeColor}`}>
                        {ent.type}
                      </span>
                    </div>
                    <div className="text-xs font-black text-black truncate">
                      {ent.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connected Relationships Edge Preview (7 cols) */}
          <div className="lg:col-span-7 space-y-2.5">
            <h3 className="text-xs font-black uppercase text-slate-700 tracking-wider">
              VERIFIED &amp; HYPOTHESIZED GRAPH EDGES
            </h3>
            <div className="space-y-2">
              {relationships.slice(0, 4).map((rel) => {
                const source = entities.find((e) => e.id === rel.source_entity_id);
                const target = entities.find((e) => e.id === rel.target_entity_id);
                const isConfirmed = rel.status === 'confirmed';

                return (
                  <div
                    key={rel.id}
                    className="p-2.5 border border-black bg-[#FBF9F5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center space-x-2 font-black flex-wrap">
                      <span className="text-blue-700">{source?.name || 'Aarav Singh'}</span>
                      <span className="text-black font-bold">──[{rel.relationship_type}]──▶</span>
                      <span className="text-amber-700 truncate max-w-[180px]">{target?.name || 'Bolero'}</span>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 border ${
                          isConfirmed
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-600'
                            : 'bg-amber-100 text-amber-800 border-amber-600'
                        }`}
                      >
                        {isConfirmed ? 'CONFIRMED' : 'AI SUGGESTED'}
                      </span>
                      <button
                        onClick={() => onSelectTab('graph')}
                        className="p-1 border border-black bg-white hover:bg-slate-100"
                      >
                        <ChevronRight className="w-3 h-3 text-black" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: EVIDENCE LIST (Multi-Modal Vault Assets)
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-white border-2 border-black p-5 shadow-brutal space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <FolderArchive className="w-5 h-5 text-black" />
              <h2 className="text-base font-black uppercase tracking-wider text-black">
                EVIDENCE VAULT ASSETS ({documents.length})
              </h2>
            </div>
            <p className="text-xs text-slate-600 font-bold mt-0.5">
              Verified Multi-Modal Intel with FIPS-Compliant Cryptographic Hash Locks
            </p>
          </div>

          <button
            onClick={() => onSelectTab('vault')}
            className="px-3.5 py-1.5 bg-[#F5C842] hover:bg-[#EAB308] text-black font-black text-xs border border-black shadow-brutal flex items-center space-x-1 self-start sm:self-auto"
          >
            <span>BROWSE COMPLETE VAULT</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Evidence List Grid */}
        <div className="space-y-2.5">
          {documents.map((doc, idx) => (
            <div
              key={doc.id}
              className="p-3.5 border-2 border-black bg-[#FBF9F5] flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs hover:bg-white transition"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 bg-black text-[#F5C842] text-[10px] font-black uppercase border border-black">
                    {doc.file_type}
                  </span>
                  <h3 className="text-xs font-black text-black">
                    {doc.title}
                  </h3>
                  <span className="text-[10px] font-bold text-slate-600 bg-white px-2 py-0.5 border border-slate-300">
                    BY: {doc.uploaded_by || 'Field Investigator'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 font-sans line-clamp-1">
                  {doc.content_text?.slice(0, 140)}…
                </p>
              </div>

              <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 border border-emerald-500">
                  LOCKED SHA-256
                </span>
                <button
                  onClick={() => onOpenProvenance(doc.id, '00:00:00', doc.content_text?.slice(0, 80))}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-black border border-black font-black text-xs flex items-center space-x-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>INSPECT</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: EVIDENCE AUTHORS (Depositing Officers & Units)
      ───────────────────────────────────────────────────────────── */}
      <section className="bg-white border-2 border-black p-5 shadow-brutal space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <UserCheck className="w-5 h-5 text-black" />
              <h2 className="text-base font-black uppercase tracking-wider text-black">
                EVIDENCE AUTHORS &amp; INVESTIGATIVE UNITS
              </h2>
            </div>
            <p className="text-xs text-slate-600 font-bold mt-0.5">
              Verified Law Enforcement Officers &amp; Technical Stations Depositing Intel
            </p>
          </div>

          <button
            onClick={() => onSelectTab('authors')}
            className="px-3.5 py-1.5 bg-black text-[#F5C842] hover:bg-slate-900 font-black text-xs border border-black shadow-brutal flex items-center space-x-1 self-start sm:self-auto"
          >
            <span>VIEW COMPLETE AUTHORS DIRECTORY</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 4 Authors Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {authors.map((author) => (
            <div
              key={author.badge}
              onClick={() => onSelectTab('authors')}
              className="p-4 border-2 border-black bg-[#FBF9F5] hover:bg-white cursor-pointer transition shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 border border-black bg-white flex items-center justify-center text-lg">
                    {author.icon}
                  </div>
                  <span className="text-[10px] font-black px-1.5 py-0.5 bg-black text-white">
                    {author.badge}
                  </span>
                </div>

                <h3 className="text-xs font-black uppercase text-black leading-snug">
                  {author.name}
                </h3>
                <p className="text-[11px] font-bold text-slate-600 mt-0.5">
                  {author.unit}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-300 flex items-center justify-between text-[10px] font-bold">
                <span className="text-slate-700">
                  {author.filesCount} {author.filesCount === 1 ? 'FILE' : 'FILES'} FILED
                </span>
                <span className="text-blue-700 font-black flex items-center space-x-0.5">
                  <span>DOSSIER</span>
                  <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
