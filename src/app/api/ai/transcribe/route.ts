import { NextRequest, NextResponse } from 'next/server';

const SARVAM_API_KEY = process.env.SARVAM_API_KEY || '';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const languageCode = (formData.get('language_code') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Prepare multipart form data for Sarvam Speech-to-Text
    // Sarvam STT requires specific audio mime types. Normalize video/mpeg and non-audio headers:
    let normalizedMime = file.type;
    const lowerName = (file.name || '').toLowerCase();

    if (!normalizedMime || normalizedMime.startsWith('video/') || normalizedMime === 'video/mpeg') {
      if (lowerName.endsWith('.mp3') || lowerName.endsWith('.mpeg') || lowerName.endsWith('.mpga')) {
        normalizedMime = 'audio/mpeg';
      } else if (lowerName.endsWith('.wav')) {
        normalizedMime = 'audio/wav';
      } else if (lowerName.endsWith('.m4a') || lowerName.endsWith('.mp4') || lowerName.endsWith('.aac')) {
        normalizedMime = 'audio/mp4';
      } else if (lowerName.endsWith('.ogg') || lowerName.endsWith('.opus')) {
        normalizedMime = 'audio/ogg';
      } else {
        normalizedMime = 'audio/mpeg';
      }
    }

    const fileBuffer = await file.arrayBuffer();
    const normalizedBlob = new Blob([fileBuffer], { type: normalizedMime });
    let normalizedFileName = file.name || 'audio.mp3';
    if (normalizedFileName.toLowerCase().endsWith('.mpeg')) {
      normalizedFileName = normalizedFileName.replace(/\.mpeg$/i, '.mp3');
    }

    const sarvamFormData = new FormData();
    sarvamFormData.append('file', normalizedBlob, normalizedFileName);
    sarvamFormData.append('model', 'saaras:v3');
    if (languageCode) {
      sarvamFormData.append('language_code', languageCode);
    }

    const sttResponse = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
      },
      body: sarvamFormData,
    });

    if (!sttResponse.ok) {
      const errText = await sttResponse.text();
      console.error('Sarvam STT failed:', sttResponse.status, errText);
      return NextResponse.json(
        { error: `Sarvam STT error: ${sttResponse.status}`, details: errText },
        { status: sttResponse.status }
      );
    }

    const sttData = await sttResponse.json();
    const transcript = sttData.transcript || '';
    const detectedLanguage = sttData.language_code || 'unknown';

    let englishTranslation = '';
    // If the transcript is in Hindi / Devanagari script, translate to English using Sarvam Mayura
    const hasHindi = /[\u0900-\u097F]/.test(transcript) || detectedLanguage.startsWith('hi');
    if (hasHindi && transcript.trim().length > 0) {
      try {
        const transRes = await fetch('https://api.sarvam.ai/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': SARVAM_API_KEY,
          },
          body: JSON.stringify({
            input: transcript,
            source_language_code: 'hi-IN',
            target_language_code: 'en-IN',
            model: 'mayura:v1',
          }),
        });
        if (transRes.ok) {
          const transData = await transRes.json();
          englishTranslation = transData.translated_text || '';
        }
      } catch (transErr) {
        console.warn('Sarvam Translation error:', transErr);
      }
    }

    return NextResponse.json({
      success: true,
      transcript,
      language_code: detectedLanguage,
      english_translation: englishTranslation,
    });
  } catch (error: any) {
    console.error('Transcription API error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process audio' },
      { status: 500 }
    );
  }
}
