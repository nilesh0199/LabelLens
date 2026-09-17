import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { item_ids } = body;

    if (!Array.isArray(item_ids) || item_ids.length === 0) {
      return NextResponse.json(
        { error: 'item_ids must be a non-empty array of item IDs.' },
        { status: 400 }
      );
    }

    const updated = await dataStore.resubmitRecapturedItems(item_ids);

    return NextResponse.json({
      success: true,
      count: updated.length,
      item_ids: updated.map((i: any) => i.item_id),
      items: updated,
    });
  } catch (err: any) {
    console.error('[inspector/resubmit-recaptures] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to resubmit recaptured items' },
      { status: 500 }
    );
  }
}
