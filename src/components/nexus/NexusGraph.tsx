'use client';

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useInvestigation } from '@/lib/store/investigation-context';
import { Entity, Relationship, EntityType, Document } from '@/types/investigation';
import {
  Filter,
  Search,
  Maximize2,
  Sparkles,
  CheckCircle2,
  XCircle,
  Eye,
  Layers,
  ShieldCheck,
  Radio,
  ExternalLink,
  ChevronRight,
  Info,
  X,
  Map,
  Columns,
  Network
} from 'lucide-react';
import { NexusGeoGraphMap } from './NexusGeoGraphMap';

// Dynamic import with SSR disabled because react-force-graph uses window & canvas
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-[#EFECE6] text-black font-mono text-xs border-2 border-black">
      <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mb-3" />
      <span className="font-black tracking-widest">INITIALIZING FUSION KNOWLEDGE GRAPH...</span>
    </div>
  ),
});

const TYPE_COLORS: Record<EntityType, string> = {
  person: '#10B981', // Emerald
  vehicle: '#F59E0B', // Amber
  location: '#06B6D4', // Cyan
  weapon: '#EF4444', // Red
  organization: '#8B5CF6', // Purple
  object: '#64748B', // Slate
};

interface NexusGraphProps {
  onOpenProvenance?: (docId: string, offset: string, snippet?: string) => void;
}

export const NexusGraph: React.FC<NexusGraphProps> = ({ onOpenProvenance }) => {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 620 });

  const {
    entities,
    relationships,
    agencies,
    activeAgency,
    documents,
    events,
    updateRelationshipStatus,
    setProvenanceFocus,
  } = useInvestigation();

  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'map' | 'force' | 'split'>('map');
  const [activeRelForModal, setActiveRelForModal] = useState<Relationship | null>(null);
  const [activeNodeForDrawer, setActiveNodeForDrawer] = useState<Entity | null>(null);

  // Resize listener
  useEffect(() => {
    const updateDims = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 900,
          height: containerRef.current.clientHeight || 620,
        });
      }
    };
    updateDims();
    window.addEventListener('resize', updateDims);
    return () => window.removeEventListener('resize', updateDims);
  }, []);

  // Filter nodes & links
  const graphData = useMemo(() => {
    let filteredEntities = entities;

    if (activeAgency !== 'all') {
      const targetAgencyId = agencies[activeAgency]?.id;
      filteredEntities = entities.filter(
        (e) => !e.agency_id || e.agency_id === targetAgencyId
      );
    }

    if (selectedTypeFilter !== 'all') {
      filteredEntities = filteredEntities.filter((e) => e.type === selectedTypeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filteredEntities = filteredEntities.filter(
        (e) => e.name.toLowerCase().includes(q) || e.type.toLowerCase().includes(q)
      );
    }

    const entityIdSet = new Set(filteredEntities.map((e) => e.id));

    const activeLinks = relationships
      .filter((r) => entityIdSet.has(r.source_entity_id) && entityIdSet.has(r.target_entity_id))
      .map((r) => ({
        ...r,
        source: r.source_entity_id,
        target: r.target_entity_id,
      }));

    const activeNodes = filteredEntities.map((e) => ({
      ...e,
      val: e.type === 'person' ? 9 : 7,
      color: TYPE_COLORS[e.type] || '#64748B',
    }));

    return { 
      nodes: activeNodes, 
      links: activeLinks,
      rawEntities: filteredEntities,
      rawRelationships: relationships.filter((r) => entityIdSet.has(r.source_entity_id) && entityIdSet.has(r.target_entity_id))
    };
  }, [entities, relationships, activeAgency, agencies, selectedTypeFilter, searchQuery]);

  // Custom node rendering for crisp command canvas aesthetic on light theme
  const paintNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const radius = (node.val || 7) * 1.5;
      const label = node.name || 'UNKNOWN';
      const fontSize = 11 / Math.max(0.6, Math.min(globalScale, 2.5));

      // Glow effect for selected node
      const isSelected = activeNodeForDrawer?.id === node.id;
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 8, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'rgba(245, 200, 66, 0.45)';
        ctx.fill();
      }

      // Outer agency ring with black border
      let agencyColor = '#000000';
      if (node.agency_id === agencies.jodhpur?.id) agencyColor = '#0284C7'; // Jodhpur Blue
      if (node.agency_id === agencies.kota?.id) agencyColor = '#D97706'; // Kota Amber

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 3, 0, 2 * Math.PI, false);
      ctx.fillStyle = agencyColor;
      ctx.fill();

      // Inner entity body
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = node.color || '#F5C842';
      ctx.fill();

      // Center core
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius * 0.4, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Node label badge (crisp white tag with black border and black text)
      if (globalScale > 0.6) {
        const displayLabel = label.length > 24 ? label.slice(0, 22) + '…' : label;
        ctx.font = `800 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textWidth = ctx.measureText(displayLabel).width;
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;

        // Label rect
        const rx = node.x - textWidth / 2 - 6;
        const ry = node.y + radius + 4;
        const rw = textWidth + 12;
        const rh = fontSize + 6;

        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx, ry, rw, rh);

        ctx.fillStyle = '#000000';
        ctx.fillText(displayLabel, node.x, node.y + radius + fontSize / 2 + 7);
      }
    },
    [activeNodeForDrawer, agencies]
  );

  const getLinkColor = useCallback((link: any) => {
    if (link.status === 'confirmed') return '#10B981';
    if (link.status === 'ai_suggested') return '#D97706';
    return '#94A3B8';
  }, []);

  const handleLinkClick = (link: any) => {
    const rawRel = relationships.find((r) => r.id === link.id);
    if (rawRel) {
      setActiveRelForModal(rawRel);
    }
  };

  const handleZoomFit = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 30);
    }
  };

  const filterButtons: { label: string; value: string; count: number }[] = [
    { label: 'ALL', value: 'all', count: entities.length },
    { label: 'PERSON', value: 'person', count: entities.filter((e) => e.type === 'person').length },
    { label: 'VEHICLE', value: 'vehicle', count: entities.filter((e) => e.type === 'vehicle').length },
    { label: 'LOCATION', value: 'location', count: entities.filter((e) => e.type === 'location').length },
    { label: 'WEAPON', value: 'weapon', count: entities.filter((e) => e.type === 'weapon').length },
    { label: 'ORGANIZATION', value: 'organization', count: entities.filter((e) => e.type === 'organization').length },
  ];

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[620px] bg-[#EFECE6] flex flex-col overflow-hidden font-mono select-none text-black">
      {/* Top Tactical Command HUD (Light theme with black borders) */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Filter Pills & Search */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto bg-white border-2 border-black p-1.5 shadow-brutal">
          <div className="flex items-center gap-1 px-1.5 text-xs text-black uppercase font-black">
            <Filter className="w-3.5 h-3.5 text-black" />
            <span>TYPE:</span>
          </div>

          <div className="flex items-center gap-1">
            {filterButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setSelectedTypeFilter(btn.value)}
                className={`px-2 py-0.5 text-xs font-black transition flex items-center gap-1 border ${
                  selectedTypeFilter === btn.value
                    ? 'bg-[#F5C842] text-black border-black shadow-xs'
                    : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>{btn.label}</span>
                <span className="text-[10px] px-1 bg-black/10 text-black font-bold">
                  {btn.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative ml-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
            <input
              type="text"
              placeholder="SEARCH GRAPH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#FBF9F5] border border-black text-black text-xs rounded-none pl-7 pr-3 py-0.5 outline-none w-36 focus:w-52 focus:bg-white transition-all font-sans font-bold"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1.5 text-slate-500 hover:text-black"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Center: Graph View Mode Switcher (OpenStreetMap vs Force vs Split) */}
        <div className="flex items-center bg-white border-2 border-black p-1 shadow-brutal pointer-events-auto text-xs font-bold">
          <button
            onClick={() => setViewMode('map')}
            className={`px-3 py-1 text-xs font-black flex items-center space-x-1.5 transition ${
              viewMode === 'map'
                ? 'bg-[#F5C842] text-black border border-black shadow-xs'
                : 'text-slate-700 hover:text-black hover:bg-slate-100'
            }`}
          >
            <Map className="w-3.5 h-3.5 text-black" />
            <span>OPENSTREETMAP GEO-GRAPH</span>
          </button>

          <button
            onClick={() => setViewMode('force')}
            className={`px-3 py-1 text-xs font-black flex items-center space-x-1.5 transition ${
              viewMode === 'force'
                ? 'bg-[#F5C842] text-black border border-black shadow-xs'
                : 'text-slate-700 hover:text-black hover:bg-slate-100'
            }`}
          >
            <Network className="w-3.5 h-3.5 text-black" />
            <span>TOPOLOGY FORCE</span>
          </button>

          <button
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 text-xs font-black flex items-center space-x-1.5 transition ${
              viewMode === 'split'
                ? 'bg-[#F5C842] text-black border border-black shadow-xs'
                : 'text-slate-700 hover:text-black hover:bg-slate-100'
            }`}
          >
            <Columns className="w-3.5 h-3.5 text-black" />
            <span>SPLIT</span>
          </button>
        </div>

        {/* Right: Legend & Recenter */}
        <div className="flex items-center gap-3 pointer-events-auto bg-white border-2 border-black px-3 py-1.5 shadow-brutal text-xs font-bold">
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] border border-black" />
              <span className="text-black text-[11px]">JODHPUR</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] border border-black" />
              <span className="text-black text-[11px]">KOTA</span>
            </div>
            <div className="flex items-center gap-1 border-l border-black pl-2">
              <span className="w-3 h-1 bg-[#D97706]" />
              <span className="text-[#D97706] font-black text-[10px]">SUGGESTED</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-1 bg-[#10B981]" />
              <span className="text-emerald-700 font-black text-[10px]">CONFIRMED</span>
            </div>
          </div>

          <button
            onClick={handleZoomFit}
            title="Recenter & Fit Graph"
            className="p-1 bg-white border border-black hover:bg-slate-100 text-black shadow-xs transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area: OpenStreetMap Geo-Graph, Force Graph, or Split */}
      <div className="w-full h-full flex-1 flex flex-col pt-16 relative">
        {viewMode === 'map' && (
          <div className="w-full h-full flex-1 relative">
            <NexusGeoGraphMap
              entities={graphData.rawEntities}
              relationships={graphData.rawRelationships}
              onSelectEntity={(e) => setActiveNodeForDrawer(e)}
              onSelectRelationship={(r) => setActiveRelForModal(r)}
              selectedEntityId={activeNodeForDrawer?.id}
              searchQuery={searchQuery}
            />
          </div>
        )}

        {viewMode === 'force' && (
          <div className="w-full h-full flex-1 relative">
            <ForceGraph2D
              ref={fgRef}
              width={dimensions.width}
              height={dimensions.height - 70}
              graphData={graphData}
              backgroundColor="#EFECE6"
              nodeCanvasObject={paintNode}
              nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(node.x, node.y, (node.val || 7) * 2, 0, 2 * Math.PI, false);
                ctx.fill();
              }}
              linkLabel={(l: any) =>
                `${l.relationship_type.toUpperCase()} • ${Math.round(l.confidence * 100)}% CONFIDENCE • CLICK TO ARBITRATE`
              }
              linkColor={getLinkColor}
              linkWidth={(l: any) => (l.status === 'confirmed' ? 2.5 : 2)}
              linkDirectionalParticles={(l: any) => (l.status === 'ai_suggested' ? 4 : 1)}
              linkDirectionalParticleSpeed={(l: any) => (l.status === 'ai_suggested' ? 0.006 : 0.002)}
              linkDirectionalParticleWidth={2.5}
              linkDirectionalParticleColor={(l: any) => (l.status === 'ai_suggested' ? '#D97706' : '#10B981')}
              linkDirectionalArrowLength={4}
              linkDirectionalArrowRelPos={1}
              linkCurvature={0.12}
              onNodeClick={(node: any) => {
                const raw = entities.find((e) => e.id === node.id);
                if (raw) setActiveNodeForDrawer(raw);
              }}
              onLinkClick={handleLinkClick}
              cooldownTicks={120}
              d3VelocityDecay={0.25}
            />
          </div>
        )}

        {viewMode === 'split' && (
          <div className="w-full h-full flex-1 grid grid-cols-1 lg:grid-cols-2 gap-2 p-2">
            <div className="w-full h-full min-h-[400px]">
              <NexusGeoGraphMap
                entities={graphData.rawEntities}
                relationships={graphData.rawRelationships}
                onSelectEntity={(e) => setActiveNodeForDrawer(e)}
                onSelectRelationship={(r) => setActiveRelForModal(r)}
                selectedEntityId={activeNodeForDrawer?.id}
                searchQuery={searchQuery}
              />
            </div>
            <div className="w-full h-full min-h-[400px] border-2 border-black bg-[#EFECE6] relative overflow-hidden shadow-brutal">
              <ForceGraph2D
                ref={fgRef}
                width={dimensions.width ? Math.floor(dimensions.width / 2) - 10 : 450}
                height={dimensions.height - 80}
                graphData={graphData}
                backgroundColor="#EFECE6"
                nodeCanvasObject={paintNode}
                nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
                  ctx.fillStyle = color;
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, (node.val || 7) * 2, 0, 2 * Math.PI, false);
                  ctx.fill();
                }}
                linkLabel={(l: any) =>
                  `${l.relationship_type.toUpperCase()} • ${Math.round(l.confidence * 100)}% CONFIDENCE`
                }
                linkColor={getLinkColor}
                linkWidth={(l: any) => (l.status === 'confirmed' ? 2.5 : 2)}
                linkDirectionalParticles={(l: any) => (l.status === 'ai_suggested' ? 4 : 1)}
                linkDirectionalParticleSpeed={(l: any) => (l.status === 'ai_suggested' ? 0.006 : 0.002)}
                linkDirectionalParticleWidth={2.5}
                linkDirectionalParticleColor={(l: any) => (l.status === 'ai_suggested' ? '#D97706' : '#10B981')}
                linkDirectionalArrowLength={4}
                linkDirectionalArrowRelPos={1}
                linkCurvature={0.12}
                onNodeClick={(node: any) => {
                  const raw = entities.find((e) => e.id === node.id);
                  if (raw) setActiveNodeForDrawer(raw);
                }}
                onLinkClick={handleLinkClick}
                cooldownTicks={120}
                d3VelocityDecay={0.25}
              />
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {graphData.nodes.length === 0 && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
          <div className="p-6 bg-white border-2 border-black rounded-none max-w-md space-y-2 shadow-brutal">
            <Layers className="w-8 h-8 text-black mx-auto" />
            <h4 className="text-sm font-black text-black uppercase tracking-wider">Awaiting Fusion Data</h4>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              No matching entities found for active filters. Ingest evidence files or clear filter queries to render the knowledge graph.
            </p>
          </div>
        </div>
      )}

      {/* HITL Relationship Explanation & Arbitration Modal */}
      {activeRelForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-black rounded-none max-w-xl w-full p-5 shadow-brutal-lg space-y-4 animate-in fade-in zoom-in-95 duration-150 text-black font-mono">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b-2 border-black pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#F5C842] border-2 border-black text-black font-black">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-700 uppercase font-black tracking-wider">
                      GRAPHRAG ARBITRATION
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
                  <h3 className="text-base font-black text-black mt-0.5 tracking-wide">
                    {activeRelForModal.relationship_type.replace(/_/g, ' ')}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setActiveRelForModal(null)}
                className="text-black hover:bg-slate-200 p-1 border border-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Entities Linked */}
            <div className="p-3 bg-[#FBF9F5] border-2 border-black flex items-center justify-between text-xs">
              <div className="text-[#0284C7] font-black">
                {entities.find((e) => e.id === activeRelForModal.source_entity_id)?.name || 'Source Entity'}
              </div>
              <span className="text-black font-bold text-xs px-2">
                ─── [{activeRelForModal.relationship_type}] ───▶
              </span>
              <div className="text-[#D97706] font-black">
                {entities.find((e) => e.id === activeRelForModal.target_entity_id)?.name || 'Target Entity'}
              </div>
            </div>

            {/* AI Explanation / Reasoning */}
            <div className="space-y-1.5">
              <div className="text-xs text-black uppercase font-black flex items-center gap-1.5">
                <Info className="w-4 h-4 text-black" />
                <span>RELATIONSHIP RATIONALE &amp; EXTRACTED EVIDENCE</span>
              </div>
              <div className="p-3 bg-[#FBF9F5] border border-black text-xs text-slate-900 leading-relaxed font-sans font-medium">
                {activeRelForModal.explanation || activeRelForModal.description || 'Relationship inferred through cross-document entity extraction and semantic coreference resolution.'}
              </div>
            </div>

            {/* Cited Evidence Files */}
            <div className="space-y-1.5">
              <span className="text-xs text-black uppercase font-black">
                SUPPORTING EVIDENCE DOSSIERS ({activeRelForModal.source_document_ids?.length || 0}):
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {activeRelForModal.source_document_ids?.map((docId) => {
                  const doc = documents.find((d) => d.id === docId);
                  return (
                    <div
                      key={docId}
                      className="p-2.5 bg-white border border-black flex items-center justify-between text-xs hover:bg-[#FBF9F5] transition"
                    >
                      <div className="truncate pr-3">
                        <span className="text-black font-black mr-2">[{docId.slice(0, 12)}]</span>
                        <span className="text-slate-800 text-xs font-bold">{doc?.title || 'Classified Case File'}</span>
                      </div>
                      <button
                        onClick={() => {
                          setActiveRelForModal(null);
                          if (onOpenProvenance) {
                            onOpenProvenance(docId, 'Source citation', doc?.content_text?.slice(0, 200));
                          } else {
                            setProvenanceFocus({
                              documentId: docId,
                              sourceOffset: 'Line 1-10',
                              title: doc?.title,
                              mediaType: doc?.file_type,
                              snippet: doc?.content_text,
                            });
                          }
                        }}
                        className="text-black hover:bg-slate-100 flex items-center gap-1 text-xs uppercase font-black shrink-0 px-2 py-1 border border-black"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>INSPECT</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer with Confidence & HITL Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t-2 border-black">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-700 font-bold">CONFIDENCE:</span>
                <span className="text-xs font-black text-emerald-800">
                  {Math.round((activeRelForModal.confidence || 0.85) * 100)}% AI CONFIDENCE
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    updateRelationshipStatus(activeRelForModal.id, 'dismissed');
                    setActiveRelForModal(null);
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-black text-red-700 text-xs font-black transition"
                >
                  DISMISS LINK
                </button>

                <button
                  onClick={() => {
                    updateRelationshipStatus(activeRelForModal.id, 'confirmed');
                    setActiveRelForModal(null);
                  }}
                  className="px-4 py-1.5 bg-[#F5C842] hover:bg-[#EAB308] text-black font-black text-xs border border-black shadow-sm transition"
                >
                  CONFIRM AS FACT
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Node Detail Drawer */}
      {activeNodeForDrawer && (
        <div className="absolute right-4 top-16 bottom-4 w-84 bg-white border-2 border-black p-4 shadow-brutal-lg z-30 flex flex-col justify-between font-mono animate-in slide-in-from-right duration-200 text-black">
          <div className="space-y-3 overflow-y-auto">
            <div className="flex items-start justify-between border-b-2 border-black pb-2.5">
              <div>
                <span
                  className="text-[10px] px-2 py-0.5 font-black uppercase tracking-wider text-black border border-black"
                  style={{
                    backgroundColor: `${TYPE_COLORS[activeNodeForDrawer.type]}40`,
                  }}
                >
                  {activeNodeForDrawer.type}
                </span>
                <h3 className="text-sm font-black text-black mt-1.5">{activeNodeForDrawer.name}</h3>
              </div>
              <button
                onClick={() => setActiveNodeForDrawer(null)}
                className="text-black hover:bg-slate-100 p-1 border border-black"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Attributes */}
            <div className="space-y-1">
              <span className="text-xs text-black uppercase font-black tracking-wider">RECORD ATTRIBUTES:</span>
              <div className="p-3 bg-[#FBF9F5] border border-black text-xs space-y-1.5">
                {Object.entries(activeNodeForDrawer.attributes || {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-slate-200 pb-1 last:border-0 last:pb-0">
                    <span className="text-slate-600 capitalize font-bold">{k}:</span>
                    <span className="text-black font-black">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Associated Events */}
            <div className="space-y-1">
              <span className="text-xs text-black uppercase font-black tracking-wider">CONNECTED INCIDENTS:</span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {events
                  .filter((ev) => (ev.description || '').toLowerCase().includes(activeNodeForDrawer.name.toLowerCase()))
                  .map((ev) => (
                    <div key={ev.id} className="p-2 bg-[#FBF9F5] border border-black text-xs">
                      <div className="text-black font-black">{ev.event_timestamp.slice(11, 16)} IST • {ev.location_text}</div>
                      <div className="text-slate-800 text-[11px] line-clamp-2 mt-0.5 font-sans font-medium">{ev.description}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t-2 border-black">
            <button
              onClick={() => setActiveNodeForDrawer(null)}
              className="w-full py-2 bg-black text-white hover:bg-slate-900 text-xs font-black transition"
            >
              CLOSE INSPECTION
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
