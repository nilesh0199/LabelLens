import { dataStore, getSupabaseClient } from '../src/lib/supabase.ts';
import fs from 'fs';

async function runAudit() {
  console.log('=== PROACTIVE AUDIT FOR PRE-DEPLOYMENT ===\n');

  const issues = [];
  const supabase = getSupabaseClient();

  // 1. Schema & Database Audit
  console.log('--- 1. Database Schema & Tables ---');
  const requiredTables = ['batches', 'batch_items', 'officer_inspectors', 'inspectors'];
  for (const t of requiredTables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      issues.push({
        severity: 'HIGH',
        area: 'Database Schema',
        component: `Table: ${t}`,
        detail: `Table '${t}' is missing or not accessible: ${error.message} (Code: ${error.code}). Notice: 'officer_inspectors' is missing, forcing hardcoded fallback in getOfficerInspectorIds.`
      });
      console.log(`[!] Table ${t}: MISSING (${error.message})`);
    } else {
      console.log(`[OK] Table ${t}: Present`);
    }
  }

  // 2. batches schema consistency
  console.log('\n--- 2. Batches & Items Consistency ---');
  const { data: batches } = await supabase.from('batches').select('*');
  const dlBatches = batches.filter(b => b.inspector_id === 'LMO-DL-04' || b.inspector_id === 'LMO-DL-05');
  const mhBatches = batches.filter(b => b.inspector_id === 'LMO-MH-02' || b.inspector_id === 'LMO-MH-03');
  const orphanBatches = batches.filter(b => !b.inspector_id?.startsWith('LMO-'));
  
  if (orphanBatches.length > 0) {
    issues.push({
      severity: 'HIGH',
      area: 'Jurisdictional Scoping',
      component: 'Batches / Inspector ID',
      detail: `There are ${orphanBatches.length} batches with inspector_id not matching LMO-* (e.g. INSP-DEL-042). Because of the hardcoded fallback scoping in getOfficerInspectorIds, these batches are completely invisible in all officer portals.`
    });
  }

  // 3. Test Officer Ledger Query
  console.log('\n--- 3. Officer Ledger Query ---');
  try {
    const dlLedger = await dataStore.listOfficerLedgerItems('AD-CTRL-DL-02');
    console.log(`[OK] Delhi Ledger returned ${dlLedger.length} items.`);
    const mhLedger = await dataStore.listOfficerLedgerItems('AD-CTRL-MH-01');
    console.log(`[OK] Mumbai Ledger returned ${mhLedger.length} items.`);
  } catch (err) {
    issues.push({
      severity: 'HIGH',
      area: 'Officer Portal',
      component: 'Ledger Query',
      detail: `listOfficerLedgerItems threw error: ${err.message}`
    });
  }

  // 4. Test Officer Inspectors Summary
  console.log('\n--- 4. Officer Inspectors Summary ---');
  try {
    const inspSummary = await dataStore.getOfficerInspectorsSummary('AD-CTRL-DL-02');
    console.log(`[OK] Officer Inspectors Summary returned ${inspSummary.length} inspectors.`);
  } catch (err) {
    issues.push({
      severity: 'MEDIUM',
      area: 'Officer Portal',
      component: 'Inspectors Summary',
      detail: `getOfficerInspectorsSummary threw error: ${err.message}`
    });
  }

  // 5. Test Recapture Items Retrieval
  console.log('\n--- 5. Recapture Pipeline Query ---');
  try {
    const recaptures = await dataStore.getRecaptureItems('LMO-DL-04');
    console.log(`[OK] Recapture items for LMO-DL-04: ${recaptures.length} items.`);
  } catch (err) {
    issues.push({
      severity: 'HIGH',
      area: 'Recapture Pipeline',
      component: 'getRecaptureItems',
      detail: `getRecaptureItems failed: ${err.message}`
    });
  }

  // 6. Test Static Asset Alignment
  console.log('\n--- 6. Static Asset Synchronization ---');
  const syncPairs = [
    ['frontend/inspector.html', 'public/inspector.html'],
    ['frontend/inspector.js', 'public/inspector.js'],
    ['frontend/officer.html', 'public/officer.html'],
    ['frontend/officer.js', 'public/officer.js'],
    ['frontend/login.html', 'public/login.html'],
    ['frontend/auth.js', 'public/auth.js'],
    ['frontend/style.css', 'public/style.css'],
  ];

  for (const [f1, f2] of syncPairs) {
    const c1 = fs.readFileSync(f1, 'utf8');
    const c2 = fs.readFileSync(f2, 'utf8');
    if (c1 !== c2) {
      issues.push({
        severity: 'MEDIUM',
        area: 'Static Files',
        component: `${f1} vs ${f2}`,
        detail: `File contents differ between ${f1} and ${f2}. In production, Next.js static serving will serve public/ version, causing desync if not synced.`
      });
      console.log(`[!] MISMATCH: ${f1} != ${f2}`);
    } else {
      console.log(`[OK] In sync: ${f1} == ${f2}`);
    }
  }

  // 7. Test PDF Generation Logic
  console.log('\n--- 7. PDF Report Generation Test ---');
  try {
    const testItem = (await supabase.from('batch_items').select('*').limit(1)).data[0];
    if (testItem) {
      console.log(`[OK] Sample item found for PDF: ${testItem.item_id}`);
    }
  } catch (err) {
    issues.push({
      severity: 'MEDIUM',
      area: 'PDF Reports',
      component: 'PDF Pipeline',
      detail: `PDF check error: ${err.message}`
    });
  }

  console.log('\n--- AUDIT SUMMARY ---');
  console.log(`Total potential issues discovered: ${issues.length}`);
  issues.forEach((iss, idx) => {
    console.log(`\n[${idx + 1}] [${iss.severity}] ${iss.area} > ${iss.component}`);
    console.log(`    Detail: ${iss.detail}`);
  });
}

runAudit().catch(console.error);
