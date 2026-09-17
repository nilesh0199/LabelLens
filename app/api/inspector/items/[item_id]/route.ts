import { NextRequest, NextResponse } from 'next/server';
import { dataStore, validatePhotoProvenance } from '@/lib/supabase';
import { checkNeedsReview, evaluateItemCompliance } from '@/lib/compliance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: { item_id: string } }
) {
  try {
    const itemId = params.item_id;
    const body = await req.json();

    if (body.photos !== undefined) {
      if (!Array.isArray(body.photos)) {
        return NextResponse.json(
          { error: 'Invalid photo URL: must originate from specimen-photos storage' },
          { status: 400 }
        );
      }
      try {
        validatePhotoProvenance(body.photos);
      } catch (validationErr: any) {
        return NextResponse.json({ error: validationErr.message }, { status: 400 });
      }
    }

    let needs_review = body.needs_review;
    let review_reasons = body.review_reasons;
    let compliant = body.compliant;
    let declMissing = body.declarations_missing;
    const declValues = { ...(body.declaration_values || {}) };

    if (body.declarations_found !== undefined || body.declaration_values !== undefined || body.product_origin !== undefined || body.pack_type !== undefined) {
      const existing = await dataStore.getItemById(itemId);
      const mergedDeclVals = { ...(existing?.declaration_values || {}), ...declValues };
      const originInput = body.product_origin || mergedDeclVals.product_origin || existing?.product_origin;
      const packTypeInput = body.pack_type || mergedDeclVals.pack_type || existing?.pack_type;
      const declFound = body.declarations_found || existing?.declarations_found || [];

      const evalRes = evaluateItemCompliance(
        mergedDeclVals,
        declFound,
        originInput,
        body.product_name || existing?.product_name || '',
        1.0, // Human verified
        existing?.raw_ocr_text || '',
        packTypeInput
      );

      mergedDeclVals.product_origin = evalRes.productOrigin;
      mergedDeclVals.pack_type = evalRes.packType;
      body.pack_type = evalRes.packType;
      body.declaration_values = mergedDeclVals;
      body.declarations_found = evalRes.declarationsFound;
      body.declarations_missing = evalRes.declarationsMissing;
      needs_review = evalRes.needsReview;
      review_reasons = evalRes.reviewReasons;
      if (compliant === undefined) {
        compliant = evalRes.compliant;
      }
    }

    const updated = await dataStore.updateBatchItem(itemId, {
      ...body,
      compliant: compliant !== undefined ? Boolean(compliant) : undefined,
      needs_review: needs_review !== undefined ? Boolean(needs_review) : undefined,
      review_reasons: review_reasons || undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: `Item ${itemId} not found` }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    if (err.message?.includes('Invalid photo URL')) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error(`[items/${params.item_id}] PUT Error:`, err);
    return NextResponse.json({ error: err.message || 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { item_id: string } }
) {
  try {
    const itemId = params.item_id;
    const success = await dataStore.deleteBatchItem(itemId);
    if (!success) {
      return NextResponse.json({ error: `Item ${itemId} not found` }, { status: 404 });
    }
    return NextResponse.json({ success: true, item_id: itemId });
  } catch (err: any) {
    console.error(`[items/${params.item_id}] DELETE Error:`, err);
    return NextResponse.json({ error: err.message || 'Failed to delete item' }, { status: 500 });
  }
}
