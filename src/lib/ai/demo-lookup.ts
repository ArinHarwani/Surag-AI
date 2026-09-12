/**
 * DEMO MODE LOOKUP TABLE
 * ──────────────────────
 * Maps demo filenames (case-insensitive exact match) to pre-written, guaranteed-correct
 * entities / events / relationships / contradictions.
 *
 * When getDemoPayload() returns a non-null result:
 *   - skip ALL live AI calls (Gemini, Sarvam, local engine)
 *   - insert the returned rows directly into Supabase
 *   - the whole ingest should complete in < 1 second (DB insert only)
 *
 * Contradiction trigger (Files 3 ↔ 4):
 *   Both File 3 (sunita_devi_statement) and File 4 (school_transport_record) check
 *   whether the OTHER file has already been ingested. If yes, the contradiction is
 *   appended to that upload's payload. This fires in whichever direction completes last.
 */

import { Entity, Event, Relationship, Contradiction, AgencySlug } from '@/types/investigation';

// ── Fixed demo case identity ──────────────────────────────────────────────────
export const DEMO_CASE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
export const DEMO_CASE_NAME = 'FIR-007: Missing Child — Aarav Singh (Jodhpur, 14 Mar 2026)';

// ── Agency IDs (mirror the constants in investigation-context.tsx) ────────────
const JODHPUR_AGENCY_ID = '11111111-1111-1111-1111-111111111111';
const KOTA_AGENCY_ID = '22222222-2222-2222-2222-222222222222';

// ── Deterministic ID helper ───────────────────────────────────────────────────
// Produces a stable UUID-shaped string from any seed, so the same demo file
// always generates the same IDs. Supabase upsert is then perfectly idempotent.
function stableId(seed: string): string {
  let h = '';
  for (let i = 0; i < seed.length; i++) h += seed.charCodeAt(i).toString(16);
  const hex = h.replace(/[^a-f0-9]/gi, '').toLowerCase().padEnd(32, '0').slice(0, 32);
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`;
}

function entityId(name: string) { return stableId(`entity|${name}`); }
function eventId(desc: string, ts: string) { return stableId(`event|${desc}|${ts}`); }

// Named entity ID constants — shared across files so relationships resolve correctly
const ENT_AARAV   = entityId('Aarav Singh');
const ENT_MEENA   = entityId('Meena Singh');
const ENT_VEHICLE = entityId('Grey Hatchback Vehicle (Maruti Suzuki WagonR, partial plate RJ19...)');
const ENT_VIKRAM  = entityId('Vikram Rathore');

// Named event ID constants — needed for the cross-file contradiction trigger
const EVT_SUNITA_TS = '2026-03-14T16:45:00';
const EVT_SUNITA_ID = eventId(
  'Neighbor Sunita Devi reports seeing Aarav Singh board the school van outside the residence',
  EVT_SUNITA_TS
);
const EVT_SCHOOL_TS = '2026-03-14T16:45:00';
const EVT_SCHOOL_ID = eventId(
  "School transport system logs Aarav Singh as Absent - Not Boarded for Route 4 pickup window",
  EVT_SCHOOL_TS
);

// ── Contradiction text (single source of truth) ───────────────────────────────
const CONTRADICTION_DESC =
  "CONTRADICTION DETECTED: Witness statement (Sunita Devi) claims Aarav Singh boarded the school van at " +
  "16:45 on 14 March. The school's own transport log for the same route and time window records him as " +
  "'Absent - Not Boarded'. These two records cannot both be true. Source citations: " +
  "[03_sunita_devi_statement.txt] vs [3.5_school_transport_log_14March.csv].";

// ── Demo payload type ─────────────────────────────────────────────────────────
export interface DemoPayload {
  entities: Omit<Entity, 'case_id' | 'agency_id' | 'first_seen_at'>[];
  events: Omit<Event, 'case_id' | 'document_id' | 'created_at'>[];
  relationships: {
    id: string;
    source_entity_id: string;
    target_entity_id: string;
    relationship_type: string;
    description: string;
    confidence: number;
    status: 'ai_suggested' | 'confirmed' | 'dismissed';
    explanation: string;
  }[];
  contradictions: Omit<Contradiction, 'case_id' | 'created_at'>[];
  /** Agency slug this document belongs to */
  agencySlug: AgencySlug;
  /** Set true for File 9 (market.jpeg) — fires high-priority alert on both portals */
  highPriorityAlert?: boolean;
  /** Extra tags applied to all events from this file (e.g. trust_tier for tweet) */
  eventTags?: Record<string, string>;
  /**
   * If set, fires a secondary toast notification on a specific portal after a delay.
   * Used for the audio tip → 10-second car-linked notification on Kota portal.
   */
  secondaryAlert?: {
    delayMs: number;
    targetAgency: AgencySlug;
    title: string;
    message: string;
  };
}

/**
 * Main entry point — call this BEFORE any AI extraction.
 *
 * @param filename     The raw filename the user uploaded (basename only, no path)
 * @param fileType     The detected file_type ('image','audio','pdf','csv','text',…)
 * @param existingDocs Current list of document titles already ingested into the case
 * @returns            Pre-built payload, or null if filename doesn't match any demo file
 */
export function getDemoPayload(
  filename: string,
  fileType: string,
  existingDocs: { title: string }[]
): DemoPayload | null {
  const fn = filename.toLowerCase().trim();
  const existingTitles = existingDocs.map((d) => d.title.toLowerCase().trim());

  // ── File 1: 01_meena_singh_complaint.txt ─────────────────────────────────
  if (fn.includes('meena')) {
    return {
      agencySlug: 'jodhpur',
      entities: [
        {
          id: ENT_AARAV,
          type: 'person',
          name: 'Aarav Singh',
          attributes: { role: 'Missing Subject', age: '7', relation: 'child' },
        },
        {
          id: ENT_MEENA,
          type: 'person',
          name: 'Meena Singh',
          attributes: { role: 'Complainant', relation: 'mother' },
        },
      ],
      events: [
        {
          id: eventId('Aarav Singh last seen at City Park, Gate 2', '2026-03-14T16:15:00'),
          description: 'Aarav Singh last seen at City Park, Gate 2',
          event_timestamp: '2026-03-14T16:15:00',
          event_timestamp_confidence: 'exact',
          location_text: 'City Park Gate 2, Shastri Nagar, Jodhpur',
          lat: 26.28,
          lng: 73.02,
          source_offset: 'FIR Complaint',
          confidence: 0.99,
        },
      ],
      relationships: [],
      contradictions: [],
    };
  }

  // ── File 2: 02_ramesh_soni_statement.txt ─────────────────────────────────
  if (fn.includes('ramesh')) {
    return {
      agencySlug: 'jodhpur',
      entities: [
        {
          id: ENT_VEHICLE,
          type: 'vehicle',
          name: 'Grey Hatchback Vehicle (Maruti Suzuki WagonR, partial plate RJ19...)',
          attributes: {
            plate_partial: 'RJ19',
            model: 'Maruti Suzuki WagonR',
            color: 'Grey',
            role: 'Suspect Vehicle',
          },
        },
      ],
      events: [
        {
          id: eventId(
            'Boy in blue t-shirt seen entering grey hatchback near City Park Gate 2, vehicle departed north toward highway',
            '2026-03-14T16:22:00'
          ),
          description:
            'Boy in blue t-shirt seen entering grey hatchback near City Park Gate 2, vehicle departed north toward highway',
          event_timestamp: '2026-03-14T16:22:00',
          event_timestamp_confidence: 'exact',
          location_text: 'City Park Gate 2, Shastri Nagar, Jodhpur',
          lat: 26.28,
          lng: 73.02,
          source_offset: 'Witness Statement',
          confidence: 0.96,
        },
      ],
      relationships: [
        {
          id: stableId('rel|aarav|vehicle|possibly traveled in'),
          source_entity_id: ENT_AARAV,
          target_entity_id: ENT_VEHICLE,
          relationship_type: 'possibly traveled in',
          description:
            "Aarav Singh was witnessed by shopkeeper Ramesh Soni entering the grey hatchback at City Park Gate 2.",
          confidence: 0.82,
          status: 'ai_suggested',
          explanation: 'Eyewitness statement of shopkeeper Ramesh Soni, recorded 14 March 2026.',
        },
      ],
      contradictions: [],
    };
  }

  // ── File 3: 03_sunita_devi_statement.txt ─────────────────────────────────
  // Trigger contradiction immediately if File 4 already exists
  if (fn.includes('sunita')) {
    const schoolAlreadyIngested = existingTitles.some((t) => t.includes('school'));
    return {
      agencySlug: 'jodhpur',
      entities: [],
      events: [
        {
          id: EVT_SUNITA_ID,
          description:
            'Neighbor Sunita Devi reports seeing Aarav Singh board the school van outside the residence',
          event_timestamp: EVT_SUNITA_TS,
          event_timestamp_confidence: 'exact',
          location_text: 'Singh Residence Neighborhood, Shastri Nagar, Jodhpur',
          lat: 26.282,
          lng: 73.024,
          source_offset: 'Witness Statement',
          confidence: 0.95,
        },
      ],
      relationships: [],
      contradictions: schoolAlreadyIngested
        ? [
            {
              id: stableId('contradiction|sunita|school'),
              event_a_id: EVT_SUNITA_ID,
              event_b_id: EVT_SCHOOL_ID,
              type: 'factual',
              description: CONTRADICTION_DESC,
              status: 'flagged',
            },
          ]
        : [],
    };
  }

  // ── File 4: 3.5_school_transport_log_14March.csv ──────────────────────────
  // Trigger contradiction immediately if File 3 already exists
  if (fn.includes('school')) {
    const sunitaAlreadyIngested = existingTitles.some((t) => t.includes('sunita'));
    return {
      agencySlug: 'jodhpur',
      entities: [],
      events: [
        {
          id: EVT_SCHOOL_ID,
          description:
            "School transport system logs Aarav Singh as Absent - Not Boarded for Route 4 pickup window",
          event_timestamp: EVT_SCHOOL_TS,
          event_timestamp_confidence: 'exact',
          location_text: 'Singh Residence Neighborhood Stop 3, Jodhpur',
          lat: 26.282,
          lng: 73.024,
          source_offset: 'Transport Record Row 2',
          confidence: 0.99,
        },
      ],
      relationships: [],
      contradictions: sunitaAlreadyIngested
        ? [
            {
              id: stableId('contradiction|sunita|school'),
              event_a_id: EVT_SUNITA_ID,
              event_b_id: EVT_SCHOOL_ID,
              type: 'factual',
              description: CONTRADICTION_DESC,
              status: 'flagged',
            },
          ]
        : [],
    };
  }

  // ── File 5: Audio tip from Kota auto driver ───────────────────────────────
  if (fn.includes('whatsapp') || fn.startsWith('4_') || fileType === 'audio') {
    const TRANSCRIPT =
      "I drive an auto near the Kota bus stand. Around six o'clock this evening I saw a man with a young boy, " +
      "the boy looked upset and wasn't talking much. I heard a child is missing from Jodhpur, so I thought I " +
      "should call and tell someone. They were near platform three.";
    return {
      agencySlug: 'kota',
      entities: [],
      events: [
        {
          id: eventId(
            'Auto-rickshaw driver reports man with distressed child near Kota bus stand, platform 3',
            '2026-03-14T18:05:00'
          ),
          description:
            'Auto-rickshaw driver reports man with distressed child near Kota bus stand, platform 3',
          event_timestamp: '2026-03-14T18:05:00',
          event_timestamp_confidence: 'approximate',
          location_text: 'Kota Bus Stand, Platform 3',
          lat: 25.182,
          lng: 75.843,
          source_offset: `Audio Transcript: "${TRANSCRIPT.slice(0, 80)}…"`,
          confidence: 0.78,
        },
      ],
      relationships: [
        {
          id: stableId('rel|audio_tip|aarav|possibly sighted with'),
          source_entity_id: stableId('entity|Auto Driver Tip Entity'),
          target_entity_id: ENT_AARAV,
          relationship_type: 'possibly sighted with',
          description:
            "Auto driver reports seeing a distressed child matching Aarav Singh's description near Kota bus stand platform 3.",
          confidence: 0.55,
          status: 'ai_suggested',
          explanation: TRANSCRIPT,
        },
      ],
      contradictions: [],
      secondaryAlert: {
        delayMs: 10000,
        targetAgency: 'kota',
        title: '🚗 Vehicle Alert — Kota CID',
        message: 'A grey hatchback (RJ19 series) linked to this case has been spotted near Kota. Vehicle last seen heading toward the bus stand area. Cross-check with NH-52 toll records immediately.',
      },
    };
  }

  // ── File 7 (PRD File 7): car_cctv.jpeg — NH-52 Toll Plaza CCTV ──────────
  if (fn.includes('cctv')) {
    return {
      agencySlug: 'kota',
      entities: [
        {
          // upsert back the same entity ID — Supabase merges, updating plate_full attribute
          id: ENT_VEHICLE,
          type: 'vehicle',
          name: 'Grey Hatchback Vehicle (Maruti Suzuki WagonR, partial plate RJ19...)',
          attributes: {
            plate_partial: 'RJ19',
            plate_full: 'RJ19E64747',
            model: 'Maruti Suzuki WagonR',
            color: 'Grey',
            role: 'Suspect Vehicle',
          },
        },
      ],
      events: [
        {
          id: eventId(
            'CCTV frame records vehicle RJ19E64747 at NH-52 Toll Plaza, Kota-bound lane 4',
            '2026-03-14T16:32:04'
          ),
          description: 'CCTV frame records vehicle RJ19E64747 at NH-52 Toll Plaza, Kota-bound lane 4',
          event_timestamp: '2026-03-14T16:32:04',
          event_timestamp_confidence: 'exact',
          location_text: 'NH-52 Toll Plaza, Kota Bound, Lane 4',
          lat: 25.21,
          lng: 75.86,
          source_offset: 'CCTV Frame — Toll Camera Overlay',
          confidence: 0.99,
        },
      ],
      relationships: [],
      contradictions: [],
    };
  }

  // ── File 8 (PRD File 8): 6_vehicle_registration_RJ19CA4700.pdf ───────────
  if (fn.includes('registration') || fn.includes('rj19ca4700')) {
    return {
      agencySlug: 'jodhpur',
      entities: [
        {
          id: ENT_VIKRAM,
          type: 'person',
          name: 'Vikram Rathore',
          attributes: {
            role: 'Vehicle Registered Owner',
            vehicle: 'Maruti Suzuki WagonR',
            plate: 'RJ19E64747',
            address: 'Shastri Nagar, Jodhpur',
          },
        },
      ],
      events: [],
      relationships: [
        {
          id: stableId('rel|vikram|vehicle|registered owner'),
          source_entity_id: ENT_VIKRAM,
          target_entity_id: ENT_VEHICLE,
          relationship_type: 'registered owner',
          description:
            'Vikram Rathore is the registered owner of the Maruti Suzuki WagonR (RJ19E64747) identified as the suspect vehicle.',
          confidence: 0.9,
          status: 'ai_suggested',
          explanation:
            'Vehicle registration document (RTO Jodhpur) links plate RJ19E64747 directly to Vikram Rathore. ' +
            'Status remains AI-suggested pending investigator verification.',
        },
      ],
      contradictions: [],
    };
  }

  // ── File 9 (PRD File 9): 7_market.jpeg — HIGH PRIORITY ALERT ────────────
  if (fn.includes('market')) {
    return {
      agencySlug: 'kota',
      highPriorityAlert: true,
      entities: [],
      events: [
        {
          id: eventId(
            "CCTV identifies child matching Aarav Singh's description at Kota Central Market",
            '2026-03-14T18:40:52'
          ),
          description: "CCTV identifies child matching Aarav Singh's description at Kota Central Market",
          event_timestamp: '2026-03-14T18:40:52',
          event_timestamp_confidence: 'exact',
          location_text: 'Kota Central Market, Camera 7',
          lat: 25.178,
          lng: 75.839,
          source_offset: 'CCTV Frame — Camera 7',
          confidence: 0.91,
        },
      ],
      relationships: [
        {
          id: stableId('rel|market_cctv|aarav|possibly sighted'),
          source_entity_id: stableId('entity|Market CCTV Sighting'),
          target_entity_id: ENT_AARAV,
          relationship_type: 'possibly sighted',
          description:
            "CCTV at Kota Central Market Camera 7 captures a child matching Aarav Singh's description at 18:40.",
          confidence: 0.91,
          status: 'ai_suggested',
          explanation: 'Automated facial-similarity match against FIR reference photo (confidence 91%).',
        },
      ],
      contradictions: [],
    };
  }

  // ── File 10 (PRD File 10): 8_tweet.png — open-source / unverified ────────
  if (fn.includes('tweet')) {
    return {
      agencySlug: 'jodhpur',
      eventTags: { source_type: 'open_source', trust_tier: 'unverified' },
      entities: [],
      events: [
        {
          id: eventId(
            'Public social media report: man walking fast with distressed-looking boy near Kota bus stand',
            '2026-03-14T18:12:00'
          ),
          description:
            'Public social media report: man walking fast with distressed-looking boy near Kota bus stand',
          event_timestamp: '2026-03-14T18:12:00',
          event_timestamp_confidence: 'approximate',
          location_text: 'Kota Bus Stand (area)',
          lat: 25.182,
          lng: 75.843,
          source_offset: 'Tweet Screenshot',
          confidence: 0.45,
        },
      ],
      relationships: [],
      contradictions: [],
    };
  }

  // No filename match → caller should run live AI extraction (or generic fallback)
  return null;
}
