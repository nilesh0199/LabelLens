import fs from 'fs';

// Load .env.local if present
if (fs.existsSync('.env.local')) {
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
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment or .env.local');
  process.exit(1);
}

async function verifyTables() {
  console.log('--- Verifying Supabase Tables ---');

  for (const table of ['batches', 'batch_items']) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=5`, {
        headers: {
          'apikey': SERVICE_KEY,
          'Authorization': `Bearer ${SERVICE_KEY}`,
          'Accept': 'application/json'
        }
      });
      console.log(`Table '${table}' Status: ${res.status} ${res.statusText}`);
      const data = await res.json();
      console.log(`Table '${table}' Rows count:`, Array.isArray(data) ? data.length : 'Not array');
      console.log(`Table '${table}' Data:`, data);
    } catch (err) {
      console.error(`Error querying ${table}:`, err);
    }
  }

  // Also inspect OpenAPI schema to see column definitions
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    });
    const data = await res.json();
    console.log('\n--- OpenAPI Schema Definitions ---');
    for (const [table, def] of Object.entries(data.definitions || {})) {
      console.log(`\nTable: ${table}`);
      console.log(`Columns:`, Object.keys(def.properties || {}));
    }
  } catch (err) {
    console.error('OpenAPI error:', err);
  }
}

verifyTables();
