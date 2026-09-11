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
      label: 'RELATIONSHIP GRAPH',
      icon: Network,
      badge: `${stats.entitiesCount}`
    },
    {
      id: 'contradictions' as NexusNavTab,
      label: 'CONTRADICTION CENTER',
      icon: AlertOctagon,
      badge: stats.flaggedContradictionsCount > 0 ? `${stats.flaggedContradictionsCount} CRITICAL` : null,
      isAlert: stats.flaggedContradictionsCount > 0
    },
    {
      id: 'timeline' as NexusNavTab,
      label: 'TIMELINE & GEOSPATIAL',
      icon: Clock,
      badge: 'SYNCED'
    },
    {
      id: 'dossier' as NexusNavTab,
      label: 'DOSSIER & PROVENANCE',
      icon: FileText,
      badge: 'GRAPH-RAG'
    }
  ];

  return (
    <aside className="w-64 bg-[#090A0D] border-r border-[#232731] flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30 font-mono">
      {/* Top: Operation Logo & Classified Header */}
      <div className="p-4 border-b border-[#232731]">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded bg-[#F4C430] text-black font-bold shadow-md shadow-[#F4C430]/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-black tracking-widest text-white uppercase">
                NEXUS FUSION
              </span>
              <span className="text-[9px] font-bold text-[#F4C430] bg-[#F4C430]/15 px-1 rounded border border-[#F4C430]/40">
                SURAG-AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight mt-0.5">
              PS #16 // AARAV SINGH
            </p>
          </div>
        </div>

        {/* TLP Banner */}
        <div className="mt-3 py-1 px-2 rounded bg-[#F4C430]/10 border border-[#F4C430]/30 flex items-center justify-between text-[9px] font-bold text-[#F4C430]">
          <span className="tracking-widest">TLP:AMBER RESTRICTED</span>
          <Lock className="w-2.5 h-2.5" />
        </div>
      </div>

      {/* Center: Navigation List */}
      <div className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          COMMAND MODULES
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full text-left px-3 py-2.5 rounded text-xs font-bold tracking-wider flex items-center justify-between transition-all ${
                isActive
                  ? 'bg-[#F4C430] text-black shadow-lg shadow-[#F4C430]/20'
                  : 'text-slate-400 hover:text-white hover:bg-[#111318]'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold tracking-normal ${
                    isActive
                      ? 'bg-black text-[#F4C430]'
                      : item.isAlert
                      ? 'bg-red-950 text-red-400 border border-red-800 animate-pulse'
                      : 'bg-[#181A20] text-slate-400 border border-[#2A2E39]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom: System Health Footer */}
      <div className="p-3 border-t border-[#232731] bg-[#0C0E12] text-[10px] text-slate-400 space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-1.5 text-slate-500">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span>LATENCY:</span>
          </span>
          <span className="font-bold text-emerald-400 font-mono">&lt; 18MS</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-1.5 text-slate-500">
            <Lock className="w-3 h-3 text-[#F4C430]" />
            <span>SECURITY:</span>
          </span>
          <span className="font-bold text-slate-200">AES-GCM-256</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-1.5 text-slate-500">
            <Database className="w-3 h-3 text-cyan-400" />
            <span>SUPABASE:</span>
          </span>
          <span className="font-bold text-cyan-400">REALTIME ON</span>
        </div>

        <div className="pt-1.5 border-t border-[#1C202A] flex items-center justify-between text-[9px] text-slate-500">
          <span>CHAIN OF CUSTODY</span>
          <span className="text-emerald-400 flex items-center space-x-0.5">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>SHA-256 OK</span>
          </span>
        </div>
      </div>
    </aside>
  );
};
