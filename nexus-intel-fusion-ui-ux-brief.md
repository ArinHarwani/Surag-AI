# UI/UX Brief — Nexus Intel Fusion Platform

## Visual Identity
- **Theme**: Dark command-center / SOC aesthetic — cream/beige (#EDE9E0-ish) content panels on a warm off-white background, with a black left sidebar and top nav bar. High-contrast, classified-document feel.
- **Accent colors**: Yellow/amber (#F4C430-ish) as the primary highlight (active nav item, key CTAs, warning badges), red for critical/contradiction alerts, blue for secondary agency/data tags, muted gray-green for neutral status text.
- **Typography**: Monospace/technical font throughout (terminal aesthetic) — all-caps labels, letter-spaced headers, small badge-style metadata tags everywhere.
- **Tone**: Deliberately "classified ops dashboard" — TLP markings, custody chain language, crypto-lock icons, dual-agency sync indicators baked into the chrome itself.

## Layout Pattern (consistent across all pages)
- **Fixed left sidebar**: operation name/logo block → nav list (icon + label, active item filled yellow) → system health footer (latency/encryption status).
- **Top bar**: breadcrumb-style page context on left, agency sync/confidence pills in the center, current page name as a yellow pill on the right.
- **Main canvas**: scrolls independently, organized in card/panel blocks with consistent header bar (icon + title + status badge on the right).

## Page-by-Page UI Notes

### 1. Case Overview
- KPI stat cards in a row (ingested count, entities, AI confidence, contradictions, cryptolocks) — each with icon, big number, small trend/status subtext, color-coded left accent per severity.
- Two-column panel row below: ingestion drop-zone (dashed border, drag-and-drop icon, file-type pill buttons) paired with a live pipeline ticker (progress bars per active job).
- Bottom row: pending hypotheses + contradiction center teasers as compact expandable cards.

### 2. Evidence Vault
- Search bar with filter pills (modality tags) directly under a page header + 3 action buttons (ingest/export/sweep).
- Card-per-evidence-item layout: media preview (waveform for audio, thumbnail for video/image), inline transcript block with speaker tags, right-side "extracted entities" panel per item.
- Confidence/match percentages shown as small colored badges inline, not separate charts.

### 3. Contradiction Center
- Left: scrollable queue list, each item a compact card (severity dot, title, agencies involved, timestamp, status pill).
- Center/right: detail arbitration panel — split into per-agency evidence columns side-by-side (photo/still on one side, waveform/call data on the other), with a shared "impossibility" callout banner above them.
- Bottom stream: chronological audit log, monospace timestamps, resolved/dismissed tags.

### 4. Dossier & Provenance
- Document/report layout instead of dashboard cards — reads like a generated intelligence brief with numbered sections.
- Inline citation tags `[CIT-01]` styled as small clickable badges within paragraph text.
- Right sidebar: "Provenance Inspector" — clicking a citation loads exact source snippet + waveform/timestamp replay in this fixed panel rather than navigating away.
- Verified/confirmed items get a green "VERIFIED FACT" badge top-right of each section.

### 5. Timeline & Geospatial
- Full-width horizontal scrubber/map at top (dark satellite-map style), route line with colored waypoint markers.
- Filmstrip row of thumbnail frames directly beneath the map, synced to timeline position.
- Bottom: dense data table ("velocity/correlation matrix") with inline action buttons per row.
- Right rail: live audit feed, card-per-event, red highlight for critical/flagged rows.

## Recurring Components (build once, reuse everywhere)
- **Status/severity badge**: colored pill, all-caps, used identically for confidence %, verification state, and alert level.
- **Citation chip**: small bracketed tag, clickable, opens the Provenance Inspector panel.
- **Confidence bar/percentage**: inline next to entities/relationships, never a separate isolated chart.
- **Agency sync indicator**: persistent top-bar element showing dual-agency connection state — present on every page, not just overview.
- **Audit/activity feed card**: same visual treatment in Contradiction Center and Timeline pages (timestamp + title + short description + status tag).

## UX Principles Reflected in the Design
- Nothing is a bare number — every metric carries a status color and a one-line qualifier, reinforcing the "confidence, not certainty" positioning.
- Provenance is always one click away and rendered in-place (side panel), never a page navigation — keeps the "traceable to source" promise visible at all times.
- Contradictions and pending actions are visually loud (red, top-positioned) even on the overview page — the UI itself nudges the analyst toward required actions rather than burying them in a queue.
