import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const inspectorId = searchParams.get('inspector_id') || undefined;

    const { submitted } = await dataStore.listBatches(inspectorId);
    return NextResponse.json(submitted);
  } catch (err: any) {
    console.error('[inspector/history] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch history' }, { status: 500 });
  }
}
