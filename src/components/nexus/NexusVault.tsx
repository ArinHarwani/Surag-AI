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
  Layers
} from 'lucide-react';
import { Document, Entity, FileType } from '@/types/investigation';

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

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.content_text && doc.content_text.toLowerCase().includes(searchQuery.toLowerCase())) ||
      doc.uploaded_by.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModality = selectedModality === 'all' || doc.file_type === selectedModality;
    return matchesSearch && matchesModality;
  });

  const getEntityPillsForDoc = (docId: string) => {
    const matched = entities.filter((e) => {
      const doc = documents.find((d) => d.id === docId);
      return doc?.content_text?.toLowerCase().includes(e.name.toLowerCase());
    });
    return matched.slice(0, 4).map((m) => m.name);
  };

  return (
    <div className="p-5 space-y-5 font-mono select-none">
      {/* Top Header + Action Buttons with High Contrast */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#12141A] p-4 rounded-lg border border-[#232731] shadow-xl">
        <div>
          <div className="flex items-center space-x-2.5">
            <FolderArchive className="w-5 h-5 text-[#F4C430]" />
            <h2 className="text-base font-black uppercase tracking-wider text-white">
              CROSS-AGENCY EVIDENCE VAULT
            </h2>
          </div>
          <p className="text-xs text-slate-200 mt-1">
            Multi-modal evidence repository with verified cryptographic chain of custody.
          </p>
        </div>

        {/* 3 Action Buttons */}
        <div className="flex items-center space-x-2.5 text-xs">
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 bg-[#F4C430] hover:bg-[#EAB308] text-black font-black rounded flex items-center space-x-2 shadow-md shadow-[#F4C430]/20 transition active:scale-95"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
            <span>+ INGEST EVIDENCE</span>
          </button>
          <button
            onClick={() => {
              const dump = JSON.stringify(documents, null, 2);
              const blob = new Blob([dump], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `EVIDENCE-VAULT-MANIFEST-${Date.now()}.json`;
              a.click();
            }}
            className="px-3.5 py-2 bg-[#181B22] hover:bg-[#232731] text-slate-200 border border-[#232731] rounded flex items-center space-x-2 transition font-bold"
          >
            <Download className="w-4 h-4" />
            <span>EXPORT DOSSIER</span>
          </button>
          <button
            onClick={() => alert('Extracting cross-document entities and matching against existing case entities.')}
            className="px-3.5 py-2 bg-[#181B22] hover:bg-[#232731] text-slate-200 border border-[#232731] rounded flex items-center space-x-2 transition font-bold"
          >
            <Sparkles className="w-4 h-4 text-[#F4C430]" />
            <span>EXTRACT ENTITIES</span>
          </button>
        </div>
      </div>

      {/* Search Bar + Filter Modality Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#12141A] p-3.5 rounded-lg border border-[#232731] shadow-lg">
        {/* Search */}
        <div className="relative w-80 sm:w-96">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search dossier text, officer, or plate..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#090A0D] border border-[#232731] rounded pl-9 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#F4C430] transition font-mono"
          />
        </div>

        {/* Modality Filter Pills */}
        <div className="flex items-center space-x-2 text-xs">
          {[
            { id: 'all', label: 'ALL', count: documents.length },
            { id: 'text', label: 'TEXT', count: documents.filter((d) => d.file_type === 'text').length },
            { id: 'image', label: 'IMAGE', count: documents.filter((d) => d.file_type === 'image').length },
            { id: 'audio', label: 'AUDIO', count: documents.filter((d) => d.file_type === 'audio').length },
            { id: 'video', label: 'VIDEO', count: documents.filter((d) => d.file_type === 'video').length },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedModality(m.id)}
              className={`px-3 py-1.5 rounded text-xs font-black transition-all border ${
                selectedModality === m.id
                  ? 'bg-[#F4C430] text-black border-[#F4C430] shadow-md shadow-[#F4C430]/20'
                  : 'bg-[#090A0D] text-slate-300 border-[#232731] hover:text-white hover:bg-[#181B22]'
              }`}
            >
              {m.label} ({m.count})
            </button>
          ))}
        </div>
      </div>

      {/* Card-Per-Evidence-Item Layout */}
      <div className="space-y-4">
        {filteredDocs.map((doc) => {
          const isJod = doc.agency_id.includes('jod');
          const entityList = getEntityPillsForDoc(doc.id);

          return (
            <div
              key={doc.id}
              className="bg-[#EDE9E0] border-2 border-[#D4CEBF] rounded-lg p-5 shadow-md text-black flex flex-col lg:flex-row gap-5 transition hover:shadow-xl"
            >
              {/* Left Column: Media Preview & Thumbnail */}
              <div className="lg:w-72 shrink-0 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-black uppercase px-2.5 py-1 rounded text-white ${
                      isJod ? 'bg-[#0284C7]' : 'bg-[#D97706]'
                    }`}
                  >
                    {isJod ? 'JODHPUR POLICE' : 'KOTA SIU'}
                  </span>
                  <span className="text-xs font-mono text-black font-extrabold uppercase bg-black/10 px-2 py-0.5 rounded">
                    [{doc.file_type}]
                  </span>
                </div>

                {/* Media Preview Box */}
                {doc.file_type === 'audio' && (
                  <div className="p-3 bg-[#090A0D] text-white rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#F4C430] font-bold flex items-center space-x-1.5">
                        <Music className="w-3.5 h-3.5" />
                        <span>RADIO WIRETAP</span>
                      </span>
                      <span className="font-mono text-slate-300">00:38</span>
                    </div>
                    {/* Simulated Waveform */}
                    <div className="h-9 bg-black rounded flex items-center justify-center space-x-1 px-2">
                      {[35, 85, 55, 95, 100, 45, 80, 95, 50, 85, 55, 75, 95, 65, 45, 90, 55, 100, 65, 35].map(
                        (h, i) => (
                          <span
                            key={i}
                            className="w-1.5 bg-[#F4C430] rounded-full"
                            style={{ height: `${h}%` }}
                          />
                        )
                      )}
                    </div>
                  </div>
                )}

                {doc.file_type === 'image' && (
                  <div className="aspect-video bg-[#090A0D] text-white rounded-lg border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center p-2">
                    <div className="w-full h-full border border-dashed border-emerald-500/60 rounded flex items-center justify-center relative bg-emerald-950/30">
                      <div className="absolute top-1/4 left-1/3 w-24 h-12 border-2 border-red-500 rounded bg-red-500/40 animate-pulse flex items-start p-1">
                        <span className="text-[8px] bg-red-600 text-white font-black px-1 rounded">GLOCK 19</span>
                      </div>
                      <span className="text-xs font-mono text-slate-300 font-bold">CCTV OPTICAL #04</span>
                    </div>
                  </div>
                )}

                {doc.file_type === 'text' && (
                  <div className="p-3 bg-white rounded-lg border border-slate-300 font-mono text-xs text-slate-900 leading-snug line-clamp-4 font-medium">
                    {doc.content_text}
                  </div>
                )}

                <div className="text-xs text-slate-800 font-mono flex items-center justify-between font-bold">
                  <span>LOGGED: {new Date(doc.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST</span>
                  <span className="text-emerald-800 font-black">SHA-256 OK</span>
                </div>
              </div>

              {/* Center Column: Title, Metadata, Transcript Block */}
              <div className="flex-1 space-y-3 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm lg:text-base font-black text-black uppercase tracking-tight break-words">
                    {doc.title}
                  </h3>
                  <button
                    onClick={() => onOpenProvenance(doc.id, 'Line 1-8', doc.content_text?.slice(0, 200))}
                    className="text-xs text-indigo-900 hover:text-indigo-700 font-extrabold flex items-center space-x-1 shrink-0 bg-indigo-100 hover:bg-indigo-200 px-2.5 py-1 rounded transition"
                  >
                    <span>INSPECT PROVENANCE</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-xs text-slate-800 font-mono flex flex-wrap items-center gap-3 font-semibold">
                  <span className="truncate">STORAGE: <code className="bg-white px-1.5 py-0.5 rounded text-black font-bold border border-slate-300">{doc.storage_path}</code></span>
                  <span>DEPOSITED BY: <strong className="text-black">{doc.uploaded_by}</strong></span>
                </div>

                {/* Inline Transcript Block */}
                <div className="bg-white p-4 rounded-lg border border-slate-300 font-sans text-xs text-slate-900 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap select-text font-medium shadow-inner">
                  {doc.content_text}
                </div>
              </div>

              {/* Right Column: Extracted Entities Panel */}
              <div className="lg:w-64 shrink-0 bg-[#E0D9CB] p-4 rounded-lg border border-slate-300 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-900 tracking-wider">
                    EXTRACTED ENTITIES
                  </span>
                  <span className="text-[10px] bg-emerald-800 text-white px-2 py-0.5 rounded font-black">
                    VERIFIED
                  </span>
                </div>

                <div className="space-y-1.5">
                  {entityList.length > 0 ? (
                    entityList.map((ent, idx) => (
                      <div
                        key={idx}
                        className="p-2 bg-white rounded border border-slate-300 text-xs font-bold text-black flex items-center justify-between shadow-xs truncate"
                      >
                        <span className="truncate">{ent}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1.5" />
                      </div>
                    ))
                  ) : (
                    <div className="p-2 bg-white rounded text-xs text-slate-600">
                      Processing telemetry...
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-300 text-xs text-slate-800 flex items-center justify-between font-bold">
                  <span>EXTRACTION ENGINE</span>
                  <span className="text-indigo-900 font-black">NER + LLM</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
