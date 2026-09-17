import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase';
import { generateCombinedLedgerPdf } from '@/lib/pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { item_ids, officer_id = 'AD-CTRL-DL-02' } = body;

    if (!Array.isArray(item_ids) || item_ids.length === 0) {
      return NextResponse.json(
        { error: 'item_ids must be a non-empty array of item IDs' },
        { status: 400 }
      );
    }

    // Fetch live data from Supabase for all selected items
    const ledgerItems = await dataStore.listOfficerLedgerItems(officer_id);
    const itemMap = new Map(ledgerItems.map((i: any) => [i.item_id, i]));

    const selectedItems = [];
    for (const id of item_ids) {
      if (itemMap.has(id)) {
        selectedItems.push(itemMap.get(id));
      } else {
        const direct = await dataStore.getBatchItem(id);
        if (direct) selectedItems.push(direct);
      }
    }

    if (selectedItems.length === 0) {
      return NextResponse.json(
        { error: 'No matching items found for the provided IDs' },
        { status: 404 }
      );
    }

    const officer = {
      full_name: 'Dr. S. K. Sharma',
      badge_number: officer_id,
      jurisdiction: 'Controller Office Delhi',
    };

    const pdfBytes = await generateCombinedLedgerPdf(selectedItems, officer);

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="LabelLens_Combined_Ledger_${Date.now()}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('[reports/combined] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate combined ledger report' },
      { status: 500 }
    );
  }
}
