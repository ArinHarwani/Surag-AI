'use client';

import React from 'react';
import Link from 'next/link';
import {
  Shield,
  Share2,
  RotateCcw,
  ArrowLeftRight,
  FolderPlus,
} from 'lucide-react';
import { NexusNavTab } from './NexusSidebar';

interface NexusHeaderProps {
  currentTab?: NexusNavTab;
  activeAgency: 'all' | 'jodhpur' | 'kota';
  scopedAgency?: 'all' | 'jodhpur' | 'kota';
  onSelectAgency: (agency: 'all' | 'jodhpur' | 'kota') => void;
  onOpenUpload: () => void;
  onResetCase: () => void;
  onSelectTab?: (tab: NexusNavTab) => void;
  isProcessing: boolean;
  processingText: string;
}

// Branding config per agency
const AGENCY_CONFIG = {
  jodhpur: {
    label: 'JODHPUR POLICE HQ',
    sublabel: 'Tactical Command Portal // Sector RJ-19',
    accentColor: '#0284C7',
    accentHover: '#0369A1',
    partnerLabel: 'KOTA CID PORTAL',
    partnerHref: '/kota',
    partnerColor: '#D97706',
    partnerBg: '#FEF3C7',
  },
  kota: {
    label: 'KOTA POLICE CID',
    sublabel: 'Special Intelligence Unit // Sector RJ-24',
    accentColor: '#D97706',
    accentHover: '#B45309',
    partnerLabel: 'JODHPUR HQ PORTAL',
    partnerHref: '/jodhpur',
    partnerColor: '#0284C7',
    partnerBg: '#E0F2FE',
  },
  all: {
    label: 'SURAG-AI — JOINT FUSION DESK',
    sublabel: 'Dual Agency Intelligence Command',
    accentColor: '#111111',
    accentHover: '#374151',
    partnerLabel: '',
    partnerHref: '/',
    partnerColor: '#111111',
    partnerBg: '#F5F5F5',
  },
};

export const NexusHeader: React.FC<NexusHeaderProps> = ({
  activeAgency,
  scopedAgency,
  onSelectAgency,
  onOpenUpload,
  onResetCase,
  isProcessing,
  processingText,
}) => {
  // Use scopedAgency for branding if we're on a specific portal; fallback to 'all'
  const portalAgency = scopedAgency && scopedAgency !== 'all' ? scopedAgency : 'all';
  const cfg = AGENCY_CONFIG[portalAgency];
  const isSpecificPortal = portalAgency !== 'all';

  return (
    <header className="bg-[#EFECE6] border-b-2 border-black text-black px-5 py-3 sticky top-0 z-30 select-none font-mono w-full shadow-xs shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-3">

        {/* LEFT: Logo + Agency Identity */}
        <div className="flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-md flex items-center justify-center shadow-brutal border-2 border-black shrink-0 transition-transform hover:scale-105"
            style={{ backgroundColor: isSpecificPortal ? cfg.accentColor : '#111111' }}
          >
            <Shield className="w-6 h-6 text-white stroke-[2.2]" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-xl sm:text-2xl font-black tracking-widest text-black uppercase leading-none font-mono">
              SURAG-AI
            </h1>
            {isSpecificPortal && (
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="text-[10px] font-black px-2 py-0.5 border border-black text-white uppercase tracking-wider"
                  style={{ backgroundColor: cfg.accentColor }}
                >
                  {cfg.label}
                </span>
                <span className="text-[10px] text-slate-600 font-bold hidden sm:block">
                  {cfg.sublabel}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Controls */}
        <div className="flex flex-wrap items-center gap-2.5">

          {/* Sync Status Indicator */}
          <div className="flex items-center space-x-2.5 bg-white border-2 border-black px-3 py-1.5 shadow-brutal text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-600 font-bold text-[11px]">JODHPUR:</span>
              <span className="text-[#0284C7] font-black text-xs">99.4%</span>
            </div>
            <span className="text-slate-400 font-bold">↔</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-slate-600 font-bold text-[11px]">KOTA:</span>
              <span className="text-[#D97706] font-black text-xs">100%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <div className="bg-black text-[#F5C842] px-1.5 py-0.5 text-[9px] font-black uppercase border border-black">
                SYNCED
              </div>
            </div>
          </div>

          {/* Portal Switcher — only shown on specific portals */}
          {isSpecificPortal && (
            <Link
              href={cfg.partnerHref}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border-2 border-black shadow-brutal text-xs font-black transition active:translate-x-0.5 active:translate-y-0.5"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" style={{ color: cfg.partnerColor }} />
              <span>SWITCH TO {cfg.partnerLabel}</span>
            </Link>
          )}

          {/* Add New Case Button */}
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 text-black font-black text-xs border-2 border-black shadow-brutal flex items-center space-x-1.5 transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            style={{ backgroundColor: '#F5C842' }}
          >
            <FolderPlus className="w-4 h-4 stroke-[2.5]" />
            <span>+ ADD NEW CASE</span>
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
