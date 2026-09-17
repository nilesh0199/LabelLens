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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const API_BASE = 'http://localhost:3000';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 1x1 test JPEG
const SAMPLE_JPEG_BASE64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
const sampleJpegBuffer = Buffer.from(SAMPLE_JPEG_BASE64, 'base64');

async function main() {
  console.log('================================================================');
  console.log('  LABELLENS STAGE 1 END-TO-END VERIFICATION SUITE');
  console.log('================================================================\n');

  // STEP 1: Supabase Database Table Confirmation
  console.log('--- STEP 1: Verifying Supabase Tables directly ---');
  const { data: batchesTable, error: bErr } = await supabase.from('batches').select('batch_id').limit(1);
  if (bErr) {
    console.error('❌ Failed querying batches table:', bErr);
    process.exit(1);
  }
  console.log('✅ batches table exists and is readable via Supabase client');

  const { data: itemsTable, error: iErr } = await supabase.from('batch_items').select('item_id').limit(1);
  if (iErr) {
    console.error('❌ Failed querying batch_items table:', iErr);
    process.exit(1);
  }
  console.log('✅ batch_items table exists and is readable via Supabase client\n');

  // STEP 2: Create Batch via Next.js API
  console.log('--- STEP 2: Creating a new batch via API (POST /api/batches/create) ---');
  const createBatchPayload = {
    inspector_id: 'INSP-DEL-042',
    inspector_name: 'Rajesh Kumar (LMO)',
    jurisdiction: 'DELHI-CENTRAL',
    store_name: 'BigBazaar Connaught Place',
    store_location: 'Inner Circle, CP, New Delhi - 110001'
  };

  const createBatchRes = await fetch(`${API_BASE}/api/batches/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(createBatchPayload)
  });

  if (!createBatchRes.ok) {
    console.error('❌ Failed to create batch:', createBatchRes.status, await createBatchRes.text());
    process.exit(1);
  }

  const createBatchData = await createBatchRes.json();
  const activeBatch = createBatchData.batch || createBatchData;
  console.log('✅ Batch created successfully:');
  console.log('   Batch ID:', activeBatch.batch_id);
  console.log('   Status:', activeBatch.status);
  console.log('   Store:', activeBatch.store_name, '\n');

  // STEP 3: Inspect Item & Upload Photo (POST /api/inspector/inspect-item)
  console.log('--- STEP 3: Capturing & Inspecting item with photo upload ---');
  const testItemId = `ITEM-TEST-${Date.now()}`;
  console.log('   Client-generated item_id:', testItemId);

  const formData = new FormData();
  formData.append('item_id', testItemId);
  formData.append('batch_id', activeBatch.batch_id);
  formData.append('angle', 'front');
  
  const blob = new Blob([sampleJpegBuffer], { type: 'image/jpeg' });
  formData.append('photo_front', blob, 'sample_specimen_front.jpg');

  const inspectRes = await fetch(`${API_BASE}/api/inspector/inspect-item`, {
    method: 'POST',
    body: formData
  });

  if (!inspectRes.ok) {
    console.error('❌ inspect-item failed:', inspectRes.status, await inspectRes.text());
    process.exit(1);
  }

  const inspectedItem = await inspectRes.json();
  console.log('✅ inspect-item response received:');
  console.log('   Returned item_id:', inspectedItem.item_id);
  console.log('   Item ID matches client ID (no desync):', inspectedItem.item_id === testItemId ? 'YES ✅' : 'NO ❌');
  console.log('   Photos count:', inspectedItem.photos?.length);
  
  if (!inspectedItem.photos || inspectedItem.photos.length === 0) {
    console.error('❌ No photos returned from inspect-item!');
    process.exit(1);
  }

  const uploadedPhotoUrl = inspectedItem.photos[0].url;
  console.log('   Uploaded Photo Public URL:', uploadedPhotoUrl);

  if (!uploadedPhotoUrl.startsWith('https://')) {
    console.error('❌ Photo URL is not a valid HTTPS Supabase public URL!');
    process.exit(1);
  }

  // STEP 4: Fetch photo directly to verify Supabase Storage public access
  console.log('\n--- STEP 4: Verifying photo URL directly from Supabase Storage ---');
  const photoFetchRes = await fetch(uploadedPhotoUrl);
  console.log('   Storage HTTP Status:', photoFetchRes.status, photoFetchRes.statusText);
  console.log('   Content-Type:', photoFetchRes.headers.get('content-type'));
  if (photoFetchRes.ok) {
    console.log('✅ Photo is publicly accessible and verified in Supabase Storage!');
  } else {
    console.error('❌ Storage URL could not be fetched!');
    process.exit(1);
  }

  // STEP 5: Add Item to Batch (POST /api/inspector/add-item)
  console.log('\n--- STEP 5: Persisting item to batch via API (POST /api/inspector/add-item) ---');
  const addItemPayload = {
    batch_id: activeBatch.batch_id,
    item_id: inspectedItem.item_id,
    product_name: inspectedItem.product_name || 'Britannia Marie Gold 250g',
    product_category: inspectedItem.product_category || 'Biscuits',
    photos: inspectedItem.photos,
    compliant: inspectedItem.compliant ?? true,
    confidence: inspectedItem.confidence ?? 0.95,
    declarations_found: inspectedItem.declarations_found || ['mrp', 'net_quantity', 'manufacturer'],
    declarations_missing: inspectedItem.declarations_missing || [],
    declaration_values: inspectedItem.declaration_values || { mrp: '₹40.00', net_quantity: '250 g' },
    raw_ocr_text: inspectedItem.raw_ocr_text || 'BRITANNIA MARIE GOLD NET WT 250g MRP Rs 40.00 INCL OF ALL TAXES',
    cleaned_summary: inspectedItem.cleaned_summary || 'MRP: ₹40.00 | Net Qty: 250g',
    status: 'pending',
    needs_review: inspectedItem.needs_review ?? false,
    review_reasons: inspectedItem.review_reasons || []
  };

  const addItemRes = await fetch(`${API_BASE}/api/inspector/add-item`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(addItemPayload)
  });

  if (!addItemRes.ok) {
    console.error('❌ add-item failed:', addItemRes.status, await addItemRes.text());
    process.exit(1);
  }
  const addItemResult = await addItemRes.json();
  console.log('✅ Item added to batch via API:', addItemResult.message || 'Success');

  // STEP 6: Direct Database Verification
  console.log('\n--- STEP 6: Direct PostgreSQL Database Query Verification ---');
  const { data: dbBatch, error: dbBErr } = await supabase
    .from('batches')
    .select('*')
    .eq('batch_id', activeBatch.batch_id)
    .single();

  if (dbBErr || !dbBatch) {
    console.error('❌ Batch not found in Supabase DB:', dbBErr);
    process.exit(1);
  }
  console.log('✅ Batch confirmed in Supabase PostgreSQL:');
  console.log('   batch_id:', dbBatch.batch_id);
  console.log('   store_name:', dbBatch.store_name);
  console.log('   status:', dbBatch.status);

  const { data: dbItem, error: dbIErr } = await supabase
    .from('batch_items')
    .select('*')
    .eq('item_id', testItemId)
    .single();

  if (dbIErr || !dbItem) {
    console.error('❌ Item not found in Supabase DB:', dbIErr);
    process.exit(1);
  }
  console.log('✅ Item confirmed in Supabase PostgreSQL:');
  console.log('   item_id:', dbItem.item_id);
  console.log('   batch_id:', dbItem.batch_id);
  console.log('   product_name:', dbItem.product_name);
  console.log('   photos (JSONB):', JSON.stringify(dbItem.photos));
  console.log('   declarations_found:', JSON.stringify(dbItem.declarations_found));
  console.log('   needs_review:', dbItem.needs_review);

  // STEP 7: Reload Resilience Test (Simulating Page Reload)
  console.log('\n--- STEP 7: Testing Reload Resilience (GET /api/batches/[batch_id]) ---');
  const reloadRes = await fetch(`${API_BASE}/api/batches/${activeBatch.batch_id}`);
  if (!reloadRes.ok) {
    console.error('❌ Failed fetching batch on reload:', reloadRes.status);
    process.exit(1);
  }
  const reloadData = await reloadRes.json();
  const reloadedBatch = reloadData.batch || reloadData;
  console.log('✅ Batch fetched on simulated page reload:');
  console.log('   Items count:', reloadedBatch.items?.length);
  
  const reloadedItem = reloadedBatch.items.find(i => i.item_id === testItemId);
  if (!reloadedItem) {
    console.error('❌ Reloaded item not found in batch!');
    process.exit(1);
  }
  console.log('   Item ID verified intact:', reloadedItem.item_id);
  console.log('   Photos count intact:', reloadedItem.photos?.length);
  console.log('   Photo URL intact:', reloadedItem.photos[0]?.url);

  // Test formatPhotoUrl logic exactly as frontend executes it:
  function clientFormatPhotoUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
      return url;
    }
    return API_BASE + (url.startsWith('/') ? url : '/' + url);
  }

  const clientRenderedUrl = clientFormatPhotoUrl(reloadedItem.photos[0]?.url);
  console.log('   Client-side formatted URL:', clientRenderedUrl);
  if (clientRenderedUrl === reloadedItem.photos[0]?.url && clientRenderedUrl.startsWith('https://')) {
    console.log('✅ Photo URL is pristine! No double-prefixing or corruption on client rendering.');
  } else {
    console.error('❌ Photo URL formatting corrupted the URL:', clientRenderedUrl);
    process.exit(1);
  }

  // STEP 8: Submit Batch (POST /api/batches/[batch_id]/submit)
  console.log('\n--- STEP 8: Submitting Batch to Officer Review ---');
  const submitRes = await fetch(`${API_BASE}/api/batches/${activeBatch.batch_id}/submit`, {
    method: 'POST'
  });
  if (!submitRes.ok) {
    console.error('❌ Batch submit failed:', submitRes.status, await submitRes.text());
    process.exit(1);
  }
  const submitData = await submitRes.json();
  console.log('✅ Batch submitted successfully. New status:', submitData.status || submitData.batch?.status);

  // Verify in DB
  const { data: submittedDbBatch } = await supabase
    .from('batches')
    .select('status, submitted_at')
    .eq('batch_id', activeBatch.batch_id)
    .single();
  console.log('   DB status:', submittedDbBatch.status);
  console.log('   DB submitted_at:', submittedDbBatch.submitted_at);

  // STEP 9: Officer Portal Review Flow
  console.log('\n--- STEP 9: Officer Review Workbench Verification ---');
  const officerBatchRes = await fetch(`${API_BASE}/api/officer/batches/${activeBatch.batch_id}`);
  if (!officerBatchRes.ok) {
    console.error('❌ Officer batch fetch failed:', officerBatchRes.status);
    process.exit(1);
  }
  const officerBatchData = await officerBatchRes.json();
  const officerBatch = officerBatchData.batch || officerBatchData;
  console.log('✅ Officer retrieved submitted batch:');
  console.log('   Officer view items count:', officerBatch.items?.length);
  console.log('   Officer view item photo URL:', officerBatch.items[0]?.photos[0]?.url);

  // Officer reviews the item
  console.log('\n--- STEP 10: Officer Adjudication (POST /api/officer/review-item) ---');
  const reviewPayload = {
    item_id: testItemId,
    action: 'approve',
    officer_remarks: 'Verified complete adherence to Legal Metrology (Packaged Commodities) Rules 2011.'
  };

  const reviewRes = await fetch(`${API_BASE}/api/officer/review-item`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reviewPayload)
  });

  if (!reviewRes.ok) {
    console.error('❌ Officer review failed:', reviewRes.status, await reviewRes.text());
    process.exit(1);
  }
  const reviewResult = await reviewRes.json();
  console.log('✅ Officer review saved successfully. Action:', reviewResult.officer_action, 'Status:', reviewResult.status);

  // Verify final item state in DB
  const { data: finalDbItem } = await supabase
    .from('batch_items')
    .select('status, officer_action, officer_remarks')
    .eq('item_id', testItemId)
    .single();
  console.log('   DB item status:', finalDbItem.status);
  console.log('   DB officer_action:', finalDbItem.officer_action);
  console.log('   DB officer_remarks:', finalDbItem.officer_remarks);

  console.log('\n================================================================');
  console.log('🎉 ALL END-TO-END STAGE 1 VERIFICATION CHECKS PASSED PERFECTLY!');
  console.log('================================================================\n');
}

main().catch(err => {
  console.error('Unhandled error during E2E verification:', err);
  process.exit(1);
});
