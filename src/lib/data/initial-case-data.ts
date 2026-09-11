import { Agency, Case, Document, Event, Entity, Relationship, Contradiction } from '@/types/investigation';

export const CASE_ID = 'case-active-01';

export const AGENCIES: Record<string, Agency> = {
  jodhpur: {
    id: 'agency-jodhpur-01',
    name: 'Jodhpur Police (Commissionerate West)',
    slug: 'jodhpur',
    color: '#06b6d4', // Cyan
    badge: 'JPD-CRIME',
  },
  kota: {
    id: 'agency-kota-01',
    name: 'Kota Police (City Crime Branch)',
    slug: 'kota',
    color: '#f59e0b', // Amber
    badge: 'KPD-INTEL',
  },
};

export const INITIAL_CASE: Case = {
  id: CASE_ID,
  name: 'Active Collaborative Investigation',
  created_at: new Date().toISOString(),
};

// Clean state: User will provide their sample case
export const INITIAL_DOCUMENTS: Document[] = [];
export const INITIAL_ENTITIES: Entity[] = [];
export const INITIAL_EVENTS: Event[] = [];
export const INITIAL_RELATIONSHIPS: Relationship[] = [];
export const INITIAL_CONTRADICTIONS: Contradiction[] = [];
