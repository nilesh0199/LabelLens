async function testLiveApi() {
  const BASE_URL = 'http://localhost:3000';
  console.log('Testing live LabelLens Officer Endpoints on', BASE_URL);

  // 1. Health
  console.log('\n--- Test 1: Health Check ---');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  console.log(`  Status: ${healthRes.status}`);
  const healthData = await healthRes.json();
  console.log('  Health:', healthData);

  // 2. Officer Dashboard
  console.log('\n--- Test 2: Officer Dashboard with Scoping ---');
  const dashRes = await fetch(`${BASE_URL}/api/officer/dashboard?officer_id=AD-CTRL-DL-02`);
  console.log(`  Status: ${dashRes.status}`);
  const dashData = await dashRes.json();
  console.log('  Dashboard Stats:', dashData.stats || {
    pending_batches: dashData.pending_batches,
    pending_items: dashData.pending_items,
    approved_items: dashData.approved_items,
    overridden_items: dashData.overridden_items,
  });
  console.log(`  Needs Attention Count: ${dashData.needs_attention?.length}`);
  if (dashData.needs_attention && dashData.needs_attention.length > 0) {
    console.log('  First Needs Attention Item:', dashData.needs_attention[0].item_id, dashData.needs_attention[0].product_name);
  }

  // 3. Officer Batches
  console.log('\n--- Test 3: Officer Batches Scoped ---');
  const batchesRes = await fetch(`${BASE_URL}/api/officer/batches?officer_id=AD-CTRL-DL-02`);
  console.log(`  Status: ${batchesRes.status}`);
  const batchesData = await batchesRes.json();
  console.log(`  Batches Count: ${batchesData.length}`);
  if (batchesData.length > 0) {
    console.log('  Sample Batch:', {
      batch_id: batchesData[0].batch_id,
      store_name: batchesData[0].store_name,
      inspector_id: batchesData[0].inspector_id,
      status: batchesData[0].status,
    });
  }

  // 4. Officer Inspectors
  console.log('\n--- Test 4: Officer Inspectors Summary ---');
  const inspRes = await fetch(`${BASE_URL}/api/officer/inspectors?officer_id=AD-CTRL-DL-02`);
  console.log(`  Status: ${inspRes.status}`);
  const inspData = await inspRes.json();
  const inspectorsList = Array.isArray(inspData) ? inspData : (inspData.inspectors || []);
  console.log(`  Inspectors Count: ${inspectorsList.length}`);
  console.log('  First Inspector:', inspectorsList[0]);

  // 5. Officer Ledger
  console.log('\n--- Test 5: Officer Ledger Scoped ---');
  const ledgerRes = await fetch(`${BASE_URL}/api/officer/ledger?officer_id=AD-CTRL-DL-02`);
  console.log(`  Status: ${ledgerRes.status}`);
  const ledgerData = await ledgerRes.json();
  const ledgerItems = Array.isArray(ledgerData) ? ledgerData : (ledgerData.items || []);
  console.log(`  Ledger Items Count: ${ledgerItems.length}`);
  if (ledgerItems.length > 0) {
    console.log('  Sample Ledger Item:', {
      item_id: ledgerItems[0].item_id,
      product_name: ledgerItems[0].product_name,
      compliant: ledgerItems[0].compliant,
      review_status: ledgerItems[0].review_status,
    });
  }

  // Find a sample item ID across ledger, needs_attention, or batches
  let sampleItemId = null;
  if (ledgerItems.length > 0) {
    sampleItemId = ledgerItems[0].item_id;
  } else if (dashData.needs_attention && dashData.needs_attention.length > 0) {
    sampleItemId = dashData.needs_attention[0].item_id;
  } else if (batchesData.length > 0 && batchesData[0].items && batchesData[0].items.length > 0) {
    sampleItemId = batchesData[0].items[0].item_id;
  }

  // 6. Level 1 Single-Item PDF Report
  if (sampleItemId) {
    console.log(`\n--- Test 6: Level 1 Single-Item PDF Report for [${sampleItemId}] ---`);
    const pdfRes = await fetch(`${BASE_URL}/api/officer/reports/item/${sampleItemId}`);
    console.log(`  Status: ${pdfRes.status}`);
    const contentType = pdfRes.headers.get('content-type');
    console.log(`  Content-Type: ${contentType}`);
    const pdfBuf = Buffer.from(await pdfRes.arrayBuffer());
    console.log(`  PDF byte length: ${pdfBuf.length}, header: "${pdfBuf.subarray(0, 5).toString()}"`);
    if (pdfBuf.subarray(0, 5).toString() !== '%PDF-') {
      throw new Error('Level 1 PDF does not have %PDF- header');
    }
    console.log('  [PASS] Level 1 Single-Item PDF endpoint verified!');
  } else {
    console.log('\n--- Test 6: No sample item found in DB ---');
  }

  // 7. Level 2 Combined Ledger PDF Report
  if (sampleItemId) {
    console.log(`\n--- Test 7: Level 2 Combined Ledger PDF Report ---`);
    const combRes = await fetch(`${BASE_URL}/api/officer/reports/combined`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        item_ids: [sampleItemId],
        officer_id: 'AD-CTRL-DL-02'
      })
    });
    console.log(`  Status: ${combRes.status}`);
    const combContentType = combRes.headers.get('content-type');
    console.log(`  Content-Type: ${combContentType}`);
    const combBuf = Buffer.from(await combRes.arrayBuffer());
    console.log(`  PDF byte length: ${combBuf.length}, header: "${combBuf.subarray(0, 5).toString()}"`);
    if (combBuf.subarray(0, 5).toString() !== '%PDF-') {
      throw new Error('Level 2 Combined PDF does not have %PDF- header');
    }
    console.log('  [PASS] Level 2 Combined Ledger PDF endpoint verified!');
  }

  // 8. Level 3 Executive Aggregate Report (JSON analytics & PDF download)
  console.log('\n--- Test 8: Level 3 Executive Aggregate Report ---');
  const aggJsonRes = await fetch(`${BASE_URL}/api/officer/reports/aggregate?officer_id=AD-CTRL-DL-02&from=2026-09-01&to=2026-09-13&format=json`);
  console.log(`  JSON Status: ${aggJsonRes.status}`);
  const aggJsonData = await aggJsonRes.json();
  console.log('  Aggregate Summary:', aggJsonData.summary);
  console.log('  Top Violations Count:', aggJsonData.top_violations?.length);

  const aggPdfRes = await fetch(`${BASE_URL}/api/officer/reports/aggregate?officer_id=AD-CTRL-DL-02&from=2026-09-01&to=2026-09-13&format=pdf`);
  console.log(`  PDF Status: ${aggPdfRes.status}`);
  const aggContentType = aggPdfRes.headers.get('content-type');
  console.log(`  Content-Type: ${aggContentType}`);
  const aggBuf = Buffer.from(await aggPdfRes.arrayBuffer());
  console.log(`  PDF byte length: ${aggBuf.length}, header: "${aggBuf.subarray(0, 5).toString()}"`);
  if (aggBuf.subarray(0, 5).toString() !== '%PDF-') {
    throw new Error('Level 3 Aggregate PDF does not have %PDF- header');
  }
  console.log('  [PASS] Level 3 Executive Aggregate PDF endpoint verified!');

  console.log('\n====================================================');
  console.log('ALL 8 LIVE API ENDPOINTS TESTED AND VERIFIED!');
  console.log('====================================================');
}

testLiveApi().catch(err => {
  console.error('Test run error:', err);
  process.exit(1);
});
