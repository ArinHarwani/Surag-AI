'use client';

import React from 'react';
import { useInvestigation } from '@/lib/store/investigation-context';
import { Radio, ArrowRightLeft, X, Eye, ShieldAlert, Sparkles } from 'lucide-react';

interface InterAgencyAlertBannerProps {
  currentAgency: 'jodhpur' | 'kota';
}

export const InterAgencyAlertBanner: React.FC<InterAgencyAlertBannerProps> = ({ currentAgency }) => {
  const { latestTransmission, dismissTransmission, setProvenanceFocus, documents } = useInvestigation();

  if (!latestTransmission) return null;

  // Show if transmission is directed to this agency, or if it came from the opposite agency
  const isIncoming = latestTransmission.toAgency === currentAgency || latestTransmission.fromAgency !== currentAgency;
  if (!isIncoming) return null;

  const senderName = latestTransmission.fromAgency === 'jodhpur' ? 'JODHPUR POLICE HQ' : 'KOTA POLICE CID';
  const accentColor = latestTransmission.fromAgency === 'jodhpur' ? 'border-sky-500 bg-sky-950/90 text-sky-200' : 'border-amber-500 bg-amber-950/90 text-amber-200';

  const doc = latestTransmission.documentId ? documents.find((d) => d.id === latestTransmission.documentId) : null;

  return (
    <div className={`border-b px-4 py-2.5 backdrop-blur-md shadow-xl transition-all animate-bounce ${accentColor}`}>
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="p-1.5 rounded bg-black/40 border border-white/20 animate-pulse">
            <Radio className="w-4 h-4 text-emerald-400" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.5 rounded bg-black/50 text-[10px] uppercase font-bold tracking-wider border border-white/10">
                REALTIME DISPATCH // {senderName} ➔ {currentAgency.toUpperCase()} SECTOR
              </span>
              <span className="text-[10px] text-white/70">
                {new Date(latestTransmission.timestamp).toLocaleTimeString()} IST
              </span>
            </div>
            <p className="font-sans font-medium text-xs mt-0.5 text-white">
              {latestTransmission.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {doc && (
            <button
              onClick={() => {
                setProvenanceFocus({
                  documentId: doc.id,
                  sourceOffset: 'Line 1',
                  title: doc.title,
                  mediaType: doc.file_type,
                  snippet: doc.content_text,
                });
              }}
              className="px-2.5 py-1 rounded bg-black/60 hover:bg-black text-white text-[11px] font-mono flex items-center gap-1 border border-white/20 transition"
            >
              <Eye className="w-3 h-3 text-cyan-400" />
              <span>Inspect Payload</span>
            </button>
          )}

          <button
            onClick={dismissTransmission}
            className="p-1 rounded hover:bg-black/40 text-white/70 hover:text-white transition"
            title="Acknowledge Alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
