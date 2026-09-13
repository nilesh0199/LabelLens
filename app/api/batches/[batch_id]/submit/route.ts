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
    const batch = await dataStore.submitBatch(batchId);

    if (!batch) {
      return NextResponse.json({ error: `Batch '${batchId}' not found.` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      batch_id: batchId,
      status: 'pending_review',
      submitted_at: batch.submitted_at,
      message: `Batch ${batchId} submitted to Reviewing Officer successfully.`,
    });
  } catch (err: any) {
    console.error(`[batches/${params.batch_id}/submit] Error:`, err);
    return NextResponse.json({ error: err.message || 'Failed to submit batch' }, { status: 500 });
  }
}
