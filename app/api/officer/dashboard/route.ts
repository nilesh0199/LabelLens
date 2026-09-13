import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const batches = await dataStore.listOfficerBatches();
    const pendingBatches = batches.filter(b => b.status === 'pending_review' || b.status === 'under_review');
    const completedBatches = batches.filter(b => b.status === 'completed');

    let totalPendingItems = 0;
    let totalApprovedItems = 0;

    for (const b of batches) {
      const full = await dataStore.getBatchById(b.batch_id);
      const items = full?.items || [];
      if (b.status === 'completed') {
        totalApprovedItems += items.filter(i => i.officer_action === 'approve').length;
      } else {
        totalPendingItems += items.length;
      }
    }

    return NextResponse.json({
      pending_batches: pendingBatches.length,
      pending_items: totalPendingItems,
      approved_items: totalApprovedItems,
      completed_batches: completedBatches.length,
    });
  } catch (err: any) {
    console.error('[officer/dashboard] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch officer dashboard' }, { status: 500 });
  }
}
