import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: { batch_id: string } }
) {
  try {
    const batchId = params.batch_id;
    const batch = await dataStore.getBatchById(batchId);

    if (!batch) {
      return NextResponse.json({ error: `Batch '${batchId}' not found.` }, { status: 404 });
    }

    return NextResponse.json(batch);
  } catch (err: any) {
    console.error(`[batches/${params.batch_id}] Error:`, err);
    return NextResponse.json({ error: err.message || 'Failed to fetch batch' }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { batch_id: string } }
) {
  try {
    const batchId = params.batch_id;
    const result = await dataStore.deleteBatch(batchId);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error(`[batches/${params.batch_id} DELETE] Error:`, err);
    const status = err.message?.includes('not found') ? 404 : 400;
    return NextResponse.json({ error: err.message || 'Failed to delete batch' }, { status });
  }
}

