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
import { AddNewCaseModal } from './AddNewCaseModal';
import { ConnectionRequestModal } from './ConnectionRequestModal';
import { ConnectionRequestsPanel } from './ConnectionRequestsPanel';
import { AgencySlug } from '@/types/investigation';

interface NexusShellProps {
  initialTab?: NexusNavTab;
  scopedAgency?: AgencySlug;
}

export const NexusShell: React.FC<NexusShellProps> = ({
  initialTab = 'overview',
  scopedAgency = 'jodhpur',
}) => {
  const [currentTab, setCurrentTab] = useState<NexusNavTab>(initialTab);
  const [isAddCaseOpen, setIsAddCaseOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [connectTargetAgency, setConnectTargetAgency] = useState<AgencySlug | undefined>(undefined);
  const [isRequestsPanelOpen, setIsRequestsPanelOpen] = useState(false);

  const {
    documents,
    entities,
    relationships,
    contradictions,
    events,
    activeCaseName,
    activeCaseFilingAgency,
    connectionRequests,
    pendingIncomingRequests,
    acceptedLinkedAgencies,
    canAgencyViewCase,
    agencies,
    isProcessing,
    processingStatusText,
    provenanceFocus,
    setProvenanceFocus,
    setActiveAgency,
    updateRelationshipStatus,
    updateContradictionStatus,
    clearAllCaseData,
    highPriorityAlert,
    dismissHighPriorityAlert,
  } = useInvestigation();

  // Set portal-scoped active agency on mount
  React.useEffect(() => {
    setActiveAgency(scopedAgency);
  }, [scopedAgency, setActiveAgency]);

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
  const pendingCount = pendingIncomingRequests.length;

  const currentProvenanceDoc = provenanceFocus
    ? documents.find((d) => d.id === provenanceFocus.documentId) || null
    : null;

  // Access control: what this portal can see
  const canView = canAgencyViewCase(scopedAgency);
  const visibleDocs = canView ? documents : [];
  const visibleEntities = canView ? entities : [];
  const visibleEvents = canView ? events : [];
  const visibleRelationships = canView ? relationships : [];
  const visibleContradictions = canView ? contradictions : [];

  // Check if this portal has a pending transmission awaiting acceptance
  const pendingOutgoingReq = connectionRequests.find(
    (r) =>
      r.status === 'pending' &&
      r.requesting_agency_slug === scopedAgency
  );
  const hasPendingRequest = !canView && !!pendingOutgoingReq;

  // Check if a connection request is already pending or accepted for this portal → case
  const hasExistingRequest =
    connectionRequests.some(
      (r) =>
        r.requesting_agency_slug === scopedAgency &&
        (!activeCaseName || r.case_name === activeCaseName || r.case_id === activeCaseName)
    ) || !!pendingOutgoingReq;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#EFECE6] text-[#111111] font-mono selection:bg-[#F5C842] selection:text-black">
      {/* 1. Full-Width Top Header */}
      <NexusHeader
        currentTab={currentTab}
        scopedAgency={scopedAgency}
        onOpenUpload={() => setIsAddCaseOpen(true)}
        onOpenConnect={(targetCity) => {
          setConnectTargetAgency(targetCity);
          setIsConnectOpen(true);
        }}
        onResetCase={clearAllCaseData}
        onSelectTab={setCurrentTab}
        isProcessing={isProcessing}
        processingText={processingStatusText}
        hasActiveCase={documents.length > 0}
        hasExistingConnectionRequest={hasExistingRequest}
        acceptedLinkedAgencies={acceptedLinkedAgencies}
        activeCaseName={activeCaseName}
      />

      {/* HIGH PRIORITY ALERT BANNER — fires on market.jpeg upload, visible on both portals */}
      {highPriorityAlert && (
        <div
          style={{
            background: 'linear-gradient(90deg, #7f1d1d 0%, #991b1b 40%, #7f1d1d 100%)',
            borderBottom: '2px solid #ef4444',
            animation: 'pulse 1.5s ease-in-out infinite',
            zIndex: 9999,
          }}
          className="flex items-center justify-between px-4 py-2 text-white font-mono text-sm relative"
        >
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.85}}`}</style>
          <div className="flex items-center gap-3">
            <span className="text-lg animate-bounce">🚨</span>
            <div>
              <div className="font-bold tracking-widest text-red-200 text-xs uppercase">HIGH PRIORITY ALERT — BOTH PORTALS</div>
              <div className="text-white font-semibold">{highPriorityAlert.message}</div>
              <div className="text-red-300 text-xs mt-0.5">
                📍 {highPriorityAlert.location} &nbsp;·&nbsp; ⏱ {new Date(highPriorityAlert.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST
              </div>
            </div>
          </div>
          <button
            onClick={dismissHighPriorityAlert}
            className="ml-4 px-3 py-1 text-xs font-bold bg-red-900 hover:bg-red-800 border border-red-500 rounded transition-colors"
            title="Dismiss alert"
          >
            DISMISS
          </button>
        </div>
      )}

      {/* 2. Main Workspace Body */}
      <div className="flex-1 flex flex-row min-h-0 w-full overflow-hidden">
        {/* Left Sidebar */}
        <NexusSidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          scopedAgency={scopedAgency}
          stats={{
            documentsCount: visibleDocs.length,
            entitiesCount: visibleEntities.length,
            flaggedContradictionsCount: flaggedCount,
            suggestedCount: suggestedCount,
            pendingRequestsCount: pendingCount,
          }}
          onOpenRequestsPanel={() => setIsRequestsPanelOpen(true)}
        />

        {/* Dynamic Canvas Workspace */}
        <main className="flex-1 min-w-0 h-full overflow-y-auto bg-[#EFECE6] relative">
          {currentTab === 'overview' && (
            <NexusOverview
              documents={visibleDocs}
              entities={visibleEntities}
              relationships={visibleRelationships}
              contradictions={visibleContradictions}
              events={visibleEvents}
              scopedAgency={scopedAgency}
              acceptedLinkedAgencies={acceptedLinkedAgencies}
              activeCaseName={activeCaseName}
              activeCaseFilingAgency={activeCaseFilingAgency}
              hasPendingRequest={hasPendingRequest}
              pendingRequestDetails={
                pendingOutgoingReq
                  ? {
                      targetAgencyName:
                        agencies[pendingOutgoingReq.target_agency_slug]?.name || 'Jodhpur Police HQ',
                      caseName: pendingOutgoingReq.case_name,
                      createdAt: pendingOutgoingReq.created_at,
                      briefSnapshot: pendingOutgoingReq.case_brief_snapshot,
                    }
                  : null
              }
              onOpenUpload={() => setIsAddCaseOpen(true)}
              onOpenConnect={() => setIsConnectOpen(true)}
              onOpenRequestsPanel={() => setIsRequestsPanelOpen(true)}
              onSelectTab={setCurrentTab}
              onConfirmRelationship={(id) => updateRelationshipStatus(id, 'confirmed')}
              onDismissRelationship={(id) => updateRelationshipStatus(id, 'dismissed')}
              onOpenProvenance={handleOpenProvenance}
            />
          )}

          {currentTab === 'vault' && (
            <NexusVault
              documents={visibleDocs}
              entities={visibleEntities}
              onOpenUpload={() => setIsAddCaseOpen(true)}
              onOpenProvenance={handleOpenProvenance}
            />
          )}

          {currentTab === 'graph' && (
            <div className="h-full w-full min-h-[calc(100vh-60px)]">
              <NexusGraph
                onOpenProvenance={handleOpenProvenance}
                onOpenUpload={() => setIsAddCaseOpen(true)}
                onSelectTab={setCurrentTab}
              />
            </div>
          )}

          {currentTab === 'contradictions' && (
            <NexusContradictions
              contradictions={visibleContradictions}
              events={visibleEvents}
              documents={visibleDocs}
              onResolveContradiction={(id, status) => updateContradictionStatus(id, status)}
              onOpenProvenance={handleOpenProvenance}
            />
          )}

          {currentTab === 'timeline' && (
            <NexusTimelineMap
              events={visibleEvents}
              onOpenProvenance={handleOpenProvenance}
            />
          )}

          {currentTab === 'authors' && (
            <NexusAuthors
              documents={visibleDocs}
              onOpenProvenance={handleOpenProvenance}
              onSelectTab={setCurrentTab}
            />
          )}

          {currentTab === 'dossier' && (
            <NexusDossier
              documents={visibleDocs}
              onOpenProvenance={handleOpenProvenance}
            />
          )}
        </main>

        {/* Provenance Inspector — inline right drawer */}
        {provenanceFocus && currentProvenanceDoc && (
          <NexusProvenanceInspector
            document={currentProvenanceDoc}
            sourceOffset={provenanceFocus.sourceOffset}
            snippet={provenanceFocus.snippet}
            onClose={() => setProvenanceFocus(null)}
          />
        )}
      </div>

      {/* Modals — rendered via portals, only one at a time */}
      {isAddCaseOpen && (
        <AddNewCaseModal
          onClose={() => setIsAddCaseOpen(false)}
          filingAgency={scopedAgency}
          isAddingEvidence={documents.length > 0}
        />
      )}

      {isConnectOpen && documents.length > 0 && (
        <ConnectionRequestModal
          onClose={() => setIsConnectOpen(false)}
          requestingAgency={scopedAgency}
          caseId={documents[0]?.case_id ?? ''}
          caseName={activeCaseName ?? 'Active Case'}
          documents={documents}
          targetAgency={connectTargetAgency}
        />
      )}

      {isRequestsPanelOpen && (
        <ConnectionRequestsPanel
          onClose={() => setIsRequestsPanelOpen(false)}
          currentPortalAgency={scopedAgency}
        />
      )}
    </div>
  );
};
