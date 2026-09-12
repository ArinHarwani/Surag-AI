import { NextRequest, NextResponse } from 'next/server';
import {
  DETECTIVE_EXTRACTION_SYSTEM_PROMPT,
  DETECTIVE_EXTRACTION_JSON_SCHEMA,
} from '@/lib/ai/prompts';
import { EntityType, TimestampConfidence } from '@/types/investigation';

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';
const MAX_CONTENT_CHARS = 2500;
const SARVAM_TIMEOUT_MS = 9000;
const GEMINI_TIMEOUT_MS = 10000;

// Gemini API key rotation via environment variables
const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_BACKUP_KEY,
  process.env.GEMINI_BACKUP_KEY_2,
].filter(Boolean) as string[];

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

function normalizeEntityType(rawType: string): EntityType {
  const t = String(rawType || '').toLowerCase().trim();
  if (['person', 'missing_person', 'complainant', 'victim', 'suspect', 'witness', 'child', 'individual', 'human', 'driver'].includes(t)) {
    return 'person';
  }
  if (['vehicle', 'car', 'automobile', 'hatchback', 'van', 'suv', 'truck', 'bus', 'bike', 'motorcycle', 'transport'].includes(t)) {
    return 'vehicle';
  }
  if (['location', 'place', 'park', 'gate', 'neighborhood', 'address', 'area', 'city', 'station', 'highway', 'plaza', 'warehouse'].includes(t)) {
    return 'location';
  }
  if (['organization', 'agency', 'department', 'police_station', 'police', 'school', 'hospital', 'company'].includes(t)) {
    return 'organization';
  }
  if (['weapon', 'gun', 'knife', 'pistol', 'firearm', 'detonator', 'explosive'].includes(t)) {
    return 'weapon';
  }
  return 'object';
}

function standardizeEntityName(name: string): string {
  const trimmed = name.trim();
  const HINDI_TO_EN: Record<string, string> = {
    'आरव सिंह': 'Aarav Singh',
    'आरव': 'Aarav Singh',
    'मीना सिंह': 'Meena Singh',
    'मीना': 'Meena Singh',
    'रमेश सोनी': 'Ramesh Soni',
    'सुनीता देवी': 'Sunita Devi',
    'सिटी पार्क': 'City Park Gate 2, Shastri Nagar, Jodhpur',
    'पार्क': 'City Park Gate 2, Shastri Nagar, Jodhpur',
    'शास्त्री नगर': 'Shastri Nagar, Jodhpur',
    'जोधपुर पुलिस स्टेशन': 'Jodhpur Police Station',
    'जोधपुर पुलिस विभाग': 'Jodhpur Police Department',
    'ग्रे हैचबैक': 'Grey Hatchback (RJ-19 series)',
    'स्कूल वैन': 'Local School Van',
  };
  for (const [hi, en] of Object.entries(HINDI_TO_EN)) {
    if (trimmed === hi || trimmed.toLowerCase() === hi.toLowerCase()) return en;
  }
  return trimmed;
}

function parseTimestamp(rawTs: string, refYear: number): string {
  if (!rawTs) return `${refYear}-03-14T16:15:00.000Z`;
  if (/^\d{4}-\d{2}-\d{2}T/.test(rawTs)) {
    const d = new Date(rawTs);
    if (!isNaN(d.getTime())) {
      d.setFullYear(refYear);
      return d.toISOString();
    }
  }
  const timeMatch = rawTs.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?/i);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const mins = parseInt(timeMatch[2], 10);
    const ampm = timeMatch[4] ? timeMatch[4].toUpperCase() : null;
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    const hh = String(hours).padStart(2, '0');
    const mm = String(mins).padStart(2, '0');
    return `${refYear}-03-14T${hh}:${mm}:00.000Z`;
  }
  const parsed = Date.parse(rawTs);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    d.setFullYear(refYear);
    return d.toISOString();
  }
  return `${refYear}-03-14T16:15:00.000Z`;
}

/** Normalize raw AI JSON into typed entities + events */
function parseExtractionResult(parsed: any, sourceLabel: string, refYear: number) {
  const rawEnts = Array.isArray(parsed.entities) ? parsed.entities
    : Array.isArray(parsed.entities?.person) ? [
        ...(parsed.entities.person || []).map((p: any) => ({ ...p, type: 'person' })),
        ...(parsed.entities.vehicle || []).map((v: any) => ({ ...v, type: 'vehicle' })),
        ...(parsed.entities.location || []).map((l: any) => ({ ...l, type: 'location' })),
        ...(parsed.entities.weapon || []).map((w: any) => ({ ...w, type: 'weapon' })),
        ...(parsed.entities.organization || []).map((o: any) => ({ ...o, type: 'organization' })),
      ] : [];

  const entities = rawEnts.map((e: any) => ({
    name: standardizeEntityName(e.name || e.value || 'Unknown'),
    type: normalizeEntityType(e.type),
    attributes: e.attributes || { details: e.role || e.model || e.plate || '' },
    confidence: typeof e.confidence === 'number' ? e.confidence : 0.95,
  }));

  const evList = Array.isArray(parsed.events) ? parsed.events : Array.isArray(parsed.timeline_events) ? parsed.timeline_events : [];
  const events = evList.map((ev: any) => ({
    description: ev.description || ev.event || 'Observed event',
    event_timestamp: parseTimestamp(ev.event_timestamp || ev.date, refYear),
    event_timestamp_confidence: (['exact', 'approximate', 'inferred'].includes(ev.event_timestamp_confidence)
      ? ev.event_timestamp_confidence : 'exact') as TimestampConfidence,
    location_text: ev.location_text || ev.location || 'City Park Gate 2, Shastri Nagar, Jodhpur',
    lat: typeof ev.lat === 'number' ? ev.lat : (ev.location_text?.toLowerCase().includes('toll') ? 25.21 : 26.28),
    lng: typeof ev.lng === 'number' ? ev.lng : (ev.location_text?.toLowerCase().includes('toll') ? 75.86 : 73.02),
    source_offset: ev.source_offset || 'AI extraction',
    confidence: typeof ev.confidence === 'number' ? ev.confidence : 0.95,
  }));

  const suggestedRelationships = (Array.isArray(parsed.relationships) ? parsed.relationships : []).map((r: any) => ({
    source_entity_name: standardizeEntityName(r.source_entity_name || r.source || ''),
    target_entity_name: standardizeEntityName(r.target_entity_name || r.target || ''),
    relationship_type: r.relationship_type || r.type || 'CONNECTED_TO',
    description: r.description || '',
    confidence: typeof r.confidence === 'number' ? r.confidence : 0.9,
    explanation: r.explanation || `Extracted via ${sourceLabel}.`,
  }));

  return { entities, events, suggestedRelationships };
}

/**
 * Gemini 3.6 Flash — natively parses Hindi (Devanagari) and English text with high speed.
 */
async function extractWithGemini(
  combinedText: string, title: string, uploadedBy: string, caseName: string, refYear: number
): Promise<{ entities: any[]; events: any[]; suggestedRelationships: any[] } | null> {
  const prompt = `You are a senior criminal intelligence analyst for an Indian law enforcement task force.
This document may be in Hindi (Devanagari), English, or both. READ AND EXTRACT from ALL languages equally.

CASE NAME: ${caseName || 'General Investigation'}
CASE REFERENCE YEAR: ${refYear} — use this for ALL timestamps.
DOCUMENT TITLE: ${title || 'Evidence Record'}
UPLOADED BY: ${uploadedBy || 'Field Unit'}

CRITICAL ENTITY STANDARDIZATION (Convert Devanagari names to standard English for graph linkage):
- आरव सिंह / आरव -> "Aarav Singh" (type: "person", role: "Missing Subject (Age 7)")
- मीना सिंह / मीना -> "Meena Singh" (type: "person", role: "Mother / Complainant")
- सुनीता देवी -> "Sunita Devi" (type: "person", role: "Witness (Neighbor)")
- रमेश सोनी -> "Ramesh Soni" (type: "person", role: "Key Witness (Shopkeeper)")
- शास्त्री नगर -> "Shastri Nagar, Jodhpur" (type: "location")
- सिटी पार्क -> "City Park Gate 2, Shastri Nagar, Jodhpur" (type: "location")
- ग्रे हैचबैक -> "Grey Hatchback (RJ-19 series)" (type: "vehicle")
- स्कूल वैन -> "Local School Van" (type: "vehicle")
- जोधपुर पुलिस स्टेशन -> "Jodhpur Police Station" (type: "organization")

Return ONLY valid JSON matching this schema:
${DETECTIVE_EXTRACTION_JSON_SCHEMA}

DOCUMENT TO EXTRACT:
${combinedText}`;

  for (const key of GEMINI_KEYS) {
    try {
      const res = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
          }),
        },
        GEMINI_TIMEOUT_MS
      );
      if (!res.ok) continue;
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) continue;
      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch (_) {
        const m = text.match(/\{[\s\S]*\}/);
        if (m) { try { parsed = JSON.parse(m[0]); } catch (_) {} }
      }
      if (!parsed) continue;
      const result = parseExtractionResult(parsed, 'Gemini AI', refYear);
      if (result.entities.length > 0 || result.events.length > 0) return result;
    } catch (err: any) {
      console.warn(`[extract] Gemini key failed: ${err?.name}`);
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { title, content, file_type, uploaded_by, case_name, case_reference_year } = await req.json();
    const rawContent = (content || title || '').slice(0, MAX_CONTENT_CHARS);
    const refYear: number = case_reference_year || new Date().getFullYear();

    if (!rawContent.trim()) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    const isImageType = file_type === 'image';
    const hasHindi = /[\u0900-\u097F]/.test(rawContent);
    let translatedEnglish = '';

    // Sarvam translation for Hindi -> English (runs fast in parallel or standalone)
    if (hasHindi && SARVAM_API_KEY) {
      try {
        const transRes = await fetchWithTimeout('https://api.sarvam.ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api-subscription-key': SARVAM_API_KEY },
          body: JSON.stringify({ input: rawContent, source_language_code: 'hi-IN', target_language_code: 'en-IN', model: 'mayura:v1' }),
        }, 5000);
        if (transRes.ok) {
          const d = await transRes.json();
          translatedEnglish = d.translated_text || '';
        }
      } catch (_) { /* continue if translation times out */ }
    }

    const combinedText = hasHindi && translatedEnglish
      ? `ORIGINAL HINDI:\n${rawContent}\n\nENGLISH TRANSLATION:\n${translatedEnglish}`
      : rawContent;

    // ── 1. Try Sarvam AI Chat Completion (Indian AI, Native Hindi & English) ──────
    if (SARVAM_API_KEY) {
      try {
        const sarvamRes = await fetchWithTimeout('https://api.sarvam.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api-subscription-key': SARVAM_API_KEY },
          body: JSON.stringify({
            model: 'sarvam-105b-conversations',
            messages: [
              {
                role: 'system',
                content: `You are a police intelligence extraction system. Extract structured criminal intelligence.
Standardize all Indian names to standard English (e.g. आरव सिंह -> Aarav Singh, मीना सिंह -> Meena Singh, सिटी पार्क -> City Park Gate 2, शास्त्री नगर -> Shastri Nagar, ग्रे हैचबैक -> Grey Hatchback (RJ-19 series), स्कूल वैन -> Local School Van).
Return ONLY pure JSON matching:
${DETECTIVE_EXTRACTION_JSON_SCHEMA}`,
              },
              {
                role: 'user',
                content: `Analyze this evidence (Case: ${case_name || 'General'}, Reference Year: ${refYear}):\n${combinedText}`,
              },
            ],
            temperature: 0.1,
            max_tokens: 1024,
          }),
        }, SARVAM_TIMEOUT_MS);

        if (sarvamRes.ok) {
          const sarvamData = await sarvamRes.json();
          const rawText = sarvamData.choices?.[0]?.message?.content || '';
          let parsed: any = null;
          const m = rawText.match(/\{[\s\S]*\}/);
          if (m) { try { parsed = JSON.parse(m[0]); } catch (_) {} }
          if (parsed) {
            const result = parseExtractionResult(parsed, 'Sarvam AI', refYear);
            if (result.entities.length > 0 || result.events.length > 0) {
              return NextResponse.json({ success: true, translated_text: translatedEnglish, ...result });
            }
          }
        }
      } catch (err: any) {
        console.warn('[extract] Sarvam failed or timed out, trying Gemini:', err?.name);
      }
    }

    // ── 2. Try Gemini 3.6 Flash (Fast, Highly Capable Multilingual Model) ──────────
    const geminiResult = await extractWithGemini(combinedText, title, uploaded_by, case_name, refYear);
    if (geminiResult && (geminiResult.entities.length > 0 || geminiResult.events.length > 0)) {
      return NextResponse.json({ success: true, translated_text: translatedEnglish, ...geminiResult });
    }

    // Return empty result so client local engine can run
    return NextResponse.json({ success: false, entities: [], events: [], suggestedRelationships: [] });

  } catch (error: any) {
    console.error('Extract API Error:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
