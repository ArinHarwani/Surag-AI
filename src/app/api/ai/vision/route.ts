import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_BACKUP_KEY = process.env.GEMINI_BACKUP_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const caseContext = (formData.get('caseContext') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    // Convert file to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';

    const prompt = `You are a forensic image analyst. Analyze this image carefully.
Extract all visible text (including Hindi or English text), signs, dates, timestamps, locations, and places.
If there are vehicles, extract their make, model, color, and license plate numbers.
If there are people, describe them or extract their names if written.
Case Context: ${caseContext || 'General Investigation'}
Focus heavily on identifying details related to the case context.

Provide a detailed, objective forensic observation log of the image.`;

    let responseText = '';
    let success = false;
    let lastError = '';

    const keys = [GEMINI_API_KEY, GEMINI_BACKUP_KEY].filter(Boolean);

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
                    mime_type: mimeType,
                    data: base64Image,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
          },
        }),
      });

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        success = true;
        break; // Stop trying keys if successful
      } else {
        const errText = await geminiRes.text();
        lastError = `Gemini Vision API error: ${geminiRes.status} ${errText}`;
        console.warn(`Gemini API key failed (Status: ${geminiRes.status}), trying next if available...`);
      }
    }

    if (!success) {
      console.error('All Gemini Vision attempts failed:', lastError);
      return NextResponse.json({ error: lastError }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      observation: responseText,
    });
  } catch (error: any) {
    console.error('Vision API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process image' },
      { status: 500 }
    );
  }
}
