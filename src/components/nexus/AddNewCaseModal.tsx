'use client';

import React, { useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
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
import { AgencySlug } from '@/types/investigation';
import { formatEvidenceTitleFromFile, generateOpticalTelemetry, generatePdfTelemetry, generateCsvTelemetry } from '@/lib/utils/evidenceFormatter';

interface AddNewCaseModalProps {
  onClose: () => void;
  /** The portal this modal is being opened from — always the filing agency */
  filingAgency: AgencySlug;
  /**
   * If true, the modal skips the Case Details step and goes straight to
   * evidence upload, appending the new evidence to the existing active case.
   */
  isAddingEvidence?: boolean;
}

type Step = 'details' | 'evidence';

function AddNewCaseModalInner({ onClose, filingAgency, isAddingEvidence = false }: AddNewCaseModalProps) {
  const { ingestDocument, isProcessing, processingStatusText, agencies, activeCaseName } = useInvestigation();

  const [step, setStep] = useState<Step>(isAddingEvidence ? 'evidence' : 'details');

  // Case-level fields (only used when creating a new case)
  const [caseName, setCaseName] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [caseDescription, setCaseDescription] = useState('');

  // Evidence-level fields (optional first evidence piece)
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [contentText, setContentText] = useState('');
  const [fileType, setFileType] = useState<'text' | 'audio' | 'image' | 'video' | 'pdf' | 'csv'>('text');
  const [author, setAuthor] = useState('');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeStatus, setTranscribeStatus] = useState<string | null>(null);

  // Disable body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];

    const isAudio =
      fileType === 'audio' ||
      file.type.startsWith('audio/') ||
      /\.(mp3|wav|m4a|ogg|aac|flac|wma|opus|weba|amr|3gp|m4b|mpeg|mpga)$/i.test(file.name) ||
      /audio|voice|recording|call|wiretap|speech|intercept/i.test(file.name);

    if (isAudio) {
      setFileType('audio');
      setEvidenceTitle(formatEvidenceTitleFromFile(file.name, 'audio'));
      setIsTranscribing(true);
      setTranscribeStatus('🎙️ Sarvam AI (Saaras): Transcribing speech (English / Hindi)...');
      setContentText(`[Transcribing audio via Sarvam AI (${file.name})... please wait]`);

      // Read audio data URL with audio MIME so browser HTML5 audio element plays it!
      const arrayBuf = await file.arrayBuffer();
      let audioMime = 'audio/mpeg';
      if (file.name.toLowerCase().endsWith('.wav')) audioMime = 'audio/wav';
      else if (file.name.toLowerCase().endsWith('.ogg') || file.name.toLowerCase().endsWith('.opus')) audioMime = 'audio/ogg';
      else if (file.name.toLowerCase().endsWith('.m4a') || file.name.toLowerCase().endsWith('.aac')) audioMime = 'audio/mp4';

      const audioBlob = new Blob([arrayBuf], { type: audioMime });
      const audioReader = new FileReader();
      audioReader.onload = (e) => {
        setMediaUrl(e.target?.result as string);
      };
      audioReader.readAsDataURL(audioBlob);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/ai/transcribe', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          if (data.transcript) {
            let formatted = `[SARVAM AI FORENSIC TRANSCRIPT — ${file.name}]\n`;
            if (data.english_translation && data.english_translation.trim() !== data.transcript.trim()) {
              formatted += `Original Language: ${data.language_code || 'Hindi'}\n\n--- ORIGINAL TRANSCRIPT ---\n${data.transcript}\n\n--- ENGLISH TRANSLATION (SARVAM MAYURA) ---\n${data.english_translation}`;
            } else {
              formatted += `Language: ${data.language_code || 'English/Auto'}\n\n--- TRANSCRIPT ---\n${data.transcript}`;
            }
            setContentText(formatted);
            setTranscribeStatus(`✅ Transcribed (${data.language_code || 'detected'}) via Sarvam AI`);
          } else {
            setContentText(`[Audio Ingest: ${file.name} — No audible speech detected by Sarvam Saaras STT]`);
            setTranscribeStatus('⚠️ No speech detected in audio file');
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          setContentText(`[Audio File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]\n(Manual transcription or notes can be entered below)`);
          setTranscribeStatus(`⚠️ Transcription failed: ${errData.error || res.statusText}`);
        }
      } catch (err: any) {
        console.error('Audio transcription error:', err);
        setContentText(`[Audio File: ${file.name}]\n(Transcription connection issue, manual notes can be entered)`);
        setTranscribeStatus('⚠️ Network error during Sarvam transcription');
      } finally {
        setIsTranscribing(false);
      }
      return;
    }

    const isImage =
      fileType === 'image' ||
      file.type.startsWith('image/') ||
      /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(file.name);

    if (isImage) {
      setFileType('image');
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      const dynamicTitle = formatEvidenceTitleFromFile(file.name, 'image');
      setEvidenceTitle(dynamicTitle);

      const baseTelemetry = generateOpticalTelemetry(file, filingAgency);
      setContentText(baseTelemetry);

      setIsTranscribing(true);
      setTranscribeStatus('🔍 Optical AI: Scanning image for signs, plates, or timestamps...');

      try {
        const ocrFormData = new FormData();
        ocrFormData.append('file', file);
        const ocrRes = await fetch('/api/ai/ocr', {
          method: 'POST',
          body: ocrFormData,
        });

        if (ocrRes.ok) {
          const ocrData = await ocrRes.json();
          if (ocrData.has_text && ocrData.text?.trim()) {
            setContentText(
              `${baseTelemetry}\n\n--- EXTRACTED OPTICAL OCR TEXT OVERLAYS ---\n${ocrData.text.trim()}`
            );
            setTranscribeStatus(`✅ OCR Text Extracted (${ocrData.text.split('\n').filter(Boolean).length} lines found)`);
          } else {
            setTranscribeStatus(`✅ Optical evidence loaded (${(file.size / 1024).toFixed(1)} KB)`);
          }
        } else {
          setTranscribeStatus(`✅ Optical evidence loaded (${(file.size / 1024).toFixed(1)} KB)`);
        }
      } catch (err) {
        console.warn('OCR error:', err);
        setTranscribeStatus(`✅ Optical evidence loaded (${(file.size / 1024).toFixed(1)} KB)`);
      } finally {
        setIsTranscribing(false);
      }
      return;
    }

    const isPdf =
      fileType === 'pdf' ||
      file.type === 'application/pdf' ||
      /\.pdf$/i.test(file.name);

    if (isPdf) {
      setFileType('pdf');
      const dynamicTitle = formatEvidenceTitleFromFile(file.name, 'pdf');
      setEvidenceTitle(dynamicTitle);

      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      setIsTranscribing(true);
      setTranscribeStatus('📄 Reading & extracting text from PDF document...');
      setContentText(`[Ingesting PDF Document: ${file.name} (${(file.size / 1024).toFixed(1)} KB)... extracting text]`);

      try {
        const pdfFormData = new FormData();
        pdfFormData.append('file', file);
        const res = await fetch('/api/ai/pdf', {
          method: 'POST',
          body: pdfFormData,
        });

        if (res.ok) {
          const pdfData = await res.json();
          if (pdfData.has_text && pdfData.text?.trim()) {
            const telemetry = generatePdfTelemetry(file, pdfData.total_pages || 1, pdfData.text, filingAgency);
            setContentText(telemetry);
            setTranscribeStatus(`✅ PDF Extracted (${pdfData.total_pages || 1} page(s) · ${pdfData.text.split(/\s+/).filter(Boolean).length} words)`);
          } else {
            const telemetry = generatePdfTelemetry(file, pdfData.total_pages || 1, '', filingAgency);
            setContentText(telemetry);
            setTranscribeStatus(`⚠️ PDF loaded (${pdfData.total_pages || 1} page(s) — scanned image, observational notes can be added below)`);
          }
        } else {
          setContentText(`[PDF Document: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]\n(Manual notes can be entered below)`);
          setTranscribeStatus('⚠️ PDF extraction error, manual notes active');
        }
      } catch (err: any) {
        console.error('PDF parsing error:', err);
        setContentText(`[PDF Document: ${file.name}]\n(Manual notes can be entered below)`);
        setTranscribeStatus('⚠️ Network error during PDF processing');
      } finally {
        setIsTranscribing(false);
      }
      return;
    }

    const isVideo =
      !isAudio &&
      !isImage &&
      !isPdf &&
      (fileType === 'video' || file.type.startsWith('video/') || /\.(mp4|mov|avi|mkv|webm)$/i.test(file.name));

    if (isVideo) {
      setFileType('video');
      setEvidenceTitle(formatEvidenceTitleFromFile(file.name, 'video'));
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      setContentText(
        `[VIDEO SURVEILLANCE FOOTAGE // ${file.name}]\nFormat: ${file.type || 'video/mp4'}\nSize: ${(file.size / 1024).toFixed(1)} KB\nTimestamp: ${new Date().toLocaleString('en-IN')}\n\nOfficer Video Log Notes:\n- Recorded surveillance footage attached for timeline verification.`
      );
      return;
    }

    const isCsv =
      fileType === 'csv' ||
      file.type === 'text/csv' ||
      file.name.toLowerCase().endsWith('.csv');

    if (isCsv) {
      setFileType('csv');
      setEvidenceTitle(formatEvidenceTitleFromFile(file.name, 'csv'));
      setIsTranscribing(true);
      setTranscribeStatus('📊 Parsing structured CSV data...');

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = (e.target?.result as string) || '';
        const rows = text.split('\n').filter((r) => r.trim().length > 0);
        const telemetry = generateCsvTelemetry(file, rows.length, text, filingAgency);
        setContentText(telemetry);
        setTranscribeStatus(`✅ CSV parsed (${rows.length} rows)`);
        setIsTranscribing(false);
      };
      reader.onerror = () => {
        setContentText(`[CSV Data: ${file.name}]\nFailed to read file.`);
        setTranscribeStatus('⚠️ CSV read error');
        setIsTranscribing(false);
      };
      reader.readAsText(file);
      return;
    }

    setFileType('text');
    setEvidenceTitle(formatEvidenceTitleFromFile(file.name, 'text'));

    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.log') || file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (e) => setContentText(e.target?.result as string);
      reader.readAsText(file);
    } else {
      setContentText(
        `[DOCUMENTARY INGEST: ${file.name}]\nFormat: ${file.type || 'Binary'}\nSize: ${(file.size / 1024).toFixed(1)} KB\nExtracted forensic content ready for Sarvam AI model analysis.`
      );
    }
  }, [evidenceTitle, fileType, filingAgency]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // When adding evidence, reuse the existing case name from context
    const resolvedCaseName = isAddingEvidence
      ? activeCaseName ?? 'Active Case'
      : caseNumber.trim()
        ? `${caseNumber.trim()}: ${caseName.trim()}`
        : caseName.trim();

    // For new cases, require a name; for evidence additions, it's always valid
    if (!isAddingEvidence && !caseName.trim()) return;

    const bodyText = isAddingEvidence
      ? contentText.trim() || `New evidence: ${evidenceTitle.trim()}`
      : [
          caseDescription.trim() ? `Case Brief: ${caseDescription.trim()}` : '',
          contentText.trim() ? `\n\n--- Evidence Record ---\n${contentText.trim()}` : '',
        ]
          .filter(Boolean)
          .join('');

    await ingestDocument({
      title: evidenceTitle.trim() || resolvedCaseName,
      content_text: bodyText || `New case opened: ${resolvedCaseName}`,
      agency_slug: filingAgency,
      file_type: fileType,
      uploaded_by: author.trim() || undefined,
      caseName: resolvedCaseName,
      media_url: mediaUrl ?? undefined,
    });

    onClose();
  };

  const agencyCfg = agencies[filingAgency];
  const agencyColor = agencyCfg?.color ?? '#111111';

  const fileTypeIcons = {
    text: <FileText className="w-4 h-4" />,
    pdf: <FileText className="w-4 h-4 text-red-500" />,
    csv: <FileText className="w-4 h-4 text-emerald-500" />,
    audio: <Volume2 className="w-4 h-4" />,
    image: <ImageIcon className="w-4 h-4" />,
    video: <Video className="w-4 h-4" />,
  };

  return (
    /* Full-screen backdrop */
    <div
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-modal="true"
      role="dialog"
      aria-label="Add New Case"
    >
      {/* Modal panel */}
      <div className="relative w-full max-w-2xl bg-white border-2 border-black shadow-brutal-lg max-h-[90vh] flex flex-col font-mono text-black">
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b-2 border-black text-white shrink-0"
          style={{ backgroundColor: '#111111' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#F5C842' }}
            >
              <FolderPlus className="w-4 h-4 text-black" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest">
                {isAddingEvidence ? 'ADD EVIDENCE TO CASE' : 'ADD NEW CASE'}
              </h2>
              <p className="text-[10px] font-bold" style={{ color: agencyColor }}>
                Filing Agency:{' '}
                <span className="uppercase">{agencyCfg?.badge ?? filingAgency}</span>
                {isAddingEvidence
                  ? ` — Case: ${activeCaseName ?? 'Active Case'}`
                  : ` — ${step === 'details' ? 'Step 1: Case Identity' : 'Step 2: Evidence File'}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 transition text-white"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step tabs — hidden when just adding evidence to existing case */}
        {!isAddingEvidence && (
          <div className="flex border-b-2 border-black shrink-0">
            {(['details', 'evidence'] as Step[]).map((s, i) => (
              <button
                key={s}
                onClick={() => setStep(s)}
                className={`flex-1 px-4 py-2.5 text-[11px] font-black uppercase tracking-wider transition border-r last:border-r-0 border-black ${
                  step === s
                    ? 'text-black'
                    : 'bg-[#FBF9F5] text-slate-500 hover:bg-slate-100'
                }`}
                style={step === s ? { backgroundColor: '#F5C842' } : {}}
              >
                {i + 1}. {s === 'details' ? 'Case Details' : 'Evidence File'}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          {/* ── STEP 1: Case Details ─────────────────────────────────────────── */}
          {step === 'details' && (
            <div className="p-6 space-y-4">
              {/* Filing Agency — display only, not a choice */}
              <div className="p-3 border-2 border-black flex items-center gap-3" style={{ backgroundColor: agencyColor + '18' }}>
                <span
                  className="text-[10px] font-black px-2 py-1 text-white uppercase tracking-wider"
                  style={{ backgroundColor: agencyColor }}
                >
                  {agencyCfg?.badge ?? filingAgency.toUpperCase()}
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {agencyCfg?.name} — Case will be filed under this portal
                </span>
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
                  autoFocus
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

          {/* ── STEP 2: Evidence File ─────────────────────────────────────────── */}
          {step === 'evidence' && (
            <div className="p-6 space-y-4">
              {!isAddingEvidence && (
                <p className="text-[11px] text-slate-600 font-bold border-l-4 border-[#F5C842] pl-3 bg-yellow-50 py-2 pr-3">
                  Attach the first piece of evidence. You can add more later from the Evidence Vault.
                </p>
              )}
              {isAddingEvidence && (
                <p className="text-[11px] text-slate-600 font-bold border-l-4 border-emerald-500 pl-3 bg-emerald-50 py-2 pr-3">
                  Adding evidence to: <strong>{activeCaseName ?? 'Active Case'}</strong>. This will be extracted and fused into the existing case intelligence.
                </p>
              )}

              {/* Drop zone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed border-black p-5 text-center cursor-pointer transition-all ${
                  isDragActive ? 'bg-yellow-50 border-[#F5C842]' : 'bg-[#FBF9F5] hover:bg-white'
                }`}
              >
                <input {...getInputProps()} />
                <UploadCloud className="w-7 h-7 text-black mx-auto mb-2" />
                <p className="text-xs font-black uppercase text-black">
                  Drop evidence file here or{' '}
                  <span className="underline text-blue-700">browse</span>
                </p>
                <p className="text-[10px] text-slate-500 font-bold mt-1">
                  .pdf · .csv · .txt · .mp3 · .wav · .jpg · .png · .mp4 (PDF text parsed &amp; audio transcribed via Sarvam AI)
                </p>
              </div>

              {/* PDF Preview Card */}
              {mediaUrl && fileType === 'pdf' && (
                <div className="border-2 border-black bg-neutral-900 p-3 flex flex-col gap-2 shadow-brutal text-white font-mono">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[#F5C842] uppercase text-[11px] flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-red-400" />
                      PDF EVIDENCE DOSSIER LOADED
                    </span>
                    <a
                      href={mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={evidenceTitle ? `${evidenceTitle}.pdf` : 'evidence.pdf'}
                      className="text-[10px] bg-[#F5C842] text-black font-black px-2.5 py-0.5 uppercase tracking-wider hover:bg-yellow-400 transition"
                    >
                      VIEW / DOWNLOAD PDF ↗
                    </a>
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {transcribeStatus || `Attached PDF document · Parsed text populated below for Sarvam AI entity extraction.`}
                  </div>
                </div>
              )}

              {/* Image Preview Thumbnail */}
              {mediaUrl && fileType === 'image' && (
                <div className="border-2 border-black bg-neutral-900 p-2.5 flex items-center gap-3 shadow-brutal">
                  <img
                    src={mediaUrl}
                    alt="Evidence Preview"
                    className="h-20 max-w-[130px] object-cover border border-white shrink-0 bg-black"
                  />
                  <div className="text-white text-xs space-y-1 font-mono">
                    <div className="font-black text-[#F5C842] uppercase text-[11px]">
                      📷 OPTICAL EVIDENCE PREVIEW LOADED
                    </div>
                    <div className="text-[10px] text-slate-300">
                      Visual evidence loaded &middot; Forensic telemetry ready for AI extraction.
                    </div>
                  </div>
                </div>
              )}

              {/* Audio Preview Player */}
              {mediaUrl && fileType === 'audio' && (
                <div className="border-2 border-black bg-neutral-900 p-3 flex flex-col gap-2 shadow-brutal text-white">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[#F5C842] uppercase text-[11px] flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-[#F5C842]" />
                      AUDIO EVIDENCE LOADED
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 px-2 py-0.5 border border-emerald-700">
                      READY FOR PLAYBACK & SARVAM STT
                    </span>
                  </div>
                  <audio controls className="w-full h-8" src={mediaUrl} />
                </div>
              )}

              {/* Processing / Transcription / OCR Status Banner */}
              {(isTranscribing || transcribeStatus) && (
                <div
                  className={`p-2.5 border-2 border-black text-xs font-bold flex items-center justify-between gap-2 ${
                    isTranscribing ? 'bg-yellow-100 text-black animate-pulse' : 'bg-green-50 text-emerald-950'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {fileType === 'audio' ? (
                      <Volume2 className="w-4 h-4 shrink-0 text-black" />
                    ) : (
                      <Sparkles className="w-4 h-4 shrink-0 text-black" />
                    )}
                    <span>{transcribeStatus}</span>
                  </div>
                  {isTranscribing && (
                    <span className="text-[10px] bg-black text-white px-2 py-0.5 uppercase tracking-widest font-mono">
                      AI SCAN
                    </span>
                  )}
                </div>
              )}

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
                <div className="grid grid-cols-6 gap-2">
                  {(['text', 'pdf', 'csv', 'audio', 'image', 'video'] as const).map((ft) => (
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
                {/* Back button: only show if we have a step before (not in add-evidence-only mode) */}
                {!isAddingEvidence ? (
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="px-4 py-2 bg-white border-2 border-black text-xs font-black uppercase hover:bg-slate-100 transition"
                  >
                    ← Back
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-white border-2 border-black text-xs font-black uppercase hover:bg-slate-100 transition"
                  >
                    Cancel
                  </button>
                )}
                <div className="flex gap-2">
                  {!isAddingEvidence && (
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 bg-white border-2 border-black text-xs font-bold hover:bg-slate-100 transition"
                    >
                      Skip Evidence
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isProcessing || isTranscribing || (!isAddingEvidence && !caseName.trim())}
                    className="flex items-center gap-2 px-5 py-2 bg-[#F5C842] hover:bg-[#EAB308] disabled:opacity-50 text-black font-black text-xs border-2 border-black shadow-brutal transition active:translate-x-0.5 active:translate-y-0.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isTranscribing
                      ? 'Transcribing...'
                      : isProcessing
                      ? (isAddingEvidence ? 'Adding Evidence...' : 'Creating Case...')
                      : (isAddingEvidence ? 'Add Evidence & Extract Intel' : 'Create Case & Extract Intel')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

/** Renders via React portal into #modal-root — fully above all page content */
export function AddNewCaseModal(props: AddNewCaseModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const root = document.getElementById('modal-root');
  if (!root) return null;
  return ReactDOM.createPortal(<AddNewCaseModalInner {...props} />, root);
}
