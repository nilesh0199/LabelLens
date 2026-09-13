import { NextRequest, NextResponse } from 'next/server';
import { extractTextWithGoogleVision } from '@/lib/vision';
import { analyzeDeclarationsWithGemini } from '@/lib/gemini';
import { checkNeedsReview, formatRule6Details } from '@/lib/compliance';
import { uploadSpecimenPhoto } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const itemId = (formData.get('item_id') as string) || `ITEM-${Date.now()}`;

    // Collect all uploaded photos
    const photoAngles: { angle: string; file: File }[] = [];
    const front = formData.get('photo_front') as File | null;
    if (front && front.size > 0) photoAngles.push({ angle: 'front', file: front });

    const back = formData.get('photo_back') as File | null;
    if (back && back.size > 0) photoAngles.push({ angle: 'back', file: back });

    const side = formData.get('photo_side') as File | null;
    if (side && side.size > 0) photoAngles.push({ angle: 'side', file: side });

    // Extra angles
    for (const [key, val] of Array.from(formData.entries())) {
      if (key.startsWith('photo_extra_') && val instanceof File && val.size > 0) {
        photoAngles.push({ angle: key.replace('photo_', ''), file: val });
      }
    }

    if (photoAngles.length === 0) {
      return NextResponse.json(
        { error: 'No photos uploaded. Please provide at least photo_front.' },
        { status: 400 }
      );
    }

    const photosMetadata: any[] = [];
    const ocrByAngle: Record<string, string> = {};
    const perPhotoConfidences: number[] = [];
    const combinedLines: string[] = [];
    const imagePayloads: { mimeType: string; base64: string }[] = [];

    // Process each angle via Google Cloud Vision API
    for (const { angle, file } of photoAngles) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${itemId}_${angle}.jpg`;
        imagePayloads.push({
          mimeType: file.type || 'image/jpeg',
          base64: buffer.toString('base64'),
        });

        // 1. Google Cloud Vision OCR Text Extraction
        const visionResult = await extractTextWithGoogleVision(buffer, file.type || 'image/jpeg');

        // 2. Upload photo to Supabase Storage (or fallback data URI)
        const photoUrl = await uploadSpecimenPhoto(buffer, filename, file.type || 'image/jpeg');

        ocrByAngle[angle] = visionResult.text;
        if (visionResult.lines.length > 0) {
          combinedLines.push(...visionResult.lines);
        }
        if (visionResult.confidence > 0) {
          perPhotoConfidences.push(visionResult.confidence);
        }

        photosMetadata.push({
          angle,
          filename,
          url: photoUrl,
          ocr_confidence: visionResult.confidence,
          lines_detected: visionResult.lines.length,
          blur_score: 100.0,
          is_blurry: false,
        });
      } catch (err: any) {
        console.error(`[inspect-item] Error processing ${angle} photo:`, err);
      }
    }

    const combinedOcrText = combinedLines.join('\n') || '(No text detected in item photos)';
    const avgOcrConfidence = perPhotoConfidences.length > 0
      ? Math.round((perPhotoConfidences.reduce((a, b) => a + b, 0) / perPhotoConfidences.length) * 100) / 100
      : 0.85;

    // 3. Google Gemini Statutory Declarations & Rule 6 LLM Evaluation
    const analysis = await analyzeDeclarationsWithGemini(
      combinedOcrText,
      ocrByAngle,
      avgOcrConfidence,
      imagePayloads
    );

    const declVals = analysis.declaration_values || {};
    const netQuantity = declVals.net_quantity || '';

    // 4. Rule 6 Compliance & Needs Review Evaluation
    const reviewEvaluation = checkNeedsReview(
      analysis.confidence,
      analysis.declarations_found,
      analysis.declarations_missing,
      netQuantity,
      analysis.product_name,
      combinedOcrText
    );

    const rule6Details = formatRule6Details(analysis.declarations_found);

    return NextResponse.json({
      item_id: itemId,
      product_name: analysis.product_name,
      product_category: analysis.product_category,
      photos: photosMetadata,
      has_blurry_photo: false,
      compliant: analysis.compliant,
      confidence: analysis.confidence,
      needs_review: reviewEvaluation.needsReview,
      review_reasons: reviewEvaluation.reasons,
      declarations_found: analysis.declarations_found,
      declarations_missing: analysis.declarations_missing,
      rule6_details: rule6Details,
      raw_ocr_text: combinedOcrText,
      cleaned_summary: analysis.cleaned_summary,
      declaration_values: declVals,
      rule9_observations: analysis.rule9_observations || '',
    });

  } catch (err: any) {
    console.error('[inspect-item] Unhandled API error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal inspection pipeline error' },
      { status: 500 }
    );
  }
}
