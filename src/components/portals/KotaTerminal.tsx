'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useInvestigation } from '@/lib/store/investigation-context';
import { InterAgencyAlertBanner } from './InterAgencyAlertBanner';
import { EvidenceDropzone } from '@/components/vault/EvidenceDropzone';
import { NexusProvenanceInspector } from '@/components/nexus/NexusProvenanceInspector';
import {
  Shield,
  Upload,
  Radio,
  Send,
  Eye,
  Clock,
  Layers,
  FileText,
  Volume2,
  Image as ImageIcon,
  Video,
  Share2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  FolderLock,
  ChevronRight,
} from 'lucide-react';

export function KotaTerminal() {
  const {
    documents,
    entities,
    events,
    relationships,
    contradictions,
    ingestDocument,
    transmitToAgency,
    provenanceFocus,
    setProvenanceFocus,
    transmissionsList,
    resetToDefaultCase,
    isProcessing,
    processingStatusText,
  } = useInvestigation();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'evidence' | 'incoming' | 'events'>('evidence');
  const [transmitNotes, setTransmitNotes] = useState('');
  const [selectedDocToTransmit, setSelectedDocToTransmit] = useState<string | null>(null);

  // Filter documents belonging to Kota
  const kotaDocs = documents.filter((d) => d.agency_id === 'agency-kota-01' || d.uploaded_by.toLowerCase().includes('kota'));
  const incomingFromJodhpur = transmissionsList.filter((t) => t.toAgency === 'kota' || t.fromAgency === 'jodhpur');
  const kotaEvents = events.filter((e) => {
    const doc = documents.find((d) => d.id === e.document_id);
    return !doc || doc.agency_id === 'agency-kota-01' || e.location_text.toLowerCase().includes('kota') || e.location_text.toLowerCase().includes('vigyan') || e.location_text.toLowerCase().includes('chambal');
  });

  const handleTransmit = (docId: string) => {
    transmitToAgency('kota', 'jodhpur', docId, transmitNotes || undefined);
    setTransmitNotes('');
    setSelectedDocToTransmit(null);
  };

  const currentProvenanceDoc = provenanceFocus
    ? documents.find((d) => d.id === provenanceFocus.documentId) || null
    : null;

  return (
    <div className="min-h-screen bg-[#140D04] text-[#FEF3C7] font-mono flex flex-col selection:bg-[#F59E0B] selection:text-black">
      {/* Realtime Alert Banner */}
      <InterAgencyAlertBanner currentAgency="kota" />

      {/* Top Tactical Command Header */}
      <header className="bg-[#241708] border-b border-[#78350F] px-5 py-3 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-[#D97706]/20 border border-[#F59E0B]/40 flex items-center justify-center text-[#F59E0B] shadow-inner">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#92400E] text-white text-[10px] uppercase font-bold tracking-wider">
                COMMISSIONERATE CID // SECTOR RJ-20
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>SECURE LINK TO JODHPUR HQ: ACTIVE</span>
              </span>
            </div>
            <h1 className="text-base font-bold text-white tracking-tight mt-0.5">
              Kota City Police Commissionerate • CID Command Terminal
            </h1>
          </div>
        </div>

        {/* Action Controls & Navigation Switchers */}
        <div className="flex items-center gap-3">
          {/* Switch to Joint Fusion Deck */}
          <Link
            href="/"
            className="px-3 py-1.5 rounded bg-[#351F0A] hover:bg-[#4A2B0E] border border-[#78350F] text-xs text-[#FDE68A] flex items-center gap-1.5 transition"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Master Joint Fusion</span>
          </Link>

          {/* Switch to Jodhpur Terminal */}
          <Link
            href="/jodhpur"
            className="px-3 py-1.5 rounded bg-[#0284C7]/20 hover:bg-[#0284C7]/30 border border-[#0284C7]/50 text-xs text-[#93C5FD] flex items-center gap-1.5 transition"
          >
            <span>Jodhpur HQ Terminal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>

          {/* Deposit Evidence Button */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-3.5 py-1.5 rounded bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#D97706]/30 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>+ Deposit Evidence</span>
          </button>
        </div>
      </header>

      {/* Global Ingestion Processing Indicator */}
      {isProcessing && (
        <div className="bg-[#92400E] text-white text-xs px-4 py-1.5 flex items-center justify-between font-mono animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>AI EXTRACTION ENGINE ACTIVE: {processingStatusText}</span>
          </div>
          <span className="text-[11px] opacity-80">Telemetry Dispatch Synchronizing...</span>
        </div>
      )}

      {/* Main Terminal Workspace */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Evidence Vault & Outgoing Dispatch (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Section Switcher Tabs */}
          <div className="flex items-center justify-between bg-[#241708] border border-[#78350F] rounded-lg p-1.5">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('evidence')}
                className={`px-3.5 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'evidence' ? 'bg-[#D97706] text-white shadow' : 'text-[#FDE68A] hover:text-white'
                }`}
              >
                <FolderLock className="w-3.5 h-3.5" />
                <span>Kota Evidence Locker ({kotaDocs.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('incoming')}
                className={`px-3.5 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'incoming' ? 'bg-[#D97706] text-white shadow' : 'text-[#FDE68A] hover:text-white'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Transmissions from Jodhpur HQ ({incomingFromJodhpur.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-3.5 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'events' ? 'bg-[#D97706] text-white shadow' : 'text-[#FDE68A] hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Forensic Timeline ({kotaEvents.length})</span>
              </button>
            </div>

            <span className="text-[11px] text-[#FBBF24] font-mono pr-2">
              Jurisdiction: Kota City • Chambal Sector
            </span>
          </div>

          {/* TAB 1: KOTA EVIDENCE LOCKER */}
          {activeTab === 'evidence' && (
            <div className="flex-1 space-y-3">
              {kotaDocs.length === 0 ? (
                <div className="border border-dashed border-[#78350F] bg-[#241708]/40 rounded-xl p-12 text-center space-y-3">
                  <FolderLock className="w-10 h-10 mx-auto text-[#F59E0B]/60" />
                  <h3 className="text-sm font-bold text-white">Kota Evidence Locker Empty</h3>
                  <p className="text-xs text-[#FDE68A] max-w-md mx-auto leading-relaxed">
                    Deposit seizure reports, ANPR camera logs, or interrogation alibi memos. Uploading evidence will automatically trigger AI entity extraction and dispatch notifications to Jodhpur Police.
                  </p>
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="px-4 py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-lg transition shadow-lg shadow-[#D97706]/20"
                  >
                    + Deposit First Evidence
                  </button>
                </div>
              ) : (
                kotaDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-[#241708] border border-[#78350F] rounded-xl p-4 shadow-lg hover:border-[#F59E0B] transition space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#78350F] pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded bg-[#D97706]/20 border border-[#D97706]/40 text-[#F59E0B] text-[10px] uppercase font-bold">
                          [{doc.file_type.toUpperCase()}]
                        </span>
                        <h4 className="text-sm font-bold text-white">{doc.title}</h4>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-[#FDE68A]">
                        <span>By: {doc.uploaded_by}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploaded_at).toLocaleTimeString()} IST</span>
                      </div>
                    </div>

                    <p className="text-xs text-[#FEF3C7] leading-relaxed font-sans line-clamp-3 bg-[#140D04] p-3 rounded-lg border border-[#78350F]/50">
                      {doc.content_text}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        onClick={() => {
                          setProvenanceFocus({
                            documentId: doc.id,
                            sourceOffset: 'Line 1',
                            title: doc.title,
                            mediaType: doc.file_type,
                            snippet: doc.content_text,
                          });
                        }}
                        className="px-3 py-1.5 rounded bg-[#351F0A] hover:bg-[#4A2B0E] text-xs text-[#F59E0B] font-bold flex items-center gap-1.5 transition border border-[#78350F]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Provenance</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {selectedDocToTransmit === doc.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Add transmission brief..."
                              value={transmitNotes}
                              onChange={(e) => setTransmitNotes(e.target.value)}
                              className="bg-[#140D04] border border-[#F59E0B] text-xs rounded px-2.5 py-1 text-white outline-none w-48 font-mono"
                            />
                            <button
                              onClick={() => handleTransmit(doc.id)}
                              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow transition"
                            >
                              <Send className="w-3 h-3" />
                              <span>Confirm Send</span>
                            </button>
                            <button
                              onClick={() => setSelectedDocToTransmit(null)}
                              className="text-xs text-[#FDE68A] hover:text-white"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedDocToTransmit(doc.id)}
                            className="px-3.5 py-1.5 rounded bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#0284C7]/20 transition"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Dispatch to Jodhpur HQ ➔</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: INCOMING TRANSMISSIONS FROM JODHPUR */}
          {activeTab === 'incoming' && (
            <div className="space-y-3">
              {incomingFromJodhpur.length === 0 ? (
                <div className="border border-dashed border-[#78350F] bg-[#241708]/40 rounded-xl p-12 text-center space-y-2">
                  <Radio className="w-8 h-8 mx-auto text-[#F59E0B]" />
                  <h4 className="text-xs font-bold text-white">No Transmissions from Jodhpur HQ Yet</h4>
                  <p className="text-[11px] text-[#FDE68A]">
                    When Jodhpur Police uploads or transmits evidence from their sector, it will beam into this inbox in real-time.
                  </p>
                </div>
              ) : (
                incomingFromJodhpur.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 bg-[#241708] border-l-4 border-sky-500 rounded-r-xl border-y border-r border-[#78350F] space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-sky-300 flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-sky-400" />
                        <span>TRANSMISSION SOURCE: {tx.fromAgency.toUpperCase()} POLICE HQ</span>
                      </span>
                      <span className="text-slate-400">{new Date(tx.timestamp).toLocaleTimeString()} IST</span>
                    </div>
                    <h4 className="text-sm font-bold text-white">{tx.title}</h4>
                    <p className="text-xs text-[#FEF3C7] font-sans leading-relaxed">{tx.message}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: KOTA FORENSIC TIMELINE */}
          {activeTab === 'events' && (
            <div className="space-y-3">
              {kotaEvents.length === 0 ? (
                <div className="border border-dashed border-[#78350F] bg-[#241708]/40 rounded-xl p-12 text-center">
                  <Clock className="w-8 h-8 mx-auto text-[#F59E0B] mb-2" />
                  <p className="text-xs text-white font-bold">No Events Logged for Kota Sector</p>
                  <p className="text-[11px] text-[#FDE68A] mt-1">Deposit evidence to automatically populate chronological events.</p>
                </div>
              ) : (
                kotaEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 bg-[#241708] border border-[#78350F] rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white font-mono">
                        {new Date(evt.event_timestamp).toLocaleString()} IST
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                        OFFSET: {evt.source_offset}
                      </span>
                    </div>
                    <p className="text-[#FEF3C7] font-sans">{evt.description}</p>
                    <div className="text-[11px] text-[#F59E0B] flex items-center gap-1">
                      <span>Location: {evt.location_text}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Column: Inter-Agency Network Radar & Sector Info (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Quick Stats Widget */}
          <div className="bg-[#241708] border border-[#78350F] rounded-xl p-4 shadow-lg space-y-3">
            <h3 className="text-xs font-bold text-[#F59E0B] uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#F59E0B]" />
              <span>Kota Operational Telemetry</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-lg bg-[#140D04] border border-[#78350F]">
                <span className="text-[10px] text-[#FDE68A] block uppercase">Kota Files</span>
                <span className="text-lg font-bold text-white mt-1 block">{kotaDocs.length}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#140D04] border border-[#78350F]">
                <span className="text-[10px] text-[#FDE68A] block uppercase">Entities Tracked</span>
                <span className="text-lg font-bold text-[#F59E0B] mt-1 block">{entities.length}</span>
              </div>
              <div className="p-3 rounded-lg bg-[#140D04] border border-[#78350F]">
                <span className="text-[10px] text-[#FDE68A] block uppercase">Dispatches Sent</span>
                <span className="text-lg font-bold text-emerald-400 mt-1 block">
                  {transmissionsList.filter((t) => t.fromAgency === 'kota').length}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-[#140D04] border border-[#78350F]">
                <span className="text-[10px] text-[#FDE68A] block uppercase">Contradictions</span>
                <span className="text-lg font-bold text-rose-400 mt-1 block">
                  {contradictions.filter((c) => c.status === 'flagged').length}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Cross-Agency Communication Panel */}
          <div className="bg-[#241708] border border-[#78350F] rounded-xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span>Direct Inter-Agency Telemetry</span>
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>

            <p className="text-xs text-[#FDE68A] leading-relaxed font-sans">
              Any file or lead uploaded on this terminal broadcasts instantly across the state border to Jodhpur Police HQ via Supabase Realtime.
            </p>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="w-full py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-bold rounded-lg transition shadow flex items-center justify-center gap-2"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Broadcast Evidence to Jodhpur</span>
            </button>
          </div>

          {/* Sector Jurisdiction Info */}
          <div className="bg-[#241708] border border-[#78350F] rounded-xl p-4 text-xs space-y-2 text-[#FDE68A]">
            <span className="text-[10px] uppercase font-bold text-[#F59E0B] block">Jurisdiction Details:</span>
            <div>• Headquarters: Kota City Police Commissionerate (CID)</div>
            <div>• Sector Focus: Vigyan Nagar Rail Siding & Chambal Riverfront</div>
            <div>• Inter-District Corridor: NH-27 Westbound ➔ Bilara & Jodhpur</div>
            <div>• Encryption: SHA-256 Chain-of-Custody Grounded</div>
          </div>
        </div>
      </main>

      {/* Provenance Inspector Drawer */}
      {provenanceFocus && currentProvenanceDoc && (
        <NexusProvenanceInspector
          document={currentProvenanceDoc}
          sourceOffset={provenanceFocus.sourceOffset}
          snippet={provenanceFocus.snippet}
          onClose={() => setProvenanceFocus(null)}
        />
      )}

      {/* Upload Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-[#241708] border border-[#78350F] rounded-xl shadow-2xl p-6">
            <EvidenceDropzone
              onClose={() => setIsUploadOpen(false)}
              defaultAgencySlug="kota"
            />
          </div>
        </div>
      )}
    </div>
  );
}
