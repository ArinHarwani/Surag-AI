'use client';

import React, { useState } from 'react';
import { useInvestigation } from '@/lib/store/investigation-context';
import { Entity, Relationship, EntityType } from '@/types/investigation';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Info,
  X,
  TrendingUp,
  AlertTriangle,
  GitBranch,
  Map,
  Network,
} from 'lucide-react';
import { NexusLinkGraph } from './NexusLinkGraph';
import { NexusEntityLineGraph } from './NexusEntityLineGraph';
import { NexusGeoGraphMap } from './NexusGeoGraphMap';

const TYPE_COLORS: Record<EntityType, string> = {
  person: '#10B981',
  vehicle: '#F59E0B',
  location: '#0284C7',
  weapon: '#EF4444',
  organization: '#8B5CF6',
  object: '#64748B',
};

const TYPE_ICONS: Record<EntityType, string> = {
  person: '👤',
  vehicle: '🚗',
  location: '📍',
  weapon: '🎯',
  organization: '🏢',
  object: '📦',
};

interface NexusGraphProps {
  onOpenProvenance?: (docId: string, offset: string, snippet?: string) => void;
  onOpenUpload?: () => void;
  onSelectTab?: (tab: any) => void;
}

export const NexusGraph: React.FC<NexusGraphProps> = ({
  onOpenProvenance,
  onOpenUpload,
  onSelectTab,
}) => {
  const {
    entities,
    relationships,
    agencies,
    documents,
    events,
    contradictions,
    updateRelationshipStatus,
    setProvenanceFocus,
    resetToDefaultCase,
  } = useInvestigation();

  // Primary Default View: Clean Tactical Suspects & Relations Link Graph
  const [activeView, setActiveView] = useState<'link' | 'activity' | 'geo'>('link');
  const [activeRelForModal, setActiveRelForModal] = useState<Relationship | null>(null);
  const [activeNodeForDrawer, setActiveNodeForDrawer] = useState<Entity | null>(null);

  // Connected relationships for drawer
  const activeNodeRelationships = activeNodeForDrawer
    ? relationships.filter(
        (r) =>
          r.source_entity_id === activeNodeForDrawer.id ||
          r.target_entity_id === activeNodeForDrawer.id
      )
    : [];

  // Corroborating documents
  const activeNodeDocuments = activeNodeForDrawer
    ? documents.filter((d) => {
        const name = activeNodeForDrawer.name.toLowerCase();
        return (
          (d.content_text || '').toLowerCase().includes(name) ||
          (d.title || '').toLowerCase().includes(name)
        );
      })
    : [];

  return (
    <div className="relative w-full h-full flex flex-col bg-[#EFECE6] overflow-hidden font-mono select-none text-black">
      {/* ─────────────────────────────────────────────────────────────
          TOP GRAPH MODE SWITCHER BAR
      ───────────────────────────────────────────────────────────── */}
      <div className="px-4 py-2.5 bg-white border-b-2 border-black flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
            <GitBranch className="w-4 h-4 text-black" />
            <span>INTELLIGENCE GRAPH MODE:</span>
          </span>

          <div className="flex items-center bg-[#EFECE6] border-2 border-black p-0.5 shadow-brutal text-xs font-bold">
            <button
              onClick={() => setActiveView('link')}
              className={`px-3 py-1 font-black flex items-center space-x-1.5 transition ${
                activeView === 'link'
                  ? 'bg-black text-[#F5C842]'
                  : 'text-slate-700 hover:text-black hover:bg-white'
              }`}
              title="Clean Structured Line Graph connecting Suspects, Vehicles, Weapons and Sighting Locations"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>TACTICAL LINK GRAPH (CASE BOARD)</span>
            </button>

            <button
              onClick={() => setActiveView('activity')}
              className={`px-3 py-1 font-black flex items-center space-x-1.5 transition ${
                activeView === 'activity'
                  ? 'bg-black text-[#F5C842]'
                  : 'text-slate-700 hover:text-black hover:bg-white'
              }`}
              title="Temporal Detection Intensity Curve over Time"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>TIMELINE ACTIVITY LINE GRAPH</span>
            </button>

            <button
              onClick={() => setActiveView('geo')}
              className={`px-3 py-1 font-black flex items-center space-x-1.5 transition ${
                activeView === 'geo'
                  ? 'bg-black text-[#F5C842]'
                  : 'text-slate-700 hover:text-black hover:bg-white'
              }`}
              title="OpenStreetMap Rajasthan Highway View"
            >
              <Map className="w-3.5 h-3.5" />
              <span>GEOSPATIAL MAP</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] font-bold text-slate-600 flex items-center gap-3">
          <span className="bg-[#FEF08A] text-black px-2 py-0.5 border border-black font-black">
            11 TRACKED NODES
          </span>
          <span className="bg-white text-black px-2 py-0.5 border border-black font-black">
            10 RELATIONS
          </span>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MAIN GRAPH BODY
      ───────────────────────────────────────────────────────────── */}
      <div className="w-full flex-1 overflow-y-auto relative">
        {/* VIEW 1: Tactical Link Graph (Default Clean Line Graph) */}
        {activeView === 'link' && (
          <div className="p-4 w-full h-full">
            <NexusLinkGraph
              entities={entities}
              relationships={relationships}
              contradictions={contradictions}
              agencies={agencies}
              onSelectEntity={(e) => setActiveNodeForDrawer(e)}
              onSelectRelationship={(r) => setActiveRelForModal(r)}
              onOpenProvenance={onOpenProvenance}
            />
          </div>
        )}

        {/* VIEW 2: Harshit's Timeline Activity Line Graph */}
        {activeView === 'activity' && (
          <div className="w-full h-full">
            <NexusEntityLineGraph
              entities={entities}
              events={events}
              contradictions={contradictions}
              onSelectEntity={(e) => setActiveNodeForDrawer(e)}
              onOpenProvenance={onOpenProvenance}
            />
          </div>
        )}

        {/* VIEW 3: Geospatial Map View */}
        {activeView === 'geo' && (
          <div className="w-full h-[640px] relative">
            <NexusGeoGraphMap
              entities={entities}
              relationships={relationships}
              onSelectEntity={(e) => setActiveNodeForDrawer(e)}
              onSelectRelationship={(r) => setActiveRelForModal(r)}
              selectedEntityId={activeNodeForDrawer?.id}
            />
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          CLICK ENTITY → SIDE DRAWER (Dossier & Attributes)
      ───────────────────────────────────────────────────────────── */}
      {activeNodeForDrawer && (
        <div className="absolute top-0 right-0 bottom-0 w-80 sm:w-96 bg-white border-l-2 border-black z-40 p-5 shadow-brutal flex flex-col justify-between overflow-y-auto font-mono animate-in slide-in-from-right duration-200">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between border-b-2 border-black pb-3">
              <div>
                <span
                  className="text-[10px] font-black uppercase px-2 py-0.5 border border-black inline-block mb-1.5"
                  style={{
                    backgroundColor: TYPE_COLORS[activeNodeForDrawer.type] || '#E2E8F0',
                    color: '#000000',
                  }}
                >
                  {TYPE_ICONS[activeNodeForDrawer.type]} {activeNodeForDrawer.type}
                </span>
                <h3 className="text-base font-black text-black leading-tight">
                  {activeNodeForDrawer.name}
                </h3>
                <p className="text-[10px] text-slate-600 font-bold mt-0.5">
                  FIRST SEEN: {new Date(activeNodeForDrawer.first_seen_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST
                </p>
              </div>
              <button
                onClick={() => setActiveNodeForDrawer(null)}
                className="text-black hover:bg-slate-200 p-1 border border-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Extracted Attributes */}
            <div className="space-y-1.5">
              <span className="text-xs text-black uppercase font-black tracking-wider block">
                EXTRACTED ATTRIBUTES:
              </span>
              <div className="p-3 bg-[#FBF9F5] border border-black text-xs space-y-1.5">
                {Object.entries(activeNodeForDrawer.attributes || {}).map(([k, v]) => (
                  <div
                    key={k}
                    className="flex justify-between border-b border-slate-200 pb-1 last:border-0 last:pb-0"
                  >
                    <span className="text-slate-600 capitalize font-bold">{k.replace(/_/g, ' ')}:</span>
                    <span className="text-black font-black text-right max-w-[180px] truncate">
                      {String(v)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* List of Relationships for this Entity */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-black uppercase font-black tracking-wider">
                  RELATIONSHIPS ({activeNodeRelationships.length}):
                </span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {activeNodeRelationships.map((rel) => {
                  const isSource = rel.source_entity_id === activeNodeForDrawer.id;
                  const otherId = isSource ? rel.target_entity_id : rel.source_entity_id;
                  const otherEntity = entities.find((e) => e.id === otherId);

                  return (
                    <div
                      key={rel.id}
                      className="p-2.5 bg-[#FBF9F5] border border-black text-xs space-y-1 hover:bg-white transition"
                    >
                      <div className="flex items-center justify-between font-black">
                        <span className="text-black">{rel.relationship_type.toUpperCase()}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 border ${
                            rel.status === 'confirmed'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-600'
                              : 'bg-amber-100 text-amber-800 border-amber-600'
                          }`}
                        >
                          {Math.round((rel.confidence || 0.8) * 100)}%
                        </span>
                      </div>
                      <div className="text-slate-700 text-[11px] font-bold">
                        Linked: <span className="text-black font-black">{otherEntity?.name || 'Target'}</span>
                      </div>
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => setActiveRelForModal(rel)}
                          className="text-[10px] font-black text-blue-700 hover:underline flex items-center space-x-0.5"
                        >
                          <span>VIEW EVIDENCE &amp; ARBITRATE →</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* List of Source Documents */}
            <div className="space-y-1.5">
              <span className="text-xs text-black uppercase font-black tracking-wider block">
                SOURCE EVIDENCE DOSSIERS ({activeNodeDocuments.length}):
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {activeNodeDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2 bg-[#FBF9F5] border border-black flex items-center justify-between text-xs hover:bg-white transition"
                  >
                    <div className="truncate pr-2">
                      <span className="text-black font-black block truncate">{doc.title}</span>
                      <span className="text-[10px] text-slate-600 font-bold uppercase">
                        {doc.file_type} • {doc.uploaded_by}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (onOpenProvenance) {
                          onOpenProvenance(doc.id, 'Citation offset', doc.content_text?.slice(0, 100));
                        } else {
                          setProvenanceFocus({
                            documentId: doc.id,
                            sourceOffset: 'Line 1-10',
                            title: doc.title,
                            mediaType: doc.file_type,
                            snippet: doc.content_text,
                          });
                        }
                      }}
                      className="px-2 py-1 bg-white hover:bg-slate-100 border border-black text-[10px] font-black uppercase shrink-0"
                    >
                      PROVENANCE
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t-2 border-black">
            <button
              onClick={() => setActiveNodeForDrawer(null)}
              className="w-full py-2 bg-black text-white hover:bg-slate-900 text-xs font-black transition uppercase"
            >
              CLOSE INSPECTION
            </button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CLICK EDGE → RELATIONSHIP DETAIL POPOVER
      ───────────────────────────────────────────────────────────── */}
      {activeRelForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black max-w-xl w-full p-5 shadow-brutal-lg space-y-4 animate-in fade-in zoom-in-95 duration-150 text-black font-mono">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#F5C842] border-2 border-black text-black font-black">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-700 uppercase font-black tracking-wider">
                      RELATIONSHIP DISCOVERY
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 font-black uppercase border border-black ${
                        activeRelForModal.status === 'confirmed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-[#F5C842] text-black'
                      }`}
                    >
                      {activeRelForModal.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-black mt-0.5 tracking-wide uppercase">
                    {activeRelForModal.relationship_type}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setActiveRelForModal(null)}
                className="text-black hover:bg-slate-200 p-1 border border-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Connected Entities Banner */}
            <div className="p-3 bg-[#FBF9F5] border-2 border-black flex items-center justify-between text-xs">
              <div className="text-[#0284C7] font-black truncate max-w-[40%]">
                {entities.find((e) => e.id === activeRelForModal.source_entity_id)?.name || 'Source'}
              </div>
              <span className="text-black font-black text-xs px-2 shrink-0">
                ──[{activeRelForModal.relationship_type}]──▶
              </span>
              <div className="text-[#D97706] font-black truncate max-w-[40%] text-right">
                {entities.find((e) => e.id === activeRelForModal.target_entity_id)?.name || 'Target'}
              </div>
            </div>

            {/* Why connected? */}
            <div className="space-y-1.5">
              <div className="text-xs text-black uppercase font-black flex items-center gap-1.5">
                <Info className="w-4 h-4 text-black" />
                <span>WHY ARE THESE ENTITIES CONNECTED?</span>
              </div>
              <div className="p-3 bg-[#FBF9F5] border border-black text-xs text-slate-900 leading-relaxed font-sans font-medium">
                {activeRelForModal.explanation ||
                  activeRelForModal.description ||
                  'Relationship inferred through multi-modal intelligence extraction and temporal-spatial co-occurrence.'}
              </div>
            </div>

            {/* Source Provenance Citation */}
            <div className="p-3 bg-white border border-black space-y-1">
              <div className="text-[10px] text-slate-600 font-bold uppercase">
                SOURCE PROVENANCE CITATION:
              </div>
              <blockquote className="text-xs italic text-black font-serif border-l-2 border-black pl-2 py-0.5">
                "{activeRelForModal.description || 'Co-occurrence detected across CCTV and ANPR logs.'}"
              </blockquote>
              <div className="flex items-center justify-between text-[10px] pt-1">
                <span className="text-slate-600 font-bold">
                  {documents.find((d) => activeRelForModal.source_document_ids?.includes(d.id))?.title || 'Investigative Dossier'}
                </span>
                <span className="bg-black text-white px-1.5 py-0.2">
                  CITATION REF: {activeRelForModal.source_document_ids?.[0] || 'DOC-REF'}
                </span>
              </div>
            </div>

            {/* Action Buttons: HITL Confirmation */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-black">
              <button
                onClick={() => {
                  updateRelationshipStatus(activeRelForModal.id, 'dismissed');
                  setActiveRelForModal(null);
                }}
                className="px-4 py-2 border-2 border-black text-black hover:bg-slate-100 font-black text-xs shadow-brutal flex items-center space-x-1.5"
              >
                <XCircle className="w-3.5 h-3.5 text-red-600" />
                <span>DISMISS LINK</span>
              </button>

              <button
                onClick={() => {
                  updateRelationshipStatus(activeRelForModal.id, 'confirmed');
                  setActiveRelForModal(null);
                }}
                className="px-4 py-2 bg-[#10B981] hover:bg-emerald-600 text-black font-black text-xs border-2 border-black shadow-brutal flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                <span>CONFIRM AS FACT</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
