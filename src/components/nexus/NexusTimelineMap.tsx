'use client';

import React, { useState } from 'react';
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
  Activity
} from 'lucide-react';
import { Event } from '@/types/investigation';
import 'leaflet/dist/leaflet.css';

interface NexusTimelineMapProps {
  events: Event[];
  onOpenProvenance: (docId: string, offset: string, snippet?: string) => void;
}

// Inner Leaflet Map with Dark CartoDB Matter styling
const InnerMap = dynamic(
  async () => {
    const { MapContainer, TileLayer, Marker, Popup, Polyline } = await import('react-leaflet');
    const L = await import('leaflet');

    const createPin = (color: string, label?: string) => {
      const html = `
        <div style="
          background-color: ${color};
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid #FFFFFF;
          box-shadow: 0 4px 12px rgba(0,0,0,0.9);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 10px;
            height: 10px;
            background-color: #000000;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `;
      return L.divIcon({
        className: 'nexus-pin',
        html,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
      });
    };

    return function LeafletMap({
      events,
      onOpenProvenance
    }: {
      events: Event[];
      onOpenProvenance: (docId: string, offset: string, snippet?: string) => void;
    }) {
      const validEvents = events.filter((e) => typeof e.lat === 'number' && typeof e.lng === 'number');
      const center: [number, number] = [25.74, 74.43];

      const routeCorridor: [number, number][] = [
        [26.2980, 73.0189], // Jodhpur Clock Tower
        [26.1824, 73.7112], // Bilara Toll Plaza (NH-25)
        [25.1825, 75.8398], // Chambal Bridge (Kota)
        [25.1950, 75.8450], // Nayapura Toll
        [24.9333, 75.5833]  // Rawatbhata Safehouse
      ];

      return (
        <MapContainer
          center={center}
          zoom={7}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', minHeight: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Transit Corridor Polyline */}
          <Polyline
            positions={routeCorridor}
            pathOptions={{
              color: '#F4C430',
              weight: 4,
              dashArray: '8, 8',
              opacity: 0.95
            }}
          />

          {validEvents.map((evt) => {
            const isContradiction = evt.id === 'evt-kota-chambal' || evt.id === 'evt-jod-clocktower';
            const color = isContradiction ? '#EF4444' : (evt.lat && evt.lat > 25.5 ? '#06B6D4' : '#F59E0B');
            const pin = createPin(color);

            return (
              <Marker key={evt.id} position={[evt.lat!, evt.lng!]} icon={pin}>
                <Popup>
                  <div className="p-2 space-y-2 font-mono text-xs text-white max-w-xs">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                      <span className="font-extrabold text-[#F4C430] uppercase text-xs">
                        {evt.location_text || 'KNOWN COORDINATES'}
                      </span>
                      <span className="text-xs text-slate-200 font-bold">
                        {new Date(evt.event_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST
                      </span>
                    </div>
                    <p className="text-xs text-slate-100 font-sans leading-relaxed">
                      {evt.description}
                    </p>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                      <span className="text-slate-300">CONFIDENCE: {Math.round((evt.confidence || 0.8) * 100)}%</span>
                      <button
                        onClick={() => onOpenProvenance(evt.document_id, evt.source_offset || 'Line 1-10', evt.description)}
                        className="text-[#F4C430] hover:underline font-bold"
                      >
                        INSPECT PROVENANCE →
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
      <div className="w-full h-full min-h-[480px] flex flex-col items-center justify-center bg-[#090A0D] text-slate-200 font-mono text-sm">
        <div className="w-8 h-8 border-2 border-[#F4C430] border-t-transparent rounded-full animate-spin mb-3" />
        <span className="font-bold tracking-wider">INITIALIZING SATELLITE GEOSPATIAL MAP...</span>
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

  // Sorted events chronologically
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.event_timestamp).getTime() - new Date(b.event_timestamp).getTime()
  );

  // Filmstrip thumbnail frames (Brief requirement 5)
  const filmstripFrames = [
    {
      idx: 0,
      time: '21:15 IST',
      location: 'Bilara Toll Plaza',
      title: 'FASTag RFID Capture',
      tag: 'FASTAG RFID PASS',
      docId: 'doc-jod-witness-01',
      offset: 'Line 1-4'
    },
    {
      idx: 1,
      time: '22:30 IST',
      location: 'Mehrangarh Clock Tower',
      title: 'Witness Encounter',
      tag: 'SIGHTING A (JODHPUR)',
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
      docId: 'doc-wiretap-audio-03',
      offset: '00:02:14'
    },
    {
      idx: 4,
      time: '02:30 IST',
      location: 'Nayapura Barrier',
      title: 'NightVision Optical Frame 04',
      tag: 'WEAPON DETECTED',
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
      cause: 'Physically impossible velocity across NH-27 without supersonic aircraft. Confirms presence of body-double decoy or false telemetry.',
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
    <div className="p-4 space-y-4 font-mono select-none">
      {/* 1. DOMINANT PRIMARY MAP VIEWPORT (60%+ Dominant Anchor) with Slim Right Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* DOMINANT MAP (9 cols) - Main Visual Focal Anchor */}
        <div className="lg:col-span-9 flex flex-col space-y-2">
          {/* Map Header Bar with High Contrast Badges */}
          <div className="flex flex-wrap items-center justify-between bg-[#12141A] px-4 py-2.5 rounded-t-lg border border-[#232731]">
            <div className="flex items-center space-x-2.5">
              <Navigation className="w-4 h-4 text-[#F4C430]" />
              <span className="text-xs font-black uppercase tracking-wider text-white">
                PRIMARY GEOSPATIAL CORRIDOR // NH-25 &amp; NH-27 RAJASTHAN
              </span>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <span className="flex items-center space-x-1.5 text-[#06B6D4] font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4]" />
                <span>JODHPUR SECTOR</span>
              </span>
              <span className="flex items-center space-x-1.5 text-[#F59E0B] font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                <span>KOTA SECTOR</span>
              </span>
              <span className="flex items-center space-x-1.5 text-[#EF4444] font-bold bg-[#EF4444]/15 px-2 py-0.5 rounded border border-[#EF4444]/30">
                <span className="w-2 h-2 rounded-full bg-[#EF4444] animate-ping" />
                <span>IMPOSSIBLE VELOCITY POINT</span>
              </span>
            </div>
          </div>

          {/* Map Canvas: Dominant 60%+ Height (~540px) */}
          <div className="w-full h-[540px] bg-[#090A0D] border-x border-b border-[#232731] rounded-b-lg overflow-hidden relative shadow-2xl">
            <InnerMap events={events} onOpenProvenance={onOpenProvenance} />
          </div>

          {/* Filmstrip Thumbnail Row Synced Directly Beneath the Map */}
          <div className="bg-[#12141A] border border-[#232731] rounded-lg p-3 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-200 font-bold uppercase tracking-wider mb-2.5 px-1">
              <div className="flex items-center space-x-2">
                <Film className="w-4 h-4 text-[#F4C430]" />
                <span className="text-white font-extrabold">CORRIDOR TIMELINE FILMSTRIP (5 SYNCHRONIZED FRAMES)</span>
              </div>
              <span className="text-[#F4C430] text-xs font-black">CLICK FRAME TO INSPECT EVIDENCE</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              {filmstripFrames.map((frame) => {
                const isSelected = selectedFrame === frame.idx;

                return (
                  <div
                    key={frame.idx}
                    onClick={() => {
                      setSelectedFrame(frame.idx);
                      onOpenProvenance(frame.docId, frame.offset, frame.title);
                    }}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                      frame.isConflict
                        ? 'bg-[#EF4444]/15 border-[#EF4444] text-white hover:bg-[#EF4444]/25 shadow-md shadow-[#EF4444]/20'
                        : isSelected
                        ? 'bg-[#EDE9E0] text-black border-[#F4C430] shadow-md'
                        : 'bg-[#090A0D] text-slate-200 border-[#232731] hover:border-[#F4C430]/70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs font-black">
                        <span className={frame.isConflict ? 'text-[#EF4444]' : isSelected ? 'text-black' : 'text-[#F4C430]'}>
                          {frame.time}
                        </span>
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          frame.isConflict ? 'bg-[#EF4444] text-white' : 'bg-black/50 text-slate-200'
                        }`}>
                          {frame.tag}
                        </span>
                      </div>
                      <p className="text-xs font-extrabold truncate mt-1.5">{frame.title}</p>
                    </div>

                    <div className="mt-2.5 pt-1.5 border-t border-slate-700/40 flex items-center justify-between text-[11px]">
                      <span className="truncate opacity-90">{frame.location}</span>
                      <span className="font-black text-[#F4C430] shrink-0 ml-1">INSPECT →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* SLIM RIGHT RAIL: Live Audit Event Feed (3 cols) */}
        <div className="lg:col-span-3 bg-[#12141A] border border-[#232731] rounded-lg p-3.5 flex flex-col h-[650px] shadow-xl">
          <div className="flex items-center justify-between border-b border-[#232731] pb-2.5">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#F4C430]" />
              <span className="text-xs font-black uppercase tracking-wider text-white">
                LIVE AUDIT STREAM
              </span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-800">
              {events.length} LOGS
            </span>
          </div>

          {/* Compact Stream */}
          <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1">
            {sortedEvents.map((evt) => {
              const isConflict = evt.id === 'evt-kota-chambal' || evt.id === 'evt-jod-clocktower';

              return (
                <div
                  key={evt.id}
                  onClick={() => onOpenProvenance(evt.document_id, evt.source_offset || 'Line 1-10', evt.description)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition text-xs space-y-1 ${
                    isConflict
                      ? 'bg-[#EF4444]/15 border-[#EF4444]/60 hover:border-[#EF4444]'
                      : 'bg-[#090A0D] border-[#232731] hover:border-[#F4C430]/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-extrabold text-[#F4C430]">
                      {new Date(evt.event_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isConflict ? 'bg-[#EF4444] text-white' : 'bg-[#181B22] text-slate-300'
                    }`}>
                      {isConflict ? 'CONFLICT' : 'LOGGED'}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-100 line-clamp-2 leading-tight">
                    {evt.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-300 pt-1 border-t border-[#1F232D]">
                    <span className="truncate">{evt.location_text || 'Coordinated'}</span>
                    <span className="text-[#F4C430] font-bold">PROVENANCE →</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Summary at bottom of rail */}
          <div className="pt-2.5 border-t border-[#232731] text-[11px] text-slate-300 flex items-center justify-between">
            <span>SYNC PROTOCOL</span>
            <span className="text-emerald-400 font-bold">REALTIME ACTIVE</span>
          </div>
        </div>
      </div>

      {/* 2. COLLAPSIBLE VELOCITY & CORRELATION MATRIX (Collapsed into Toggle Tab) */}
      <div className="bg-[#12141A] border border-[#232731] rounded-lg overflow-hidden shadow-xl">
        {/* Toggle Bar Header */}
        <button
          onClick={() => setIsMatrixExpanded(!isMatrixExpanded)}
          className="w-full px-4 py-3 bg-[#161922] hover:bg-[#1E222D] flex items-center justify-between transition text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-[#F4C430]/15 rounded text-[#F4C430]">
              <Table className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-white">
                  TRANSIT VELOCITY &amp; CORRELATION MATRIX
                </span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-[#EF4444] text-white uppercase animate-pulse">
                  1 ANOMALY DETECTED (1,560 KM/H)
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Calculates transit speed between chronological GPS waypoints to detect physical impossibility.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold text-[#F4C430]">
            <span>{isMatrixExpanded ? 'COLLAPSE MATRIX' : 'EXPAND MATRIX'}</span>
            {isMatrixExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {/* Collapsible Content */}
        {isMatrixExpanded && (
          <div className="p-4 border-t border-[#232731] animate-in fade-in duration-150">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#232731] text-[11px] text-slate-300 uppercase bg-[#090A0D]">
                    <th className="py-2.5 px-3">Waypoint Origin</th>
                    <th className="py-2.5 px-3">Destination</th>
                    <th className="py-2.5 px-3">Distance</th>
                    <th className="py-2.5 px-3">Time Delta</th>
                    <th className="py-2.5 px-3">Calculated Speed</th>
                    <th className="py-2.5 px-3">Physical Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F232D]">
                  {velocityMatrix.map((row, i) => (
                    <tr
                      key={i}
                      className={
                        row.isAnomaly
                          ? 'bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-white font-medium'
                          : 'hover:bg-[#181B22] text-slate-200'
                      }
                    >
                      <td className="py-3 px-3 font-bold">{row.from}</td>
                      <td className="py-3 px-3 font-bold">{row.to}</td>
                      <td className="py-3 px-3 font-mono">{row.distance}</td>
                      <td className="py-3 px-3 font-mono">{row.deltaT}</td>
                      <td className="py-3 px-3 font-mono font-black text-sm">
                        <span className={row.isAnomaly ? 'text-[#EF4444]' : 'text-emerald-400'}>
                          {row.calculatedSpeed}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            row.isAnomaly
                              ? 'bg-[#EF4444] text-white shadow-sm'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {row.status}
                        </span>
                        {row.isAnomaly && (
                          <div className="text-[11px] text-slate-200 mt-1 max-w-sm">
                            {row.cause}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onOpenProvenance(row.docA, 'Source telemetry', row.cause)}
                          className="px-2.5 py-1 rounded bg-[#181B22] hover:bg-[#232731] border border-[#232731] text-xs font-bold text-[#F4C430] hover:text-white transition"
                        >
                          INSPECT PROOF
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
