'use client';

import React from 'react';
import { 
  Shield, 
  LayoutGrid, 
  FolderArchive, 
  Network, 
  AlertOctagon, 
  Clock, 
  FileText, 
  Lock, 
  Activity, 
  Radio,
  CheckCircle2,
  Database
} from 'lucide-react';

export type NexusNavTab = 
  | 'overview' 
  | 'vault' 
  | 'graph' 
  | 'contradictions' 
  | 'timeline' 
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
      id: 'dossier' as NexusNavTab,
      label: 'DOSSIER & PROVENANCE',
      icon: FileText,
      badge: 'CITED'
    }
  ];

  return (
    <aside className="w-64 bg-[#EAE6DD] border-r-2 border-black flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30 font-mono text-black">
      {/* Top: Operation Header Block (Matches reference screenshot box) */}
      <div className="p-3.5 space-y-3">
        <div className="border border-black bg-white p-3 shadow-brutal space-y-1">
          <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
            OPERATION
          </div>
          <div className="text-sm font-black uppercase text-black tracking-tight leading-none">
            MARWAR SYNDICATE
          </div>
          <div className="text-[10px] text-red-600 font-black uppercase pt-1">
            DESK AUDIT: <span className="underline">ACTIVE</span>
          </div>
        </div>

        <div className="text-[10px] font-black uppercase tracking-widest text-slate-600 px-1 pt-1">
          JOINT TERMINAL ACCESS
        </div>

        {/* Navigation List */}
        <div className="space-y-1.5">
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

      {/* Bottom: System Health Footer (Matches reference screenshot bottom) */}
      <div className="p-3 border-t-2 border-black bg-white text-[10px] text-slate-800 space-y-1.5 font-bold">
        <div className="text-[9px] uppercase tracking-widest text-slate-600 font-black">
          SYSTEM HEALTH
        </div>
        <div className="flex items-center justify-between">
          <span>LATENCY: 14ms</span>
          <span>ENCR: AES-256-GCM</span>
        </div>
        <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200">
          <span>SUPABASE RELAY:</span>
          <span className="text-emerald-700 font-black">CONNECTED</span>
        </div>
      </div>
    </aside>
  );
};
