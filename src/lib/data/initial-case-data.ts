import { Agency, Case, Document, Event, Entity, Relationship, Contradiction } from '@/types/investigation';

// ─────────────────────────────────────────────────────────────────────────────
// SURAG-AI — BLANK FRESH START
// All initial arrays are empty. Cases and evidence are added by officers
// via the "+ ADD NEW CASE" button in the portal header.
// ─────────────────────────────────────────────────────────────────────────────

export const CASE_ID = 'case-new-001';

export const AGENCIES: Record<string, Agency> = {
  jodhpur: {
    id: 'agency-jodhpur-01',
    name: 'Jodhpur Police Department',
    slug: 'jodhpur',
    color: '#0284c7',
    badge: 'JODHPUR-HQ',
  },
  kota: {
    id: 'agency-kota-01',
    name: 'Kota Police Commissionerate',
    slug: 'kota',
    color: '#d97706',
    badge: 'KOTA-CID',
  },
};

export const INITIAL_CASE: Case = {
  id: CASE_ID,
  name: 'NEW INVESTIGATION — ADD CASE VIA "+ ADD NEW CASE"',
  created_at: new Date().toISOString(),
};

// All empty — system starts fresh. Officers ingest evidence through the UI.
export const INITIAL_DOCUMENTS: Document[] = [];
export const INITIAL_ENTITIES: Entity[] = [];
export const INITIAL_EVENTS: Event[] = [];
export const INITIAL_RELATIONSHIPS: Relationship[] = [];
export const INITIAL_CONTRADICTIONS: Contradiction[] = [];
