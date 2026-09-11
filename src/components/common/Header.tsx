'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useInvestigation } from '@/lib/store/investigation-context';
import {
  ShieldAlert,
  Radio,
  Share2,
  FileText,
  RotateCcw,
  Sparkles,
  AlertOctagon,
  Database,
} from 'lucide-react';

interface HeaderProps {
  onOpenSummary: () => void;
  onOpenUpload: () => void;
}

export function Header({ onOpenSummary, onOpenUpload }: HeaderProps) {
  const pathname = usePathname();
  const {
    caseInfo,
    agencies,
    contradictions,
    relationships,
    isLiveSyncActive,
    resetToDefaultCase,
    isProcessing,
    processingStatusText,
  } = useInvestigation();

  const suggestedCount = relationships.filter((r) => r.status === 'ai_suggested').length;
  const flaggedContradictionsCount = contradictions.filter((c) => c.status === 'flagged').length;

  return (
    <header className="bg-slate-950/95 border-b border-slate-800 text-slate-100 backdrop-blur sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Case Title and Status */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded border border-rose-800/60">
                Joint Taskforce
              </span>
              <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
                {caseInfo.name}
              </h1>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1.5 font-mono">
                <span className={`w-2 h-2 rounded-full ${isLiveSyncActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                <span className="text-emerald-400 font-semibold">Supabase Realtime Sync Active</span>
              </span>
              <span>•</span>
              <span className="font-mono text-slate-300">PS #16: Explainable Intelligence Picture</span>
            </div>
          </div>
        </div>

        {/* Agency Portal Navigation Tabs */}
        <nav className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-1">
          <Link
            href="/"
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              pathname === '/'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Dual Sync Deck</span>
          </Link>
          <Link
            href="/jodhpur"
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              pathname === '/jodhpur'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Jodhpur Police</span>
          </Link>
          <Link
            href="/kota"
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              pathname === '/kota'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800/60'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Kota Police</span>
          </Link>
        </nav>

        {/* Tactical Actions & Alerts */}
        <div className="flex items-center gap-2">
          {/* Contradiction Counter */}
          {flaggedContradictionsCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/15 border border-rose-500/40 rounded-md text-rose-300 text-xs font-mono font-medium animate-pulse">
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>{flaggedContradictionsCount} Contradiction Flagged</span>
            </div>
          )}

          {/* AI Suggestion Pending Counter */}
          {suggestedCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 border border-amber-500/40 rounded-md text-amber-300 text-xs font-mono font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{suggestedCount} AI Suggestions Pending</span>
            </div>
          )}

          {/* Ingest Evidence Button */}
          <button
            onClick={onOpenUpload}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>+ Ingest Evidence</span>
          </button>

          {/* GraphRAG Summary Button */}
          <button
            onClick={onOpenSummary}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all active:scale-95"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Case Brief (GraphRAG)</span>
          </button>

          {/* Reset Demo Button */}
          <button
            onClick={() => {
              if (confirm('Reset investigation state to initial dual-agency scenario?')) {
                resetToDefaultCase();
              }
            }}
            title="Reset to default demo state"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md border border-slate-800 transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Global Ingestion / Processing Banner */}
      {isProcessing && (
        <div className="mt-2 py-1 px-3 bg-cyan-950/80 border border-cyan-500/40 rounded text-cyan-300 text-xs flex items-center justify-between font-mono animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>AI DETECTIVE ENGINE: {processingStatusText}</span>
          </div>
          <span className="text-[10px] text-cyan-400/80">Zero Hallucination Guardrail Engaged</span>
        </div>
      )}
    </header>
  );
}
