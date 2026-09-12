import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseAdmin = (supabaseUrl && serviceKey)
  ? createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

export async function POST(req: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase admin client not available' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { action, payload } = body;

    if (action === 'ingest_document') {
      const { caseId, caseName, document, entities, events, relationships, contradictions } = payload;

      // 1. Upsert Case
      if (caseId && caseName) {
        const caseRecord: any = {
          id: caseId,
          name: caseName,
        };
        if (payload.filingAgencyId) {
          caseRecord.filing_agency_id = payload.filingAgencyId;
        }
        const { error: cErr } = await supabaseAdmin.from('cases').upsert(caseRecord);
        if (cErr && cErr.message?.includes('filing_agency_id')) {
          await supabaseAdmin.from('cases').upsert({
            id: caseId,
            name: caseName,
          });
        }
      }

      // ── DEDUPLICATION (nuclear, case-level) ──────────────────────────────────
      // The client sends allEvents = every event for the whole case. Delete all
      // existing events for this case, then reinsert the clean deduplicated set.
      // This is safe because allEvents is already deduplicated on the client.
      if (caseId) {
        await supabaseAdmin.from('events').delete().eq('case_id', caseId);
      }

      // ── Year sanitization (server-side safety net) ─────────────────────────
      // Force-correct any event timestamp whose year is more than 1 year from
      // the current year (e.g. 2023 OCR'd from a CCTV overlay should be 2026).
      const currentYear = new Date().getFullYear();
      const sanitizedEvents = (events || []).map((ev: any) => {
        try {
          const d = new Date(ev.event_timestamp);
          if (!isNaN(d.getTime()) && Math.abs(d.getFullYear() - currentYear) > 1) {
            const corrected = new Date(ev.event_timestamp);
            corrected.setFullYear(currentYear);
            return { ...ev, event_timestamp: corrected.toISOString(), event_timestamp_confidence: 'inferred' };
          }
        } catch (_) {}
        return ev;
      });

      // 2. Insert Document
      if (document) {
        await supabaseAdmin.from('documents').upsert({
          id: document.id,
          case_id: document.case_id,
          agency_id: document.agency_id,
          uploaded_by: document.uploaded_by,
          title: document.title,
          file_type: document.file_type,
          content_text: document.content_text,
          storage_path: document.media_url || document.storage_path || null,
          status: document.status || 'processed',
          uploaded_at: document.uploaded_at || new Date().toISOString(),
        });
      }

      // 3. Insert Entities
      if (entities && entities.length > 0) {
        await supabaseAdmin.from('entities').upsert(entities);
      }

      // 4. Insert Events (sanitized)
      if (sanitizedEvents.length > 0) {
        await supabaseAdmin.from('events').upsert(sanitizedEvents);
      }

      // 5. Insert Relationships
      if (relationships && relationships.length > 0) {
        await supabaseAdmin.from('relationships').upsert(relationships);
      }

      // 6. Insert Contradictions
      if (contradictions && contradictions.length > 0) {
        await supabaseAdmin.from('contradictions').upsert(contradictions);
      }

      return NextResponse.json({ success: true, docId: document?.id });

    }

    if (action === 'send_connection_request') {
      const { request } = payload;
      if (request) {
        // Ensure case exists
        if (request.case_id && request.case_name) {
          await supabaseAdmin.from('cases').upsert({
            id: request.case_id,
            name: request.case_name,
          });
        }

        const AGENCIES_MAP: Record<string, string> = {
          jodhpur: '11111111-1111-1111-1111-111111111111',
          kota: '22222222-2222-2222-2222-222222222222',
          jaipur: '33333333-3333-3333-3333-333333333333',
          ajmer: '44444444-4444-4444-4444-444444444444',
          jaisalmer: '55555555-5555-5555-5555-555555555555',
        };

        const { error } = await supabaseAdmin.from('connection_requests').upsert({
          id: request.id,
          case_id: request.case_id,
          requesting_agency_id: AGENCIES_MAP[request.requesting_agency_slug] || request.requesting_agency_slug,
          target_agency_id: AGENCIES_MAP[request.target_agency_slug] || request.target_agency_slug,
          case_brief_snapshot: request.case_brief_snapshot,
          status: request.status || 'pending',
          created_at: request.created_at || new Date().toISOString(),
        });

        if (error) {
          console.error('API send_connection_request error:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'respond_connection_request') {
      const { requestId, status, responded_at } = payload;
      const { error } = await supabaseAdmin.from('connection_requests').update({
        status,
        responded_at: responded_at || new Date().toISOString(),
      }).eq('id', requestId);

      if (error) {
        console.error('API respond_connection_request error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === 'fetch_all') {
      const [
        { data: cases },
        { data: docs },
        { data: ents },
        { data: evts },
        { data: rels },
        { data: cons },
        { data: reqs },
      ] = await Promise.all([
        supabaseAdmin.from('cases').select('*').order('created_at', { ascending: false }).limit(1),
        supabaseAdmin.from('documents').select('*').order('uploaded_at', { ascending: false }),
        supabaseAdmin.from('entities').select('*'),
        supabaseAdmin.from('events').select('*'),
        supabaseAdmin.from('relationships').select('*'),
        supabaseAdmin.from('contradictions').select('*'),
        supabaseAdmin.from('connection_requests').select('*'),
      ]);

      return NextResponse.json({
        cases: cases || [],
        documents: docs || [],
        entities: ents || [],
        events: evts || [],
        relationships: rels || [],
        contradictions: cons || [],
        connection_requests: reqs || [],
      });
    }

    if (action === 'reset_case') {
      const { caseId } = payload;
      if (caseId) {
        await Promise.all([
          supabaseAdmin.from('contradictions').delete().eq('case_id', caseId),
          supabaseAdmin.from('relationships').delete().eq('case_id', caseId),
          supabaseAdmin.from('events').delete().eq('case_id', caseId),
          supabaseAdmin.from('entities').delete().eq('case_id', caseId),
          supabaseAdmin.from('documents').delete().eq('case_id', caseId),
          supabaseAdmin.from('connection_requests').delete().eq('case_id', caseId),
          supabaseAdmin.from('cases').delete().eq('id', caseId),
        ]);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    console.error('Supabase sync API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
