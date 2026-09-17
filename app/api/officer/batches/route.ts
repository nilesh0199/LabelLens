import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const officerId = searchParams.get('officer_id') || 'AD-CTRL-DL-02';
    const status = searchParams.get('status');
    const inspectorId = searchParams.get('inspector_id');

    const batches = await dataStore.listOfficerBatches(officerId);

    // Auto-reconcile batch completion status and enrich with item counts
    const reconciledBatches = await Promise.all(
      batches.map(async b => {
        const record = b as any;
        const items = record.items || [];
        const compliantCount = record.compliant_count ?? items.filter((i: any) => i.compliant).length;

        let currentStatus = b.status;
        if (items.length > 0 && (currentStatus === 'pending_review' || currentStatus === 'under_review')) {
          const allActioned = items.every((i: any) =>
            i.status === 'reviewed' ||
            i.status === 'recapture_requested' ||
            (i.officer_action && i.officer_action !== 'recapture_resolved')
          );
          if (allActioned) {
            try {
              await dataStore.updateBatchStatus(b.batch_id, 'completed');
              currentStatus = 'completed';
            } catch (e) {
              console.warn(`[officer/batches] Could not auto-complete batch ${b.batch_id}:`, e);
            }
          }
        }

        return {
          ...b,
          status: currentStatus,
          item_count: record.item_count ?? items.length,
          compliant_count: compliantCount,
          non_compliant_count: (record.item_count ?? items.length) - compliantCount,
        };
      })
    );

    let filteredBatches = reconciledBatches;
    if (status) {
      if (status === 'submitted' || status === 'pending' || status === 'active' || status === 'all') {
        filteredBatches = filteredBatches.filter(b => b.status === 'pending_review' || b.status === 'under_review');
      } else {
        filteredBatches = filteredBatches.filter(b => b.status === status);
      }
    }
    if (inspectorId) {
      filteredBatches = filteredBatches.filter(b => b.inspector_id === inspectorId);
    }

    return NextResponse.json(filteredBatches);
  } catch (err: any) {
    console.error('[officer/batches] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to list officer batches' }, { status: 500 });
  }
}
