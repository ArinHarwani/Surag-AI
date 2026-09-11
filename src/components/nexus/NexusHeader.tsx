'use client';

import React from 'react';
import { 
  Radio, 
  Share2, 
  RotateCcw, 
  Sparkles, 
  ShieldAlert, 
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { NexusNavTab } from './NexusSidebar';

interface NexusHeaderProps {
  currentTab: NexusNavTab;
  activeAgency: 'all' | 'jodhpur' | 'kota';
  onSelectAgency: (agency: 'all' | 'jodhpur' | 'kota') => void;
  onOpenUpload: () => void;
  onResetCase: () => void;
  isProcessing: boolean;
  processingText: string;
}

export const NexusHeader: React.FC<NexusHeaderProps> = ({
  currentTab,
  activeAgency,
  onSelectAgency,
  onOpenUpload,
  onResetCase,
  isProcessing,
  processingText
}) => {
  const tabTitles: Record<NexusNavTab, string> = {
    overview: 'CASE OVERVIEW',
    vault: 'EVIDENCE VAULT',
    graph: 'RELATIONSHIP GRAPH',
    contradictions: 'CONTRADICTION CENTER',
    timeline: 'TIMELINE & GEOSPATIAL',
    dossier: 'DOSSIER & PROVENANCE'
  };

  return (
    <header className="bg-[#090A0D] border-b border-[#232731] text-white px-5 py-2.5 sticky top-0 z-20 select-none font-mono">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Breadcrumbs */}
        <div className="flex items-center space-x-1.5 text-xs">
          <span className="text-slate-500">OPS</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-slate-400">OPERATION MARWAR</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="text-slate-300 font-bold">AARAV SINGH</span>
          <ChevronRight className="w-3 h-3 text-slate-600" />
          <span className="bg-[#F4C430] text-black font-black text-[10px] px-2 py-0.5 rounded shadow-sm">
            {tabTitles[currentTab]}
          </span>
        </div>

        {/* Center: Realtime Dual-Agency Sync & Confidence Pills */}
        <div className="hidden lg:flex items-center space-x-2 text-[10px]">
          {/* Jodhpur Sync Pill */}
          <div className="flex items-center space-x-1.5 bg-[#0D1522] border border-[#0284C7]/40 px-2.5 py-1 rounded text-[#38BDF8]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] animate-ping" />
            <span className="font-bold">JODHPUR-HQ: ONLINE</span>
          </div>

          {/* Kota Sync Pill */}
          <div className="flex items-center space-x-1.5 bg-[#1F1607] border border-[#D97706]/40 px-2.5 py-1 rounded text-[#FBBF24]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706] animate-ping" />
            <span className="font-bold">KOTA-CID: ONLINE</span>
          </div>

          {/* Dual WebSocket Latency Pill */}
          <div className="flex items-center space-x-1 bg-[#12161C] border border-[#232731] px-2 py-1 rounded text-slate-400">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span>REALTIME: 18MS</span>
          </div>

          {/* Confidence Meter */}
          <div className="flex items-center space-x-1.5 bg-[#12161C] border border-emerald-800/60 px-2.5 py-1 rounded text-emerald-300 font-bold">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>CONFIDENCE: 91.4%</span>
          </div>
        </div>

        {/* Right: Agency Scope Selector & Action CTAs */}
        <div className="flex items-center space-x-2">
          {/* Agency Filter Pills */}
          <div className="flex items-center bg-[#111318] p-0.5 rounded border border-[#232731] text-[10px]">
            <button
              onClick={() => onSelectAgency('all')}
              className={`px-2 py-1 rounded font-bold transition-all ${
                activeAgency === 'all'
                  ? 'bg-slate-200 text-black shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              JOINT DECK
            </button>
            <button
              onClick={() => onSelectAgency('jodhpur')}
              className={`px-2 py-1 rounded font-bold transition-all ${
                activeAgency === 'jodhpur'
                  ? 'bg-[#0284C7] text-white shadow'
                  : 'text-slate-400 hover:text-sky-300'
              }`}
            >
              JODHPUR
            </button>
            <button
              onClick={() => onSelectAgency('kota')}
              className={`px-2 py-1 rounded font-bold transition-all ${
                activeAgency === 'kota'
                  ? 'bg-[#D97706] text-white shadow'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              KOTA
            </button>
          </div>

          {/* Ingest Evidence Button */}
          <button
            onClick={onOpenUpload}
            className="px-3 py-1 bg-[#F4C430] hover:bg-[#EAB308] text-black font-black text-xs rounded flex items-center space-x-1.5 transition-all shadow-md shadow-[#F4C430]/20 active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ INGEST</span>
          </button>

          {/* Reset Demo Button */}
          <button
            onClick={onResetCase}
            title="Reset Case to Initial Demo State"
            className="p-1.5 bg-[#111318] hover:bg-[#1A1D24] text-slate-400 hover:text-white border border-[#232731] rounded transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live AI Processing Ticker */}
      {isProcessing && (
        <div className="mt-2 py-1 px-3 bg-[#F4C430]/15 border border-[#F4C430]/40 rounded text-[#F4C430] text-xs flex items-center justify-between font-mono animate-pulse">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-[#F4C430] animate-ping" />
            <span className="font-bold">FORENSIC ENGINE ACTIVE: {processingText || 'Extracting intelligence picture...'}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-[#F4C430]/80">Zero Hallucination Guardrail</span>
        </div>
      )}
    </header>
  );
};
