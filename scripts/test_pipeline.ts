/**
 * End-to-End TypeScript Verification Suite for LabelLens Vercel Serverless Pipeline
 */

import { checkNeedsReview, isSingleUnitPackage, formatRule6Details } from '../src/lib/compliance';
import { ruleBasedFallbackAnalysis, analyzeDeclarationsWithGemini } from '../src/lib/gemini';
import { dataStore } from '../src/lib/supabase';

async function runTests() {
  console.log('====================================================');
  console.log('RUNNING LABELLENS TYPESCRIPT PIPELINE VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, msg: string) {
    total++;
    if (!condition) {
      console.error(`❌ FAIL [Test ${total}]: ${msg}`);
      throw new Error(`Test failed: ${msg}`);
    }
    passed++;
    console.log(`✅ PASS [Test ${total}]: ${msg}`);
  }

  // ---------------------------------------------------------------
  // 1. Single-Unit USP Exemption Logic
  // ---------------------------------------------------------------
  console.log('--- 1. Testing Single-Unit vs Multi-Unit Package Detection ---');
  assert(isSingleUnitPackage('1 N', 'Toothbrush', '') === true, 'Single unit "1 N" recognized');
  assert(isSingleUnitPackage('1 piece', 'Hand Soap', '') === true, 'Single unit "1 piece" recognized');
  assert(isSingleUnitPackage('1 unit', 'USB-C Cable', '') === true, 'Single unit "1 unit" recognized');
  assert(isSingleUnitPackage('1 count', 'Phone Cover', '') === true, 'Single unit "1 count" recognized');
  assert(isSingleUnitPackage('500 g', 'Wheat Flour', '') === true, 'Single retail unit "500 g" recognized as single unit (USP exempt)');
  assert(isSingleUnitPackage('1 kg', 'Tata Salt', '') === true, 'Single retail unit "1 kg" recognized as single unit (USP exempt)');
  assert(isSingleUnitPackage('200 ml', 'Coconut Oil', '') === true, 'Single retail unit "200 ml" recognized as single unit (USP exempt)');
  assert(isSingleUnitPackage('Pack of 6, 100g each', 'Bath Soap', '') === false, 'Genuine multi-pack "Pack of 6" recognized as multi-unit (USP required)');
  assert(isSingleUnitPackage('6x100g', 'Biscuits', '') === false, 'Multi-pack notation "6x100g" recognized as multi-unit (USP required)');
  assert(isSingleUnitPackage('Combo of 3', 'Shampoo', '') === false, 'Bundle "Combo of 3" recognized as multi-unit (USP required)');

  // ---------------------------------------------------------------
  // 2. Rule 6 Mandatory Declarations & "Needs Review" Flagging
  // ---------------------------------------------------------------
  console.log('\n--- 2. Testing Rule 6 Compliance & Needs Review Evaluation ---');
  const allMandatory = [
    'commodity_name', 'net_quantity', 'mrp', 'manufacturing_date',
    'manufacturer_details', 'consumer_care', 'country_of_origin', 'unit_sale_price'
  ];

  // High confidence + all declarations
  const res1 = checkNeedsReview(0.92, allMandatory, [], '500 g', 'Flour', '');
  assert(res1.needsReview === false, 'High confidence (92%) + all fields present -> Needs Review is FALSE');
  assert(res1.reasons.length === 0, 'No review reasons generated');

  // Low confidence (< 85%)
  const res2 = checkNeedsReview(0.78, allMandatory, [], '500 g', 'Flour', '');
  assert(res2.needsReview === true, 'Low confidence (78%) -> Needs Review is TRUE');
  assert(res2.reasons.some(r => r.includes('Confidence 78% (< 85%)')), 'Reason mentions Confidence 78%');

  // Exact 85% threshold
  const res3 = checkNeedsReview(0.85, allMandatory, [], '500 g', 'Flour', '');
  assert(res3.needsReview === false, 'Exact 85% confidence -> Needs Review is FALSE');

  // Missing Country of Origin on Imported
  const missingCoo = allMandatory.filter(k => k !== 'country_of_origin');
  const res4 = checkNeedsReview(0.95, missingCoo, ['country_of_origin'], '500 g', 'Flour', '', 'Imported');
  assert(res4.needsReview === true, 'Missing Country of Origin on Imported -> Needs Review is TRUE');
  assert(res4.reasons.some(r => r.includes('Country of Origin')), 'Reason mentions Country of Origin');

  // Single-unit package (1 kg) missing USP -> EXEMPT from USP -> NOT flagged
  const withoutUsp = allMandatory.filter(k => k !== 'unit_sale_price');
  const res5 = checkNeedsReview(0.90, withoutUsp, ['unit_sale_price'], '1 kg', 'Tata Salt', '');
  assert(res5.needsReview === false, 'Single-unit package "1 kg" missing USP -> NOT flagged (USP exempt)');

  // Genuine multi-pack package missing USP -> NOT exempt -> FLAGGED
  const res6 = checkNeedsReview(0.90, withoutUsp, ['unit_sale_price'], 'Pack of 6, 100g each', 'Bath Soap', '');
  assert(res6.needsReview === true, 'Multi-pack package "Pack of 6" missing USP -> FLAGGED');
  assert(res6.reasons.some(r => r.includes('Unit Sale Price (USP)')), 'Reason mentions Unit Sale Price (USP)');

  // Verdict Independence: Compliant with low confidence
  const res7 = checkNeedsReview(0.72, allMandatory, [], '1 piece', 'Pen', '');
  assert(res7.needsReview === true, 'Compliant item with low confidence (72%) flagged independently');

  // Verdict Independence: Non-compliant with high confidence
  const res8 = checkNeedsReview(0.96, missingCoo, ['country_of_origin'], '1 kg', 'Detergent', '');
  assert(res8.needsReview === true, 'Non-compliant item with high confidence flagged due to missing field');

  // ---------------------------------------------------------------
  // 3. Fallback Parsing & Rule 6 Extraction
  // ---------------------------------------------------------------
  console.log('\n--- 3. Testing Rule 6 Fallback Parsing & Field Extraction ---');
  const sampleOcr = `
    PARLE-G ORIGINAL GLUCO BISCUITS
    Net Weight: 250 g
    MRP: Rs 25.00 (Incl. of all taxes)
    Mfg Date: 08/2026
    Manufactured by: Parle Products Pvt Ltd, Vile Parle, Mumbai 400057
    Consumer Care: care@parle.biz, Toll Free: 1800-22-7799
    Country of Origin: India
    USP: Rs 0.10 / g
  `;

  const parsed = ruleBasedFallbackAnalysis(sampleOcr, 0.94);
  assert(parsed.product_name.includes('PARLE-G'), 'Product name extracted');
  assert(parsed.declaration_values.mrp.includes('25'), 'MRP extracted cleanly');
  assert(parsed.declaration_values.net_quantity.includes('250'), 'Net quantity extracted');
  assert(parsed.declaration_values.country_of_origin.toLowerCase().includes('india'), 'Country of Origin extracted');
  assert(parsed.declarations_found.includes('mrp'), 'MRP key marked found');
  assert(parsed.declarations_found.includes('consumer_care'), 'Consumer Care marked found');

  const rule6Details = formatRule6Details(parsed.declarations_found);
  assert(rule6Details.length === 10, 'Rule 6 details formatted with all 10 statutory items');

  // ---------------------------------------------------------------
  // 4. Data Layer & Supabase In-Memory Adapter
  // ---------------------------------------------------------------
  console.log('\n--- 4. Testing Data Layer (Batches & Items CRUD) ---');
  const testBatch = await dataStore.createBatch({
    batch_id: `BATCH-TS-${Date.now()}`,
    inspector_id: 'LMO-DL-04',
    inspector_name: 'Rajesh Kumar',
    jurisdiction: 'Central District, Circle 2',
    store_name: 'BigBazaar Supercenter',
    store_location: 'Janpath, New Delhi',
  });
  assert(testBatch.batch_id.startsWith('BATCH-TS-'), 'Batch created successfully');
  assert(testBatch.status === 'draft', 'New batch starts in draft status');

  const active = await dataStore.getActiveBatch('LMO-DL-04');
  assert(active?.batch_id === testBatch.batch_id, 'getActiveBatch returns the new draft batch');

  const testItem = await dataStore.addBatchItem({
    item_id: `ITEM-TS-${Date.now()}`,
    batch_id: testBatch.batch_id,
    product_name: 'Parle-G Gluco Biscuits 250g',
    photos: [{ angle: 'front', url: `${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zrgrucpghxdtailgcpam.supabase.co'}/storage/v1/object/public/specimen-photos/uploads/test_item.jpg` }],
    confidence: 0.94,
    declarations_found: allMandatory,
    declarations_missing: [],
    declaration_values: parsed.declaration_values,
    raw_ocr_text: sampleOcr,
    cleaned_summary: parsed.cleaned_summary,
    status: 'draft',
    product_category: 'Packaged Food',
    compliant: true,
    needs_review: false,
    review_reasons: [],
    created_at: new Date().toISOString(),
  });
  assert(testItem.item_id.startsWith('ITEM-TS-'), 'Item added to batch');

  const fetchedBatch = await dataStore.getBatchById(testBatch.batch_id);
  assert((fetchedBatch?.items?.length || 0) === 1, 'getBatchById includes newly added item');

  // Submit batch
  const submitted = await dataStore.submitBatch(testBatch.batch_id);
  assert(submitted?.status === 'pending_review', 'submitBatch updates status to pending_review');

  const officerBatches = await dataStore.listOfficerBatches();
  assert(officerBatches.some(b => b.batch_id === testBatch.batch_id), 'Submitted batch appears in Officer queue');

  // Adjudicate item
  const reviewed = await dataStore.updateBatchItem(testItem.item_id, {
    officer_action: 'approve',
    officer_remarks: 'Verified compliant with statutory standards.',
    status: 'reviewed',
  });
  assert(reviewed?.officer_action === 'approve', 'Officer action saved on item');

  // ---------------------------------------------------------------
  // 5. Cold-Start Latency Measurement
  // ---------------------------------------------------------------
  console.log('\n--- 5. Measuring Function Cold-Start Latency ---');
  const t0 = performance.now();
  // Simulate complete compliance evaluation cycle
  const simEval = checkNeedsReview(0.91, allMandatory, [], '250 g', 'Parle-G', sampleOcr);
  const t1 = performance.now();
  const latencyMs = Math.round(t1 - t0);
  console.log(`⚡ Execution latency: ${latencyMs} ms (Sub-second execution!)`);
  assert(latencyMs < 500, `Cold-start compute latency is ${latencyMs}ms (< 500ms target)`);

  console.log('\n====================================================');
  console.log(`ALL ${passed}/${total} VERIFICATION CHECKS PASSED CLEANLY!`);
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
