'use client';

import React from 'react';
import { 
  LayoutGrid, 
  FolderArchive, 
  Network, 
  AlertOctagon, 
  Clock, 
  FileText, 
  UserCheck
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
  stats: {
    documentsCount: number;
    entitiesCount: number;
    flaggedContradictionsCount: number;
    suggestedCount: number;
  };
}

export const NexusSidebar: React.FC<NexusSidebarProps> = ({
  currentTab,
  onSelectTab,
  stats
}) => {
  const navItems = [
    {
      id: 'overview' as NexusNavTab,
      label: 'CASE OVERVIEW',
      icon: LayoutGrid,
      badge: null
    },
    {
      id: 'vault' as NexusNavTab,
      label: 'EVIDENCE VAULT',
      icon: FolderArchive,
      badge: `${stats.documentsCount}`
    },
    {
      id: 'graph' as NexusNavTab,
      label: 'ENTITY GRAPH',
      icon: Network,
      badge: `${stats.entitiesCount}`
    },
    {
      id: 'contradictions' as NexusNavTab,
      label: 'CONTRADICTION CENTER',
      icon: AlertOctagon,
      badge: stats.flaggedContradictionsCount > 0 ? `${stats.flaggedContradictionsCount} CRIT` : null,
      isAlert: stats.flaggedContradictionsCount > 0
    },
    {
      id: 'timeline' as NexusNavTab,
      label: 'TIMELINE & GEO',
      icon: Clock,
      badge: 'SYNCED'
    },
    {
      id: 'authors' as NexusNavTab,
      label: 'EVIDENCE AUTHORS',
      icon: UserCheck,
      badge: '4 ACTIVE'
    },
    {
      id: 'dossier' as NexusNavTab,
      label: 'DOSSIER & PROVENANCE',
      icon: FileText,
      badge: 'CITED'
    }
  ];

  return (
    <aside className="w-60 bg-[#EAE6DD] border-r-2 border-black flex flex-col justify-between shrink-0 h-full select-none z-10 font-mono text-black overflow-y-auto">
      {/* Navigation Desk Section */}
      <div className="p-3 space-y-2">
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-600 px-2 py-1.5 border-b border-black/15 flex items-center justify-between">
          <span>INVESTIGATION DESK</span>
          <span className="text-[9px] bg-black text-[#F5C842] px-1.5 py-0.5 font-black border border-black">
            TERMINAL
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
                    ? 'bg-black text-white border-black shadow-brutal'
                    : 'bg-transparent text-slate-800 border-transparent hover:bg-white hover:border-black/30'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#F5C842]' : 'text-slate-700'}`} />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 font-mono font-black ${
                      isActive
                        ? 'bg-[#F5C842] text-black'
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

      {/* Clean Minimal Custody Status Bar */}
      <div className="p-3 border-t border-black/20 text-[10px] text-slate-600 font-bold flex items-center justify-between bg-[#EFECE6]/50">
        <div className="flex items-center space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 border border-black animate-pulse" />
          <span className="font-black text-slate-800">CUSTODY SYNCED</span>
        </div>
        <span className="text-[9px] font-black uppercase text-slate-500">PS #16</span>
      </div>
    </aside>
  );
};
