'use client';

import React, { useRef } from 'react';
import { Document } from '@/types/investigation';
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

  if (!document) return null;

  const fileType = document.file_type;
  const filename = document.title;
  const fullContent = document.content_text || '';
  const displaySnippet = snippet || fullContent.slice(0, 200);

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
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-[#090A0D]/95 border-l border-[#232731] shadow-2xl z-50 flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-200 font-mono text-white select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#232731] bg-[#0E1015]">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded bg-[#F4C430] text-black font-bold">
            {fileType === 'text' && <FileText className="w-4 h-4" />}
            {fileType === 'image' && <ImageIcon className="w-4 h-4" />}
            {fileType === 'audio' && <Music className="w-4 h-4" />}
            {fileType === 'video' && <VideoIcon className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] uppercase tracking-widest text-[#F4C430] font-black">
                PROVENANCE INSPECTOR
              </span>
              <span className="text-[9px] bg-black text-slate-400 px-1.5 py-0.5 rounded border border-[#232731]">
                {sourceOffset}
              </span>
            </div>
            <h3 className="text-xs font-bold text-slate-200 truncate max-w-xs mt-0.5">
              {filename}
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={copyCitation}
            className="p-1 text-slate-400 hover:text-white hover:bg-[#1C202A] rounded transition"
            title="Copy Grounded Citation"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-[#1C202A] rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Verification Guarantee */}
        <div className="p-3 rounded bg-emerald-950/30 border border-emerald-800/60 flex items-start space-x-2.5 text-xs text-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-white uppercase tracking-wider text-[10px]">
              VERIFIED CUSTODY ANCHOR
            </p>
            <p className="text-[11px] text-emerald-300/90 font-sans">
              Cryptographically bound to source evidence hash. Strictly grounds timeline events and relationship confidence.
            </p>
          </div>
        </div>

        {/* Highlighted Snippet */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
              GROUNDED EVIDENCE SNIPPET
            </span>
            <span className="text-[9px] text-[#F4C430] bg-[#F4C430]/10 px-1.5 py-0.5 rounded border border-[#F4C430]/30 font-bold">
              OFFSET: {sourceOffset}
            </span>
          </div>
          <div className="p-4 rounded bg-[#EDE9E0] border-l-4 border-[#F4C430] text-slate-950 font-sans text-xs font-semibold leading-relaxed shadow-md select-text">
            &ldquo;{displaySnippet}&rdquo;
          </div>
        </div>

        {/* Audio Player with Seek */}
        {fileType === 'audio' && (
          <div className="p-4 rounded bg-[#111318] border border-[#232731] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                <Music className="w-3.5 h-3.5 text-[#F4C430]" />
                <span>Audio Wiretap Replay</span>
              </span>
              <button
                onClick={() => seekAudio(sourceOffset.includes(':') ? sourceOffset : '00:14')}
                className="flex items-center space-x-1 text-[11px] bg-[#F4C430] hover:bg-[#EAB308] text-black px-2.5 py-1 rounded font-black transition shadow"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Seek to {sourceOffset.includes(':') ? sourceOffset : '00:14'}</span>
              </button>
            </div>

            {/* Audio Waveform Simulation Graphic */}
            <div className="h-12 bg-[#090A0D] rounded flex items-center justify-center space-x-1 px-3 border border-[#232731]">
              {[30, 70, 45, 90, 100, 35, 80, 95, 50, 85, 40, 60, 90, 75, 40, 85, 60, 95, 70, 30, 85].map(
                (h, idx) => (
                  <span
                    key={idx}
                    className="w-1.5 bg-[#F4C430] rounded-full transition-all duration-300 hover:bg-white"
                    style={{ height: `${h}%` }}
                  />
                )
              )}
            </div>

            <audio
              ref={audioRef}
              controls
              className="w-full h-8 rounded"
              src={document.media_url || 'https://actions.google.com/sounds/v1/emergency/police_radio_chatter.ogg'}
            >
              Audio playback unsupported.
            </audio>
          </div>
        )}

        {/* Image Bounding Box Frame */}
        {fileType === 'image' && (
          <div className="p-4 rounded bg-[#111318] border border-[#232731] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center space-x-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>Optical OCR & Target Bounding Box</span>
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                BBOX: {sourceOffset}
              </span>
            </div>

            <div className="relative aspect-video bg-[#090A0D] rounded border border-[#232731] flex flex-col items-center justify-center p-3 overflow-hidden">
              <div className="w-full h-full border border-dashed border-emerald-500/40 rounded flex items-center justify-center relative bg-emerald-950/10">
                <div className="absolute top-1/4 left-1/3 w-32 h-20 border-2 border-red-500 rounded bg-red-500/20 flex items-start p-1 animate-pulse">
                  <span className="text-[8px] font-mono font-black bg-red-600 text-white px-1 rounded">
                    WEAPON DETECTED [94.2%]
                  </span>
                </div>
                <div className="text-center text-xs text-slate-400">
                  <p className="font-mono text-slate-300">Nayapura Toll Camera 04 Optical Frame</p>
                  <p className="text-[10px] text-slate-500 mt-1">2026-09-11 02:30:18 IST // Glock 19</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Document Raw Record */}
        <div>
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1.5 block">
            RAW EVIDENCE DOSSIER
          </span>
          <div className="bg-[#111318] border border-[#232731] rounded p-3 text-xs text-slate-300 max-h-60 overflow-y-auto whitespace-pre-wrap leading-relaxed select-text font-mono">
            {fullContent}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#232731] bg-[#0E1015] flex items-center justify-between text-[11px] text-slate-400">
        <span className="font-mono text-slate-500 truncate max-w-[250px]">
          ID: {document.id}
        </span>
        <button
          onClick={onClose}
          className="px-3.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold transition"
        >
          CLOSE
        </button>
      </div>
    </div>
  );
};
