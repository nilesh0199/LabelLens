import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const officerId = searchParams.get('officer_id') || 'AD-CTRL-DL-02';
    const category = searchParams.get('category') || 'all';
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || '';

    const items = await dataStore.listOfficerLedgerItems(officerId, {
      category,
      status,
      search,
    });

    return NextResponse.json({
      success: true,
      count: items.length,
      officer_id: officerId,
      items,
    });
  } catch (err: any) {
    console.error('[officer/ledger] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to list ledger items' },
      { status: 500 }
    );
  }
}
