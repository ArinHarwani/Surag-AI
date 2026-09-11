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
  ShieldAlert
} from 'lucide-react';
import { Event } from '@/types/investigation';
import 'leaflet/dist/leaflet.css';

interface NexusTimelineMapProps {
  events: Event[];
  onOpenProvenance: (docId: string, offset: string, snippet?: string) => void;
}

// Inner Leaflet Map
const InnerMap = dynamic(
  async () => {
    const { MapContainer, TileLayer, Marker, Popup, Polyline } = await import('react-leaflet');
    const L = await import('leaflet');

    const createPin = (color: string) => {
      const html = `
        <div style="
          background-color: ${color};
          width: 26px;
          height: 26px;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid #ffffff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background-color: #ffffff;
            border-radius: 50%;
            transform: rotate(45deg);
          "></div>
        </div>
      `;
      return L.divIcon({
        className: 'nexus-pin',
        html,
        iconSize: [26, 26],
        iconAnchor: [13, 26],
        popupAnchor: [0, -26]
      });
    };

    return function LeafletMap({
      events,
      onOpenProvenance
    }: {
      events: Event[];
      onOpenProvenance: (docId: string, offset: string, snippet?: string) => void;
    }) {
      const validEvents = events.filter((e) => e.lat && e.lng);
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
          style={{ width: '100%', height: '100%' }}
        >
          {/* CartoDB Dark Matter style tiles */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Transit Corridor Polyline */}
          <Polyline
            positions={routeCorridor}
            pathOptions={{
              color: '#F4C430',
              weight: 3,
              dashArray: '6, 6',
              opacity: 0.9
            }}
          />

          {validEvents.map((evt) => {
            const isContradiction = evt.id === 'evt-kota-chambal' || evt.id === 'evt-jod-clocktower';
            const color = isContradiction ? '#EF4444' : evt.lat && evt.lat > 25.5 ? '#0284C7' : '#D97706';
            const pin = createPin(color);

            return (
              <Marker key={evt.id} position={[evt.lat!, evt.lng!]} icon={pin}>
                <Popup>
                  <div className="p-1 space-y-1.5 font-mono text-xs text-white">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-1">
                      <span className="font-bold text-[#F4C430] uppercase">{evt.location_text}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(evt.event_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans">{evt.description}</p>
                    <button
                      onClick={() => onOpenProvenance(evt.document_id, evt.source_offset, evt.description)}
                      className="text-[10px] text-[#F4C430] hover:underline font-bold pt-1 block"
                    >
                      INSPECT OFFSET {evt.source_offset} →
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
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#090A0D] text-slate-400 font-mono text-xs">
        <div className="w-8 h-8 border-2 border-[#F4C430] border-t-transparent rounded-full animate-spin mb-2" />
        <span>LOADING TACTICAL GEOSPATIAL MAP...</span>
      </div>
    )
  }
);

export const NexusTimelineMap: React.FC<NexusTimelineMapProps> = ({
  events,
  onOpenProvenance
}) => {
  const [selectedFrame, setSelectedFrame] = useState<number>(0);

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
      thumb: 'FASTAG #4022',
      tag: 'FASTAG PASS',
      docId: 'doc-jod-witness-01',
      offset: 'Line 1-4'
    },
    {
      idx: 1,
      time: '22:30 IST',
      location: 'Mehrangarh Clock Tower',
      title: 'Duffel Handover Rendezvous',
      thumb: 'TACTICAL MEMO',
      tag: 'WITNESS SIGHTING',
      docId: 'doc-jod-witness-01',
      offset: 'Line 5-8'
    },
    {
      idx: 2,
      time: '22:45 IST',
      location: 'Chambal River Bridge',
      title: 'ANPR Camera #09 Toll Entry',
      thumb: 'ANPR MATCH 91%',
      tag: 'OPTICAL COLLISION',
      isConflict: true,
      docId: 'doc-kota-cctv-02',
      offset: 'Line 5-8'
    },
    {
      idx: 3,
      time: '01:15 IST',
      location: 'Rawatbhata Safehouse',
      title: 'Radio Wiretap Intercept #9A',
      thumb: 'AUDIO DIARIZED',
      tag: 'TACTICAL AUDIO',
      docId: 'doc-wiretap-audio-03',
      offset: '00:02:14'
    },
    {
      idx: 4,
      time: '02:30 IST',
      location: 'Nayapura Barrier',
      title: 'NightVision Optical Frame 04',
      thumb: 'GLOCK 19 BBOX',
      tag: 'WEAPON DETECTED',
      docId: 'doc-cctv-optical-04',
      offset: 'bbox [120,450,280,620]'
    }
  ];

  return (
    <div className="space-y-5 font-mono select-none">
      {/* Top Map + Right Rail Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Full-Width / Large Tactical Dark Satellite Map (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-2">
          <div className="flex items-center justify-between bg-[#111318] px-3 py-2 rounded-t-lg border border-[#232731]">
            <div className="flex items-center space-x-2">
              <Navigation className="w-4 h-4 text-[#F4C430]" />
              <span className="text-xs font-black uppercase tracking-wider text-white">
                TACTICAL SATELLITE CORRIDOR // NH-25 &amp; NH-27
              </span>
            </div>
            <div className="flex items-center space-x-3 text-[10px]">
              <span className="flex items-center space-x-1 text-[#38BDF8]">
                <span className="w-2 h-2 rounded-full bg-[#0284C7]" />
                <span>JODHPUR</span>
              </span>
              <span className="flex items-center space-x-1 text-[#FBBF24]">
                <span className="w-2 h-2 rounded-full bg-[#D97706]" />
                <span>KOTA</span>
              </span>
              <span className="flex items-center space-x-1 text-red-400">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span>COLLISION POINT</span>
              </span>
            </div>
          </div>

          <div className="w-full h-80 bg-[#090A0D] border-x border-b border-[#232731] rounded-b-lg overflow-hidden relative shadow-lg">
            <InnerMap events={events} onOpenProvenance={onOpenProvenance} />
          </div>

          {/* Filmstrip Row of Thumbnail Frames directly beneath the map (Brief Item 5) */}
          <div className="bg-[#111318] border border-[#232731] rounded-lg p-2.5">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 px-1">
              <span className="flex items-center space-x-1.5">
                <Film className="w-3.5 h-3.5 text-[#F4C430]" />
                <span>TIMELINE FILMSTRIP ROW (SYNCED TO SPATIAL WAYPOINTS)</span>
              </span>
              <span>5 FRAMES LOGGED</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {filmstripFrames.map((frame) => {
                const isSelected = selectedFrame === frame.idx;

                return (
                  <div
                    key={frame.idx}
                    onClick={() => {
                      setSelectedFrame(frame.idx);
                      onOpenProvenance(frame.docId, frame.offset, frame.title);
                    }}
                    className={`p-2 rounded border cursor-pointer transition-all flex flex-col justify-between ${
                      frame.isConflict
                        ? 'bg-red-950/40 border-red-500 text-red-200'
                        : isSelected
                        ? 'bg-[#EDE9E0] text-slate-950 border-[#F4C430] shadow'
                        : 'bg-[#090A0D] text-slate-300 border-[#232731] hover:border-slate-500'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[9px] font-bold">
                        <span className="text-[#F4C430]">{frame.time}</span>
                        <span className="text-[8px] uppercase px-1 rounded bg-black/40 text-slate-300">
                          {frame.tag}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold truncate mt-1">{frame.title}</p>
                    </div>

                    <div className="mt-2 pt-1 border-t border-slate-700/40 flex items-center justify-between text-[9px]">
                      <span className="truncate">{frame.location}</span>
                      <span className="text-[8px] font-black opacity-80">INSPECT →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Rail: Live Audit Feed (4 cols) */}
        <div className="lg:col-span-4 bg-[#111318] border border-[#232731] rounded-lg p-4 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between border-b border-[#1E232E] pb-2">
            <span className="text-xs font-black uppercase tracking-wider text-white">
              LIVE AUDIT EVENT FEED
            </span>
            <span className="text-[9px] bg-red-950 text-red-300 px-1.5 py-0.2 rounded border border-red-800 font-bold">
              1 FLAGGED
            </span>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[460px] pr-1">
            {sortedEvents.map((evt) => {
              const isCollision = evt.id === 'evt-kota-chambal' || evt.id === 'evt-jod-clocktower';

              return (
                <div
                  key={evt.id}
                  onClick={() => onOpenProvenance(evt.document_id, evt.source_offset, evt.description)}
                  className={`p-3 rounded border transition cursor-pointer ${
                    isCollision
                      ? 'bg-red-950/40 border-red-500/80 text-white shadow-md'
                      : 'bg-[#090A0D] border-[#232731] text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-[#F4C430] font-bold">
                      {new Date(evt.event_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} IST
                    </span>
                    <span
                      className={`text-[8px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        isCollision ? 'bg-red-600 text-white' : 'bg-[#1C202A] text-slate-400'
                      }`}
                    >
                      {isCollision ? 'COLLISION' : evt.event_timestamp_confidence.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs font-bold leading-snug">{evt.description}</p>

                  <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                    <span className="truncate">{evt.location_text}</span>
                    <span className="text-[#F4C430] font-bold">OFFSET: {evt.source_offset}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#1E232E] text-[10px] text-slate-500 flex items-center justify-between">
            <span>REAL-TIME DISPATCH</span>
            <span className="text-emerald-400 font-bold">SYNC: ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Bottom: Dense Data Table ("Velocity/Correlation Matrix") */}
      <div className="bg-[#111318] border border-[#232731] rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#1E232E] pb-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#F4C430]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-white">
              VELOCITY &amp; CORRELATION MATRIX (DENSE FORENSIC TABLE)
            </h3>
          </div>
          <span className="text-[10px] text-slate-400">CALCULATED PHYSICAL KINEMATICS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#232731] text-[10px] text-slate-400 uppercase tracking-wider">
                <th className="py-2 px-3">EVENT ID</th>
                <th className="py-2 px-3">REAL-WORLD TIME</th>
                <th className="py-2 px-3">LOCATION</th>
                <th className="py-2 px-3">CONFIDENCE</th>
                <th className="py-2 px-3">TRANSIT DELTA</th>
                <th className="py-2 px-3">REQUIRED SPEED</th>
                <th className="py-2 px-3">STATUS</th>
                <th className="py-2 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1C202A] text-slate-200">
              <tr className="hover:bg-[#181A20] transition">
                <td className="py-2.5 px-3 font-mono text-[#F4C430]">EVT-BILARA</td>
                <td className="py-2.5 px-3 font-bold">10-SEP 21:15 IST</td>
                <td className="py-2.5 px-3">Bilara Toll Plaza (NH-25)</td>
                <td className="py-2.5 px-3 text-emerald-400 font-bold">96% (EXACT)</td>
                <td className="py-2.5 px-3 font-mono">0 MIN</td>
                <td className="py-2.5 px-3 font-mono">65 km/h (Normal)</td>
                <td className="py-2.5 px-3"><span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded">VERIFIED</span></td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    onClick={() => onOpenProvenance('doc-jod-witness-01', 'Line 1-4', 'White Scorpio crosses Bilara Toll')}
                    className="text-[11px] text-[#F4C430] hover:underline font-bold"
                  >
                    INSPECT PROOF
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-[#181A20] transition bg-red-950/20">
                <td className="py-2.5 px-3 font-mono text-[#F4C430]">EVT-JOD-CLOCK</td>
                <td className="py-2.5 px-3 font-bold">10-SEP 22:30 IST</td>
                <td className="py-2.5 px-3">Mehrangarh Clock Tower</td>
                <td className="py-2.5 px-3 text-emerald-400 font-bold">94% (EXACT)</td>
                <td className="py-2.5 px-3 font-mono">+75 MIN</td>
                <td className="py-2.5 px-3 font-mono">42 km/h (City)</td>
                <td className="py-2.5 px-3"><span className="text-[9px] bg-red-950 text-red-300 px-1.5 py-0.5 rounded border border-red-800 animate-pulse">COLLISION A</span></td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    onClick={() => onOpenProvenance('doc-jod-witness-01', 'Line 5-8', 'Aarav Singh at Clock Tower')}
                    className="text-[11px] text-[#F4C430] hover:underline font-bold"
                  >
                    INSPECT PROOF
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-[#181A20] transition bg-red-950/20">
                <td className="py-2.5 px-3 font-mono text-[#F4C430]">EVT-KOTA-TOLL</td>
                <td className="py-2.5 px-3 font-bold text-red-400">10-SEP 22:45 IST</td>
                <td className="py-2.5 px-3 font-bold text-red-300">Chambal River Bridge (Kota)</td>
                <td className="py-2.5 px-3 text-emerald-400 font-bold">91% (ANPR)</td>
                <td className="py-2.5 px-3 font-mono font-bold text-red-400">+15 MIN</td>
                <td className="py-2.5 px-3 font-mono font-black text-red-400">1,560 km/h (IMPOSSIBLE)</td>
                <td className="py-2.5 px-3"><span className="text-[9px] bg-red-600 text-white font-black px-1.5 py-0.5 rounded animate-pulse">COLLISION B</span></td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    onClick={() => onOpenProvenance('doc-kota-cctv-02', 'Line 5-8', 'Aarav Singh at Chambal Toll')}
                    className="text-[11px] text-[#F4C430] hover:underline font-bold"
                  >
                    INSPECT PROOF
                  </button>
                </td>
              </tr>

              <tr className="hover:bg-[#181A20] transition">
                <td className="py-2.5 px-3 font-mono text-[#F4C430]">EVT-RAWATBHATA</td>
                <td className="py-2.5 px-3 font-bold">11-SEP 01:15 IST</td>
                <td className="py-2.5 px-3">Rawatbhata Highway Safehouse</td>
                <td className="py-2.5 px-3 text-amber-400 font-bold">92% (APPROX)</td>
                <td className="py-2.5 px-3 font-mono">+150 MIN</td>
                <td className="py-2.5 px-3 font-mono">48 km/h (Convoy)</td>
                <td className="py-2.5 px-3"><span className="text-[9px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded">VERIFIED</span></td>
                <td className="py-2.5 px-3 text-right">
                  <button
                    onClick={() => onOpenProvenance('doc-wiretap-audio-03', '00:02:14', 'Convoy ordered to divert toward Rawatbhata')}
                    className="text-[11px] text-[#F4C430] hover:underline font-bold"
                  >
                    INSPECT PROOF
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
