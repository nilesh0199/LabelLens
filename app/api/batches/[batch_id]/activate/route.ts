import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  _req: NextRequest,
  { params }: { params: { batch_id: string } }
) {
  try {
    const batchId = params.batch_id;
    const batch = await dataStore.activateBatch(batchId);

    if (!batch) {
      return NextResponse.json({ error: `Batch '${batchId}' not found.` }, { status: 404 });
    }

    return NextResponse.json(batch);
  } catch (err: any) {
    console.error(`[batches/${params.batch_id}/activate] Error:`, err);
    return NextResponse.json({ error: err.message || 'Failed to activate batch' }, { status: 500 });
  }
}
