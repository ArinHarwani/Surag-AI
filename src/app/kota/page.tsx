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
  ShieldAlert,
  FileText,
  Radio,
  MapPin,
  Clock,
  Sparkles,
  Share2,
  FolderLock,
  Layers,
} from 'lucide-react';

export default function KotaPortalPage() {
  const {
    documents,
    entities,
    events,
    relationships,
    agencies,
    setSelectedDocument,
    setProvenanceFocus,
  } = useInvestigation();

  const [activeTab, setActiveTab] = useState<'graph' | 'map'>('graph');
  const [showSummary, setShowSummary] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const kotaDocs = documents.filter((d) => d.agency_id === agencies.kota.id);
  const crossAgencyLinks = relationships.filter((r) =>
    r.source_document_ids.some((id) => kotaDocs.some((kd) => kd.id === id))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header onOpenSummary={() => setShowSummary(true)} onOpenUpload={() => setShowUpload(true)} />
      <ContradictionBanner />

      {/* Kota Agency Portal Header Banner */}
      <div className="bg-amber-950/40 border-b border-amber-500/30 px-4 py-3">
        <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-400/40 rounded-lg text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-900 text-amber-200 border border-amber-700">
                  Terminal 02 • KPD-INTEL
                </span>
                <span className="text-xs font-mono text-amber-400">City Crime Branch</span>
              </div>
              <h2 className="text-lg font-black text-white tracking-tight">
                Kota Police Investigative Terminal
              </h2>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5">
              <span className="text-slate-400 block text-[10px]">RECOVERED SEIZURES</span>
              <span className="text-amber-400 font-bold text-sm">{kotaDocs.length} Files</span>
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1.5">
              <span className="text-slate-400 block text-[10px]">CORRIDOR LEADS</span>
              <span className="text-cyan-400 font-bold text-sm">{crossAgencyLinks.length} Cross-District</span>
            </div>
            <button
              onClick={() => setShowUpload(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold flex items-center gap-2 shadow-lg shadow-amber-600/30 transition"
            >
              <Share2 className="w-4 h-4" />
              <span>Deposit Evidence</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 3-Column Tactical Workspace */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
        {/* Left Column: Kota Evidence Vault (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-3 h-[calc(100vh-175px)]">
          <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-200">
              <FolderLock className="w-4 h-4 text-amber-400" />
              <span>Kota Evidence Vault ({kotaDocs.length})</span>
            </div>
            <span className="text-[10px] font-mono text-amber-400">Chain-of-Custody</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
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
                className="p-3 bg-slate-900/70 border border-slate-800 hover:border-amber-500/60 rounded-lg cursor-pointer transition group"
              >
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <span className="text-amber-400 font-bold uppercase">[{doc.file_type}]</span>
                  <span className="text-slate-500">
                    {new Date(doc.uploaded_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition">
                  {doc.title}
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 font-mono">
                  {doc.content_text}
                </p>
                <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>By: {doc.uploaded_by}</span>
                  <span className="text-amber-400 group-hover:underline">Inspect Proof →</span>
                </div>
              </div>
            ))}
          </div>

          <EntityDetailsDrawer />
        </div>

        {/* Center Column: Joint Force Graph / Geospatial Map (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-2 h-[calc(100vh-175px)]">
          {/* View Tab Switcher */}
          <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-lg p-1">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('graph')}
                className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition ${
                  activeTab === 'graph' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Postgres Force Graph
              </button>
              <button
                onClick={() => setActiveTab('map')}
                className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition ${
                  activeTab === 'map' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Rajasthan Corridor Map
              </button>
            </div>
            <span className="text-[10px] font-mono text-slate-400 pr-2">
              Showing Kota-linked cross connections
            </span>
          </div>

          <div className="flex-1 rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
            {activeTab === 'graph' ? <InvestigationGraph /> : <GeospatialMap />}
          </div>
        </div>

        {/* Right Column: Custom Sacred Timeline (4 cols) */}
        <div className="lg:col-span-4 h-[calc(100vh-175px)]">
          <CustomTimeline />
        </div>
      </main>

      {/* Modals */}
      <ProvenanceModal />
      {showSummary && <GraphRagSummaryModal onClose={() => setShowSummary(false)} />}
      {showUpload && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <EvidenceDropzone onClose={() => setShowUpload(false)} defaultAgencySlug="kota" />
        </div>
      )}
    </div>
  );
}
