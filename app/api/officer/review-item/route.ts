import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase';
import { evaluateItemCompliance } from '@/lib/compliance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      item_id,
      action, // 'save_edits' | 'approve' | 'override' | 'recapture' | 'correct'
      officer_remarks: rawRemarks,
      remarks,
      reviewer_name,
      new_verdict,
      declaration_values,
      declarations_found,
      declarations_missing,
      product_origin,
      pack_type,
    } = body;

    const finalRemarks = rawRemarks || remarks || '';

    if (!item_id || !action) {
      return NextResponse.json({ error: 'item_id and action are required.' }, { status: 400 });
    }

    const patch: any = {};

    if (declaration_values !== undefined) {
      patch.declaration_values = declaration_values;
    }
    if (declarations_found !== undefined) {
      patch.declarations_found = declarations_found;
    }
    if (declarations_missing !== undefined) {
      patch.declarations_missing = declarations_missing;
    }

    if (action === 'save_edits') {
      if (finalRemarks) patch.officer_remarks = finalRemarks;
      if (reviewer_name) patch.reviewed_by = reviewer_name;

      const existingItem = await dataStore.getItemById(item_id);
      const declVals = { ...(existingItem?.declaration_values || {}), ...(declaration_values || {}) };
      const originInput = product_origin || declVals.product_origin || existingItem?.product_origin;
      const packTypeInput = pack_type || declVals.pack_type || existingItem?.pack_type;
      const declFound = declarations_found || existingItem?.declarations_found || [];

      const evalRes = evaluateItemCompliance(
        declVals,
        declFound,
        originInput,
        existingItem?.product_name || '',
        Number(existingItem?.confidence || 0.95),
        existingItem?.raw_ocr_text || '',
        packTypeInput
      );

      declVals.product_origin = evalRes.productOrigin;
      declVals.pack_type = evalRes.packType;
      patch.declaration_values = declVals;
      patch.declarations_found = evalRes.declarationsFound;
      patch.declarations_missing = evalRes.declarationsMissing;
      patch.needs_review = evalRes.needsReview;
      patch.review_reasons = evalRes.reviewReasons;

      if (new_verdict !== undefined && new_verdict !== null) {
        patch.compliant = Boolean(new_verdict);
      } else {
        patch.compliant = evalRes.compliant;
      }
    } else {
      // Verdict action
      patch.officer_action = action;
      patch.officer_remarks = finalRemarks;
      patch.reviewed_by = reviewer_name || 'Senior Reviewing Officer';

      if (new_verdict !== undefined && new_verdict !== null) {
        patch.compliant = Boolean(new_verdict);
      } else if (action === 'approve') {
        // Retains existing verdict
      }

      if (action === 'recapture') {
        patch.status = 'recapture_requested';
      } else {
        patch.status = 'reviewed';
      }
    }

    const updated = await dataStore.updateBatchItem(item_id, patch);
    if (!updated) {
      return NextResponse.json({ error: `Item ${item_id} not found.` }, { status: 404 });
    }

    // Check if batch is completed after verdict action
    if (action !== 'save_edits' && updated.batch_id) {
      try {
        const batch = await dataStore.getBatchById(updated.batch_id);
        if (batch && batch.items && batch.items.length > 0) {
          const allReviewed = batch.items.every((it: any) => 
            it.item_id === item_id 
              ? (patch.status === 'reviewed' || patch.status === 'recapture_requested')
              : (it.status === 'reviewed' || it.status === 'recapture_requested' || (!!it.officer_action && it.officer_action !== 'recapture_resolved'))
          );
          if (allReviewed && batch.status !== 'completed') {
            await dataStore.updateBatchStatus(updated.batch_id, 'completed');
          }
        }
      } catch (e) {
        console.warn('[review-item] Failed to check/update batch completion status:', e);
      }
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('[officer/review-item] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to review item' }, { status: 500 });
  }
}
