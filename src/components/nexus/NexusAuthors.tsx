'use client';

import React, { useState } from 'react';
import { 
  UserCheck, 
  Shield, 
  BadgeCheck, 
  FileText, 
  Radio, 
  Key, 
  ExternalLink, 
  Lock, 
  Layers, 
  Search,
  Building,
  CheckCircle2,
  Clock,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Document } from '@/types/investigation';

interface NexusAuthorsProps {
  documents: Document[];
  onOpenProvenance: (docId: string, offset: string, snippet?: string) => void;
  onSelectTab: (tab: any) => void;
}

interface AuthorProfile {
  id: string;
  name: string;
  rank: string;
  agency: string;
  agencyKey: 'jodhpur' | 'kota' | 'joint';
  badgeNumber: string;
  clearanceLevel: string;
  clearanceColor: string;
  commsChannel: string;
  avatarIcon: string;
  bio: string;
  status: 'ACTIVE ON DUTY' | 'ON PATROL' | 'STATIONARY DESK';
  matchingUploadedBy: string[];
}

const AUTHOR_PROFILES: AuthorProfile[] = [
  {
    id: 'author-rajiv-rathore',
    name: 'Inspector S. Rathore',
    rank: 'Senior Crime Investigator',
    agency: 'Jodhpur Police Commissionerate (Crime Branch)',
    agencyKey: 'jodhpur',
    badgeNumber: 'RJ-JOD-CR-042',
    clearanceLevel: 'LEVEL 3 // SECRET',
    clearanceColor: 'bg-blue-100 text-blue-800 border-blue-600',
    commsChannel: 'VHF Channel 4 [JOD-HQ-DISPATCH]',
    avatarIcon: '👮‍♂️',
    bio: 'Lead field detective on Operation Marwar. Specializes in witness interrogation, syndicate courier interdiction, and Western Rajasthan contraband distribution routes.',
    status: 'ACTIVE ON DUTY',
    matchingUploadedBy: ['Inspector S. Rathore (Jodhpur PD)', 'Jodhpur Police Department (Unit Alpha)', 'Jodhpur Police (Field Unit)', 'Rajiv Rathore']
  },
  {
    id: 'author-vikram-meena',
    name: 'Inspector V. Meena',
    rank: 'Chief Intelligence Officer',
    agency: 'Kota Police CID (Special Intelligence Unit)',
    agencyKey: 'kota',
    badgeNumber: 'RJ-KTA-SIU-118',
    clearanceLevel: 'LEVEL 3 // SECRET',
    clearanceColor: 'bg-amber-100 text-amber-800 border-amber-600',
    commsChannel: 'UHF Channel 8 [KOTA-CID-OPS]',
    avatarIcon: '🕵️‍♂️',
    bio: 'Head of Kota SIU counter-contraband division. Manages automated ANPR sensor networks, bridge surveillance, and cross-district contraband interdiction on NH-27.',
    status: 'ACTIVE ON DUTY',
    matchingUploadedBy: ['Inspector V. Meena (Kota CID)', 'Kota Police Commissionerate (Unit Alpha)', 'Kota Police (Field Unit)', 'V. Meena']
  },
  {
    id: 'author-technical-intercept',
    name: 'Technical Intercept Unit (TIU)',
    rank: 'Signals & Cyber Recon Specialist',
    agency: 'Joint Cyber & Signals Intelligence Division (SIGINT)',
    agencyKey: 'joint',
    badgeNumber: 'SIGINT-RJ-09A',
    clearanceLevel: 'LEVEL 4 // STRICT EYES ONLY',
    clearanceColor: 'bg-purple-100 text-purple-800 border-purple-600',
    commsChannel: 'Secure Trunked Net 9A [ENCRYPTED BURST]',
    avatarIcon: '📡',
    bio: 'Electronic surveillance and voice biometrics unit. Operates listening posts across the Chambal ravines and border sectors, responsible for radio wiretap diarization.',
    status: 'ACTIVE ON DUTY',
    matchingUploadedBy: ['Kota Technical Intercept Unit', 'Technical Intercept Unit']
  },
  {
    id: 'author-highway-patrol',
    name: 'State Highway Patrol Unit 4',
    rank: 'Mobile Tactical Intercept Group',
    agency: 'Rajasthan State Highway Police (Bilara-Nayapura Sector)',
    agencyKey: 'jodhpur',
    badgeNumber: 'RJ-HWP-DIV4-2026',
    clearanceLevel: 'LEVEL 2 // CONFIDENTIAL',
    clearanceColor: 'bg-emerald-100 text-emerald-800 border-emerald-600',
    commsChannel: 'State Highway Intercept Net Alpha',
    avatarIcon: '🚔',
    bio: 'High-speed corridor interdiction group operating 24/7 along NH-25 and NH-27. Maintains automated high-resolution optical cameras at toll barriers.',
    status: 'ON PATROL',
    matchingUploadedBy: ['State Highway Patrol Unit 4', 'Highway Patrol']
  }
];

export const NexusAuthors: React.FC<NexusAuthorsProps> = ({
  documents,
  onOpenProvenance,
  onSelectTab
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAuthorId, setSelectedAuthorId] = useState<string>(AUTHOR_PROFILES[0].id);

  const selectedAuthor = AUTHOR_PROFILES.find((a) => a.id === selectedAuthorId) || AUTHOR_PROFILES[0];

  // Match documents to selected author
  const authorDocs = documents.filter((doc) => {
    return selectedAuthor.matchingUploadedBy.some((match) => 
      doc.uploaded_by?.toLowerCase().includes(match.toLowerCase())
    );
  });

  const filteredAuthors = AUTHOR_PROFILES.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.agency.toLowerCase().includes(q) ||
      a.badgeNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-4 lg:p-6 space-y-4 font-mono select-none text-black">
      {/* Top Black Tactical Banner */}
      <div className="bg-[#111111] text-white p-5 border-2 border-black shadow-brutal-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="bg-[#F5C842] text-black font-black text-[10px] px-2.5 py-0.5 uppercase tracking-wider">
              AUTHOR REGISTRY
            </span>
            <span className="text-slate-300 font-bold text-xs uppercase tracking-wider">
              CASE #16 DEPOSITORS // CHAIN OF CUSTODY LOGS
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-white">
            EVIDENCE AUTHORS &amp; INVESTIGATIVE OFFICERS
          </h1>
        </div>

        <div className="flex items-center space-x-3 text-xs border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              VERIFIED CUSTODIANS
            </span>
            <span className="text-[#F5C842] font-black text-sm block mt-0.5">
              4 ACTIVE OFFICERS
            </span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split: Author Directory on Left (4 cols), Detailed Dossier on Right (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Author Cards List (4 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {/* Search Box */}
          <div className="bg-white border-2 border-black p-3 shadow-brutal flex items-center space-x-2">
            <Search className="w-4 h-4 text-slate-600 shrink-0" />
            <input
              type="text"
              placeholder="FILTER AUTHORS BY NAME, BADGE, UNIT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-black text-xs font-bold w-full outline-none font-sans"
            />
          </div>

          {/* List of Authors */}
          <div className="space-y-2.5">
            {filteredAuthors.map((author) => {
              const isSelected = author.id === selectedAuthor.id;
              const docCount = documents.filter((doc) => 
                author.matchingUploadedBy.some((m) => doc.uploaded_by?.toLowerCase().includes(m.toLowerCase()))
              ).length;

              return (
                <div
                  key={author.id}
                  onClick={() => setSelectedAuthorId(author.id)}
                  className={`border-2 border-black p-4 cursor-pointer transition-all shadow-brutal ${
                    isSelected
                      ? 'bg-[#F5C842] border-black text-black ring-2 ring-black'
                      : 'bg-white hover:bg-[#FBF9F5]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 border-2 border-black bg-white flex items-center justify-center text-xl shadow-xs">
                        {author.avatarIcon}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-black uppercase text-black">
                            {author.name}
                          </h3>
                        </div>
                        <p className="text-[11px] font-bold text-slate-700">
                          {author.rank}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-black px-2 py-0.5 border border-black bg-black text-white">
                      {author.badgeNumber}
                    </span>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-black/20 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-800 truncate max-w-[200px]">
                      {author.agency}
                    </span>
                    <span className="bg-white text-black font-black px-2 py-0.5 border border-black text-[10px]">
                      {docCount} {docCount === 1 ? 'FILE' : 'FILES'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Author Full Dossier (7 cols) */}
        <div className="lg:col-span-7 bg-white border-2 border-black p-5 shadow-brutal space-y-4">
          {/* Header of Selected Author */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-14 h-14 border-2 border-black bg-[#FBF9F5] flex items-center justify-center text-3xl shadow-brutal">
                {selectedAuthor.avatarIcon}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-black uppercase text-black">
                    {selectedAuthor.name}
                  </h2>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <p className="text-xs font-black text-slate-700 uppercase">
                  {selectedAuthor.rank} • {selectedAuthor.agency}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-black px-2.5 py-1 border ${selectedAuthor.clearanceColor}`}>
                {selectedAuthor.clearanceLevel}
              </span>
              <span className="text-[10px] font-black px-2 py-1 bg-black text-[#F5C842] border border-black">
                {selectedAuthor.status}
              </span>
            </div>
          </div>

          {/* Credentials Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-[#FBF9F5] border border-black space-y-1">
              <span className="text-[10px] font-bold text-slate-600 uppercase block">BADGE / REGISTRATION</span>
              <span className="font-black text-black">{selectedAuthor.badgeNumber}</span>
            </div>
            <div className="p-3 bg-[#FBF9F5] border border-black space-y-1">
              <span className="text-[10px] font-bold text-slate-600 uppercase block">COMMS FREQUENCY</span>
              <span className="font-black text-black">{selectedAuthor.commsChannel}</span>
            </div>
          </div>

          {/* Bio / Background */}
          <div className="p-3.5 bg-[#FBF9F5] border-2 border-black space-y-1.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-black flex items-center space-x-1.5">
              <BadgeCheck className="w-4 h-4 text-black" />
              <span>INVESTIGATOR PROFILE &amp; SPECIALIZATION</span>
            </h4>
            <p className="text-xs text-slate-800 font-sans leading-relaxed">
              {selectedAuthor.bio}
            </p>
          </div>

          {/* Chain of Custody / Submitted Evidence Files */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-black" />
                <h3 className="text-xs font-black uppercase tracking-wider text-black">
                  SUBMITTED EVIDENCE VAULT ASSETS ({authorDocs.length})
                </h3>
              </div>
              <button
                onClick={() => onSelectTab('vault')}
                className="text-[10px] font-black text-blue-700 hover:underline flex items-center space-x-1"
              >
                <span>OPEN IN VAULT</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {authorDocs.length === 0 ? (
              <div className="p-4 bg-[#FBF9F5] border border-black text-center text-xs text-slate-600">
                No matching evidence documents registered yet under this officer profile.
              </div>
            ) : (
              <div className="space-y-2">
                {authorDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-3 border-2 border-black bg-[#FBF9F5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-black text-[#F5C842] text-[10px] font-black uppercase border border-black">
                          {doc.file_type}
                        </span>
                        <h4 className="text-xs font-black text-black">
                          {doc.title}
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 line-clamp-1 font-sans">
                        {doc.content_text?.slice(0, 100)}…
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => onOpenProvenance(doc.id, '00:00:00', doc.content_text?.slice(0, 80))}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-black border border-black text-[11px] font-bold flex items-center space-x-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>INSPECT</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
