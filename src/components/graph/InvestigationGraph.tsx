'use client';

import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useInvestigation } from '@/lib/store/investigation-context';
import { Entity, Relationship, EntityType, GraphNode, GraphLink } from '@/types/investigation';
import {
  Filter,
  Search,
  Maximize2,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  Layers,
} from 'lucide-react';

// Dynamic import with SSR disabled because react-force-graph uses window & canvas
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 font-mono text-xs">
      <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-2" />
      <span>INITIALIZING POSTGRES GRAPH VISUALIZATION...</span>
    </div>
  ),
});

const TYPE_COLORS: Record<EntityType, string> = {
  person: '#10b981', // Emerald
  vehicle: '#f59e0b', // Amber
  location: '#06b6d4', // Cyan
  weapon: '#f43f5e', // Rose
  organization: '#a855f7', // Purple
  object: '#64748b', // Slate
};

export function InvestigationGraph() {
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const {
    entities,
    relationships,
    agencies,
    activeAgency,
    selectedEntity,
    selectedRelationship,
    setSelectedEntity,
    setSelectedRelationship,
    setProvenanceFocus,
    updateRelationshipStatus,
    documents,
  } = useInvestigation();

  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showExplanationModal, setShowExplanationModal] = useState<boolean>(false);
  const [activeRelForModal, setActiveRelForModal] = useState<Relationship | null>(null);

  // Measure container dimensions
  useEffect(() => {
    const updateDims = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth || 800,
          height: containerRef.current.clientHeight || 600,
        });
      }
    };
    updateDims();
    window.addEventListener('resize', updateDims);
    return () => window.removeEventListener('resize', updateDims);
  }, []);

  // Filter nodes and links based on UI filters
  const graphData = useMemo(() => {
    let filteredEntities = entities;

    // Filter by agency if agency portal is selected
    if (activeAgency !== 'all') {
      const targetAgencyId = agencies[activeAgency]?.id;
      filteredEntities = entities.filter(
        (e) => !e.agency_id || e.agency_id === targetAgencyId
      );
    }

    // Filter by entity type
    if (selectedTypeFilter !== 'all') {
      filteredEntities = filteredEntities.filter((e) => e.type === selectedTypeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filteredEntities = filteredEntities.filter((e) => e.name.toLowerCase().includes(q));
    }

    const entityIdSet = new Set(filteredEntities.map((e) => e.id));

    const nodes: GraphNode[] = filteredEntities.map((e) => {
      let agencyColor = '#94a3b8';
      if (e.agency_id === agencies.jodhpur?.id) agencyColor = agencies.jodhpur.color;
      if (e.agency_id === agencies.kota?.id) agencyColor = agencies.kota.color;

      return {
        id: e.id,
        name: e.name,
        type: e.type,
        agency_id: e.agency_id,
        first_seen_at: e.first_seen_at,
        attributes: e.attributes,
        val: e.type === 'person' || e.type === 'vehicle' ? 8 : 6,
        color: TYPE_COLORS[e.type] || '#64748b',
      };
    });

    const links: GraphLink[] = relationships
      .filter((r) => entityIdSet.has(r.source_entity_id) && entityIdSet.has(r.target_entity_id))
      .map((r) => ({
        id: r.id,
        source: r.source_entity_id,
        target: r.target_entity_id,
        relationship_type: r.relationship_type,
        description: r.description,
        confidence: r.confidence,
        status: r.status,
        explanation: r.explanation,
        source_document_ids: r.source_document_ids,
      }));

    return { nodes, links };
  }, [entities, relationships, activeAgency, agencies, selectedTypeFilter, searchQuery]);

  // Canvas Node rendering
  const paintNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const label = node.name;
      const fontSize = 11 / globalScale;
      const radius = (node.val || 6) * 1.5;

      // Glow halo if selected
      const isSelected = selectedEntity?.id === node.id;
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 5, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
        ctx.fill();
      }

      // Outer ring for agency color
      let agencyBorder = '#64748b';
      if (node.agency_id === agencies.jodhpur?.id) agencyBorder = '#06b6d4'; // Jodhpur cyan
      if (node.agency_id === agencies.kota?.id) agencyBorder = '#f59e0b'; // Kota amber

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 2, 0, 2 * Math.PI, false);
      ctx.fillStyle = agencyBorder;
      ctx.fill();

      // Node inner body
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = node.color || '#38bdf8';
      ctx.fill();

      // Node label
      if (globalScale > 0.6) {
        ctx.font = `600 ${fontSize}px Inter, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Background pill behind text
        const textWidth = ctx.measureText(label).width;
        ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
        ctx.fillRect(
          node.x - textWidth / 2 - 3,
          node.y + radius + 3,
          textWidth + 6,
          fontSize + 4
        );

        ctx.fillStyle = '#f8fafc';
        ctx.fillText(label, node.x, node.y + radius + fontSize / 2 + 5);
      }
    },
    [selectedEntity, agencies]
  );

  // Link styling callback
  const getLinkColor = useCallback((link: any) => {
    if (link.status === 'ai_suggested') return '#fbbf24'; // Amber pulse
    if (link.status === 'confirmed') return '#10b981'; // Emerald solid
    return '#475569'; // Dismissed dark slate
  }, []);

  // Handle link click -> GraphRAG explanation modal ("Why do you think these are connected?")
  const handleLinkClick = (link: any) => {
    const rawRel = relationships.find((r) => r.id === link.id);
    if (rawRel) {
      setActiveRelForModal(rawRel);
      setShowExplanationModal(true);
    }
  };

  // Zoom to fit
  const handleZoomFit = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 30);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-slate-950 flex flex-col overflow-hidden">
      {/* Tactical Graph Controls Header */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Filters */}
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 border border-slate-800 rounded-lg p-1.5 backdrop-blur shadow-xl">
          <div className="flex items-center gap-1.5 px-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono">Filter:</span>
          </div>

          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 outline-none font-mono"
          >
            <option value="all">All Entity Types</option>
            <option value="person">Persons</option>
            <option value="vehicle">Vehicles</option>
            <option value="location">Locations</option>
            <option value="weapon">Weapons</option>
            <option value="organization">Organizations</option>
          </select>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
            <input
              type="text"
              placeholder="Locate entity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded pl-6 pr-2 py-1 outline-none w-36 focus:w-48 transition-all font-mono"
            />
          </div>
        </div>

        {/* Right: Legend & Actions */}
        <div className="flex items-center gap-2 pointer-events-auto bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 backdrop-blur text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="text-slate-300">Jodhpur</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-slate-300">Kota</span>
            </div>
            <div className="flex items-center gap-1 border-l border-slate-700 pl-3">
              <span className="w-2.5 h-0.5 bg-amber-400" />
              <span className="text-amber-300">AI Suggested</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-0.5 bg-emerald-400" />
              <span className="text-emerald-300">Confirmed</span>
            </div>
          </div>

          <button
            onClick={handleZoomFit}
            title="Fit to Screen"
            className="ml-2 p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Force Graph Canvas */}
      <div className="w-full h-full flex-1">
        <ForceGraph2D
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          nodeLabel={(n: any) => `${n.name} (${n.type.toUpperCase()})`}
          nodeCanvasObject={paintNode}
          nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, (node.val || 6) * 2, 0, 2 * Math.PI, false);
            ctx.fill();
          }}
          linkLabel={(l: any) =>
            `${l.relationship_type} (${Math.round(l.confidence * 100)}% conf) - Click for source explanation`
          }
          linkColor={getLinkColor}
          linkWidth={(l: any) => (l.status === 'confirmed' ? 2.5 : 1.8)}
          linkDirectionalArrowLength={4}
          linkDirectionalArrowRelPos={1}
          linkCurvature={0.12}
          onNodeClick={(node: any) => {
            const raw = entities.find((e) => e.id === node.id);
            if (raw) setSelectedEntity(raw);
          }}
          onLinkClick={handleLinkClick}
          cooldownTicks={120}
          d3VelocityDecay={0.3}
        />
      </div>

      {/* Empty State Overlay */}
      {graphData.nodes.length === 0 && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none p-6 text-center">
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl max-w-sm space-y-2 backdrop-blur shadow-2xl">
            <Layers className="w-8 h-8 text-cyan-400 mx-auto opacity-70" />
            <h4 className="text-xs font-bold text-slate-200 font-mono uppercase">Awaiting Entity Discovery</h4>
            <p className="text-[11px] text-slate-400">
              No entities in graph yet. Ingest statements, audio, or CCTV files to render the cross-agency relationship graph.
            </p>
          </div>
        </div>
      )}

      {/* Click-to-Explain GraphRAG Relationship Modal */}
      {showExplanationModal && activeRelForModal && (
        <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Relationship GraphRAG Explanation
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        activeRelForModal.status === 'confirmed'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {activeRelForModal.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-100 mt-1">
                    {activeRelForModal.relationship_type}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setShowExplanationModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {/* Entities Involved */}
            <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between text-xs font-mono">
              <div className="text-cyan-400 font-semibold">
                {entities.find((e) => e.id === activeRelForModal.source_entity_id)?.name || 'Source'}
              </div>
              <span className="text-slate-500">━━ {activeRelForModal.relationship_type} ━━▶</span>
              <div className="text-amber-400 font-semibold">
                {entities.find((e) => e.id === activeRelForModal.target_entity_id)?.name || 'Target'}
              </div>
            </div>

            {/* Core Question: Why do you think these are connected? */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5 font-mono">
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>"Why do you think these are connected?"</span>
              </h4>
              <div className="p-3 bg-slate-950/90 border border-cyan-500/30 rounded-lg text-xs text-slate-200 leading-relaxed font-sans">
                {activeRelForModal.explanation || activeRelForModal.description}
              </div>
            </div>

            {/* Source Provenance Citation */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-mono text-slate-400">Cited Evidence Documents:</span>
              <div className="space-y-1">
                {activeRelForModal.source_document_ids.map((docId) => {
                  const doc = documents.find((d) => d.id === docId);
                  return (
                    <div
                      key={docId}
                      className="p-2 bg-slate-950 border border-slate-800 rounded flex items-center justify-between text-xs"
                    >
                      <div className="truncate pr-2">
                        <span className="font-mono text-cyan-400 mr-2">[{docId}]</span>
                        <span className="text-slate-300">{doc?.title || 'Classified Case File'}</span>
                      </div>
                      <button
                        onClick={() => {
                          setShowExplanationModal(false);
                          setProvenanceFocus({
                            documentId: docId,
                            sourceOffset: 'Line 1-10',
                            title: doc?.title,
                            mediaType: doc?.file_type,
                            snippet: doc?.content_text,
                          });
                        }}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] font-mono shrink-0"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect Source</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Confidence Metric */}
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800 pt-3">
              <span>Confidence Score:</span>
              <span className="text-emerald-400 font-bold">
                {Math.round(activeRelForModal.confidence * 100)}% Gxd-Verified
              </span>
            </div>

            {/* HITL Confirm / Dismiss Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  updateRelationshipStatus(activeRelForModal.id, 'dismissed');
                  setShowExplanationModal(false);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-md flex items-center gap-1.5 transition"
              >
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                <span>Dismiss Link</span>
              </button>

              <button
                onClick={() => {
                  updateRelationshipStatus(activeRelForModal.id, 'confirmed');
                  setShowExplanationModal(false);
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md flex items-center gap-1.5 transition shadow-lg shadow-emerald-600/30"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm as Fact</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
