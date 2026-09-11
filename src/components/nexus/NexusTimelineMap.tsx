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
    const { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } = await import('react-leaflet');
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
        popupAnchor: [0, -32],
      });
    };

    function MapController({ selectedCoords }: { selectedCoords: [number, number] | null }) {
      const map = useMap();
      React.useEffect(() => {
        if (selectedCoords) {
          map.flyTo(selectedCoords, 12, { duration: 1.2 });
        }
      }, [selectedCoords, map]);
      return null;
    }

    return function MapComponent({
      events,
      onOpenProvenance,
      selectedCoords,
    }: {
      events: Event[];
      onOpenProvenance: (docId: string, offset: string, snippet?: string) => void;
      selectedCoords: [number, number] | null;
    }) {
      const validEvents = events.filter((e) => typeof e.lat === 'number' && typeof e.lng === 'number');
      const center: [number, number] = validEvents.length > 0 && validEvents[0].lat && validEvents[0].lng
        ? [validEvents[0].lat, validEvents[0].lng]
        : [26.2389, 73.0243]; // Default Rajasthan central view

      const corridorPoints: [number, number][] = validEvents.map(e => [e.lat!, e.lng!]);

      return (
        <MapContainer
          center={center}
          zoom={8}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', minHeight: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapController selectedCoords={selectedCoords} />

          {corridorPoints.length > 1 && (
            <Polyline
              positions={corridorPoints}
              pathOptions={{
                color: '#000000',
                weight: 3,
                dashArray: '6, 6',
                opacity: 0.8
              }}
            />
          )}

          {validEvents.map((evt, idx) => {
            const color = evt.lat && evt.lat > 25.5 ? '#0284C7' : '#D97706';
            const pinLabel = evt.location_text ? evt.location_text.split(',')[0].toUpperCase() : `WAYPOINT #${idx + 1}`;
            const pin = createTacticalPin(color, pinLabel, false);

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
      <div className="w-full h-full min-h-[460px] bg-[#EFECE6] border-2 border-black flex flex-col items-center justify-center p-8 font-mono text-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs font-black uppercase tracking-wider text-black">
          INITIALIZING GEOSPATIAL VECTOR MAP...
        </span>
      </div>
    ),
  }
);

export const NexusTimelineMap: React.FC<NexusTimelineMapProps> = ({
  events,
  onOpenProvenance,
}) => {
  const [selectedFrame, setSelectedFrame] = useState<number>(0);
  const [isMatrixExpanded, setIsMatrixExpanded] = useState<boolean>(false);
  const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(null);

  // Sorted events chronologically
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.event_timestamp).getTime() - new Date(b.event_timestamp).getTime()
  );

  // Dynamic Filmstrip frames derived from real case events
  const filmstripFrames = sortedEvents.map((evt, idx) => ({
    idx,
    time: formatTimeIST(evt.event_timestamp, false),
    location: evt.location_text || 'Location',
    title: evt.description?.slice(0, 45) || `Event #${idx + 1}`,
    tag: 'EVIDENCE EVENT',
    coords: (typeof evt.lat === 'number' && typeof evt.lng === 'number' ? [evt.lat, evt.lng] : null) as [number, number] | null,
    docId: evt.document_id,
    offset: evt.source_offset || 'Line 1-10',
    description: evt.description
  }));

  // Velocity matrix calculated from consecutive chronological waypoints
  const velocityMatrix: Array<{
    from: string;
    to: string;
    distance: string;
    deltaT: string;
    calculatedSpeed: string;
    status: string;
    isAnomaly: boolean;
    cause: string;
    docA: string;
  }> = [];

  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const e1 = sortedEvents[i];
    const e2 = sortedEvents[i + 1];
    if (typeof e1.lat === 'number' && typeof e1.lng === 'number' && typeof e2.lat === 'number' && typeof e2.lng === 'number') {
      // Rough distance in km using Equirectangular approximation
      const latDiff = (e2.lat - e1.lat) * 111;
      const lngDiff = (e2.lng - e1.lng) * 111 * Math.cos(((e1.lat + e2.lat) / 2) * (Math.PI / 180));
      const distKm = Math.round(Math.sqrt(latDiff * latDiff + lngDiff * lngDiff));

      const t1 = new Date(e1.event_timestamp).getTime();
      const t2 = new Date(e2.event_timestamp).getTime();
      const deltaMinutes = Math.max(1, Math.round(Math.abs(t2 - t1) / 60000));
      const hours = deltaMinutes / 60;
      const speed = Math.round(distKm / hours);
      const isAnomaly = speed > 160 && distKm > 20;

      velocityMatrix.push({
        from: e1.location_text || 'Origin',
        to: e2.location_text || 'Destination',
        distance: `${distKm} km`,
        deltaT: `${deltaMinutes} min`,
        calculatedSpeed: `${speed} km/h`,
        status: isAnomaly ? 'FLAGGED ANOMALY' : 'VERIFIED TRANSIT',
        isAnomaly,
        cause: isAnomaly
          ? `High transit speed (${speed} km/h) exceeds standard road parameters. Check for decoy or spoofed logging.`
          : 'Normal highway cruising velocity within expected ranges.',
        docA: e1.document_id
      });
    }
  }

  const activeFrame = filmstripFrames[selectedFrame] || filmstripFrames[0];

  return (
    <div className="p-4 lg:p-6 space-y-4 font-mono select-none text-black">
      {/* 1. DOMINANT MAP + SLIM RIGHT RAIL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* DOMINANT MAP CONTAINER (9 cols) */}
        <div className="lg:col-span-9 flex flex-col space-y-2">
          {/* Map Header Bar */}
          <div className="flex flex-wrap items-center justify-between bg-white px-4 py-2.5 border-2 border-black shadow-brutal">
            <div className="flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-black" />
              <span className="text-xs font-black uppercase tracking-wider text-black">
                GEOSPATIAL CORRIDOR MAP // {events.length} TRACKED WAYPOINTS
              </span>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1.5 font-bold">
                <span className="w-2.5 h-2.5 bg-[#0284C7] rounded-full inline-block border border-black" />
                <span className="text-[11px]">JODHPUR JURISDICTION</span>
              </span>
              <span className="flex items-center space-x-1.5 font-bold">
                <span className="w-2.5 h-2.5 bg-[#D97706] rounded-full inline-block border border-black" />
                <span className="text-[11px]">KOTA JURISDICTION</span>
              </span>
            </div>
          </div>

          {/* Map Display Frame */}
          <div className="relative w-full h-[520px] bg-slate-100 border-2 border-black shadow-brutal overflow-hidden">
            <InnerMap
              events={events}
              onOpenProvenance={onOpenProvenance}
              selectedCoords={selectedCoords}
            />

            {events.length === 0 && (
              <div className="absolute inset-0 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20">
                <MapPin className="w-10 h-10 text-slate-400 mb-2" />
                <h4 className="text-sm font-black uppercase text-black">NO TIMELINE WAYPOINTS LOGGED</h4>
                <p className="text-xs text-slate-600 font-sans max-w-sm mt-1">
                  Chronological timestamps and coordinates are extracted automatically from ingested witness statements, logs, and evidence.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* SLIM RIGHT RAIL: CHRONOLOGICAL FLIGHT RECORDER (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="bg-white border-2 border-black p-4 shadow-brutal space-y-3">
            <div className="border-b border-black pb-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-red-600 tracking-wider block">
                  CHRONOLOGY FEED
                </span>
                <h4 className="text-xs font-black uppercase text-black">
                  CHRONOLOGICAL WAYPOINTS
                </h4>
              </div>
              <span className="text-xs font-black bg-black text-[#F5C842] px-1.5 py-0.5">
                {events.length}
              </span>
            </div>

            {filmstripFrames.length === 0 ? (
              <p className="text-xs text-slate-500 font-sans p-3 text-center">
                No chronological events recorded yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {filmstripFrames.map((frame) => {
                  const isSelected = frame.idx === selectedFrame;
                  return (
                    <div
                      key={frame.idx}
                      onClick={() => {
                        setSelectedFrame(frame.idx);
                        if (frame.coords) setSelectedCoords(frame.coords);
                      }}
                      className={`p-2.5 border-2 cursor-pointer transition text-xs shadow-xs ${
                        isSelected
                          ? 'bg-[#F5C842] border-black text-black ring-1 ring-black'
                          : 'bg-white hover:bg-slate-50 border-black'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono font-bold mb-1">
                        <span className="bg-black text-white px-1">{frame.time}</span>
                        <span className="text-slate-600">{frame.tag}</span>
                      </div>
                      <div className="font-black uppercase text-xs line-clamp-1">{frame.location}</div>
                      <p className="text-[11px] text-slate-700 font-sans mt-0.5 line-clamp-2">
                        {frame.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. COLLAPSIBLE VELOCITY & CORRELATION MATRIX */}
      <div className="bg-white border-2 border-black shadow-brutal overflow-hidden">
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
                <span className={`text-[10px] font-black px-2 py-0.5 uppercase border border-black ${
                  velocityMatrix.some(v => v.isAnomaly)
                    ? 'bg-[#E53E3E] text-white animate-pulse'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  {velocityMatrix.filter(v => v.isAnomaly).length} ANOMALIES DETECTED
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 font-bold">
                Calculates transit speed between chronological OpenStreetMap GPS waypoints to detect physical anomalies.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-black text-black">
            <span>{isMatrixExpanded ? 'COLLAPSE MATRIX' : 'EXPAND MATRIX'}</span>
            {isMatrixExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {isMatrixExpanded && (
          <div className="p-4 border-t-2 border-black bg-[#FBF9F5]">
            {velocityMatrix.length === 0 ? (
              <p className="text-xs text-slate-600 font-sans text-center p-4">
                At least 2 chronological waypoints with coordinates are required to compute transit speeds.
              </p>
            ) : (
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};
