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
  Lock
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

  const [author, setAuthor] = useState('');

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
      uploaded_by: author.trim() || undefined,
    });

    if (onClose) onClose();
  };

  return (
    <div className="w-full bg-white p-6 text-black font-mono space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b-2 border-black pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 bg-black text-[#F5C842] flex items-center justify-center font-black border border-black shadow-sm">
            <UploadCloud className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-black">
              INGEST MULTI-MODAL EVIDENCE VAULT
            </h3>
            <p className="text-[11px] text-slate-700 font-bold">
              Text Statements, CCTV Video/Stills, Audio Wiretaps, or Forensics
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 border border-black hover:bg-slate-100 text-black transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Manual File Dropzone Area (Clean light border) */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed border-black rounded-none p-6 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'bg-yellow-50 border-[#F5C842]'
            : 'bg-[#FBF9F5] hover:bg-white'
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="w-8 h-8 text-black mx-auto mb-2" />
        <p className="text-xs text-black font-black uppercase">
          Drag &amp; drop evidence file here, or <span className="underline text-blue-700">browse</span>
        </p>
        <p className="text-[10px] text-slate-600 font-bold mt-1">
          Supports .txt, .pdf, .mp3, .wav, .jpg, .png, .mp4 (up to 50MB)
        </p>
      </div>

      {/* Upload Details Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-800 mb-1">
              Source Agency:
            </label>
            <select
              value={selectedAgency}
              onChange={(e) => setSelectedAgency(e.target.value as any)}
              className="w-full bg-[#FBF9F5] border-2 border-black text-xs font-bold text-black p-2 outline-none focus:bg-white"
            >
              <option value="jodhpur">Jodhpur Police (Commissionerate)</option>
              <option value="kota">Kota Police (Special Intelligence Unit)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase text-slate-800 mb-1">
              File Classification:
            </label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value as any)}
              className="w-full bg-[#FBF9F5] border-2 border-black text-xs font-bold text-black p-2 outline-none focus:bg-white"
            >
              <option value="text">Text Statement / FIR Memo</option>
              <option value="audio">Audio Wiretap / Intercept (.mp3/.wav)</option>
              <option value="image">CCTV NightVision / Optical Frame</option>
              <option value="video">Surveillance Video (.mp4)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-black uppercase text-slate-800 mb-1">
              Author / Depositing Officer:
            </label>
            <input
              type="text"
              placeholder="e.g. Inspector Rajiv Rathore (Jodhpur PD)"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full bg-[#FBF9F5] border-2 border-black text-xs font-bold text-black p-2 outline-none focus:bg-white font-sans"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase text-slate-800 mb-1">
              Evidence Title:
            </label>
            <input
              type="text"
              placeholder="e.g. Mandore CCTV Camera 2 Footage Extract"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#FBF9F5] border-2 border-black text-xs font-bold text-black p-2 outline-none focus:bg-white font-sans"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-black uppercase text-slate-800 mb-1">
            Forensic Text Content / Transcript / Optical Notes:
          </label>
          <textarea
            rows={4}
            placeholder="Paste text statement, timestamped transcript, or visual observation log..."
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            className="w-full bg-[#FBF9F5] border-2 border-black text-xs font-medium text-black p-2.5 outline-none focus:bg-white font-sans resize-none"
          />
        </div>

        {/* Live Processing Notice */}
        {isProcessing && (
          <div className="p-2.5 bg-yellow-100 border-2 border-black text-xs font-black flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#F5C842] animate-ping" />
            <span>{processingStatusText || 'Extracting Named Entities and Diarization...'}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-black font-bold text-xs border-2 border-black transition"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isProcessing || !title.trim()}
            className="px-5 py-2 bg-[#F5C842] hover:bg-[#EAB308] disabled:opacity-50 text-black font-black text-xs border-2 border-black shadow-brutal flex items-center space-x-1.5 transition active:translate-x-0.5 active:translate-y-0.5"
          >
            <Sparkles className="w-4 h-4 text-black" />
            <span>{isProcessing ? 'Ingesting...' : 'Ingest & Extract Intelligence'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
