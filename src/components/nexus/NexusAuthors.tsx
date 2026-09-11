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
  FolderArchive
} from 'lucide-react';
import { Document } from '@/types/investigation';
import { formatTimeIST } from '@/lib/utils/formatDate';

interface NexusAuthorsProps {
  documents: Document[];
  onOpenProvenance: (docId: string, offset: string, snippet?: string) => void;
  onSelectTab: (tab: any) => void;
}

export const NexusAuthors: React.FC<NexusAuthorsProps> = ({
  documents,
  onOpenProvenance,
  onSelectTab
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Extract unique authors from actual documents
  const authorNames = Array.from(
    new Set(documents.map((d) => d.uploaded_by || 'Unknown Depositor'))
  );

  const authors = authorNames.map((name, idx) => {
    const authorDocs = documents.filter((d) => (d.uploaded_by || 'Unknown Depositor') === name);
    const agencySlug = authorDocs[0]?.agency_id || 'joint';
    return {
      id: `author-${idx}`,
      name,
      agency: agencySlug.includes('jod') ? 'Jodhpur Police Department' : agencySlug.includes('kota') ? 'Kota Police Commissionerate' : 'Joint Operational Command',
      badgeNumber: `RJ-CUSTODY-${String(idx + 1).padStart(3, '0')}`,
      docs: authorDocs,
      modalities: Array.from(new Set(authorDocs.map((d) => d.file_type))),
      lastDeposit: authorDocs[authorDocs.length - 1]?.uploaded_at || new Date().toISOString()
    };
  });

  const [selectedAuthorId, setSelectedAuthorId] = useState<string>(authors[0]?.id || '');
  const selectedAuthor = authors.find((a) => a.id === selectedAuthorId) || authors[0];

  const filteredAuthors = authors.filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.agency.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.badgeNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6 space-y-4 font-mono select-none text-black">
      {/* Top Banner */}
      <div className="bg-[#111111] text-white p-5 border-2 border-black shadow-brutal-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="bg-[#F5C842] text-black font-black text-[10px] px-2.5 py-0.5 uppercase tracking-wider">
              AUTHOR REGISTRY
            </span>
            <span className="text-slate-300 font-bold text-xs uppercase tracking-wider">
              CASE EVIDENCE DEPOSITORS &amp; CHAIN OF CUSTODY
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-white">
            EVIDENCE AUTHORS &amp; INVESTIGATIVE OFFICERS
          </h1>
        </div>

        <div className="flex items-center space-x-3 text-xs border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              LOGGED DEPOSITORS
            </span>
            <span className="text-[#F5C842] font-black text-sm block mt-0.5">
              {authors.length} ACTIVE CUSTODIANS
            </span>
          </div>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="bg-white border-2 border-black p-12 text-center shadow-brutal space-y-4">
          <UserCheck className="w-12 h-12 text-slate-400 mx-auto" />
          <h4 className="text-base font-black uppercase text-black">NO EVIDENCE CUSTODIANS LOGGED</h4>
          <p className="text-xs text-slate-600 font-sans max-w-md mx-auto leading-relaxed">
            Custody and depositor credentials are automatically indexed as evidence files are uploaded. Ingest new evidence to populate the author directory and custody logs.
          </p>
        </div>
      ) : (
        /* Main 2-Column Split */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Author Cards List (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="bg-white border-2 border-black p-3 shadow-brutal flex items-center space-x-2">
              <Search className="w-4 h-4 text-slate-600 shrink-0" />
              <input
                type="text"
                placeholder="FILTER AUTHORS BY NAME, BADGE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-black text-xs font-bold w-full outline-none font-sans"
              />
            </div>

            <div className="space-y-2.5">
              {filteredAuthors.map((author) => {
                const isSelected = author.id === selectedAuthor?.id;
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
                      <div>
                        <div className="flex items-center space-x-1.5 mb-1">
                          <span className="text-[10px] font-black uppercase px-1.5 py-0.5 bg-black text-white">
                            {author.badgeNumber}
                          </span>
                        </div>
                        <h3 className="text-sm font-black uppercase text-black leading-tight">
                          {author.name}
                        </h3>
                        <p className="text-xs text-slate-700 font-bold mt-0.5">
                          {author.agency}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="bg-black text-[#F5C842] font-black text-xs px-2 py-0.5 border border-black">
                          {author.docs.length} ITEM{author.docs.length !== 1 ? 'S' : ''}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-black/20 flex items-center justify-between text-[11px] font-bold">
                      <span className="uppercase text-slate-700">MODALITIES: {author.modalities.join(', ')}</span>
                      <span className="text-slate-900">VIEW LOGS →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Author Dossier (7 cols) */}
          <div className="lg:col-span-7">
            {selectedAuthor && (
              <div className="bg-white border-2 border-black p-5 shadow-brutal-lg space-y-4">
                <div className="border-b-2 border-black pb-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-black text-white text-[10px] font-black px-2 py-0.5 uppercase">
                      OFFICER CREDENTIAL DOSSIER
                    </span>
                    <span className="text-xs font-mono text-slate-600 font-bold">
                      {selectedAuthor.badgeNumber}
                    </span>
                  </div>
                  <h2 className="text-xl font-black uppercase text-black mt-2">
                    {selectedAuthor.name}
                  </h2>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">
                    {selectedAuthor.agency}
                  </p>
                </div>

                {/* Deposited Evidence Items */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-black">
                    DEPOSITED CASE EVIDENCE ({selectedAuthor.docs.length})
                  </h4>

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {selectedAuthor.docs.map((doc) => (
                      <div key={doc.id} className="p-3 bg-[#FBF9F5] border border-black space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase text-black">
                            {doc.title}
                          </span>
                          <span className="text-[10px] font-mono uppercase bg-black text-[#F5C842] px-1.5 py-0.2">
                            {doc.file_type}
                          </span>
                        </div>
                        <p className="text-xs font-sans text-slate-700 line-clamp-2">
                          {doc.content_text || '[Raw file binary attached]'}
                        </p>
                        <div className="pt-1 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-mono">
                            {formatTimeIST(doc.uploaded_at, false)}
                          </span>
                          <button
                            onClick={() => onOpenProvenance(doc.id, 'Custody', doc.content_text?.slice(0, 150))}
                            className="text-blue-700 hover:underline font-black"
                          >
                            Inspect Provenance →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
