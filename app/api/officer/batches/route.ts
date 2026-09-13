import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest) {
  try {
    const batches = await dataStore.listOfficerBatches();
    const enriched = await Promise.all(
      batches.map(async b => {
        const full = await dataStore.getBatchById(b.batch_id);
        const items = full?.items || [];
        return {
          ...b,
          item_count: items.length,
          compliant_count: items.filter(i => i.compliant).length,
          non_compliant_count: items.filter(i => !i.compliant).length,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (err: any) {
    console.error('[officer/batches] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to list officer batches' }, { status: 500 });
  }
}
