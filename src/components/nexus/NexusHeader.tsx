'use client';

import React, { useState } from 'react';
import {
  Shield,
  RotateCcw,
  FolderPlus,
  Link2,
  CheckCircle2,
  ChevronDown,
  MapPin,
} from 'lucide-react';
import { NexusNavTab } from './NexusSidebar';
import { AgencySlug } from '@/types/investigation';

interface NexusHeaderProps {
  currentTab?: NexusNavTab;
  scopedAgency: AgencySlug;
  onOpenUpload: () => void;
  onOpenConnect: (targetAgency?: AgencySlug) => void;
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
  jaipur: {
    label: 'JAIPUR POLICE HQ',
    sublabel: 'State Command Center // Sector RJ-14',
    accentColor: '#059669',
    badge: 'JAIPUR-HQ',
  },
  ajmer: {
    label: 'AJMER DISTRICT POLICE',
    sublabel: 'District Intelligence // Sector RJ-01',
    accentColor: '#7C3AED',
    badge: 'AJMER-DIST',
  },
  jaisalmer: {
    label: 'JAISALMER BORDER POLICE',
    sublabel: 'Border Security Wing // Sector RJ-15',
    accentColor: '#DC2626',
    badge: 'JAISALMER-BORDER',
  },
};

const PARTNER_LABELS: Record<AgencySlug, string> = {
  jodhpur: 'KOTA POLICE CID',
  kota: 'JODHPUR POLICE HQ',
  jaipur: 'JODHPUR POLICE HQ',
  ajmer: 'KOTA POLICE CID',
  jaisalmer: 'JODHPUR POLICE HQ',
};

// Cities available for cross-agency reporting/connection
const REPORTING_CITIES = [
  { label: 'JAIPUR', sublabel: 'Rajasthan Police HQ' },
  { label: 'KOTA',   sublabel: 'Kota Police CID' },
  { label: 'AJMER',  sublabel: 'Ajmer District Police' },
  { label: 'JAISALMER', sublabel: 'Jaisalmer Border Police' },
];

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
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

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

          {/* REPORT / CONNECT TO — city dropdown tile */}
          {!hasExistingConnectionRequest && !isLinked && (
            <div className="relative">
              <button
                onClick={() => {
                  if (!hasActiveCase) return;
                  setCityDropdownOpen((o) => !o);
                }}
                disabled={!hasActiveCase}
                title={hasActiveCase ? "Select city to report / connect to" : "Open a case first to send connection request"}
                className={`flex items-center gap-1.5 px-3 py-1.5 border-2 border-black shadow-brutal text-xs font-black transition ${
                  hasActiveCase
                    ? 'bg-white hover:bg-slate-100 cursor-pointer active:translate-x-0.5 active:translate-y-0.5'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-75'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-slate-700" />
                <span>{selectedCity ? `REPORT TO: ${selectedCity}` : 'REPORT / CONNECT TO'}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${cityDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {cityDropdownOpen && hasActiveCase && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white border-2 border-black shadow-brutal z-50">
                  {REPORTING_CITIES.map((city) => (
                    <button
                      key={city.label}
                      onClick={() => {
                        setSelectedCity(city.label);
                        setCityDropdownOpen(false);
                        onOpenConnect(city.label.toLowerCase() as AgencySlug);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#F5C842] transition flex flex-col border-b border-black/10 last:border-0"
                    >
                      <span className="text-xs font-black uppercase text-black">{city.label}</span>
                      <span className="text-[10px] text-slate-500 font-bold">{city.sublabel}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pending request state */}
          {hasExistingConnectionRequest && !isLinked && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border-2 border-amber-500 text-amber-800 text-xs font-black">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>REQUEST PENDING — {selectedCity || partnerLabel}</span>
            </div>
          )}

          {/* Add Evidence / Add New Case Button */}
          <button
            onClick={onOpenUpload}
            className="px-4 py-2 text-black font-black text-xs border-2 border-black shadow-brutal flex items-center space-x-1.5 transition active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
            style={{ backgroundColor: '#F5C842' }}
          >
            <FolderPlus className="w-4 h-4 stroke-[2.5]" />
            <span>{hasActiveCase ? '+ ADD EVIDENCE' : '+ ADD NEW CASE'}</span>
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
