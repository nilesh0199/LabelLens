import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const officerId = searchParams.get('officer_id') || 'AD-CTRL-DL-02';

    const inspectors = await dataStore.getOfficerInspectorsSummary(officerId);

    return NextResponse.json({
      success: true,
      officer_id: officerId,
      inspectors,
    });
  } catch (err: any) {
    console.error('[officer/inspectors] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to list officer inspectors' },
      { status: 500 }
    );
  }
}
