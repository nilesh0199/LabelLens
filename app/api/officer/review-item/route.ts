import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      item_id,
      action, // 'approve' | 'override' | 'recapture' | 'correct'
      officer_remarks = '',
      new_verdict,
    } = body;

    if (!item_id || !action) {
      return NextResponse.json({ error: 'item_id and action are required.' }, { status: 400 });
    }

    const patch: any = {
      officer_action: action,
      officer_remarks,
    };

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

    const updated = await dataStore.updateBatchItem(item_id, patch);
    if (!updated) {
      return NextResponse.json({ error: `Item ${item_id} not found.` }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error('[officer/review-item] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to review item' }, { status: 500 });
  }
}
