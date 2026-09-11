'use client';

import React, { useState, useRef, useMemo } from 'react';
import { Entity, Relationship, Contradiction, Agency, EntityType } from '@/types/investigation';
import {
  Filter,
  Search,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  GitBranch,
  X,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronDown,
  Info,
} from 'lucide-react';

const TYPE_CONFIG: Record<
  EntityType,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  person: {
    label: 'SUSPECT',
    color: '#047857',
    bg: '#ECFDF5',
    border: '#10B981',
    icon: '👤',
  },
  vehicle: {
    label: 'VEHICLE',
    color: '#B45309',
    bg: '#FFFBEB',
    border: '#F59E0B',
    icon: '🚗',
  },
  location: {
    label: 'LOCATION',
    color: '#0369A1',
    bg: '#F0F9FF',
    border: '#0284C7',
    icon: '📍',
  },
  weapon: {
    label: 'WEAPON',
    color: '#B91C1C',
    bg: '#FEF2F2',
    border: '#EF4444',
    icon: '🎯',
  },
  organization: {
    label: 'SYNDICATE',
    color: '#6D28D9',
    bg: '#F5F3FF',
    border: '#8B5CF6',
    icon: '🏢',
  },
  object: {
    label: 'EVIDENCE',
    color: '#334155',
    bg: '#F8FAFC',
    border: '#64748B',
    icon: '📦',
  },
};

// Staggered label positions along curves to prevent overlapping
const REL_LABEL_CONFIG: Record<string, { t: number; yOffset?: number }> = {
  'rel-aarav-scorpio': { t: 0.42, yOffset: -8 },
  'rel-aarav-mehrangarh': { t: 0.65, yOffset: -10 },
  'rel-aarav-syndicate': { t: 0.32, yOffset: 6 },
  'rel-aarav-bolero': { t: 0.48, yOffset: 0 }, // 1,560 km/h contradiction
  'rel-scorpio-bilara': { t: 0.50, yOffset: 0 },
  'rel-bolero-chambal': { t: 0.50, yOffset: 0 },
  'rel-devendra-bolero': { t: 0.36, yOffset: -6 },
  'rel-devendra-sim': { t: 0.42, yOffset: 8 },
  'rel-devendra-weapon': { t: 0.48, yOffset: 0 },
  'rel-devendra-nayapura': { t: 0.68, yOffset: -6 },
};

// Clean default positions organized into 3 generous columns
const STORY_DEFAULT_POSITIONS: Record<string, NodePosition> = {
  // Column 1: Primary Suspects (x: 60)
  'ent-aarav-singh': { x: 60, y: 110 },
  'ent-devendra-sharma': { x: 60, y: 460 },

  // Column 2: Vehicles, Weapons & Syndicate Tools (x: 500)
  'ent-scorpio-white': { x: 500, y: 70 },
  'ent-chambal-syndicate': { x: 500, y: 240 },
  'ent-bolero-silver': { x: 500, y: 370 },
  'ent-glock-pistol': { x: 500, y: 490 },
  'ent-burner-sim': { x: 500, y: 610 },

  // Column 3: Crime Scenes, Sightings & Checkposts (x: 940)
  'ent-loc-bilara': { x: 940, y: 70 },
  'ent-loc-mehrangarh': { x: 940, y: 180 },
  'ent-loc-chambal': { x: 940, y: 370 },
  'ent-loc-nayapura': { x: 940, y: 510 },
};

interface NexusLinkGraphProps {
  entities: Entity[];
  relationships: Relationship[];
  contradictions: Contradiction[];
  agencies?: Record<string, Agency>;
  onSelectEntity: (entity: Entity) => void;
  onSelectRelationship: (rel: Relationship) => void;
  onOpenProvenance?: (docId: string, offset: string, snippet?: string) => void;
}

interface NodePosition {
  x: number;
  y: number;
}

// Compute point on cubic bezier at parameter t (0 <= t <= 1)
function getCubicBezierPoint(
  t: number,
  x1: number,
  y1: number,
  cx1: number,
  cy1: number,
  cx2: number,
  cy2: number,
  x2: number,
  y2: number
) {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x: uuu * x1 + 3 * uu * t * cx1 + 3 * u * tt * cx2 + ttt * x2,
    y: uuu * y1 + 3 * uu * t * cy1 + 3 * u * tt * cy2 + ttt * y2,
  };
}

export const NexusLinkGraph: React.FC<NexusLinkGraphProps> = ({
  entities,
  relationships,
  contradictions,
  agencies = {},
  onSelectEntity,
  onSelectRelationship,
  onOpenProvenance,
}) => {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0);
  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null);
  const [hoveredRelId, setHoveredRelId] = useState<string | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  // SVG Pan and Zoom State
  const [pan, setPan] = useState({ x: 30, y: 20 });
  const [zoom, setZoom] = useState(0.92);
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0, startPanX: 0, startPanY: 0 });

  // Draggable node cards
  const [customPositions, setCustomPositions] = useState<Record<string, NodePosition>>({});
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; startNodeX: number; startNodeY: number }>({
    x: 0,
    y: 0,
    startNodeX: 0,
    startNodeY: 0,
  });

  // Filter entities
  const filteredEntities = useMemo(() => {
    let result = entities;
    if (selectedTypeFilter !== 'all') {
      result = result.filter((e) => e.type === selectedTypeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (e) => e.name.toLowerCase().includes(q) || e.type.toLowerCase().includes(q)
      );
    }
    return result;
  }, [entities, selectedTypeFilter, searchQuery]);

  const entityIdSet = useMemo(() => new Set(filteredEntities.map((e) => e.id)), [filteredEntities]);
  const minConfDecimal = confidenceThreshold / 100;

  // Filtered Relationships with contradiction status
  const filteredRelationships = useMemo(() => {
    return relationships
      .filter((r) => entityIdSet.has(r.source_entity_id) && entityIdSet.has(r.target_entity_id))
      .filter((r) => (r.confidence || 1) >= minConfDecimal)
      .map((r) => {
        const isContradiction =
          r.id === 'rel-aarav-bolero' ||
          contradictions.some(
            (c) =>
              c.status === 'flagged' &&
              r.source_entity_id === 'ent-aarav-singh' &&
              r.target_entity_id === 'ent-bolero-silver'
          );

        let strokeColor = '#059669'; // Verified Emerald
        if (isContradiction) {
          strokeColor = '#DC2626'; // Contradiction Red
        } else if ((r.confidence || 0.8) < 0.6) {
          strokeColor = '#D97706'; // Low confidence Amber
        } else if (r.status === 'ai_suggested') {
          strokeColor = '#2563EB'; // AI suggested Blue
        }

        return {
          ...r,
          isContradiction,
          strokeColor,
        };
      });
  }, [relationships, entityIdSet, minConfDecimal, contradictions]);

  // Clean Position Map (combines story layout + user drags)
  const nodePositions = useMemo(() => {
    const posMap: Record<string, NodePosition> = {};

    filteredEntities.forEach((ent, idx) => {
      // Use predefined story positions if available
      if (STORY_DEFAULT_POSITIONS[ent.id]) {
        posMap[ent.id] = STORY_DEFAULT_POSITIONS[ent.id];
      } else {
        // Fallback for dynamically uploaded custom entities
        if (ent.type === 'person') {
          posMap[ent.id] = { x: 60, y: 110 + idx * 160 };
        } else if (ent.type === 'location') {
          posMap[ent.id] = { x: 940, y: 70 + idx * 120 };
        } else {
          posMap[ent.id] = { x: 500, y: 70 + idx * 110 };
        }
      }

      // Merge user custom drags
      if (customPositions[ent.id]) {
        posMap[ent.id] = customPositions[ent.id];
      }
    });

    return posMap;
  }, [filteredEntities, customPositions]);

  // Connected entities when hovering
  const activeConnectedIds = useMemo(() => {
    if (!hoveredEntityId) return null;
    const ids = new Set<string>([hoveredEntityId]);
    filteredRelationships.forEach((r) => {
      if (r.source_entity_id === hoveredEntityId) ids.add(r.target_entity_id);
      if (r.target_entity_id === hoveredEntityId) ids.add(r.source_entity_id);
    });
    return ids;
  }, [hoveredEntityId, filteredRelationships]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'link-canvas-bg') {
      setIsPanning(true);
      panStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startPanX: pan.x,
        startPanY: pan.y,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPan({
        x: panStartRef.current.startPanX + dx,
        y: panStartRef.current.startPanY + dy,
      });
    } else if (draggingNodeId) {
      const dx = (e.clientX - dragStartRef.current.x) / zoom;
      const dy = (e.clientY - dragStartRef.current.y) / zoom;
      setCustomPositions((prev) => ({
        ...prev,
        [draggingNodeId]: {
          x: Math.round(dragStartRef.current.startNodeX + dx),
          y: Math.round(dragStartRef.current.startNodeY + dy),
        },
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggingNodeId(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((prev) => Math.min(Math.max(prev * factor, 0.45), 2.2));
  };

  const resetView = () => {
    setPan({ x: 30, y: 20 });
    setZoom(0.92);
    setCustomPositions({});
  };

  const startNodeDrag = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setDraggingNodeId(nodeId);
    const pos = nodePositions[nodeId] || { x: 0, y: 0 };
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startNodeX: pos.x,
      startNodeY: pos.y,
    };
  };

  const CARD_WIDTH = 220;
  const CARD_HEIGHT = 62;

  return (
    <div
      id="link-canvas-bg"
      className="relative w-full h-[660px] bg-[#EFECE6] border-2 border-black shadow-brutal overflow-hidden font-mono select-none text-black flex flex-col"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* ─────────────────────────────────────────────────────────────
          TOP CONTROL STRIP: Clean, uncluttered toolbar
      ───────────────────────────────────────────────────────────── */}
      <div className="px-3.5 py-2 bg-white border-b-2 border-black flex flex-wrap items-center justify-between gap-2.5 z-10">
        {/* Left: Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-black uppercase text-black flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>FILTER:</span>
          </span>

          {[
            { label: 'ALL', value: 'all', count: entities.length },
            { label: 'SUSPECTS', value: 'person', count: entities.filter((e) => e.type === 'person').length },
            { label: 'VEHICLES', value: 'vehicle', count: entities.filter((e) => e.type === 'vehicle').length },
            { label: 'LOCATIONS', value: 'location', count: entities.filter((e) => e.type === 'location').length },
            { label: 'WEAPONS', value: 'weapon', count: entities.filter((e) => e.type === 'weapon').length },
            { label: 'ORGS', value: 'organization', count: entities.filter((e) => e.type === 'organization').length },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setSelectedTypeFilter(btn.value)}
              className={`px-2 py-0.5 text-xs font-black transition border flex items-center gap-1 ${
                selectedTypeFilter === btn.value
                  ? 'bg-[#F5C842] text-black border-black shadow-xs'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100'
              }`}
            >
              <span>{btn.label}</span>
              <span className="text-[9px] px-1 bg-black/10 text-black font-bold">{btn.count}</span>
            </button>
          ))}

          {/* Quick Search */}
          <div className="relative ml-2">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
            <input
              type="text"
              placeholder="SEARCH CASE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#FBF9F5] border border-black text-black text-xs pl-7 pr-3 py-0.5 outline-none w-36 focus:w-48 focus:bg-white transition-all font-sans font-bold"
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

        {/* Right: Threshold Slider & Zoom Tools */}
        <div className="flex items-center space-x-3 text-xs font-bold">
          <div className="flex items-center space-x-2 border-r border-slate-300 pr-3">
            <Sliders className="w-3.5 h-3.5 text-black" />
            <span className="text-[10px] font-black uppercase text-slate-800">
              CONF &gt;= <span className="text-black">{confidenceThreshold}%</span>
            </span>
            <input
              type="range"
              min="0"
              max="95"
              step="5"
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
              className="w-16 accent-black cursor-pointer"
            />
          </div>

          <div className="flex items-center border border-black bg-white shadow-xs">
            <button
              onClick={() => setZoom((prev) => Math.min(prev * 1.15, 2.2))}
              title="Zoom In"
              className="p-1 hover:bg-slate-100 border-r border-slate-300"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom((prev) => Math.max(prev * 0.85, 0.45))}
              title="Zoom Out"
              className="p-1 hover:bg-slate-100 border-r border-slate-300"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={resetView}
              title="Reset View & Spacing"
              className="px-2 py-1 hover:bg-slate-100 flex items-center gap-1 font-black text-[10px]"
            >
              <RefreshCw className="w-3 h-3" />
              <span>RESET</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          INTERACTIVE SVG TACTICAL CANVAS
      ───────────────────────────────────────────────────────────── */}
      <div className="w-full flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing">
        {/* Subtle, soft dot grid */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-15"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="clean-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="#000000" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#clean-grid)" />
        </svg>

        {/* Scaled Canvas Group */}
        <svg
          className="w-full h-full absolute inset-0 overflow-visible"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
        >
          <defs>
            <marker
              id="link-arrow-emerald"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5.5"
              markerHeight="5.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#059669" />
            </marker>
            <marker
              id="link-arrow-amber"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5.5"
              markerHeight="5.5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#D97706" />
            </marker>
            <marker
              id="link-arrow-red"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#DC2626" />
            </marker>
          </defs>

          {/* 1. Category Column Headers (Spacious & Crisp) */}
          <g className="pointer-events-none font-mono">
            <rect x="60" y="25" width="220" height="24" fill="#111111" rx="2" />
            <text x="170" y="41" textAnchor="middle" fill="#F5C842" fontSize="10.5" fontWeight="900">
              PRIMARY SUSPECTS &amp; ACTORS
            </text>

            <rect x="500" y="25" width="220" height="24" fill="#111111" rx="2" />
            <text x="610" y="41" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="900">
              TRANSIT, WEAPONS &amp; NETWORK
            </text>

            <rect x="940" y="25" width="220" height="24" fill="#111111" rx="2" />
            <text x="1050" y="41" textAnchor="middle" fill="#FFFFFF" fontSize="10.5" fontWeight="900">
              CRIME SCENES &amp; SIGHTINGS
            </text>
          </g>

          {/* 2. Connecting Lines & Staggered Relationship Labels */}
          <g>
            {filteredRelationships.map((rel) => {
              const srcPos = nodePositions[rel.source_entity_id];
              const tgtPos = nodePositions[rel.target_entity_id];
              if (!srcPos || !tgtPos) return null;

              const isLeftToRight = srcPos.x < tgtPos.x;
              const x1 = isLeftToRight ? srcPos.x + CARD_WIDTH : srcPos.x;
              const y1 = srcPos.y + CARD_HEIGHT / 2;
              const x2 = isLeftToRight ? tgtPos.x : tgtPos.x + CARD_WIDTH;
              const y2 = tgtPos.y + CARD_HEIGHT / 2;

              // Generous horizontal control curve
              const dx = Math.abs(x2 - x1);
              const cx1 = isLeftToRight ? x1 + dx * 0.45 : x1 - dx * 0.45;
              const cy1 = y1;
              const cx2 = isLeftToRight ? x2 - dx * 0.45 : x2 + dx * 0.45;
              const cy2 = y2;
              const pathD = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;

              // Exact Staggered Coordinates on the Bezier Curve
              const labelCfg = REL_LABEL_CONFIG[rel.id] || { t: 0.5, yOffset: 0 };
              const pt = getCubicBezierPoint(labelCfg.t, x1, y1, cx1, cy1, cx2, cy2, x2, y2);
              const labelX = pt.x;
              const labelY = pt.y + (labelCfg.yOffset || 0);

              const isHovered =
                hoveredRelId === rel.id ||
                (hoveredEntityId &&
                  (rel.source_entity_id === hoveredEntityId || rel.target_entity_id === hoveredEntityId));

              const isDimmed =
                hoveredEntityId &&
                rel.source_entity_id !== hoveredEntityId &&
                rel.target_entity_id !== hoveredEntityId;

              const markerName = rel.isContradiction
                ? 'url(#link-arrow-red)'
                : rel.status === 'confirmed'
                ? 'url(#link-arrow-emerald)'
                : 'url(#link-arrow-amber)';

              return (
                <g
                  key={rel.id}
                  className="transition-opacity duration-200 cursor-pointer"
                  style={{ opacity: isDimmed ? 0.12 : 1 }}
                  onMouseEnter={() => setHoveredRelId(rel.id)}
                  onMouseLeave={() => setHoveredRelId(null)}
                  onClick={() => onSelectRelationship(rel)}
                >
                  {/* Broad invisible hit area for effortless clicking */}
                  <path d={pathD} fill="none" stroke="transparent" strokeWidth="22" />

                  {/* Soft Glow Under Line */}
                  {(isHovered || rel.isContradiction) && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke={rel.isContradiction ? '#EF4444' : '#F5C842'}
                      strokeWidth={rel.isContradiction ? 6 : 5}
                      strokeOpacity={0.4}
                    />
                  )}

                  {/* Rendered Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={rel.strokeColor}
                    strokeWidth={isHovered || rel.isContradiction ? 2.6 : 1.8}
                    strokeDasharray={rel.isContradiction ? '6,4' : rel.status === 'ai_suggested' ? '4,4' : 'none'}
                    markerEnd={markerName}
                    className={rel.isContradiction ? 'animate-pulse' : ''}
                  />

                  {/* Staggered Non-Overlapping Label Badge */}
                  <g transform={`translate(${labelX}, ${labelY})`} className="transition-transform hover:scale-105">
                    {rel.isContradiction ? (
                      <g>
                        <rect
                          x="-88"
                          y="-11"
                          width="176"
                          height="22"
                          rx="3"
                          fill="#DC2626"
                          stroke="#000000"
                          strokeWidth="1.5"
                          className="filter drop-shadow-xs"
                        />
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="9"
                          fontWeight="900"
                          fontFamily="ui-monospace, monospace"
                        >
                          ⚡ 1,560 km/h CONFLICT ⚡
                        </text>
                      </g>
                    ) : (
                      <g>
                        <rect
                          x="-48"
                          y="-9"
                          width="96"
                          height="18"
                          rx="2"
                          fill={isHovered ? '#111111' : '#FFFFFF'}
                          stroke="#000000"
                          strokeWidth="1.2"
                          className="filter drop-shadow-xs"
                        />
                        <text
                          x="0"
                          y="3"
                          textAnchor="middle"
                          fill={isHovered ? '#F5C842' : '#111111'}
                          fontSize="8.5"
                          fontWeight="800"
                          fontFamily="ui-monospace, monospace"
                        >
                          {rel.relationship_type.toUpperCase()}
                        </text>
                      </g>
                    )}
                  </g>
                </g>
              );
            })}
          </g>

          {/* 3. Entity Cards (Draggable, Clean Tactical Design) */}
          <g>
            {filteredEntities.map((entity) => {
              const pos = nodePositions[entity.id] || { x: 100, y: 100 };
              const cfg = TYPE_CONFIG[entity.type] || TYPE_CONFIG.object;
              const isHovered = hoveredEntityId === entity.id;
              const isDimmed = activeConnectedIds && !activeConnectedIds.has(entity.id);
              const isSearchMatch = searchQuery && entity.name.toLowerCase().includes(searchQuery.toLowerCase());

              const agencySlug =
                entity.agency_id === agencies.jodhpur?.id
                  ? 'JODHPUR HQ'
                  : entity.agency_id === agencies.kota?.id
                  ? 'KOTA CID'
                  : 'JOINT';
              const agencyBadgeBg =
                entity.agency_id === agencies.jodhpur?.id
                  ? '#0284C7'
                  : entity.agency_id === agencies.kota?.id
                  ? '#D97706'
                  : '#111111';

              return (
                <g
                  key={entity.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  className="cursor-pointer select-none transition-opacity duration-200"
                  style={{ opacity: isDimmed ? 0.16 : 1 }}
                  onMouseEnter={() => setHoveredEntityId(entity.id)}
                  onMouseLeave={() => setHoveredEntityId(null)}
                  onClick={() => onSelectEntity(entity)}
                >
                  {/* Search Match Glow */}
                  {isSearchMatch && (
                    <rect
                      x="-3"
                      y="-3"
                      width={CARD_WIDTH + 6}
                      height={CARD_HEIGHT + 6}
                      rx="5"
                      fill="none"
                      stroke="#F5C842"
                      strokeWidth="3"
                    />
                  )}

                  {/* Drop Shadow Box */}
                  <rect x="2.5" y="2.5" width={CARD_WIDTH} height={CARD_HEIGHT} rx="3" fill="#000000" />

                  {/* Main Card Container */}
                  <rect
                    x="0"
                    y="0"
                    width={CARD_WIDTH}
                    height={CARD_HEIGHT}
                    rx="3"
                    fill={isHovered ? '#FBF9F5' : '#FFFFFF'}
                    stroke="#000000"
                    strokeWidth="1.8"
                  />

                  {/* Left Accent Strip */}
                  <path
                    d="M 0 3 Q 0 0 3 0 L 6 0 L 6 62 L 3 62 Q 0 62 0 59 Z"
                    fill={cfg.border}
                  />

                  {/* Drag Handle Top Bar */}
                  <g
                    className="cursor-move hover:opacity-80"
                    onMouseDown={(e) => startNodeDrag(e, entity.id)}
                  >
                    <rect x="0" y="0" width={CARD_WIDTH} height="16" fill="transparent" />
                  </g>

                  {/* Type Pill Badge (Top Left) */}
                  <rect
                    x="12"
                    y="5"
                    width="80"
                    height="13"
                    rx="2"
                    fill={cfg.bg}
                    stroke={cfg.border}
                    strokeWidth="0.75"
                  />
                  <text
                    x="16"
                    y="14.5"
                    fill={cfg.color}
                    fontSize="7"
                    fontWeight="900"
                    fontFamily="ui-monospace, monospace"
                  >
                    {cfg.icon} {cfg.label}
                  </text>

                  {/* Agency Badge (Top Right) */}
                  <rect
                    x={CARD_WIDTH - 66}
                    y="5"
                    width="54"
                    height="13"
                    rx="2"
                    fill={agencyBadgeBg}
                  />
                  <text
                    x={CARD_WIDTH - 39}
                    y="14.5"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="7"
                    fontWeight="900"
                    fontFamily="ui-monospace, monospace"
                  >
                    {agencySlug}
                  </text>

                  {/* Entity Name (Clean & Bold) */}
                  <text
                    x="12"
                    y="34"
                    fill="#000000"
                    fontSize="11.5"
                    fontWeight="900"
                    fontFamily="ui-monospace, monospace"
                  >
                    {entity.name.length > 23 ? entity.name.slice(0, 21) + '…' : entity.name}
                  </text>

                  {/* Context Sub-label */}
                  <text
                    x="12"
                    y="49"
                    fill="#64748B"
                    fontSize="9"
                    fontWeight="700"
                    fontFamily="ui-monospace, monospace"
                  >
                    {entity.attributes?.model
                      ? `Plate: ${entity.attributes.plate_number || 'RJ-19'}`
                      : entity.attributes?.jurisdiction
                      ? `${entity.attributes.jurisdiction}`
                      : entity.attributes?.caliber
                      ? `Caliber: ${entity.attributes.caliber}`
                      : `Status: ${entity.attributes?.verification_status || 'verified'}`}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating Minimal Legend Toggle in Bottom Left */}
        <div className="absolute bottom-3 left-3 z-10 font-mono text-xs pointer-events-auto">
          {isLegendOpen ? (
            <div className="bg-white border-2 border-black p-2.5 shadow-brutal space-y-1.5 animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-1">
                <span className="text-[10px] font-black uppercase text-black">CASE BOARD LEGEND</span>
                <button
                  onClick={() => setIsLegendOpen(false)}
                  className="text-slate-500 hover:text-black"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-[9px] font-bold">
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-xs bg-[#ECFDF5] border border-[#10B981]" />
                  <span>SUSPECT</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-xs bg-[#FFFBEB] border border-[#F59E0B]" />
                  <span>VEHICLE</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-xs bg-[#F0F9FF] border border-[#0284C7]" />
                  <span>LOCATION</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-xs bg-[#FEF2F2] border border-[#EF4444]" />
                  <span>WEAPON</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-xs bg-[#F5F3FF] border border-[#8B5CF6]" />
                  <span>SYNDICATE</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-xs bg-[#F8FAFC] border border-[#64748B]" />
                  <span>EVIDENCE</span>
                </div>
              </div>

              <div className="pt-1 border-t border-slate-200 flex items-center space-x-3 text-[8.5px] font-black">
                <span className="flex items-center space-x-1 text-[#059669]">
                  <span className="w-3 h-0.5 bg-[#059669]" />
                  <span>CONFIRMED</span>
                </span>
                <span className="flex items-center space-x-1 text-[#D97706]">
                  <span className="w-3 h-0.5 bg-[#D97706] border-dashed border-t" />
                  <span>SUGGESTED</span>
                </span>
                <span className="flex items-center space-x-1 text-red-600">
                  <span className="w-3 h-0.5 bg-red-600 animate-pulse" />
                  <span>CONFLICT</span>
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsLegendOpen(true)}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-black shadow-xs flex items-center gap-1.5 text-[10px] font-black"
            >
              <Info className="w-3 h-3 text-slate-700" />
              <span>CASE BOARD LEGEND</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
