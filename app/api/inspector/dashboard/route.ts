import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const inspectorId = searchParams.get('inspector_id') || undefined;

    const { drafts, submitted } = await dataStore.listBatches(inspectorId);
    const activeBatch = await dataStore.getActiveBatch(inspectorId);

    const pendingReviewCount = submitted.filter(b => b.status === 'pending_review').length;
    const completedCount = submitted.filter(b => b.status === 'completed').length;

    return NextResponse.json({
      inspector_id: inspectorId || 'LMO-DL-04',
      active_batch: activeBatch,
      draft_batches_count: drafts.length,
      pending_review_count: pendingReviewCount,
      completed_count: completedCount,
      total_inspections: submitted.length,
    });
  } catch (err: any) {
    console.error('[inspector/dashboard] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch dashboard' }, { status: 500 });
  }
}
