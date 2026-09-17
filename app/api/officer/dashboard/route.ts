import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const officerId = searchParams.get('officer_id') || 'AD-CTRL-DL-02';

    const dashboardData = await dataStore.getOfficerDashboardData(officerId);

    return NextResponse.json(dashboardData);
  } catch (err: any) {
    console.error('[officer/dashboard] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch officer dashboard' }, { status: 500 });
  }
}
