# Surag-AI (सुराग-AI)
### Collaborative Investigative Intelligence Platform (PS #16)
> *"From Fragmented Signals to an Explainable Intelligence Picture"*
>
> **"Two agencies had the same case. Neither knew the other existed — until now."**

A shared, real-time investigative intelligence platform where multi-modal evidence in any form (text statements, CCTV photos, audio wiretaps, surveillance video) transforms into a structured, explainable case picture that two departments watch build itself, live, together.

---

## 🔒 Non-Negotiable Core Decisions

1. **No Neo4j — Direct Postgres Graph**:
   The graph lives natively in Supabase Postgres (`entities` + `relationships` tables). `react-force-graph-2d` renders straight from state / SQL queries.
2. **Strict Provenance & Confidence Scores**:
   Every extracted fact carries an exact source offset (`Line X-Y`, `mm:ss` timecode, or `bbox [x, y, w, h]`) and an explainable confidence score (0–100%).
3. **AI Suggests, Human Confirms (HITL)**:
   Inferred connections and contradiction alerts default to `ai_suggested` / `flagged` status. Analysts click **Confirm as Fact** or **Dismiss**. Nothing silently becomes truth.
4. **Sacred Dual-Timestamp Timeline**:
   Every event records both the **real-world event timestamp** (when it happened) and the **source offset** (where in the evidence it was documented).

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Dev Environment**: Antigravity IDE
- **Styling**: Tailwind CSS (v4) with Tactical Dark Mode
- **Backend & Database**: Supabase (Postgres + Storage + Realtime)
- **AI Intelligence**:
  - **Sarvam AI API**: Native Indian-language bilingual (Hindi & English) intelligence:
    - `saaras:v3` Speech-to-Text for multi-dialect audio evidence transcription (English & Hindi)
    - `mayura:v1` translation engine for cross-lingual Hindi FIR/telemetry grounding
    - `sarvam-105b-conversations` LLM for forensic detective extraction, relation discovery, and GraphRAG briefs.
  - **Gemini API**: Optical CCTV vision processing.
  - **Zero-Latency Heuristic Detective Engine**: Resilient fallback engine.
- **Visualizations**:
  - **Relationship Graph**: `react-force-graph-2d` (Canvas rendering with entity color coding and click-to-explain drawer).
  - **Geospatial Map**: `react-leaflet` + CartoDB Dark Matter tiles (Rajasthan Highway Corridor NH-25/NH-27).
  - **Forensic Timeline**: Custom React + Tailwind chronological scrubber.
- **Evidence Vault**: `react-dropzone` multi-modal ingestion.

---

## 🗂️ Database Schema (`supabase/schema.sql`)

The database model implements the 8 contract tables defined in the PRD:
1. `cases` (id, name, created_at)
2. `agencies` (id, name, slug) — Jodhpur Police, Kota Police
3. `documents` (id, case_id, agency_id, uploaded_by, title, file_type, content_text, metadata, status, uploaded_at)
4. `events` (id, case_id, document_id, description, event_timestamp, event_timestamp_confidence, location_text, lat, lng, source_offset, confidence, created_at)
5. `entities` (id, case_id, agency_id, type, name, attributes jsonb, first_seen_at)
6. `entity_mentions` (id, entity_id, document_id, event_id, source_snippet, source_offset, confidence)
7. `relationships` (id, case_id, source_entity_id, target_entity_id, relationship_type, description, confidence, status, source_document_ids, explanation, created_at)
8. `contradictions` (id, case_id, event_a_id, event_b_id, type, description, status, created_at)

Supabase Realtime is enabled on `events`, `relationships`, `contradictions`, `documents`, and `entities`.

---

## 🚦 Portals & Routing

- `/` — **Dual Sync Command Deck**: Side-by-side split screen view showing Jodhpur Police on the left, Central Joint Graph in the middle, and Kota Police on the right.
- `/jodhpur` — **Jodhpur Police Terminal**: Scoped terminal for Commissionerate West.
- `/kota` — **Kota Police Terminal**: Scoped terminal for City Crime Branch.

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file:
```env
# Sarvam AI API (Bilingual Hindi/English & Saaras Audio Transcription)
SARVAM_API_KEY=your_sarvam_api_key_here
NEXT_PUBLIC_SARVAM_API_KEY=your_sarvam_api_key_here

# Supabase (Project: olcylyomrjhzqvjwjovf)
NEXT_PUBLIC_SUPABASE_URL=https://olcylyomrjhzqvjwjovf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```
