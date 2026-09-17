import { NextRequest, NextResponse } from 'next/server';
import { dataStore, validatePhotoProvenance } from '@/lib/supabase';
import { checkNeedsReview } from '@/lib/compliance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      batch_id,
      item_id = `ITEM-${Date.now()}`,
      product_name = 'Unidentified Commodity',
      product_category = 'General',
      photos = [],
      compliant = false,
      confidence = 0.85,
      declarations_found = [],
      declarations_missing = [],
      declaration_values = {},
      raw_ocr_text = '',
      cleaned_summary = '',
      status = 'draft',
    } = body;

    if (photos !== undefined) {
      if (!Array.isArray(photos)) {
        return NextResponse.json(
          { error: 'Invalid photo URL: must originate from specimen-photos storage' },
          { status: 400 }
        );
      }
      try {
        validatePhotoProvenance(photos);
      } catch (validationErr: any) {
        return NextResponse.json({ error: validationErr.message }, { status: 400 });
      }
    }

    let needs_review = body.needs_review;
    let review_reasons = body.review_reasons;

    if (needs_review === undefined || needs_review === null) {
      const evalRes = checkNeedsReview(
        confidence,
        declarations_found,
        declarations_missing,
        declaration_values.net_quantity || '',
        product_name,
        raw_ocr_text
      );
      needs_review = evalRes.needsReview;
      review_reasons = evalRes.reasons;
    }

    const item = await dataStore.addBatchItem({
      item_id,
      batch_id,
      product_name,
      product_category,
      photos,
      compliant: Boolean(compliant),
      confidence: Number(confidence),
      declarations_found,
      declarations_missing,
      declaration_values,
      raw_ocr_text,
      cleaned_summary,
      status,
      needs_review: Boolean(needs_review),
      review_reasons: review_reasons || [],
      created_at: new Date().toISOString(),
    });

    return NextResponse.json(item);
  } catch (err: any) {
    if (err.message?.includes('Invalid photo URL')) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error('[add-item] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to add item' }, { status: 500 });
  }
}
