import { formatDateIST, formatTimeIST } from './formatDate';

/**
 * Formats a clean, readable evidence title derived directly from the uploaded filename.
 * Avoids hardcoded titles or unrelated assumptions.
 */
export function formatEvidenceTitleFromFile(
  fileName: string,
  type: 'image' | 'audio' | 'video' | 'text' | 'pdf'
): string {
  if (!fileName) return 'Forensic Evidence Exhibit';

  // Strip file extension
  const baseName = fileName.replace(/\.[^/.]+$/, '');

  // Replace underscores, hyphens, and dots with spaces
  let cleaned = baseName
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // If filename has a long random hash suffix (e.g. Gemini_Generated_Image_nj3xb0nj3xb0nj3x),
  // truncate excessively long tokens so the title stays neat.
  const words = cleaned.split(' ').map((word) => {
    if (word.length > 18) {
      return word.slice(0, 14) + '...';
    }
    // Capitalize first letter
    return word.charAt(0).toUpperCase() + word.slice(1);
  });

  const formattedName = words.join(' ');
  const lower = fileName.toLowerCase();

  if (type === 'pdf') {
    if (/fir|police|complaint|cognizance/i.test(lower)) {
      return `FIR Record: ${formattedName}`;
    }
    if (/autopsy|post-mortem|forensic|ballistic|lab|dna/i.test(lower)) {
      return `Forensic Lab Report: ${formattedName}`;
    }
    if (/statement|witness|interrogation|confession/i.test(lower)) {
      return `Witness Statement: ${formattedName}`;
    }
    if (/call|cdr|cell|tower|intercept/i.test(lower)) {
      return `Call Data Record (CDR): ${formattedName}`;
    }
    if (/charge|sheet|court|warrant|order/i.test(lower)) {
      return `Judicial Order / Chargesheet: ${formattedName}`;
    }
    return `Case Document: ${formattedName}`;
  }

  if (type === 'image') {
    if (/cctv|toll|camera|traffic|naka|checkpost/i.test(lower)) {
      return `CCTV Camera Frame: ${formattedName}`;
    }
    if (/market|bazaar|mandi|vendor|street|bazar/i.test(lower)) {
      return `Market Scene Photo: ${formattedName}`;
    }
    if (/suspect|person|face|portrait/i.test(lower)) {
      return `Subject Identification: ${formattedName}`;
    }
    if (/document|fir|memo|report|log/i.test(lower)) {
      return `Documentary Exhibit: ${formattedName}`;
    }
    return `Optical Evidence Exhibit: ${formattedName}`;
  }

  if (type === 'audio') {
    return `Audio Intercept: ${formattedName}`;
  }

  if (type === 'video') {
    return `Surveillance Footage: ${formattedName}`;
  }

  return formattedName || 'Forensic Dossier';
}

/**
 * Generates structured forensic telemetry for an uploaded PDF document,
 * including page count, document classification, and extracted text.
 */
export function generatePdfTelemetry(
  file: { name: string; size: number },
  totalPages: number,
  extractedText: string,
  agencyName?: string
): string {
  const sizeKb = (file.size / 1024).toFixed(1);
  const now = new Date();
  const dateStr = formatDateIST(now);
  const timeStr = formatTimeIST(now);

  const cleanText = extractedText.trim();

  return [
    `[DOCUMENTARY EVIDENCE EXHIBIT // PDF DOSSIER]`,
    `Source File: ${file.name}`,
    `Classification: Official Law Enforcement Case Document`,
    `Pages: ${totalPages} Page(s) | File Size: ${sizeKb} KB`,
    `Ingest Timestamp: ${dateStr} at ${timeStr}`,
    `Depositing Agency: ${agencyName ? agencyName.toUpperCase() : 'INVESTIGATION DIVISION'}`,
    ``,
    `--- EXTRACTED PDF TEXT RECORD ---`,
    cleanText || '[No embedded text detected in PDF document. Visual OCR notes can be entered below.]',
  ].join('\n');
}

/**
 * Generates truthful forensic exhibit telemetry for an uploaded image,
 * without fabricating fictitious vehicle plates or toll plaza details.
 */
export function generateOpticalTelemetry(
  file: { name: string; size: number; type?: string },
  agencyName?: string
): string {
  const sizeKb = (file.size / 1024).toFixed(1);
  const now = new Date();
  const dateStr = formatDateIST(now);
  const timeStr = formatTimeIST(now);

  const lower = file.name.toLowerCase();
  let sceneContext = 'Field Visual Surveillance Photo';

  if (/market|bazaar|mandi|vendor|street|bazar/i.test(lower)) {
    sceneContext = 'Public Market / Commercial Sector Surveillance';
  } else if (/cctv|toll|lane|naka|checkpost|traffic/i.test(lower)) {
    sceneContext = 'Highway / Checkpost Optical Camera Sighting';
  } else if (/suspect|person|face|portrait/i.test(lower)) {
    sceneContext = 'Subject Identification / Portrait Capture';
  } else if (/vehicle|car|auto|bike|truck/i.test(lower)) {
    sceneContext = 'Vehicle / Transport Optical Intercept';
  }

  return [
    `[OPTICAL FORENSIC EVIDENCE EXHIBIT]`,
    `Source File: ${file.name}`,
    `Classification: ${sceneContext}`,
    `File Size: ${sizeKb} KB | Format: ${(file.type || 'IMAGE').toUpperCase()}`,
    `Ingest Timestamp: ${dateStr} at ${timeStr}`,
    `Depositing Agency: ${agencyName ? agencyName.toUpperCase() : 'POLICE INVESTIGATION UNIT'}`,
    ``,
    `--- FIELD OFFICER OBSERVATIONS & SCENE TELEMETRY ---`,
    `Location / Scene: Field surveillance location under active investigation`,
    `Visual Analysis Notes: Photographic evidence attached for AI entity extraction and cross-case fusion.`,
    `Key Observations: [Enter notes on visible subjects, vehicles, market stalls, or location landmarks]`,
    `Status: Transmitted to evidence vault for entity correlation & timeline matching.`,
  ].join('\n');
}

/**
 * Clean Kota evidence disclosure template for inter-agency transmission
 * that does NOT assume a specific car or toll plaza.
 */
export function generateInitialKotaEvidenceDisclosure(): string {
  const now = new Date();
  const dateStr = formatDateIST(now);
  const timeStr = formatTimeIST(now);

  return [
    `[EVIDENCE TRANSMISSION RECORD // KOTA POLICE CID]`,
    `Jurisdiction: Kota Police District`,
    `Record Date: ${dateStr} ${timeStr}`,
    `Classification: Optical / Audio / Physical Media Evidence`,
    `Transfer Target: Jodhpur Police Headquarters (Lead Agency)`,
    ``,
    `--- FORENSIC TELEMETRY & OFFICER OBSERVATIONS ---`,
    `Drop an evidence file above to load optical preview or auto-transcribe audio.`,
    `Officer Notes: Evidence discovered under Kota jurisdiction relevant to FIR-007 cross-jurisdictional investigation. Forwarding to Jodhpur HQ for contradiction analysis.`,
  ].join('\n');
}
