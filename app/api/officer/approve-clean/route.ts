import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { batch_id, officer_id = 'AD-CTRL-DL-02', remarks, reviewer_name } = body;

    if (!batch_id) {
      return NextResponse.json(
        { error: 'batch_id is required' },
        { status: 400 }
      );
    }

    const result = await dataStore.approveCleanBatchItems(batch_id, officer_id, remarks, reviewer_name);

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[officer/approve-clean] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to approve clean items' },
      { status: 500 }
    );
  }
}
