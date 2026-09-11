export type FileType = 'text' | 'image' | 'audio' | 'video';
export type AgencySlug = 'jodhpur' | 'kota' | 'jaipur' | 'ajmer' | 'jaisalmer';
export type ConnectionRequestStatus = 'pending' | 'accepted' | 'rejected';
export type DocStatus = 'uploaded' | 'processing' | 'processed' | 'failed';
export type TimestampConfidence = 'exact' | 'approximate' | 'inferred';
export type EntityType = 'person' | 'vehicle' | 'location' | 'weapon' | 'object' | 'organization';
export type RelationshipStatus = 'ai_suggested' | 'confirmed' | 'dismissed';
export type ContradictionType = 'temporal' | 'spatial' | 'factual';
export type ContradictionStatus = 'flagged' | 'reviewed' | 'dismissed';

export interface Agency {
  id: string;
  name: string;
  slug: AgencySlug;
  color: string;
  badge: string;
}

export interface Case {
  id: string;
  name: string;
  created_at: string;
}

export interface Document {
  id: string;
  case_id: string;
  agency_id: string;
  uploaded_by: string;
  title: string;
  file_type: FileType;
  storage_path?: string;
  content_text?: string;
  media_url?: string;
  metadata?: Record<string, unknown>;
  status: DocStatus;
  uploaded_at: string;
}

export interface Event {
  id: string;
  case_id: string;
  document_id: string;
  description: string;
  event_timestamp: string; // ISO string
  event_timestamp_confidence: TimestampConfidence;
  location_text: string;
  lat?: number;
  lng?: number;
  source_offset: string; // "Line 14-22", "02:45", "bbox [120,450,280,620]"
  confidence: number;
  created_at: string;
}

export interface Entity {
  id: string;
  case_id: string;
  agency_id?: string;
  type: EntityType;
  name: string;
  attributes: Record<string, string | number | boolean | null>;
  first_seen_at: string;
}

export interface EntityMention {
  id: string;
  entity_id: string;
  document_id: string;
  event_id?: string;
  source_snippet: string;
  source_offset: string;
  confidence: number;
}

export interface Relationship {
  id: string;
  case_id: string;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  description: string;
  confidence: number;
  status: RelationshipStatus;
  source_document_ids: string[];
  explanation?: string; // GraphRAG one-click citation
  created_at: string;
}

export interface ConnectionRequest {
  id: string;
  case_id: string;
  case_name: string; // snapshot at time of request
  requesting_agency_slug: AgencySlug;
  target_agency_slug: AgencySlug;
  case_brief_snapshot: string;
  media_url?: string;
  file_type?: string;
  status: ConnectionRequestStatus;
  created_at: string;
  responded_at?: string;
}

export interface Contradiction {
  id: string;
  case_id: string;
  event_a_id: string;
  event_b_id: string;
  type: ContradictionType;
  description: string;
  status: ContradictionStatus;
  created_at: string;
}

// Graph node and link interfaces for react-force-graph
export interface GraphNode {
  id: string;
  name: string;
  type: EntityType;
  agency_id?: string;
  first_seen_at: string;
  attributes: Record<string, unknown>;
  val?: number; // node size
  color?: string;
  x?: number;
  y?: number;
}

export interface GraphLink {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  relationship_type: string;
  description: string;
  confidence: number;
  status: RelationshipStatus;
  explanation?: string;
  source_document_ids: string[];
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}
