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
  FolderLock,
  ArrowRight,
  Share2,
} from 'lucide-react';

export function KotaTerminal() {
  const {
    documents,
    entities,
    events,
    contradictions,
    transmitToAgency,
    provenanceFocus,
    setProvenanceFocus,
    transmissionsList,
    isProcessing,
    processingStatusText,
  } = useInvestigation();

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'evidence' | 'incoming' | 'events'>('evidence');
  const [transmitNotes, setTransmitNotes] = useState('');
  const [selectedDocToTransmit, setSelectedDocToTransmit] = useState<string | null>(null);

  // Filter documents belonging to Kota
  const kotaDocs = documents.filter(
    (d) => d.agency_id === 'agency-kota-01' || d.uploaded_by.toLowerCase().includes('kota')
  );
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
    <div className="min-h-screen bg-[#EFECE6] text-[#111111] font-mono flex flex-col selection:bg-[#F5C842] selection:text-black">
      {/* Realtime Alert Banner */}
      <InterAgencyAlertBanner currentAgency="kota" />

      {/* Top Tactical Command Header (Light Theme) */}
      <header className="bg-white border-b-2 border-black px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 shadow-brutal select-none">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded bg-[#D97706] border-2 border-black shadow-brutal flex items-center justify-center text-white font-black text-lg">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#D97706] text-white text-[10px] uppercase font-black tracking-wider border-2 border-black shadow-brutal">
                KOTA POLICE CID // SECTOR RJ-20
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded border border-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                <span>LINK TO JODHPUR HQ: SYNCHRONIZED</span>
              </span>
            </div>
            <h1 className="text-base lg:text-lg font-black text-black tracking-tight mt-0.5 uppercase">
              Kota City Police Commissionerate • CID Command Terminal
            </h1>
          </div>
        </div>

        {/* Action Controls & Navigation Switchers */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Switch to Joint Fusion Deck */}
          <Link
            href="/"
            className="px-3 py-2 rounded bg-white hover:bg-slate-100 border-2 border-black text-black text-xs font-black shadow-brutal flex items-center gap-1.5 transition active:translate-x-0.5 active:translate-y-0.5"
          >
            <Layers className="w-4 h-4" />
            <span>MASTER JOINT FUSION</span>
          </Link>

          {/* Switch to Jodhpur Terminal */}
          <Link
            href="/jodhpur"
            className="px-3 py-2 rounded bg-[#0284C7] hover:bg-[#0369A1] border-2 border-black text-white text-xs font-black shadow-brutal flex items-center gap-1.5 transition active:translate-x-0.5 active:translate-y-0.5"
          >
            <span>JODHPUR HQ TERMINAL</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Deposit Evidence Button */}
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2 rounded bg-[#F5C842] hover:bg-[#EAB308] text-black text-xs font-black border-2 border-black shadow-brutal flex items-center gap-1.5 transition active:translate-x-0.5 active:translate-y-0.5"
          >
            <Upload className="w-4 h-4 stroke-[2.5]" />
            <span>+ DEPOSIT EVIDENCE</span>
          </button>
        </div>
      </header>

      {/* Global Ingestion Processing Indicator */}
      {isProcessing && (
        <div className="bg-[#D97706] text-white text-xs px-4 py-1.5 flex items-center justify-between font-mono animate-pulse border-b-2 border-black">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>AI EXTRACTION ENGINE ACTIVE: {processingStatusText}</span>
          </div>
          <span className="text-[11px] opacity-90 font-bold">Telemetry Broadcasting across Sectors...</span>
        </div>
      )}

      {/* Main Terminal Workspace */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Evidence Locker & Outgoing Dispatch (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Section Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-between bg-white border-2 border-black p-2 shadow-brutal gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab('evidence')}
                className={`px-3.5 py-1.5 rounded text-xs font-black transition flex items-center gap-1.5 border-2 border-black ${
                  activeTab === 'evidence'
                    ? 'bg-[#D97706] text-white shadow-brutal'
                    : 'bg-[#EFECE6] text-black hover:bg-slate-200'
                }`}
              >
                <FolderLock className="w-3.5 h-3.5" />
                <span>KOTA EVIDENCE LOCKER ({kotaDocs.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('incoming')}
                className={`px-3.5 py-1.5 rounded text-xs font-black transition flex items-center gap-1.5 border-2 border-black ${
                  activeTab === 'incoming'
                    ? 'bg-[#D97706] text-white shadow-brutal'
                    : 'bg-[#EFECE6] text-black hover:bg-slate-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>INCOMING FROM JODHPUR HQ ({incomingFromJodhpur.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-3.5 py-1.5 rounded text-xs font-black transition flex items-center gap-1.5 border-2 border-black ${
                  activeTab === 'events'
                    ? 'bg-[#D97706] text-white shadow-brutal'
                    : 'bg-[#EFECE6] text-black hover:bg-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>KOTA SECTOR TIMELINE ({kotaEvents.length})</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-700 font-bold font-mono pr-2">
              JURISDICTION: KOTA CITY • CHAMBAL SECTOR
            </span>
          </div>

          {/* TAB 1: KOTA EVIDENCE LOCKER */}
          {activeTab === 'evidence' && (
            <div className="flex-1 space-y-3">
              {kotaDocs.length === 0 ? (
                <div className="border-2 border-dashed border-black bg-white rounded-lg p-12 text-center space-y-3 shadow-brutal">
                  <FolderLock className="w-10 h-10 mx-auto text-[#D97706]" />
                  <h3 className="text-sm font-black uppercase text-black">Kota Evidence Locker Empty</h3>
                  <p className="text-xs text-slate-700 max-w-md mx-auto leading-relaxed font-sans font-medium">
                    Deposit seizure reports, rail siding impounds, or interrogation alibi memos. Uploading evidence will automatically trigger AI entity extraction and dispatch notifications to Jodhpur Police in real-time.
                  </p>
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="px-4 py-2 bg-[#F5C842] hover:bg-[#EAB308] text-black text-xs font-black rounded border-2 border-black shadow-brutal transition active:translate-x-0.5 active:translate-y-0.5"
                  >
                    + DEPOSIT FIRST EVIDENCE FILE
                  </button>
                </div>
              ) : (
                kotaDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="bg-white border-2 border-black rounded-lg p-4 shadow-brutal hover:border-[#D97706] transition space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded bg-[#D97706] text-white text-[10px] uppercase font-black border border-black">
                          [{doc.file_type.toUpperCase()}]
                        </span>
                        <h4 className="text-sm font-black text-black">{doc.title}</h4>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-700 font-bold">
                        <span>BY: {doc.uploaded_by}</span>
                        <span>•</span>
                        <span>{new Date(doc.uploaded_at).toLocaleTimeString()} IST</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-800 leading-relaxed font-sans line-clamp-3 bg-[#EFECE6] p-3 rounded border border-black/30 font-medium">
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
                        className="px-3 py-1.5 rounded bg-white hover:bg-slate-100 text-xs text-black font-black flex items-center gap-1.5 transition border-2 border-black shadow-brutal active:translate-x-0.5 active:translate-y-0.5"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#D97706]" />
                        <span>INSPECT PROVENANCE</span>
                      </button>

                      <div className="flex items-center gap-2">
                        {selectedDocToTransmit === doc.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Brief transmission note..."
                              value={transmitNotes}
                              onChange={(e) => setTransmitNotes(e.target.value)}
                              className="bg-white border-2 border-black text-xs rounded px-2.5 py-1 text-black outline-none w-48 font-mono shadow-brutal"
                            />
                            <button
                              onClick={() => handleTransmit(doc.id)}
                              className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1 border-2 border-black shadow-brutal transition active:translate-x-0.5 active:translate-y-0.5"
                            >
                              <Send className="w-3 h-3" />
                              <span>CONFIRM SEND</span>
                            </button>
                            <button
                              onClick={() => setSelectedDocToTransmit(null)}
                              className="text-xs text-slate-600 hover:text-black font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setSelectedDocToTransmit(doc.id)}
                            className="px-3.5 py-1.5 rounded bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-black flex items-center gap-1.5 border-2 border-black shadow-brutal transition active:translate-x-0.5 active:translate-y-0.5"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>DISPATCH TO JODHPUR HQ ➔</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: INCOMING FROM JODHPUR */}
          {activeTab === 'incoming' && (
            <div className="space-y-3">
              {incomingFromJodhpur.length === 0 ? (
                <div className="border-2 border-dashed border-black bg-white rounded-lg p-12 text-center space-y-2 shadow-brutal">
                  <Radio className="w-8 h-8 mx-auto text-[#D97706]" />
                  <h4 className="text-xs font-black uppercase text-black">No Transmissions from Jodhpur Police Yet</h4>
                  <p className="text-[11px] text-slate-700 font-sans font-medium">
                    When Jodhpur Police HQ uploads or transmits evidence from their sector, it will beam into this inbox in real-time.
                  </p>
                </div>
              ) : (
                incomingFromJodhpur.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 bg-white border-2 border-black rounded-lg shadow-brutal space-y-2 border-l-8 border-l-[#0284C7]"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-black text-[#0284C7] flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5" />
                        <span>SOURCE: {tx.fromAgency.toUpperCase()} POLICE HQ</span>
                      </span>
                      <span className="text-slate-700 font-bold">{new Date(tx.timestamp).toLocaleTimeString()} IST</span>
                    </div>
                    <h4 className="text-sm font-black text-black">{tx.title}</h4>
                    <p className="text-xs text-slate-800 font-sans leading-relaxed font-medium">{tx.message}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: KOTA TIMELINE */}
          {activeTab === 'events' && (
            <div className="space-y-3">
              {kotaEvents.length === 0 ? (
                <div className="border-2 border-dashed border-black bg-white rounded-lg p-12 text-center shadow-brutal">
                  <Clock className="w-8 h-8 mx-auto text-[#D97706] mb-2" />
                  <p className="text-xs text-black font-black uppercase">No Events Logged for Kota Sector</p>
                  <p className="text-[11px] text-slate-700 mt-1 font-sans font-medium">Deposit evidence to automatically populate chronological events.</p>
                </div>
              ) : (
                kotaEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 bg-white border-2 border-black rounded-lg space-y-2 text-xs shadow-brutal"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-black text-black font-mono">
                        {new Date(evt.event_timestamp).toLocaleString()} IST
                      </span>
                      <span className="px-2 py-0.5 rounded bg-black text-white text-[10px] font-black">
                        OFFSET: {evt.source_offset}
                      </span>
                    </div>
                    <p className="text-slate-800 font-sans font-medium">{evt.description}</p>
                    <div className="text-[11px] text-[#D97706] font-bold flex items-center gap-1">
                      <span>Location: {evt.location_text}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Right Column: Telemetry & Inter-Agency Radar (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Operational Telemetry Widget */}
          <div className="bg-white border-2 border-black rounded-lg p-4 shadow-brutal space-y-3">
            <h3 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#D97706]" />
              <span>KOTA SECTOR TELEMETRY</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded bg-[#EFECE6] border-2 border-black shadow-brutal">
                <span className="text-[10px] text-slate-700 block uppercase font-bold">Kota Files</span>
                <span className="text-xl font-black text-black mt-1 block">{kotaDocs.length}</span>
              </div>
              <div className="p-3 rounded bg-[#EFECE6] border-2 border-black shadow-brutal">
                <span className="text-[10px] text-slate-700 block uppercase font-bold">Entities Tracked</span>
                <span className="text-xl font-black text-[#D97706] mt-1 block">{entities.length}</span>
              </div>
              <div className="p-3 rounded bg-[#EFECE6] border-2 border-black shadow-brutal">
                <span className="text-[10px] text-slate-700 block uppercase font-bold">Dispatches Sent</span>
                <span className="text-xl font-black text-emerald-700 mt-1 block">
                  {transmissionsList.filter((t) => t.fromAgency === 'kota').length}
                </span>
              </div>
              <div className="p-3 rounded bg-[#EFECE6] border-2 border-black shadow-brutal">
                <span className="text-[10px] text-slate-700 block uppercase font-bold">Contradictions</span>
                <span className="text-xl font-black text-red-600 mt-1 block">
                  {contradictions.filter((c) => c.status === 'flagged').length}
                </span>
              </div>
            </div>
          </div>

          {/* Direct Inter-Agency Telemetry Broadcast Card */}
          <div className="bg-white border-2 border-black rounded-lg p-4 shadow-brutal space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-black uppercase flex items-center gap-2">
                <Share2 className="w-4 h-4 text-emerald-600" />
                <span>DIRECT INTER-AGENCY RELAY</span>
              </h3>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            </div>

            <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium">
              Evidence deposited or leads shared from this terminal broadcast instantly to Jodhpur Police HQ via Supabase Realtime WebSocket relay.
            </p>

            <button
              onClick={() => setIsUploadOpen(true)}
              className="w-full py-2.5 bg-[#D97706] hover:bg-[#B45309] text-white text-xs font-black rounded border-2 border-black shadow-brutal transition active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>BROADCAST EVIDENCE TO JODHPUR</span>
            </button>
          </div>

          {/* Sector Jurisdiction Details */}
          <div className="bg-white border-2 border-black rounded-lg p-4 text-xs space-y-2 text-slate-700 shadow-brutal font-medium">
            <span className="text-[10px] uppercase font-black text-black block">SECTOR DETAILS:</span>
            <div>• Headquarters: Kota Police Commissionerate (CID)</div>
            <div>• Key Sectors: Vigyan Nagar Rail Siding & Chambal Bridge</div>
            <div>• Inter-Agency Target: Jodhpur Police Commissionerate West</div>
            <div>• Integrity: SHA-256 Non-Repudiable Source Audit</div>
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white border-2 border-black rounded-lg shadow-brutal-lg p-6">
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
