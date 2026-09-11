import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let worker: any = null;
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No image file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    worker = await createWorker('eng');
    const ret = await worker.recognize(buffer);
    const rawText = ret?.data?.text || '';
    const cleanText = rawText
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .join('\n');

    return NextResponse.json({
      text: cleanText,
      has_text: cleanText.length > 0,
      confidence: ret?.data?.confidence || 0,
    });
  } catch (err: any) {
    console.warn('OCR processing error (fallback to manual entry):', err?.message);
    return NextResponse.json({
      text: '',
      has_text: false,
      error: err?.message || 'OCR extraction unavailable',
    });
  } finally {
    if (worker) {
      try {
        await worker.terminate();
      } catch (_) {
        // ignore cleanup error
      }
    }
  }
}
