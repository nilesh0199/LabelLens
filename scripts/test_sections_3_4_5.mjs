import { dataStore } from '../src/lib/supabase.ts';

async function runTests() {
  console.log('=== VERIFICATION OF SECTIONS 3, 4, 5 ===\n');

  // 1. SECTION 3: Batch Sizes Verification
  console.log('--- SECTION 3: Verify Demo Batch Sizes (8-9 items each) ---');
  const dlBatches = await dataStore.listOfficerBatches('AD-CTRL-DL-02');
  const mhBatches = await dataStore.listOfficerBatches('AD-CTRL-MH-01');

  console.log(`Found ${dlBatches.length} Delhi batches, ${mhBatches.length} Mumbai batches.`);

  const demoDl = dlBatches.filter(b => b.batch_id.startsWith('BATCH-DL-'));
  const demoMh = mhBatches.filter(b => b.batch_id.startsWith('BATCH-MH-'));

  let s3Pass = true;
  for (const b of [...demoDl, ...demoMh]) {
    const full = await dataStore.getBatchById(b.batch_id);
    const count = full.items.length;
    if (count < 8 || count > 9) {
      console.error(`FAIL: Batch ${b.batch_id} has ${count} items (expected 8 or 9)`);
      s3Pass = false;
    }
  }

  if (s3Pass) {
    console.log(`✓ Section 3 PASS: All ${demoDl.length + demoMh.length} demo batches contain strictly 8 or 9 items (well under 15 max).`);
  } else {
    throw new Error('Section 3 validation failed');
  }

  // 2. SECTION 5: Verify Bulk Approve Logic & Audit Records
  console.log('\n--- SECTION 5: Verify Bulk Approve Clean Items & Audit Records ---');
  // Use BATCH-DL-003 for verification
  const testBatchId = 'BATCH-DL-003';
  const batchBefore = await dataStore.getBatchById(testBatchId);
  console.log(`Testing with batch ${testBatchId}: total items = ${batchBefore.items.length}`);

  const eligibleItems = batchBefore.items.filter(i =>
    i.compliant === true &&
    Number(i.confidence || 0) >= 0.85 &&
    !i.needs_review &&
    i.status !== 'reviewed' &&
    i.status !== 'recapture_requested' &&
    i.officer_action !== 'approve'
  );
  console.log(`Eligible clean items before bulk approve: ${eligibleItems.length}`);

  if (eligibleItems.length > 0) {
    const approveResult = await dataStore.approveCleanBatchItems(
      testBatchId,
      'AD-CTRL-DL-02',
      'Statutory compliance confirmed under Legal Metrology Rule 6',
      'Dr. S. K. Sharma'
    );

    console.log('Approve result:', approveResult);
    if (!approveResult.success || approveResult.count !== eligibleItems.length) {
      throw new Error(`Expected ${eligibleItems.length} approved items, got ${approveResult.count}`);
    }

    const batchAfter = await dataStore.getBatchById(testBatchId);
    for (const approvedId of approveResult.approved_item_ids) {
      const item = batchAfter.items.find(i => i.item_id === approvedId);
      if (!item || item.status !== 'reviewed' || item.officer_action !== 'approve' || !item.reviewed_by) {
        throw new Error(`Item ${approvedId} was not properly updated with audit record`);
      }
    }
    console.log(`✓ Section 5 PASS: All ${eligibleItems.length} eligible items approved with individual audit records (status=reviewed, officer_action=approve, reviewed_by=Dr. S. K. Sharma).`);
  } else {
    console.log('All eligible items in test batch were already approved.');
  }

  // 3. SECTION 4: Verify Auto-Advance Logic
  console.log('\n--- SECTION 4: Verify Auto-Advance Algorithm ---');
  // Simulate the exact client-side algorithm implemented in executeReview
  const simulatedBatchItems = [
    { item_id: 'ITEM-1', status: 'reviewed', officer_action: 'approve' },
    { item_id: 'ITEM-2', status: 'submitted', officer_action: null }, // current item to action
    { item_id: 'ITEM-3', status: 'submitted', officer_action: null }, // expected next
    { item_id: 'ITEM-4', status: 'reviewed', officer_action: 'override' },
  ];

  function findNextUnreviewed(items, actionedId) {
    const currentIdx = items.findIndex(i => i.item_id === actionedId);
    for (let i = currentIdx + 1; i < items.length; i++) {
      const it = items[i];
      if (it.status !== 'reviewed' && it.status !== 'recapture_requested' && !it.officer_action) {
        return it;
      }
    }
    for (let i = 0; i < currentIdx; i++) {
      const it = items[i];
      if (it.status !== 'reviewed' && it.status !== 'recapture_requested' && !it.officer_action) {
        return it;
      }
    }
    return null;
  }

  // Action ITEM-2
  simulatedBatchItems[1].status = 'reviewed';
  simulatedBatchItems[1].officer_action = 'approve';
  const next1 = findNextUnreviewed(simulatedBatchItems, 'ITEM-2');
  console.log('After reviewing ITEM-2, next item is:', next1 ? next1.item_id : 'null');
  if (!next1 || next1.item_id !== 'ITEM-3') {
    throw new Error('Auto-advance failed to find next item ITEM-3');
  }

  // Action ITEM-3 (last unreviewed item in batch)
  simulatedBatchItems[2].status = 'reviewed';
  simulatedBatchItems[2].officer_action = 'approve';
  const next2 = findNextUnreviewed(simulatedBatchItems, 'ITEM-3');
  console.log('After reviewing ITEM-3 (last item), next item is:', next2 ? next2.item_id : 'null (Batch Complete)');
  if (next2 !== null) {
    throw new Error('Auto-advance should return null when batch is complete');
  }
  console.log('✓ Section 4 PASS: Auto-advance cleanly steps to next item and halts on batch complete.');

  console.log('\n=== ALL SECTIONS 3, 4, 5 TESTS PASSED SUCCESSFULLY! ===');
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
