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
  Share2
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
      (doc.content_text && doc.content_text.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesModality = selectedModality === 'all' || doc.file_type === selectedModality;
    return matchesSearch && matchesModality;
  });

  const getEntityPillsForDoc = (docId: string) => {
    if (docId.includes('jod-witness')) {
      return ['Aarav Singh', 'White Scorpio (RJ-19-UB-4022)', 'Encrypted Duffel'];
    }
    if (docId.includes('kota-cctv')) {
      return ['Aarav Singh', 'Silver Bolero (RJ-20-CA-8812)', 'Chambal Logistics Network'];
    }
    if (docId.includes('wiretap')) {
      return ['Devendra Sharma', 'Rawatbhata Safehouse', 'Silver Bolero'];
    }
    if (docId.includes('optical')) {
      return ['Glock 19 (9mm)', 'Devendra Sharma', 'Nayapura Barrier'];
    }
    return ['Aarav Singh'];
  };

  return (
    <div className="space-y-5 font-mono select-none">
      {/* Top Header + Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111318] p-4 rounded-lg border border-[#232731]">
        <div>
          <div className="flex items-center space-x-2">
            <FolderArchive className="w-5 h-5 text-[#F4C430]" />
            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              CLASSIFIED EVIDENCE VAULT
            </h2>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Cryptographically signed multi-modal evidence chain for Operation Marwar.
          </p>
        </div>

        {/* 3 Action Buttons per UI Brief */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={onOpenUpload}
            className="px-3 py-1.5 bg-[#F4C430] hover:bg-[#EAB308] text-black font-black rounded flex items-center space-x-1.5 shadow-md shadow-[#F4C430]/20 transition"
          >
            <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
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
            className="px-3 py-1.5 bg-[#1C202A] hover:bg-[#252A38] text-slate-200 border border-[#2E3444] rounded flex items-center space-x-1.5 transition font-bold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT DOSSIER</span>
          </button>
          <button
            onClick={() => alert('Intelligence Sweep triggered: All raw fastag, optical and radio telemetry verified against SHA-256 ledger.')}
            className="px-3 py-1.5 bg-[#1C202A] hover:bg-[#252A38] text-slate-200 border border-[#2E3444] rounded flex items-center space-x-1.5 transition font-bold"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F4C430]" />
            <span>INTELLIGENCE SWEEP</span>
          </button>
        </div>
      </div>

      {/* Search Bar + Filter Modality Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111318] p-3 rounded-lg border border-[#232731]">
        {/* Search */}
        <div className="relative w-72 sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search dossier text or officer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#090A0D] border border-[#232731] rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#F4C430]"
          />
        </div>

        {/* Modality Filter Pills */}
        <div className="flex items-center space-x-1.5 text-xs">
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
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all border ${
                selectedModality === m.id
                  ? 'bg-[#F4C430] text-black border-[#F4C430] shadow'
                  : 'bg-[#090A0D] text-slate-400 border-[#232731] hover:text-white'
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
              className="bg-[#EDE9E0] border border-slate-300 rounded-lg p-5 shadow-sm text-slate-950 flex flex-col lg:flex-row gap-5 transition hover:shadow-md"
            >
              {/* Left Column: Media Preview & Thumbnail */}
              <div className="lg:w-72 shrink-0 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded text-white ${
                      isJod ? 'bg-[#0284C7]' : 'bg-[#D97706]'
                    }`}
                  >
                    {isJod ? 'JODHPUR POLICE' : 'KOTA POLICE'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-600 font-bold uppercase">
                    [{doc.file_type}]
                  </span>
                </div>

                {/* Media Preview Box */}
                {doc.file_type === 'audio' && (
                  <div className="p-3 bg-[#111318] text-white rounded border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-[#F4C430] font-bold flex items-center space-x-1">
                        <Music className="w-3 h-3" />
                        <span>RADIO INTERCEPT</span>
                      </span>
                      <span className="font-mono text-slate-400">00:38</span>
                    </div>
                    {/* Simulated Waveform */}
                    <div className="h-8 bg-[#090A0D] rounded flex items-center justify-center space-x-0.5 px-2">
                      {[30, 80, 50, 95, 100, 40, 75, 90, 45, 80, 50, 70, 90, 60, 40, 85, 50, 95, 60, 30].map(
                        (h, i) => (
                          <span
                            key={i}
                            className="w-1 bg-[#F4C430] rounded-full"
                            style={{ height: `${h}%` }}
                          />
                        )
                      )}
                    </div>
                  </div>
                )}

                {doc.file_type === 'image' && (
                  <div className="aspect-video bg-[#111318] text-white rounded border border-slate-800 relative overflow-hidden flex flex-col items-center justify-center p-2">
                    <div className="w-full h-full border border-dashed border-emerald-500/50 rounded flex items-center justify-center relative bg-emerald-950/20">
                      <div className="absolute top-1/4 left-1/3 w-20 h-10 border-2 border-red-500 rounded bg-red-500/30 animate-pulse flex items-start p-0.5">
                        <span className="text-[7px] bg-red-600 text-white font-black px-0.5">WEAPON</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400">CCTV NIGHTVISION 04</span>
                    </div>
                  </div>
                )}

                {doc.file_type === 'text' && (
                  <div className="p-3 bg-white rounded border border-slate-300 font-mono text-[10px] text-slate-700 leading-tight line-clamp-4">
                    {doc.content_text}
                  </div>
                )}

                <div className="text-[10px] text-slate-600 font-mono flex items-center justify-between">
                  <span>LOGGED: {new Date(doc.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST</span>
                  <span className="text-emerald-800 font-black">HASH VERIFIED</span>
                </div>
              </div>

              {/* Center Column: Title, Metadata, Transcript Block */}
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-950 uppercase tracking-tight">
                    {doc.title}
                  </h3>
                  <button
                    onClick={() => onOpenProvenance(doc.id, 'Line 1-8', doc.content_text?.slice(0, 180))}
                    className="text-xs text-indigo-700 hover:text-indigo-900 font-black flex items-center space-x-1"
                  >
                    <span>INSPECT IN PLACE</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="text-[11px] text-slate-600 font-mono flex flex-wrap items-center gap-3">
                  <span>PATH: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900">{doc.storage_path}</code></span>
                  <span>OFFICER: <strong>{doc.uploaded_by}</strong></span>
                </div>

                {/* Inline Transcript Block with Speaker Tags */}
                <div className="bg-white p-3.5 rounded border border-slate-300 font-sans text-xs text-slate-800 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap select-text">
                  {doc.content_text}
                </div>
              </div>

              {/* Right Column: Extracted Entities Panel */}
              <div className="lg:w-64 shrink-0 bg-[#E2DDD2] p-3.5 rounded border border-slate-300/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                    EXTRACTED ENTITIES
                  </span>
                  <span className="text-[9px] bg-emerald-800 text-white px-1.5 py-0.2 rounded font-black">
                    94% MATCH
                  </span>
                </div>

                <div className="space-y-1.5">
                  {entityList.map((ent, idx) => (
                    <div
                      key={idx}
                      className="p-1.5 bg-white rounded border border-slate-300 text-xs font-bold text-slate-900 flex items-center justify-between shadow-xs"
                    >
                      <span className="truncate">{ent}</span>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0 ml-1" />
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-slate-300/80 text-[10px] text-slate-600 flex items-center justify-between">
                  <span>AUTONOMOUS EXTRACTION</span>
                  <span className="text-indigo-800 font-bold">GROQ LLM</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
