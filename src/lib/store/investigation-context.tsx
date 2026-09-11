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

  // Actions
  setActiveAgency: (agency: 'all' | 'jodhpur' | 'kota') => void;
  setSelectedEntity: (entity: Entity | null) => void;
  setSelectedRelationship: (rel: Relationship | null) => void;
  setSelectedEvent: (event: Event | null) => void;
  setSelectedDocument: (doc: Document | null) => void;
  setProvenanceFocus: (focus: ProvenanceFocus | null) => void;
  
  // Intelligence Ingestion & HITL Confirmation
  ingestDocument: (docData: Partial<Document> & { title: string; content_text: string; agency_slug: 'jodhpur' | 'kota'; file_type: Document['file_type'] }) => Promise<void>;
  updateRelationshipStatus: (relationshipId: string, status: RelationshipStatus) => void;
  updateContradictionStatus: (contradictionId: string, status: ContradictionStatus) => void;
  resetToDefaultCase: () => void;
}

const InvestigationContext = createContext<InvestigationContextType | null>(null);

const STORAGE_KEY = 'surag_ai_state_v1';

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
        if (parsed.documents) setDocuments(parsed.documents);
        if (parsed.entities) setEntities(parsed.entities);
        if (parsed.events) setEvents(parsed.events);
        if (parsed.relationships) setRelationships(parsed.relationships);
        if (parsed.contradictions) setContradictions(parsed.contradictions);
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
        setEntities((prev) => [...prev, ...(payload.newEntities || [])]);
        setEvents((prev) => [...prev, ...(payload.newEvents || [])]);
        setRelationships((prev) => [...prev, ...(payload.newRelationships || [])]);
        if (payload.newContradictions?.length) {
          setContradictions((prev) => [...prev, ...payload.newContradictions]);
        }
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
        localStorage.removeItem(STORAGE_KEY);
      }
    });

    setIsLiveSyncActive(true);
    return () => unsubscribe();
  }, []);

  // Ingest new document and run Track A Detective Extraction
  const ingestDocument = async (docData: {
    title: string;
    content_text: string;
    agency_slug: 'jodhpur' | 'kota';
    file_type: Document['file_type'];
    media_url?: string;
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
        uploaded_by: `${agency.name} (Unit Alpha)`,
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
            source_entity_id: sourceEnt.id,
            target_entity_id: targetEnt.id,
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

      // Broadcast to Realtime Channel
      realtimeRelay.publish('DOCUMENT_INGESTED', {
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
        setActiveAgency,
        setSelectedEntity,
        setSelectedRelationship,
        setSelectedEvent,
        setSelectedDocument,
        setProvenanceFocus,
        ingestDocument,
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
