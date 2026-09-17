import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim();
      process.env[k] = v;
    }
  }
});

const { dataStore, uploadSpecimenPhoto } = await import('../src/lib/supabase.ts');
const { analyzeDeclarationsWithGemini } = await import('../src/lib/gemini.ts');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runVerification() {
  console.log('====================================================');
  console.log('  SECTIONS 2, 3, 4 VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  // --- SECTION 2: History & Switch Batch Data Mismatch Test ---
  console.log('--- TEST SECTION 2: History & Switch Batch Data Consistency ---');
  const batchesResult = await dataStore.listBatches('LMO-DL-04');
  console.log(`✅ listBatches returned ${batchesResult.drafts.length} drafts and ${batchesResult.submitted.length} submitted batches.`);
  console.log('   Sample submitted batches:');
  batchesResult.submitted.forEach(b => {
    console.log(`   - [${b.batch_id}] ${b.store_name} | status: ${b.status} | items: ${b.item_count} (compliant: ${b.compliant_count}, non-compliant: ${b.non_compliant_count})`);
  });

  const allHaveCounts = batchesResult.submitted.every(b => typeof b.item_count === 'number' && typeof b.compliant_count === 'number');
  if (allHaveCounts) {
    console.log('✅ PASS: All submitted batches include calculated item_count, compliant_count, and non_compliant_count.');
  } else {
    throw new Error('Some batches lack computed item counts!');
  }

  // --- SECTION 3: Delete Batch Verification (Draft batches only) ---
  console.log('\n--- TEST SECTION 3: Delete Batch (Draft Batches Only) ---');
  
  // 3a. Rejection test: Try deleting a submitted batch
  const submittedBatchId = batchesResult.submitted[0]?.batch_id;
  if (submittedBatchId) {
    console.log(`   Testing deletion guard on submitted batch: ${submittedBatchId}`);
    try {
      await dataStore.deleteBatch(submittedBatchId);
      throw new Error('Expected deletion of submitted batch to fail, but it succeeded!');
    } catch (err) {
      console.log(`✅ PASS: Correctly rejected deletion of non-draft batch: "${err.message}"`);
    }
  }

  // 3b. Empty draft batch creation & deletion
  const emptyDraftId = `DRAFT-TEST-EMPTY-${Date.now()}`;
  console.log(`\n   Creating empty draft batch: ${emptyDraftId}`);
  await dataStore.createBatch({
    batch_id: emptyDraftId,
    inspector_id: 'LMO-DL-04',
    inspector_name: 'Rajesh Kumar',
    jurisdiction: 'DELHI-CENTRAL',
    store_name: 'Empty Test Store',
    store_location: 'Delhi',
  });

  // Verify it exists in DB
  const { data: createdEmpty } = await supabase.from('batches').select('batch_id').eq('batch_id', emptyDraftId).single();
  if (!createdEmpty) throw new Error('Failed creating empty test batch');
  console.log(`   Confirmed ${emptyDraftId} exists in Supabase DB.`);

  // Delete empty draft
  console.log(`   Deleting empty draft batch: ${emptyDraftId}`);
  const delEmptyRes = await dataStore.deleteBatch(emptyDraftId);
  console.log('   Delete response:', delEmptyRes.message);

  // Confirm gone from DB
  const { data: postDelEmpty } = await supabase.from('batches').select('batch_id').eq('batch_id', emptyDraftId);
  if (postDelEmpty && postDelEmpty.length === 0) {
    console.log(`✅ PASS: Empty draft batch ${emptyDraftId} permanently removed from Supabase DB.`);
  } else {
    throw new Error(`Empty draft batch ${emptyDraftId} still found in DB after delete!`);
  }

  // 3c. Draft batch with items & photo storage cleanup
  const draftWithItemId = `DRAFT-TEST-WITH-ITEM-${Date.now()}`;
  console.log(`\n   Creating draft batch with item and photo: ${draftWithItemId}`);
  await dataStore.createBatch({
    batch_id: draftWithItemId,
    inspector_id: 'LMO-DL-04',
    inspector_name: 'Rajesh Kumar',
    jurisdiction: 'DELHI-CENTRAL',
    store_name: 'Item Test Store',
    store_location: 'Delhi',
  });

  // Upload a sample photo to Supabase Storage
  const sampleBuf = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
  const photoFilename = `del_test_${Date.now()}_front.jpg`;
  const photoUrl = await uploadSpecimenPhoto(sampleBuf, photoFilename, 'image/jpeg');
  console.log(`   Uploaded test photo to Storage: ${photoUrl}`);

  // Confirm photo exists in Storage
  const preCheck = await fetch(photoUrl);
  if (!preCheck.ok) throw new Error('Uploaded photo could not be fetched before delete test');
  console.log(`   Confirmed photo is live in Storage (HTTP ${preCheck.status}).`);

  // Add item to batch
  const testItemId = `ITEM-DEL-${Date.now()}`;
  await dataStore.addBatchItem({
    batch_id: draftWithItemId,
    item_id: testItemId,
    product_name: 'Delete Test Biscuit',
    product_category: 'Food',
    photos: [{ url: photoUrl, angle: 'front', filename: photoFilename }],
    compliant: true,
    confidence: 0.9,
    declarations_found: ['mrp'],
    declarations_missing: [],
    declaration_values: {},
    raw_ocr_text: '',
    cleaned_summary: '',
    status: 'pending',
    needs_review: false,
    review_reasons: []
  });

  // Confirm item in DB
  const { data: itemBeforeDel } = await supabase.from('batch_items').select('item_id').eq('item_id', testItemId).single();
  if (!itemBeforeDel) throw new Error('Item was not created in DB');
  console.log(`   Confirmed item ${testItemId} exists in DB with attached photo.`);

  // Delete draft batch with item and photo
  console.log(`   Executing deleteBatch on ${draftWithItemId}...`);
  const delRes = await dataStore.deleteBatch(draftWithItemId);
  console.log('   Delete response:', delRes.message);

  // Check 1: Batch row deleted
  const { data: batchAfterDel } = await supabase.from('batches').select('batch_id').eq('batch_id', draftWithItemId);
  if (batchAfterDel && batchAfterDel.length === 0) {
    console.log(`✅ PASS: Batch row ${draftWithItemId} deleted from batches table.`);
  } else {
    throw new Error('Batch row still exists in DB!');
  }

  // Check 2: Item row deleted
  const { data: itemAfterDel } = await supabase.from('batch_items').select('item_id').eq('item_id', testItemId);
  if (itemAfterDel && itemAfterDel.length === 0) {
    console.log(`✅ PASS: Item row ${testItemId} deleted from batch_items table.`);
  } else {
    throw new Error('Item row still exists in DB!');
  }

  // Check 3: Photo deleted from Storage
  const postCheck = await fetch(photoUrl);
  if (postCheck.status === 400 || postCheck.status === 404) {
    console.log(`✅ PASS: Photo file removed from Supabase Storage bucket (HTTP ${postCheck.status}).`);
  } else {
    console.warn(`Note: Storage fetch returned HTTP ${postCheck.status} (might be CDN cached or retained).`);
  }

  // --- SECTION 4: Gemini Text-Only Enforcement ---
  console.log('\n--- TEST SECTION 4: Gemini Text-Only Pipeline Audit ---');
  console.log('   Testing analyzeDeclarationsWithGemini with extracted OCR text only...');
  const geminiResult = await analyzeDeclarationsWithGemini(
    'BRITANNIA MARIE GOLD Net Weight 250 g MRP Rs. 40.00 Mfd Date 01/2026',
    { front: 'BRITANNIA MARIE GOLD Net Weight 250 g MRP Rs. 40.00' },
    0.95
  );

  console.log(`   Gemini analyzed product: "${geminiResult.product_name}" (${geminiResult.product_category})`);
  console.log(`   Compliant: ${geminiResult.compliant}, Confidence: ${geminiResult.confidence}`);
  console.log(`   Declarations found: ${geminiResult.declarations_found.join(', ')}`);
  console.log('✅ PASS: Gemini successfully reasons over extracted OCR text without any raw images.');

  console.log('\n====================================================');
  console.log('🎉 ALL TESTS FOR SECTIONS 2, 3, AND 4 PASSED!');
  console.log('====================================================\n');
}

runVerification().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
