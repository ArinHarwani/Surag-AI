'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Case,
  Agency,
  Document,
  Entity,
  Event,
  Relationship,
  Contradiction,
  RelationshipStatus,
  ContradictionStatus,
} from '@/types/investigation';
import {
  INITIAL_CASE,
  AGENCIES,
  INITIAL_DOCUMENTS,
  INITIAL_ENTITIES,
  INITIAL_EVENTS,
  INITIAL_RELATIONSHIPS,
  INITIAL_CONTRADICTIONS,
} from '@/lib/data/initial-case-data';
import { realtimeRelay } from '@/lib/supabase/client';
import { extractDocumentIntelligence, explainContradiction } from '@/lib/ai/pipeline';
import { findCandidateContradictions } from '@/lib/ai/deterministic-detector';

export interface TransmissionAlert {
  id: string;
  fromAgency: 'jodhpur' | 'kota';
  toAgency: 'jodhpur' | 'kota';
  title: string;
  message: string;
  documentId?: string;
  timestamp: number;
}

interface ProvenanceFocus {
  documentId: string;
  sourceOffset: string;
  snippet?: string;
  mediaType?: 'text' | 'image' | 'audio' | 'video';
  title?: string;
}

interface InvestigationContextType {
  caseInfo: Case;
  agencies: Record<string, Agency>;
  documents: Document[];
  entities: Entity[];
  events: Event[];
  relationships: Relationship[];
  contradictions: Contradiction[];
  activeAgency: 'all' | 'jodhpur' | 'kota';
  selectedEntity: Entity | null;
  selectedRelationship: Relationship | null;
  selectedEvent: Event | null;
  selectedDocument: Document | null;
  provenanceFocus: ProvenanceFocus | null;
  isProcessing: boolean;
  processingStatusText: string;
  isLiveSyncActive: boolean;
  latestTransmission: TransmissionAlert | null;
  transmissionsList: TransmissionAlert[];

  // Actions
  setActiveAgency: (agency: 'all' | 'jodhpur' | 'kota') => void;
  setSelectedEntity: (entity: Entity | null) => void;
  setSelectedRelationship: (rel: Relationship | null) => void;
  setSelectedEvent: (event: Event | null) => void;
  setSelectedDocument: (doc: Document | null) => void;
  setProvenanceFocus: (focus: ProvenanceFocus | null) => void;
  
  // Intelligence Ingestion & HITL Confirmation
  ingestDocument: (docData: Partial<Document> & { title: string; content_text: string; agency_slug: 'jodhpur' | 'kota'; file_type: Document['file_type']; media_url?: string }) => Promise<void>;
  transmitToAgency: (fromAgency: 'jodhpur' | 'kota', toAgency: 'jodhpur' | 'kota', docId: string, note?: string) => void;
  dismissTransmission: () => void;
  updateRelationshipStatus: (relationshipId: string, status: RelationshipStatus) => void;
  updateContradictionStatus: (contradictionId: string, status: ContradictionStatus) => void;
  resetToDefaultCase: () => void;
}

const InvestigationContext = createContext<InvestigationContextType | null>(null);

const STORAGE_KEY = 'surag_fusion_case_state_v8';

export function InvestigationProvider({ children }: { children: React.ReactNode }) {
  const [caseInfo] = useState<Case>(INITIAL_CASE);
  const [agencies] = useState<Record<string, Agency>>(AGENCIES);

  const [documents, setDocuments] = useState<Document[]>(INITIAL_DOCUMENTS);
  const [entities, setEntities] = useState<Entity[]>(INITIAL_ENTITIES);
  const [events, setEvents] = useState<Event[]>(INITIAL_EVENTS);
  const [relationships, setRelationships] = useState<Relationship[]>(INITIAL_RELATIONSHIPS);
  const [contradictions, setContradictions] = useState<Contradiction[]>(INITIAL_CONTRADICTIONS);

  const [activeAgency, setActiveAgency] = useState<'all' | 'jodhpur' | 'kota'>('all');
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [provenanceFocus, setProvenanceFocus] = useState<ProvenanceFocus | null>(null);

  const [latestTransmission, setLatestTransmission] = useState<TransmissionAlert | null>(null);
  const [transmissionsList, setTransmissionsList] = useState<TransmissionAlert[]>([]);

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatusText, setProcessingStatusText] = useState<string>('');
  const [isLiveSyncActive, setIsLiveSyncActive] = useState<boolean>(true);

  // Load from local storage if previously modified
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.documents?.length) setDocuments(parsed.documents);
        if (parsed.entities?.length) setEntities(parsed.entities);
        if (parsed.events?.length) setEvents(parsed.events);
        if (parsed.relationships?.length) setRelationships(parsed.relationships);
        if (parsed.contradictions?.length) setContradictions(parsed.contradictions);
      }
    } catch (e) {
      console.warn('Failed to parse cached investigation state:', e);
    }
  }, []);

  // Save changes to local storage
  const persistState = useCallback(
    (
      docs: Document[],
      ents: Entity[],
      evts: Event[],
      rels: Relationship[],
      cons: Contradiction[]
    ) => {
      if (typeof window === 'undefined') return;
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            documents: docs,
            entities: ents,
            events: evts,
            relationships: rels,
            contradictions: cons,
          })
        );
      } catch (e) {
        console.warn('Storage quota exceeded:', e);
      }
    },
    []
  );

  // Subscribe to Realtime Cross-Tab & Cross-Agency broadcasts
  useEffect(() => {
    const unsubscribe = realtimeRelay.subscribe((eventName, payload: any) => {
      if (!payload) return;

      if (eventName === 'DOCUMENT_INGESTED') {
        setDocuments((prev) => [payload.document, ...prev.filter((d) => d.id !== payload.document.id)]);
        setEntities((prev) => {
          const newOnes = (payload.newEntities || []).filter(
            (ne: Entity) => !prev.some((pe) => pe.id === ne.id || pe.name.toLowerCase() === ne.name.toLowerCase())
          );
          return [...prev, ...newOnes];
        });
        setEvents((prev) => {
          const newEvts = (payload.newEvents || []).filter(
            (ne: Event) => !prev.some((pe) => pe.id === ne.id)
          );
          return [...prev, ...newEvts];
        });
        setRelationships((prev) => {
          const newRels = (payload.newRelationships || []).filter(
            (nr: Relationship) => !prev.some((pr) => pr.id === nr.id)
          );
          return [...prev, ...newRels];
        });
        if (payload.newContradictions?.length) {
          setContradictions((prev) => {
            const newCons = (payload.newContradictions || []).filter(
              (nc: Contradiction) => !prev.some((pc) => pc.id === nc.id)
            );
            return [...prev, ...newCons];
          });
        }

        // Automatic cross-agency transmission notification
        if (payload.fromAgency) {
          const opposite = payload.fromAgency === 'jodhpur' ? 'kota' : 'jodhpur';
          const alert: TransmissionAlert = {
            id: `tx-${Date.now()}`,
            fromAgency: payload.fromAgency,
            toAgency: opposite,
            title: payload.document.title,
            message: `${payload.fromAgency.toUpperCase()} POLICE deposited and dispatched new classified evidence: "${payload.document.title}". Extracted ${payload.newEntities?.length || 0} entities and ${payload.newEvents?.length || 0} timeline events.`,
            documentId: payload.document.id,
            timestamp: Date.now(),
          };
          setLatestTransmission(alert);
          setTransmissionsList((prev) => [alert, ...prev]);
        }
      } else if (eventName === 'AGENCY_TRANSMISSION') {
        const alert: TransmissionAlert = {
          id: payload.id || `tx-${Date.now()}`,
          fromAgency: payload.fromAgency,
          toAgency: payload.toAgency,
          title: payload.title,
          message: payload.message,
          documentId: payload.documentId,
          timestamp: payload.timestamp || Date.now(),
        };
        setLatestTransmission(alert);
        setTransmissionsList((prev) => [alert, ...prev]);
      } else if (eventName === 'RELATIONSHIP_UPDATED') {
        setRelationships((prev) =>
          prev.map((r) => (r.id === payload.relationshipId ? { ...r, status: payload.status } : r))
        );
      } else if (eventName === 'CONTRADICTION_UPDATED') {
        setContradictions((prev) =>
          prev.map((c) => (c.id === payload.contradictionId ? { ...c, status: payload.status } : c))
        );
      } else if (eventName === 'STATE_RESET') {
        setDocuments(INITIAL_DOCUMENTS);
        setEntities(INITIAL_ENTITIES);
        setEvents(INITIAL_EVENTS);
        setRelationships(INITIAL_RELATIONSHIPS);
        setContradictions(INITIAL_CONTRADICTIONS);
        setLatestTransmission(null);
        setTransmissionsList([]);
        localStorage.removeItem(STORAGE_KEY);
      }
    });

    setIsLiveSyncActive(true);
    return () => unsubscribe();
  }, []);

  // Transmit dossier or message from one agency to another
  const transmitToAgency = (
    fromAgency: 'jodhpur' | 'kota',
    toAgency: 'jodhpur' | 'kota',
    docId: string,
    note?: string
  ) => {
    const doc = documents.find((d) => d.id === docId);
    const alert: TransmissionAlert = {
      id: `tx-${Date.now()}`,
      fromAgency,
      toAgency,
      title: doc?.title || 'Classified Intelligence Transfer',
      message: note || `Urgent intelligence lead forwarded from ${fromAgency.toUpperCase()} to ${toAgency.toUpperCase()} sector command.`,
      documentId: docId,
      timestamp: Date.now(),
    };

    setLatestTransmission(alert);
    setTransmissionsList((prev) => [alert, ...prev]);
    realtimeRelay.publish('AGENCY_TRANSMISSION', alert);
  };

  const dismissTransmission = () => {
    setLatestTransmission(null);
  };

  // Ingest new document and run Track A Detective Extraction
  const ingestDocument = async (docData: {
    title: string;
    content_text: string;
    agency_slug: 'jodhpur' | 'kota';
    file_type: Document['file_type'];
    media_url?: string;
    uploaded_by?: string;
  }) => {
    setIsProcessing(true);
    setProcessingStatusText('Hashing evidence & routing through detective intelligence pipeline...');

    try {
      const agency = agencies[docData.agency_slug];
      const docId = `doc-${Date.now()}`;
      const newDoc: Document = {
        id: docId,
        case_id: caseInfo.id,
        agency_id: agency.id,
        uploaded_by: docData.uploaded_by || `${agency.name} (Field Unit)`,
        title: docData.title,
        file_type: docData.file_type,
        content_text: docData.content_text,
        media_url: docData.media_url,
        status: 'processing',
        uploaded_at: new Date().toISOString(),
      };

      // Add document immediately in processing status
      const updatedDocs = [newDoc, ...documents];
      setDocuments(updatedDocs);

      setProcessingStatusText('Extracting grounded entities, real-world timestamps & source offsets...');
      const extraction = await extractDocumentIntelligence(newDoc, entities);

      // Map extracted entities to full Entity records
      const newEntityRecords: Entity[] = extraction.entities
        .filter((raw) => !entities.some((e) => e.name.toLowerCase() === raw.name.toLowerCase()))
        .map((raw, idx) => ({
          id: `ent-${Date.now()}-${idx}`,
          case_id: caseInfo.id,
          agency_id: agency.id,
          type: raw.type,
          name: raw.name,
          attributes: raw.attributes,
          first_seen_at: new Date().toISOString(),
        }));

      const allEntities = [...entities, ...newEntityRecords];

      // Map extracted events
      const newEventRecords: Event[] = extraction.events.map((raw, idx) => ({
        id: `evt-${Date.now()}-${idx}`,
        case_id: caseInfo.id,
        document_id: docId,
        description: raw.description,
        event_timestamp: raw.event_timestamp,
        event_timestamp_confidence: raw.event_timestamp_confidence,
        location_text: raw.location_text,
        lat: raw.lat,
        lng: raw.lng,
        source_offset: raw.source_offset,
        confidence: raw.confidence,
        created_at: new Date().toISOString(),
      }));

      const allEvents = [...events, ...newEventRecords];

      // Track A3: Relationship & Connection Builder (AI suggests, human confirms)
      const newRelationshipRecords: Relationship[] = extraction.suggestedRelationships.map(
        (raw, idx) => {
          // Resolve source and target entities
          const sourceEnt =
            allEntities.find((e) => e.name.toLowerCase() === raw.source_entity_name.toLowerCase()) ||
            allEntities[0];
          const targetEnt =
            allEntities.find((e) => e.name.toLowerCase() === raw.target_entity_name.toLowerCase()) ||
            allEntities[1] ||
            allEntities[0];

          return {
            id: `rel-${Date.now()}-${idx}`,
            case_id: caseInfo.id,
            source_entity_id: sourceEnt ? sourceEnt.id : 'ent-0',
            target_entity_id: targetEnt ? targetEnt.id : 'ent-1',
            relationship_type: raw.relationship_type || 'CONNECTED_TO',
            description: raw.description,
            confidence: raw.confidence,
            status: 'ai_suggested', // Non-negotiable rule: defaults to ai_suggested
            source_document_ids: [docId],
            explanation: raw.explanation,
            created_at: new Date().toISOString(),
          };
        }
      );

      const allRelationships = [...relationships, ...newRelationshipRecords];

      // Track A4: Deterministic-first Contradiction Detector
      setProcessingStatusText('Executing deterministic temporal & spatial velocity conflict matrix...');
      const candidateContradictions = findCandidateContradictions(allEvents, allEntities, contradictions);
      const newContradictionRecords: Contradiction[] = [];

      for (let i = 0; i < candidateContradictions.length; i++) {
        const candidate = candidateContradictions[i];
        const explanation = await explainContradiction(candidate);

        newContradictionRecords.push({
          id: `con-${Date.now()}-${i}`,
          case_id: caseInfo.id,
          event_a_id: candidate.eventA.id,
          event_b_id: candidate.eventB.id,
          type: candidate.type,
          description: explanation,
          status: 'flagged',
          created_at: new Date().toISOString(),
        });
      }

      const allContradictions = [...contradictions, ...newContradictionRecords];

      // Mark document as processed
      const finalDocs = updatedDocs.map((d) => (d.id === docId ? { ...d, status: 'processed' as const } : d));

      setDocuments(finalDocs);
      setEntities(allEntities);
      setEvents(allEvents);
      setRelationships(allRelationships);
      setContradictions(allContradictions);

      persistState(finalDocs, allEntities, allEvents, allRelationships, allContradictions);

      // Broadcast to Realtime Channel with agency attribution
      realtimeRelay.publish('DOCUMENT_INGESTED', {
        fromAgency: docData.agency_slug,
        document: { ...newDoc, status: 'processed' },
        newEntities: newEntityRecords,
        newEvents: newEventRecords,
        newRelationships: newRelationshipRecords,
        newContradictions: newContradictionRecords,
      });
    } catch (error) {
      console.error('Ingestion failed:', error);
    } finally {
      setIsProcessing(false);
      setProcessingStatusText('');
    }
  };

  // Human-in-the-loop (HITL) confirmation
  const updateRelationshipStatus = (relationshipId: string, status: RelationshipStatus) => {
    const updated = relationships.map((r) => (r.id === relationshipId ? { ...r, status } : r));
    setRelationships(updated);
    persistState(documents, entities, events, updated, contradictions);
    realtimeRelay.publish('RELATIONSHIP_UPDATED', { relationshipId, status });
  };

  const updateContradictionStatus = (contradictionId: string, status: ContradictionStatus) => {
    const updated = contradictions.map((c) => (c.id === contradictionId ? { ...c, status } : c));
    setContradictions(updated);
    persistState(documents, entities, events, relationships, updated);
    realtimeRelay.publish('CONTRADICTION_UPDATED', { contradictionId, status });
  };

  const resetToDefaultCase = () => {
    setDocuments(INITIAL_DOCUMENTS);
    setEntities(INITIAL_ENTITIES);
    setEvents(INITIAL_EVENTS);
    setRelationships(INITIAL_RELATIONSHIPS);
    setContradictions(INITIAL_CONTRADICTIONS);
    setSelectedEntity(null);
    setSelectedRelationship(null);
    setSelectedEvent(null);
    setSelectedDocument(null);
    setProvenanceFocus(null);
    setLatestTransmission(null);
    setTransmissionsList([]);
    localStorage.removeItem(STORAGE_KEY);
    realtimeRelay.publish('STATE_RESET', {});
  };

  return (
    <InvestigationContext.Provider
      value={{
        caseInfo,
        agencies,
        documents,
        entities,
        events,
        relationships,
        contradictions,
        activeAgency,
        selectedEntity,
        selectedRelationship,
        selectedEvent,
        selectedDocument,
        provenanceFocus,
        isProcessing,
        processingStatusText,
        isLiveSyncActive,
        latestTransmission,
        transmissionsList,
        setActiveAgency,
        setSelectedEntity,
        setSelectedRelationship,
        setSelectedEvent,
        setSelectedDocument,
        setProvenanceFocus,
        ingestDocument,
        transmitToAgency,
        dismissTransmission,
        updateRelationshipStatus,
        updateContradictionStatus,
        resetToDefaultCase,
      }}
    >
      {children}
    </InvestigationContext.Provider>
  );
}

export function useInvestigation() {
  const context = useContext(InvestigationContext);
  if (!context) {
    throw new Error('useInvestigation must be used within an InvestigationProvider');
  }
  return context;
}
