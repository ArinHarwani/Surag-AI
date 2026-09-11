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
} from '@/types/investigation';
import { supabase, realtimeRelay } from '@/lib/supabase/client';
import { checkAndSeedSupabase } from '@/lib/supabase/init';
import { extractDocumentIntelligence, explainContradiction } from '@/lib/ai/pipeline';
import { findCandidateContradictions } from '@/lib/ai/deterministic-detector';

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
  mediaType?: 'text' | 'image' | 'audio' | 'video';
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
    briefSnapshot: string
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
        const caseDocs = (docs || []).filter((d) => d.case_id === activeCase.id).map((d) => ({ ...d, media_url: d.storage_path }));
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
    setProcessingStatusText('Hashing evidence & routing through detective intelligence pipeline...');

    try {
      const agency = AGENCIES[docData.agency_slug];

      // Determine case context — first ingest creates the case
      const caseId = state.activeCaseId ?? crypto.randomUUID();
      const caseName =
        docData.caseName || state.activeCaseName || `Case opened: ${docData.title}`;
      const filingAgency: AgencySlug =
        docData.filing_agency ?? state.activeCaseFilingAgency ?? docData.agency_slug;

      const docId = crypto.randomUUID();
      const newDoc: Document = {
        id: docId,
        case_id: caseId,
        agency_id: agency.id,
        uploaded_by: docData.uploaded_by || `${agency.name} (Field Unit)`,
        title: docData.title,
        file_type: docData.file_type,
        content_text: docData.content_text,
        media_url: docData.media_url,
        status: 'processing',
        uploaded_at: new Date().toISOString(),
      };

      // Optimistic add
      setState((prev) => ({
        ...prev,
        activeCaseId: caseId,
        activeCaseName: caseName,
        activeCaseFilingAgency: filingAgency,
        documents: [newDoc, ...prev.documents],
      }));

      setProcessingStatusText('Extracting grounded entities, real-world timestamps & source offsets...');
      const extraction = await extractDocumentIntelligence(newDoc, state.entities);

      setState((prev) => {
        // ── Case isolation: if this is a brand-new case, discard ALL data from
        //    the previous session so nothing bleeds across cases.
        const isNewCase = prev.activeCaseId !== caseId;
        const baseEntities = isNewCase ? [] : prev.entities.filter((e) => e.case_id === caseId);
        const baseEvents = isNewCase ? [] : prev.events.filter((e) => e.case_id === caseId);
        const baseRelationships = isNewCase ? [] : prev.relationships.filter((r) => r.case_id === caseId);
        const baseContradictions = isNewCase ? [] : prev.contradictions.filter((c) => c.case_id === caseId);

        const newEntityRecords: Entity[] = extraction.entities
          .filter((raw) => !baseEntities.some((e) => e.name.toLowerCase() === raw.name.toLowerCase()))
          .map((raw, idx) => ({
            id: crypto.randomUUID(),
            case_id: caseId,
            agency_id: agency.id,
            type: raw.type,
            name: raw.name,
            attributes: raw.attributes,
            first_seen_at: new Date().toISOString(),
          }));

        const allEntities = [...baseEntities, ...newEntityRecords];

        const newEventRecords: Event[] = extraction.events.map((raw, idx) => ({
          id: crypto.randomUUID(),
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
        }));

        // Only accumulate events that belong to the current case
        const allEvents = [
          ...baseEvents.filter((e) => e.case_id === caseId),
          ...newEventRecords,
        ];

        const newRelationshipRecords: Relationship[] = extraction.suggestedRelationships.map(
          (raw, idx) => {
            const sourceEnt =
              allEntities.find((e) => e.name.toLowerCase() === raw.source_entity_name.toLowerCase()) ||
              allEntities[0];
            const targetEnt =
              allEntities.find((e) => e.name.toLowerCase() === raw.target_entity_name.toLowerCase()) ||
              allEntities[1] ||
              allEntities[0];
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
          }
        );

        const allRelationships = [...baseRelationships, ...newRelationshipRecords];

        // Contradiction detection: only run against events scoped to this case
        const candidateContradictions = findCandidateContradictions(
          allEvents,
          allEntities,
          baseContradictions
        );
        const newContradictionRecords: Contradiction[] = candidateContradictions.map((c, i) => ({
          id: crypto.randomUUID(),
          case_id: caseId,
          event_a_id: c.eventA.id,
          event_b_id: c.eventB.id,
          type: c.type,
          description: `CONTRADICTION DETECTED between ${c.eventA.location_text} and ${c.eventB.location_text}. Distance: ${c.distanceKm}km, elapsed: ${c.timeDiffMinutes}min.`,
          status: 'flagged' as const,
          created_at: new Date().toISOString(),
        }));

        const allContradictions = [
          ...baseContradictions,
          ...newContradictionRecords.filter(
            (nc) => !baseContradictions.some((pc) => pc.id === nc.id)
          ),
        ];

        const finalDocs = prev.documents.map((d) =>
          d.id === docId ? { ...d, status: 'processed' as const } : d
        );
        // If the optimistic doc isn't in state yet somehow, add it
        const docAlreadyIn = finalDocs.some((d) => d.id === docId);
        const processedDoc = { ...newDoc, status: 'processed' as const };
        const updatedDocs = docAlreadyIn
          ? finalDocs
          : [processedDoc, ...finalDocs];

        const next: CaseState = {
          ...prev,
          activeCaseId: caseId,
          activeCaseName: caseName,
          activeCaseFilingAgency: filingAgency,
          documents: updatedDocs,
          entities: allEntities,
          events: allEvents,
          relationships: allRelationships,
          contradictions: allContradictions,
        };

        persistState(next);

        // Supabase Writes (Dual-layer: Server Sync API bypasses RLS + Client Supabase)
        fetch('/api/investigation/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'ingest_document',
            payload: {
              caseId,
              caseName,
              filingAgencyId: AGENCIES[filingAgency]?.id,
              document: processedDoc,
              entities: newEntityRecords,
              events: newEventRecords,
              relationships: newRelationshipRecords,
              contradictions: newContradictionRecords,
            },
          }),
        }).catch((e) => console.warn('Sync API ingest err:', e));

        if (supabase) {
          (async () => {
            try {
              if (prev.activeCaseId !== caseId) {
                await supabase.from('cases').upsert({
                  id: caseId,
                  name: caseName,
                });
              }

              await supabase.from('documents').upsert({
                id: processedDoc.id,
                case_id: processedDoc.case_id,
                agency_id: processedDoc.agency_id,
                uploaded_by: processedDoc.uploaded_by,
                title: processedDoc.title,
                file_type: processedDoc.file_type,
                content_text: processedDoc.content_text,
                storage_path: processedDoc.media_url,
                status: processedDoc.status,
                uploaded_at: processedDoc.uploaded_at,
              });

              if (newEntityRecords.length > 0) {
                await supabase.from('entities').upsert(newEntityRecords);
              }
              if (newEventRecords.length > 0) {
                await supabase.from('events').upsert(newEventRecords);
              }
              if (newRelationshipRecords.length > 0) {
                await supabase.from('relationships').upsert(newRelationshipRecords);
              }
              if (newContradictionRecords.length > 0) {
                await supabase.from('contradictions').upsert(newContradictionRecords);
              }
            } catch (err) {
              console.warn('Direct client Supabase ingest caught:', err);
            }
          })();
        }

        realtimeRelay.publish('DOCUMENT_INGESTED', {
          document: processedDoc,
          newEntities: newEntityRecords,
          newEvents: newEventRecords,
          newRelationships: newRelationshipRecords,
          newContradictions: newContradictionRecords,
          activeCaseId: caseId,
          activeCaseName: caseName,
          activeCaseFilingAgency: filingAgency,
        });

        return next;
      });

      // Async explain contradictions in the background (non-blocking)
      // (We already set them with a deterministic description above)
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
    briefSnapshot: string
  ) => {
    const resolvedCaseId = state.activeCaseId || crypto.randomUUID();
    const resolvedCaseName = state.activeCaseName || 'FIR-007: Aarav kidnapping';

    const req: ConnectionRequest = {
      id: crypto.randomUUID(),
      case_id: resolvedCaseId,
      case_name: resolvedCaseName,
      requesting_agency_slug: requestingAgency,
      target_agency_slug: targetAgency,
      case_brief_snapshot: briefSnapshot,
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
