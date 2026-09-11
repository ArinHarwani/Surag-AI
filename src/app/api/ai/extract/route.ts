import { NextRequest, NextResponse } from 'next/server';
import {
  DETECTIVE_EXTRACTION_SYSTEM_PROMPT,
  DETECTIVE_EXTRACTION_JSON_SCHEMA,
} from '@/lib/ai/prompts';
import { EntityType, TimestampConfidence } from '@/types/investigation';

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || 'sk_r68m1zyn_YMGdXIfqtAbxPp01nGDJuvpC';

export async function POST(req: NextRequest) {
  try {
    const { title, content, file_type, uploaded_by } = await req.json();
    const rawContent = content || title || '';

    if (!rawContent.trim()) {
      return NextResponse.json({ error: 'No content provided for extraction' }, { status: 400 });
    }

    // 1. Detect if content contains Hindi / Devanagari script
    const hasHindi = /[\u0900-\u097F]/.test(rawContent);
    let translatedEnglish = '';

    if (hasHindi) {
      try {
        const transRes = await fetch('https://api.sarvam.ai/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': SARVAM_API_KEY,
          },
          body: JSON.stringify({
            input: rawContent.slice(0, 2000),
            source_language_code: 'hi-IN',
            target_language_code: 'en-IN',
            model: 'mayura:v1',
          }),
        });

        if (transRes.ok) {
          const transData = await transRes.json();
          translatedEnglish = transData.translated_text || '';
        }
      } catch (transErr) {
        console.warn('Sarvam Hindi translation step skipped:', transErr);
      }
    }

    // 2. Prepare comprehensive bilingual prompt for Sarvam AI LLM
    const combinedAnalysisText = hasHindi && translatedEnglish
      ? `ORIGINAL HINDI TEXT:\n${rawContent}\n\nENGLISH TRANSLATION (SARVAM MAYURA):\n${translatedEnglish}`
      : rawContent;

    const userPrompt = `Analyze this law enforcement investigative dossier from ${uploaded_by || 'Field Unit'} (File Type: ${file_type || 'text'}).
Extract all entities (person, vehicle, location, weapon, organization, object), chronological events with timestamps and locations, and inferred relationships.
Support both English and Hindi named entities accurately.

Return ONLY a valid JSON object matching this schema:
${DETECTIVE_EXTRACTION_JSON_SCHEMA}

DOCUMENT TO ANALYZE:
TITLE: ${title || 'Field Dossier'}
CONTENT:
${combinedAnalysisText}`;

    // 3. Call Sarvam AI Chat Completions
    const sarvamRes = await fetch('https://api.sarvam.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': SARVAM_API_KEY,
      },
      body: JSON.stringify({
        model: 'sarvam-105b-conversations',
        messages: [
          {
            role: 'system',
            content: `${DETECTIVE_EXTRACTION_SYSTEM_PROMPT}\nYou must output pure valid JSON adhering to the specified schema without conversational prose.`,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!sarvamRes.ok) {
      const errText = await sarvamRes.text();
      console.warn('Sarvam chat completion failed:', sarvamRes.status, errText);
      return NextResponse.json(
        { error: `Sarvam Chat API error: ${sarvamRes.status}`, details: errText },
        { status: sarvamRes.status }
      );
    }

    const sarvamData = await sarvamRes.json();
    const choice = sarvamData.choices?.[0]?.message;
    const rawText = choice?.content || choice?.reasoning_content || '';

    // 4. Robust JSON extraction from LLM response
    let parsed: any = null;
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        console.warn('Failed to parse matched JSON substring from Sarvam, attempting sanitization:', parseErr);
      }
    }

    if (!parsed) {
      return NextResponse.json({
        success: false,
        raw_output: rawText,
        translated_text: translatedEnglish,
        message: 'Could not parse structured JSON from Sarvam response',
      });
    }

    // Normalize entities to ensure proper types
    const rawEntities = Array.isArray(parsed.entities)
      ? parsed.entities
      : Array.isArray(parsed.entities?.person)
      ? [
          ...(parsed.entities.person || []).map((p: any) => ({ ...p, type: 'person' })),
          ...(parsed.entities.vehicle || []).map((v: any) => ({ ...v, type: 'vehicle' })),
          ...(parsed.entities.location || []).map((l: any) => ({ ...l, type: 'location' })),
          ...(parsed.entities.weapon || []).map((w: any) => ({ ...w, type: 'weapon' })),
          ...(parsed.entities.organization || []).map((o: any) => ({ ...o, type: 'organization' })),
        ]
      : [];

    const entities = rawEntities.map((e: any) => ({
      name: e.name || e.value || 'Unknown Entity',
      type: (['person', 'vehicle', 'location', 'weapon', 'organization', 'object'].includes(String(e.type).toLowerCase())
        ? String(e.type).toLowerCase()
        : 'object') as EntityType,
      attributes: e.attributes || { details: e.role || e.model || e.type || '' },
      confidence: typeof e.confidence === 'number' ? e.confidence : 0.9,
    }));

    const events = (Array.isArray(parsed.events) ? parsed.events : Array.isArray(parsed.timeline_events) ? parsed.timeline_events : []).map((ev: any) => ({
      description: ev.description || ev.event || 'Observed event',
      event_timestamp: ev.event_timestamp || ev.date || new Date().toISOString(),
      event_timestamp_confidence: (['exact', 'approximate', 'inferred'].includes(ev.event_timestamp_confidence)
        ? ev.event_timestamp_confidence
        : 'approximate') as TimestampConfidence,
      location_text: ev.location_text || ev.location || 'Rajasthan Corridor',
      lat: typeof ev.lat === 'number' ? ev.lat : undefined,
      lng: typeof ev.lng === 'number' ? ev.lng : undefined,
      source_offset: ev.source_offset || 'Paragraph 1-2',
      confidence: typeof ev.confidence === 'number' ? ev.confidence : 0.9,
    }));

    const suggestedRelationships = (Array.isArray(parsed.relationships) ? parsed.relationships : []).map((r: any) => ({
      source_entity_name: r.source_entity_name || r.source || '',
      target_entity_name: r.target_entity_name || r.target || '',
      relationship_type: r.relationship_type || r.type || 'CONNECTED_TO',
      description: r.description || '',
      confidence: typeof r.confidence === 'number' ? r.confidence : 0.85,
      explanation: r.explanation || 'Extracted via Sarvam AI multi-modal intelligence.',
    }));

    return NextResponse.json({
      success: true,
      translated_text: translatedEnglish,
      entities,
      events,
      suggestedRelationships,
    });
  } catch (error: any) {
    console.error('Sarvam Extract API Error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error in extraction' },
      { status: 500 }
    );
  }
}
