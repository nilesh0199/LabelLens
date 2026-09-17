import fs from 'fs';
import { dataStore } from '../src/lib/supabase.ts';

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

async function runCrudTest() {
  console.log('--- Testing Live Supabase Database CRUD via dataStore ---');

  const batchId = `BATCH-LIVE-${Date.now()}`;
  console.log('1. Creating batch:', batchId);
  const created = await dataStore.createBatch({
    batch_id: batchId,
    inspector_id: 'LMO-DL-04',
    inspector_name: 'Rajesh Kumar',
    jurisdiction: 'Central District, Circle 2',
    store_name: 'BigBazaar Connaught Place',
    store_location: 'Inner Circle, CP, New Delhi'
  });
  console.log('✅ Batch created:', created.batch_id, created.status);

  console.log('\n2. Adding batch item...');
  const itemId = `ITEM-LIVE-${Date.now()}`;
  const item = await dataStore.addBatchItem({
    item_id: itemId,
    batch_id: batchId,
    product_name: 'Haldiram Bhujia 400g',
    product_category: 'Packaged Food',
    photos: [{
      angle: 'front',
      filename: `${itemId}_front.jpg`,
      url: 'https://zrgrucpghxdtailgcpam.supabase.co/storage/v1/object/public/specimen-photos/uploads/test.jpg',
      ocr_confidence: 0.95
    }],
    compliant: true,
    confidence: 0.95,
    declarations_found: ['mrp', 'net_quantity', 'commodity_name'],
    declarations_missing: [],
    declaration_values: { mrp: '₹ 110', net_quantity: '400 g' },
    raw_ocr_text: 'Haldiram Bhujia Net Qty: 400g MRP: Rs 110',
    cleaned_summary: '[Rule 6(1)(e)] MRP: ₹ 110',
    status: 'draft',
    needs_review: false,
    review_reasons: [],
    created_at: new Date().toISOString()
  });
  console.log('✅ Item added to DB:', item.item_id, item.product_name, 'photos count:', item.photos.length);

  console.log('\n3. Fetching batch by ID...');
  const fetched = await dataStore.getBatchById(batchId);
  console.log('✅ Fetched batch items count:', fetched?.items?.length);
  console.log('Item 0 photos in fetched batch:', fetched?.items?.[0]?.photos);

  console.log('\n4. Updating item...');
  const updated = await dataStore.updateBatchItem(itemId, {
    product_name: 'Haldiram Bhujia 400g (Verified)'
  });
  console.log('✅ Item updated:', updated?.product_name);

  console.log('\n5. Submitting batch...');
  const submitted = await dataStore.submitBatch(batchId);
  console.log('✅ Batch status after submit:', submitted?.status, submitted?.submitted_at);

  console.log('\n🎉 ALL LIVE DATABASE CRUD OPERATIONS SUCCEEDED AGAINST SUPABASE!');
}

runCrudTest().catch(err => {
  console.error('❌ CRUD Test failed:', err);
  process.exit(1);
});
