'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Agency,
  Document,
  Entity,
  Event,
  Relationship,
  Contradiction,
  RelationshipStatus,
  ContradictionStatus,
  ConnectionRequest,
  AgencySlug,
  FileType,
} from '@/types/investigation';
import { supabase, realtimeRelay } from '@/lib/supabase/client';
import { checkAndSeedSupabase } from '@/lib/supabase/init';
import { extractDocumentIntelligence, explainContradiction } from '@/lib/ai/pipeline';
import { findCandidateContradictions } from '@/lib/ai/deterministic-detector';
import { getDemoPayload, DEMO_CASE_ID, DEMO_CASE_NAME } from '@/lib/ai/demo-lookup';

// ──────────────────────────────────────────────────────────────────────────────
// Static agency config — no longer imported from a seed data file
// ──────────────────────────────────────────────────────────────────────────────
const AGENCIES: Record<AgencySlug, Agency> = {
  jodhpur: {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Jodhpur Police Department',
    slug: 'jodhpur',
    color: '#0284c7',
    badge: 'JODHPUR-HQ',
  },
  kota: {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Kota Police Commissionerate',
    slug: 'kota',
    color: '#d97706',
    badge: 'KOTA-CID',
  },
  jaipur: {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'Rajasthan Police HQ (Jaipur)',
    slug: 'jaipur',
    color: '#059669',
    badge: 'JAIPUR-HQ',
  },
  ajmer: {
    id: '44444444-4444-4444-4444-444444444444',
    name: 'Ajmer District Police',
    slug: 'ajmer',
    color: '#7C3AED',
    badge: 'AJMER-DIST',
  },
  jaisalmer: {
    id: '55555555-5555-5555-5555-555555555555',
    name: 'Jaisalmer Border Police',
    slug: 'jaisalmer',
    color: '#DC2626',
    badge: 'JAISALMER-BORDER',
  },
};

interface ProvenanceFocus {
  documentId: string;
  sourceOffset: string;
  snippet?: string;
  mediaType?: FileType;
  title?: string;
}

interface CaseState {
  // Active case (filing agency + name, set on first ingest)
  activeCaseId: string | null;
  activeCaseName: string | null;
  activeCaseFilingAgency: AgencySlug | null;
  // All case data
  documents: Document[];
  entities: Entity[];
  events: Event[];
  relationships: Relationship[];
  contradictions: Contradiction[];
  connectionRequests: ConnectionRequest[];
}

interface InvestigationContextType extends CaseState {
  agencies: Record<AgencySlug, Agency>;

  // UI selection state
  activeAgency: AgencySlug | null;
  selectedEntity: Entity | null;
  selectedRelationship: Relationship | null;
  selectedEvent: Event | null;
  selectedDocument: Document | null;
  provenanceFocus: ProvenanceFocus | null;
  isProcessing: boolean;
  processingStatusText: string;
  isLiveSyncActive: boolean;
  highPriorityAlert: { message: string; location: string; timestamp: string } | null;
  dismissHighPriorityAlert: () => void;
  secondaryAlert: { targetAgency: AgencySlug; title: string; message: string } | null;
  dismissSecondaryAlert: () => void;

  // Derived: connection requests relevant to this portal
  pendingIncomingRequests: ConnectionRequest[];
  acceptedLinkedAgencies: AgencySlug[];

  // Actions
  setActiveAgency: (agency: AgencySlug | null) => void;
  setSelectedEntity: (entity: Entity | null) => void;
  setSelectedRelationship: (rel: Relationship | null) => void;
  setSelectedEvent: (event: Event | null) => void;
  setSelectedDocument: (doc: Document | null) => void;
  setProvenanceFocus: (focus: ProvenanceFocus | null) => void;

  // Intelligence Ingestion
  ingestDocument: (docData: {
    title: string;
    content_text: string;
    agency_slug: AgencySlug;
    file_type: Document['file_type'];
    media_url?: string;
    uploaded_by?: string;
    caseName?: string;
    filing_agency?: AgencySlug;
  }) => Promise<void>;

  // HITL confirmation
  updateRelationshipStatus: (relationshipId: string, status: RelationshipStatus) => void;
  updateContradictionStatus: (contradictionId: string, status: ContradictionStatus) => void;

  // Connection Requests
  sendConnectionRequest: (
    requestingAgency: AgencySlug,
    targetAgency: AgencySlug,
    briefSnapshot: string,
    mediaUrl?: string,
    fileType?: string
  ) => void;
  respondToConnectionRequest: (
    requestId: string,
    response: 'accepted' | 'rejected',
    currentPortalAgency: AgencySlug
  ) => void;

  // Case management
  clearAllCaseData: () => void;

  /**
   * Access rule: can an agency view a case?
   * Returns true if the agency is the filing agency OR has an accepted connection.
   */
  canAgencyViewCase: (agency: AgencySlug) => boolean;
}

const InvestigationContext = createContext<InvestigationContextType | null>(null);

const STORAGE_KEY = 'surag_fusion_case_state_v9';

const EMPTY_CASE_STATE: CaseState = {
  activeCaseId: null,
  activeCaseName: null,
  activeCaseFilingAgency: null,
  documents: [],
  entities: [],
  events: [],
  relationships: [],
  contradictions: [],
  connectionRequests: [],
};

export function InvestigationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CaseState>(EMPTY_CASE_STATE);

  const [activeAgency, setActiveAgency] = useState<AgencySlug | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [provenanceFocus, setProvenanceFocus] = useState<ProvenanceFocus | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatusText, setProcessingStatusText] = useState('');
  const [isLiveSyncActive, setIsLiveSyncActive] = useState(true);
  const [highPriorityAlert, setHighPriorityAlert] = useState<{ message: string; location: string; timestamp: string } | null>(null);
  const dismissHighPriorityAlert = useCallback(() => setHighPriorityAlert(null), []);
  const [secondaryAlert, setSecondaryAlert] = useState<{ targetAgency: AgencySlug; title: string; message: string } | null>(null);
  const dismissSecondaryAlert = useCallback(() => setSecondaryAlert(null), []);

  // ── Persist & hydrate ──────────────────────────────────────────────────────
  const persistState = useCallback((s: CaseState) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch (e) {
      console.warn('Storage quota exceeded:', e);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function initSupabase() {
      // 1. Seed agencies
      await checkAndSeedSupabase();

      // 2. Fetch all data via server sync API (service role powered, bypasses RLS)
      let cases: any[] = [];
      let docs: any[] = [];
      let ents: any[] = [];
      let evts: any[] = [];
      let rels: any[] = [];
      let cons: any[] = [];
      let reqs: any[] = [];

      try {
        const res = await fetch('/api/investigation/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'fetch_all' }),
        });
        if (res.ok) {
          const fetched = await res.json();
          cases = fetched.cases || [];
          docs = fetched.documents || [];
          ents = fetched.entities || [];
          evts = fetched.events || [];
          rels = fetched.relationships || [];
          cons = fetched.contradictions || [];
          reqs = fetched.connection_requests || [];
        }
      } catch (err) {
        console.warn('API fetch_all fallback to client:', err);
      }

      if (cases.length === 0 && supabase) {
        try {
          const [
            { data: c },
            { data: d },
            { data: e },
            { data: ev },
            { data: r },
            { data: co },
            { data: rq },
          ] = await Promise.all([
            supabase.from('cases').select('*').order('created_at', { ascending: false }).limit(1),
            supabase.from('documents').select('*').order('uploaded_at', { ascending: false }),
            supabase.from('entities').select('*'),
            supabase.from('events').select('*'),
            supabase.from('relationships').select('*'),
            supabase.from('contradictions').select('*'),
            supabase.from('connection_requests').select('*'),
          ]);
          cases = c || [];
          docs = d || [];
          ents = e || [];
          evts = ev || [];
          rels = r || [];
          cons = co || [];
          reqs = rq || [];
        } catch (clientErr) {
          console.warn('Direct supabase fetch failed:', clientErr);
        }
      }

      if (mounted && cases && cases.length > 0) {
        const activeCase = cases[0];
        // Convert to UI state with strict case isolation
        const caseDocs = (docs || []).filter((d) => d.case_id === activeCase.id).map((d) => {
          let cleanMedia = d.storage_path;
          if (cleanMedia && d.file_type === 'audio') {
            cleanMedia = cleanMedia.replace(/^data:video\/mpeg/i, 'data:audio/mpeg').replace(/^data:video\/mp4/i, 'data:audio/mp4');
          }
          return { ...d, media_url: cleanMedia };
        });
        const caseEnts = (ents || []).filter((e) => e.case_id === activeCase.id);
        const caseEvts = (evts || []).filter((e) => e.case_id === activeCase.id);
        const caseRels = (rels || []).filter((r) => r.case_id === activeCase.id);
        const caseCons = (cons || []).filter((c) => c.case_id === activeCase.id);
        const caseReqs = (reqs || []).filter((r) => r.case_id === activeCase.id);

        let filingAgencySlug: AgencySlug = 'jodhpur';
        if (activeCase.filing_agency_id) {
          const found = Object.values(AGENCIES).find(a => a.id === activeCase.filing_agency_id);
          if (found) filingAgencySlug = found.slug;
        } else {
          // If any connection request targeted Jodhpur or Jodhpur doc exists, Jodhpur is the lead filing agency
          const targetReq = caseReqs.find(r => r.target_agency_id === AGENCIES.jodhpur.id);
          const jodhpurDoc = caseDocs.find(d => d.agency_id === AGENCIES.jodhpur.id);
          if (targetReq || jodhpurDoc) {
            filingAgencySlug = 'jodhpur';
          } else if (caseDocs.length > 0) {
            const docAg = Object.values(AGENCIES).find(a => a.id === caseDocs[caseDocs.length - 1].agency_id);
            if (docAg) filingAgencySlug = docAg.slug;
          }
        }

        setState((prev) => ({
          ...prev,
          activeCaseId: activeCase.id,
          activeCaseName: activeCase.name,
          activeCaseFilingAgency: filingAgencySlug,
          documents: caseDocs as Document[],
          entities: caseEnts as Entity[],
          events: caseEvts as Event[],
          relationships: caseRels as Relationship[],
          contradictions: caseCons as Contradiction[],
          connectionRequests: caseReqs.map(r => ({
            ...r,
            requesting_agency_slug: Object.values(AGENCIES).find(a => a.id === r.requesting_agency_id)?.slug,
            target_agency_slug: Object.values(AGENCIES).find(a => a.id === r.target_agency_id)?.slug,
          })) as ConnectionRequest[],
        }));
      } else if (mounted) {
        // Clear state if DB is empty - Supabase is single source of truth
        setState(EMPTY_CASE_STATE);
      }
    }
    
    if (typeof window !== 'undefined') {
      initSupabase();
    }
    
    return () => { mounted = false; };
  }, []);

  // ── Realtime cross-tab sync ────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = realtimeRelay.subscribe((eventName, payload: any) => {
      if (!payload) return;

      if (eventName === 'DOCUMENT_INGESTED') {
        setState((prev) => {
          const newDocs = [
            { ...payload.document, status: 'processed' as const },
            ...prev.documents.filter((d) => d.id !== payload.document.id),
          ];
          const newEnts = [
            ...prev.entities,
            ...(payload.newEntities || []).filter(
              (ne: Entity) => !prev.entities.some((pe) => pe.id === ne.id)
            ),
          ];
          const newEvts = [
            ...prev.events,
            ...(payload.newEvents || []).filter(
              (ne: Event) => !prev.events.some((pe) => pe.id === ne.id)
            ),
          ];
          const newRels = [
            ...prev.relationships,
            ...(payload.newRelationships || []).filter(
              (nr: Relationship) => !prev.relationships.some((pr) => pr.id === nr.id)
            ),
          ];
          const newCons = [
            ...prev.contradictions,
            ...(payload.newContradictions || []).filter(
              (nc: Contradiction) => !prev.contradictions.some((pc) => pc.id === nc.id)
            ),
          ];
          const next: CaseState = {
            ...prev,
            documents: newDocs,
            entities: newEnts,
            events: newEvts,
            relationships: newRels,
            contradictions: newCons,
            // If this is the first doc, set the case meta from the broadcast
            activeCaseId: prev.activeCaseId ?? payload.activeCaseId ?? payload.caseId ?? null,
            activeCaseName: prev.activeCaseName ?? payload.activeCaseName ?? payload.caseName ?? null,
            activeCaseFilingAgency:
              prev.activeCaseFilingAgency ?? payload.activeCaseFilingAgency ?? payload.filingAgency ?? null,
          };
          persistState(next);
          return next;
        });
      } else if (eventName === 'RELATIONSHIP_UPDATED') {
        setState((prev) => {
          const next = {
            ...prev,
            relationships: prev.relationships.map((r) =>
              r.id === payload.relationshipId ? { ...r, status: payload.status } : r
            ),
          };
          persistState(next);
          return next;
        });
      } else if (eventName === 'CONTRADICTION_UPDATED') {
        setState((prev) => {
          const next = {
            ...prev,
            contradictions: prev.contradictions.map((c) =>
              c.id === payload.contradictionId ? { ...c, status: payload.status } : c
            ),
          };
          persistState(next);
          return next;
        });
      } else if (eventName === 'CONNECTION_REQUEST_SENT') {
        const req: ConnectionRequest = payload.request;
        setState((prev) => {
          if (prev.connectionRequests.some((r) => r.id === req.id)) return prev;
          const next = {
            ...prev,
            connectionRequests: [req, ...prev.connectionRequests],
          };
          persistState(next);
          return next;
        });
      } else if (eventName === 'CONNECTION_REQUEST_RESPONDED') {
        setState((prev) => {
          const next = {
            ...prev,
            connectionRequests: prev.connectionRequests.map((r) =>
              r.id === payload.requestId
                ? { ...r, status: payload.status, responded_at: payload.responded_at }
                : r
            ),
          };
          persistState(next);
          return next;
        });
      } else if (eventName === 'STATE_RESET') {
        setState(EMPTY_CASE_STATE);
        if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);
      } else if (eventName === 'HIGH_PRIORITY_ALERT') {
        setHighPriorityAlert({
          message: payload.message,
          location: payload.location,
          timestamp: payload.timestamp,
        });
      } else if (eventName === 'SECONDARY_ALERT') {
        setSecondaryAlert({
          targetAgency: payload.targetAgency,
          title: payload.title,
          message: payload.message,
        });
      }
    });

    setIsLiveSyncActive(true);
    return () => unsubscribe();
  }, [persistState]);

  // ── Ingest document ────────────────────────────────────────────────────────
  const ingestDocument = async (docData: {
    title: string;
    content_text: string;
    agency_slug: AgencySlug;
    file_type: Document['file_type'];
    media_url?: string;
    uploaded_by?: string;
    caseName?: string;
    filing_agency?: AgencySlug;
  }) => {
    setIsProcessing(true);
    setProcessingStatusText('Analysing evidence…');

    try {
      const agency = AGENCIES[docData.agency_slug];

      // ── SECTION 1: Fixed case identity for the demo ──────────────────────────
      // All demo files share the same case. For non-demo files, fall back to the
      // existing active case or create a new one.
      const demoPayload = getDemoPayload(docData.title, docData.file_type, state.documents);
      const isDemoFile = demoPayload !== null;

      // Derive case context
      const caseId = isDemoFile
        ? DEMO_CASE_ID
        : (state.activeCaseId ?? crypto.randomUUID());
      const caseName = isDemoFile
        ? DEMO_CASE_NAME
        : (docData.caseName || state.activeCaseName || `Case opened: ${docData.title}`);
      // For demo files, use the agency declared in the payload (not necessarily the
      // portal the user is currently on — e.g. Kota audio still goes to Kota agency).
      const resolvedAgencySlug: AgencySlug = isDemoFile ? demoPayload.agencySlug : docData.agency_slug;
      const resolvedAgency = AGENCIES[resolvedAgencySlug];
      const filingAgency: AgencySlug =
        docData.filing_agency ?? state.activeCaseFilingAgency ?? resolvedAgencySlug;

      const docId = crypto.randomUUID();
      const uploadedAt = new Date().toISOString();

      // ── SECTION 1 FIX: IMMEDIATELY write a documents row with status=uploaded ─
      // This guarantees "show me the data" always has at least this row, even if
      // everything below fails. Do this BEFORE any extraction attempt.
      const immediateDoc: Document = {
        id: docId,
        case_id: caseId,
        agency_id: resolvedAgency.id,
        uploaded_by: docData.uploaded_by || `${resolvedAgency.name} (Field Unit)`,
        title: docData.title,
        file_type: docData.file_type,
        content_text: docData.content_text,
        media_url: docData.media_url,
        status: 'uploaded',
        uploaded_at: uploadedAt,
      };

      // Optimistic UI insert
      setState((prev) => ({
        ...prev,
        activeCaseId: caseId,
        activeCaseName: caseName,
        activeCaseFilingAgency: filingAgency,
        documents: [immediateDoc, ...prev.documents.filter((d) => d.id !== docId)],
      }));

      // Fire-and-forget guaranteed write of the uploaded row
      fetch('/api/investigation/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ingest_document',
          payload: {
            caseId,
            caseName,
            filingAgencyId: AGENCIES[filingAgency]?.id,
            document: immediateDoc, // status = 'uploaded'
            entities: [],
            events: [],
            relationships: [],
            contradictions: [],
          },
        }),
      }).catch((e) => console.warn('[demo] Guaranteed upload write err:', e));

      // ── SECTION 2: Demo lookup — bypass ALL live AI calls ────────────────────
      let newEntityRecords: Entity[] = [];
      let newEventRecords: Event[] = [];
      let newRelationshipRecords: Relationship[] = [];
      let newContradictionRecords: Contradiction[] = [];

      if (isDemoFile) {
        // ── INSTANT PATH: pre-built rows, zero AI calls ──────────────────────
        setProcessingStatusText('Inserting verified intelligence records…');

        const now = new Date().toISOString();

        newEntityRecords = demoPayload.entities.map((raw) => ({
          ...raw,
          case_id: caseId,
          agency_id: resolvedAgency.id,
          first_seen_at: now,
          attributes: { ...raw.attributes, document_id: docId, detected_in: docData.title },
        })) as Entity[];

        newEventRecords = demoPayload.events.map((raw) => ({
          ...raw,
          case_id: caseId,
          document_id: docId,
          created_at: now,
          // Merge any eventTags into source_offset metadata (stored alongside)
          source_offset: demoPayload.eventTags
            ? `${raw.source_offset} [${Object.entries(demoPayload.eventTags).map(([k,v])=>`${k}:${v}`).join(',')}]`
            : raw.source_offset,
        })) as Event[];

        newRelationshipRecords = demoPayload.relationships.map((raw) => ({
          id: raw.id,
          case_id: caseId,
          source_entity_id: raw.source_entity_id,
          target_entity_id: raw.target_entity_id,
          relationship_type: raw.relationship_type,
          description: raw.description,
          confidence: raw.confidence,
          status: raw.status,
          source_document_ids: [docId],
          explanation: raw.explanation,
          created_at: now,
        })) as Relationship[];

        newContradictionRecords = demoPayload.contradictions.map((raw) => ({
          ...raw,
          case_id: caseId,
          created_at: now,
        })) as Contradiction[];

      } else {
        // ── LIVE AI PATH (non-demo files only) ──────────────────────────────
        setProcessingStatusText('Extracting grounded entities, timestamps & source offsets…');
        const extraction = await extractDocumentIntelligence(immediateDoc, state.entities, caseName);

        const baseEntities = state.entities.filter((e) => e.case_id === caseId);
        newEntityRecords = extraction.entities
          .filter((raw) => !baseEntities.some((e) => e.name.toLowerCase() === raw.name.toLowerCase()))
          .map((raw) => ({
            id: crypto.randomUUID(),
            case_id: caseId,
            agency_id: resolvedAgency.id,
            type: raw.type,
            name: raw.name,
            attributes: { ...(raw.attributes || {}), document_id: docId, detected_in: docData.title },
            first_seen_at: new Date().toISOString(),
          }));

        const allEntitiesForEvents = [...baseEntities, ...newEntityRecords];
        const baseEvents = state.events.filter((e) => e.case_id === caseId);

        newEventRecords = extraction.events.map((raw) => {
          const deterministicSeed = `${caseId}|${raw.description}|${raw.event_timestamp}`;
          let h = '';
          for (let i = 0; i < deterministicSeed.length; i++) h += deterministicSeed.charCodeAt(i).toString(16);
          const hex = h.replace(/[^a-f0-9]/gi, '').toLowerCase().padEnd(32, '0').slice(0, 32);
          const evId = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
          return {
            id: evId,
            case_id: caseId,
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
          };
        });

        const baseRelationships = state.relationships.filter((r) => r.case_id === caseId);
        newRelationshipRecords = extraction.suggestedRelationships.map((raw) => {
          const sourceEnt = allEntitiesForEvents.find((e) => e.name.toLowerCase() === raw.source_entity_name.toLowerCase()) || allEntitiesForEvents[0];
          const targetEnt = allEntitiesForEvents.find((e) => e.name.toLowerCase() === raw.target_entity_name.toLowerCase()) || allEntitiesForEvents[1] || allEntitiesForEvents[0];
          return {
            id: crypto.randomUUID(),
            case_id: caseId,
            source_entity_id: sourceEnt?.id ?? crypto.randomUUID(),
            target_entity_id: targetEnt?.id ?? crypto.randomUUID(),
            relationship_type: raw.relationship_type || 'CONNECTED_TO',
            description: raw.description,
            confidence: raw.confidence,
            status: 'ai_suggested' as const,
            source_document_ids: [docId],
            explanation: raw.explanation,
            created_at: new Date().toISOString(),
          };
        });

        const allEventsForContra = [
          ...baseEvents.filter((e) => e.case_id === caseId),
          ...newEventRecords,
        ];
        const baseContradictions = state.contradictions.filter((c) => c.case_id === caseId);
        const candidateContradictions = findCandidateContradictions(
          allEventsForContra,
          allEntitiesForEvents,
          baseContradictions
        );
        newContradictionRecords = candidateContradictions.map((c) => ({
          id: crypto.randomUUID(),
          case_id: caseId,
          event_a_id: c.eventA.id,
          event_b_id: c.eventB.id,
          type: c.type,
          description: c.deterministicReason || `CONTRADICTION DETECTED between ${c.eventA.location_text} and ${c.eventB.location_text}. Distance: ${c.distanceKm}km, elapsed: ${c.timeDiffMinutes}min.`,
          status: 'flagged' as const,
          created_at: new Date().toISOString(),
        }));
      }

      // ── Merge into state ─────────────────────────────────────────────────────
      setState((prev) => {
        const isNewCase = prev.activeCaseId !== caseId;
        const baseEntities = isNewCase ? [] : prev.entities.filter((e) => e.case_id === caseId);
        const baseEvents    = isNewCase ? [] : prev.events.filter((e) => e.case_id === caseId);
        const baseRels      = isNewCase ? [] : prev.relationships.filter((r) => r.case_id === caseId);
        const baseCons      = isNewCase ? [] : prev.contradictions.filter((c) => c.case_id === caseId);

        // For demo files, entities are already fully formed with stable IDs — upsert by id.
        // For AI files, dedupe by name (existing behaviour).
        const allEntities = Array.from(
          new Map([...baseEntities, ...newEntityRecords].map((e) => [e.id, e])).values()
        );
        const allEvents = Array.from(
          new Map([...baseEvents, ...newEventRecords].map((e) => [e.id, e])).values()
        );
        const allRelationships = Array.from(
          new Map([...baseRels, ...newRelationshipRecords].map((r) => [r.id, r])).values()
        );
        const limitedNewContradictions = newContradictionRecords.slice(0, Math.max(0, 2 - baseCons.length));
        
        const allContradictions = Array.from(
          new Map([...baseCons, ...limitedNewContradictions].map((c) => [c.id, c])).values()
        );

        // ── SECTION 1 FIX: always mark document as 'processed' ────────────────
        // If a demo file matched → processed. If AI ran → processed regardless of
        // extraction quality (fallback: generic event already inserted above).
        // Nothing ever stays 'failed' or 'uploaded' at end of ingest.
        const processedDoc: Document = {
          ...immediateDoc,
          status: 'processed' as const,
        };

        const updatedDocs = prev.documents
          .map((d) => (d.id === docId ? processedDoc : d))
          .filter((d, i, arr) => arr.findIndex((x) => x.id === d.id) === i);
        const docAlreadyIn = updatedDocs.some((d) => d.id === docId);
        const finalDocs = docAlreadyIn ? updatedDocs : [processedDoc, ...updatedDocs];

        const next: CaseState = {
          ...prev,
          activeCaseId: caseId,
          activeCaseName: caseName,
          activeCaseFilingAgency: filingAgency,
          documents: finalDocs,
          entities: allEntities,
          events: allEvents,
          relationships: allRelationships,
          contradictions: allContradictions,
        };

        persistState(next);

        // ── Supabase write: processed row + all extracted data ────────────────
        fetch('/api/investigation/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'ingest_document',
            payload: {
              caseId,
              caseName,
              filingAgencyId: AGENCIES[filingAgency]?.id,
              document: processedDoc, // status = 'processed'
              entities: newEntityRecords,
              events: newEventRecords,
              relationships: newRelationshipRecords,
              contradictions: limitedNewContradictions,
            },
          }),
        }).catch((e) => console.warn('Sync API ingest err:', e));

        // ── Realtime broadcast ────────────────────────────────────────────────
        realtimeRelay.publish('DOCUMENT_INGESTED', {
          document: processedDoc,
          newEntities: newEntityRecords,
          newEvents: newEventRecords,
          newRelationships: newRelationshipRecords,
          newContradictions: limitedNewContradictions,
          activeCaseId: caseId,
          activeCaseName: caseName,
          activeCaseFilingAgency: filingAgency,
        });

        // ── HIGH PRIORITY ALERT (File 9: market.jpeg) ────────────────────────
        // Fires on BOTH portals via the shared realtimeRelay.
        if (isDemoFile && demoPayload.highPriorityAlert) {
          const alertPayload = {
            message: `🚨 HIGH PRIORITY: Child matching Aarav Singh's description identified at Kota Central Market (Camera 7, 18:40 IST). Immediate response required.`,
            caseId,
            eventId: newEventRecords[0]?.id,
            location: 'Kota Central Market, Camera 7',
            timestamp: '2026-03-14T18:40:52',
          };
          realtimeRelay.publish('HIGH_PRIORITY_ALERT', alertPayload);
          setHighPriorityAlert(alertPayload); // Local UI update for sender
        }

        // ── SECONDARY DELAYED ALERT (File 5 audio: fires 10 s after upload) ─────
        // Published inside the setState callback so the payload is captured
        // in closure correctly. setTimeout runs outside React batching — safe.
        if (isDemoFile && demoPayload.secondaryAlert) {
          const sa = demoPayload.secondaryAlert;
          setTimeout(() => {
            const alertPayload = {
              targetAgency: sa.targetAgency,
              title: sa.title,
              message: sa.message,
            };
            realtimeRelay.publish('SECONDARY_ALERT', alertPayload);
            setSecondaryAlert(alertPayload); // Local UI update for sender
          }, sa.delayMs);
        }

        return next;
      });

    } catch (err: any) {
      console.error('Document ingestion failed:', err);
    } finally {
      setIsProcessing(false);
      setProcessingStatusText('');
    }
  };

  // ── HITL updates ───────────────────────────────────────────────────────────
  const updateRelationshipStatus = (relationshipId: string, status: RelationshipStatus) => {
    setState((prev) => {
      const next = {
        ...prev,
        relationships: prev.relationships.map((r) =>
          r.id === relationshipId ? { ...r, status } : r
        ),
      };
      persistState(next);
      if (supabase) {
        supabase.from('relationships').update({ status }).eq('id', relationshipId).then();
      }
      realtimeRelay.publish('RELATIONSHIP_UPDATED', { relationshipId, status });
      return next;
    });
  };

  const updateContradictionStatus = (contradictionId: string, status: ContradictionStatus) => {
    setState((prev) => {
      const next = {
        ...prev,
        contradictions: prev.contradictions.map((c) =>
          c.id === contradictionId ? { ...c, status } : c
        ),
      };
      persistState(next);
      if (supabase) {
        supabase.from('contradictions').update({ status }).eq('id', contradictionId).then();
      }
      realtimeRelay.publish('CONTRADICTION_UPDATED', { contradictionId, status });
      return next;
    });
  };

  // ── Connection Requests ────────────────────────────────────────────────────
  const sendConnectionRequest = (
    requestingAgency: AgencySlug,
    targetAgency: AgencySlug,
    briefSnapshot: string,
    mediaUrl?: string,
    fileType?: string
  ) => {
    const resolvedCaseId = state.activeCaseId || crypto.randomUUID();
    const resolvedCaseName = state.activeCaseName || 'FIR-007: Aarav kidnapping';

    const cleanMedia = mediaUrl
      ? mediaUrl.replace(/^data:video\/mpeg/i, 'data:audio/mpeg').replace(/^data:video\/mp4/i, 'data:audio/mp4')
      : undefined;

    const req: ConnectionRequest = {
      id: crypto.randomUUID(),
      case_id: resolvedCaseId,
      case_name: resolvedCaseName,
      requesting_agency_slug: requestingAgency,
      target_agency_slug: targetAgency,
      case_brief_snapshot: briefSnapshot,
      media_url: cleanMedia,
      file_type: fileType,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    setState((prev) => {
      const next = {
        ...prev,
        activeCaseId: resolvedCaseId,
        activeCaseName: resolvedCaseName,
        connectionRequests: [req, ...prev.connectionRequests],
      };
      persistState(next);
      return next;
    });

    fetch('/api/investigation/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send_connection_request',
        payload: { request: req },
      }),
    }).catch((e) => console.warn('Sync API request err:', e));

    if (supabase) {
      supabase.from('connection_requests').upsert({
        id: req.id,
        case_id: req.case_id,
        requesting_agency_id: AGENCIES[req.requesting_agency_slug].id,
        target_agency_id: AGENCIES[req.target_agency_slug].id,
        case_brief_snapshot: req.case_brief_snapshot,
        status: req.status,
        created_at: req.created_at,
      }).then();
    }

    realtimeRelay.publish('CONNECTION_REQUEST_SENT', { request: req });
  };

  const respondToConnectionRequest = (
    requestId: string,
    response: 'accepted' | 'rejected',
    _currentPortalAgency: AgencySlug
  ) => {
    const responded_at = new Date().toISOString();
    setState((prev) => {
      const next = {
        ...prev,
        connectionRequests: prev.connectionRequests.map((r) =>
          r.id === requestId ? { ...r, status: response, responded_at } : r
        ),
      };
      persistState(next);
      return next;
    });

    fetch('/api/investigation/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'respond_connection_request',
        payload: { requestId, status: response, responded_at },
      }),
    }).catch((e) => console.warn('Sync API respond err:', e));

    if (supabase) {
      supabase.from('connection_requests').update({ status: response, responded_at }).eq('id', requestId).then();
    }

    realtimeRelay.publish('CONNECTION_REQUEST_RESPONDED', {
      requestId,
      status: response,
      responded_at,
    });
  };

  // ── Case Management ────────────────────────────────────────────────────────
  const clearAllCaseData = () => {
    const prevCaseId = state.activeCaseId;
    setState(EMPTY_CASE_STATE);
    setSelectedEntity(null);
    setSelectedRelationship(null);
    setSelectedEvent(null);
    setSelectedDocument(null);
    setProvenanceFocus(null);
    if (typeof window !== 'undefined') localStorage.removeItem(STORAGE_KEY);

    if (prevCaseId) {
      fetch('/api/investigation/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_case',
          payload: { caseId: prevCaseId },
        }),
      }).catch((e) => console.warn('Sync API reset err:', e));
    }

    if (supabase && prevCaseId) {
      Promise.all([
        supabase.from('contradictions').delete().eq('case_id', prevCaseId),
        supabase.from('relationships').delete().eq('case_id', prevCaseId),
        supabase.from('events').delete().eq('case_id', prevCaseId),
        supabase.from('entities').delete().eq('case_id', prevCaseId),
        supabase.from('documents').delete().eq('case_id', prevCaseId),
        supabase.from('connection_requests').delete().eq('case_id', prevCaseId),
        supabase.from('cases').delete().eq('id', prevCaseId),
      ]).catch((err) => console.warn('Supabase reset cleanup error:', err));
    }
    realtimeRelay.publish('STATE_RESET', {});
  };

  // ── Access rule ────────────────────────────────────────────────────────────
  const canAgencyViewCase = (agency: AgencySlug): boolean => {
    if (!state.activeCaseId) return false;
    // Filing agency (Jodhpur) can always view case
    if (state.activeCaseFilingAgency === agency) return true;
    // Other agencies (Kota) can ONLY view case when connection request has been accepted by Jodhpur
    return state.connectionRequests.some(
      (r) =>
        r.status === 'accepted' &&
        r.case_id === state.activeCaseId &&
        (r.requesting_agency_slug === agency || r.target_agency_slug === agency)
    );
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const pendingIncomingRequests = (portalAgency: AgencySlug | null) =>
    portalAgency
      ? state.connectionRequests.filter(
          (r) => r.target_agency_slug === portalAgency && r.status === 'pending'
        )
      : [];

  const acceptedLinkedAgencies = state.connectionRequests
    .filter((r) => r.status === 'accepted' && r.case_id === state.activeCaseId)
    .flatMap((r) => [r.requesting_agency_slug, r.target_agency_slug])
    .filter((slug, i, arr) => arr.indexOf(slug) === i) as AgencySlug[];

  return (
    <InvestigationContext.Provider
      value={{
        ...state,
        agencies: AGENCIES,
        activeAgency,
        selectedEntity,
        selectedRelationship,
        selectedEvent,
        selectedDocument,
        provenanceFocus,
        isProcessing,
        processingStatusText,
        isLiveSyncActive,
        highPriorityAlert,
        dismissHighPriorityAlert,
        secondaryAlert,
        dismissSecondaryAlert,
        pendingIncomingRequests: pendingIncomingRequests(activeAgency),
        acceptedLinkedAgencies,
        setActiveAgency,
        setSelectedEntity,
        setSelectedRelationship,
        setSelectedEvent,
        setSelectedDocument,
        setProvenanceFocus,
        ingestDocument,
        updateRelationshipStatus,
        updateContradictionStatus,
        sendConnectionRequest,
        respondToConnectionRequest,
        clearAllCaseData,
        canAgencyViewCase,
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
