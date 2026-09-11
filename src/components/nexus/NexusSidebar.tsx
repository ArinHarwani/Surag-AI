'use client';

import React from 'react';
import {
  LayoutGrid,
  FolderArchive,
  Network,
  AlertOctagon,
  Clock,
  FileText,
  UserCheck,
} from 'lucide-react';

export type NexusNavTab =
  | 'overview'
  | 'vault'
  | 'graph'
  | 'contradictions'
  | 'timeline'
  | 'authors'
  | 'dossier';

interface NexusSidebarProps {
  currentTab: NexusNavTab;
  onSelectTab: (tab: NexusNavTab) => void;
  scopedAgency?: 'all' | 'jodhpur' | 'kota';
  stats: {
    documentsCount: number;
    entitiesCount: number;
    flaggedContradictionsCount: number;
    suggestedCount: number;
  };
}

// Agency accent colors
const AGENCY_ACCENT: Record<string, string> = {
  jodhpur: '#0284C7',
  kota: '#D97706',
  all: '#111111',
};

export const NexusSidebar: React.FC<NexusSidebarProps> = ({
  currentTab,
  onSelectTab,
  scopedAgency = 'all',
  stats,
}) => {
  const accentColor = AGENCY_ACCENT[scopedAgency] || '#111111';

  const navItems = [
    {
      id: 'overview' as NexusNavTab,
      label: 'CASE OVERVIEW',
      icon: LayoutGrid,
      badge: null,
    },
    {
      id: 'vault' as NexusNavTab,
      label: 'EVIDENCE VAULT',
      icon: FolderArchive,
      badge: `${stats.documentsCount}`,
    },
    {
      id: 'graph' as NexusNavTab,
      label: 'ENTITY GRAPH',
      icon: Network,
      badge: `${stats.entitiesCount}`,
    },
    {
      id: 'contradictions' as NexusNavTab,
      label: 'CONTRADICTION CENTER',
      icon: AlertOctagon,
      badge: stats.flaggedContradictionsCount > 0 ? `${stats.flaggedContradictionsCount} CRIT` : null,
      isAlert: stats.flaggedContradictionsCount > 0,
    },
    {
      id: 'timeline' as NexusNavTab,
      label: 'TIMELINE & GEO',
      icon: Clock,
      badge: 'SYNCED',
    },
    {
      id: 'authors' as NexusNavTab,
      label: 'EVIDENCE AUTHORS',
      icon: UserCheck,
      badge: stats.documentsCount > 0 ? 'ACTIVE' : null,
    },
    {
      id: 'dossier' as NexusNavTab,
      label: 'DOSSIER & PROVENANCE',
      icon: FileText,
      badge: 'CITED',
    },
  ];

  // Agency label text for the sidebar tag
  const agencyLabel =
    scopedAgency === 'jodhpur'
      ? 'JODHPUR HQ'
      : scopedAgency === 'kota'
      ? 'KOTA CID'
      : 'JOINT';

  return (
    <aside className="w-60 bg-[#EAE6DD] border-r-2 border-black flex flex-col justify-between shrink-0 h-full select-none z-10 font-mono text-black overflow-y-auto">
      {/* Navigation Desk Section */}
      <div className="p-3 space-y-2">
        {/* Sidebar Header */}
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-600 px-2 py-1.5 border-b border-black/15 flex items-center justify-between">
          <span>INVESTIGATION DESK</span>
          <span
            className="text-[9px] px-1.5 py-0.5 font-black border border-black text-white"
            style={{ backgroundColor: accentColor }}
          >
            {agencyLabel}
          </span>
        </div>

        {/* Navigation Buttons */}
        <div className="space-y-1 pt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                id={`sidebar-btn-${item.id}`}
                onClick={() => onSelectTab(item.id)}
                className={`w-full text-left px-3 py-2.5 text-xs font-black tracking-wider flex items-center justify-between transition-all border ${
                  isActive
                    ? 'text-white border-black shadow-brutal'
                    : 'bg-transparent text-slate-800 border-transparent hover:bg-white hover:border-black/30'
                }`}
                style={isActive ? { backgroundColor: accentColor } : {}}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon
                    className="w-4 h-4"
                    style={{ color: isActive ? '#FFFFFF' : '#475569' }}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 font-mono font-black ${
                      isActive
                        ? 'bg-white text-black'
                        : item.isAlert
                        ? 'bg-red-600 text-white animate-pulse'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

    </aside>
  );
};
