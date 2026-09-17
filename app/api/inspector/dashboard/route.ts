import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * INSPECTOR DASHBOARD API CONTRACT:
 * GET /api/inspector/dashboard?inspector_id=<id>
 * 
 * Response Shape:
 * {
 *   inspector_id: string,
 *   active_batch: BatchRecord | null,
 *   stats: {
 *     active_batch_items: number,       // items count in current active draft batch
 *     pending_batches_count: number,    // count of submitted batches pending officer review
 *     completed_batches_count: number,  // count of completed batches
 *     draft_batches_count: number,      // count of unsubmitted draft batches
 *     total_inspections: number,        // total submitted inspections count
 *     recapture_count: number           // total items flagged for recapture
 *   },
 *   // Flat fields for backwards-compatibility with flat consumers:
 *   draft_batches_count: number,
 *   pending_review_count: number,
 *   completed_count: number,
 *   total_inspections: number,
 *   recapture_items: Array<BatchItem & { store_name: string, store_location: string, batch_status: string }>
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const inspectorId = searchParams.get('inspector_id') || undefined;

    const { drafts, submitted } = await dataStore.listBatches(inspectorId);
    const activeBatch = await dataStore.getActiveBatch(inspectorId);
    const recaptureItems = await dataStore.getRecaptureItems(inspectorId);

    const pendingReviewCount = submitted.filter(b => b.status === 'pending_review').length;
    const completedCount = submitted.filter(b => b.status === 'completed').length;
    const activeItemsCount = (activeBatch && Array.isArray(activeBatch.items)) ? activeBatch.items.length : 0;

    const stats = {
      active_batch_items: activeItemsCount,
      pending_batches_count: pendingReviewCount,
      completed_batches_count: completedCount,
      draft_batches_count: drafts.length,
      total_inspections: submitted.length,
      recapture_count: recaptureItems.length,
    };

    const reviewingOfficer = await dataStore.getInspectorSupervisingOfficer(inspectorId);

    return NextResponse.json({
      inspector_id: inspectorId || 'LMO-DL-04',
      active_batch: activeBatch,
      stats,
      reviewing_officer: reviewingOfficer,
      // Flat fields for compatibility:
      draft_batches_count: drafts.length,
      pending_review_count: pendingReviewCount,
      completed_count: completedCount,
      total_inspections: submitted.length,
      recapture_items: recaptureItems,
    });
  } catch (err: any) {
    console.error('[inspector/dashboard] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch dashboard' }, { status: 500 });
  }
}

