'use client';

import React, { useState } from 'react';
import { useInvestigation } from '@/lib/store/investigation-context';
import { Header } from '@/components/common/Header';
import { InvestigationGraph } from '@/components/graph/InvestigationGraph';
import { GeospatialMap } from '@/components/map/GeospatialMap';
import { CustomTimeline } from '@/components/timeline/CustomTimeline';
import { ContradictionBanner } from '@/components/contradictions/ContradictionBanner';
import { ProvenanceModal } from '@/components/provenance/ProvenanceModal';
import { GraphRagSummaryModal } from '@/components/rag/GraphRagSummaryModal';
import { EvidenceDropzone } from '@/components/vault/EvidenceDropzone';
import { EntityDetailsDrawer } from '@/components/graph/EntityDetailsDrawer';
import {
  Radio,
  Share2,
  FolderLock,
  Layers,
  MapPin,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowRightLeft,
  FileText,
  Eye,
  Maximize2,
  SplitSquareVertical,
} from 'lucide-react';

export default function DualAgencyCommandDeck() {
  const {
    documents,
    entities,
    events,
    relationships,
    agencies,
    setSelectedDocument,
    setProvenanceFocus,
  } = useInvestigation();

  const [centerTab, setCenterTab] = useState<'graph' | 'map'>('graph');
  const [layoutMode, setLayoutMode] = useState<'split' | 'graph-focus' | 'timeline-focus'>('split');
  const [showSummary, setShowSummary] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadAgency, setUploadAgency] = useState<'jodhpur' | 'kota'>('jodhpur');

  const jodhpurDocs = documents.filter((d) => d.agency_id === agencies.jodhpur.id);
  const kotaDocs = documents.filter((d) => d.agency_id === agencies.kota.id);
  const crossAgencyLinks = relationships.filter((r) => r.relationship_type.includes('CROSS') || r.description.toLowerCase().includes('kota') || r.description.toLowerCase().includes('jodhpur') || r.description.toLowerCase().includes('scorpio'));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        onOpenSummary={() => setShowSummary(true)}
        onOpenUpload={() => {
          setUploadAgency('jodhpur');
          setShowUpload(true);
        }}
      />
      <ContradictionBanner />

      {/* Narrative Sub-Bar: "Two agencies had the same case. Neither knew the other existed — until now." */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 py-2">
        <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-indigo-500/20 border border-indigo-500/40 rounded text-indigo-400">
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </span>
            <span className="text-slate-300 font-medium">
              <strong className="text-white">Live Cross-Agency Sync Deck:</strong> "Two agencies had the same case. Neither knew the other existed — until now."
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono text-[11px]">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Jodhpur: {jodhpurDocs.length} files</span>
            </span>
            <span className="text-slate-600">⇄</span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Kota: {kotaDocs.length} files</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 font-bold">
              {relationships.filter((r) => r.status === 'confirmed').length} Confirmed / {relationships.filter((r) => r.status === 'ai_suggested').length} AI Suggested Links
            </span>
          </div>
        </div>
      </div>

      {/* Main Multi-Agency Grid Layout */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-3 grid grid-cols-1 xl:grid-cols-12 gap-3 overflow-hidden">
        {/* LEFT COLUMN: JODHPUR POLICE PORTAL (3 cols) */}
        <div className="xl:col-span-3 flex flex-col gap-3 h-[calc(100vh-170px)]">
          <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <div>
                <h3 className="text-xs font-bold text-cyan-300 font-mono uppercase">
                  Jodhpur Police Department
                </h3>
                <span className="text-[10px] text-slate-400">Commissionerate West</span>
              </div>
            </div>
            <button
              onClick={() => {
                setUploadAgency('jodhpur');
                setShowUpload(true);
              }}
              className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-[11px] font-mono font-semibold transition"
            >
              + Ingest JPD
            </button>
          </div>

          {/* Jodhpur Evidence List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            <div className="text-[10px] font-mono uppercase text-slate-400 px-1">
              Active Evidence Vault ({jodhpurDocs.length}):
            </div>
            {jodhpurDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => {
                  setSelectedDocument(doc);
                  setProvenanceFocus({
                    documentId: doc.id,
                    sourceOffset: 'Line 1-10',
                    title: doc.title,
                    mediaType: doc.file_type,
                    snippet: doc.content_text,
                  });
                }}
                className="p-3 bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 rounded-lg cursor-pointer transition group"
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="text-cyan-400 font-bold uppercase">[{doc.file_type}]</span>
                  <span className="text-slate-500 font-mono">
                    {new Date(doc.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-cyan-300 transition">
                  {doc.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 font-mono">
                  {doc.content_text}
                </p>
                <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>{doc.uploaded_by}</span>
                  <span className="text-cyan-400 group-hover:underline">Inspect Proof →</span>
                </div>
              </div>
            ))}
          </div>

          <EntityDetailsDrawer />
        </div>

        {/* CENTER COLUMN: JOINT INTELLIGENCE PICTURE (Force Graph / Corridor Map) (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-2 h-[calc(100vh-170px)]">
          {/* Switcher Header */}
          <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-lg p-1">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCenterTab('graph')}
                className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition ${
                  centerTab === 'graph' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Postgres Relationship Graph
              </button>
              <button
                onClick={() => setCenterTab('map')}
                className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition ${
                  centerTab === 'map' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Rajasthan Corridor Map
              </button>
            </div>
            <div className="text-[10px] font-mono text-slate-400 pr-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>AI Suggests, Human Confirms</span>
            </div>
          </div>

          <div className="flex-1 rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
            {centerTab === 'graph' ? <InvestigationGraph /> : <GeospatialMap />}
          </div>
        </div>

        {/* RIGHT COLUMN: KOTA POLICE & TIMELINE (4 cols) */}
        <div className="xl:col-span-4 flex flex-col gap-3 h-[calc(100vh-170px)]">
          {/* Kota Portal Sub-Header */}
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <div>
                <h3 className="text-xs font-bold text-amber-300 font-mono uppercase">
                  Kota Police Department
                </h3>
                <span className="text-[10px] text-slate-400">City Crime Branch</span>
              </div>
            </div>
            <button
              onClick={() => {
                setUploadAgency('kota');
                setShowUpload(true);
              }}
              className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-mono font-semibold transition"
            >
              + Ingest KPD
            </button>
          </div>

          {/* Kota Evidence Mini-Vault */}
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 border border-slate-800 rounded-lg p-2 bg-slate-900/40">
            <div className="text-[10px] font-mono uppercase text-slate-400">
              Kota Evidence Vault ({kotaDocs.length}):
            </div>
            {kotaDocs.map((doc) => (
              <div
                key={doc.id}
                onClick={() => {
                  setSelectedDocument(doc);
                  setProvenanceFocus({
                    documentId: doc.id,
                    sourceOffset: 'Line 1-10',
                    title: doc.title,
                    mediaType: doc.file_type,
                    snippet: doc.content_text,
                  });
                }}
                className="p-2 bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 rounded cursor-pointer transition text-xs font-mono flex items-center justify-between"
              >
                <div className="truncate pr-2">
                  <span className="text-amber-400 mr-1.5 uppercase font-bold">[{doc.file_type}]</span>
                  <span className="text-slate-200">{doc.title}</span>
                </div>
                <Eye className="w-3 h-3 text-slate-500 hover:text-amber-400 shrink-0" />
              </div>
            ))}
          </div>

          {/* Custom Sacred Timeline */}
          <div className="flex-1 overflow-hidden">
            <CustomTimeline />
          </div>
        </div>
      </main>

      {/* Global Overlays & Modals */}
      <ProvenanceModal />
      {showSummary && <GraphRagSummaryModal onClose={() => setShowSummary(false)} />}
      {showUpload && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <EvidenceDropzone onClose={() => setShowUpload(false)} defaultAgencySlug={uploadAgency} />
        </div>
      )}
    </div>
  );
}
