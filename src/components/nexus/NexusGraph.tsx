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
  X
} from 'lucide-react';

// Dynamic import with SSR disabled because react-force-graph uses window & canvas
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-[#090A0D] text-[#8E929B] font-mono text-xs">
      <div className="w-6 h-6 border-2 border-[#F4C430] border-t-transparent rounded-full animate-spin mb-3" />
      <span className="tracking-widest">INITIALIZING FUSION KNOWLEDGE GRAPH...</span>
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
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });

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
  const [activeRelForModal, setActiveRelForModal] = useState<Relationship | null>(null);
  const [activeNodeForDrawer, setActiveNodeForDrawer] = useState<Entity | null>(null);

  // Resize listener
  useEffect(() => {
    const updateDims = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 900,
          height: containerRef.current.clientHeight || 600,
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

    return { nodes: activeNodes, links: activeLinks };
  }, [entities, relationships, activeAgency, agencies, selectedTypeFilter, searchQuery]);

  // Custom node rendering for crisp command canvas aesthetic
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
        ctx.fillStyle = 'rgba(244, 196, 48, 0.25)';
        ctx.fill();
      }

      // Outer agency ring
      let agencyColor = '#3F4452';
      if (node.agency_id === agencies.jodhpur?.id) agencyColor = '#06B6D4'; // Jodhpur Cyan
      if (node.agency_id === agencies.kota?.id) agencyColor = '#F59E0B'; // Kota Amber

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 2.5, 0, 2 * Math.PI, false);
      ctx.fillStyle = agencyColor;
      ctx.fill();

      // Inner entity body
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = node.color || '#F4C430';
      ctx.fill();

      // Center core
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius * 0.45, 0, 2 * Math.PI, false);
      ctx.fillStyle = '#090A0D';
      ctx.fill();

      // Node label badge (truncated cleanly if long)
      if (globalScale > 0.6) {
        const displayLabel = label.length > 24 ? label.slice(0, 22) + '…' : label;
        ctx.font = `700 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textWidth = ctx.measureText(displayLabel).width;
        ctx.fillStyle = 'rgba(9, 10, 13, 0.95)';
        ctx.strokeStyle = agencyColor;
        ctx.lineWidth = 1.5;

        // Label rect
        const rx = node.x - textWidth / 2 - 6;
        const ry = node.y + radius + 4;
        const rw = textWidth + 12;
        const rh = fontSize + 6;

        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx, ry, rw, rh);

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(displayLabel, node.x, node.y + radius + fontSize / 2 + 7);
      }
    },
    [activeNodeForDrawer, agencies]
  );

  const getLinkColor = useCallback((link: any) => {
    if (link.status === 'confirmed') return '#10B981';
    if (link.status === 'ai_suggested') return '#F4C430';
    return '#3F4452';
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
    <div ref={containerRef} className="relative w-full h-full min-h-[620px] bg-[#090A0D] flex flex-col overflow-hidden font-mono select-none">
      {/* Top Tactical Command HUD */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Filter Pills & Search */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto bg-[#12141A]/95 border border-[#232731] p-1.5 rounded shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-1 px-2 text-[10px] text-[#8E929B] uppercase font-bold tracking-wider">
            <Filter className="w-3 h-3 text-[#F4C430]" />
            <span>TYPE:</span>
          </div>

          <div className="flex items-center gap-1">
            {filterButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setSelectedTypeFilter(btn.value)}
                className={`px-2.5 py-1 text-[10px] font-bold rounded transition flex items-center gap-1.5 ${
                  selectedTypeFilter === btn.value
                    ? 'bg-[#F4C430] text-black font-extrabold shadow-md shadow-[#F4C430]/20'
                    : 'bg-[#181B22] text-[#8E929B] hover:text-white hover:bg-[#232731]'
                }`}
              >
                <span>{btn.label}</span>
                <span className={`text-[9px] px-1 rounded ${
                  selectedTypeFilter === btn.value ? 'bg-black/20 text-black' : 'bg-black/40 text-[#8E929B]'
                }`}>
                  {btn.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative ml-2">
            <Search className="w-3 h-3 text-[#8E929B] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="SEARCH GRAPH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#090A0D] border border-[#232731] text-white text-[11px] rounded pl-8 pr-3 py-1 outline-none w-40 focus:w-56 focus:border-[#F4C430] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-2 text-[#8E929B] hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Legend & Controls */}
        <div className="flex items-center gap-3 pointer-events-auto bg-[#12141A]/95 border border-[#232731] px-3 py-1.5 rounded shadow-2xl backdrop-blur-md text-[10px]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#06B6D4]" />
              <span className="text-[#8E929B]">JODHPUR</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
              <span className="text-[#8E929B]">KOTA</span>
            </div>
            <div className="flex items-center gap-1.5 border-l border-[#232731] pl-3">
              <span className="w-3 h-0.5 bg-[#F4C430]" />
              <span className="text-[#F4C430] font-bold">AI SUGGESTED</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-[#10B981]" />
              <span className="text-[#10B981] font-bold">CONFIRMED</span>
            </div>
          </div>

          <button
            onClick={handleZoomFit}
            title="Recenter & Fit Graph"
            className="ml-2 p-1.5 bg-[#181B22] border border-[#232731] hover:border-[#F4C430] text-[#8E929B] hover:text-[#F4C430] rounded transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Force Graph Canvas Area */}
      <div className="w-full h-full flex-1">
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          backgroundColor="#090A0D"
          nodeCanvasObject={paintNode}
          nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, (node.val || 7) * 2, 0, 2 * Math.PI, false);
            ctx.fill();
          }}
          linkLabel={(l: any) =>
            `${l.relationship_type.toUpperCase()} • ${Math.round(l.confidence * 100)}% CONFIDENCE • CLICK TO INSPECT`
          }
          linkColor={getLinkColor}
          linkWidth={(l: any) => (l.status === 'confirmed' ? 2.5 : 1.8)}
          linkDirectionalParticles={(l: any) => (l.status === 'ai_suggested' ? 4 : 1)}
          linkDirectionalParticleSpeed={(l: any) => (l.status === 'ai_suggested' ? 0.006 : 0.002)}
          linkDirectionalParticleWidth={2.5}
          linkDirectionalParticleColor={(l: any) => (l.status === 'ai_suggested' ? '#F4C430' : '#10B981')}
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

      {/* Empty State */}
      {graphData.nodes.length === 0 && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
          <div className="p-5 bg-[#12141A]/95 border border-[#232731] rounded-lg max-w-md space-y-2 backdrop-blur shadow-2xl">
            <Layers className="w-8 h-8 text-[#F4C430] mx-auto opacity-80" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Awaiting Fusion Data</h4>
            <p className="text-[11px] text-[#8E929B] leading-relaxed">
              No matching entities found for active filters. Ingest evidence files or clear filter queries to render the knowledge graph.
            </p>
          </div>
        </div>
      )}

      {/* HITL Relationship Explanation & Arbitration Modal */}
      {activeRelForModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#12141A] border border-[#232731] rounded-lg max-w-xl w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#232731] pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#F4C430]/10 border border-[#F4C430]/30 rounded text-[#F4C430]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#8E929B] uppercase tracking-wider">
                      GRAPHRAG HITL ARBITRATION
                    </span>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-extrabold uppercase ${
                        activeRelForModal.status === 'confirmed'
                          ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/40'
                          : 'bg-[#F4C430]/20 text-[#F4C430] border border-[#F4C430]/40'
                      }`}
                    >
                      {activeRelForModal.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-white mt-0.5 tracking-wide">
                    {activeRelForModal.relationship_type.replace(/_/g, ' ')}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setActiveRelForModal(null)}
                className="text-[#8E929B] hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Entities Linked */}
            <div className="p-3 bg-[#090A0D] border border-[#232731] rounded flex items-center justify-between text-xs">
              <div className="text-[#06B6D4] font-bold">
                {entities.find((e) => e.id === activeRelForModal.source_entity_id)?.name || 'Source Entity'}
              </div>
              <span className="text-[#8E929B] text-[10px] px-2">
                ─── [{activeRelForModal.relationship_type}] ───▶
              </span>
              <div className="text-[#F59E0B] font-bold">
                {entities.find((e) => e.id === activeRelForModal.target_entity_id)?.name || 'Target Entity'}
              </div>
            </div>

            {/* AI Explanation / Reasoning */}
            <div className="space-y-1.5">
              <div className="text-[10px] text-[#8E929B] uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#F4C430]" />
                <span>RELATIONSHIP RATIONALE & EXTRACTED EVIDENCE</span>
              </div>
              <div className="p-3 bg-[#090A0D] border border-[#232731] rounded text-[11px] text-[#EDE9E0] leading-relaxed">
                {activeRelForModal.explanation || activeRelForModal.description || 'Relationship inferred through cross-document entity extraction and semantic coreference resolution.'}
              </div>
            </div>

            {/* Cited Evidence Files */}
            <div className="space-y-1.5">
              <span className="text-[10px] text-[#8E929B] uppercase tracking-wider">
                SUPPORTING EVIDENCE DOSSIERS ({activeRelForModal.source_document_ids?.length || 0}):
              </span>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {activeRelForModal.source_document_ids?.map((docId) => {
                  const doc = documents.find((d) => d.id === docId);
                  return (
                    <div
                      key={docId}
                      className="p-2.5 bg-[#090A0D] border border-[#232731] rounded flex items-center justify-between text-xs hover:border-[#F4C430] transition"
                    >
                      <div className="truncate pr-3">
                        <span className="text-[#F4C430] font-bold mr-2">[{docId.slice(0, 12)}]</span>
                        <span className="text-white text-[11px]">{doc?.title || 'Classified Case File'}</span>
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
                        className="text-[#F4C430] hover:text-white flex items-center gap-1 text-[10px] uppercase font-bold shrink-0 bg-[#F4C430]/10 px-2 py-1 rounded border border-[#F4C430]/30"
                      >
                        <Eye className="w-3 h-3" />
                        <span>INSPECT</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer with Confidence & HITL Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-[#232731]">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300 font-bold">CONFIDENCE:</span>
                <span className="text-xs font-black text-[#10B981]">
                  {Math.round((activeRelForModal.confidence || 0.85) * 100)}% AI CONFIDENCE
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    updateRelationshipStatus(activeRelForModal.id, 'dismissed');
                    setActiveRelForModal(null);
                  }}
                  className="px-3 py-1.5 bg-[#181B22] hover:bg-[#232731] border border-[#EF4444]/40 text-[#EF4444] text-[11px] font-bold rounded flex items-center gap-1.5 transition"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>DISMISS LINK</span>
                </button>

                <button
                  onClick={() => {
                    updateRelationshipStatus(activeRelForModal.id, 'confirmed');
                    setActiveRelForModal(null);
                  }}
                  className="px-3.5 py-1.5 bg-[#10B981] hover:bg-[#059669] text-black font-extrabold text-[11px] rounded flex items-center gap-1.5 transition shadow-lg shadow-[#10B981]/20"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>CONFIRM AS FACT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Node Detail Drawer */}
      {activeNodeForDrawer && (
        <div className="absolute right-4 top-16 bottom-4 w-80 bg-[#12141A]/95 border border-[#232731] rounded-lg p-4 shadow-2xl backdrop-blur-md z-30 flex flex-col justify-between font-mono animate-in slide-in-from-right duration-200">
          <div className="space-y-3 overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#232731] pb-2.5">
              <div>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${TYPE_COLORS[activeNodeForDrawer.type]}20`,
                    color: TYPE_COLORS[activeNodeForDrawer.type],
                    border: `1px solid ${TYPE_COLORS[activeNodeForDrawer.type]}40`,
                  }}
                >
                  {activeNodeForDrawer.type}
                </span>
                <h3 className="text-sm font-extrabold text-white mt-1">{activeNodeForDrawer.name}</h3>
              </div>
              <button
                onClick={() => setActiveNodeForDrawer(null)}
                className="text-[#8E929B] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Attributes */}
            <div className="space-y-1">
              <span className="text-[10px] text-[#8E929B] uppercase font-bold tracking-wider">RECORD ATTRIBUTES:</span>
              <div className="p-2.5 bg-[#090A0D] border border-[#232731] rounded text-[11px] space-y-1">
                {Object.entries(activeNodeForDrawer.attributes || {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-[#181B22] pb-1 last:border-0 last:pb-0">
                    <span className="text-[#8E929B] capitalize">{k}:</span>
                    <span className="text-[#EDE9E0] font-bold">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Associated Events */}
            <div className="space-y-1">
              <span className="text-[10px] text-[#8E929B] uppercase font-bold tracking-wider">CONNECTED INCIDENTS:</span>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {events
                  .filter((ev) => ev.description.toLowerCase().includes(activeNodeForDrawer.name.toLowerCase()))
                  .map((ev) => (
                    <div key={ev.id} className="p-2 bg-[#090A0D] border border-[#232731] rounded text-[10px]">
                      <div className="text-[#F4C430] font-bold">{ev.event_timestamp.slice(11, 16)} IST • {ev.location_text}</div>
                      <div className="text-[#EDE9E0] text-[10px] line-clamp-2 mt-0.5">{ev.description}</div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-[#232731]">
            <button
              onClick={() => setActiveNodeForDrawer(null)}
              className="w-full py-1.5 bg-[#181B22] hover:bg-[#232731] text-[#8E929B] hover:text-white text-[11px] font-bold rounded transition"
            >
              CLOSE INSPECTION
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
