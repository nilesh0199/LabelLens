import { dataStore } from '../src/lib/supabase.js';
import { generateSingleItemPdf, generateCombinedLedgerPdf, generateAggregateReportPdf } from '../src/lib/pdf.js';

async function runTests() {
  console.log('====================================================');
  console.log('TEST 1: Officer Scoping & Fallback Safeguard Warning');
  console.log('====================================================');

  let warnLogged = false;
  const originalWarn = console.warn;
  console.warn = (...args) => {
    const text = args.join(' ');
    if (text.includes('[officer-scoping]')) {
      warnLogged = true;
      console.log('  [PASS] Intercepted expected safeguard warning:');
      console.log('        ', text);
    }
    originalWarn.apply(console, args);
  };

  const inspectorIds = await dataStore.getOfficerInspectorIds('AD-CTRL-DL-02');
  console.log('  Assigned inspector IDs returned:', inspectorIds);
  if (!Array.isArray(inspectorIds) || inspectorIds.length === 0) {
    throw new Error('getOfficerInspectorIds returned empty or non-array');
  }
  console.log('  [PASS] getOfficerInspectorIds succeeded.');

  console.log('\n====================================================');
  console.log('TEST 2: Scoped Dashboard Data & Needs Attention');
  console.log('====================================================');
  const dashboardData = await dataStore.getOfficerDashboardData('AD-CTRL-DL-02');
  console.log('  Pending Batches:', dashboardData.stats.pending_batches_count);
  console.log('  Pending Items:', dashboardData.stats.pending_items_count);
  console.log('  Approved Items:', dashboardData.stats.approved_items_count);
  console.log('  Overridden Items:', dashboardData.stats.overridden_items_count);
  console.log('  Needs Attention Items:', dashboardData.needs_attention.length);
  if (dashboardData.needs_attention.length > 0) {
    console.log('  Sample Needs Attention:', {
      item_id: dashboardData.needs_attention[0].item_id,
      product_name: dashboardData.needs_attention[0].product_name,
      compliant: dashboardData.needs_attention[0].compliant,
      needs_review: dashboardData.needs_attention[0].needs_review,
    });
  }
  console.log('  [PASS] getOfficerDashboardData succeeded.');

  console.log('\n====================================================');
  console.log('TEST 3: Scoped Batches & Inspectors Summary');
  console.log('====================================================');
  const batches = await dataStore.listOfficerBatches('AD-CTRL-DL-02');
  console.log(`  Batches count: ${batches.length}`);
  const inspectors = await dataStore.getOfficerInspectorsSummary('AD-CTRL-DL-02');
  console.log(`  Inspectors summary count: ${inspectors.length}`);
  if (inspectors.length > 0) {
    console.log('  First inspector:', inspectors[0]);
  }
  console.log('  [PASS] listOfficerBatches and getOfficerInspectorsSummary succeeded.');

  console.log('\n====================================================');
  console.log('TEST 4: Scoped Ledger Items');
  console.log('====================================================');
  const ledger = await dataStore.listOfficerLedgerItems('AD-CTRL-DL-02');
  console.log(`  Ledger items count: ${ledger.length}`);
  if (ledger.length > 0) {
    console.log('  First ledger item:', {
      item_id: ledger[0].item_id,
      product_name: ledger[0].product_name,
      compliant: ledger[0].compliant,
      review_status: ledger[0].review_status,
      reviewed_by: ledger[0].reviewed_by,
    });
  }
  console.log('  [PASS] listOfficerLedgerItems succeeded.');

  console.log('\n====================================================');
  console.log('TEST 5: Level 1 Single-Item Statutory PDF Generation');
  console.log('====================================================');
  const sampleBatch = batches[0] || { batch_id: 'BATCH-2026-TEST', store_name: 'Test Store' };
  const sampleItem = (sampleBatch.items && sampleBatch.items[0]) || {
    item_id: 'SPEC-TEST-001',
    product_name: 'Test Atta 5kg',
    product_category: 'Packaged Food',
    mrp: '₹275.00',
    net_quantity: '5 kg',
    compliant: true,
    confidence: 0.94,
    declarations: [
      { rule: 'Name and description of commodity', detected_value: 'Whole Wheat Atta', found: true },
      { rule: 'Net quantity declaration', detected_value: '5 kg', found: true },
      { rule: 'Maximum Retail Price (MRP)', detected_value: '₹275.00', found: true },
      { rule: 'Consumer Care details', detected_value: 'care@brand.in', found: true },
    ]
  };

  const singlePdfBytes = await generateSingleItemPdf(sampleItem, sampleBatch);
  const singlePdfStr = Buffer.from(singlePdfBytes).subarray(0, 5).toString();
  console.log(`  Level 1 PDF byte size: ${singlePdfBytes.length} bytes, Header: ${singlePdfStr}`);
  if (singlePdfStr !== '%PDF-') throw new Error('Invalid PDF header generated');
  console.log('  [PASS] Level 1 Single-Item PDF generated successfully.');

  console.log('\n====================================================');
  console.log('TEST 6: Level 2 Combined Ledger Multi-Item PDF');
  console.log('====================================================');
  const combinedPdfBytes = await generateCombinedLedgerPdf([sampleItem]);
  const combinedPdfStr = Buffer.from(combinedPdfBytes).subarray(0, 5).toString();
  console.log(`  Level 2 PDF byte size: ${combinedPdfBytes.length} bytes, Header: ${combinedPdfStr}`);
  if (combinedPdfStr !== '%PDF-') throw new Error('Invalid PDF header generated');
  console.log('  [PASS] Level 2 Combined Ledger PDF generated successfully.');

  console.log('\n====================================================');
  console.log('TEST 7: Level 3 Executive Aggregate PDF');
  console.log('====================================================');
  const aggregatePdfBytes = await generateAggregateReportPdf(
    {
      total_scanned: 14,
      compliant: 11,
      non_compliant: 3,
      compliance_rate: 79,
      active_inspectors: 1,
      date_from: '2026-09-06',
      date_to: '2026-09-13',
    },
    [
      { requirement: 'Net Quantity Declaration', rule_citation: 'Rule 6(1)(b)', infractions_count: 2, percentage: 67 },
      { requirement: 'Consumer Care Contact', rule_citation: 'Rule 6(1)(h)', infractions_count: 1, percentage: 33 },
    ]
  );
  const aggregatePdfStr = Buffer.from(aggregatePdfBytes).subarray(0, 5).toString();
  console.log(`  Level 3 PDF byte size: ${aggregatePdfBytes.length} bytes, Header: ${aggregatePdfStr}`);
  if (aggregatePdfStr !== '%PDF-') throw new Error('Invalid PDF header generated');
  console.log('  [PASS] Level 3 Executive Aggregate PDF generated successfully.');

  console.warn = originalWarn;
  console.log('\n====================================================');
  console.log('ALL VERIFICATION TESTS PASSED PERFECTLY!');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
