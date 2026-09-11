'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useDropzone } from 'react-dropzone';
import { useInvestigation } from '@/lib/store/investigation-context';
import { Document, AgencySlug } from '@/types/investigation';
import {
  formatEvidenceTitleFromFile,
  generateOpticalTelemetry,
  generateInitialKotaEvidenceDisclosure,
} from '@/lib/utils/evidenceFormatter';
import {
  Link2,
  X,
  Send,
  ChevronDown,
  UploadCloud,
  Image as ImageIcon,
  Volume2,
  FileText,
  Video,
  Sparkles,
} from 'lucide-react';

interface ConnectionRequestModalProps {
  onClose: () => void;
  requestingAgency: AgencySlug;
  caseId: string;
  caseName: string;
  documents: Document[];
  targetAgency?: AgencySlug;
}

const fileTypeIcons: Record<string, React.ReactNode> = {
  text: <FileText className="w-4 h-4" />,
  audio: <Volume2 className="w-4 h-4" />,
  image: <ImageIcon className="w-4 h-4" />,
  video: <Video className="w-4 h-4" />,
};

function ConnectionRequestModalInner({
  onClose,
  requestingAgency,
  caseName,
  documents,
  targetAgency,
}: ConnectionRequestModalProps) {
  const { sendConnectionRequest, agencies, ingestDocument } = useInvestigation();

  // Build list of all agencies EXCEPT the current portal's agency
  const partnerAgencies = Object.values(agencies).filter(
    (a) => a.slug !== requestingAgency
  );

  const isKotaTransmittingEvidence = requestingAgency === 'kota';

  const [selectedTarget, setSelectedTarget] = useState<AgencySlug>(
    targetAgency ?? partnerAgencies[0]?.slug ?? (requestingAgency === 'jodhpur' ? 'kota' : 'jodhpur')
  );
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittingStatus, setSubmittingStatus] = useState('');

  // Media evidence inputs (used when Kota transmits evidence)
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [author, setAuthor] = useState('Inspector V. Meena (Kota CID)');
  const [fileType, setFileType] = useState<'text' | 'audio' | 'image' | 'video'>('image');
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeStatus, setTranscribeStatus] = useState<string | null>(null);

  const [contentText, setContentText] = useState(() => generateInitialKotaEvidenceDisclosure());

  const getDefaultBrief = (target: AgencySlug) => {
    const targetAg = agencies[target];
    if (isKotaTransmittingEvidence) {
      return [
        `[EVIDENCE TRANSMISSION REPORT // KOTA POLICE CID]`,
        `Target: ${targetAg?.name ?? 'Jodhpur Police Department'} (Lead Investigating Agency)`,
        `Case Reference: ${caseName || 'FIR-007: Aarav kidnapping'}`,
        `Evidence Items Discovered: ${documents.length} item(s)`,
        documents.length > 0
          ? `Discovered Evidence Files:\n${documents.map((d) => `• [${d.file_type.toUpperCase()}] ${d.title}`).join('\n')}`
          : 'Discovered Evidence: Kota Toll Naka / Sector RJ-24 CCTV Intercept & Vehicle Log',
        `\nKota Police CID has intercepted critical evidence under Kota jurisdiction. Forwarding verified forensic evidence records, vehicle sighting data, and timeline intelligence to Jodhpur Police HQ for joint case fusion and contradiction detection.`,
      ]
        .filter(Boolean)
        .join('\n');
    }
    return [
      `[CASE BRIEF & JOINT INVESTIGATION REQUEST // JODHPUR POLICE HQ]`,
      `Target: ${targetAg?.name ?? 'Kota Police CID'}`,
      `Case: ${caseName || 'FIR-007: Aarav kidnapping'}`,
      `Primary Evidence items: ${documents.length} file(s)`,
      documents.length > 0
        ? `Latest evidence logged: ${documents[0].title}`
        : '',
      `\nJodhpur Police HQ is investigating an active kidnapping case with cross-jurisdictional leads into Kota. Requesting Kota Police CID to review this case brief, initiate joint investigation, and transmit any local CCTV/evidence intercepts.`,
    ]
      .filter(Boolean)
      .join('\n');
  };

  const [brief, setBrief] = useState(() => getDefaultBrief(selectedTarget));

  const selectedAgency = agencies[selectedTarget];

  // File Dropzone Handler for Media Input
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setEvidenceTitle(file.name.replace(/\.[^/.]+$/, ''));

    const isAudio =
      fileType === 'audio' ||
      file.type.startsWith('audio/') ||
      /\.(mp3|wav|m4a|ogg|aac|flac|wma|opus|weba|amr|3gp|m4b|mpeg|mpga)$/i.test(file.name) ||
      /audio|voice|recording|call|wiretap|speech|intercept/i.test(file.name);

    if (isAudio) {
      setFileType('audio');
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
          setContentText(`[Audio File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]\n(Manual notes can be entered below)`);
          setTranscribeStatus('⚠️ Transcription completed with fallback');
        }
      } catch (err: any) {
        console.error('Audio transcription error:', err);
        setContentText(`[Audio File: ${file.name}]\n(Manual notes can be entered below)`);
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
        const dataUrl = e.target?.result as string;
        setMediaUrl(dataUrl);
      };
      reader.readAsDataURL(file);

      const dynamicTitle = formatEvidenceTitleFromFile(file.name, 'image');
      setEvidenceTitle(dynamicTitle);

      const baseTelemetry = generateOpticalTelemetry(file, 'Kota Police CID');
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

    const isVideo =
      !isAudio &&
      !isImage &&
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

    setFileType('text');
    setEvidenceTitle(formatEvidenceTitleFromFile(file.name, 'text'));

    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.log') || file.name.endsWith('.json')) {
      const reader = new FileReader();
      reader.onload = (e) => setContentText(e.target?.result as string);
      reader.readAsText(file);
    } else {
      setContentText(
        `[DOCUMENTARY INGEST: ${file.name}]\nFormat: ${file.type || 'Binary'}\nSize: ${(file.size / 1024).toFixed(1)} KB\nExtracted forensic telemetry ready for AI model analysis.`
      );
    }
  }, [fileType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSend = async () => {
    if (!selectedTarget) return;

    if (isKotaTransmittingEvidence) {
      setIsSubmitting(true);
      setSubmittingStatus('Ingesting media & extracting forensic intelligence...');

      try {
        const finalTitle = evidenceTitle.trim() || 'Kota CCTV / Intercept Evidence';
        const finalContent = contentText.trim();

        // 1. Ingest evidence into the active investigation case under Kota CID
        // Specify filing_agency as selectedTarget (Jodhpur) so Kota is not mistaken as case filer
        await ingestDocument({
          title: finalTitle,
          content_text: finalContent,
          agency_slug: requestingAgency,
          file_type: fileType,
          media_url: mediaUrl ?? undefined,
          uploaded_by: author.trim() || 'Kota Police CID (Field Unit)',
          caseName: caseName || 'FIR-007: Aarav kidnapping',
          filing_agency: selectedTarget,
        });

        // 2. Transmit evidence report to Jodhpur Police
        setSubmittingStatus('Transmitting evidence dossier to Jodhpur Police HQ...');
        const transmissionSnapshot = [
          `[EVIDENCE TRANSMISSION REPORT // KOTA POLICE CID]`,
          `To: ${selectedAgency?.name ?? 'Jodhpur Police Department'} (Lead Investigating Agency)`,
          `Case Reference: ${caseName || 'FIR-007: Aarav kidnapping'}`,
          `Evidence Title: [${fileType.toUpperCase()}] ${finalTitle}`,
          author.trim() ? `Depositing Officer: ${author.trim()}` : '',
          `\n--- TRANSMITTED EVIDENCE RECORD & TELEMETRY ---\n${finalContent}`,
          `\nKota Police CID has recovered this evidence under Kota jurisdiction and transmitted full media files, optical telemetry, and timeline events to Jodhpur Police HQ.`,
        ]
          .filter(Boolean)
          .join('\n');

        sendConnectionRequest(requestingAgency, selectedTarget, transmissionSnapshot, mediaUrl ?? undefined, fileType);
        setSent(true);
        setTimeout(onClose, 2000);
      } catch (err) {
        console.error('Evidence transmission failed:', err);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      sendConnectionRequest(requestingAgency, selectedTarget, brief);
      setSent(true);
      setTimeout(onClose, 1800);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full max-w-xl bg-white border-2 border-black shadow-brutal-lg font-mono text-black my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b-2 border-black bg-black text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#F5C842] flex items-center justify-center">
              {isKotaTransmittingEvidence ? (
                <Send className="w-4 h-4 text-black" />
              ) : (
                <Link2 className="w-4 h-4 text-black" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest">
                {isKotaTransmittingEvidence
                  ? `TRANSMIT EVIDENCE TO ${selectedAgency?.name ? selectedAgency.name.toUpperCase() : 'JODHPUR POLICE'}`
                  : 'SEND CASE BRIEF / CONNECT TO'}
              </h2>
              <p className="text-[10px] text-slate-400 font-bold">
                {isKotaTransmittingEvidence
                  ? 'Attach recovered media, CCTV frames or field logs & forward to Jodhpur HQ'
                  : 'Send case brief snapshot and request cross-agency joint investigation'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 transition cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {sent ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 border-2 border-emerald-600 flex items-center justify-center mx-auto">
              <Send className="w-6 h-6 text-emerald-700" />
            </div>
            <p className="text-sm font-black uppercase tracking-wider text-emerald-700">
              {isKotaTransmittingEvidence
                ? `Evidence Successfully Transmitted to ${selectedAgency?.name ?? selectedTarget}!`
                : `Case Brief Sent to ${selectedAgency?.name ?? selectedTarget}`}
            </p>
            <p className="text-xs text-slate-600 font-bold font-sans">
              {isKotaTransmittingEvidence
                ? 'Jodhpur Police HQ will receive this evidence item with extracted AI telemetry in real-time.'
                : 'The target agency will see a pending joint investigation request in their portal.'}
            </p>
          </div>
        ) : (
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Target Agency — dropdown */}
            <div>
              <label htmlFor="target-agency-select" className="block text-[11px] font-black uppercase text-slate-700 mb-1.5">
                {isKotaTransmittingEvidence ? 'Recipient Agency (Lead Investigator)' : 'Select Target Agency'}
              </label>
              <div className="relative">
                <select
                  id="target-agency-select"
                  value={selectedTarget}
                  onChange={(e) => {
                    const newTarget = e.target.value as AgencySlug;
                    setSelectedTarget(newTarget);
                    setBrief(getDefaultBrief(newTarget));
                  }}
                  className="w-full appearance-none p-3 border-2 border-black font-black text-xs bg-white text-black pr-8 outline-none cursor-pointer"
                >
                  {partnerAgencies.map((agency) => (
                    <option key={agency.slug} value={agency.slug}>
                      {agency.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              </div>
              {selectedAgency && (
                <div
                  className="flex items-center gap-2 mt-2 px-3 py-2 border border-black text-[11px] font-bold"
                  style={{ backgroundColor: selectedAgency.color + '18' }}
                >
                  <span
                    className="text-[9px] font-black px-2 py-0.5 text-white uppercase"
                    style={{ backgroundColor: selectedAgency.color }}
                  >
                    {selectedAgency.badge}
                  </span>
                  <span className="text-slate-700">{selectedAgency.name}</span>
                </div>
              )}
            </div>

            {/* ── KOTA SPECIFIC: MEDIA INPUT & EVIDENCE UPLOAD ── */}
            {isKotaTransmittingEvidence ? (
              <div className="space-y-4 border-t-2 border-black pt-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-black uppercase text-slate-800">
                      Attach Media Evidence (CCTV Frame, Audio Intercept, Document)
                    </label>
                    <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-2 py-0.5 border border-amber-400">
                      MEDIA INPUT READY
                    </span>
                  </div>

                  {/* Dropzone */}
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed border-black p-4 text-center cursor-pointer transition-all ${
                      isDragActive ? 'bg-yellow-50 border-[#F5C842]' : 'bg-[#FBF9F5] hover:bg-white'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <UploadCloud className="w-6 h-6 text-black mx-auto mb-1.5" />
                    <p className="text-xs font-black uppercase text-black">
                      Drop evidence file here or <span className="underline text-blue-700">browse</span>
                    </p>
                    <p className="text-[10px] text-slate-500 font-bold mt-1">
                      .jpg · .png · .mp3 · .wav · .mp4 · .txt · .pdf (Audio transcribed via Sarvam AI)
                    </p>
                  </div>
                </div>

                {/* Image Preview Thumbnail */}
                {mediaUrl && fileType === 'image' && (
                  <div className="border-2 border-black bg-neutral-900 p-2.5 flex items-center gap-3 shadow-brutal">
                    <img
                      src={mediaUrl}
                      alt="Optical Evidence Preview"
                      className="h-20 max-w-[130px] object-cover border border-white shrink-0 bg-black"
                    />
                    <div className="text-white text-xs space-y-1 font-mono">
                      <div className="font-black text-[#F5C842] uppercase text-[11px]">
                        📷 OPTICAL EVIDENCE PREVIEW LOADED
                      </div>
                      <div className="text-[10px] text-slate-300">
                        Visual evidence loaded &middot; Ready for Jodhpur transmission & AI extraction.
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
                        READY FOR TRANSMISSION & PLAYBACK
                      </span>
                    </div>
                    <audio controls className="w-full h-8" src={mediaUrl} />
                  </div>
                )}

                {/* Audio Transcription Status Banner */}
                {(isTranscribing || transcribeStatus) && (
                  <div className={`p-2.5 border-2 border-black text-xs font-bold flex items-center justify-between gap-2 ${
                    isTranscribing ? 'bg-yellow-100 text-black animate-pulse' : 'bg-green-50 text-emerald-950'
                  }`}>
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 shrink-0 text-black" />
                      <span>{transcribeStatus}</span>
                    </div>
                    {isTranscribing && (
                      <span className="text-[10px] bg-black text-white px-2 py-0.5 uppercase tracking-widest font-mono">
                        SARVAM STT
                      </span>
                    )}
                  </div>
                )}

                {/* Classification and Title */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                      Evidence Title
                    </label>
                    <input
                      type="text"
                      value={evidenceTitle}
                      onChange={(e) => setEvidenceTitle(e.target.value)}
                      placeholder="e.g. Market Surveillance Photo, CCTV Frame, Audio Intercept"
                      className="w-full bg-[#FBF9F5] border-2 border-black text-xs font-bold text-black p-2 outline-none focus:bg-white font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                      Depositing Officer / Unit
                    </label>
                    <input
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="e.g. Inspector V. Meena (Kota CID)"
                      className="w-full bg-[#FBF9F5] border-2 border-black text-xs font-bold text-black p-2 outline-none focus:bg-white font-sans"
                    />
                  </div>
                </div>

                {/* Media Type Classification */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                    Classification
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['text', 'audio', 'image', 'video'] as const).map((ft) => (
                      <button
                        key={ft}
                        type="button"
                        onClick={() => setFileType(ft)}
                        className={`p-2 border-2 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase transition cursor-pointer ${
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

                {/* Forensic Telemetry & Record Notes */}
                <div>
                  <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                    Evidence Disclosure & Forensic Telemetry Notes <span className="text-slate-500 font-normal">(editable)</span>
                  </label>
                  <textarea
                    rows={5}
                    value={contentText}
                    onChange={(e) => setContentText(e.target.value)}
                    className="w-full bg-[#FBF9F5] border-2 border-black text-xs font-medium text-black p-2.5 outline-none focus:bg-white font-mono resize-none leading-relaxed"
                  />
                  <p className="text-[10px] text-slate-500 font-bold mt-1">
                    This media evidence, vehicle coordinates and notes will be transmitted to Jodhpur Police HQ and ingested into the case.
                  </p>
                </div>
              </div>
            ) : (
              /* ── JODHPUR SPECIFIC: CASE BRIEF SNAPSHOT ── */
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-700 mb-1.5">
                  Case Brief Snapshot <span className="text-slate-500 font-normal">(editable before sending)</span>
                </label>
                <textarea
                  rows={6}
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  className="w-full bg-[#FBF9F5] border-2 border-black text-xs font-medium text-black p-2.5 outline-none focus:bg-white font-sans resize-none"
                />
                <p className="text-[10px] text-slate-500 font-bold mt-1">
                  This snapshot is shared with Kota Police CID to initiate joint investigation.
                </p>
              </div>
            )}

            {/* Submitting progress banner */}
            {isSubmitting && (
              <div className="p-3 bg-amber-100 border-2 border-amber-600 text-amber-900 text-xs font-black flex items-center gap-2 animate-pulse font-sans">
                <Sparkles className="w-4 h-4 animate-spin text-amber-700 shrink-0" />
                <span>{submittingStatus}</span>
              </div>
            )}

            {/* Info box */}
            <div className="p-3 bg-blue-50 border-2 border-blue-400 text-[11px] font-bold text-blue-800 font-sans leading-relaxed">
              {isKotaTransmittingEvidence
                ? `ℹ️ Kota Police CID is transmitting evidence to ${selectedAgency?.name ?? 'Jodhpur Police Department'}. Upon submission, AI will extract entity & vehicle intelligence, and Jodhpur Police HQ will receive the evidence in real-time.`
                : `ℹ️ Once accepted, ${selectedAgency?.name ?? 'the target agency'} will gain full read/write access to this case. Evidence added by either agency will sync in real-time to both portals.`}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 bg-white border-2 border-black text-xs font-black hover:bg-slate-100 transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={isSubmitting || !selectedTarget || (isKotaTransmittingEvidence ? !contentText.trim() : !brief.trim())}
                className="flex items-center gap-2 px-5 py-2.5 bg-black text-[#F5C842] font-black text-xs border-2 border-black shadow-brutal disabled:opacity-40 hover:bg-slate-900 transition active:translate-x-0.5 active:translate-y-0.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    TRANSMITTING EVIDENCE...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {isKotaTransmittingEvidence
                      ? `TRANSMIT EVIDENCE TO ${(selectedAgency?.name ?? selectedTarget).toUpperCase()}`
                      : `SEND CASE BRIEF TO ${(selectedAgency?.name ?? selectedTarget).toUpperCase()}`}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ConnectionRequestModal(props: ConnectionRequestModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  const root = document.getElementById('modal-root');
  if (!root) return null;
  return ReactDOM.createPortal(<ConnectionRequestModalInner {...props} />, root);
}
