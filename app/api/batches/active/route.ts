import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const inspectorId = searchParams.get('inspector_id') || undefined;

    const activeBatch = await dataStore.getActiveBatch(inspectorId);
    if (!activeBatch) {
      return NextResponse.json({ message: 'No active draft batch session found' }, { status: 404 });
    }

    return NextResponse.json(activeBatch);
  } catch (err: any) {
    console.error('[batches/active] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch active batch' }, { status: 500 });
  }
}
