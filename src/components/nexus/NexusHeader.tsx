'use client';

import React from 'react';
import {
  Shield,
  RotateCcw,
  FolderPlus,
  Link2,
  CheckCircle2,
} from 'lucide-react';
import { NexusNavTab } from './NexusSidebar';
import { AgencySlug } from '@/types/investigation';

interface NexusHeaderProps {
  currentTab?: NexusNavTab;
  scopedAgency: AgencySlug;
  onOpenUpload: () => void;
  onOpenConnect: () => void;
  onResetCase: () => void;
  onSelectTab?: (tab: NexusNavTab) => void;
  isProcessing: boolean;
  processingText: string;
  hasActiveCase: boolean;
  hasExistingConnectionRequest: boolean;
  acceptedLinkedAgencies: AgencySlug[];
  activeCaseName: string | null;
}

const AGENCY_CONFIG: Record<AgencySlug, {
  label: string;
  sublabel: string;
  accentColor: string;
  badge: string;
}> = {
  jodhpur: {
    label: 'JODHPUR POLICE HQ',
    sublabel: 'Tactical Command Portal // Sector RJ-19',
    accentColor: '#0284C7',
    badge: 'JODHPUR-HQ',
  },
  kota: {
    label: 'KOTA POLICE CID',
    sublabel: 'Special Intelligence Unit // Sector RJ-24',
    accentColor: '#D97706',
    badge: 'KOTA-CID',
  },
};

const PARTNER_LABELS: Record<AgencySlug, string> = {
  jodhpur: 'KOTA POLICE CID',
  kota: 'JODHPUR POLICE HQ',
};

export const NexusHeader: React.FC<NexusHeaderProps> = ({
  scopedAgency,
  onOpenUpload,
  onOpenConnect,
  onResetCase,
  isProcessing,
  processingText,
  hasActiveCase,
  hasExistingConnectionRequest,
  acceptedLinkedAgencies,
  activeCaseName,
}) => {
  const cfg = AGENCY_CONFIG[scopedAgency];
  const partnerLabel = PARTNER_LABELS[scopedAgency];
  const isLinked = acceptedLinkedAgencies.length > 0;

  return (
    <header className="bg-[#EFECE6] border-b-2 border-black text-black px-5 py-3 sticky top-0 z-30 select-none font-mono w-full shadow-xs shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-3">

        {/* LEFT: Logo + Agency Identity */}
        <div className="flex items-center gap-4">
          <div
            className="w-11 h-11 rounded-md flex items-center justify-center shadow-brutal border-2 border-black shrink-0"
            style={{ backgroundColor: cfg.accentColor }}
          >
            <Shield className="w-6 h-6 text-white stroke-[2.2]" />
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-xl sm:text-2xl font-black tracking-widest text-black uppercase leading-none font-mono">
              SURAG-AI
            </h1>
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
          </div>
        </div>

        {/* RIGHT: Controls */}
        <div className="flex flex-wrap items-center gap-2.5">

          {/* Linked Indicator — shown when a connection is accepted */}
          {isLinked && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 border-2 border-emerald-600 text-emerald-800 text-xs font-black">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>LINKED WITH: {partnerLabel}</span>
            </div>
          )}

          {/* Sync Status */}
          <div className="flex items-center space-x-2 bg-white border-2 border-black px-3 py-1.5 shadow-brutal text-xs">
            <span className="text-slate-600 font-bold text-[11px] uppercase">{cfg.badge}:</span>
            <span className="font-black text-xs" style={{ color: cfg.accentColor }}>LIVE</span>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <div className="bg-black text-[#F5C842] px-1.5 py-0.5 text-[9px] font-black uppercase border border-black">
                {isLinked ? 'JOINT SYNC' : 'LOCAL SYNC'}
              </div>
            </div>
          </div>

          {/* REPORT / CONNECT TO — only shown when a case exists and not already requested */}
          {hasActiveCase && !hasExistingConnectionRequest && !isLinked && (
            <button
              onClick={onOpenConnect}
              title={`Send cross-agency connection request to ${partnerLabel}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border-2 border-black shadow-brutal text-xs font-black transition active:translate-x-0.5 active:translate-y-0.5"
            >
              <Link2 className="w-3.5 h-3.5 text-slate-700" />
              <span>REPORT / CONNECT TO {partnerLabel}</span>
            </button>
          )}

          {/* Pending request state */}
          {hasExistingConnectionRequest && !isLinked && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border-2 border-amber-500 text-amber-800 text-xs font-black">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>REQUEST PENDING — {partnerLabel}</span>
            </div>
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
            title="Clear all case data"
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
