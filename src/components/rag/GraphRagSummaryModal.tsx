'use client';

import React, { useState, useEffect } from 'react';
import { useInvestigation } from '@/lib/store/investigation-context';
import { generateGraphRagSummary } from '@/lib/ai/pipeline';
import {
  FileText,
  Sparkles,
  X,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Hash,
  Layers,
} from 'lucide-react';

interface GraphRagSummaryModalProps {
  onClose: () => void;
}

export function GraphRagSummaryModal({ onClose }: GraphRagSummaryModalProps) {
  const {
    caseInfo,
    entities,
    relationships,
    events,
    contradictions,
    documents,
    setSelectedEntity,
    setSelectedEvent,
    setProvenanceFocus,
  } = useInvestigation();

  const [summaryText, setSummaryText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const summary = await generateGraphRagSummary(
        caseInfo.name,
        entities,
        relationships,
        events,
        contradictions
      );
      setSummaryText(summary);
    } catch (err) {
      console.error('Failed to generate GraphRAG summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  // Parse inline citations and render them as interactive clickable badges
  const renderFormattedSummary = (text: string) => {
    const parts = text.split(/(\[.*?\])/g);

    return parts.map((part, idx) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        const tag = part.slice(1, -1);

        // Check if event citation: [Evt:evt-01]
        if (tag.startsWith('Evt:') || tag.startsWith('E:')) {
          const id = tag.replace(/^(?:Evt|E):/, '').trim();
          const targetEvent = events.find((e) => e.id === id || e.description.toLowerCase().includes(id.toLowerCase()));
          const targetEntity = entities.find((ent) => ent.id === id || ent.name.toLowerCase().includes(id.toLowerCase()));

          return (
            <button
              key={idx}
              onClick={() => {
                if (targetEvent) {
                  setSelectedEvent(targetEvent);
                  onClose();
                } else if (targetEntity) {
                  setSelectedEntity(targetEntity);
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-cyan-950/80 hover:bg-cyan-800 text-cyan-300 border border-cyan-700/60 text-[11px] font-mono font-bold transition"
            >
              <Hash className="w-2.5 h-2.5" />
              <span>{tag}</span>
            </button>
          );
        }

        // Check if document citation: [Doc:doc-jpd-01]
        if (tag.startsWith('Doc:')) {
          const docId = tag.replace(/^Doc:/, '').trim();
          const targetDoc = documents.find((d) => d.id === docId);

          return (
            <button
              key={idx}
              onClick={() => {
                if (targetDoc) {
                  setProvenanceFocus({
                    documentId: targetDoc.id,
                    sourceOffset: 'Line 1',
                    title: targetDoc.title,
                    mediaType: targetDoc.file_type,
                    snippet: targetDoc.content_text,
                  });
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-amber-950/80 hover:bg-amber-800 text-amber-300 border border-amber-700/60 text-[11px] font-mono font-bold transition"
            >
              <ExternalLink className="w-2.5 h-2.5" />
              <span>{tag}</span>
            </button>
          );
        }

        // Check if contradiction citation: [Con:con-01]
        if (tag.startsWith('Con:') || tag.toLowerCase().includes('contradiction')) {
          return (
            <span
              key={idx}
              className="inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700 text-[11px] font-mono font-bold"
            >
              {tag}
            </span>
          );
        }
      }

      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  GraphRAG Executive Intelligence Brief
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Strictly Reads Postgres Graph (No Hallucination)</span>
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-100 mt-1">
                {caseInfo.name} — Joint Synthesis
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchSummary}
              disabled={isLoading}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition"
              title="Recompile Brief from Graph"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 font-mono text-xs space-y-3">
              <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span>QUERYING POSTGRES GRAPH & COMPILING INLINE CITATIONS...</span>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none text-slate-200 text-xs leading-relaxed font-sans space-y-3 whitespace-pre-line">
              {renderFormattedSummary(summaryText)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Click any [E:...], [Doc:...], or [Rel:...] citation tag to highlight that node or open provenance.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
