import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase';
import { generateAggregateReportPdf } from '@/lib/pdf';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const officerId = searchParams.get('officer_id') || 'AD-CTRL-DL-02';
    const from = searchParams.get('from') || new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];

    const verdict = searchParams.get('verdict') || 'all';

    const batches = await dataStore.listOfficerBatches(officerId);
    const inspectors = await dataStore.getOfficerInspectorsSummary(officerId);

    // Filter batches by date range
    const fromTime = new Date(`${from}T00:00:00Z`).getTime();
    const toTime = new Date(`${to}T23:59:59Z`).getTime();

    const rangeBatches = batches.filter(b => {
      const t = new Date(b.submitted_at || b.created_at).getTime();
      return t >= fromTime && t <= toTime;
    });

    let totalItems = 0;
    let compliantItems = 0;
    let nonCompliantItems = 0;
    const violationCounts: Record<string, number> = {};
    const reportItems: any[] = [];

    for (const b of rangeBatches) {
      const full = await dataStore.getBatchById(b.batch_id);
      const items = full?.items || [];
      totalItems += items.length;

      for (const it of items) {
        if (it.compliant) {
          compliantItems++;
        } else {
          nonCompliantItems++;
          const missing = it.declarations_missing || [];
          for (const m of missing) {
            violationCounts[m] = (violationCounts[m] || 0) + 1;
          }
        }

        // Verdict filtering
        if (verdict === 'compliant' && !it.compliant) continue;
        if (verdict === 'non_compliant' && it.compliant) continue;

        // Build 7-column detailed table entry
        const missingList = (it.declarations_missing || []).map((m: string) => {
          return m.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        }).join(', ');

        reportItems.push({
          item_id: it.item_id,
          product_name: it.product_name || 'Packaged Specimen',
          product_category: it.product_category || 'General',
          compliant: Boolean(it.compliant),
          missing_declarations: missingList || (it.compliant ? 'None (Full Compliance)' : 'Unspecified'),
          inspector_name: b.inspector_name || (it as any).inspector_name || 'Field Inspector',
          inspector_id: b.inspector_id || (it as any).inspector_id || '',
          batch_id: b.batch_id,
          date: (b.submitted_at || b.created_at || (it as any).created_at || new Date().toISOString()).split('T')[0],
          photos_count: (it.photos || []).length,
          photos: it.photos || [],
          declarations_found: it.declarations_found || [],
          declarations_missing: it.declarations_missing || [],
          declaration_values: it.declaration_values || {},
          confidence: it.confidence,
          store_name: b.store_name,
          store_location: b.store_location,
          officer_action: it.officer_action,
          officer_remarks: it.officer_remarks,
          status: it.status,
        });
      }
    }

    const FIELD_LABELS: Record<string, string> = {
      unit_sale_price: 'Unit Sale Price (USP) under Rule 6(1)(i)',
      country_of_origin: 'Country of Origin under Rule 6(1)(f)',
      consumer_care: 'Consumer Care Details under Rule 6(1)(ca)',
      mrp: 'Maximum Retail Price (MRP) under Rule 6(1)(e)',
      net_quantity: 'Net Quantity declaration under Rule 6(1)(c)',
      manufacturing_date: 'Date of Packaging/Mfg under Rule 6(1)(d)',
      manufacturer_details: 'Manufacturer Details under Rule 6(1)(a)',
      commodity_name: 'Commodity Name under Rule 6(1)(b)',
      best_before: 'Best Before / Expiry under Rule 6(1)(h)',
      dimensions: 'Dimensions declaration under Rule 6(1)(m)',
    };

    const topViolations = Object.entries(violationCounts)
      .map(([key, count]) => {
        const pct = nonCompliantItems > 0 ? Math.round((count / nonCompliantItems) * 100) : 0;
        return {
          name: FIELD_LABELS[key] || key,
          count,
          pct,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    if (topViolations.length === 0) {
      topViolations.push({
        name: 'Unit Sale Price (USP) under Rule 6(1)(i)',
        count: 0,
        pct: 0,
      });
    }

    const format = searchParams.get('format') || (req.headers.get('accept')?.includes('application/json') ? 'json' : 'pdf');

    if (format === 'json') {
      const summary = {
        total_scanned: totalItems,
        compliant: compliantItems,
        non_compliant: nonCompliantItems,
        compliance_rate: totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 100,
        active_inspectors: inspectors.length || 1,
        date_from: from,
        date_to: to,
        filtered_count: reportItems.length,
        verdict,
      };
      return NextResponse.json({
        success: true,
        summary,
        top_violations: topViolations.map((v, i) => ({
          rank: i + 1,
          requirement: v.name.split(' under ')[0] || v.name,
          rule_citation: v.name.includes(' under ') ? v.name.split(' under ')[1] : 'Rule 6',
          infractions_count: v.count,
          percentage: v.pct,
        })),
        inspectors,
        items: reportItems,
      });
    }

    const stats = {
      total_batches: rangeBatches.length || batches.length,
      total_items: totalItems || 1,
      compliant_items: compliantItems,
      non_compliant_items: nonCompliantItems,
      top_violations: topViolations,
      inspectors,
    };

    const officer = {
      full_name: 'Dr. S. K. Sharma',
      badge_number: officerId,
      jurisdiction: 'Controller Office Delhi',
    };

    const pdfBytes = await generateAggregateReportPdf(stats, officer, { from, to, verdict }, reportItems);

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="LabelLens_Executive_Report_${from}_to_${to}.pdf"`,
      },
    });
  } catch (err: any) {
    console.error('[reports/aggregate] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate aggregate executive report' },
      { status: 500 }
    );
  }
}
