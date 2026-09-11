'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useInvestigation } from '@/lib/store/investigation-context';
import {
  FolderPlus,
  X,
  FileText,
  Volume2,
  Image as ImageIcon,
  Video,
  Sparkles,
  UploadCloud,
  ChevronRight,
} from 'lucide-react';

interface AddNewCaseModalProps {
  onClose: () => void;
  defaultAgencySlug?: 'jodhpur' | 'kota';
}

type Step = 'details' | 'evidence';

export function AddNewCaseModal({ onClose, defaultAgencySlug = 'jodhpur' }: AddNewCaseModalProps) {
  const { ingestDocument, isProcessing, processingStatusText } = useInvestigation();

  const [step, setStep] = useState<Step>('details');

  // Case-level fields
  const [caseName, setCaseName] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [caseDescription, setCaseDescription] = useState('');
  const [selectedAgency, setSelectedAgency] = useState<'jodhpur' | 'kota'>(defaultAgencySlug);

  // Evidence-level fields (optional first evidence piece)
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [contentText, setContentText] = useState('');
  const [fileType, setFileType] = useState<'text' | 'audio' | 'image' | 'video'>('text');
  const [author, setAuthor] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    if (!evidenceTitle) setEvidenceTitle(file.name.replace(/\.[^/.]+$/, ''));
    if (file.type.startsWith('audio/')) setFileType('audio');
    else if (file.type.startsWith('image/')) setFileType('image');
    else if (file.type.startsWith('video/')) setFileType('video');
    else setFileType('text');

    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.log')) {
      const reader = new FileReader();
      reader.onload = (e) => setContentText(e.target?.result as string);
      reader.readAsText(file);
    } else {
      setContentText(
        `[Multimodal Ingest: ${file.name}]\nFormat: ${file.type || 'Binary'}\nSize: ${(file.size / 1024).toFixed(1)} KB\nExtracted forensic telemetry ready for AI model analysis.`
      );
    }
  }, [evidenceTitle]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, multiple: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseName.trim()) return;

    const fullTitle = caseNumber.trim()
      ? `${caseNumber.trim()}: ${caseName.trim()}`
      : caseName.trim();

    const bodyText = [
      caseDescription.trim() ? `Case Brief: ${caseDescription.trim()}` : '',
      contentText.trim() ? `\n\n--- Evidence Record ---\n${contentText.trim()}` : '',
    ]
      .filter(Boolean)
      .join('');

    await ingestDocument({
      title: evidenceTitle.trim() || fullTitle,
      content_text: bodyText || `New case opened: ${fullTitle}`,
      agency_slug: selectedAgency,
      file_type: fileType,
      uploaded_by: author.trim() || undefined,
    });

    onClose();
  };

  const fileTypeIcons = {
    text: <FileText className="w-4 h-4" />,
    audio: <Volume2 className="w-4 h-4" />,
    image: <ImageIcon className="w-4 h-4" />,
    video: <Video className="w-4 h-4" />,
  };

  return (
    <div className="w-full bg-white text-black font-mono flex flex-col max-h-[90vh]">
      {/* Modal Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-black text-white shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#F5C842] flex items-center justify-center shrink-0">
            <FolderPlus className="w-4.5 h-4.5 text-black" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest">ADD NEW CASE</h2>
            <p className="text-[10px] text-slate-400 font-bold">
              {step === 'details' ? 'Step 1 — Case Identity & Filing' : 'Step 2 — Initial Evidence (Optional)'}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-white/10 transition text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Step Indicator */}
      <div className="flex border-b-2 border-black shrink-0">
        {(['details', 'evidence'] as Step[]).map((s, i) => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className={`flex-1 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider transition border-r last:border-r-0 border-black ${
              step === s
                ? 'bg-[#F5C842] text-black'
                : 'bg-[#FBF9F5] text-slate-500 hover:bg-slate-100'
            }`}
          >
            {i + 1}. {s === 'details' ? 'Case Details' : 'Evidence File'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        {step === 'details' && (
          <div className="p-6 space-y-4">
            {/* Agency Selector */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5">
                Filing Agency
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['jodhpur', 'kota'] as const).map((agency) => (
                  <button
                    key={agency}
                    type="button"
                    onClick={() => setSelectedAgency(agency)}
                    className={`p-3 border-2 text-xs font-black uppercase tracking-wider transition ${
                      selectedAgency === agency
                        ? agency === 'jodhpur'
                          ? 'bg-[#0284C7] text-white border-[#0284C7]'
                          : 'bg-[#D97706] text-white border-[#D97706]'
                        : 'bg-[#FBF9F5] text-slate-700 border-black hover:bg-slate-100'
                    }`}
                  >
                    {agency === 'jodhpur' ? '🔵 Jodhpur Police HQ' : '🟡 Kota Police CID'}
                  </button>
                ))}
              </div>
            </div>

            {/* Case Number */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5">
                Case / FIR Number
              </label>
              <input
                type="text"
                placeholder="e.g. FIR-24-0091 or Operation Marwar"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                className="w-full bg-[#FBF9F5] border-2 border-black text-xs font-bold text-black p-2.5 outline-none focus:bg-white font-sans"
              />
            </div>

            {/* Case Name */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5">
                Case Title <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Aarav Singh — Contraband Trafficking Network"
                value={caseName}
                onChange={(e) => setCaseName(e.target.value)}
                className="w-full bg-[#FBF9F5] border-2 border-black text-xs font-bold text-black p-2.5 outline-none focus:bg-white font-sans"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5">
                Initial Case Brief / Description
              </label>
              <textarea
                rows={3}
                placeholder="Summarise the known facts, leads, or areas of investigation..."
                value={caseDescription}
                onChange={(e) => setCaseDescription(e.target.value)}
                className="w-full bg-[#FBF9F5] border-2 border-black text-xs font-medium text-black p-2.5 outline-none focus:bg-white font-sans resize-none"
              />
            </div>

            {/* Next Step */}
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setStep('evidence')}
                disabled={!caseName.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-xs font-black uppercase tracking-wider border-2 border-black shadow-brutal hover:bg-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition active:translate-x-0.5 active:translate-y-0.5"
              >
                Next: Add Evidence <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 'evidence' && (
          <div className="p-6 space-y-4">
            <p className="text-[11px] text-slate-600 font-bold border-l-4 border-[#F5C842] pl-3 bg-yellow-50 py-2 pr-3">
              Attach the first piece of evidence for this case. You can add more evidence later from the Evidence Vault.
            </p>

            {/* File Drop Zone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed border-black p-5 text-center cursor-pointer transition-all ${
                isDragActive ? 'bg-yellow-50 border-[#F5C842]' : 'bg-[#FBF9F5] hover:bg-white'
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud className="w-7 h-7 text-black mx-auto mb-2" />
              <p className="text-xs font-black uppercase text-black">
                Drop evidence file here or <span className="underline text-blue-700">browse</span>
              </p>
              <p className="text-[10px] text-slate-500 font-bold mt-1">
                .txt · .pdf · .mp3 · .wav · .jpg · .png · .mp4 (up to 50 MB)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Author */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5">
                  Depositing Officer
                </label>
                <input
                  type="text"
                  placeholder="e.g. Inspector Rajiv Rathore"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full bg-[#FBF9F5] border-2 border-black text-xs font-bold text-black p-2.5 outline-none focus:bg-white font-sans"
                />
              </div>

              {/* Evidence Title */}
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5">
                  Evidence Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mandore CCTV Frame #4"
                  value={evidenceTitle}
                  onChange={(e) => setEvidenceTitle(e.target.value)}
                  className="w-full bg-[#FBF9F5] border-2 border-black text-xs font-bold text-black p-2.5 outline-none focus:bg-white font-sans"
                />
              </div>
            </div>

            {/* File Classification */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5">
                Classification
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['text', 'audio', 'image', 'video'] as const).map((ft) => (
                  <button
                    key={ft}
                    type="button"
                    onClick={() => setFileType(ft)}
                    className={`p-2.5 border-2 flex flex-col items-center gap-1.5 text-[10px] font-black uppercase transition ${
                      fileType === ft
                        ? 'bg-black text-white border-black'
                        : 'bg-[#FBF9F5] text-slate-600 border-black/40 hover:border-black'
                    }`}
                  >
                    {fileTypeIcons[ft]}
                    {ft}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Text */}
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5">
                Forensic Content / Transcript
              </label>
              <textarea
                rows={4}
                placeholder="Paste statement, transcript, or observation log..."
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                className="w-full bg-[#FBF9F5] border-2 border-black text-xs font-medium text-black p-2.5 outline-none focus:bg-white font-sans resize-none"
              />
            </div>

            {/* Processing Banner */}
            {isProcessing && (
              <div className="p-3 bg-yellow-100 border-2 border-black text-xs font-black flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F5C842] animate-ping shrink-0" />
                <span>{processingStatusText || 'Running detective intelligence pipeline...'}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200 gap-2">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="px-4 py-2 bg-white border-2 border-black text-xs font-black uppercase hover:bg-slate-100 transition"
              >
                ← Back
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white border-2 border-black text-xs font-bold hover:bg-slate-100 transition"
                >
                  Skip Evidence
                </button>
                <button
                  type="submit"
                  disabled={isProcessing || !caseName.trim()}
                  className="flex items-center gap-2 px-5 py-2 bg-[#F5C842] hover:bg-[#EAB308] disabled:opacity-50 text-black font-black text-xs border-2 border-black shadow-brutal transition active:translate-x-0.5 active:translate-y-0.5"
                >
                  <Sparkles className="w-4 h-4" />
                  {isProcessing ? 'Creating Case...' : 'Create Case & Extract Intel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
