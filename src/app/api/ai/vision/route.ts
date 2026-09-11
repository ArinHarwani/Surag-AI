import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

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
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const prompt = `You are a forensic image analyst. Analyze this image carefully.
Extract all visible text (including Hindi or English text), signs, dates, timestamps, locations, and places.
If there are vehicles, extract their make, model, color, and license plate numbers.
If there are people, describe them or extract their names if written.
Case Context: ${caseContext || 'General Investigation'}
Focus heavily on identifying details related to the case context.

Provide a detailed, objective forensic observation log of the image.`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.2-90b-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                },
              },
            ],
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq Vision failed:', groqRes.status, errText);
      return NextResponse.json({ error: `Vision API error: ${groqRes.status}`, details: errText }, { status: groqRes.status });
    }

    const groqData = await groqRes.json();
    const observationText = groqData.choices?.[0]?.message?.content || '';

    return NextResponse.json({
      success: true,
      observation: observationText,
    });
  } catch (error: any) {
    console.error('Vision API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process image' },
      { status: 500 }
    );
  }
}
