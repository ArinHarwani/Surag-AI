'use client';

import React from 'react';
import { 
  Shield, 
  Share2, 
  RotateCcw, 
  Sparkles
} from 'lucide-react';
import { NexusNavTab } from './NexusSidebar';

interface NexusHeaderProps {
  currentTab?: NexusNavTab;
  activeAgency: 'all' | 'jodhpur' | 'kota';
  onSelectAgency: (agency: 'all' | 'jodhpur' | 'kota') => void;
  onOpenUpload: () => void;
  onResetCase: () => void;
  onSelectTab?: (tab: NexusNavTab) => void;
  isProcessing: boolean;
  processingText: string;
}

export const NexusHeader: React.FC<NexusHeaderProps> = ({
  activeAgency,
  onSelectAgency,
  onOpenUpload,
  onResetCase,
  isProcessing,
  processingText
}) => {
  return (
    <header className="bg-[#EFECE6] border-b-2 border-black text-black px-6 py-3.5 sticky top-0 z-30 select-none font-mono w-full shadow-xs shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Prominent SURAG-AI Logo & Brand Title (Clean, Enriched Size) */}
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-md bg-black text-[#F5C842] flex items-center justify-center shadow-brutal border-2 border-black shrink-0 transition-transform hover:scale-105">
            <Shield className="w-7 h-7 sm:w-8 sm:h-8 text-[#F5C842] stroke-[2.2]" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-2xl sm:text-3xl font-black tracking-widest text-black uppercase leading-none font-mono">
              SURAG-AI
            </h1>
          </div>
        </div>

        {/* Right Section: Dual-Agency Sync Block, Agency Filter Switcher, Action Buttons */}
        <div className="flex flex-wrap items-center gap-3.5">
          {/* Dual-Agency Sync Block */}
          <div className="flex items-center space-x-3 bg-white border-2 border-black px-3.5 py-1.5 shadow-brutal text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-600 font-bold text-[11px]">JODHPUR:</span>
              <span className="text-[#0284C7] font-black text-xs">99.4%</span>
            </div>
            <span className="text-slate-400 font-bold">↔</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-600 font-bold text-[11px]">KOTA:</span>
              <span className="text-[#D97706] font-black text-xs">100%</span>
            </div>
            <div className="bg-black text-[#F5C842] px-2 py-0.5 text-[9px] font-black uppercase rounded-xs border border-black">
              SYNCED
            </div>
          </div>

          {/* Agency Filter Switcher */}
          <div className="flex items-center bg-white border-2 border-black p-0.5 shadow-brutal text-xs">
            <button
              onClick={() => onSelectAgency('all')}
              className={`px-3 py-1.5 font-black transition-all ${
                activeAgency === 'all'
                  ? 'bg-black text-white'
                  : 'text-slate-700 hover:text-black hover:bg-slate-100'
              }`}
            >
              JOINT
            </button>
            <button
              onClick={() => onSelectAgency('jodhpur')}
              className={`px-3 py-1.5 font-black transition-all ${
                activeAgency === 'jodhpur'
                  ? 'bg-[#0284C7] text-white'
                  : 'text-slate-700 hover:text-[#0284C7] hover:bg-slate-100'
              }`}
            >
              JODHPUR
            </button>
            <button
              onClick={() => onSelectAgency('kota')}
              className={`px-3 py-1.5 font-black transition-all ${
                activeAgency === 'kota'
                  ? 'bg-[#D97706] text-white'
                  : 'text-slate-700 hover:text-[#D97706] hover:bg-slate-100'
              }`}
            >
              KOTA
            </button>
          </div>

          {/* Ingest Action Button */}
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 bg-[#F5C842] hover:bg-[#EAB308] text-black font-black text-xs border-2 border-black shadow-brutal flex items-center space-x-1.5 transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
            <span>+ INGEST</span>
          </button>

          {/* Reset Demo Button */}
          <button
            onClick={onResetCase}
            title="Reset Case to Initial Demo State"
            className="p-2 bg-white hover:bg-slate-100 text-black border-2 border-black shadow-brutal transition active:translate-x-0.5 active:translate-y-0.5"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live AI Processing Ticker */}
      {isProcessing && (
        <div className="mt-2.5 py-1.5 px-3.5 bg-white border-2 border-black shadow-brutal text-black text-xs flex items-center justify-between font-mono animate-pulse">
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
