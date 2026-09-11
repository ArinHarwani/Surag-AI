'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Entity, Relationship, EntityType } from '@/types/investigation';
import 'leaflet/dist/leaflet.css';

interface NexusGeoGraphMapProps {
  entities: Entity[];
  relationships: Relationship[];
  onSelectEntity: (entity: Entity) => void;
  onSelectRelationship: (rel: Relationship) => void;
  selectedEntityId?: string;
  searchQuery?: string;
}

// Fallback / Grounded Spatial Coordinates across Rajasthan Corridor
export const ENTITY_COORDINATES: Record<string, { lat: number; lng: number; locationName: string }> = {
  'ent-aarav-singh': { lat: 26.2978, lng: 73.0232, locationName: 'Mehrangarh Clock Tower, Jodhpur' },
  'ent-scorpio-white': { lat: 26.1824, lng: 73.7112, locationName: 'Bilara Toll Plaza, NH-25' },
  'ent-bolero-silver': { lat: 25.1825, lng: 75.8398, locationName: 'Chambal River Bridge, Kota' },
  'ent-devendra-sharma': { lat: 25.1950, lng: 75.8450, locationName: 'Nayapura Toll Barrier, Kota' },
  'ent-glock-pistol': { lat: 25.1980, lng: 75.8490, locationName: 'Nayapura Cabin / Bolero Seat' },
  'ent-burner-sim': { lat: 24.9333, lng: 75.5833, locationName: 'Rawatbhata Safehouse, NH-52' },
  'ent-chambal-syndicate': { lat: 25.1650, lng: 75.8200, locationName: 'Chambal Logistics HQ, Kota' },
};

const TYPE_COLORS: Record<EntityType, string> = {
  person: '#10B981', // Emerald
  vehicle: '#F59E0B', // Amber
  location: '#06B6D4', // Cyan
  weapon: '#EF4444', // Red
  organization: '#8B5CF6', // Purple
  object: '#64748B', // Slate
};

// Dynamic Leaflet Map Component (ssr: false)
const InnerLeafletGeoMap = dynamic(
  async () => {
    const { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } = await import('react-leaflet');
    const L = await import('leaflet');

    // Custom tactical div icon
    const createGeoNodeIcon = (entity: Entity, isSelected: boolean) => {
      const color = TYPE_COLORS[entity.type] || '#F5C842';
      const label = entity.name.length > 22 ? entity.name.slice(0, 20) + '…' : entity.name;
      const ringColor = entity.agency_id?.includes('jodhpur') ? '#0284C7' : '#D97706';

      const html = `
        <div style="position: relative; cursor: pointer;">
          <div style="
            width: ${isSelected ? '38px' : '30px'};
            height: ${isSelected ? '38px' : '30px'};
            border-radius: 50%;
            background: ${color};
            border: 3px solid #000000;
            box-shadow: ${isSelected ? '0 0 0 3px #F5C842, 4px 4px 0px #000000' : '3px 3px 0px #000000'};
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            transition: all 0.2s;
          ">
            <div style="
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background: #FFFFFF;
              border: 1.5px solid #000000;
            "></div>

            <div style="
              position: absolute;
              top: -3px;
              right: -3px;
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background: ${ringColor};
              border: 1px solid #000000;
            "></div>
          </div>

          <div style="
            position: absolute;
            top: ${isSelected ? '40px' : '34px'};
            left: 50%;
            transform: translateX(-50%);
            white-space: nowrap;
            background: #FFFFFF;
            border: 2px solid #000000;
            padding: 2px 6px;
            font-size: 10px;
            font-weight: 900;
            font-family: monospace;
            box-shadow: 2px 2px 0px #000000;
            color: #000000;
            display: flex;
            align-items: center;
            gap: 4px;
            z-index: 1000;
          ">
            <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${color};"></span>
            <span>${label}</span>
          </div>
        </div>
      `;

      return L.divIcon({
        className: 'osm-geo-graph-pin',
        html,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });
    };

    // Controller component to auto-pan
    const MapRecenter: React.FC<{ selectedEntity?: Entity }> = ({ selectedEntity }) => {
      const map = useMap();
      useEffect(() => {
        if (selectedEntity) {
          const coords = ENTITY_COORDINATES[selectedEntity.id];
          if (coords) {
            map.flyTo([coords.lat, coords.lng], 13, { duration: 1.2 });
          }
        }
      }, [selectedEntity, map]);
      return null;
    };

    return function LeafletGeoMap({
      entities,
      relationships,
      onSelectEntity,
      onSelectRelationship,
      selectedEntityId,
    }: NexusGeoGraphMapProps) {
      const selectedEntity = entities.find((e) => e.id === selectedEntityId);

      // Build plotted nodes with coords
      const nodesWithCoords = useMemo(() => {
        return entities
          .map((entity) => {
            const coords = ENTITY_COORDINATES[entity.id];
            if (!coords) return null;
            return { entity, coords };
          })
          .filter(Boolean) as { entity: Entity; coords: { lat: number; lng: number; locationName: string } }[];
      }, [entities]);

      // Build active graph edges
      const edges = useMemo(() => {
        return relationships
          .map((rel) => {
            const srcCoords = ENTITY_COORDINATES[rel.source_entity_id];
            const dstCoords = ENTITY_COORDINATES[rel.target_entity_id];
            if (!srcCoords || !dstCoords) return null;

            const isConflict =
              (rel.source_entity_id === 'ent-aarav-singh' && rel.target_entity_id === 'ent-bolero-silver') ||
              (rel.source_entity_id === 'ent-scorpio-white' && rel.target_entity_id === 'ent-bolero-silver');

            return {
              rel,
              positions: [
                [srcCoords.lat, srcCoords.lng] as [number, number],
                [dstCoords.lat, dstCoords.lng] as [number, number],
              ],
              isConflict,
              color: isConflict ? '#DC2626' : rel.status === 'confirmed' ? '#10B981' : '#D97706',
              dashArray: isConflict ? '6, 6' : rel.status === 'confirmed' ? undefined : '4, 4',
            };
          })
          .filter(Boolean) as {
          rel: Relationship;
          positions: [number, number][];
          isConflict: boolean;
          color: string;
          dashArray?: string;
        }[];
      }, [relationships]);

      return (
        <MapContainer
          center={[25.75, 74.5]} // Center between Jodhpur and Kota
          zoom={8}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', minHeight: '520px', background: '#EAE6DD' }}
        >
          {/* OpenStreetMap Real Street Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          <MapRecenter selectedEntity={selectedEntity} />

          {/* Graph Connection Edges (Polylines on OpenStreetMap) */}
          {edges.map((edge) => (
            <Polyline
              key={edge.rel.id}
              positions={edge.positions}
              pathOptions={{
                color: edge.color,
                weight: edge.isConflict ? 4 : 3,
                dashArray: edge.dashArray,
                opacity: 0.85,
              }}
              eventHandlers={{
                click: () => onSelectRelationship(edge.rel),
              }}
            >
              <Tooltip sticky direction="top" opacity={0.95}>
                <div className="p-1 font-mono text-xs font-bold text-black">
                  <div className="uppercase tracking-wider">
                    {edge.rel.relationship_type} ({Math.round(edge.rel.confidence * 100)}%)
                  </div>
                  {edge.isConflict && (
                    <div className="text-red-600 font-black text-[10px]">
                      ⚠️ 1,560 km/h CONTRADICTION DETECTED
                    </div>
                  )}
                  <div className="text-[10px] text-slate-600">Click to arbitrate link</div>
                </div>
              </Tooltip>
            </Polyline>
          ))}

          {/* Temporal Conflict Corridor Line between Jodhpur and Kota */}
          <Polyline
            positions={[
              [26.2978, 73.0232], // Jodhpur Clock Tower
              [26.1824, 73.7112], // Bilara Toll
              [25.1825, 75.8398], // Chambal Bridge Kota
            ]}
            pathOptions={{
              color: '#DC2626',
              weight: 3,
              dashArray: '8, 8',
              opacity: 0.6,
            }}
          />

          {/* Entity Node Pins on OpenStreetMap */}
          {nodesWithCoords.map(({ entity, coords }) => (
            <Marker
              key={entity.id}
              position={[coords.lat, coords.lng]}
              icon={createGeoNodeIcon(entity, entity.id === selectedEntityId)}
              eventHandlers={{
                click: () => onSelectEntity(entity),
              }}
            >
              <Popup>
                <div className="p-2 font-mono text-xs text-black space-y-1">
                  <div className="font-black text-sm uppercase">{entity.name}</div>
                  <div className="text-[10px] font-bold text-slate-600 uppercase">
                    TYPE: {entity.type} • {coords.locationName}
                  </div>
                  <div className="text-[11px] font-medium text-slate-800">
                    {entity.attributes?.role || entity.attributes?.model || entity.attributes?.status || 'Active entity'}
                  </div>
                  <button
                    onClick={() => onSelectEntity(entity)}
                    className="mt-2 w-full px-2 py-1 bg-[#F5C842] hover:bg-[#EAB308] text-black font-black text-[10px] border border-black uppercase"
                  >
                    INSPECT INTEL DOSSIER
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      );
    };
  },
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[500px] flex flex-col items-center justify-center bg-[#EFECE6] text-black font-mono text-xs border-2 border-black">
        <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mb-3" />
        <span className="font-black tracking-widest">LOADING OPENSTREETMAP GEO-GRAPH TILES...</span>
      </div>
    ),
  }
);

export const NexusGeoGraphMap: React.FC<NexusGeoGraphMapProps> = (props) => {
  return (
    <div className="w-full h-full min-h-[520px] relative border-2 border-black bg-white shadow-brutal overflow-hidden">
      <InnerLeafletGeoMap {...props} />

      {/* Rajasthan Corridor Overlay Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-xs border-2 border-black p-2.5 shadow-brutal font-mono text-xs space-y-1.5 pointer-events-auto">
        <div className="text-[10px] font-black uppercase tracking-wider text-black flex items-center justify-between gap-3">
          <span>OPENSTREETMAP GEO-GRAPH</span>
          <span className="bg-emerald-100 text-emerald-800 px-1 py-0.2 border border-emerald-600 text-[9px]">
            ACTIVE TILES
          </span>
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
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] border border-black" />
            <span>WEAPON</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] border border-black" />
            <span>ORG</span>
          </div>
        </div>
        <div className="text-[9px] text-red-600 font-black border-t border-slate-300 pt-1">
          RED DASHED CORRIDOR: 390 KM IMPOSSIBLE VELOCITY (1,560 KM/H)
        </div>
      </div>
    </div>
  );
};
