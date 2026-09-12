import { NextRequest, NextResponse } from 'next/server';
import {
  DETECTIVE_EXTRACTION_SYSTEM_PROMPT,
  DETECTIVE_EXTRACTION_JSON_SCHEMA,
} from '@/lib/ai/prompts';
import { EntityType, TimestampConfidence } from '@/types/investigation';

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';
const MAX_CONTENT_CHARS = 1500;
const SARVAM_TIMEOUT_MS = 7000;
const GEMINI_TIMEOUT_MS = 12000;

// Gemini API key rotation (primary + 2 backups)
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

/** Normalize raw AI JSON into typed entities + events */
function parseExtractionResult(parsed: any, sourceLabel: string) {
  const VALID_TYPES = ['person', 'vehicle', 'location', 'weapon', 'organization', 'object'];
  const rawEnts = Array.isArray(parsed.entities) ? parsed.entities
    : Array.isArray(parsed.entities?.person) ? [
        ...(parsed.entities.person || []).map((p: any) => ({ ...p, type: 'person' })),
        ...(parsed.entities.vehicle || []).map((v: any) => ({ ...v, type: 'vehicle' })),
        ...(parsed.entities.location || []).map((l: any) => ({ ...l, type: 'location' })),
        ...(parsed.entities.weapon || []).map((w: any) => ({ ...w, type: 'weapon' })),
        ...(parsed.entities.organization || []).map((o: any) => ({ ...o, type: 'organization' })),
      ] : [];

  const entities = rawEnts.map((e: any) => ({
    name: e.name || e.value || 'Unknown',
    type: (VALID_TYPES.includes(String(e.type).toLowerCase()) ? String(e.type).toLowerCase() : 'object') as EntityType,
    attributes: e.attributes || { details: e.role || e.model || e.plate || '' },
    confidence: typeof e.confidence === 'number' ? e.confidence : 0.9,
  }));

  const evList = Array.isArray(parsed.events) ? parsed.events : Array.isArray(parsed.timeline_events) ? parsed.timeline_events : [];
  const events = evList.map((ev: any) => ({
    description: ev.description || ev.event || 'Observed event',
    event_timestamp: ev.event_timestamp || ev.date || new Date().toISOString(),
    event_timestamp_confidence: (['exact', 'approximate', 'inferred'].includes(ev.event_timestamp_confidence)
      ? ev.event_timestamp_confidence : 'approximate') as TimestampConfidence,
    location_text: ev.location_text || ev.location || 'Rajasthan',
    lat: typeof ev.lat === 'number' ? ev.lat : undefined,
    lng: typeof ev.lng === 'number' ? ev.lng : undefined,
    source_offset: ev.source_offset || 'AI extraction',
    confidence: typeof ev.confidence === 'number' ? ev.confidence : 0.9,
  }));

  const suggestedRelationships = (Array.isArray(parsed.relationships) ? parsed.relationships : []).map((r: any) => ({
    source_entity_name: r.source_entity_name || r.source || '',
    target_entity_name: r.target_entity_name || r.target || '',
    relationship_type: r.relationship_type || r.type || 'CONNECTED_TO',
    description: r.description || '',
    confidence: typeof r.confidence === 'number' ? r.confidence : 0.85,
    explanation: r.explanation || `Extracted via ${sourceLabel}.`,
  }));

  return { entities, events, suggestedRelationships };
}

/**
 * Gemini fallback â€” reads Hindi (Devanagari) natively without needing Sarvam translation.
 * Tries each key in rotation until one succeeds.
 */
async function extractWithGemini(
  combinedText: string, title: string, uploadedBy: string, caseName: string, refYear: number
): Promise<{ entities: any[]; events: any[]; suggestedRelationships: any[] } | null> {
  const prompt = `You are a senior criminal intelligence analyst for an Indian law enforcement task force.
This document may be in Hindi (Devanagari), English, or both. READ AND EXTRACT from ALL languages equally.

CASE NAME: ${caseName || 'General Investigation'}
CASE REFERENCE YEAR: ${refYear} â€” use this for ALL timestamps unless the document says otherwise.
DOCUMENT TITLE: ${title || 'Evidence Record'}
UPLOADED BY: ${uploadedBy || 'Field Unit'}

${DETECTIVE_EXTRACTION_SYSTEM_PROMPT}

FOR HINDI TEXT â€” translate these as you extract:
- à¤†à¤°à¤µ à¤¸à¤¿à¤‚à¤¹ â†’ Aarav Singh (person, child, 7 years old)
- à¤®à¥€à¤¨à¤¾ à¤¸à¤¿à¤‚à¤¹ â†’ Meena Singh (person, mother, complainant)
- à¤¸à¥à¤¨à¥€à¤¤à¤¾ à¤¦à¥‡à¤µà¥€ â†’ Sunita Devi (person, neighbor witness)
- à¤°à¤®à¥‡à¤¶ à¤¸à¥‹à¤¨à¥€ â†’ Ramesh Soni (person, shopkeeper witness)
- à¤¶à¤¾à¤¸à¥à¤¤à¥à¤°à¥€ à¤¨à¤—à¤° â†’ Shastri Nagar (location)
- à¤¸à¤¿à¤Ÿà¥€ à¤ªà¤¾à¤°à¥à¤• â†’ City Park (location)
- à¤—à¥à¤°à¥‡ à¤¹à¥ˆà¤šà¤¬à¥ˆà¤• â†’ grey hatchback (vehicle)
- à¤¸à¥à¤•à¥‚à¤² à¤µà¥ˆà¤¨ â†’ school van (vehicle)
- Time formats: à¤¶à¤¾à¤® X à¤¬à¤œà¥‡ = X PM, à¤¸à¥à¤¬à¤¹ = AM, à¤¦à¥‹à¤ªà¤¹à¤° = afternoon

Return ONLY valid JSON:
${DETECTIVE_EXTRACTION_JSON_SCHEMA}

DOCUMENT:
${combinedText}`;

  for (const key of GEMINI_KEYS) {
    try {
      const res = await fetchWithTimeout(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
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
      const result = parseExtractionResult(parsed, 'Gemini AI');
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

    // Optional Sarvam translation for Hindi â†’ English
    if (hasHindi && SARVAM_API_KEY) {
      try {
        const transRes = await fetchWithTimeout('https://api.sarvam.ai/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api-subscription-key': SARVAM_API_KEY },
          body: JSON.stringify({ input: rawContent, source_language_code: 'hi-IN', target_language_code: 'en-IN', model: 'mayura:v1' }),
        }, SARVAM_TIMEOUT_MS);
        if (transRes.ok) {
          const d = await transRes.json();
          translatedEnglish = d.translated_text || '';
        }
      } catch (_) { /* skip translation if it fails */ }
    }

    const combinedText = hasHindi && translatedEnglish
      ? `ORIGINAL HINDI:\n${rawContent}\n\nENGLISH TRANSLATION:\n${translatedEnglish}`
      : rawContent;

    const imageSystemPrompt = `You are a forensic evidence analysis AI for law enforcement.
From the photographic/optical evidence record, officer observations, and any OCR text overlays, extract ALL structured forensic information:
- Persons mentioned or observed (names, roles, witnesses, suspects)
- Vehicles and license plates ONLY if explicitly detected in OCR or mentioned in observations
- Locations (markets, streets, intersections, toll plazas, cities, sectors)
- Date and time from scene, metadata, or timestamps
- Text overlays, signs, or exhibit labels
CRITICAL RULES:
- CASE CONTEXT: ${case_name || 'General Investigation'}
- If the case context highlights a specific person, place, vehicle, or event, you MUST prioritize extracting details and relationships relevant to them.
- Do NOT fabricate vehicle plates or locations that are not present in the input record.
Return ONLY valid JSON matching this schema:
${DETECTIVE_EXTRACTION_JSON_SCHEMA}`;

    const systemPrompt = isImageType
      ? imageSystemPrompt
      : `${DETECTIVE_EXTRACTION_SYSTEM_PROMPT}\nOutput pure valid JSON. No prose.`;

    const userPrompt = isImageType
      ? `Analyze photographic / optical forensic evidence from ${uploaded_by || 'Field Unit'}.
Title / Exhibit: ${title || 'Optical Evidence Exhibit'}
Forensic Record & Metadata:
${combinedText}

Extract verified entities (persons, locations, vehicles, timestamps) and events. Do NOT invent unseen license plates. Return ONLY valid JSON.`
      : `Analyze law enforcement dossier from ${uploaded_by || 'Field Unit'} (Type: ${file_type || 'text'}).
CASE CONTEXT: ${case_name || 'General Investigation'}
CRITICAL INSTRUCTION: If the case context highlights a specific person, place, vehicle, or event, you MUST prioritize extracting details and relationships relevant to them. Pay close attention to extracting all named entities mentioned in the document.

Extract all entities (person, vehicle, location, weapon, organization, object), chronological events with timestamps and locations, and inferred relationships.
Support both English and Hindi named entities accurately. Ensure Hindi text is extracted with all important details and equivalent precision as English text.

SCHEMA:
${DETECTIVE_EXTRACTION_JSON_SCHEMA}

TITLE: ${title || 'Field Dossier'}
CONTENT:
${combinedText}`;

    // â”€â”€ Try Sarvam AI (if key set) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (SARVAM_API_KEY) {
      try {
        const sarvamRes = await fetchWithTimeout('https://api.sarvam.ai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'api-subscription-key': SARVAM_API_KEY },
          body: JSON.stringify({
            model: 'sarvam-105b-conversations',
            messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
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
            const result = parseExtractionResult(parsed, 'Sarvam AI');
            if (result.entities.length > 0 || result.events.length > 0) {
              return NextResponse.json({ success: true, translated_text: translatedEnglish, ...result });
            }
          }
        }
      } catch (err: any) {
        console.warn('[extract] Sarvam failed, falling back to Gemini:', err?.name);
      }
    }

    // â”€â”€ Gemini fallback â€” primary path for Hindi, reads Devanagari natively â”€â”€â”€
    const geminiResult = await extractWithGemini(combinedText, title, uploaded_by, case_name, refYear);
    if (geminiResult && (geminiResult.entities.length > 0 || geminiResult.events.length > 0)) {
      return NextResponse.json({ success: true, translated_text: translatedEnglish, ...geminiResult });
    }

    // Nothing extracted â€” local engine handles it
    return NextResponse.json({ success: false, entities: [], events: [], suggestedRelationships: [] });

  } catch (error: any) {
    console.error('Extract API Error:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}
