import { Agency, Case, Document, Event, Entity, Relationship, Contradiction } from '@/types/investigation';

export const CASE_ID = 'case-active-001';

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
  name: 'Active Collaborative Investigation',
  created_at: new Date().toISOString(),
};

// Clean State: All sample cases removed. Ready for user's fresh demo case.
export const INITIAL_DOCUMENTS: Document[] = [];
export const INITIAL_ENTITIES: Entity[] = [];
export const INITIAL_EVENTS: Event[] = [];
export const INITIAL_RELATIONSHIPS: Relationship[] = [];
export const INITIAL_CONTRADICTIONS: Contradiction[] = [];
