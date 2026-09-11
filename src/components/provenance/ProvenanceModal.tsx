'use client';

import React, { useRef, useEffect } from 'react';
import { useInvestigation } from '@/lib/store/investigation-context';
import {
  FileText,
  Volume2,
  Image as ImageIcon,
  Video,
  X,
  ExternalLink,
  ShieldCheck,
  Play,
  SkipForward,
  Crosshair,
  Hash,
} from 'lucide-react';

export function ProvenanceModal() {
  const { provenanceFocus, setProvenanceFocus, documents, agencies } = useInvestigation();
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!provenanceFocus) return null;

  const doc = documents.find((d) => d.id === provenanceFocus.documentId);
  const fileType = provenanceFocus.mediaType || doc?.file_type || 'text';
  const offset = provenanceFocus.sourceOffset;

  // Jump to timecode in seconds if audio/video
  const handleSeek = (timecodeStr: string) => {
    const parts = timecodeStr.split(':').map(Number);
    let seconds = 0;
    if (parts.length === 2) {
      seconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    if (audioRef.current && !isNaN(seconds)) {
      audioRef.current.currentTime = seconds;
      audioRef.current.play().catch(() => {});
    }
    if (videoRef.current && !isNaN(seconds)) {
      videoRef.current.currentTime = seconds;
      videoRef.current.play().catch(() => {});
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
              {fileType === 'text' && <FileText className="w-5 h-5" />}
              {fileType === 'audio' && <Volume2 className="w-5 h-5" />}
              {fileType === 'image' && <ImageIcon className="w-5 h-5" />}
              {fileType === 'video' && <Video className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  Forensic Provenance Inspector
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Chain-of-Custody Grounded</span>
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100 mt-1">
                {doc?.title || provenanceFocus.title || 'Classified Evidence File'}
              </h3>
            </div>
          </div>

          <button
            onClick={() => setProvenanceFocus(null)}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Source Offset Tactical Sub-Bar */}
        <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Sacred Source Offset:</span>
            <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80 font-bold">
              {offset}
            </span>
          </div>

          <div className="flex items-center gap-3 text-slate-400">
            <span>Agency: {doc?.agency_id ? (agencies.jodhpur.id === doc.agency_id ? 'Jodhpur Police' : 'Kota Police') : 'Joint'}</span>
            <span>•</span>
            <span>Uploaded by: {doc?.uploaded_by || 'Evidence Officer'}</span>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* TEXT DOCUMENT VIEWER WITH LINE-BY-LINE GLOWING HIGHLIGHT */}
          {fileType === 'text' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-1">
                <span>Original Statement Text Record (FIR / Seizure Memo):</span>
                <span className="text-amber-400">Lines matching offset highlighted below</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto space-y-1">
                {(doc?.content_text || provenanceFocus.snippet || '')
                  .split('\n')
                  .map((line, idx) => {
                    const lineNum = idx + 1;
                    const isOffsetMatch =
                      offset.toLowerCase().includes(`line ${lineNum}`) ||
                      offset.toLowerCase().includes(`line`) &&
                        (line.toLowerCase().includes('scorpio') || line.toLowerCase().includes('vicky') || line.toLowerCase().includes('pistol'));

                    return (
                      <div
                        key={idx}
                        className={`px-2 py-0.5 rounded flex items-start gap-3 transition-all ${
                          isOffsetMatch
                            ? 'bg-amber-500/20 text-amber-200 border-l-4 border-amber-400 pl-3 font-semibold'
                            : 'hover:bg-slate-900/60'
                        }`}
                      >
                        <span className="text-slate-500 select-none text-[11px] w-6 shrink-0 text-right">
                          {lineNum}
                        </span>
                        <span className="flex-1 whitespace-pre-wrap">{line}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* AUDIO WIRETAP VIEWER WITH NATIVE PLAYER & TIMECODE JUMP */}
          {fileType === 'audio' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-cyan-500/30 rounded-lg space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4" /> Native Audio Player (HTML5)
                  </span>
                  <button
                    onClick={() => handleSeek(offset.replace(/[^\d:]/g, '') || '01:31')}
                    className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 shadow"
                  >
                    <Play className="w-3 h-3" />
                    <span>Seek to Offset ({offset})</span>
                  </button>
                </div>

                {/* Simulated Audio Waveform Bar */}
                <div className="h-10 bg-slate-900 rounded flex items-center gap-0.5 px-3 overflow-hidden">
                  {Array.from({ length: 48 }).map((_, i) => {
                    const heightPercent = 20 + Math.sin(i * 0.4) * 40 + (i % 3 === 0 ? 30 : 10);
                    const isNearOffset = i >= 18 && i <= 24;
                    return (
                      <div
                        key={i}
                        style={{ height: `${heightPercent}%` }}
                        className={`flex-1 rounded-full transition-all ${
                          isNearOffset ? 'bg-amber-400 shadow-sm shadow-amber-400' : 'bg-cyan-600/50'
                        }`}
                      />
                    );
                  })}
                </div>

                <audio
                  ref={audioRef}
                  controls
                  className="w-full h-8 accent-cyan-500 rounded"
                  src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
                />
              </div>

              {/* Timestamped Transcript */}
              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400">Forensic Wiretap Transcript:</span>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs space-y-2 text-slate-300">
                  {(doc?.content_text || '').split('\n').map((seg, sIdx) => {
                    const isTarget = seg.includes(offset) || seg.includes('Vicky');
                    return (
                      <div
                        key={sIdx}
                        className={`p-2 rounded border transition ${
                          isTarget
                            ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
                            : 'bg-slate-900/40 border-slate-800/80 text-slate-300'
                        }`}
                      >
                        {seg}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* IMAGE / CCTV VIEWER WITH BOUNDING BOX OVERLAY */}
          {fileType === 'image' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                <span>CCTV Optical Forensics & ANPR Detection:</span>
                <span className="text-cyan-400 font-bold">Bounding Box Offset: {offset}</span>
              </div>

              <div className="relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center p-6 min-h-[300px]">
                {/* SVG/Canvas Simulated Surveillance Frame with Bounding Box */}
                <div className="relative max-w-md w-full aspect-video bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />

                  {/* Camera OSD Overlay */}
                  <div className="absolute top-2 left-2 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                    <span>REC • CAM-04 BILARA TOLL (NH-25)</span>
                  </div>
                  <div className="absolute bottom-2 left-2 text-[10px] font-mono text-slate-400">
                    ANPR RESOLUTION: 4K HIGHWAY OCR
                  </div>

                  {/* Visual Silhouette & Bounding Box */}
                  <div className="relative w-48 h-32 border-2 border-dashed border-amber-400 rounded bg-amber-500/10 flex flex-col items-center justify-between p-2 shadow-lg shadow-amber-500/20 animate-pulse">
                    <div className="w-full flex items-center justify-between text-[10px] font-mono text-amber-300 font-bold">
                      <span className="flex items-center gap-1">
                        <Crosshair className="w-3 h-3" />
                        <span>TARGET BBOX [120,450,280,620]</span>
                      </span>
                      <span>98.4% CONF</span>
                    </div>

                    <div className="text-center">
                      <div className="text-xs font-mono font-bold text-white bg-slate-950/90 px-2 py-1 rounded border border-slate-700">
                        RJ-19-UB-4022
                      </div>
                      <div className="text-[10px] font-mono text-amber-400 mt-1">
                        White Mahindra Scorpio
                      </div>
                    </div>

                    <div className="text-[9px] font-mono text-slate-400">
                      Driver: Vikram Rathore (Facial match)
                    </div>
                  </div>
                </div>
              </div>

              {/* Optical Metadata */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-300 flex items-center justify-between">
                <span>Sensor: Lane 4 Camera - Bilara Toll Plaza (NH-25)</span>
                <span className="text-emerald-400 font-bold">ANPR Match: RJ-19-UB-4022 (98.4%)</span>
              </div>
            </div>
          )}

          {/* VIDEO SURVEILLANCE VIEWER */}
          {fileType === 'video' && (
            <div className="space-y-3">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <video
                  ref={videoRef}
                  controls
                  className="w-full aspect-video bg-black rounded-lg"
                  poster="https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80"
                />
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-2">
                  <span>Playback Timecode Offset: {offset}</span>
                  <button
                    onClick={() => handleSeek('04:15')}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    Jump to Incident Frame (04:15)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Non-Negotiable Rule: Every AI output carries a source citation and confidence score.</span>
          <button
            onClick={() => setProvenanceFocus(null)}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
