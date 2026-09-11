'use client';

import React from 'react';
import { useInvestigation } from '@/lib/store/investigation-context';
import { Radio, X, Eye } from 'lucide-react';
import { formatTimeIST } from '@/lib/utils/formatDate';

interface InterAgencyAlertBannerProps {
  currentAgency: 'jodhpur' | 'kota' | 'all';
}

export const InterAgencyAlertBanner: React.FC<InterAgencyAlertBannerProps> = ({ currentAgency }) => {
  const { latestTransmission, dismissTransmission, setProvenanceFocus, documents } = useInvestigation();

  if (!latestTransmission) return null;

  // Show if transmission is directed to this agency, or if it came from the opposite agency, or if on all
  const isIncoming =
    currentAgency === 'all' ||
    latestTransmission.toAgency === currentAgency ||
    latestTransmission.fromAgency !== currentAgency;
  if (!isIncoming) return null;

  const senderName = latestTransmission.fromAgency === 'jodhpur' ? 'JODHPUR POLICE HQ' : 'KOTA POLICE CID';
  const recipientName = latestTransmission.toAgency === 'jodhpur' ? 'JODHPUR HQ' : 'KOTA CID';

  const doc = latestTransmission.documentId ? documents.find((d) => d.id === latestTransmission.documentId) : null;

  return (
    <div className="bg-[#FEF08A] border-b-2 border-black px-4 py-2.5 shadow-brutal font-mono text-black select-none z-30 transition-all">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="p-1.5 rounded bg-black text-[#F5C842] border-2 border-black shadow-brutal animate-pulse">
            <Radio className="w-4 h-4 text-[#F5C842]" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-black text-white text-[10px] uppercase font-black tracking-wider shadow-brutal">
                REALTIME DISPATCH // {senderName} ➔ {recipientName}
              </span>
              <span suppressHydrationWarning className="text-[10px] text-slate-700 font-bold">
                {formatTimeIST(latestTransmission.timestamp)}
              </span>
            </div>
            <p className="font-sans font-bold text-xs mt-0.5 text-black">
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
              className="px-3 py-1 rounded bg-black hover:bg-slate-800 text-[#F5C842] text-[11px] font-black flex items-center gap-1 border-2 border-black shadow-brutal transition active:translate-x-0.5 active:translate-y-0.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>INSPECT PAYLOAD</span>
            </button>
          )}

          <button
            onClick={dismissTransmission}
            className="p-1 rounded bg-white hover:bg-slate-100 text-black border-2 border-black shadow-brutal transition active:translate-x-0.5 active:translate-y-0.5"
            title="Acknowledge Alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
