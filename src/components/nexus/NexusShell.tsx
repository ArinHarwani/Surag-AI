'use client';

import React, { useState } from 'react';
import { useInvestigation } from '@/lib/store/investigation-context';
import { NexusSidebar, NexusNavTab } from './NexusSidebar';
import { NexusHeader } from './NexusHeader';
import { NexusOverview } from './NexusOverview';
import { NexusVault } from './NexusVault';
import { NexusGraph } from './NexusGraph';
import { NexusContradictions } from './NexusContradictions';
import { NexusTimelineMap } from './NexusTimelineMap';
import { NexusDossier } from './NexusDossier';
import { NexusAuthors } from './NexusAuthors';
import { NexusProvenanceInspector } from './NexusProvenanceInspector';
import { EvidenceDropzone } from '@/components/vault/EvidenceDropzone';

interface NexusShellProps {
  initialTab?: NexusNavTab;
  scopedAgency?: 'all' | 'jodhpur' | 'kota';
}

export const NexusShell: React.FC<NexusShellProps> = ({
  initialTab = 'overview',
  scopedAgency,
}) => {
  const [currentTab, setCurrentTab] = useState<NexusNavTab>(initialTab);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const {
    caseInfo,
    documents,
    entities,
    relationships,
    contradictions,
    events,
    activeAgency,
    setActiveAgency,
    isProcessing,
    processingStatusText,
    provenanceFocus,
    setProvenanceFocus,
    updateRelationshipStatus,
    updateContradictionStatus,
    resetToDefaultCase,
  } = useInvestigation();

  // If page scopes to an agency (e.g. /jodhpur or /kota)
  React.useEffect(() => {
    if (scopedAgency && scopedAgency !== activeAgency) {
      setActiveAgency(scopedAgency);
    }
  }, [scopedAgency, activeAgency, setActiveAgency]);

  // Provenance helper
  const handleOpenProvenance = (docId: string, offset: string, snippet?: string) => {
    const doc = documents.find((d) => d.id === docId);
    setProvenanceFocus({
      documentId: docId,
      sourceOffset: offset,
      snippet: snippet || doc?.content_text?.slice(0, 250),
      title: doc?.title,
      mediaType: doc?.file_type,
    });
  };

  const flaggedCount = contradictions.filter((c) => c.status === 'flagged').length;
  const suggestedCount = relationships.filter((r) => r.status === 'ai_suggested').length;

  const currentProvenanceDoc = provenanceFocus
    ? documents.find((d) => d.id === provenanceFocus.documentId) || null
    : null;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#EFECE6] text-[#111111] font-mono selection:bg-[#F5C842] selection:text-black">
      {/* 1. Fixed Left Sidebar */}
      <NexusSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        stats={{
          documentsCount: documents.length,
          entitiesCount: entities.length,
          flaggedContradictionsCount: flaggedCount,
          suggestedCount: suggestedCount,
        }}
      />

      {/* 2. Main Center Body */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header */}
        <NexusHeader
          currentTab={currentTab}
          activeAgency={activeAgency}
          onSelectAgency={setActiveAgency}
          onOpenUpload={() => setIsUploadOpen(true)}
          onResetCase={resetToDefaultCase}
          onSelectTab={setCurrentTab}
          isProcessing={isProcessing}
          processingText={processingStatusText}
        />

        {/* Dynamic Canvas Workspace */}
        <main className="flex-1 overflow-y-auto bg-[#EFECE6] relative">
          {currentTab === 'overview' && (
            <NexusOverview
              documents={documents}
              entities={entities}
              relationships={relationships}
              contradictions={contradictions}
              events={events}
              onOpenUpload={() => setIsUploadOpen(true)}
              onSelectTab={setCurrentTab}
              onConfirmRelationship={(id) => updateRelationshipStatus(id, 'confirmed')}
              onDismissRelationship={(id) => updateRelationshipStatus(id, 'dismissed')}
              onOpenProvenance={handleOpenProvenance}
            />
          )}

          {currentTab === 'vault' && (
            <NexusVault
              documents={documents}
              entities={entities}
              onOpenUpload={() => setIsUploadOpen(true)}
              onOpenProvenance={handleOpenProvenance}
            />
          )}

          {currentTab === 'graph' && (
            <div className="h-full w-full min-h-[calc(100vh-60px)]">
              <NexusGraph
                onOpenProvenance={handleOpenProvenance}
                onOpenUpload={() => setIsUploadOpen(true)}
                onSelectTab={setCurrentTab}
              />
            </div>
          )}

          {currentTab === 'contradictions' && (
            <NexusContradictions
              contradictions={contradictions}
              events={events}
              documents={documents}
              onResolveContradiction={(id, status) => updateContradictionStatus(id, status)}
              onOpenProvenance={handleOpenProvenance}
            />
          )}

          {currentTab === 'timeline' && (
            <NexusTimelineMap
              events={events}
              onOpenProvenance={handleOpenProvenance}
            />
          )}

          {currentTab === 'authors' && (
            <NexusAuthors
              documents={documents}
              onOpenProvenance={handleOpenProvenance}
              onSelectTab={setCurrentTab}
            />
          )}

          {currentTab === 'dossier' && (
            <NexusDossier
              documents={documents}
              onOpenProvenance={handleOpenProvenance}
            />
          )}
        </main>
      </div>

      {/* 3. Universal Provenance Inspector Drawer */}
      {provenanceFocus && currentProvenanceDoc && (
        <NexusProvenanceInspector
          document={currentProvenanceDoc}
          sourceOffset={provenanceFocus.sourceOffset}
          snippet={provenanceFocus.snippet}
          onClose={() => setProvenanceFocus(null)}
        />
      )}

      {/* 4. Evidence Ingestion Modal (Neo-brutalist Light Theme) */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl bg-white border-2 border-black shadow-brutal-lg p-0">
            <EvidenceDropzone
              onClose={() => setIsUploadOpen(false)}
              defaultAgencySlug={activeAgency === 'all' ? 'jodhpur' : activeAgency}
            />
          </div>
        </div>
      )}
    </div>
  );
};
