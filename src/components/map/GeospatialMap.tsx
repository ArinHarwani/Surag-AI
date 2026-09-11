'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useInvestigation } from '@/lib/store/investigation-context';
import { Event } from '@/types/investigation';
import { MapPin, Navigation, Compass, AlertTriangle, Eye } from 'lucide-react';
import { formatTimeIST } from '@/lib/utils/formatDate';

// Leaflet CSS needs to be present
import 'leaflet/dist/leaflet.css';

// Dynamic import with SSR disabled
const DynamicMapContainer = dynamic(
  async () => {
    const { MapContainer, TileLayer, Marker, Popup, Polyline } = await import('react-leaflet');
    const L = (await import('leaflet')).default;

    // Fix default marker icon issues in Next.js
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const createTacticalIcon = (color: string, label: string) => {
      return L.divIcon({
        className: 'tactical-marker',
        html: `
          <div style="
            background: ${color};
            width: 22px;
            height: 22px;
            border-radius: 50%;
            border: 2px solid #ffffff;
            box-shadow: 0 0 12px ${color};
            display: flex;
            align-items: center;
            justify-content: center;
            color: #000000;
            font-size: 10px;
            font-weight: 800;
            font-family: monospace;
          ">
            ${label}
          </div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });
    };

    return function TacticalMapInner({
      events,
      agencies,
      selectedEvent,
      setSelectedEvent,
      setProvenanceFocus,
      contradictions,
    }: any) {
      // Center roughly between Jodhpur and Kota (Rajasthan Interstate corridor)
      const centerPos: [number, number] = [25.75, 74.5];

      // Highway trajectory connecting the chronological transit events
      const routeCoordinates: [number, number][] = [
        [26.354, 73.045], // Mandore (Jodhpur)
        [26.182, 73.708], // Bilara Toll (NH-25)
        [25.138, 75.834], // Vigyan Nagar (Kota)
        [25.162, 75.815], // Chambal Flyover (Kota)
      ];

      return (
        <MapContainer
          center={centerPos}
          zoom={7}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={true}
        >
          {/* CartoDB Dark Matter Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={19}
          />

          {/* Transit Route Corridor (NH-25 / NH-27) */}
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: '#38bdf8',
              weight: 3,
              opacity: 0.7,
              dashArray: '8, 8',
            }}
          />

          {/* Event Geospatial Markers */}
          {events
            .filter((e: Event) => e.lat && e.lng)
            .map((evt: Event, index: number) => {
              const isContradiction = contradictions.some(
                (c: any) => c.event_a_id === evt.id || c.event_b_id === evt.id
              );
              const isJodhpur = evt.location_text.toLowerCase().includes('jodhpur') || evt.location_text.toLowerCase().includes('mandore') || evt.location_text.toLowerCase().includes('bilara');
              
              let markerColor = isJodhpur ? '#06b6d4' : '#f59e0b';
              if (isContradiction) markerColor = '#f43f5e'; // Highlight contradiction in red

              return (
                <Marker
                  key={evt.id}
                  position={[evt.lat!, evt.lng!]}
                  icon={createTacticalIcon(markerColor, `${index + 1}`)}
                  eventHandlers={{
                    click: () => setSelectedEvent(evt),
                  }}
                >
                  <Popup className="tactical-popup">
                    <div className="bg-slate-900 text-slate-100 p-2.5 rounded-lg text-xs max-w-xs space-y-1.5 font-sans border border-slate-700">
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-[10px] uppercase font-bold text-cyan-400">
                          {isJodhpur ? 'Jodhpur Police Sector' : 'Kota Police Sector'}
                        </span>
                        <span suppressHydrationWarning className="text-[10px] text-slate-400">
                          {formatTimeIST(evt.event_timestamp, false)}
                        </span>
                      </div>
                      <div className="font-bold text-slate-100 leading-snug">
                        {evt.location_text}
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {evt.description}
                      </p>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] font-mono text-slate-400">
                        <span>Offset: {evt.source_offset}</span>
                        <span className="text-emerald-400 font-bold">{Math.round(evt.confidence * 100)}% Conf</span>
                      </div>
                      <button
                        onClick={() => {
                          setProvenanceFocus({
                            documentId: evt.document_id,
                            sourceOffset: evt.source_offset,
                            snippet: evt.description,
                          });
                        }}
                        className="w-full mt-1.5 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-700/60 rounded text-cyan-300 text-[11px] font-mono flex items-center justify-center gap-1 transition"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Inspect Evidence Source</span>
                      </button>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
        </MapContainer>
      );
    };
  },
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-400 font-mono text-xs">
        <Compass className="w-6 h-6 animate-spin text-cyan-400 mb-2" />
        <span>INITIALIZING TACTICAL GEOSPATIAL MAP...</span>
      </div>
    ),
  }
);

export function GeospatialMap() {
  const {
    events,
    agencies,
    selectedEvent,
    setSelectedEvent,
    setProvenanceFocus,
    contradictions,
  } = useInvestigation();

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
      {/* Top Map HUD overlay */}
      <div className="absolute top-2 left-2 z-[400] bg-slate-900/90 border border-slate-800 rounded-md px-2.5 py-1 backdrop-blur text-[11px] font-mono flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Navigation className="w-3 h-3 text-cyan-400" />
          <span>Rajasthan Interstate Syndicate Corridor (NH-25 / NH-27)</span>
        </div>
        <div className="flex items-center gap-2 border-l border-slate-700 pl-2">
          <span className="flex items-center gap-1 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400" /> Jodhpur Sector
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> Kota Sector
          </span>
          <span className="flex items-center gap-1 text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" /> Contradiction Zone
          </span>
        </div>
      </div>

      <DynamicMapContainer
        events={events}
        agencies={agencies}
        selectedEvent={selectedEvent}
        setSelectedEvent={setSelectedEvent}
        setProvenanceFocus={setProvenanceFocus}
        contradictions={contradictions}
      />
    </div>
  );
}
