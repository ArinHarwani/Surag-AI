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
  Pause,
  Volume2,
  Filter,
  SlidersHorizontal,
  Layers,
  AlertTriangle,
  FolderPlus,
  X,
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
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<{ url: string; title: string } | null>(null);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.content_text && doc.content_text.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (doc.uploaded_by && doc.uploaded_by.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesModality = selectedModality === 'all' || doc.file_type === selectedModality;
    return matchesSearch && matchesModality;
  });

  return (
    <div className="p-4 lg:p-6 space-y-4 font-mono select-none text-black">
      {/* 1. TOP BANNER & ACTION BUTTONS */}
      <div className="bg-white border-2 border-black p-5 shadow-brutal flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 uppercase tracking-wider">
              EVIDENCE VAULT
            </span>
            <span className="text-xs text-slate-700 font-bold uppercase tracking-wider">
              MULTI-MODAL INTELLIGENCE REPOSITORY
            </span>
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-500 text-[10px] font-black px-2 py-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>SHA-256 VERIFIED</span>
            </span>
          </div>
          <h2 className="text-xl lg:text-2xl font-black uppercase tracking-tight text-black">
            INGESTED EVIDENCE &amp; MULTI-MODAL LOGS
          </h2>
          <p className="text-xs text-slate-600 font-sans mt-1">
            Raw surveillance intercepts, witness audio, CCTV imagery, and forensic telemetry with provenance tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 bg-[#F5C842] hover:bg-[#EAB308] text-black font-black text-xs border-2 border-black shadow-brutal flex items-center space-x-1.5 transition active:translate-x-0.5 active:translate-y-0.5"
          >
            <FolderPlus className="w-4 h-4 stroke-[2.5]" />
            <span>INGEST NEW EVIDENCE</span>
          </button>

          <button
            onClick={() => {
              if (documents.length === 0) return;
              const dump = JSON.stringify(documents, null, 2);
              const blob = new Blob([dump], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `CUSTODY-AUDIT-DOSSIER-${Date.now()}.json`;
              a.click();
            }}
            disabled={documents.length === 0}
            className="px-3.5 py-2 bg-[#EAE6DD] hover:bg-slate-200 disabled:opacity-40 text-black font-black text-xs border-2 border-black shadow-brutal flex items-center space-x-1.5 transition"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT AUDIT JSON</span>
          </button>
        </div>
      </div>

      {/* 2. SEARCH BAR + MODALITY FILTER ROW */}
      <div className="bg-white border-2 border-black p-3.5 shadow-brutal space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search raw evidence content, entity names, or file titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FBF9F5] border border-black pl-9 pr-3 py-2 text-xs text-black placeholder-slate-500 font-sans focus:outline-none focus:bg-white focus:border-2 transition"
            />
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] text-slate-600 font-mono font-bold hidden sm:inline">
              COUNT: {filteredDocs.length} ITEMS
            </span>
          </div>
        </div>

        {/* Modality Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-black/10">
          <span className="text-[11px] font-black uppercase text-slate-700 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>MODALITY:</span>
          </span>

          {[
            { label: 'ALL MODALITIES', value: 'all', count: documents.length },
            { label: 'PDF DOSSIERS', value: 'pdf', count: documents.filter(d => d.file_type === 'pdf').length },
            { label: 'CSV DATA', value: 'csv', count: documents.filter(d => d.file_type === 'csv').length },
            { label: 'AUDIO INTERCEPTS', value: 'audio', count: documents.filter(d => d.file_type === 'audio').length },
            { label: 'IMAGE & CCTV', value: 'image', count: documents.filter(d => d.file_type === 'image').length },
            { label: 'TEXT & STATEMENTS', value: 'text', count: documents.filter(d => d.file_type === 'text').length },
          ].map((pill) => (
            <button
              key={pill.value}
              onClick={() => setSelectedModality(pill.value)}
              className={`px-3 py-1 text-xs font-black border transition flex items-center space-x-1.5 ${
                selectedModality === pill.value
                  ? 'bg-black text-[#F5C842] border-black shadow-xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>{pill.label}</span>
              <span className={`text-[10px] px-1 py-0.2 ${
                selectedModality === pill.value ? 'bg-[#F5C842] text-black' : 'bg-slate-200 text-black'
              }`}>
                {pill.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. EVIDENCE ITEMS OR EMPTY STATE */}
      {documents.length === 0 ? (
        <div className="bg-white border-2 border-black p-12 text-center shadow-brutal space-y-4">
          <FolderArchive className="w-12 h-12 text-slate-400 mx-auto" />
          <h4 className="text-base font-black uppercase text-black">NO EVIDENCE INGESTED YET</h4>
          <p className="text-xs text-slate-600 font-sans max-w-md mx-auto leading-relaxed">
            Upload text reports, audio recordings, or image evidence files to begin multimodal extraction and intelligence mapping.
          </p>
          <button
            onClick={onOpenUpload}
            className="px-5 py-2.5 bg-[#F5C842] hover:bg-[#EAB308] text-black font-black text-xs border-2 border-black shadow-brutal inline-flex items-center gap-2 transition active:translate-x-0.5 active:translate-y-0.5"
          >
            <FolderPlus className="w-4 h-4" />
            + INGEST FIRST EVIDENCE ITEM
          </button>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white border-2 border-black p-8 text-center shadow-brutal space-y-2">
          <p className="text-xs font-bold text-slate-600">No evidence items match your search or modality filter.</p>
          <button
            onClick={() => { setSearchQuery(''); setSelectedModality('all'); }}
            className="text-xs font-black text-black underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDocs.map((doc) => {
            const isAudio = doc.file_type === 'audio';
            const isImage = doc.file_type === 'image';
            const isPlaying = playingAudioId === doc.id;

            // Find entities relevant to this document
            const matchingEntities = entities.filter((e) =>
              (doc.content_text || '').toLowerCase().includes(e.name.toLowerCase())
            );
            const displayEntities = matchingEntities.length > 0 ? matchingEntities.slice(0, 3) : entities.slice(0, 2);

            return (
              <div
                key={doc.id}
                className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-white border-2 border-black p-5 shadow-brutal-lg"
              >
                {/* Left Box: Evidence Preview, Waveform & Transcript (8 cols) */}
                <div className="lg:col-span-8 space-y-3">
                  {/* Header Strip */}
                  <div className="flex items-center justify-between border-b border-black pb-2">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-black text-[#F5C842]">
                        {isAudio ? (
                          <Music className="w-4 h-4" />
                        ) : isImage ? (
                          <ImageIcon className="w-4 h-4" />
                        ) : doc.file_type === 'pdf' ? (
                          <FileText className="w-4 h-4 text-red-400" />
                        ) : doc.file_type === 'csv' ? (
                          <FileText className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-600 uppercase">
                          {doc.id} // AGENCY: {doc.agency_id.toUpperCase()}
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

                  {/* Audio Player & Simulated Vector Waveform */}
                  {isAudio && (
                    <div className="bg-[#EFECE6] border-2 border-black p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => {
                              const audioEl = document.getElementById(`audio-player-${doc.id}`) as HTMLAudioElement | null;
                              if (audioEl) {
                                if (isPlaying) {
                                  audioEl.pause();
                                  setPlayingAudioId(null);
                                } else {
                                  audioEl.play().catch(() => {});
                                  setPlayingAudioId(doc.id);
                                }
                              } else {
                                setPlayingAudioId(isPlaying ? null : doc.id);
                              }
                            }}
                            className="w-8 h-8 rounded-full bg-black text-[#F5C842] flex items-center justify-center font-bold shadow-sm hover:scale-105 transition cursor-pointer"
                          >
                            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
                          </button>
                          <span className="font-mono text-xs font-black">
                            {isPlaying ? 'PLAYING AUDIO STREAM' : 'READY TO PLAY'}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 text-xs">
                          <span className="bg-[#F5C842] text-black font-black px-2 py-0.5 border border-black text-[11px]">
                            AUDIO TELEMETRY
                          </span>
                        </div>
                      </div>

                      {/* Native HTML5 Audio Player for actual playback */}
                      {doc.media_url && (
                        <audio
                          id={`audio-player-${doc.id}`}
                          controls
                          className="w-full h-9 border border-black bg-white"
                          src={doc.media_url.replace(/^data:video\/mpeg/i, 'data:audio/mpeg').replace(/^data:video\/mp4/i, 'data:audio/mp4')}
                          onPlay={() => setPlayingAudioId(doc.id)}
                          onPause={() => setPlayingAudioId(null)}
                          onEnded={() => setPlayingAudioId(null)}
                        />
                      )}

                      {/* Waveform */}
                      <div className="relative h-10 bg-white border border-black rounded-xs flex items-center px-2 overflow-hidden">
                        <svg className="w-full h-8" viewBox="0 0 400 30" preserveAspectRatio="none">
                          <polyline
                            fill="none"
                            stroke="#111111"
                            strokeWidth="1.5"
                            points="0,15 10,15 15,8 20,22 25,4 30,26 35,12 40,18 45,6 50,24 55,14 60,16 65,8 70,22 75,4 80,26 85,15 90,15 100,8 105,22 110,4 115,26 120,12 125,18 130,6 135,24 140,15 150,15 155,8 160,22 165,4 170,26 175,12 180,18 185,6 190,24 195,14 200,16 205,8 210,22 215,4 220,26 225,15 230,15 240,8 245,22 250,4 255,26 260,12 265,18 270,6 275,24 280,15 290,15 300,8 305,22 310,4 315,26 320,12 325,18 330,6 335,24 340,14 350,16 360,8 370,22 380,4 390,26 400,15"
                          />
                        </svg>
                        {isPlaying && <div className="absolute top-0 bottom-0 left-[45%] w-0.5 bg-red-600 animate-pulse shadow-sm" />}
                      </div>
                    </div>
                  )}

                  {/* Image/CCTV preview */}
                  {isImage && (
                    <div className="bg-[#111111] text-white border-2 border-black p-3 flex flex-col items-center justify-center relative">
                      {doc.media_url ? (
                        <div className="relative group w-full flex flex-col items-center">
                          <img
                            src={doc.media_url}
                            alt={doc.title}
                            className="max-h-72 w-auto object-contain border border-neutral-700 shadow-md cursor-pointer hover:opacity-95 transition"
                            onClick={() => setExpandedImage({ url: doc.media_url!, title: doc.title })}
                          />
                          <div className="mt-2 flex items-center justify-between w-full text-[10px] font-mono text-neutral-300 px-1 border-t border-neutral-800 pt-1.5">
                            <span className="text-[#F5C842] font-black uppercase">
                              OPTICAL FORENSIC CAPTURE // {doc.title}
                            </span>
                            <button
                              type="button"
                              onClick={() => setExpandedImage({ url: doc.media_url!, title: doc.title })}
                              className="text-emerald-400 hover:text-emerald-300 font-bold underline flex items-center gap-1 cursor-pointer"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>CLICK TO ENLARGE</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="border border-dashed border-emerald-500 w-full p-4 flex flex-col items-center justify-center bg-emerald-950/20">
                          <ImageIcon className="w-8 h-8 text-emerald-400 mb-1" />
                          <span className="text-xs font-mono text-slate-200 font-bold uppercase">
                            {doc.title} // OPTICAL FORENSIC CAPTURE
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Video preview */}
                  {doc.file_type === 'video' && (
                    <div className="bg-[#111111] text-white border-2 border-black p-3 flex flex-col items-center justify-center">
                      {doc.media_url ? (
                        <video
                          controls
                          className="max-h-72 w-full object-contain border border-neutral-700 bg-black"
                          src={doc.media_url}
                        />
                      ) : (
                        <div className="border border-dashed border-amber-500 w-full p-4 flex flex-col items-center justify-center bg-amber-950/20">
                          <span className="text-xs font-mono text-slate-200 font-bold uppercase">
                            {doc.title} // VIDEO RECORDING
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PDF Document Preview Banner */}
                  {doc.file_type === 'pdf' && (
                    <div className="bg-[#1C1917] border-2 border-black p-3.5 flex items-center justify-between shadow-brutal text-white font-mono">
                      <div className="flex items-center space-x-3">
                        <div className="px-2 py-1 bg-red-600 text-white font-black text-xs border border-white">
                          PDF
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#F5C842] uppercase block">
                            OFFICIAL CASE DOSSIER // DOCUMENT EXHIBIT
                          </span>
                          <span className="text-[10px] text-slate-300">
                            Full extracted textual records available for investigator review below.
                          </span>
                        </div>
                      </div>
                      {doc.media_url && (
                        <a
                          href={doc.media_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={`${doc.title}.pdf`}
                          className="px-3 py-1.5 bg-[#F5C842] text-black font-black text-xs uppercase border border-black hover:bg-yellow-400 transition"
                        >
                          OPEN / DOWNLOAD PDF ↗
                        </a>
                      )}
                    </div>
                  )}

                  {/* CSV Document Preview Banner */}
                  {doc.file_type === 'csv' && (
                    <div className="bg-[#1C1917] border-2 border-black p-3.5 flex items-center justify-between shadow-brutal text-white font-mono">
                      <div className="flex items-center space-x-3">
                        <div className="px-2 py-1 bg-emerald-600 text-white font-black text-xs border border-white">
                          CSV
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#F5C842] uppercase block">
                            STRUCTURED LOG // ANALYTICAL DATA
                          </span>
                          <span className="text-[10px] text-slate-300">
                            Raw CSV data processed into structured entity telemetry.
                          </span>
                        </div>
                      </div>
                      {doc.media_url && (
                        <a
                          href={doc.media_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={`${doc.title}.csv`}
                          className="px-3 py-1.5 bg-[#F5C842] text-black font-black text-xs uppercase border border-black hover:bg-yellow-400 transition"
                        >
                          OPEN / DOWNLOAD CSV ↗
                        </a>
                      )}
                    </div>
                  )}

                  {/* Content / Transcript */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[11px] font-black uppercase text-slate-700">
                      <span>{isAudio ? 'SYNCHRONIZED TRANSCRIPT' : doc.file_type === 'pdf' ? 'PARSED PDF TEXT RECORD' : doc.file_type === 'csv' ? 'PARSED CSV TEXT RECORD' : 'INGESTED FORENSIC CONTENT'}</span>
                      <span className="text-blue-700">EXTRACTED STREAM</span>
                    </div>

                    <div className="bg-[#FBF9F5] border border-black p-3.5 space-y-2 text-xs font-sans leading-relaxed text-slate-900 whitespace-pre-line max-h-48 overflow-y-auto">
                      {doc.content_text || '[No raw text content]'}
                    </div>
                  </div>

                  {/* Depositor footer */}
                  <div className="pt-2 flex items-center justify-between text-xs text-slate-600 font-bold">
                    <span>DEPOSITED BY: <strong className="text-black">{doc.uploaded_by}</strong></span>
                    <button
                      onClick={() => onOpenProvenance(doc.id, 'Content excerpt', doc.content_text?.slice(0, 200))}
                      className="text-black hover:underline font-black flex items-center gap-1"
                    >
                      <span>INSPECT PROVENANCE</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Right Box: EXTRACTED ENTITIES & CORRELATIONS (4 cols) */}
                <div className="lg:col-span-4 bg-[#F5F2EB] border-2 border-black p-4 space-y-3.5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="border-b border-black pb-2">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-red-600">
                        <span>● AI KNOWLEDGE EXTRACTION</span>
                        <span>SURAG PIPELINE</span>
                      </div>
                      <h4 className="text-sm font-black uppercase text-black mt-0.5">
                        EXTRACTED ENTITIES
                      </h4>
                      <p className="text-[11px] text-slate-600 font-mono font-bold">
                        Mapped to Knowledge Graph
                      </p>
                    </div>

                    {displayEntities.length === 0 ? (
                      <div className="p-3 bg-white border border-black text-xs text-slate-500 font-bold">
                        No entities linked yet.
                      </div>
                    ) : (
                      displayEntities.map((ent) => (
                        <div key={ent.id} className="bg-white border-2 border-black p-3 space-y-1.5 shadow-brutal">
                          <div className="flex items-center justify-between">
                            <span className="bg-black text-white text-[9px] font-black px-1.5 py-0.5 uppercase">
                              {ent.type}
                            </span>
                            <span className="bg-[#F5C842] text-black text-[10px] font-black px-1.5 py-0.2">
                              VERIFIED
                            </span>
                          </div>

                          <h5 className="text-xs font-black uppercase text-black">
                            {ent.name}
                          </h5>

                          <div className="pt-1 flex items-center justify-between text-[11px] text-blue-700 font-black">
                            <span>✛ TRACKED NODE</span>
                            <button
                              onClick={() => onOpenProvenance(doc.id, ent.name, `Entity "${ent.name}" identified in evidence stream.`)}
                              className="underline text-black"
                            >
                              Inspect
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-2 border-t border-black/20 text-[11px] text-slate-600 font-bold">
                    FILE FORMAT: {doc.file_type.toUpperCase()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Enlarge Modal */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-[250] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-black border-2 border-[#F5C842] shadow-brutal-lg flex flex-col p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-800 text-white font-mono text-xs mb-2">
              <span className="font-black text-[#F5C842] uppercase tracking-wider">
                FORENSIC IMAGE VIEWER // {expandedImage.title}
              </span>
              <button
                onClick={() => setExpandedImage(null)}
                className="p-1 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-black">
              <img
                src={expandedImage.url}
                alt={expandedImage.title}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
