import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase';
import { generateSingleItemPdf } from '@/lib/pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { item_id: string } }
) {
  try {
    const itemId = params.item_id;
    const { searchParams } = new URL(req.url);
    const officerId = searchParams.get('officer_id') || 'AD-CTRL-DL-02';

    const item = await dataStore.getBatchItem(itemId);
    if (!item) {
      return NextResponse.json({ error: `Item ${itemId} not found` }, { status: 404 });
    }

    const batch = item.batch_id ? await dataStore.getBatchById(item.batch_id) : null;

    const officer = {
      full_name: 'Dr. S. K. Sharma',
      badge_number: officerId,
      jurisdiction: 'Controller Office Delhi',
    };

    const pdfBytes = await generateSingleItemPdf(item, batch, officer);

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${itemId}_compliance_report.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('[reports/item] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate single item report' },
      { status: 500 }
    );
  }
}
