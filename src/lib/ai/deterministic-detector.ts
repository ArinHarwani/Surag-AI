import { Event, Entity, Contradiction } from '@/types/investigation';

// Haversine formula to compute great-circle distance between two points in km
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export interface FlaggedCandidate {
  eventA: Event;
  eventB: Event;
  type: 'temporal' | 'spatial' | 'factual';
  distanceKm: number;
  timeDiffMinutes: number;
  speedRequiredKmh: number;
  deterministicReason: string;
}

/**
 * Step 1 (Deterministic Code Check):
 * Evaluates all event pairs for impossible speed or conflicting alibi statements.
 */
export function findCandidateContradictions(
  events: Event[],
  _entities: Entity[],
  existingContradictions: Contradiction[] = []
): FlaggedCandidate[] {
  const candidates: FlaggedCandidate[] = [];

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const evtA = events[i];
      const evtB = events[j];

      // Ensure events belong to the same case
      if (evtA.case_id && evtB.case_id && evtA.case_id !== evtB.case_id) continue;

      // Check if this pair is already recorded as a contradiction
      const alreadyFlagged = existingContradictions.some(
        (c) =>
          (c.event_a_id === evtA.id && c.event_b_id === evtB.id) ||
          (c.event_a_id === evtB.id && c.event_b_id === evtA.id)
      );
      if (alreadyFlagged) continue;

      // Extract timestamps
      const timeA = new Date(evtA.event_timestamp).getTime();
      const timeB = new Date(evtB.event_timestamp).getTime();
      if (isNaN(timeA) || isNaN(timeB)) continue;

      const timeDiffMinutes = Math.abs(timeA - timeB) / (1000 * 60);

      // Check coordinate distance if lat/lng available
      let distanceKm = 0;
      if (evtA.lat && evtA.lng && evtB.lat && evtB.lng) {
        distanceKm = calculateDistanceKm(evtA.lat, evtA.lng, evtB.lat, evtB.lng);
      } else {
        // Fallback string matching for prominent cities
        const locA = evtA.location_text.toLowerCase();
        const locB = evtB.location_text.toLowerCase();
        if (
          (locA.includes('jodhpur') && locB.includes('kota')) ||
          (locA.includes('kota') && locB.includes('jodhpur'))
        ) {
          distanceKm = 340; // Known highway distance Jodhpur - Kota
        }
      }

      // Check for impossible transit speed (> 130 km/h) or same-hour conflict across cities
      if (distanceKm > 50 && timeDiffMinutes > 0) {
        const speedRequiredKmh = (distanceKm / (timeDiffMinutes / 60));
        if (speedRequiredKmh > 120) {
          candidates.push({
            eventA: evtA,
            eventB: evtB,
            type: 'temporal',
            distanceKm,
            timeDiffMinutes: Math.round(timeDiffMinutes),
            speedRequiredKmh: Math.round(speedRequiredKmh),
            deterministicReason: `Physical impossibility: Distance between locations is ${distanceKm} km, but elapsed time is only ${Math.round(
              timeDiffMinutes
            )} min, requiring an impossible transit velocity of ${Math.round(speedRequiredKmh)} km/h.`,
          });
          continue;
        }
      }

      // ── Legacy alibi check (cross-city) ──────────────────────────────────────
      const descA = (evtA.description || '').toLowerCase();
      const descB = (evtB.description || '').toLowerCase();
      const isAlibiA = descA.includes('alibi') || descA.includes('claims') || descA.includes('denies');
      const isAlibiB = descB.includes('alibi') || descB.includes('claims') || descB.includes('denies');

      if ((isAlibiA || isAlibiB) && distanceKm > 100 && timeDiffMinutes < 180) {
        candidates.push({
          eventA: evtA,
          eventB: evtB,
          type: 'factual',
          distanceKm,
          timeDiffMinutes: Math.round(timeDiffMinutes),
          speedRequiredKmh: Math.round(distanceKm / (Math.max(timeDiffMinutes, 1) / 60)),
          deterministicReason: `Alibi contradiction: One record claims presence at ${
            isAlibiA ? evtA.location_text : evtB.location_text
          } while physical intelligence records subject at ${
            isAlibiA ? evtB.location_text : evtA.location_text
          } during the same operational window.`,
        });
      }
    }
  }

  return candidates;
}
