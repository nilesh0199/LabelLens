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
      if (status === 'completed') {
        filteredBatches = filteredBatches.filter(b => b.status === 'completed');
      } else if (status === 'under_review') {
        filteredBatches = filteredBatches.filter(b => b.status === 'under_review');
      } else {
        // 'submitted', 'pending', 'active', 'all', etc. are active queue views
        filteredBatches = filteredBatches.filter(b => b.status === 'pending_review' || b.status === 'under_review');
      }
    } else {
      // For general queue view (no status, no inspector_id), default to active only (exclude completed).
      // If inspector_id is provided without status (e.g. inspector history panel), show all submitted & completed.
      if (!inspectorId) {
        filteredBatches = filteredBatches.filter(b => b.status === 'pending_review' || b.status === 'under_review');
      }
    }

    if (inspectorId) {
      // Support aliases: e.g. 'LMO-DL-04' also matches 'inspector' and 'INSP-DEL-042'
      const idUpper = inspectorId.toUpperCase();
      const isRajesh = idUpper === 'LMO-DL-04' || idUpper === 'INSPECTOR' || idUpper === 'INSP-DEL-042';
      filteredBatches = filteredBatches.filter(b => {
        if (isRajesh) {
          const bId = (b.inspector_id || '').toUpperCase();
          return bId === 'LMO-DL-04' || bId === 'INSPECTOR' || bId === 'INSP-DEL-042' || (b.inspector_name && b.inspector_name.includes('Rajesh'));
        }
        return b.inspector_id === inspectorId;
      });
    }

    return NextResponse.json(filteredBatches, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (err: any) {
    console.error('[officer/batches] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to list officer batches' }, { status: 500 });
  }
}
