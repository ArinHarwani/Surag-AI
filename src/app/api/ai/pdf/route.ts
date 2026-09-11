import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_BACKUP_KEY = process.env.GEMINI_BACKUP_KEY || '';
const GEMINI_BACKUP_KEY_2 = process.env.GEMINI_BACKUP_KEY_2 || '';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Pdf = buffer.toString('base64');

    const prompt = `Extract all text, tables, and data from this PDF document.
If it is a scanned document, perform OCR and extract all visible text.
If it contains vehicle registrations, names, addresses, or IDs, explicitly list them clearly.
Format the output as clean, readable text.`;

    let responseText = '';
    let success = false;
    let lastError = '';

    const keys = [GEMINI_API_KEY, GEMINI_BACKUP_KEY, GEMINI_BACKUP_KEY_2].filter(Boolean);

    if (keys.length === 0) {
      return NextResponse.json({ error: 'No Gemini API keys configured' }, { status: 500 });
    }

    for (const key of keys) {
      const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: 'application/pdf',
                    data: base64Pdf,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
          },
        }),
      });

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        success = true;
        break;
      } else {
        const errText = await geminiRes.text();
        lastError = `Gemini PDF error: ${geminiRes.status} ${errText}`;
        console.warn(`Gemini API key failed (Status: ${geminiRes.status}), trying next if available...`);
      }
    }

    if (!success) {
      console.error('All Gemini PDF attempts failed:', lastError);
      return NextResponse.json({ error: lastError }, { status: 502 });
    }

    // Clean page break markers if desired
    const cleanText = responseText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return NextResponse.json({
      text: cleanText,
      total_pages: 1, // Gemini doesn't return page counts easily, default to 1
      has_text: cleanText.length > 0,
      file_name: file.name,
      file_size_kb: (file.size / 1024).toFixed(1),
    });
  } catch (err: any) {
    console.error('PDF parsing error:', err);
    return NextResponse.json(
      {
        error: err.message || 'Failed to extract text from PDF',
        text: '',
        has_text: false,
        total_pages: 0,
      },
      { status: 500 }
    );
  }
}
