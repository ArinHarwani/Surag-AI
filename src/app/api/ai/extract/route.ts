import { NextRequest, NextResponse } from 'next/server';
import {
  DETECTIVE_EXTRACTION_SYSTEM_PROMPT,
  DETECTIVE_EXTRACTION_JSON_SCHEMA,
} from '@/lib/ai/prompts';
import { EntityType, TimestampConfidence } from '@/types/investigation';

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';
const MAX_CONTENT_CHARS = 1200;
const SARVAM_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, content, file_type, uploaded_by } = await req.json();
    const rawContent = (content || title || '').slice(0, MAX_CONTENT_CHARS);

    if (!rawContent.trim()) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    const isImageType = file_type === 'image';
    const hasHindi = !isImageType && /[\u0900-\u097F]/.test(rawContent);
    let translatedEnglish = '';

    if (hasHindi) {
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

    // Image-specific optical forensic prompt
    const imageSystemPrompt = `You are a forensic evidence analysis AI for law enforcement.
From the photographic/optical evidence record, officer observations, and any OCR text overlays, extract ALL structured forensic information:
- Persons mentioned or observed (names, roles, witnesses, suspects)
- Vehicles and license plates ONLY if explicitly detected in OCR or mentioned in observations
- Locations (markets, streets, intersections, toll plazas, cities, sectors)
- Date and time from scene, metadata, or timestamps
- Text overlays, signs, or exhibit labels
CRITICAL RULES:
- FOCUS ONLY ON THE STUDENT NAMED "AARAV". You must extract entities, events, and relationships ONLY if they are directly connected to Aarav or his immediate network. Ignore all other unrelated suspicious activities, persons, or vehicles.
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
SCHEMA:
${DETECTIVE_EXTRACTION_JSON_SCHEMA}

TITLE: ${title || 'Field Dossier'}
CONTENT:
${combinedText}`;

    // Call Sarvam AI with timeout — returns 504 on timeout so pipeline falls back to local engine
    let sarvamRes: Response;
    try {
      sarvamRes = await fetchWithTimeout('https://api.sarvam.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'api-subscription-key': SARVAM_API_KEY },
        body: JSON.stringify({
          model: 'sarvam-105b-conversations',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.1,
          max_tokens: 1024,
        }),
      }, SARVAM_TIMEOUT_MS);
    } catch (err: any) {
      console.warn('Sarvam timeout/error, local engine will handle:', err?.name);
      return NextResponse.json({ error: 'timeout' }, { status: 504 });
    }

    if (!sarvamRes.ok) {
      return NextResponse.json({ error: `Sarvam error ${sarvamRes.status}` }, { status: sarvamRes.status });
    }

    const sarvamData = await sarvamRes.json();
    const choice = sarvamData.choices?.[0]?.message;
    const rawText = choice?.content || choice?.reasoning_content || '';

    let parsed: any = null;
    const m = rawText.match(/\{[\s\S]*\}/);
    if (m) { try { parsed = JSON.parse(m[0]); } catch (_) {} }
    if (!parsed) return NextResponse.json({ success: false, raw_output: rawText });

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
      source_offset: ev.source_offset || 'Frame capture',
      confidence: typeof ev.confidence === 'number' ? ev.confidence : 0.9,
    }));

    const suggestedRelationships = (Array.isArray(parsed.relationships) ? parsed.relationships : []).map((r: any) => ({
      source_entity_name: r.source_entity_name || r.source || '',
      target_entity_name: r.target_entity_name || r.target || '',
      relationship_type: r.relationship_type || r.type || 'CONNECTED_TO',
      description: r.description || '',
      confidence: typeof r.confidence === 'number' ? r.confidence : 0.85,
      explanation: r.explanation || 'Extracted via Sarvam AI.',
    }));

    return NextResponse.json({ success: true, translated_text: translatedEnglish, entities, events, suggestedRelationships });
  } catch (error: any) {
    console.error('Extract API Error:', error);
    return NextResponse.json({ error: error?.message || 'Internal error' }, { status: 500 });
  }
}

