'use client';

import React from 'react';
import { useInvestigation } from '@/lib/store/investigation-context';
import {
  User,
  Car,
  MapPin,
  Shield,
  Briefcase,
  Layers,
  X,
  Sparkles,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Link as LinkIcon,
} from 'lucide-react';
import { EntityType } from '@/types/investigation';

const TYPE_ICONS: Record<EntityType, React.ReactNode> = {
  person: <User className="w-4 h-4 text-emerald-400" />,
  vehicle: <Car className="w-4 h-4 text-amber-400" />,
  location: <MapPin className="w-4 h-4 text-cyan-400" />,
  weapon: <Shield className="w-4 h-4 text-rose-400" />,
  organization: <Briefcase className="w-4 h-4 text-purple-400" />,
  object: <Layers className="w-4 h-4 text-slate-400" />,
};

export function EntityDetailsDrawer() {
  const {
    selectedEntity,
    setSelectedEntity,
    relationships,
    entities,
    events,
    documents,
    agencies,
    updateRelationshipStatus,
    setProvenanceFocus,
    setSelectedEvent,
  } = useInvestigation();

  if (!selectedEntity) return null;

  // Filter connected relationships
  const connectedRels = relationships.filter(
    (r) => r.source_entity_id === selectedEntity.id || r.target_entity_id === selectedEntity.id
  );

  // Filter events referencing this entity
  const relatedEvents = events.filter((ev) =>
    ev.description.toLowerCase().includes(selectedEntity.name.toLowerCase()) ||
    (selectedEntity.attributes?.alias &&
      ev.description.toLowerCase().includes(String(selectedEntity.attributes.alias).toLowerCase()))
  );

  const agencyName = selectedEntity.agency_id
    ? agencies.jodhpur.id === selectedEntity.agency_id
      ? 'Jodhpur Police'
      : 'Kota Police'
    : 'Joint Jurisdiction';

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 shadow-xl space-y-4 text-slate-100 max-h-[500px] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-slate-800 border border-slate-700 rounded-lg">
            {TYPE_ICONS[selectedEntity.type]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {selectedEntity.type}
              </span>
              <span className="text-[10px] font-mono text-cyan-400">{agencyName}</span>
            </div>
            <h3 className="text-sm font-bold text-slate-100 mt-0.5">{selectedEntity.name}</h3>
          </div>
        </div>

        <button
          onClick={() => setSelectedEntity(null)}
          className="text-slate-400 hover:text-slate-200 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* JSONB Attributes */}
      {selectedEntity.attributes && Object.keys(selectedEntity.attributes).length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-mono text-slate-400">Extracted Attributes:</span>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {Object.entries(selectedEntity.attributes).map(([k, v]) => (
              <div key={k} className="p-2 bg-slate-950 border border-slate-800 rounded">
                <span className="text-slate-500 uppercase text-[10px] block">{k.replace(/_/g, ' ')}</span>
                <span className="text-slate-200 font-semibold truncate block">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Established & Suggested Relationships */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Connected Graph Links ({connectedRels.length}):</span>
        </div>

        <div className="space-y-2">
          {connectedRels.map((rel) => {
            const isSource = rel.source_entity_id === selectedEntity.id;
            const otherEntId = isSource ? rel.target_entity_id : rel.source_entity_id;
            const otherEnt = entities.find((e) => e.id === otherEntId);

            return (
              <div
                key={rel.id}
                className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-amber-400 font-bold text-[11px]">
                    {rel.relationship_type}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      rel.status === 'confirmed'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {rel.status.toUpperCase()}
                  </span>
                </div>

                <div className="text-slate-300 text-xs">
                  {isSource ? 'Connected to' : 'Connected from'}:{' '}
                  <span className="font-bold text-cyan-300">{otherEnt?.name || 'Unknown'}</span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                  {rel.description}
                </p>

                {/* HITL Confirm / Dismiss controls if suggested */}
                {rel.status === 'ai_suggested' && (
                  <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-slate-800">
                    <button
                      onClick={() => updateRelationshipStatus(rel.id, 'dismissed')}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono rounded"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => updateRelationshipStatus(rel.id, 'confirmed')}
                      className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono rounded font-bold"
                    >
                      Confirm
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
