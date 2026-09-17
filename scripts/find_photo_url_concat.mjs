import fs from 'fs';

const files = [
  'frontend/officer.js',
  'public/officer.js',
  'frontend/app.js',
  'public/app.js',
  'frontend/inspector.js',
  'public/inspector.js'
];

for (const f of files) {
  console.log(`\n=== ${f} ===`);
  const lines = fs.readFileSync(f, 'utf8').split('\n');
  lines.forEach((l, idx) => {
    if (l.includes('API_BASE_URL') && (l.includes('.url') || l.includes('img') || l.includes('src'))) {
      console.log(`L${idx + 1}: ${l.trim()}`);
    }
  });
}
