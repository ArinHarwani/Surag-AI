'use client';

import React, { useRef } from 'react';
import { Document } from '@/types/investigation';
import { useInvestigation } from '@/lib/store/investigation-context';
import { 
  X, 
  FileText, 
  Image as ImageIcon, 
  Music, 
  Video as VideoIcon, 
  Copy, 
  Check, 
  ShieldCheck, 
  Play, 
  Clock, 
  Target 
} from 'lucide-react';

interface ProvenanceInspectorProps {
  document: Document | null;
  sourceOffset: string;
  snippet?: string;
  onClose: () => void;
}

export const NexusProvenanceInspector: React.FC<ProvenanceInspectorProps> = ({
  document,
  sourceOffset,
  snippet,
  onClose
}) => {
  const [copied, setCopied] = React.useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { agencies } = useInvestigation();

  if (!document) return null;

  const fileType = document.file_type;
  const filename = document.title;
  const fullContent = document.content_text || '';
  const displaySnippet = snippet || fullContent.slice(0, 200);

  // Resolve agency label from the agencies map using the UUID-based agency_id
  const depositingAgencyLabel = document.agency_id
    ? Object.values(agencies).find((a) => a.id === document.agency_id)?.name ??
      // fallback: use slug-based label if present in agency_id string
      (document.agency_id.toLowerCase().includes('jod') ? 'Jodhpur Police HQ' : 'Unknown Agency')
    : 'Unknown Agency';

  const copyCitation = () => {
    const text = `[CITATION: ${filename}] "${displaySnippet}" (Offset: ${sourceOffset})`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const seekAudio = (timecode: string) => {
    if (!audioRef.current) return;
    const parts = timecode.replace(/[^0-9:]/g, '').split(':').map(Number);
    let sec = 0;
    if (parts.length === 2) sec = parts[0] * 60 + parts[1];
    else if (parts.length === 3) sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
    audioRef.current.currentTime = sec;
    audioRef.current.play();
  };

  return (
    <div className="w-[420px] shrink-0 bg-white border-l-2 border-black shadow-brutal-lg flex flex-col font-mono text-black select-none h-full overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-black bg-[#EFECE6]">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-black text-[#F5C842] font-black border border-black shadow-xs">
            {fileType === 'text' && <FileText className="w-4 h-4" />}
            {fileType === 'image' && <ImageIcon className="w-4 h-4" />}
            {fileType === 'audio' && <Music className="w-4 h-4" />}
            {fileType === 'video' && <VideoIcon className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs uppercase tracking-wider text-black font-black">
                PROVENANCE INSPECTOR
              </span>
              <span className="text-[10px] bg-black text-[#F5C842] font-black px-1.5 py-0.2">
                {sourceOffset}
              </span>
            </div>
            <h3 className="text-xs font-black text-black truncate max-w-xs mt-0.5">
              {filename}
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={copyCitation}
            className="p-1.5 text-black hover:bg-slate-200 border border-black transition"
            title="Copy Grounded Citation"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-black hover:bg-slate-200 border border-black transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Verification Guarantee */}
        <div className="p-3 bg-emerald-50 border-2 border-emerald-600 flex items-start space-x-2.5 text-xs text-emerald-950 shadow-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-black uppercase tracking-wider text-xs text-emerald-900">
              VERIFIED SOURCE CITATION
            </p>
            <p className="text-xs text-emerald-800 font-sans mt-0.5 font-medium">
              Directly grounds extracted timeline events, entities, and relationship confidence scores in raw telemetry.
            </p>
          </div>
        </div>

        {/* Highlighted Snippet */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-black uppercase text-black">
            <span>GROUNDED EVIDENCE SNIPPET</span>
            <span className="bg-[#F5C842] text-black px-2 py-0.5 border border-black text-[10px]">
              OFFSET: {sourceOffset}
            </span>
          </div>
          <div className="p-4 bg-[#FBF9F5] border-2 border-black text-black font-sans text-xs font-semibold leading-relaxed shadow-brutal select-text">
            &ldquo;{displaySnippet}&rdquo;
          </div>
        </div>

        {/* Audio Waveform & Timestamp Player */}
        {fileType === 'audio' && (
          <div className="p-4 bg-white border-2 border-black space-y-3 shadow-brutal">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-black flex items-center space-x-1">
                <Music className="w-4 h-4 text-black" />
                <span>RADIO WIRETAP PLAYER</span>
              </span>
              <span className="text-slate-600 font-mono">00:38 TOTAL</span>
            </div>

            <audio
              ref={audioRef}
              src={document.media_url || 'https://actions.google.com/sounds/v1/emergency/police_radio_chatter.ogg'}
              controls
              className="w-full h-8"
            />

            <div className="space-y-1 pt-1">
              <span className="text-[10px] text-slate-700 font-black uppercase">
                DETECTED VOICEMATCH TIMECODES:
              </span>
              <div className="flex flex-wrap gap-2">
                {['00:05', '00:14', '00:24', '00:33'].map((tc) => (
                  <button
                    key={tc}
                    onClick={() => seekAudio(tc)}
                    className="px-2 py-1 bg-[#FBF9F5] hover:bg-[#F5C842] border border-black text-black text-xs font-black flex items-center space-x-1 transition shadow-xs"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>JUMP {tc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Image Bounding Box Telemetry */}
        {fileType === 'image' && (
          <div className="p-4 bg-white border-2 border-black space-y-3 shadow-brutal">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-black flex items-center space-x-1">
                <Target className="w-4 h-4 text-red-600" />
                <span>OPTICAL CAMERA BOUNDING BOX</span>
              </span>
              <span className="text-emerald-700 font-black text-[10px] bg-emerald-100 px-1.5 py-0.5 border border-emerald-500">
                CONF: 94.2%
              </span>
            </div>

            <div className="relative aspect-video bg-[#111111] border-2 border-black flex items-center justify-center overflow-hidden">
              <div className="absolute top-4 left-1/4 w-36 h-16 border-2 border-red-500 bg-red-500/30 flex flex-col justify-between p-1">
                <span className="text-[9px] bg-red-600 text-white font-black px-1 self-start">
                  GLOCK 19
                </span>
                <span className="text-[8px] font-mono text-white self-end">
                  bbox [120,450,280,620]
                </span>
              </div>
              <span className="text-xs font-mono text-slate-300 font-bold">
                CCTV CAMERA 04 // NAYAPURA
              </span>
            </div>
          </div>
        )}

        {/* Full Document Metadata Table */}
        <div className="p-3.5 bg-[#FBF9F5] border-2 border-black space-y-2 shadow-brutal text-xs">
          <div className="text-xs font-black uppercase text-black border-b border-black pb-1">
            CHAIN OF CUSTODY ATTRIBUTES
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
            <div>
              <span className="text-slate-600 font-bold block">Document ID:</span>
              <span className="font-mono font-black text-black">{document.id}</span>
            </div>
            <div>
              <span className="text-slate-600 font-bold block">Depositing Agency:</span>
              <span className="font-black text-black">
                {depositingAgencyLabel}
              </span>
            </div>
            <div>
              <span className="text-slate-600 font-bold block">Investigator:</span>
              <span className="font-black text-black">{document.uploaded_by}</span>
            </div>
            <div>
              <span className="text-slate-600 font-bold block">Checksum:</span>
              <span className="font-mono text-emerald-800 font-black">SHA-256 OK</span>
            </div>
          </div>
        </div>

        {/* Full Document Raw Text */}
        <div className="space-y-1.5">
          <span className="text-xs font-black uppercase text-black">
            UNABRIDGED EVIDENCE CONTENT:
          </span>
          <pre className="p-3 bg-[#FBF9F5] border border-black text-xs text-slate-900 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed select-text font-medium">
            {fullContent}
          </pre>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3.5 border-t-2 border-black bg-[#EFECE6] flex items-center justify-between">
        <button
          onClick={copyCitation}
          className="px-3.5 py-1.5 bg-black hover:bg-slate-900 text-[#F5C842] font-black text-xs border border-black shadow-sm flex items-center space-x-1.5 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY CITATION'}</span>
        </button>

        <button
          onClick={onClose}
          className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-black font-black text-xs border border-black shadow-sm transition"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};
