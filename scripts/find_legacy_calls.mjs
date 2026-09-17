import fs from 'fs';

const content = fs.readFileSync('frontend/app.js', 'utf8');
const lines = content.split('\n');

const patterns = ['/health', '/check-compliance', '/finalize-report', '/history/months', '/history/'];
lines.forEach((l, idx) => {
  for (const p of patterns) {
    if (l.includes(p)) {
      console.log(`L${idx + 1}: ${l.trim()}`);
    }
  }
});
