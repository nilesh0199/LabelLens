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

async function main() {
  console.log('--- Resizing Demo Batches to 8-9 items each ---');
  
  const { data: batches, error: bErr } = await supabase.from('batches').select('batch_id').order('batch_id');
  if (bErr) throw bErr;

  const demoBatches = batches.filter(b => DEMO_BATCH_PREFIXES.some(prefix => b.batch_id.startsWith(prefix)));
  console.log(`Found ${demoBatches.length} demo batches.`);

  let totalDeleted = 0;
  let totalKept = 0;

  for (let bIndex = 0; bIndex < demoBatches.length; bIndex++) {
    const batchId = demoBatches[bIndex].batch_id;
    const targetSize = (bIndex % 2 === 0) ? 9 : 8;

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
      console.log(`${batchId}: Already has ${items.length} items (target: ${targetSize}).`);
    }
  }

  console.log(`\nCompleted! Total demo items kept: ${totalKept}, total excess items removed: ${totalDeleted}`);
}

main().catch(console.error);
