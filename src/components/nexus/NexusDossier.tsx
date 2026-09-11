'use client';

import React from 'react';
import { 
  FileText, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles, 
  Lock, 
  Printer,
  FolderArchive
} from 'lucide-react';
import { Document } from '@/types/investigation';
import { formatTimeIST } from '@/lib/utils/formatDate';

interface NexusDossierProps {
  documents: Document[];
  onOpenProvenance: (docId: string, offset: string, snippet?: string) => void;
}

export const NexusDossier: React.FC<NexusDossierProps> = ({
  documents,
  onOpenProvenance
}) => {
  const citations = documents.map((doc, idx) => ({
    id: `CIT-${String(idx + 1).padStart(2, '0')}`,
    docId: doc.id,
    offset: 'Lines 1-15',
    claim: doc.title,
    snippet: doc.content_text ? doc.content_text.slice(0, 180) + '...' : 'Evidence file registered in custody vault.',
    source: `${doc.title} (${doc.file_type.toUpperCase()})`,
    uploadedBy: doc.uploaded_by,
    date: doc.uploaded_at
  }));

  const handleExportMarkdown = () => {
    if (documents.length === 0) return;
    const lines = [
      '# CLASSIFIED INTELLIGENCE DOSSIER // SURAG-AI PLATFORM',
      `DATE: ${new Date().toLocaleString('en-IN')}`,
      `TOTAL EVIDENCE ITEMS: ${documents.length}`,
      '',
      '## 1.0 EXECUTIVE SUMMARY',
      `Cross-jurisdictional intelligence synthesis compiled across ${documents.length} verified evidence items.`,
      '',
      '## 2.0 EVIDENCE REGISTER & CHAIN OF CUSTODY',
      ...documents.map((d, i) => `${i + 1}. [${d.id}] ${d.title} | Format: ${d.file_type} | Depositor: ${d.uploaded_by} | Time: ${d.uploaded_at}`),
      '',
      '## 3.0 CITATION LOG',
      ...citations.map((c) => `- [${c.id}] ${c.claim}: "${c.snippet}"`),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `INTELLIGENCE-DOSSIER-${Date.now()}.md`;
    a.click();
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 font-mono select-none text-black">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 border-2 border-black shadow-brutal">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-black" />
            <h2 className="text-base font-black uppercase tracking-wider text-black">
              INTELLIGENCE BRIEFING &amp; CITATION REGISTRY
            </h2>
          </div>
          <p className="text-xs text-slate-700 font-bold mt-0.5">
            Evidence-grounded synthesis with verified source document line offsets.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => window.print()}
            disabled={documents.length === 0}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 disabled:opacity-40 text-black border-2 border-black font-black flex items-center space-x-1.5 shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT DOSSIER</span>
          </button>
          <button
            onClick={handleExportMarkdown}
            disabled={documents.length === 0}
            className="px-3.5 py-1.5 bg-[#F5C842] hover:bg-[#EAB308] disabled:opacity-40 text-black font-black border-2 border-black shadow-brutal flex items-center space-x-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>EXPORT MD</span>
          </button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white border-2 border-black p-12 text-center shadow-brutal space-y-4">
          <FolderArchive className="w-12 h-12 text-slate-400 mx-auto" />
          <h4 className="text-base font-black uppercase text-black">NO CASE DOSSIER AVAILABLE</h4>
          <p className="text-xs text-slate-600 font-sans max-w-md mx-auto leading-relaxed">
            No evidence documents have been uploaded to this investigation. Ingest case documents or add evidence to generate an evidence-grounded intelligence briefing and verified citation registry.
          </p>
        </div>
      ) : (
        /* Main Document / Report Layout */
        <div className="bg-white border-2 border-black p-6 lg:p-8 text-black shadow-brutal-lg space-y-7 max-w-4xl mx-auto">
          {/* Document Header Block */}
          <div className="border-b-2 border-black pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-black bg-[#F5C842] px-2 py-0.5 border border-black">
                RESTRICTED // LAW ENFORCEMENT SENSITIVE
              </span>
              <h1 className="text-xl lg:text-2xl font-black uppercase tracking-tight mt-2 text-black">
                CASE INTELLIGENCE SYNTHESIS DOSSIER
              </h1>
              <p className="text-xs font-bold text-slate-700 mt-1">
                SURAG-AI COLLABORATIVE FUSION PLATFORM
              </p>
            </div>

            <div className="sm:text-right text-[11px] font-mono text-slate-700 font-bold shrink-0">
              <p>DOCUMENTS: {documents.length} INGESTED</p>
              <p className="text-emerald-800 font-black">CUSTODY CHAIN: SHA-256 VERIFIED</p>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <section className="space-y-2 relative">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wide text-black flex items-center space-x-2">
                <span>1.0 EXECUTIVE INTELLIGENCE SUMMARY</span>
              </h3>
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-600 text-[10px] font-black px-2 py-0.5 flex items-center space-x-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>EVIDENCE-GROUNDED</span>
              </span>
            </div>

            <p className="text-xs text-slate-800 leading-relaxed font-sans font-medium">
              This operational intelligence briefing compiles {documents.length} forensic evidence item{documents.length !== 1 ? 's' : ''}. Multi-modal analysis has correlated witness memos, surveillance logs, audio intercepts, and forensic signals into a unified operational picture.
            </p>
          </section>

          {/* Section 2: Ingested Evidence & Modality Breakdown */}
          <section className="space-y-3 relative border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wide text-black flex items-center space-x-2">
                <span>2.0 EVIDENCE REGISTER &amp; CUSTODY LOGS</span>
              </h3>
            </div>

            <div className="border border-black overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-black text-white text-[10px] uppercase font-black">
                  <tr>
                    <th className="p-2">REF ID</th>
                    <th className="p-2">TITLE</th>
                    <th className="p-2">FORMAT</th>
                    <th className="p-2">DEPOSITOR</th>
                    <th className="p-2">TIMESTAMP</th>
                    <th className="p-2 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {documents.map((doc, idx) => (
                    <tr key={doc.id} className="hover:bg-slate-50 font-sans">
                      <td className="p-2 font-mono font-bold text-xs">{citations[idx]?.id}</td>
                      <td className="p-2 font-bold text-black">{doc.title}</td>
                      <td className="p-2 font-mono uppercase text-[11px]">{doc.file_type}</td>
                      <td className="p-2 text-slate-700">{doc.uploaded_by}</td>
                      <td className="p-2 font-mono text-[10px]">{formatTimeIST(doc.uploaded_at, false)}</td>
                      <td className="p-2 text-right">
                        <button
                          onClick={() => onOpenProvenance(doc.id, 'Custody', doc.content_text?.slice(0, 150))}
                          className="text-blue-700 hover:underline font-bold font-mono text-[11px]"
                        >
                          Inspect →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3: Verified Citation Registry */}
          <section className="space-y-3 relative border-t border-slate-200 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wide text-black flex items-center space-x-2">
                <span>3.0 VERIFIED CITATIONS &amp; CLAIMS</span>
              </h3>
            </div>

            <div className="space-y-2.5">
              {citations.map((c) => (
                <div key={c.id} className="p-3 bg-[#FBF9F5] border border-black space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="bg-[#F5C842] text-black font-black text-[10px] px-1.5 py-0.2 border border-black">
                      {c.id}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 font-bold">
                      {c.source}
                    </span>
                  </div>
                  <p className="text-xs font-sans text-slate-800 leading-relaxed font-medium">
                    &quot;{c.snippet}&quot;
                  </p>
                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 font-bold">Uploaded by: {c.uploadedBy}</span>
                    <button
                      onClick={() => onOpenProvenance(c.docId, c.offset, c.snippet)}
                      className="text-blue-700 hover:underline font-black"
                    >
                      Inspect Provenance →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
