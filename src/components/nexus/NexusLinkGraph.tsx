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
} from 'lucide-react';

const TYPE_CONFIG: Record<
  EntityType,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  person: {
    label: 'SUSPECT / PERSON',
    color: '#047857',
    bg: '#D1FAE5',
    border: '#059669',
    icon: '👤',
  },
  vehicle: {
    label: 'VEHICLE',
    color: '#B45309',
    bg: '#FEF3C7',
    border: '#D97706',
    icon: '🚗',
  },
  location: {
    label: 'CRIME SCENE / LOC',
    color: '#0369A1',
    bg: '#E0F2FE',
    border: '#0284C7',
    icon: '📍',
  },
  weapon: {
    label: 'WEAPON / CONTRABAND',
    color: '#B91C1C',
    bg: '#FEE2E2',
    border: '#DC2626',
    icon: '🎯',
  },
  organization: {
    label: 'SYNDICATE / ORG',
    color: '#6D28D9',
    bg: '#EDE9FE',
    border: '#7C3AED',
    icon: '🏢',
  },
  object: {
    label: 'EVIDENCE OBJECT',
    color: '#334155',
    bg: '#F1F5F9',
    border: '#475569',
    icon: '📦',
  },
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

  // SVG Pan and Zoom State
  const [pan, setPan] = useState({ x: 40, y: 25 });
  const [zoom, setZoom] = useState(0.95);
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

  // Clean Default Layout: 3 Organized Columns
  // Col 0: Suspects & Persons (Left, x: 80)
  // Col 1: Transit, Weapons & Syndicate Tools (Center, x: 480)
  // Col 2: Crime Scenes, Tolls & Sightings (Right, x: 880)
  const defaultPositions = useMemo(() => {
    const posMap: Record<string, NodePosition> = {};

    const suspects = filteredEntities.filter((e) => e.type === 'person');
    const middleTools = filteredEntities.filter((e) =>
      ['vehicle', 'weapon', 'object', 'organization'].includes(e.type)
    );
    const locations = filteredEntities.filter((e) => e.type === 'location');

    // Suspects on Left (x: 80)
    suspects.forEach((ent, idx) => {
      posMap[ent.id] = {
        x: 80,
        y: 110 + idx * 180,
      };
    });

    // Middle Operations Column (x: 480)
    middleTools.forEach((ent, idx) => {
      posMap[ent.id] = {
        x: 480,
        y: 80 + idx * 115,
      };
    });

    // Right Sightings & Crime Scenes (x: 880)
    locations.forEach((ent, idx) => {
      posMap[ent.id] = {
        x: 880,
        y: 85 + idx * 130,
      };
    });

    // Fallback for remaining
    filteredEntities.forEach((ent) => {
      if (!posMap[ent.id]) {
        posMap[ent.id] = { x: 480, y: 150 };
      }
    });

    return posMap;
  }, [filteredEntities]);

  const nodePositions = useMemo(() => {
    const merged: Record<string, NodePosition> = { ...defaultPositions };
    Object.keys(customPositions).forEach((id) => {
      if (customPositions[id]) {
        merged[id] = customPositions[id];
      }
    });
    return merged;
  }, [defaultPositions, customPositions]);

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
    setPan({ x: 40, y: 25 });
    setZoom(0.95);
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

  const CARD_WIDTH = 224;
  const CARD_HEIGHT = 68;

  return (
    <div
      id="link-canvas-bg"
      className="relative w-full h-[640px] bg-[#EFECE6] border-2 border-black shadow-brutal overflow-hidden font-mono select-none text-black flex flex-col"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* ─────────────────────────────────────────────────────────────
          TOP CONTROL STRIP: Filters, Search & Zoom
      ───────────────────────────────────────────────────────────── */}
      <div className="p-3 bg-white border-b-2 border-black flex flex-wrap items-center justify-between gap-3 z-10">
        {/* Left: Category Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase text-black flex items-center gap-1">
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
              <span className="text-[10px] px-1 bg-black/10 text-black font-bold">{btn.count}</span>
            </button>
          ))}

          {/* Search Box */}
          <div className="relative ml-2">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2 top-2" />
            <input
              type="text"
              placeholder="SEARCH SUSPECT / ENTITY..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#FBF9F5] border border-black text-black text-xs pl-7 pr-3 py-0.5 outline-none w-44 focus:w-56 focus:bg-white transition-all font-sans font-bold"
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

        {/* Right: Confidence Threshold & Zoom */}
        <div className="flex items-center space-x-3 text-xs font-bold">
          <div className="flex items-center space-x-2 border-r border-slate-300 pr-3">
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
            />
          </div>

          {/* Zoom Buttons */}
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
              title="Reset View"
              className="px-2 py-1 hover:bg-slate-100 flex items-center gap-1 font-bold text-[10px]"
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
        {/* Dot Grid Background */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="tactical-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="#000000" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#tactical-grid)" />
        </svg>

        {/* Scaled Diagram Group */}
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
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#059669" />
            </marker>
            <marker
              id="link-arrow-amber"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#D97706" />
            </marker>
            <marker
              id="link-arrow-red"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#DC2626" />
            </marker>
          </defs>

          {/* 1. Category Column Header Banners */}
          <g className="pointer-events-none font-mono">
            <rect x="80" y="30" width="224" height="26" fill="#111111" rx="2" />
            <text x="192" y="47" textAnchor="middle" fill="#F5C842" fontSize="11" fontWeight="900">
              PRIMARY SUSPECTS &amp; ACTORS
            </text>

            <rect x="480" y="30" width="224" height="26" fill="#111111" rx="2" />
            <text x="592" y="47" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="900">
              VEHICLES, WEAPONS &amp; NETWORK
            </text>

            <rect x="880" y="30" width="224" height="26" fill="#111111" rx="2" />
            <text x="992" y="47" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="900">
              CRIME SCENES &amp; SIGHTINGS
            </text>
          </g>

          {/* 2. Connecting Lines & Relationship Labels */}
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

              const dx = Math.abs(x2 - x1);
              const cx1 = isLeftToRight ? x1 + dx * 0.45 : x1 - dx * 0.45;
              const cy1 = y1;
              const cx2 = isLeftToRight ? x2 - dx * 0.45 : x2 + dx * 0.45;
              const cy2 = y2;
              const pathD = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;

              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;

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
                  style={{ opacity: isDimmed ? 0.16 : 1 }}
                  onMouseEnter={() => setHoveredRelId(rel.id)}
                  onMouseLeave={() => setHoveredRelId(null)}
                  onClick={() => onSelectRelationship(rel)}
                >
                  {/* Invisible broad stroke for easy hover */}
                  <path d={pathD} fill="none" stroke="transparent" strokeWidth="24" />

                  {/* Glow under active line */}
                  {(isHovered || rel.isContradiction) && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke={rel.isContradiction ? '#EF4444' : '#F5C842'}
                      strokeWidth={rel.isContradiction ? 7 : 5}
                      strokeOpacity={0.4}
                    />
                  )}

                  {/* Visible Line Path */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={rel.strokeColor}
                    strokeWidth={isHovered || rel.isContradiction ? 3 : 2}
                    strokeDasharray={rel.isContradiction ? '6,4' : rel.status === 'ai_suggested' ? '4,4' : 'none'}
                    markerEnd={markerName}
                    className={rel.isContradiction ? 'animate-pulse' : ''}
                  />

                  {/* Relationship Text Badge */}
                  <g transform={`translate(${midX}, ${midY})`} className="transition-transform hover:scale-105">
                    {rel.isContradiction ? (
                      <g>
                        <rect
                          x="-115"
                          y="-13"
                          width="230"
                          height="26"
                          rx="3"
                          fill="#DC2626"
                          stroke="#000000"
                          strokeWidth="2"
                        />
                        <text
                          x="0"
                          y="4"
                          textAnchor="middle"
                          fill="#FFFFFF"
                          fontSize="9.5"
                          fontWeight="900"
                          fontFamily="ui-monospace, monospace"
                        >
                          ⚡ 1,560 km/h CONTRADICTION ⚡
                        </text>
                      </g>
                    ) : (
                      <g>
                        <rect
                          x="-58"
                          y="-10"
                          width="116"
                          height="20"
                          rx="3"
                          fill={isHovered ? '#111111' : '#FFFFFF'}
                          stroke="#000000"
                          strokeWidth="1.5"
                        />
                        <text
                          x="0"
                          y="3"
                          textAnchor="middle"
                          fill={isHovered ? '#F5C842' : '#111111'}
                          fontSize="9"
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

          {/* 3. Entity Cards (Draggable Tactical Badges) */}
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
                  style={{ opacity: isDimmed ? 0.2 : 1 }}
                  onMouseEnter={() => setHoveredEntityId(entity.id)}
                  onMouseLeave={() => setHoveredEntityId(null)}
                  onClick={() => onSelectEntity(entity)}
                >
                  {/* Search Match Glow */}
                  {isSearchMatch && (
                    <rect
                      x="-4"
                      y="-4"
                      width={CARD_WIDTH + 8}
                      height={CARD_HEIGHT + 8}
                      rx="6"
                      fill="none"
                      stroke="#F5C842"
                      strokeWidth="3"
                    />
                  )}

                  {/* Drop Shadow Box */}
                  <rect x="3" y="3" width={CARD_WIDTH} height={CARD_HEIGHT} rx="4" fill="#000000" />

                  {/* Main Card Container */}
                  <rect
                    x="0"
                    y="0"
                    width={CARD_WIDTH}
                    height={CARD_HEIGHT}
                    rx="4"
                    fill={isHovered ? '#FBF9F5' : '#FFFFFF'}
                    stroke="#000000"
                    strokeWidth="2"
                  />

                  {/* Left Accent Strip */}
                  <path
                    d="M 0 4 Q 0 0 4 0 L 8 0 L 8 68 L 4 68 Q 0 68 0 64 Z"
                    fill={cfg.border}
                  />

                  {/* Drag Handle Top Grip */}
                  <g
                    className="cursor-move hover:opacity-80"
                    onMouseDown={(e) => startNodeDrag(e, entity.id)}
                  >
                    <rect x="0" y="0" width={CARD_WIDTH} height="16" fill="transparent" />
                    <circle cx={CARD_WIDTH - 12} cy="8" r="1.5" fill="#94A3B8" />
                    <circle cx={CARD_WIDTH - 8} cy="8" r="1.5" fill="#94A3B8" />
                    <circle cx={CARD_WIDTH - 4} cy="8" r="1.5" fill="#94A3B8" />
                  </g>

                  {/* Type Badge (Top Left) */}
                  <rect
                    x="14"
                    y="6"
                    width="95"
                    height="14"
                    rx="2"
                    fill={cfg.bg}
                    stroke={cfg.border}
                    strokeWidth="0.75"
                  />
                  <text
                    x="18"
                    y="16"
                    fill={cfg.color}
                    fontSize="7.5"
                    fontWeight="900"
                    fontFamily="ui-monospace, monospace"
                  >
                    {cfg.icon} {cfg.label}
                  </text>

                  {/* Agency Badge (Top Right) */}
                  <rect
                    x={CARD_WIDTH - 76}
                    y="6"
                    width="58"
                    height="14"
                    rx="2"
                    fill={agencyBadgeBg}
                  />
                  <text
                    x={CARD_WIDTH - 47}
                    y="16"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="7.5"
                    fontWeight="900"
                    fontFamily="ui-monospace, monospace"
                  >
                    {agencySlug}
                  </text>

                  {/* Entity Name */}
                  <text
                    x="14"
                    y="38"
                    fill="#000000"
                    fontSize="12.5"
                    fontWeight="900"
                    fontFamily="ui-monospace, monospace"
                  >
                    {entity.name.length > 22 ? entity.name.slice(0, 20) + '…' : entity.name}
                  </text>

                  {/* Sub-label */}
                  <text
                    x="14"
                    y="54"
                    fill="#64748B"
                    fontSize="9.5"
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

        {/* Bottom Legend */}
        <div className="absolute bottom-4 left-4 z-10 bg-white border-2 border-black p-3 shadow-brutal font-mono text-xs space-y-1.5 pointer-events-auto">
          <div className="text-[10px] font-black uppercase text-black flex items-center justify-between gap-6 border-b border-slate-200 pb-1">
            <span>TACTICAL CASE BOARD LEGEND</span>
            <span className="text-slate-600 font-bold">CLICK CARDS &amp; LINES</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px] font-bold">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#D1FAE5] border border-[#059669]" />
              <span>SUSPECT</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#FEF3C7] border border-[#D97706]" />
              <span>VEHICLE</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#E0F2FE] border border-[#0284C7]" />
              <span>LOCATION</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#FEE2E2] border border-[#DC2626]" />
              <span>WEAPON</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#EDE9FE] border border-[#7C3AED]" />
              <span>SYNDICATE</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#F1F5F9] border border-[#475569]" />
              <span>OBJECT</span>
            </div>
          </div>

          <div className="pt-1 border-t border-slate-200 flex items-center space-x-4 text-[9px] font-black">
            <span className="flex items-center space-x-1 text-[#059669]">
              <span className="w-3.5 h-0.5 bg-[#059669]" />
              <span>CONFIRMED LINK</span>
            </span>
            <span className="flex items-center space-x-1 text-[#D97706]">
              <span className="w-3.5 h-0.5 bg-[#D97706] border-dashed border-t" />
              <span>AI SUGGESTED</span>
            </span>
            <span className="flex items-center space-x-1 text-red-600">
              <span className="w-3.5 h-1 bg-red-600 animate-pulse" />
              <span>CONTRADICTION</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
