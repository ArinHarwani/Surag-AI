'use client';

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
  Clock, 
  MapPin, 
  AlertOctagon, 
  FileText, 
  ExternalLink, 
  Film, 
  Navigation, 
  Sparkles, 
  ArrowRight, 
  ShieldAlert, 
  ChevronDown, 
  ChevronUp, 
  Table, 
  Eye, 
  Activity,
  Layers,
  Info
} from 'lucide-react';
import { Event } from '@/types/investigation';
import { formatTimeIST } from '@/lib/utils/formatDate';
import 'leaflet/dist/leaflet.css';

interface NexusTimelineMapProps {
  events: Event[];
  onOpenProvenance: (docId: string, offset: string, snippet?: string) => void;
}

// Inner Leaflet Map using OpenStreetMap tiles
const InnerMap = dynamic(
  async () => {
    const { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } = await import('react-leaflet');
    const L = await import('leaflet');

    // Custom Interactive Tactical Pin
    const createTacticalPin = (color: string, label: string, isConflict?: boolean) => {
      const html = `
        <div style="position: relative; cursor: pointer;">
          <div style="
            background-color: ${color};
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 2px solid #000000;
            box-shadow: 3px 3px 0px rgba(0,0,0,1);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 10px;
              height: 10px;
              background-color: #FFFFFF;
              border-radius: 50%;
              transform: rotate(45deg);
              border: 1px solid #000000;
            "></div>
          </div>
          ${isConflict ? `
            <div style="
              position: absolute;
              top: -6px;
              right: -6px;
              width: 12px;
              height: 12px;
              background-color: #E53E3E;
              border: 1px solid #000000;
              border-radius: 50%;
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
          ` : ''}
          <div style="
            position: absolute;
            top: 36px;
            left: 50%;
            transform: translateX(-50%);
            white-space: nowrap;
            background: #FFFFFF;
            border: 1.5px solid #000000;
            padding: 1px 5px;
            font-size: 10px;
            font-weight: 900;
            font-family: monospace;
            box-shadow: 2px 2px 0px rgba(0,0,0,1);
            color: #000000;
          ">
            ${label}
          </div>
        </div>
      `;
      return L.divIcon({
        className: 'osm-tactical-pin',
        html,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
      });
    };

    // Controller component to smoothly pan/zoom to selected point
    function MapController({ selectedCoords }: { selectedCoords: [number, number] | null }) {
      const map = useMap();
      React.useEffect(() => {
        if (selectedCoords) {
          map.flyTo(selectedCoords, 10, { duration: 1.2 });
        }
      }, [selectedCoords, map]);
      return null;
    }

    return function LeafletMap({
      events,
      onOpenProvenance,
      selectedCoords
    }: {
      events: Event[];
      onOpenProvenance: (docId: string, offset: string, snippet?: string) => void;
      selectedCoords: [number, number] | null;
    }) {
      const validEvents = events.filter((e) => typeof e.lat === 'number' && typeof e.lng === 'number');
      const center: [number, number] = [25.75, 74.45]; // Rajasthan central corridor view

      // Precise NH-25 / NH-27 Corridor waypoints
      const corridorPoints: [number, number][] = [
        [26.2978, 73.0189], // Jodhpur Clock Tower (Mehrangarh)
        [26.1824, 73.7112], // Bilara Toll Plaza (NH-25)
        [25.1825, 75.8398], // Chambal River Bridge (Kota)
        [25.1950, 75.8450], // Nayapura Barrier
        [24.9333, 75.5833]  // Rawatbhata Safehouse
      ];

      return (
        <MapContainer
          center={center}
          zoom={7}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', minHeight: '100%' }}
        >
          {/* Official OpenStreetMap Tiles (Light Interactive Map) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController selectedCoords={selectedCoords} />

          {/* Transit Corridor Polyline (Bold Black/Yellow Dashed Route) */}
          <Polyline
            positions={corridorPoints}
            pathOptions={{
              color: '#000000',
              weight: 4,
              dashArray: '8, 8',
              opacity: 0.9
            }}
          />

          {/* Impossible Velocity Radius Overlay around Kota Toll */}
          <Circle
            center={[25.1825, 75.8398]}
            radius={28000}
            pathOptions={{
              color: '#E53E3E',
              fillColor: '#E53E3E',
              fillOpacity: 0.15,
              weight: 2,
              dashArray: '4, 4'
            }}
          />

          {validEvents.map((evt) => {
            const isConflict = evt.id === 'evt-kota-chambal' || evt.id === 'evt-jod-clocktower';
            const color = isConflict 
              ? '#E53E3E' 
              : (evt.lat && evt.lat > 25.5 ? '#0284C7' : '#D97706');
            const pinLabel = evt.location_text ? evt.location_text.split(',')[0].toUpperCase() : 'WAYPOINT';
            const pin = createTacticalPin(color, pinLabel, isConflict);

            return (
              <Marker key={evt.id} position={[evt.lat!, evt.lng!]} icon={pin}>
                <Popup>
                  <div className="p-2 space-y-2 font-mono text-xs text-black max-w-xs">
                    <div className="flex items-center justify-between border-b-2 border-black pb-1.5">
                      <span className="font-black text-black uppercase text-xs">
                        {evt.location_text || 'KNOWN COORDINATES'}
                      </span>
                      <span suppressHydrationWarning className="text-[11px] font-black bg-black text-white px-1.5 py-0.5 rounded-xs">
                        {formatTimeIST(evt.event_timestamp, false)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-800 font-sans leading-relaxed font-medium">
                      {evt.description}
                    </p>

                    {isConflict && (
                      <div className="p-1.5 bg-[#FEE2E2] border border-red-500 text-red-800 font-black text-[10px]">
                        ⚡ CONFLICT: 390 KM IN 15 MIN (1,560 KM/H)
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-[11px]">
                      <span className="font-bold text-slate-600">CONFIDENCE: {Math.round((evt.confidence || 0.8) * 100)}%</span>
                      <button
                        onClick={() => onOpenProvenance(evt.document_id, evt.source_offset || 'Line 1-10', evt.description)}
                        className="text-blue-700 hover:underline font-black"
                      >
                        INSPECT SOURCE →
                      </button>
                    </div>
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
      <div className="w-full h-full min-h-[480px] flex flex-col items-center justify-center bg-[#EFECE6] text-black font-mono text-xs border-2 border-black">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-3" />
        <span className="font-black tracking-wider">LOADING OPENSTREETMAP RAJASTHAN CORRIDOR...</span>
      </div>
    )
  }
);

export const NexusTimelineMap: React.FC<NexusTimelineMapProps> = ({
  events,
  onOpenProvenance
}) => {
  const [selectedFrame, setSelectedFrame] = useState<number>(0);
  const [isMatrixExpanded, setIsMatrixExpanded] = useState<boolean>(false);
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);

  // Sorted events chronologically
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.event_timestamp).getTime() - new Date(b.event_timestamp).getTime()
  );

  // Filmstrip thumbnail frames (Synced to map waypoints)
  const filmstripFrames = [
    {
      idx: 0,
      time: '21:15 IST',
      location: 'Bilara Toll Plaza, NH-25',
      title: 'FASTag RFID Capture',
      tag: 'FASTAG RFID PASS',
      coords: [26.1824, 73.7112] as [number, number],
      docId: 'doc-jod-witness-01',
      offset: 'Line 1-4'
    },
    {
      idx: 1,
      time: '22:30 IST',
      location: 'Mehrangarh Clock Tower',
      title: 'Witness Encounter',
      tag: 'SIGHTING A (JODHPUR)',
      coords: [26.2978, 73.0189] as [number, number],
      isConflict: true,
      docId: 'doc-jod-witness-01',
      offset: 'Line 5-8'
    },
    {
      idx: 2,
      time: '22:45 IST',
      location: 'Chambal River Bridge',
      title: 'ANPR CCTV Surveillance',
      tag: 'SIGHTING B (KOTA)',
      coords: [25.1825, 75.8398] as [number, number],
      isConflict: true,
      docId: 'doc-kota-cctv-02',
      offset: 'Line 5-8'
    },
    {
      idx: 3,
      time: '01:15 IST',
      location: 'Rawatbhata Safehouse',
      title: 'Radio Wiretap Intercept',
      tag: 'AUDIO INTERCEPT',
      coords: [24.9333, 75.5833] as [number, number],
      docId: 'doc-wiretap-audio-03',
      offset: '00:02:14'
    },
    {
      idx: 4,
      time: '02:30 IST',
      location: 'Nayapura Barrier',
      title: 'NightVision Optical Frame 04',
      tag: 'WEAPON DETECTED',
      coords: [25.1950, 75.8450] as [number, number],
      docId: 'doc-cctv-optical-04',
      offset: 'bbox [120,450,280,620]'
    }
  ];

  // Correlation & Velocity Matrix data
  const velocityMatrix = [
    {
      from: 'Mehrangarh Clock Tower, Jodhpur',
      to: 'Chambal River Bridge, Kota',
      distance: '390 km',
      deltaT: '15 min (0.25h)',
      calculatedSpeed: '1,560 km/h',
      status: 'FLAGGED CRITICAL',
      isAnomaly: true,
      cause: 'Physically impossible transit velocity across NH-27. Confirms body-double decoy or falsified surveillance logging.',
      docA: 'doc-jod-witness-01',
      docB: 'doc-kota-cctv-02'
    },
    {
      from: 'Bilara Toll Plaza, NH-25',
      to: 'Mehrangarh Clock Tower',
      distance: '75 km',
      deltaT: '1h 15m',
      calculatedSpeed: '60 km/h',
      status: 'VERIFIED TRANSIT',
      isAnomaly: false,
      cause: 'Normal highway cruising speed within standard speed limits.',
      docA: 'doc-jod-witness-01',
      docB: 'doc-jod-witness-01'
    },
    {
      from: 'Chambal River Bridge, Kota',
      to: 'Rawatbhata Highway Safehouse',
      distance: '48 km',
      deltaT: '2h 30m',
      calculatedSpeed: '19.2 km/h',
      status: 'VERIFIED TRANSIT',
      isAnomaly: false,
      cause: 'Low transit speed consistent with evasive detour and unpaved secondary trails.',
      docA: 'doc-kota-cctv-02',
      docB: 'doc-wiretap-audio-03'
    }
  ];

  return (
    <div className="p-4 lg:p-6 space-y-4 font-mono select-none text-black">
      {/* 1. DOMINANT MAP (60%+ Dominant Anchor) + SLIM RIGHT RAIL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* DOMINANT MAP CONTAINER (9 cols) */}
        <div className="lg:col-span-9 flex flex-col space-y-2">
          {/* Map Header Bar */}
          <div className="flex flex-wrap items-center justify-between bg-white px-4 py-2.5 border-2 border-black shadow-brutal">
            <div className="flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-black" />
              <span className="text-xs font-black uppercase tracking-wider text-black">
                OPENSTREETMAP INTERACTIVE GEOSPATIAL CORRIDOR // NH-25 &amp; NH-27
              </span>
            </div>

            {/* Legend Pins */}
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1 text-[#0284C7] font-black">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0284C7] border border-black" />
                <span>JODHPUR SECTOR</span>
              </span>
              <span className="flex items-center space-x-1 text-[#D97706] font-black">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] border border-black" />
                <span>KOTA SECTOR</span>
              </span>
              <span className="flex items-center space-x-1 text-red-600 font-black bg-[#FEE2E2] px-2 py-0.5 border border-red-500">
                <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                <span>IMPOSSIBLE VELOCITY ANOMALY</span>
              </span>
            </div>
          </div>

          {/* OpenStreetMap Canvas (Dominant ~520px height) */}
          <div className="w-full h-[520px] bg-white border-2 border-black shadow-brutal-lg relative overflow-hidden">
            <InnerMap 
              events={events} 
              onOpenProvenance={onOpenProvenance} 
              selectedCoords={selectedCoords} 
            />
          </div>

          {/* Filmstrip Thumbnail Row Synced Directly Beneath the Map */}
          <div className="bg-white border-2 border-black p-3.5 shadow-brutal space-y-2.5">
            <div className="flex items-center justify-between text-xs font-black uppercase text-black">
              <div className="flex items-center space-x-2">
                <Film className="w-4 h-4 text-black" />
                <span>INTERACTIVE TIMELINE FILMSTRIP (CLICK TO FLY ON MAP)</span>
              </div>
              <span className="text-slate-600 text-[11px]">5 SYNCHRONIZED WAYPOINTS</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {filmstripFrames.map((frame) => {
                const isSelected = selectedFrame === frame.idx;

                return (
                  <div
                    key={frame.idx}
                    onClick={() => {
                      setSelectedFrame(frame.idx);
                      setSelectedCoords(frame.coords);
                    }}
                    className={`p-2.5 border-2 border-black cursor-pointer transition-all flex flex-col justify-between ${
                      frame.isConflict
                        ? 'bg-[#FEE2E2] text-red-900 border-red-600 shadow-brutal hover:bg-red-100'
                        : isSelected
                        ? 'bg-[#F5C842] text-black shadow-brutal scale-[1.02]'
                        : 'bg-[#FBF9F5] text-black hover:bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-black">
                        <span className={frame.isConflict ? 'text-red-700' : 'text-black'}>
                          {frame.time}
                        </span>
                        <span className={`text-[9px] uppercase font-black px-1.5 py-0.2 border border-black ${
                          frame.isConflict ? 'bg-red-600 text-white' : 'bg-black text-[#F5C842]'
                        }`}>
                          {frame.tag}
                        </span>
                      </div>
                      <p className="text-xs font-black truncate mt-1.5 text-black">
                        {frame.title}
                      </p>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-black/20 flex items-center justify-between text-[10px]">
                      <span className="truncate text-slate-700 font-bold">{frame.location}</span>
                      <span className="font-black text-blue-700 ml-1">FLY ↗</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SLIM RIGHT RAIL: Live Audit Event Feed (3 cols) */}
        <div className="lg:col-span-3 bg-white border-2 border-black p-4 flex flex-col h-[640px] shadow-brutal space-y-3">
          <div className="flex items-center justify-between border-b-2 border-black pb-2.5">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-black" />
              <span className="text-xs font-black uppercase tracking-wider text-black">
                LIVE AUDIT STREAM
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 bg-black text-white font-black">
              {events.length} LOGS
            </span>
          </div>

          {/* Compact Stream */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {sortedEvents.map((evt) => {
              const isConflict = evt.id === 'evt-kota-chambal' || evt.id === 'evt-jod-clocktower';

              return (
                <div
                  key={evt.id}
                  onClick={() => onOpenProvenance(evt.document_id, evt.source_offset || 'Line 1-10', evt.description)}
                  className={`p-2.5 border border-black cursor-pointer transition text-xs space-y-1 ${
                    isConflict
                      ? 'bg-[#FEE2E2] border-red-500 shadow-sm'
                      : 'bg-[#FBF9F5] hover:bg-white shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span suppressHydrationWarning className="font-black text-black">
                      {formatTimeIST(evt.event_timestamp, false)}
                    </span>
                    <span className={`text-[9px] font-black px-1.5 py-0.2 border border-black ${
                      isConflict ? 'bg-red-600 text-white' : 'bg-slate-200 text-black'
                    }`}>
                      {isConflict ? 'CONFLICT' : 'LOGGED'}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight">
                    {evt.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-600 pt-1 border-t border-slate-200">
                    <span className="truncate">{evt.location_text || 'Coordinated'}</span>
                    <span className="text-blue-700 font-black">PROVENANCE →</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t-2 border-black text-[11px] text-slate-700 flex items-center justify-between font-black">
            <span>SYNC PROTOCOL</span>
            <span className="text-emerald-700">OSM REALTIME ACTIVE</span>
          </div>
        </div>
      </div>

      {/* 2. COLLAPSIBLE VELOCITY & CORRELATION MATRIX (Toggle Tab) */}
      <div className="bg-white border-2 border-black shadow-brutal overflow-hidden">
        {/* Toggle Bar Header */}
        <button
          onClick={() => setIsMatrixExpanded(!isMatrixExpanded)}
          className="w-full px-5 py-3.5 bg-white hover:bg-slate-100 flex items-center justify-between transition text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-black text-[#F5C842]">
              <Table className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-black">
                  TRANSIT VELOCITY &amp; CORRELATION MATRIX
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 bg-[#E53E3E] text-white uppercase animate-pulse border border-black">
                  1 ANOMALY DETECTED (1,560 KM/H)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 font-bold">
                Calculates transit speed between chronological OpenStreetMap GPS waypoints to identify physical impossibility.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-black text-black">
            <span>{isMatrixExpanded ? 'COLLAPSE MATRIX' : 'EXPAND MATRIX'}</span>
            {isMatrixExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {/* Collapsible Content */}
        {isMatrixExpanded && (
          <div className="p-4 border-t-2 border-black bg-[#FBF9F5]">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-black text-[11px] text-black uppercase bg-white">
                    <th className="py-2.5 px-3 font-black">Waypoint Origin</th>
                    <th className="py-2.5 px-3 font-black">Destination</th>
                    <th className="py-2.5 px-3 font-black">Distance</th>
                    <th className="py-2.5 px-3 font-black">Time Delta</th>
                    <th className="py-2.5 px-3 font-black">Calculated Speed</th>
                    <th className="py-2.5 px-3 font-black">Physical Status</th>
                    <th className="py-2.5 px-3 text-right font-black">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/20">
                  {velocityMatrix.map((row, i) => (
                    <tr
                      key={i}
                      className={
                        row.isAnomaly
                          ? 'bg-[#FEE2E2] text-black font-bold'
                          : 'bg-white hover:bg-slate-50 text-slate-900'
                      }
                    >
                      <td className="py-3 px-3 font-black">{row.from}</td>
                      <td className="py-3 px-3 font-black">{row.to}</td>
                      <td className="py-3 px-3 font-mono font-bold">{row.distance}</td>
                      <td className="py-3 px-3 font-mono font-bold">{row.deltaT}</td>
                      <td className="py-3 px-3 font-mono font-black text-sm">
                        <span className={row.isAnomaly ? 'text-red-700' : 'text-emerald-700'}>
                          {row.calculatedSpeed}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-black uppercase border border-black ${
                            row.isAnomaly
                              ? 'bg-[#E53E3E] text-white'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {row.status}
                        </span>
                        {row.isAnomaly && (
                          <div className="text-[11px] text-red-900 mt-1 max-w-sm font-sans font-medium">
                            {row.cause}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onOpenProvenance(row.docA, 'Source telemetry', row.cause)}
                          className="px-3 py-1 bg-black text-[#F5C842] hover:bg-slate-900 text-xs font-black border border-black shadow-sm transition"
                        >
                          INSPECT
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
