import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let parser: any = null;
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    const totalPages = textResult?.total || textResult?.pages?.length || 1;
    const rawText = textResult?.text || '';

    // Clean page break markers like "-- 1 of 3 --" if desired, or keep them clean
    const cleanText = rawText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return NextResponse.json({
      text: cleanText,
      total_pages: totalPages,
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
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (_) {}
    }
  }
}
