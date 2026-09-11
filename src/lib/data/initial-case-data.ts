import { Agency, Case, Document, Event, Entity, Relationship, Contradiction } from '@/types/investigation';

export const CASE_ID = 'case-aarav-singh-001';

export const AGENCIES: Record<string, Agency> = {
  jodhpur: {
    id: 'agency-jodhpur-01',
    name: 'Jodhpur Police Department',
    slug: 'jodhpur',
    color: '#0284c7', // Cobalt Blue
    badge: 'JODHPUR-HQ',
  },
  kota: {
    id: 'agency-kota-01',
    name: 'Kota Police Commissionerate',
    slug: 'kota',
    color: '#d97706', // Tactical Amber
    badge: 'KOTA-CID',
  },
};

export const INITIAL_CASE: Case = {
  id: CASE_ID,
  name: 'OPERATION MARWAR: SYNDICATE NEXUS (AARAV SINGH)',
  created_at: '2026-09-10T18:00:00Z',
};

// Real Demo Case: Aarav Singh Investigation (PRD Section 8 Contract)
export const INITIAL_DOCUMENTS: Document[] = [
  {
    id: 'doc-jod-witness-01',
    case_id: CASE_ID,
    agency_id: 'agency-jodhpur-01',
    uploaded_by: 'Inspector S. Rathore (Jodhpur PD)',
    title: 'Evidence 1: Witness Statement #042 (Rajiv Rathore)',
    file_type: 'text',
    storage_path: 'evidence/jodhpur/JOD-EVIDENCE-01-WITNESS.txt',
    content_text: `CONFIDENTIAL POLICE MEMORANDUM // JODHPUR POLICE HQ
DATE: 10-SEPT-2026 23:15 IST
OFFICER IN CHARGE: Inspector S. Rathore

WITNESS STATEMENT (Citizen ID: 884-219-RJ):
"At approximately 22:30 IST on 10th September 2026, I witnessed suspect Aarav Singh driving White Scorpio (RJ-19-UB-4022) near Mehrangarh Fort South Ascent. He stopped by the Clock Tower and transferred a military-grade encrypted duffel to an unidentified contact wearing an olive jacket before speeding toward Sojati Gate."`,
    status: 'processed',
    uploaded_at: '2026-09-10T23:15:00Z'
  },
  {
    id: 'doc-kota-cctv-02',
    case_id: CASE_ID,
    agency_id: 'agency-kota-01',
    uploaded_by: 'Inspector V. Meena (Kota CID)',
    title: 'Evidence 2: ANPR CCTV Log #118 (Chambal River Bridge)',
    file_type: 'text',
    storage_path: 'evidence/kota/KOTA-EVIDENCE-02-CCTV-LOG.txt',
    content_text: `KOTA POLICE COMMISSIONERATE // SPECIAL INTELLIGENCE UNIT
INCIDENT LOG #KOTA-SIU-2026-118
SURVEILLANCE UNIT: Chambal Sector Bridge Camera #09 & Toll Plaza

REPORT:
"Automated ANPR and field observer Constable Meena logged suspect Aarav Singh exiting Silver Bolero (RJ-20-CA-8812) at Chambal River Bridge toll plaza, Kota at precisely 22:45 IST on 10th September 2026. Suspect purchased supplies at Nayapura Market adjacent to the bridge. Facial match confidence: 91.4%."`,
    status: 'processed',
    uploaded_at: '2026-09-10T23:45:00Z'
  },
  {
    id: 'doc-wiretap-audio-03',
    case_id: CASE_ID,
    agency_id: 'agency-kota-01',
    uploaded_by: 'Kota Technical Intercept Unit',
    title: 'Evidence 3: Tactical Radio Intercept #09A (Rawatbhata Safehouse)',
    file_type: 'audio',
    storage_path: 'evidence/kota/WIRE-INTERCEPT-09A.mp3',
    media_url: 'https://actions.google.com/sounds/v1/emergency/police_radio_chatter.ogg',
    content_text: `[AUDIO TRANSCRIPT // CELL INTERCEPT #9A]
TIME: 2026-09-11 01:15:00 IST
[00:05] S1 (Static): Radio check channel 4.
[00:14] S1 (Voice Match - Devendra Sharma): "The drop in Kota is compromised. Move the consignment south toward Rawatbhata Highway immediately."
[00:24] S2: "Understood. The Bolero is fueled. Devendra Sharma is escorting the convoy himself."
[00:33] S1: "Meet at milestone 14 safehouse before dawn."`,
    status: 'processed',
    uploaded_at: '2026-09-11T01:20:00Z'
  },
  {
    id: 'doc-cctv-optical-04',
    case_id: CASE_ID,
    agency_id: 'agency-jodhpur-01',
    uploaded_by: 'State Highway Patrol Unit 4',
    title: 'Evidence 4: Optical Camera Frame #04 (Nayapura Barrier)',
    file_type: 'image',
    storage_path: 'evidence/jodhpur/CCTV-FRAME-KOTA-TOLL-0230.png',
    content_text: `IMAGE METADATA & OCR TELEMETRY:
Frame: Nayapura Toll Plaza Camera 04-NightVision
Timestamp: 2026-09-11 02:30:18 IST
Visual Detection:
- Weapon detected: Glock 19 9mm Semi-Automatic Pistol (Confidence: 94.2%)
- Bounding Box: [120, 450, 280, 620]
- Cabin Associate: Devendra Sharma (Armed Escort).`,
    status: 'processed',
    uploaded_at: '2026-09-11T02:35:00Z'
  }
];

export const INITIAL_ENTITIES: Entity[] = [
  {
    id: 'ent-aarav-singh',
    case_id: CASE_ID,
    agency_id: 'agency-jodhpur-01',
    name: 'Aarav Singh',
    type: 'person',
    attributes: { 
      role: 'Prime Suspect / Syndicate Logistics',
      alias: 'Tiger',
      status: 'High Value Target',
      danger_level: 'Armed & Guarded'
    },
    first_seen_at: '2026-09-10T19:00:00Z'
  },
  {
    id: 'ent-scorpio-white',
    case_id: CASE_ID,
    agency_id: 'agency-jodhpur-01',
    name: 'White Scorpio (RJ-19-UB-4022)',
    type: 'vehicle',
    attributes: {
      model: 'Mahindra Scorpio Classic S11',
      color: 'Pearl White',
      plate: 'RJ-19-UB-4022',
      tinted: true
    },
    first_seen_at: '2026-09-10T19:05:00Z'
  },
  {
    id: 'ent-bolero-silver',
    case_id: CASE_ID,
    agency_id: 'agency-kota-01',
    name: 'Silver Mahindra Bolero Neo (RJ-20-CA-8812) with Chambal Markings',
    type: 'vehicle',
    attributes: {
      model: 'Mahindra Bolero Neo N10',
      color: 'Metallic Silver',
      plate: 'RJ-20-CA-8812',
      registered_to: 'Chambal Logistics Network & Cross-Border Transport Wing'
    },
    first_seen_at: '2026-09-10T22:45:00Z'
  },
  {
    id: 'ent-devendra-sharma',
    case_id: CASE_ID,
    agency_id: 'agency-kota-01',
    name: 'Devendra Sharma',
    type: 'person',
    attributes: {
      role: 'Armed Escort Commander',
      organization: 'Chambal Logistics Network',
      prior_records: 'Arms Act 2024'
    },
    first_seen_at: '2026-09-11T01:15:00Z'
  },
  {
    id: 'ent-chambal-syndicate',
    case_id: CASE_ID,
    agency_id: 'agency-kota-01',
    name: 'Chambal Logistics Network & Cross-District Contraband Syndicate (Inter-State Module)',
    type: 'organization',
    attributes: {
      jurisdiction: 'Kota / Hadoti Border',
      nature: 'Contraband Transit Syndicate'
    },
    first_seen_at: '2026-09-10T22:45:00Z'
  },
  {
    id: 'ent-glock-pistol',
    case_id: CASE_ID,
    agency_id: 'agency-jodhpur-01',
    name: 'Glock 19 (9mm Pistol)',
    type: 'weapon',
    attributes: {
      caliber: '9mm Parabellum',
      serial: 'Obliterated',
      status: 'Optical Detection 94.2%'
    },
    first_seen_at: '2026-09-11T02:30:00Z'
  },
  {
    id: 'ent-burner-sim',
    case_id: CASE_ID,
    agency_id: 'agency-kota-01',
    name: 'Burner SIM (IMEI-98421094)',
    type: 'object',
    attributes: {},
    first_seen_at: '2026-09-11T01:15:00Z'
  }
];

export const INITIAL_EVENTS: Event[] = [
  {
    id: 'evt-bilara-transit',
    case_id: CASE_ID,
    document_id: 'doc-jod-witness-01',
    description: 'White Scorpio RJ-19-UB-4022 crosses Bilara Toll Plaza heading toward Kota',
    event_timestamp: '2026-09-10T21:15:00Z',
    event_timestamp_confidence: 'exact',
    location_text: 'Bilara Toll Plaza, NH-25',
    lat: 26.1824,
    lng: 73.7112,
    source_offset: 'Line 1-4',
    confidence: 0.96,
    created_at: '2026-09-10T21:20:00Z'
  },
  {
    id: 'evt-jod-clocktower',
    case_id: CASE_ID,
    document_id: 'doc-jod-witness-01',
    description: 'Aarav Singh sighted handing over encrypted duffel near Mehrangarh Clock Tower',
    event_timestamp: '2026-09-10T22:30:00Z',
    event_timestamp_confidence: 'exact',
    location_text: 'Mehrangarh Clock Tower, Jodhpur',
    lat: 26.2978,
    lng: 73.0232,
    source_offset: 'Line 5-8',
    confidence: 0.94,
    created_at: '2026-09-10T22:35:00Z'
  },
  {
    id: 'evt-kota-chambal',
    case_id: CASE_ID,
    document_id: 'doc-kota-cctv-02',
    description: 'Aarav Singh logged exiting Silver Bolero at Chambal River Bridge toll plaza',
    event_timestamp: '2026-09-10T22:45:00Z',
    event_timestamp_confidence: 'exact',
    location_text: 'Chambal River Bridge, Kota',
    lat: 25.1825,
    lng: 75.8398,
    source_offset: 'Line 5-8',
    confidence: 0.91,
    created_at: '2026-09-10T23:00:00Z'
  },
  {
    id: 'evt-audio-diversion',
    case_id: CASE_ID,
    document_id: 'doc-wiretap-audio-03',
    description: 'Radio Wiretap: Convoy ordered to divert south toward Rawatbhata Highway milestone 14',
    event_timestamp: '2026-09-11T01:15:00Z',
    event_timestamp_confidence: 'approximate',
    location_text: 'Rawatbhata Highway Safehouse, NH-52',
    lat: 24.9333,
    lng: 75.5833,
    source_offset: '00:02:14',
    confidence: 0.92,
    created_at: '2026-09-11T01:20:00Z'
  },
  {
    id: 'evt-cctv-weapon',
    case_id: CASE_ID,
    document_id: 'doc-cctv-optical-04',
    description: 'Optical CCTV frame: Devendra Sharma brandishing Glock 19 sidearm in cabin',
    event_timestamp: '2026-09-11T02:30:00Z',
    event_timestamp_confidence: 'exact',
    location_text: 'Nayapura Toll Barrier, Kota Border',
    lat: 25.1950,
    lng: 75.8450,
    source_offset: 'bbox [120,450,280,620]',
    confidence: 0.94,
    created_at: '2026-09-11T02:35:00Z'
  },
  {
    id: 'evt-unverified-relay',
    case_id: CASE_ID,
    document_id: 'doc-wiretap-audio-03',
    description: 'Unverified relay burst ping from cell repeater near MP border checkpoint (triangulation pending)',
    event_timestamp: '2026-09-11T01:15:00Z',
    event_timestamp_confidence: 'approximate',
    location_text: 'Border Checkpoint Sector 4 (Unmapped Coordinates)',
    lat: undefined,
    lng: undefined,
    source_offset: '00:03:02',
    confidence: 0.48,
    created_at: '2026-09-11T01:25:00Z'
  }
];

export const INITIAL_RELATIONSHIPS: Relationship[] = [
  {
    id: 'rel-aarav-scorpio',
    case_id: CASE_ID,
    source_entity_id: 'ent-aarav-singh',
    target_entity_id: 'ent-scorpio-white',
    relationship_type: 'traveled_in',
    description: 'Aarav Singh verified operator and occupant of White Scorpio',
    confidence: 0.96,
    status: 'confirmed',
    source_document_ids: ['doc-jod-witness-01'],
    explanation: 'FASTag RFID #9941 and Mehrangarh toll ANPR confirmed Aarav Singh at the wheel.',
    created_at: '2026-09-10T21:20:00Z'
  },
  {
    id: 'rel-aarav-bolero',
    case_id: CASE_ID,
    source_entity_id: 'ent-aarav-singh',
    target_entity_id: 'ent-bolero-silver',
    relationship_type: 'traveled_in',
    description: 'Observed exiting Silver Bolero at Chambal River Bridge toll plaza',
    confidence: 0.91,
    status: 'ai_suggested',
    source_document_ids: ['doc-kota-cctv-02'],
    explanation: 'CCTV Camera #09 facial recognition match confidence 91.4% with known suspect profile.',
    created_at: '2026-09-10T23:00:00Z'
  },
  {
    id: 'rel-devendra-bolero',
    case_id: CASE_ID,
    source_entity_id: 'ent-devendra-sharma',
    target_entity_id: 'ent-bolero-silver',
    relationship_type: 'traveled_in',
    description: 'Personally commanding and escorting Silver Bolero convoy',
    confidence: 0.89,
    status: 'ai_suggested',
    source_document_ids: ['doc-wiretap-audio-03'],
    explanation: 'Wiretap transcript timecode 00:24: "Devendra Sharma is escorting the convoy himself."',
    created_at: '2026-09-11T01:20:00Z'
  },
  {
    id: 'rel-devendra-weapon',
    case_id: CASE_ID,
    source_entity_id: 'ent-devendra-sharma',
    target_entity_id: 'ent-glock-pistol',
    relationship_type: 'linked_to',
    description: 'Optical detection brandishing weapon in passenger seat at Nayapura Toll',
    confidence: 0.94,
    status: 'ai_suggested',
    source_document_ids: ['doc-cctv-optical-04'],
    explanation: 'NightVision CCTV frame detected Glock 19 sidearm inside Bolero cabin bbox [120,450,280,620].',
    created_at: '2026-09-11T02:35:00Z'
  },
  {
    id: 'rel-devendra-sim',
    case_id: CASE_ID,
    source_entity_id: 'ent-devendra-sharma',
    target_entity_id: 'ent-burner-sim',
    relationship_type: 'linked_to',
    description: 'Tentative burner SIM association via radio cell tower triangulation (unconfirmed match)',
    confidence: 0.52,
    status: 'ai_suggested',
    source_document_ids: ['doc-wiretap-audio-03'],
    explanation: 'Wiretap burst ping signal correlation suggests burner handset in transit convoy.',
    created_at: '2026-09-11T01:25:00Z'
  }
];

export const INITIAL_CONTRADICTIONS: Contradiction[] = [
  {
    id: 'contra-aarav-speed-temporal',
    case_id: CASE_ID,
    event_a_id: 'evt-jod-clocktower',
    event_b_id: 'evt-kota-chambal',
    type: 'temporal',
    description: 'TEMPORAL CONTRADICTION DETECTED: Event A (Mehrangarh Clock Tower, Jodhpur @ 22:30 IST) and Event B (Chambal River Bridge, Kota @ 22:45 IST) cannot both be true. Geographic distance is ~390 km across NH-27, requiring an impossible transit velocity of ~1,560 km/h. Probable cause: Body-double decoy, cloned license plates, or falsified surveillance logging.',
    status: 'flagged',
    created_at: '2026-09-10T23:05:00Z'
  }
];
