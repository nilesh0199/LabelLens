import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const inspectorId = searchParams.get('inspector_id') || undefined;

    const result = await dataStore.listBatches(inspectorId);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[batches GET] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to list batches' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const batchId = body.batch_id || `BATCH-${Date.now()}`;
    const inspectorId = body.inspector_id || 'LMO-DL-04';
    const inspectorName = body.inspector_name || 'Rajesh Kumar';
    const jurisdiction = body.jurisdiction || 'Central District, Circle 2';
    const storeName = body.store_name || 'Retail Store';
    const storeLocation = body.store_location || 'Local Market';

    const batch = await dataStore.createBatch({
      batch_id: batchId,
      inspector_id: inspectorId,
      inspector_name: inspectorName,
      jurisdiction,
      store_name: storeName,
      store_location: storeLocation,
    });

    return NextResponse.json(batch);
  } catch (err: any) {
    console.error('[batches POST] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to create batch' }, { status: 500 });
  }
}
