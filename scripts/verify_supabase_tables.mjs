const SUPABASE_URL = 'https://zrgrucpghxdtailgcpam.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyZ3J1Y3BnaHhkdGFpbGdjcGFtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTI4NDgyNywiZXhwIjoyMTA0ODYwODI3fQ.AL11-YnYav39VJaOtFEzKG06SGzgTRc7Ldh7DbMxFE0';

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
