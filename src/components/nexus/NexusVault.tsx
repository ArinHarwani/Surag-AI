'use client';

import React, { useState } from 'react';
import { 
  FolderArchive, 
  Search, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Video as VideoIcon, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Target, 
  Share2,
  Lock,
  Play,
  Volume2,
  Filter,
  SlidersHorizontal,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { Document, Entity, FileType } from '@/types/investigation';
import { formatTimeIST } from '@/lib/utils/formatDate';

interface NexusVaultProps {
  documents: Document[];
  entities: Entity[];
  onOpenUpload: () => void;
  onOpenProvenance: (docId: string, offset: string, snippet?: string) => void;
}

export const NexusVault: React.FC<NexusVaultProps> = ({
  documents,
  entities,
  onOpenUpload,
  onOpenProvenance
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModality, setSelectedModality] = useState<string>('all');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.content_text && doc.content_text.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doc.uploaded_by.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModality = selectedModality === 'all' || doc.file_type === selectedModality;
    return matchesSearch && matchesModality;
  });

  return (
    <div className="p-4 lg:p-6 space-y-4 font-mono select-none text-black">
      {/* 1. TOP BANNER & ACTION BUTTONS (Matches Reference Screenshot 2) */}
      <div className="bg-white border-2 border-black p-5 shadow-brutal flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="bg-black text-white font-black text-[10px] px-2.5 py-0.5 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              <span>LIVE VAULT INTAKE</span>
            </span>
            <span className="text-[11px] text-slate-700 font-mono font-bold">
              SHA-512 ROOT: D8C47F9E…B8201C
            </span>
          </div>

          <h1 className="text-xl lg:text-2xl font-black uppercase tracking-tight text-black">
            MULTI-MODAL VAULT // CUSTODY AUDIT CHAIN VERIFIED
          </h1>
          <p className="text-xs text-slate-700 font-sans mt-1 max-w-2xl leading-relaxed">
            Cryptographically notarized raw intelligence ingestion pipeline. Joint jurisdiction Jodhpur-Kota dual-agency consensus active. All AI inferences tethered to non-repudiable source files.
          </p>
        </div>

        {/* 3 Action Buttons on Right (Matches Reference Screenshot 2) */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Yellow Action Button */}
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 bg-[#F5C842] hover:bg-[#EAB308] text-black font-black text-xs border-2 border-black shadow-brutal flex items-center space-x-1.5 transition active:translate-x-0.5 active:translate-y-0.5"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
            <span>INGEST NEW EVIDENCE ITEM</span>
          </button>

          {/* White/Gray Action Button */}
          <button
            onClick={() => {
              const dump = JSON.stringify(documents, null, 2);
              const blob = new Blob([dump], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `CUSTODY-AUDIT-DOSSIER-${Date.now()}.json`;
              a.click();
            }}
            className="px-3.5 py-2 bg-[#EAE6DD] hover:bg-slate-200 text-black font-black text-xs border-2 border-black shadow-brutal flex items-center space-x-1.5 transition"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT CUSTODY PDF</span>
          </button>

          {/* Red Action Button */}
          <button
            onClick={() => alert('Sweeping contradictions across chronological FASTag, CCTV, and wiretap telemetry.')}
            className="px-3.5 py-2 bg-[#E53E3E] hover:bg-red-700 text-white font-black text-xs border-2 border-black shadow-brutal flex items-center space-x-1.5 transition"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>SWEEP CONTRADICTIONS</span>
          </button>
        </div>
      </div>

      {/* 2. SEARCH BAR + MODALITY FILTER ROW (Matches Reference Screenshot 2) */}
      <div className="bg-white border-2 border-black p-3.5 shadow-brutal space-y-3">
        {/* Search Row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search raw evidence, speaker voiceprints, entity names, or visual tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FBF9F5] border border-black pl-9 pr-3 py-2 text-xs text-black placeholder-slate-500 font-sans focus:outline-none focus:bg-white focus:border-2 transition"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-600 font-mono font-bold hidden sm:inline">
              VECTOR // K=256
            </span>
            <button className="px-3 py-2 bg-black text-white font-black text-xs flex items-center space-x-1 border border-black">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#F5C842]" />
              <span>FILTERS</span>
            </button>
          </div>
        </div>

        {/* Filter Pills (Matches Reference Screenshot 2) */}
        <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-slate-200">
          <button
            onClick={() => setSelectedModality('all')}
            className={`px-3 py-1.5 text-xs font-black uppercase transition border ${
              selectedModality === 'all'
                ? 'bg-black text-white border-black shadow-sm'
                : 'bg-white text-slate-800 border-black/40 hover:bg-slate-100'
            }`}
          >
            ALL MODALITIES ({documents.length})
          </button>

          <button
            onClick={() => setSelectedModality('audio')}
            className={`px-3 py-1.5 text-xs font-bold uppercase transition flex items-center gap-1.5 border ${
              selectedModality === 'audio'
                ? 'bg-black text-white border-black'
                : 'bg-white text-slate-800 border-black/40 hover:bg-slate-100'
            }`}
          >
            <span className="text-red-600">🎙️</span>
            <span>AUDIO &amp; WIRETAPS ({documents.filter((d) => d.file_type === 'audio').length})</span>
          </button>

          <button
            onClick={() => setSelectedModality('image')}
            className={`px-3 py-1.5 text-xs font-bold uppercase transition flex items-center gap-1.5 border ${
              selectedModality === 'image'
                ? 'bg-black text-white border-black'
                : 'bg-white text-slate-800 border-black/40 hover:bg-slate-100'
            }`}
          >
            <span className="text-blue-600">📷</span>
            <span>SURVEILLANCE &amp; CCTV ({documents.filter((d) => d.file_type === 'image').length})</span>
          </button>

          <button
            onClick={() => setSelectedModality('text')}
            className={`px-3 py-1.5 text-xs font-bold uppercase transition flex items-center gap-1.5 border ${
              selectedModality === 'text'
                ? 'bg-black text-white border-black'
                : 'bg-white text-slate-800 border-black/40 hover:bg-slate-100'
            }`}
          >
            <span className="text-emerald-700">📄</span>
            <span>STATEMENTS &amp; ANPR ({documents.filter((d) => d.file_type === 'text').length})</span>
          </button>
        </div>
      </div>

      {/* 3. EVIDENCE ITEMS & EXTRACTED ENTITIES SECTION (Matches Reference Screenshot 2) */}
      <div className="space-y-4">
        {filteredDocs.map((doc) => {
          const isAudio = doc.file_type === 'audio';
          const isImage = doc.file_type === 'image';
          const isJodhpur = doc.agency_id.includes('jod');

          return (
            <div
              key={doc.id}
              className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-white border-2 border-black p-5 shadow-brutal-lg"
            >
              {/* Left Box: Evidence Preview, Waveform & Transcript (8 cols) */}
              <div className="lg:col-span-8 space-y-3">
                {/* Header Strip with Agency & ID */}
                <div className="flex items-center justify-between border-b border-black pb-2">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-red-600 text-white rounded-xs">
                      {isAudio ? <Music className="w-4 h-4" /> : isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-slate-600 uppercase">
                        {doc.id} // {isJodhpur ? 'JODHPUR POLICE HQ' : 'KOTA SIU SURVEILLANCE'}
                      </div>
                      <h3 className="text-sm lg:text-base font-black uppercase text-black">
                        {doc.title}
                      </h3>
                    </div>
                  </div>

                  <span suppressHydrationWarning className="text-[11px] font-mono text-slate-600 font-bold shrink-0">
                    {formatTimeIST(doc.uploaded_at, false)}
                  </span>
                </div>

                {/* Audio Player & Simulated Vector Waveform (Matches Reference Screenshot 2) */}
                {isAudio && (
                  <div className="bg-[#EFECE6] border-2 border-black p-4 space-y-3">
                    {/* Audio Player Header Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                          className="w-8 h-8 rounded-full bg-black text-[#F5C842] flex items-center justify-center font-bold shadow-sm hover:scale-105 transition"
                        >
                          <Play className="w-4 h-4 ml-0.5 fill-current" />
                        </button>
                        <span className="font-mono text-xs font-black">
                          02:14.200 / 08:32.000
                        </span>
                      </div>

                      {/* Speaker Pill Tags (Matches Reference Screenshot 2) */}
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="bg-[#F5C842] text-black font-black px-2 py-0.5 border border-black text-[11px]">
                          ● Speaker A: 88% Devendra Sharma
                        </span>
                        <span className="bg-[#38BDF8] text-black font-black px-2 py-0.5 border border-black text-[11px]">
                          ● Speaker B: Unknown Courier
                        </span>
                      </div>
                    </div>

                    {/* Vector Waveform with Red Playhead Line (Matches Screenshot 2) */}
                    <div className="relative h-12 bg-white border border-black rounded-xs flex items-center px-2 overflow-hidden">
                      <svg className="w-full h-10" viewBox="0 0 400 40" preserveAspectRatio="none">
                        <polyline
                          fill="none"
                          stroke="#111111"
                          strokeWidth="1.5"
                          points="0,20 10,20 15,10 20,30 25,5 30,35 35,15 40,25 45,8 50,32 55,18 60,22 65,10 70,30 75,5 80,35 85,20 90,20 100,10 105,30 110,5 115,35 120,15 125,25 130,8 135,32 140,20 150,20 155,10 160,30 165,5 170,35 175,15 180,25 185,8 190,32 195,18 200,22 205,10 210,30 215,5 220,35 225,20 230,20 240,10 245,30 250,5 255,35 260,15 265,25 270,8 275,32 280,20 290,20 300,10 305,30 310,5 315,35 320,15 325,25 330,8 335,32 340,18 350,22 360,10 370,30 380,5 390,35 400,20"
                        />
                      </svg>
                      {/* Red Playhead Indicator */}
                      <div className="absolute top-0 bottom-0 left-[35%] w-0.5 bg-red-600 shadow-sm" />
                    </div>
                  </div>
                )}

                {/* CCTV NightVision Image Preview */}
                {isImage && (
                  <div className="bg-[#111111] text-white border-2 border-black p-4 rounded-xs flex flex-col items-center justify-center relative min-h-[160px]">
                    <div className="border border-dashed border-emerald-500 w-full h-32 flex items-center justify-center relative bg-emerald-950/20">
                      <div className="absolute top-4 left-1/4 w-32 h-14 border-2 border-red-500 bg-red-500/30 flex items-start p-1">
                        <span className="text-[9px] bg-red-600 text-white font-black px-1">
                          GLOCK 19 (94.2%)
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-300 font-bold">
                        NAYAPURA BARRIER CCTV 04 // OPTICAL ANPR NIGHTVISION
                      </span>
                    </div>
                  </div>
                )}

                {/* Synchronized AI Transcript Block (Matches Reference Screenshot 2) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-black uppercase text-slate-700">
                    <span>SYNCHRONIZED AI TRANSCRIPT SEGMENT</span>
                    <span className="text-blue-700">WHISPER-V3 PROCESSED</span>
                  </div>

                  <div className="bg-[#FBF9F5] border border-black p-3.5 space-y-2 text-xs font-sans">
                    <div className="text-slate-800">
                      <span className="font-mono text-slate-500 font-bold mr-1.5">[00:05]</span>
                      <strong className="text-red-700">SPEAKER B:</strong> &quot;Radio check channel 4. Clearance confirmed across Bilara checkpoint.&quot;
                    </div>
                    <div className="bg-yellow-100/70 p-2 border-l-4 border-[#F5C842]">
                      <span className="font-mono text-slate-500 font-bold mr-1.5">[00:14]</span>
                      <strong className="text-amber-800">SPEAKER A (DEVENDRA S.):</strong> &quot;The drop in Kota is compromised. Move the consignment south toward Rawatbhata Highway milestone 14 immediately.&quot;
                      <span className="ml-2 bg-[#E53E3E] text-white font-black text-[9px] px-1.5 py-0.5 rounded-xs">
                        CRITICAL VECTOR
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-slate-600 font-bold">
                  <span>DEPOSITED BY: <strong className="text-black">{doc.uploaded_by}</strong></span>
                  <button
                    onClick={() => onOpenProvenance(doc.id, 'Line 1-10', doc.content_text?.slice(0, 200))}
                    className="text-black hover:underline font-black flex items-center gap-1"
                  >
                    <span>INSPECT FULL PROVENANCE</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right Box: EXTRACTED ENTITIES & EVENTS (4 cols, Matches Reference Screenshot 2) */}
              <div className="lg:col-span-4 bg-[#F5F2EB] border-2 border-black p-4 space-y-3.5">
                <div className="border-b border-black pb-2">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase text-red-600">
                    <span>● AI KNOWLEDGE EXTRACTION</span>
                    <span>MODEL: SURAG-NLP-V4</span>
                  </div>
                  <h4 className="text-sm font-black uppercase text-black mt-0.5">
                    EXTRACTED ENTITIES &amp; EVENTS
                  </h4>
                  <p className="text-[11px] text-slate-600 font-mono font-bold">
                    Raw Stream → Graph Mapping
                  </p>
                </div>

                {/* Entity Card 1 (Matches Reference Screenshot 2) */}
                <div className="bg-white border-2 border-black p-3 space-y-1.5 shadow-brutal">
                  <div className="flex items-center justify-between">
                    <span className="bg-black text-white text-[9px] font-black px-1.5 py-0.5 uppercase">
                      ORGANIZATION
                    </span>
                    <span className="bg-[#F5C842] text-black text-[10px] font-black px-1.5 py-0.2">
                      98%
                    </span>
                  </div>

                  <h5 className="text-xs font-black uppercase text-black">
                    Chambal Logistics Network
                  </h5>
                  <p className="text-[11px] text-slate-600 font-sans leading-tight">
                    Identified across 3 separate modalities (Audio Intercept, ANPR Log, FASTag).
                  </p>

                  <div className="pt-1 flex items-center justify-between text-[11px] text-blue-700 font-black">
                    <span>✛ LINKED TO GRAPH [NODE #104]</span>
                    <button
                      onClick={() => onOpenProvenance(doc.id, 'Chambal Network', doc.content_text?.slice(0, 150))}
                      className="underline text-black"
                    >
                      Inspect
                    </button>
                  </div>
                </div>

                {/* Event Correlation Card 2 (Matches Reference Screenshot 2) */}
                <div className="bg-white border-2 border-black p-3 space-y-1.5 shadow-brutal border-l-4 border-l-red-600">
                  <div className="flex items-center justify-between">
                    <span className="bg-red-100 text-red-700 text-[9px] font-black px-1.5 py-0.5 uppercase border border-red-400">
                      EVENT CORRELATION
                    </span>
                    <span className="bg-slate-200 text-black text-[10px] font-black px-1.5 py-0.2">
                      87%
                    </span>
                  </div>

                  <h5 className="text-xs font-black uppercase text-black">
                    Corridor Transit Handoff
                  </h5>
                  <p className="text-[11px] text-red-700 font-sans font-bold leading-tight">
                    FLAGGED: Conflict detected between Jodhpur Clock Tower sighting and Kota Toll ANPR arrival time.
                  </p>

                  <div className="pt-1 flex items-center justify-between text-[11px] text-red-700 font-black">
                    <span>⚠ CONFLICT DETECTED</span>
                    <button
                      onClick={() => onOpenProvenance(doc.id, 'Timeline clash', doc.content_text?.slice(0, 150))}
                      className="underline text-black"
                    >
                      Resolve &gt;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
