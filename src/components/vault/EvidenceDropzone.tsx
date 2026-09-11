'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useInvestigation } from '@/lib/store/investigation-context';
import {
  UploadCloud,
  FileText,
  Volume2,
  Image as ImageIcon,
  Video,
  Sparkles,
  CheckCircle2,
  X,
  Zap,
} from 'lucide-react';

interface EvidenceDropzoneProps {
  onClose?: () => void;
  defaultAgencySlug?: 'jodhpur' | 'kota';
}

export function EvidenceDropzone({ onClose, defaultAgencySlug = 'jodhpur' }: EvidenceDropzoneProps) {
  const { ingestDocument, isProcessing, processingStatusText } = useInvestigation();
  const [selectedAgency, setSelectedAgency] = useState<'jodhpur' | 'kota'>(defaultAgencySlug);
  const [title, setTitle] = useState('');
  const [contentText, setContentText] = useState('');
  const [fileType, setFileType] = useState<'text' | 'audio' | 'image' | 'video'>('text');

  // React Dropzone file drop handler
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setTitle(file.name.replace(/\.[^/.]+$/, ''));

    // Determine file type
    if (file.type.startsWith('audio/')) setFileType('audio');
    else if (file.type.startsWith('image/')) setFileType('image');
    else if (file.type.startsWith('video/')) setFileType('video');
    else setFileType('text');

    // Read text content if text file
    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.log')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setContentText(e.target?.result as string);
      };
      reader.readAsText(file);
    } else {
      setContentText(
        `[Multimodal Ingest: ${file.name}]\nFormat: ${file.type || 'Binary'}\nSize: ${(file.size / 1024).toFixed(1)} KB\nExtracted forensic telemetry ready for AI model analysis.`
      );
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await ingestDocument({
      title,
      content_text: contentText,
      agency_slug: selectedAgency,
      file_type: fileType,
    });

    if (onClose) onClose();
  };

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-2xl max-w-xl w-full text-slate-100 font-sans space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Ingest Multi-Modal Evidence Vault</h3>
            <p className="text-xs text-slate-400">Text, CCTV Images, Audio Wiretaps, or Dashcam Video</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Manual File Dropzone Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-cyan-400 bg-cyan-950/20'
            : 'border-slate-700 hover:border-slate-500 bg-slate-950/50'
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-xs text-slate-300 font-medium">
          Drag & drop evidence file here, or <span className="text-cyan-400 font-bold">browse</span>
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          Supports .txt, .pdf, .mp3, .wav, .jpg, .png, .mp4 (up to 50MB)
        </p>
      </div>

      {/* Upload Details Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Source Agency:</label>
            <select
              value={selectedAgency}
              onChange={(e) => setSelectedAgency(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
            >
              <option value="jodhpur">Jodhpur Police (Commissionerate)</option>
              <option value="kota">Kota Police (Crime Branch)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">File Classification:</label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none"
            >
              <option value="text">Text Statement / FIR Memo</option>
              <option value="audio">Audio Wiretap / Intercept</option>
              <option value="image">CCTV / ANPR Still Frame</option>
              <option value="video">Surveillance Video Stream</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1">Evidence Title:</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Mandore CCTV Camera 2 Footage Extract"
            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-400 mb-1">
            Forensic Text Content / Transcript / Optical Notes:
          </label>
          <textarea
            rows={4}
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            placeholder="Paste text statement, timestamped transcript, or visual observation log..."
            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded transition"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isProcessing || !title.trim()}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Processing AI Pipeline...' : 'Ingest & Extract Intelligence'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
