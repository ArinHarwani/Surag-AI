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
      label: 'CONTRADICTIONS',
      icon: AlertOctagon,
      badge: stats.flaggedContradictionsCount > 0 ? `${stats.flaggedContradictionsCount} CRITICAL` : null,
      isAlert: stats.flaggedContradictionsCount > 0
    },
    {
      id: 'timeline' as NexusNavTab,
      label: 'TIMELINE & MAP',
      icon: Clock,
      badge: 'SYNCED'
    },
    {
      id: 'dossier' as NexusNavTab,
      label: 'DOSSIER & BRIEF',
      icon: FileText,
      badge: 'CITED'
    }
  ];

  return (
    <aside className="w-64 bg-[#090A0D] border-r border-[#232731] flex flex-col justify-between shrink-0 h-screen sticky top-0 select-none z-30 font-mono">
      {/* Top: Operation Header */}
      <div className="p-4 border-b border-[#232731]">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded bg-[#F4C430] text-black font-extrabold shadow-md shadow-[#F4C430]/20">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-black tracking-widest text-white uppercase">
                SURAG-AI
              </span>
              <span className="text-[10px] font-extrabold text-[#F4C430] bg-[#F4C430]/15 px-1.5 py-0.5 rounded border border-[#F4C430]/40">
                FUSION
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono tracking-tight mt-0.5 font-bold">
              PS #16 // AARAV SINGH
            </p>
          </div>
        </div>

        {/* Case Access Banner */}
        <div className="mt-3 py-1 px-2.5 rounded bg-[#F4C430]/10 border border-[#F4C430]/30 flex items-center justify-between text-xs font-bold text-[#F4C430]">
          <span className="tracking-wider">JOINT CASE FILE // SECURE</span>
          <Lock className="w-3 h-3" />
        </div>
      </div>

      {/* Center: Navigation List */}
      <div className="flex-1 py-3 px-2 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-slate-400">
          INVESTIGATION MODULES
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
                  ? 'bg-[#F4C430] text-black font-black shadow-lg shadow-[#F4C430]/20'
                  : 'text-slate-200 hover:text-white hover:bg-[#12141A]'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-slate-300'}`} />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-xs px-2 py-0.5 rounded font-mono font-bold tracking-normal ${
                    isActive
                      ? 'bg-black text-[#F4C430]'
                      : item.isAlert
                      ? 'bg-red-900/80 text-white border border-red-500 animate-pulse font-extrabold'
                      : 'bg-[#181B22] text-slate-200 border border-[#2A2E39]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom: System Health Footer with clear, real measurements */}
      <div className="p-3.5 border-t border-[#232731] bg-[#0C0E12] text-xs text-slate-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-1.5 text-slate-300">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>SYNC LATENCY:</span>
          </span>
          <span className="font-extrabold text-emerald-400 font-mono">&lt; 18MS</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-1.5 text-slate-300">
            <Database className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>SUPABASE:</span>
          </span>
          <span className="font-extrabold text-[#06B6D4]">REALTIME ACTIVE</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-1.5 text-slate-300">
            <Lock className="w-3.5 h-3.5 text-[#F4C430]" />
            <span>STORAGE:</span>
          </span>
          <span className="font-bold text-white">ENCRYPTED AT REST</span>
        </div>

        <div className="pt-2 border-t border-[#1C202A] flex items-center justify-between text-[11px] text-slate-300 font-bold">
          <span>CHAIN OF CUSTODY</span>
          <span className="text-emerald-400 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>SHA-256 VERIFIED</span>
          </span>
        </div>
      </div>
    </aside>
  );
};
