import fs from 'fs';
import { createRequire } from 'module';

const envFile = fs.readFileSync('d:/Nilesh/BCA/SIH 2026/LabelLens Project/First/.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[match[1].trim()] = val;
  }
});

const require = createRequire('d:/Nilesh/BCA/SIH 2026/LabelLens Project/First/package.json');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const DEMO_BATCH_PREFIXES = ['BATCH-DL-', 'BATCH-MH-'];
const DEMO_BATCHES_TO_KEEP = new Set([
  'BATCH-DL-001', 'BATCH-DL-002', 'BATCH-DL-003', 'BATCH-DL-004', 'BATCH-DL-005',
  'BATCH-MH-001', 'BATCH-MH-002', 'BATCH-MH-003', 'BATCH-MH-004', 'BATCH-MH-005'
]);

async function main() {
  console.log('--- Resizing Demo Batches: 50%+ Reduction (10 batches, 3-4 items each) ---');
  
  const { data: batches, error: bErr } = await supabase.from('batches').select('batch_id').order('batch_id');
  if (bErr) throw bErr;

  const demoBatches = batches.filter(b => DEMO_BATCH_PREFIXES.some(prefix => b.batch_id.startsWith(prefix)));
  console.log(`Found ${demoBatches.length} demo batches in database.`);

  // 1. Delete discarded demo batches (BATCH-DL-006 to 010, BATCH-MH-006 to 010)
  const batchesToDelete = demoBatches.filter(b => !DEMO_BATCHES_TO_KEEP.has(b.batch_id)).map(b => b.batch_id);
  if (batchesToDelete.length > 0) {
    console.log(`Removing ${batchesToDelete.length} excess demo batches:`, batchesToDelete);
    // Delete items first
    const { error: delItemsErr } = await supabase.from('batch_items').delete().in('batch_id', batchesToDelete);
    if (delItemsErr) console.error('Error deleting items for discarded batches:', delItemsErr);

    // Delete batches
    const { error: delBatchesErr } = await supabase.from('batches').delete().in('batch_id', batchesToDelete);
    if (delBatchesErr) console.error('Error deleting discarded batches:', delBatchesErr);
  }

  // 2. Resize remaining 10 demo batches to 3-4 items each
  const keptBatches = demoBatches.filter(b => DEMO_BATCHES_TO_KEEP.has(b.batch_id));
  let totalDeleted = 0;
  let totalKept = 0;

  for (let bIndex = 0; bIndex < keptBatches.length; bIndex++) {
    const batchId = keptBatches[bIndex].batch_id;
    const targetSize = (bIndex % 2 === 0) ? 4 : 3;

    const { data: items, error: iErr } = await supabase
      .from('batch_items')
      .select('item_id')
      .eq('batch_id', batchId)
      .order('item_id', { ascending: true });

    if (iErr) {
      console.error(`Error fetching items for ${batchId}:`, iErr);
      continue;
    }

    if (items.length > targetSize) {
      const itemsToKeep = items.slice(0, targetSize);
      const itemsToDelete = items.slice(targetSize);
      const idsToDelete = itemsToDelete.map(i => i.item_id);

      for (let c = 0; c < idsToDelete.length; c += 50) {
        const chunk = idsToDelete.slice(c, c + 50);
        const { error: delErr } = await supabase
          .from('batch_items')
          .delete()
          .in('item_id', chunk);
        if (delErr) {
          console.error(`Error deleting chunk in ${batchId}:`, delErr);
        } else {
          totalDeleted += chunk.length;
        }
      }
      totalKept += itemsToKeep.length;
      console.log(`${batchId}: Reduced from ${items.length} to ${targetSize} items.`);
    } else {
      totalKept += items.length;
      console.log(`${batchId}: Already has ${items.length} items.`);
    }
  }

  // 3. Mark BATCH-DL-004 and BATCH-DL-005 as completed so queue tab is uncluttered
  await supabase.from('batches').update({ status: 'completed' }).in('batch_id', ['BATCH-DL-004', 'BATCH-DL-005']);
  await supabase.from('batch_items').update({ status: 'reviewed', officer_action: 'approve' }).in('batch_id', ['BATCH-DL-004', 'BATCH-DL-005']);

  console.log(`\nCompleted! Kept ${keptBatches.length} demo batches with ${totalKept} total items. Removed ${batchesToDelete.length} batches and ${totalDeleted} excess items.`);
}

main().catch(console.error);
