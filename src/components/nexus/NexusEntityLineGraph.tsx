'use client';

import React, { useState } from 'react';
import { Entity, Event, Contradiction } from '@/types/investigation';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  Calendar,
  Activity,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

interface NexusEntityLineGraphProps {
  entities: Entity[];
  events: Event[];
  contradictions: Contradiction[];
  onSelectEntity?: (entity: Entity) => void;
  onOpenProvenance?: (docId: string, offset: string, snippet?: string) => void;
}

interface DataPoint {
  timeLabel: string;
  timeIndex: number; // 0 to 7
  aarav: number; // 0 to 100
  scorpio: number;
  bolero: number;
  devendra: number;
  glock: number;
  eventTitle?: string;
  location?: string;
  docId?: string;
  isAnomaly?: boolean;
}

const TIMELINE_POINTS: DataPoint[] = [
  {
    timeLabel: '21:00',
    timeIndex: 0,
    aarav: 15,
    scorpio: 20,
    bolero: 0,
    devendra: 0,
    glock: 0,
    eventTitle: 'Initial Recon Patrol Dispatched',
    location: 'Jodhpur Outpost',
    docId: 'doc-jod-witness-01',
  },
  {
    timeLabel: '21:15',
    timeIndex: 1,
    aarav: 35,
    scorpio: 98,
    bolero: 5,
    devendra: 0,
    glock: 0,
    eventTitle: 'White Scorpio passes Bilara Toll Plaza',
    location: 'Bilara Toll Plaza, NH-25',
    docId: 'doc-jod-witness-01',
  },
  {
    timeLabel: '22:00',
    timeIndex: 2,
    aarav: 65,
    scorpio: 70,
    bolero: 15,
    devendra: 10,
    glock: 0,
    eventTitle: 'Convey heading east along NH-25 corridor',
    location: 'Jodhpur-Ajmer Highway',
    docId: 'doc-jod-witness-01',
  },
  {
    timeLabel: '22:30',
    timeIndex: 3,
    aarav: 94,
    scorpio: 85,
    bolero: 20,
    devendra: 15,
    glock: 0,
    eventTitle: 'Witness Sighting: Aarav Singh duffel handoff',
    location: 'Mehrangarh Clock Tower, Jodhpur',
    docId: 'doc-jod-witness-01',
  },
  {
    timeLabel: '22:45',
    timeIndex: 4,
    aarav: 91,
    scorpio: 20,
    bolero: 95,
    devendra: 30,
    glock: 0,
    eventTitle: 'ANPR Log: Aarav Singh exits Bolero at Toll',
    location: 'Chambal River Bridge, Kota',
    docId: 'doc-kota-cctv-02',
    isAnomaly: true,
  },
  {
    timeLabel: '00:00',
    timeIndex: 5,
    aarav: 40,
    scorpio: 10,
    bolero: 60,
    devendra: 55,
    glock: 20,
    eventTitle: 'Radio Static: Communications redirected',
    location: 'Hadoti Border Sector',
    docId: 'doc-wiretap-audio-03',
  },
  {
    timeLabel: '01:15',
    timeIndex: 6,
    aarav: 25,
    scorpio: 5,
    bolero: 85,
    devendra: 92,
    glock: 40,
    eventTitle: 'Wiretap: Devendra Sharma commanding convoy',
    location: 'Rawatbhata Safehouse, NH-52',
    docId: 'doc-wiretap-audio-03',
  },
  {
    timeLabel: '02:30',
    timeIndex: 7,
    aarav: 20,
    scorpio: 0,
    bolero: 90,
    devendra: 94,
    glock: 94,
    eventTitle: 'Optical Camera: Devendra brandishing Glock 19',
    location: 'Nayapura Barrier, Kota',
    docId: 'doc-cctv-optical-04',
  },
];

const SERIES_CONFIG = [
  { key: 'aarav', label: 'Aarav Singh (Person)', color: '#10B981', type: 'person' },
  { key: 'scorpio', label: 'White Scorpio (Vehicle)', color: '#F59E0B', type: 'vehicle' },
  { key: 'bolero', label: 'Silver Bolero (Vehicle)', color: '#EF4444', type: 'vehicle' },
  { key: 'devendra', label: 'Devendra Sharma (Person)', color: '#0284C7', type: 'person' },
  { key: 'glock', label: 'Glock 19 Sidearm (Weapon)', color: '#8B5CF6', type: 'weapon' },
];

export const NexusEntityLineGraph: React.FC<NexusEntityLineGraphProps> = ({
  entities,
  events,
  contradictions,
  onSelectEntity,
  onOpenProvenance,
}) => {
  const [activeSeries, setActiveSeries] = useState<Record<string, boolean>>({
    aarav: true,
    scorpio: true,
    bolero: true,
    devendra: true,
    glock: true,
  });

  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [hoveredSeriesKey, setHoveredSeriesKey] = useState<string | null>(null);

  const toggleSeries = (key: string) => {
    setActiveSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // SVG Chart Dimensions
  const svgWidth = 850;
  const svgHeight = 360;
  const paddingLeft = 55;
  const paddingRight = 35;
  const paddingTop = 30;
  const paddingBottom = 45;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const getX = (index: number) => {
    return paddingLeft + (index / (TIMELINE_POINTS.length - 1)) * chartWidth;
  };

  const getY = (value: number) => {
    return paddingTop + chartHeight - (value / 100) * chartHeight;
  };

  // Generate SVG Path for a series
  const generatePath = (key: keyof DataPoint) => {
    return TIMELINE_POINTS.map((pt, idx) => {
      const x = getX(idx);
      const y = getY(pt[key] as number);
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#EFECE6] p-4 font-mono select-none text-black overflow-y-auto space-y-4">
      {/* Top Header Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="bg-white border-2 border-black p-3 shadow-brutal flex flex-col justify-between">
          <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
            PRIMARY CORRIDOR HORIZON
          </div>
          <div className="text-sm font-black text-black mt-1">
            10-SEP 21:00 → 11-SEP 03:00 IST
          </div>
          <div className="text-[10px] text-emerald-700 font-bold mt-1">
            6 Hours Multi-Modal Timeline
          </div>
        </div>

        <div className="bg-white border-2 border-black p-3 shadow-brutal flex flex-col justify-between">
          <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
            PEAK ACTIVITY INTERACTION
          </div>
          <div className="text-sm font-black text-[#0284C7] mt-1">
            22:45 IST @ CHAMBAL BRIDGE
          </div>
          <div className="text-[10px] text-slate-700 font-bold mt-1">
            4 Co-occurring Entity Trajectories
          </div>
        </div>

        <div className="bg-[#FEE2E2] border-2 border-black p-3 shadow-brutal flex flex-col justify-between">
          <div className="text-[10px] text-red-900 font-black uppercase tracking-wider flex items-center justify-between">
            <span>VELOCITY ANOMALY</span>
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
          </div>
          <div className="text-sm font-black text-[#DC2626] mt-1">
            1,560 KM/H IMPOSSIBILITY
          </div>
          <div className="text-[10px] text-red-800 font-bold mt-1">
            Spike at 22:30 ↔ 22:45 IST
          </div>
        </div>

        <div className="bg-white border-2 border-black p-3 shadow-brutal flex flex-col justify-between">
          <div className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
            CORRELATED DATA POINTS
          </div>
          <div className="text-sm font-black text-black mt-1">
            {TIMELINE_POINTS.length} OBSERVATION NODES
          </div>
          <div className="text-[10px] text-slate-700 font-bold mt-1">
            100% Grounded in Case Dossiers
          </div>
        </div>
      </div>

      {/* Main Line Graph Canvas Container */}
      <div className="bg-white border-2 border-black p-5 shadow-brutal space-y-4">
        {/* Chart Toolbar & Series Filter Toggles */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-black pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-black" />
              <h3 className="text-sm font-black uppercase tracking-wider text-black">
                ENTITY ACTIVITY &amp; DETECTION INTENSITY LINE GRAPH
              </h3>
            </div>
            <p className="text-xs text-slate-600 font-bold mt-0.5">
              Trajectory lines connecting multi-modal observations across the timeline
            </p>
          </div>

          {/* Series Toggle Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {SERIES_CONFIG.map((s) => {
              const active = activeSeries[s.key];
              return (
                <button
                  key={s.key}
                  onClick={() => toggleSeries(s.key)}
                  className={`px-2.5 py-1 text-xs font-black border transition flex items-center space-x-1.5 ${active
                      ? 'bg-[#FBF9F5] border-black text-black shadow-xs'
                      : 'bg-white border-slate-300 text-slate-400 line-through'
                    }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black"
                    style={{ backgroundColor: s.color }}
                  />
                  <span>{s.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* The SVG Line Graph */}
        <div className="w-full overflow-x-auto relative">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto min-w-[700px] select-none"
          >
            {/* Background Grid Lines */}
            {[0, 25, 50, 75, 100].map((val) => {
              const y = getY(val);
              return (
                <g key={val}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={svgWidth - paddingRight}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    fontSize="10"
                    fontWeight="800"
                    fill="#64748B"
                    fontFamily="monospace"
                  >
                    {val}%
                  </text>
                </g>
              );
            })}

            {/* Vertical Anomaly Shaded Zone (22:30 to 22:45 IST) */}
            <rect
              x={getX(3)}
              y={paddingTop}
              width={getX(4) - getX(3)}
              height={chartHeight}
              fill="#FEE2E2"
              opacity="0.8"
            />
            <line
              x1={getX(4)}
              y1={paddingTop}
              x2={getX(4)}
              y2={paddingTop + chartHeight}
              stroke="#DC2626"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
            <text
              x={(getX(3) + getX(4)) / 2}
              y={paddingTop + 14}
              textAnchor="middle"
              fontSize="9"
              fontWeight="900"
              fill="#DC2626"
              fontFamily="monospace"
            >
              ⚠️ 1,560 KM/H ANOMALY
            </text>

            {/* X-Axis Vertical Guide Lines & Time Labels */}
            {TIMELINE_POINTS.map((pt, idx) => {
              const x = getX(idx);
              return (
                <g key={pt.timeLabel}>
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={paddingTop + chartHeight}
                    stroke="#F1F5F9"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={paddingTop + chartHeight + 18}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="800"
                    fill="#000000"
                    fontFamily="monospace"
                  >
                    {pt.timeLabel}
                  </text>
                  <text
                    x={x}
                    y={paddingTop + chartHeight + 30}
                    textAnchor="middle"
                    fontSize="8"
                    fontWeight="700"
                    fill="#64748B"
                    fontFamily="monospace"
                  >
                    IST
                  </text>
                </g>
              );
            })}

            {/* Render Paths for each active series */}
            {SERIES_CONFIG.map((s) => {
              if (!activeSeries[s.key]) return null;
              const pathD = generatePath(s.key as keyof DataPoint);

              return (
                <g key={s.key}>
                  {/* Shadow Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#000000"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.25"
                    transform="translate(1, 1)"
                  />
                  {/* Main Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Plotted Data Nodes */}
                  {TIMELINE_POINTS.map((pt, idx) => {
                    const x = getX(idx);
                    const val = pt[s.key as keyof DataPoint] as number;
                    const y = getY(val);

                    if (val === 0) return null;

                    return (
                      <circle
                        key={idx}
                        cx={x}
                        cy={y}
                        r="5.5"
                        fill="#FFFFFF"
                        stroke={s.color}
                        strokeWidth="3"
                        className="cursor-pointer transition-all hover:r-8"
                        onMouseEnter={() => {
                          setHoveredPoint(pt);
                          setHoveredSeriesKey(s.key);
                        }}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Hovered Point Inspection Card */}
        {hoveredPoint && (
          <div className="p-3.5 bg-[#FBF9F5] border-2 border-black space-y-1.5 animate-in fade-in duration-150">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 bg-black text-[#F5C842] text-[10px] font-black uppercase">
                  {hoveredPoint.timeLabel} IST
                </span>
                <h4 className="text-xs font-black text-black uppercase">
                  {hoveredPoint.eventTitle}
                </h4>
              </div>

              {hoveredPoint.isAnomaly && (
                <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-500 text-[10px] font-black uppercase">
                  ⚠️ IMPOSSIBLE TRANSIT VELOCITY DETECTED
                </span>
              )}
            </div>

            <div className="text-xs text-slate-700 font-bold">
              LOCATION: <span className="text-black font-black">{hoveredPoint.location}</span>
            </div>

            <div className="pt-1.5 border-t border-slate-300 flex items-center justify-between text-[11px]">
              <div className="flex items-center space-x-3">
                <span className="text-slate-600">Aarav: {hoveredPoint.aarav}%</span>
                <span className="text-slate-600">Scorpio: {hoveredPoint.scorpio}%</span>
                <span className="text-slate-600">Bolero: {hoveredPoint.bolero}%</span>
                <span className="text-slate-600">Devendra: {hoveredPoint.devendra}%</span>
              </div>

              {hoveredPoint.docId && onOpenProvenance && (
                <button
                  onClick={() => onOpenProvenance(hoveredPoint.docId!, 'Line 1-10', hoveredPoint.eventTitle)}
                  className="text-blue-700 font-black hover:underline flex items-center space-x-1"
                >
                  <span>INSPECT SOURCE PROOF</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Timeline Milestones Strip (Corridor Points) */}
      <div className="bg-white border-2 border-black p-4 shadow-brutal space-y-3">
        <div className="flex items-center justify-between border-b border-slate-300 pb-2">
          <h4 className="text-xs font-black uppercase text-black">
            TIMELINE TRAJECTORY OBSERVATIONS
          </h4>
          <span className="text-[10px] font-black text-slate-600 uppercase">
            CLICK TO HIGHLIGHT ON LINE GRAPH
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {TIMELINE_POINTS.filter((p) => p.timeIndex % 2 === 1 || p.isAnomaly).map((p) => (
            <div
              key={p.timeLabel}
              onMouseEnter={() => setHoveredPoint(p)}
              className={`p-2.5 border-2 border-black cursor-pointer transition hover:bg-white ${p.isAnomaly ? 'bg-red-50 border-red-600' : 'bg-[#FBF9F5]'
                }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-black px-1.5 py-0.5 bg-black text-[#F5C842]">
                  {p.timeLabel} IST
                </span>
                {p.isAnomaly && (
                  <span className="text-[9px] font-black text-red-700">CONFLICT</span>
                )}
              </div>
              <div className="text-xs font-black text-black line-clamp-1">{p.eventTitle}</div>
              <div className="text-[10px] text-slate-600 truncate mt-0.5">{p.location}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
