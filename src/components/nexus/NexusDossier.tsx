'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles,
  Lock,
  Printer
} from 'lucide-react';
import { Document } from '@/types/investigation';

interface NexusDossierProps {
  documents: Document[];
  onOpenProvenance: (docId: string, offset: string, snippet?: string) => void;
}

export const NexusDossier: React.FC<NexusDossierProps> = ({
  documents,
  onOpenProvenance
}) => {
  const citations = [
    {
      id: 'CIT-01',
      docId: 'doc-jod-witness-01',
      offset: 'Line 1-4',
      claim: 'Aarav Singh identified as primary operative piloting White Scorpio (RJ-19-UB-4022) during Mandore and Bilara highway transit.',
      source: 'Bilara Toll Plaza FASTag Telemetry & Witness Memo'
    },
    {
      id: 'CIT-02',
      docId: 'doc-jod-witness-01',
      offset: 'Line 5-8',
      claim: 'Physical rendezvous and hardware handover executed at Mehrangarh South Ascent Clock Tower at 22:30 IST.',
      source: 'Jodhpur Witness Statement #042 (Rajiv Rathore)'
    },
    {
      id: 'CIT-03',
      docId: 'doc-kota-cctv-02',
      offset: 'Line 5-8',
      claim: 'Suspect observed exiting Silver Bolero (RJ-20-CA-8812) at Chambal River Bridge toll plaza, Kota at 22:45 IST.',
      source: 'Kota SIU ANPR Surveillance Log #118'
    },
    {
      id: 'CIT-04',
      docId: 'doc-wiretap-audio-03',
      offset: '00:02:14',
      claim: 'Devendra Sharma instructed armed escort convoy to divert toward Rawatbhata Highway safehouse milestone 14.',
      source: 'Tactical Radio Wiretap Intercept #09A'
    },
    {
      id: 'CIT-05',
      docId: 'doc-cctv-optical-04',
      offset: 'bbox [120,450,280,620]',
      claim: 'Optical CCTV detection verified Glock 19 sidearm in possession of cabin associate at Nayapura barrier.',
      source: 'NightVision Optical Frame Checkpost 04'
    }
  ];

  return (
    <div className="p-4 lg:p-6 space-y-4 font-mono select-none text-black">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 border-2 border-black shadow-brutal">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-black" />
            <h2 className="text-base font-black uppercase tracking-wider text-black">
              INTELLIGENCE BRIEFING &amp; CITATION REGISTRY
            </h2>
          </div>
          <p className="text-xs text-slate-700 font-bold mt-0.5">
            Evidence-grounded synthesis with verified source document line offsets.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-black border-2 border-black font-black flex items-center space-x-1.5 shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT DOSSIER</span>
          </button>
          <button
            onClick={() => {
              const text = `CLASSIFIED INTELLIGENCE BRIEF // OPERATION MARWAR\nCASE: AARAV SINGH\n\n1. EXECUTIVE SUMMARY & TACTICAL OVERVIEW [CIT-01]...`;
              const blob = new Blob([text], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `OPERATION-MARWAR-DOSSIER-${Date.now()}.md`;
              a.click();
            }}
            className="px-3.5 py-1.5 bg-[#F5C842] hover:bg-[#EAB308] text-black font-black border-2 border-black shadow-brutal flex items-center space-x-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>EXPORT MD</span>
          </button>
        </div>
      </div>

      {/* Main Document / Report Layout (White Card with Sharp Black Borders) */}
      <div className="bg-white border-2 border-black p-6 lg:p-8 text-black shadow-brutal-lg space-y-7 max-w-4xl mx-auto">
        {/* Document Header Block */}
        <div className="border-b-2 border-black pb-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-black bg-[#F5C842] px-2 py-0.5 border border-black">
              RESTRICTED // LAW ENFORCEMENT SENSITIVE
            </span>
            <h1 className="text-xl lg:text-2xl font-black uppercase tracking-tight mt-2 text-black">
              INTELLIGENCE BRIEFING: OPERATION MARWAR (AARAV SINGH)
            </h1>
            <p className="text-xs font-bold text-slate-700 mt-1">
              JOINT INVESTIGATIVE SYNTHESIS // JODHPUR DISTRICT POLICE &amp; KOTA POLICE COMMISSIONERATE
            </p>
          </div>

          <div className="sm:text-right text-[11px] font-mono text-slate-700 font-bold shrink-0">
            <p>REF: JOD-KOTA-FUSION-2026-99</p>
            <p>DATE: 11-SEPT-2026 18:00 IST</p>
            <p className="text-emerald-800 font-black">CUSTODY CHAIN: SHA-256 OK</p>
          </div>
        </div>

        {/* Section 1: Executive Summary & Tactical Overview */}
        <section className="space-y-2 relative">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wide text-black flex items-center space-x-2">
              <span>1.0 EXECUTIVE INTELLIGENCE SUMMARY</span>
            </h3>
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-600 text-[10px] font-black px-2 py-0.5 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>VERIFIED FACT</span>
            </span>
          </div>

          <p className="text-xs text-slate-800 leading-relaxed font-sans font-medium">
            Over the 48-hour cycle of 10–11 September 2026, synchronized multi-modal surveillance across Jodhpur and Kota police jurisdictions established a high-priority contraband logistics pipeline spearheaded by prime suspect <strong>Aarav Singh</strong>{' '}
            <button
              onClick={() => onOpenProvenance(citations[0].docId, citations[0].offset, citations[0].claim)}
              className="inline-flex items-center px-1.5 py-0.2 bg-[#F5C842] text-black font-black text-[11px] border border-black hover:bg-[#EAB308] mx-1 transition cursor-pointer"
            >
              [CIT-01]
            </button>
            . Cross-agency signal intelligence and automated plate readers detected suspect movement across key Rajasthan highway choke points along NH-25 and NH-27.
          </p>
        </section>

        {/* Section 2: Suspect Corridors & Handover Operations */}
        <section className="space-y-2 relative border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wide text-black flex items-center space-x-2">
              <span>2.0 SUSPECT CORRIDORS &amp; HANDOVER OPERATIONS</span>
            </h3>
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-600 text-[10px] font-black px-2 py-0.5 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>VERIFIED FACT</span>
            </span>
          </div>

          <p className="text-xs text-slate-800 leading-relaxed font-sans font-medium">
            At 22:30 IST on 10 September, field witness Rajiv Rathore verified suspect Aarav Singh handing over an encrypted duffel bag at Mehrangarh South Clock Tower{' '}
            <button
              onClick={() => onOpenProvenance(citations[1].docId, citations[1].offset, citations[1].claim)}
              className="inline-flex items-center px-1.5 py-0.2 bg-[#F5C842] text-black font-black text-[11px] border border-black hover:bg-[#EAB308] mx-1 transition cursor-pointer"
            >
              [CIT-02]
            </button>
            . Concurrently, Kota SIU ANPR surveillance logged suspect arrival at the Chambal River Bridge toll plaza at 22:45 IST{' '}
            <button
              onClick={() => onOpenProvenance(citations[2].docId, citations[2].offset, citations[2].claim)}
              className="inline-flex items-center px-1.5 py-0.2 bg-[#F5C842] text-black font-black text-[11px] border border-black hover:bg-[#EAB308] mx-1 transition cursor-pointer"
            >
              [CIT-03]
            </button>
            .
          </p>
        </section>

        {/* Section 3: Physical Impossibility & Decoy Analysis */}
        <section className="space-y-2 relative border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wide text-red-700 flex items-center space-x-2">
              <span>3.0 PHYSICAL IMPOSSIBILITY &amp; DECOY HYPOTHESIS</span>
            </h3>
            <span className="bg-[#FEE2E2] text-red-800 border border-red-500 text-[10px] font-black px-2 py-0.5">
              ANOMALY CONFIRMED
            </span>
          </div>

          <div className="p-3 bg-[#FEE2E2] border-2 border-red-600 text-xs text-black font-sans leading-relaxed">
            <strong>CRITICAL ANOMALY:</strong> Distance between Mehrangarh Clock Tower (Jodhpur) and Chambal River Bridge (Kota) is ~390 km via NH-27. A 15-minute time difference indicates a calculated velocity of 1,560 km/h, which is physically impossible. This confirms either an active body-double decoy operative or spoofed license plate telemetry.
          </div>
        </section>

        {/* Section 4: Tactical Wiretap & Armed Escort */}
        <section className="space-y-2 relative border-t border-slate-200 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wide text-black flex items-center space-x-2">
              <span>4.0 TACTICAL WIRETAP &amp; ARMED ESCORT INTERCEPT</span>
            </h3>
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-600 text-[10px] font-black px-2 py-0.5 flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>VERIFIED FACT</span>
            </span>
          </div>

          <p className="text-xs text-slate-800 leading-relaxed font-sans font-medium">
            Radio wiretap audio intercepted at 01:15 IST by Kota Technical Unit revealed syndicate commander Devendra Sharma ordering the convoy to divert south toward Rawatbhata Highway safehouse{' '}
            <button
              onClick={() => onOpenProvenance(citations[3].docId, citations[3].offset, citations[3].claim)}
              className="inline-flex items-center px-1.5 py-0.2 bg-[#F5C842] text-black font-black text-[11px] border border-black hover:bg-[#EAB308] mx-1 transition cursor-pointer"
            >
              [CIT-04]
            </button>
            . Optical CCTV frame #04 confirmed brandishing of a Glock 19 sidearm inside the vehicle cabin at Nayapura Barrier checkpoint{' '}
            <button
              onClick={() => onOpenProvenance(citations[4].docId, citations[4].offset, citations[4].claim)}
              className="inline-flex items-center px-1.5 py-0.2 bg-[#F5C842] text-black font-black text-[11px] border border-black hover:bg-[#EAB308] mx-1 transition cursor-pointer"
            >
              [CIT-05]
            </button>
            .
          </p>
        </section>

        {/* Citation Registry Box */}
        <div className="border-t-2 border-black pt-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-black">
            <span>FULL CITATION REGISTRY (PROVENANCE REPOSITORY)</span>
            <span className="bg-black text-[#F5C842] px-1.5 py-0.2">{citations.length} ANCHORS</span>
          </div>

          <div className="space-y-2">
            {citations.map((cit) => (
              <div
                key={cit.id}
                className="p-3 bg-[#FBF9F5] border border-black flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2 font-black">
                    <span className="bg-[#F5C842] text-black px-1.5 py-0.2 border border-black">
                      [{cit.id}]
                    </span>
                    <span className="text-black">{cit.source}</span>
                    <span className="text-slate-600 font-mono text-[10px] font-bold">({cit.offset})</span>
                  </div>
                  <p className="text-[11px] text-slate-700 font-sans mt-0.5 font-medium">{cit.claim}</p>
                </div>

                <button
                  onClick={() => onOpenProvenance(cit.docId, cit.offset, cit.claim)}
                  className="px-3 py-1 bg-white hover:bg-slate-100 text-black font-black border border-black text-xs shrink-0 self-start sm:self-center shadow-xs"
                >
                  INSPECT PROOF →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
