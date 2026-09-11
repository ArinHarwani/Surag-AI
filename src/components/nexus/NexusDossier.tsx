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
    <div className="space-y-6 font-mono select-none">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between bg-[#111318] p-4 rounded-lg border border-[#232731]">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-[#F4C430]" />
            <h2 className="text-base font-black uppercase tracking-wider text-white">
              INTELLIGENCE BRIEFING &amp; CITATION REGISTRY
            </h2>
          </div>
          <p className="text-xs text-slate-200 mt-1">
            Evidence-grounded synthesis with verified source document line offsets.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-[#1C202A] hover:bg-[#252A38] text-slate-200 border border-[#2E3444] rounded flex items-center space-x-1.5 transition font-bold"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT DOSSIER</span>
          </button>
          <button
            onClick={() => {
              const text = `CLASSIFIED INTELLIGENCE BRIEF // OPERATION MARWAR\nCASE: AARAV SINGH\nTLP:AMBER RESTRICTED\n\n1. EXECUTIVE SUMMARY & TACTICAL OVERVIEW [CIT-01]...`;
              const blob = new Blob([text], { type: 'text/markdown' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `OPERATION-MARWAR-DOSSIER-${Date.now()}.md`;
              a.click();
            }}
            className="px-3 py-1.5 bg-[#F4C430] hover:bg-[#EAB308] text-black font-black rounded flex items-center space-x-1.5 shadow-md shadow-[#F4C430]/20 transition"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>EXPORT MD</span>
          </button>
        </div>
      </div>

      {/* Main Document / Report Layout */}
      <div className="bg-[#EDE9E0] border border-slate-300 rounded-lg p-8 text-slate-950 shadow-md space-y-8 max-w-4xl mx-auto">
        {/* Document Header Header Block */}
        <div className="border-b-2 border-slate-950 pb-4 flex items-start justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#B45309] bg-[#F4C430]/20 px-2 py-0.5 rounded border border-[#F4C430]/60">
              TLP:AMBER // LAW ENFORCEMENT SENSITIVE
            </span>
            <h1 className="text-xl font-black uppercase tracking-tight mt-2">
              INTELLIGENCE BRIEFING: OPERATION MARWAR (AARAV SINGH)
            </h1>
            <p className="text-xs font-bold text-slate-700 mt-0.5">
              JOINT INVESTIGATIVE SYNTHESIS // JODHPUR DISTRICT POLICE &amp; KOTA POLICE COMMISSIONERATE
            </p>
          </div>

          <div className="text-right text-[10px] font-mono text-slate-600">
            <p>REF: JOD-KOTA-FUSION-2026-99</p>
            <p>DATE: 11-SEPT-2026 18:00 IST</p>
            <p className="text-emerald-800 font-bold">CUSTODY CHAIN: VERIFIED</p>
          </div>
        </div>

        {/* Section 1: Executive Summary & Tactical Overview */}
        <section className="space-y-2 relative">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center space-x-2">
              <span className="w-5 h-5 rounded bg-slate-950 text-white flex items-center justify-center text-xs">1</span>
              <span>EXECUTIVE SUMMARY &amp; TACTICAL OVERVIEW</span>
            </h2>
            <span className="text-[9px] font-bold bg-emerald-800 text-white px-2 py-0.5 rounded uppercase tracking-wider">
              VERIFIED FACT
            </span>
          </div>

          <p className="text-xs font-sans text-slate-800 leading-relaxed">
            Multi-agency signals analysis firmly establishes that prime subject <strong>Aarav Singh</strong> has coordinated logistics across western and southeastern Rajasthan corridor. Primary assets under his operational command include a <strong>White Scorpio (RJ-19-UB-4022)</strong>{' '}
            <button
              onClick={() => onOpenProvenance('doc-jod-witness-01', 'Line 1-4', citations[0].claim)}
              className="inline-flex items-center px-1.5 py-0.2 rounded bg-[#F4C430] text-black font-mono font-black text-[10px] hover:bg-black hover:text-[#F4C430] transition mx-1 shadow-xs"
            >
              [CIT-01]
            </button>
            , which was recorded traversing the Bilara Toll Plaza along NH-25 eastbound toward Kota.
          </p>
        </section>

        {/* Section 2: Suspect & Fleet Syndicate Breakdown */}
        <section className="space-y-2 relative">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center space-x-2">
              <span className="w-5 h-5 rounded bg-slate-950 text-white flex items-center justify-center text-xs">2</span>
              <span>SUSPECT &amp; FLEET SYNDICATE BREAKDOWN</span>
            </h2>
            <span className="text-[9px] font-bold bg-emerald-800 text-white px-2 py-0.5 rounded uppercase tracking-wider">
              VERIFIED FACT
            </span>
          </div>

          <p className="text-xs font-sans text-slate-800 leading-relaxed">
            Witness accounts at Jodhpur indicate that at 22:30 IST, suspect Aarav Singh met an unidentified contact near the Mehrangarh Clock Tower, executing a physical transfer of encrypted military-grade hardware{' '}
            <button
              onClick={() => onOpenProvenance('doc-jod-witness-01', 'Line 5-8', citations[1].claim)}
              className="inline-flex items-center px-1.5 py-0.2 rounded bg-[#F4C430] text-black font-mono font-black text-[10px] hover:bg-black hover:text-[#F4C430] transition mx-1 shadow-xs"
            >
              [CIT-02]
            </button>
            . The courier accepted the hardware and subsequently withdrew through the old city gates.
          </p>
        </section>

        {/* Section 3: Spatiotemporal Anomaly & Decoy Deployment */}
        <section className="space-y-2 relative">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center space-x-2">
              <span className="w-5 h-5 rounded bg-slate-950 text-white flex items-center justify-center text-xs">3</span>
              <span>SPATIOTEMPORAL ANOMALY &amp; DECOY DEPLOYMENT</span>
            </h2>
            <span className="text-[9px] font-bold bg-red-700 text-white px-2 py-0.5 rounded uppercase tracking-wider">
              CRITICAL CONTRADICTION
            </span>
          </div>

          <p className="text-xs font-sans text-slate-800 leading-relaxed">
            A severe spatiotemporal collision was uncovered: exactly 15 minutes after the Mehrangarh sighting in Jodhpur, automated ANPR camera #09 at Chambal River Bridge in Kota recorded Aarav Singh exiting a <strong>Silver Bolero (RJ-20-CA-8812)</strong>{' '}
            <button
              onClick={() => onOpenProvenance('doc-kota-cctv-02', 'Line 5-8', citations[2].claim)}
              className="inline-flex items-center px-1.5 py-0.2 rounded bg-[#F4C430] text-black font-mono font-black text-[10px] hover:bg-black hover:text-[#F4C430] transition mx-1 shadow-xs"
            >
              [CIT-03]
            </button>
            . As the ground distance between Jodhpur and Kota is approximately 390 km via NH-27, traversing this span in 15 minutes requires an impossible transit speed exceeding 1,560 km/h. Forensic intelligence indicates intentional decoy deployment or cloned registration plates.
          </p>
        </section>

        {/* Section 4: Intercepted Communications & Interdiction Window */}
        <section className="space-y-2 relative">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center space-x-2">
              <span className="w-5 h-5 rounded bg-slate-950 text-white flex items-center justify-center text-xs">4</span>
              <span>INTERCEPTED COMMUNICATIONS &amp; ARMED ESCORT</span>
            </h2>
            <span className="text-[9px] font-bold bg-emerald-800 text-white px-2 py-0.5 rounded uppercase tracking-wider">
              VERIFIED FACT
            </span>
          </div>

          <p className="text-xs font-sans text-slate-800 leading-relaxed">
            Tactical radio wiretaps intercepted communications from armed coordinator <strong>Devendra Sharma</strong> instructing the convoy to divert south toward the Rawatbhata Highway safehouse{' '}
            <button
              onClick={() => onOpenProvenance('doc-wiretap-audio-03', '00:02:14', citations[3].claim)}
              className="inline-flex items-center px-1.5 py-0.2 rounded bg-[#F4C430] text-black font-mono font-black text-[10px] hover:bg-black hover:text-[#F4C430] transition mx-1 shadow-xs"
            >
              [CIT-04]
            </button>
            . Optical cameras at Nayapura toll barrier subsequently confirmed Devendra Sharma brandishing a Glock 19 sidearm in the passenger cabin{' '}
            <button
              onClick={() => onOpenProvenance('doc-cctv-optical-04', 'bbox [120,450,280,620]', citations[4].claim)}
              className="inline-flex items-center px-1.5 py-0.2 rounded bg-[#F4C430] text-black font-mono font-black text-[10px] hover:bg-black hover:text-[#F4C430] transition mx-1 shadow-xs"
            >
              [CIT-05]
            </button>
            .
          </p>
        </section>

        {/* Citation Index Table */}
        <div className="pt-4 border-t border-slate-400/60">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-2">
            GROUNDED CITATIONS REGISTRY
          </h3>
          <div className="grid grid-cols-1 gap-1.5 text-[11px]">
            {citations.map((c) => (
              <div
                key={c.id}
                onClick={() => onOpenProvenance(c.docId, c.offset, c.claim)}
                className="p-2 bg-white rounded border border-slate-300 hover:border-slate-800 cursor-pointer flex items-center justify-between group transition"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-black text-[10px] bg-[#F4C430] text-black px-1.5 py-0.2 rounded">
                    [{c.id}]
                  </span>
                  <span className="text-slate-800 font-sans truncate max-w-lg">{c.claim}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono group-hover:underline">
                  OFFSET: {c.offset} →
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
