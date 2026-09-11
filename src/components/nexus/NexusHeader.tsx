'use client';

import React from 'react';
import { 
  Shield, 
  Share2, 
  RotateCcw, 
  Sparkles, 
  ShieldAlert, 
  ChevronRight,
  ShieldCheck,
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import { NexusNavTab } from './NexusSidebar';

interface NexusHeaderProps {
  currentTab: NexusNavTab;
  activeAgency: 'all' | 'jodhpur' | 'kota';
  onSelectAgency: (agency: 'all' | 'jodhpur' | 'kota') => void;
  onOpenUpload: () => void;
  onResetCase: () => void;
  onSelectTab?: (tab: NexusNavTab) => void;
  isProcessing: boolean;
  processingText: string;
}

export const NexusHeader: React.FC<NexusHeaderProps> = ({
  currentTab,
  activeAgency,
  onSelectAgency,
  onOpenUpload,
  onResetCase,
  onSelectTab,
  isProcessing,
  processingText
}) => {
  const tabs: { id: NexusNavTab; label: string }[] = [
    { id: 'overview', label: 'CASE OVERVIEW' },
    { id: 'vault', label: 'EVIDENCE VAULT' },
    { id: 'graph', label: 'ENTITY GRAPH' },
    { id: 'contradictions', label: 'CONTRADICTION CENTER' },
    { id: 'timeline', label: 'TIMELINE & GEO' },
    { id: 'authors', label: 'AUTHORS' },
    { id: 'dossier', label: 'DOSSIER & PROVENANCE' },
  ];

  return (
    <header className="bg-[#EFECE6] border-b-2 border-black text-black px-5 py-2.5 sticky top-0 z-30 select-none font-mono w-full shadow-xs shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand / Platform Title (Expanded across full viewport) */}
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded bg-black text-[#F5C842] flex items-center justify-center font-black shadow-brutal text-sm border-2 border-black">
            <Shield className="w-5 h-5 text-[#F5C842]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-black tracking-wider text-black uppercase">
                SURAG-AI
              </span>
              <span className="text-[10px] bg-black text-[#F5C842] font-black px-2 py-0.5 rounded border border-black shadow-xs">
                INTELLIGENCE FUSION
              </span>
            </div>
            <p className="text-[10px] text-slate-700 font-bold uppercase tracking-tight">
              COLLABORATIVE MULTI-AGENCY PLATFORM // DUAL CUSTODY ACTIVE
            </p>
          </div>
        </div>

        {/* Center: Dual-Agency Sync Block (Matches reference screenshot box) */}
        <div className="hidden xl:flex items-center space-x-3 bg-white border border-black px-3 py-1 shadow-brutal text-xs">
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-600 font-bold text-[10px]">JODHPUR:</span>
            <span className="text-[#0284C7] font-black text-[11px]">99.4%</span>
          </div>
          <span className="text-slate-400">↔</span>
          <div className="flex items-center space-x-1.5">
            <span className="text-slate-600 font-bold text-[10px]">KOTA:</span>
            <span className="text-[#D97706] font-black text-[11px]">100%</span>
          </div>
          <div className="bg-black text-[#F5C842] px-2 py-0.5 text-[9px] font-black uppercase rounded-xs">
            SYNCED
          </div>
        </div>

        {/* Center-Right: Horizontal Nav Tabs (Matches reference screenshot with yellow active tab) */}
        <nav className="flex items-center space-x-1">
          {tabs.map((t) => {
            const isActive = currentTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  if (onSelectTab) {
                    onSelectTab(t.id);
                  } else {
                    const btn = document.getElementById(`sidebar-btn-${t.id}`);
                    if (btn) btn.click();
                  }
                }}
                className={`px-3 py-1.5 text-xs font-black transition-all border ${
                  isActive
                    ? 'bg-[#F5C842] text-black border-2 border-black shadow-brutal'
                    : 'bg-transparent text-slate-800 border-transparent hover:bg-black/5 hover:border-black/20'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* Right: Agency Switcher & Ingest Action Button */}
        <div className="flex items-center space-x-2">
          {/* Agency Filter */}
          <div className="flex items-center bg-white border border-black p-0.5 shadow-brutal text-xs">
            <button
              onClick={() => onSelectAgency('all')}
              className={`px-2 py-1 font-black transition-all ${
                activeAgency === 'all'
                  ? 'bg-black text-white'
                  : 'text-slate-700 hover:text-black'
              }`}
            >
              JOINT
            </button>
            <button
              onClick={() => onSelectAgency('jodhpur')}
              className={`px-2 py-1 font-black transition-all ${
                activeAgency === 'jodhpur'
                  ? 'bg-[#0284C7] text-white'
                  : 'text-slate-700 hover:text-[#0284C7]'
              }`}
            >
              JODHPUR
            </button>
            <button
              onClick={() => onSelectAgency('kota')}
              className={`px-2 py-1 font-black transition-all ${
                activeAgency === 'kota'
                  ? 'bg-[#D97706] text-white'
                  : 'text-slate-700 hover:text-[#D97706]'
              }`}
            >
              KOTA
            </button>
          </div>

          {/* Ingest Action Button */}
          <button
            onClick={onOpenUpload}
            className="px-3 py-1.5 bg-[#F5C842] hover:bg-[#EAB308] text-black font-black text-xs border border-black shadow-brutal flex items-center space-x-1.5 transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <Share2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ INGEST</span>
          </button>

          {/* Reset Demo Button */}
          <button
            onClick={onResetCase}
            title="Reset Case to Initial Demo State"
            className="p-1.5 bg-white hover:bg-slate-100 text-black border border-black shadow-brutal transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Live AI Processing Ticker */}
      {isProcessing && (
        <div className="mt-2 py-1 px-3 bg-white border-2 border-black shadow-brutal text-black text-xs flex items-center justify-between font-mono animate-pulse">
          <div className="flex items-center space-x-2 font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F5C842] border border-black animate-ping" />
            <span>EXTRACTION PIPELINE ACTIVE: {processingText || 'Extracting multi-modal intelligence...'}</span>
          </div>
          <span className="text-xs uppercase font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 border border-emerald-500">
            Grounded In Citations
          </span>
        </div>
      )}
    </header>
  );
};
