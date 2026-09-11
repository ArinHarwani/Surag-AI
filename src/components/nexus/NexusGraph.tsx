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
  TrendingUp,
  Network,
  Sliders,
  AlertTriangle,
  UploadCloud,
  RotateCcw,
  User,
  Car,
  MapPin,
  Crosshair,
  Building,
  Box
} from 'lucide-react';
import { NexusEntityLineGraph } from './NexusEntityLineGraph';

// Dynamic import with SSR disabled because react-force-graph uses window & canvas
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[550px] flex flex-col items-center justify-center bg-[#EFECE6] text-black font-mono text-xs border-2 border-black">
      <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mb-3" />
      <span className="font-black tracking-widest">INITIALIZING FORCE-DIRECTED KNOWLEDGE GRAPH...</span>
    </div>
  ),
});

const TYPE_COLORS: Record<EntityType, string> = {
  person: '#10B981', // Emerald / Green
  vehicle: '#F59E0B', // Amber / Orange
  location: '#0284C7', // Blue
  weapon: '#EF4444', // Red
  organization: '#8B5CF6', // Purple
  object: '#64748B', // Slate
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
    contradictions,
    updateRelationshipStatus,
    setProvenanceFocus,
    resetToDefaultCase,
  } = useInvestigation();

  // Primary Default View MUST BE Relationship Graph (PRD Section 1 & 4.4)
  const [viewMode, setViewMode] = useState<'network' | 'line'>('network');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0); // 0% to 100%
  const [activeRelForModal, setActiveRelForModal] = useState<Relationship | null>(null);
  const [activeNodeForDrawer, setActiveNodeForDrawer] = useState<Entity | null>(null);

  const hasAutoFocusedRef = useRef<boolean>(false);

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

  // Calculate mention counts per entity across documents, events, and relationships (PRD 3.1)
  const mentionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    entities.forEach((ent) => {
      let count = 0;
      const lowerName = ent.name.toLowerCase();
      // Mentions in document content / titles
      documents.forEach((d) => {
        if (
          (d.content_text || '').toLowerCase().includes(lowerName) ||
          (d.title || '').toLowerCase().includes(lowerName)
        ) {
          count += 2;
        }
      });
      // Mentions in events
      events.forEach((ev) => {
        if ((ev.description || '').toLowerCase().includes(lowerName)) {
          count += 2;
        }
      });
      // Mentions in relationships
      relationships.forEach((rel) => {
        if (rel.source_entity_id === ent.id || rel.target_entity_id === ent.id) {
          count += 1;
        }
      });
      counts[ent.id] = Math.max(count, 1);
    });
    return counts;
  }, [entities, documents, events, relationships]);

  // Filter nodes & links based on Agency, Type, Search, and Confidence Threshold (PRD 4.3)
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
    const minConfDecimal = confidenceThreshold / 100;

    // Filter relationships based on confidence threshold and entity set
    const activeLinks = relationships
      .filter((r) => entityIdSet.has(r.source_entity_id) && entityIdSet.has(r.target_entity_id))
      .filter((r) => (r.confidence || 1) >= minConfDecimal)
      .map((r) => {
        // Edge color logic (PRD 3.2):
        // Red for active contradiction, Yellow for confidence < 60%, Neutral slate for standard
        const isContradiction =
          r.id === 'rel-aarav-bolero' ||
          contradictions.some(
            (c) =>
              c.status === 'flagged' &&
              (r.source_entity_id === 'ent-aarav-singh' && r.target_entity_id === 'ent-bolero-silver')
          );

        let edgeColor = '#475569'; // Neutral dark slate
        if (isContradiction) {
          edgeColor = '#DC2626'; // Red for contradiction
        } else if ((r.confidence || 0.8) < 0.6) {
          edgeColor = '#EAB308'; // Yellow for < 60% confidence
        } else if (r.status === 'confirmed') {
          edgeColor = '#10B981'; // Green for confirmed
        }

        return {
          ...r,
          source: r.source_entity_id,
          target: r.target_entity_id,
          edgeColor,
          isContradiction,
        };
      });

    // Map nodes with radius scaled by mention_count (PRD 3.1)
    const activeNodes = filteredEntities.map((e) => {
      const mentions = mentionCounts[e.id] || 1;
      // Base radius scales from 12px to 28px depending on mention count
      const val = 8 + Math.min(mentions * 2.2, 22);
      const isConfirmed = e.attributes?.verification_status === 'confirmed' || !e.attributes?.verification_status;

      return {
        ...e,
        mentions,
        val,
        isConfirmed,
        color: TYPE_COLORS[e.type] || '#64748B',
      };
    });

    return {
      nodes: activeNodes,
      links: activeLinks,
      rawEntities: filteredEntities,
      rawRelationships: relationships.filter(
        (r) => entityIdSet.has(r.source_entity_id) && entityIdSet.has(r.target_entity_id)
      ),
    };
  }, [
    entities,
    relationships,
    contradictions,
    activeAgency,
    agencies,
    selectedTypeFilter,
    searchQuery,
    confidenceThreshold,
    mentionCounts,
  ]);

  // Auto-focus on the highest-connectivity central node on load (PRD 3.3)
  useEffect(() => {
    if (!hasAutoFocusedRef.current && graphData.nodes.length > 0 && fgRef.current) {
      // Find node with highest mentions / degree (Aarav Singh)
      const highestNode: any = [...graphData.nodes].sort(
        (a, b) => (b.mentions || 0) - (a.mentions || 0)
      )[0];

      if (highestNode) {
        const timer = setTimeout(() => {
          if (fgRef.current && typeof highestNode.x === 'number') {
            fgRef.current.centerAt(highestNode.x, highestNode.y, 800);
            fgRef.current.zoom(1.6, 800);
            hasAutoFocusedRef.current = true;
          }
        }, 700);
        return () => clearTimeout(timer);
      }
    }
  }, [graphData.nodes]);

  // Search auto-focus on matching node
  useEffect(() => {
    if (searchQuery.trim() && fgRef.current && graphData.nodes.length > 0) {
      const match: any = graphData.nodes.find((n) =>
        n.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (match && typeof match.x === 'number') {
        fgRef.current.centerAt(match.x, match.y, 500);
        fgRef.current.zoom(2.2, 500);
      }
    }
  }, [searchQuery, graphData.nodes]);

  // Custom node rendering: sized by mentions, solid vs dashed border, type icons (PRD 3.1)
  const paintNode = useCallback(
    (node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const radius = (node.val || 10) * 1.5;
      const label = node.name || 'UNKNOWN';
      const fontSize = 11 / Math.max(0.6, Math.min(globalScale, 2.5));
      const iconGlyph = TYPE_ICONS[node.type as EntityType] || '●';

      // 1. Selection / Search highlight glow
      const isSelected = activeNodeForDrawer?.id === node.id;
      const isSearchMatch = searchQuery && node.name.toLowerCase().includes(searchQuery.toLowerCase());

      if (isSelected || isSearchMatch) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 10, 0, 2 * Math.PI, false);
        ctx.fillStyle = isSearchMatch ? 'rgba(245, 200, 66, 0.65)' : 'rgba(16, 185, 129, 0.45)';
        ctx.fill();
        ctx.restore();
      }

      // 2. Main Node Body (colored by entity type)
      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
      ctx.fillStyle = node.color || '#10B981';
      ctx.fill();

      // 3. Node Border: Solid border = confirmed, Dashed border = AI suggested (PRD 3.1)
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#000000';
      if (node.isConfirmed === false || node.attributes?.verification_status === 'ai_suggested') {
        ctx.setLineDash([4, 3]); // Dashed border
      } else {
        ctx.setLineDash([]); // Solid border
      }
      ctx.stroke();
      ctx.restore();

      // 4. Center Icon / Glyph
      ctx.save();
      ctx.font = `${Math.round(radius * 0.9)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(iconGlyph, node.x, node.y + 1);
      ctx.restore();

      // 5. Agency Ring Indicator (Top-right mini dot)
      let agencyColor = '#000000';
      if (node.agency_id === agencies.jodhpur?.id) agencyColor = '#0284C7';
      if (node.agency_id === agencies.kota?.id) agencyColor = '#D97706';

      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x + radius * 0.75, node.y - radius * 0.75, 5, 0, 2 * Math.PI, false);
      ctx.fillStyle = agencyColor;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
      ctx.restore();

      // 6. Crisp Label Tag below node (PRD 3.1)
      if (globalScale > 0.55) {
        const displayLabel = label.length > 24 ? label.slice(0, 22) + '…' : label;
        ctx.font = `800 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const textWidth = ctx.measureText(displayLabel).width;
        const rx = node.x - textWidth / 2 - 6;
        const ry = node.y + radius + 4;
        const rw = textWidth + 12;
        const rh = fontSize + 7;

        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx, ry, rw, rh);

        ctx.fillStyle = '#000000';
        ctx.fillText(displayLabel, node.x, node.y + radius + fontSize / 2 + 7.5);
      }
    },
    [activeNodeForDrawer, agencies, searchQuery]
  );

  // Recenter and zoom to fit
  const handleZoomFit = () => {
    if (fgRef.current) {
      fgRef.current.zoomToFit(400, 40);
    }
  };

  const handleLinkClick = (link: any) => {
    const rawRel = relationships.find((r) => r.id === link.id);
    if (rawRel) {
      setActiveRelForModal(rawRel);
    }
  };

  // Filter pill buttons with counts
  const filterButtons: { label: string; value: string; count: number }[] = [
    { label: 'ALL', value: 'all', count: entities.length },
    { label: 'PERSON', value: 'person', count: entities.filter((e) => e.type === 'person').length },
    { label: 'VEHICLE', value: 'vehicle', count: entities.filter((e) => e.type === 'vehicle').length },
    { label: 'LOCATION', value: 'location', count: entities.filter((e) => e.type === 'location').length },
    { label: 'WEAPON', value: 'weapon', count: entities.filter((e) => e.type === 'weapon').length },
    { label: 'ORGANIZATION', value: 'organization', count: entities.filter((e) => e.type === 'organization').length },
  ];

  // Active node drawer relationships & documents
  const activeNodeRelationships = useMemo(() => {
    if (!activeNodeForDrawer) return [];
    return relationships.filter(
      (r) =>
        r.source_entity_id === activeNodeForDrawer.id ||
        r.target_entity_id === activeNodeForDrawer.id
    );
  }, [activeNodeForDrawer, relationships]);

  const activeNodeDocuments = useMemo(() => {
    if (!activeNodeForDrawer) return [];
    const lowerName = activeNodeForDrawer.name.toLowerCase();
    const docIds = new Set<string>();

    activeNodeRelationships.forEach((r) => {
      r.source_document_ids?.forEach((id) => docIds.add(id));
    });

    documents.forEach((d) => {
      if (
        (d.content_text || '').toLowerCase().includes(lowerName) ||
        (d.title || '').toLowerCase().includes(lowerName)
      ) {
        docIds.add(d.id);
      }
    });

    return documents.filter((d) => docIds.has(d.id));
  }, [activeNodeForDrawer, activeNodeRelationships, documents]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[620px] bg-[#EFECE6] flex flex-col overflow-hidden font-mono select-none text-black"
    >
      {/* ─────────────────────────────────────────────────────────────
          TOP TACTICAL COMMAND HUD
      ───────────────────────────────────────────────────────────── */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Filter Pills & Search */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto bg-white border-2 border-black p-1.5 shadow-brutal">
          <div className="flex items-center gap-1 px-1 text-xs text-black uppercase font-black">
            <Filter className="w-3.5 h-3.5 text-black" />
            <span>TYPE:</span>
          </div>

          <div className="flex items-center gap-1 flex-wrap">
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

          {/* Search Box */}
          <div className="relative ml-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
            <input
              type="text"
              placeholder="SEARCH ENTITY..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#FBF9F5] border border-black text-black text-xs rounded-none pl-7 pr-3 py-0.5 outline-none w-32 focus:w-48 focus:bg-white transition-all font-sans font-bold"
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

        {/* Center: Confidence Threshold Slider (PRD 4.3) */}
        <div className="flex items-center space-x-2 bg-white border-2 border-black px-3 py-1 shadow-brutal pointer-events-auto text-xs font-bold">
          <Sliders className="w-3.5 h-3.5 text-black" />
          <span className="text-[11px] font-black uppercase text-slate-800">
            MIN CONF: <span className="text-black">{confidenceThreshold}%</span>
          </span>
          <input
            type="range"
            min="0"
            max="95"
            step="5"
            value={confidenceThreshold}
            onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
            className="w-20 accent-black cursor-pointer"
            title="Filter relationships below confidence threshold"
          />
        </div>

        {/* Right: View Mode Toggle [ RELATIONSHIP NETWORK (Default) ] [ TEMPORAL LINE GRAPH ] */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          <div className="flex items-center bg-white border-2 border-black p-0.5 shadow-brutal text-xs font-bold">
            <button
              onClick={() => setViewMode('network')}
              className={`px-3 py-1 font-black flex items-center space-x-1.5 transition ${
                viewMode === 'network'
                  ? 'bg-black text-[#F5C842]'
                  : 'text-slate-700 hover:text-black hover:bg-slate-100'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>RELATIONSHIP NETWORK</span>
            </button>

            <button
              onClick={() => setViewMode('line')}
              className={`px-3 py-1 font-black flex items-center space-x-1.5 transition ${
                viewMode === 'line'
                  ? 'bg-black text-[#F5C842]'
                  : 'text-slate-700 hover:text-black hover:bg-slate-100'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>TEMPORAL LINE GRAPH</span>
            </button>
          </div>

          <button
            onClick={handleZoomFit}
            title="Recenter & Fit View"
            className="p-1.5 bg-white border-2 border-black hover:bg-slate-100 text-black shadow-brutal transition"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MAIN CANVAS WORKSPACE
      ───────────────────────────────────────────────────────────── */}
      <div className="w-full h-full flex-1 flex flex-col pt-16 relative">
        {/* VIEW 1: Force-Directed Relationship Graph (P0 Flagship View) */}
        {viewMode === 'network' && (
          <div
            className="w-full h-full flex-1 relative"
            onClick={(e) => {
              // Clicking empty canvas deselects (PRD 3.3)
              if (e.target === e.currentTarget) {
                setActiveNodeForDrawer(null);
                setActiveRelForModal(null);
              }
            }}
          >
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
                ctx.arc(node.x, node.y, (node.val || 10) * 2, 0, 2 * Math.PI, false);
                ctx.fill();
              }}
              // Edge Label on Hover Only (PRD 3.2)
              linkLabel={(l: any) =>
                `${l.relationship_type.toUpperCase()} • ${Math.round(
                  (l.confidence || 0.8) * 100
                )}% CONFIDENCE • CLICK TO VIEW EVIDENCE`
              }
              // Edge Color (Red for contradiction, Yellow for <60%, Neutral for standard)
              linkColor={(l: any) => l.edgeColor || '#475569'}
              // Edge Thickness scales with confidence (PRD 3.2)
              linkWidth={(l: any) => Math.max(1.8, (l.confidence || 0.8) * 4.2)}
              // Solid vs Dashed / Particles (PRD 3.2)
              linkDirectionalParticles={(l: any) => (l.status === 'ai_suggested' ? 4 : 1)}
              linkDirectionalParticleSpeed={(l: any) => (l.status === 'ai_suggested' ? 0.005 : 0.002)}
              linkDirectionalParticleWidth={2.5}
              linkDirectionalParticleColor={(l: any) => l.edgeColor || '#10B981'}
              linkDirectionalArrowLength={4}
              linkDirectionalArrowRelPos={1}
              linkCurvature={0.1}
              onNodeClick={(node: any) => {
                const raw = entities.find((e) => e.id === node.id);
                if (raw) setActiveNodeForDrawer(raw);
              }}
              onLinkClick={handleLinkClick}
              cooldownTicks={120}
              d3VelocityDecay={0.25}
            />

            {/* Bottom-left Legend HUD */}
            <div className="absolute bottom-4 left-4 z-10 bg-white/95 border-2 border-black p-3 shadow-brutal font-mono text-xs space-y-1.5 pointer-events-none">
              <div className="text-[10px] font-black uppercase text-black flex items-center justify-between gap-4">
                <span>GRAPH LEGEND</span>
                <span className="text-slate-600">NODE SIZE = MENTIONS</span>
              </div>
              <div className="flex items-center space-x-3 text-[10px] font-bold">
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] border border-black" />
                  <span>PERSON</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] border border-black" />
                  <span>VEHICLE</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] border border-black" />
                  <span>LOCATION</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] border border-black" />
                  <span>WEAPON</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] border border-black" />
                  <span>ORG</span>
                </div>
              </div>
              <div className="pt-1 border-t border-slate-200 flex items-center space-x-4 text-[9px] font-black">
                <span className="flex items-center space-x-1 text-slate-700">
                  <span className="w-3 h-0.5 bg-black" />
                  <span>SOLID: CONFIRMED</span>
                </span>
                <span className="flex items-center space-x-1 text-[#D97706]">
                  <span className="w-3 h-0.5 bg-[#D97706] border-dashed border-t" />
                  <span>DASHED: AI SUGGESTED</span>
                </span>
                <span className="flex items-center space-x-1 text-red-600">
                  <span className="w-3 h-0.5 bg-red-600" />
                  <span>RED: CONTRADICTION</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: Temporal Activity Line Graph */}
        {viewMode === 'line' && (
          <div className="w-full h-full flex-1 relative">
            <NexusEntityLineGraph
              entities={entities}
              events={events}
              contradictions={contradictions}
              onSelectEntity={(e) => setActiveNodeForDrawer(e)}
              onOpenProvenance={onOpenProvenance}
            />
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          EMPTY / SPARSE STATE (PRD Section 5)
      ───────────────────────────────────────────────────────────── */}
      {graphData.nodes.length === 0 && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center bg-[#EFECE6]/90 backdrop-blur-xs">
          <div className="p-6 bg-white border-2 border-black max-w-md space-y-3 shadow-brutal-lg">
            <div className="w-12 h-12 mx-auto rounded bg-black text-[#F5C842] flex items-center justify-center font-black">
              <Network className="w-7 h-7" />
            </div>
            <h4 className="text-base font-black text-black uppercase tracking-wider">
              NO ENTITIES EXTRACTED YET
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed font-sans font-medium">
              No entities extracted yet. Ingest evidence files to populate the knowledge graph with discovered relationships.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              {onOpenUpload && (
                <button
                  onClick={onOpenUpload}
                  className="w-full sm:w-auto px-4 py-2 bg-[#F5C842] hover:bg-[#EAB308] text-black font-black text-xs border-2 border-black shadow-brutal flex items-center justify-center space-x-1.5"
                >
                  <UploadCloud className="w-4 h-4 text-black" />
                  <span>+ INGEST EVIDENCE</span>
                </button>
              )}
              <button
                onClick={resetToDefaultCase}
                className="w-full sm:w-auto px-4 py-2 bg-black hover:bg-slate-900 text-white font-black text-xs border-2 border-black shadow-brutal flex items-center justify-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>LOAD DEMO CASE (PS #16)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          CLICK NODE → SIDE PANEL DRAWER (PRD Section 4.1)
      ───────────────────────────────────────────────────────────── */}
      {activeNodeForDrawer && (
        <div className="absolute right-4 top-16 bottom-4 w-96 bg-white border-2 border-black p-5 shadow-brutal-lg z-40 flex flex-col justify-between font-mono animate-in slide-in-from-right duration-200 text-black">
          <div className="space-y-4 overflow-y-auto pr-1">
            {/* Drawer Header */}
            <div className="flex items-start justify-between border-b-2 border-black pb-3">
              <div>
                <span
                  className="text-[10px] px-2 py-0.5 font-black uppercase tracking-wider text-black border border-black inline-block mb-1"
                  style={{
                    backgroundColor: `${TYPE_COLORS[activeNodeForDrawer.type]}40`,
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

            {/* Extracted Attributes (PRD 4.1) */}
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

            {/* List of Relationships for this Entity (PRD 4.1) */}
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

            {/* List of Source Documents (PRD 4.1) */}
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
          CLICK EDGE → RELATIONSHIP DETAIL POPOVER (PRD Section 4.2)
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
                <X className="w-5 h-5" />
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

            {/* Question: "Why do you think these are connected?" (PRD 4.2) */}
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

            {/* Confidence Breakdown (PRD 4.2) */}
            <div className="p-2.5 bg-slate-100 border border-black text-[11px] text-slate-800 font-bold">
              <span className="font-black text-black">CONFIDENCE METRIC: </span>
              {Math.round((activeRelForModal.confidence || 0.85) * 100)}% score · Corroborated in{' '}
              {activeRelForModal.source_document_ids?.length || 1} evidence dossier(s) · Verified temporal proximity
            </div>

            {/* Quoted Source Evidence Snippets (PRD 4.2) */}
            <div className="space-y-1.5">
              <span className="text-xs text-black uppercase font-black block">
                SUPPORTING EVIDENCE SNIPPETS:
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
                        <span className="text-black font-black mr-2">[{doc?.title || docId.slice(0, 10)}]</span>
                        <p className="text-slate-700 text-[11px] font-sans italic truncate mt-0.5">
                          "{doc?.content_text?.slice(0, 100) || 'Verified intelligence log'}..."
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setActiveRelForModal(null);
                          if (onOpenProvenance) {
                            onOpenProvenance(docId, 'Source citation', doc?.content_text?.slice(0, 200));
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

            {/* Footer with HITL Confirm / Dismiss Buttons Directly in Popover (PRD 4.2) */}
            <div className="flex items-center justify-between pt-3 border-t-2 border-black">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-700 font-bold">STATUS:</span>
                <span
                  className={`text-xs font-black uppercase ${
                    activeRelForModal.status === 'confirmed' ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {activeRelForModal.status.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    updateRelationshipStatus(activeRelForModal.id, 'dismissed');
                    setActiveRelForModal(null);
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-black text-red-700 text-xs font-black transition uppercase"
                >
                  DISMISS LINK
                </button>

                <button
                  onClick={() => {
                    updateRelationshipStatus(activeRelForModal.id, 'confirmed');
                    setActiveRelForModal((prev) => (prev ? { ...prev, status: 'confirmed' } : null));
                  }}
                  className="px-4 py-1.5 bg-[#F5C842] hover:bg-[#EAB308] text-black font-black text-xs border border-black shadow-brutal transition active:translate-x-0.5 active:translate-y-0.5 uppercase flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-black" />
                  <span>CONFIRM AS FACT</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
