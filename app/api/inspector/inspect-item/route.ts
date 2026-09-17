import { NextRequest, NextResponse } from 'next/server';
import { extractTextWithGoogleVision } from '@/lib/vision';
import { analyzeDeclarationsWithGemini, analyzeMultimodalItemWithGemini } from '@/lib/gemini';
import { checkNeedsReview, formatRule6Details, evaluateItemCompliance } from '@/lib/compliance';
import { uploadSpecimenPhoto } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const rawItemId = formData.get('item_id') as string | null;
    const itemId = (rawItemId && rawItemId.trim()) ? rawItemId.trim() : `ITEM-${Date.now()}`;

    // Collect all uploaded photos
    const photoAngles: { angle: string; file: File }[] = [];
    const front = (formData.get('photo_front') || formData.get('file')) as File | null;
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

    // Config flag: easily toggle between Gemini Multimodal (default) and Google Vision API
    const useVisionApi = process.env.USE_VISION_API === 'true';

    let photosMetadata: any[] = [];
    let combinedOcrText = '';
    let ocrByAngle: Record<string, string> = {};
    let analysis: any = null;

    if (useVisionApi) {
      // ----------------------------------------------------------------------
      // LEGACY PIPELINE: Google Cloud Vision API OCR -> Gemini text reasoning
      // ----------------------------------------------------------------------
      const perPhotoConfidences: number[] = [];
      const combinedLines: string[] = [];

      for (const { angle, file } of photoAngles) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${itemId}_${angle}.jpg`;

        const visionResult = await extractTextWithGoogleVision(buffer, file.type || 'image/jpeg');
        const photoUrl = await uploadSpecimenPhoto(buffer, filename, file.type || 'image/jpeg');

        ocrByAngle[angle] = visionResult.text;
        if (visionResult.lines.length > 0) combinedLines.push(...visionResult.lines);
        if (visionResult.confidence > 0) perPhotoConfidences.push(visionResult.confidence);

        photosMetadata.push({
          angle,
          filename,
          url: photoUrl,
          ocr_confidence: visionResult.confidence,
          lines_detected: visionResult.lines.length,
          blur_score: 100.0,
          is_blurry: false,
        });
      }

      combinedOcrText = combinedLines.join('\n') || '(No text detected in item photos)';
      const avgOcrConfidence = perPhotoConfidences.length > 0
        ? Math.round((perPhotoConfidences.reduce((a, b) => a + b, 0) / perPhotoConfidences.length) * 100) / 100
        : 0.85;

      analysis = await analyzeDeclarationsWithGemini(
        combinedOcrText,
        ocrByAngle,
        avgOcrConfidence
      );
    } else {
      // ----------------------------------------------------------------------
      // ACTIVE PIPELINE: Direct Gemini Multimodal Image Analysis
      // Sends image directly to Gemini for unified OCR extraction and Rule 6 evaluation
      // ----------------------------------------------------------------------
      const loadedPhotos: { angle: string; buffer: Buffer; mimeType: string; filename: string; url: string }[] = [];

      for (const { angle, file } of photoAngles) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${itemId}_${angle}.jpg`;
        const mimeType = file.type || 'image/jpeg';

        // Upload photo to Supabase Storage for audit provenance
        const photoUrl = await uploadSpecimenPhoto(buffer, filename, mimeType);

        loadedPhotos.push({
          angle,
          buffer,
          mimeType,
          filename,
          url: photoUrl,
        });
      }

      // Single round-trip multimodal analysis (raises error on real failure rather than silent swallow)
      const multimodalResult = await analyzeMultimodalItemWithGemini(loadedPhotos);

      analysis = multimodalResult;
      combinedOcrText = multimodalResult.raw_ocr_text;
      ocrByAngle = multimodalResult.ocr_by_angle || {};

      photosMetadata = loadedPhotos.map(p => ({
        angle: p.angle,
        filename: p.filename,
        url: p.url,
        ocr_confidence: multimodalResult.confidence,
        lines_detected: (multimodalResult.raw_ocr_text ? multimodalResult.raw_ocr_text.split('\n').filter(Boolean).length : 1),
        blur_score: 100.0,
        is_blurry: false,
      }));
    }

    const declVals = analysis.declaration_values || {};
    const netQuantity = declVals.net_quantity || '';
    const productOrigin = analysis.product_origin || declVals.product_origin || 'Domestic';
    const packType = analysis.pack_type || declVals.pack_type || 'Single-unit';
    declVals.product_origin = productOrigin;
    declVals.pack_type = packType;

    // Rule 6 Compliance & Needs Review Evaluation
    const evalRes = evaluateItemCompliance(
      declVals,
      analysis.declarations_found,
      productOrigin,
      analysis.product_name,
      analysis.confidence,
      combinedOcrText,
      packType
    );

    const rule6Details = formatRule6Details(evalRes.declarationsFound);

    return NextResponse.json({
      item_id: itemId,
      product_name: analysis.product_name,
      product_category: analysis.product_category,
      product_origin: productOrigin,
      pack_type: evalRes.packType,
      photos: photosMetadata,
      has_blurry_photo: false,
      compliant: evalRes.compliant,
      confidence: analysis.confidence,
      needs_review: evalRes.needsReview,
      review_reasons: evalRes.reviewReasons,
      declarations_found: evalRes.declarationsFound,
      declarations_missing: evalRes.declarationsMissing,
      rule6_details: rule6Details,
      raw_ocr_text: combinedOcrText,
      ocr_by_angle: ocrByAngle,
      declaration_values: declVals,
      cleaned_summary: analysis.cleaned_summary,
      rule9_observations: analysis.rule9_observations,
    });

  } catch (err: any) {
    console.error('[inspect-item] Pipeline Error:', err);
    // Non-silent error surfacing: send 500 status with exact error message
    return NextResponse.json(
      { error: err.message || 'Inspection analysis failed' },
      { status: 500 }
    );
  }
}
