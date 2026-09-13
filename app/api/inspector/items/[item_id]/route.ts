import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase';
import { checkNeedsReview } from '@/lib/compliance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function PUT(
  req: NextRequest,
  { params }: { params: { item_id: string } }
) {
  try {
    const itemId = params.item_id;
    const body = await req.json();

    let needs_review = body.needs_review;
    let review_reasons = body.review_reasons;

    if (needs_review === undefined && body.declarations_found) {
      const evalRes = checkNeedsReview(
        1.0, // Human verified
        body.declarations_found,
        body.declarations_missing || [],
        body.declaration_values?.net_quantity || '',
        body.product_name || '',
        ''
      );
      needs_review = evalRes.needsReview;
      review_reasons = evalRes.reasons;
    }

    const updated = await dataStore.updateBatchItem(itemId, {
      ...body,
      needs_review: needs_review !== undefined ? Boolean(needs_review) : undefined,
      review_reasons: review_reasons || undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: `Item ${itemId} not found` }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
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
