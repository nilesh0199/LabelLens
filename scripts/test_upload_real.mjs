import fs from 'fs';
import { uploadSpecimenPhoto } from '../src/lib/supabase.ts';

// Manually ensure .env.local vars are set if node doesn't load them automatically
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

async function run() {
  console.log('Testing uploadSpecimenPhoto from src/lib/supabase.ts...');
  const sampleBuf = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
  const filename = `specimen_upload_test_${Date.now()}.jpg`;

  try {
    const url = await uploadSpecimenPhoto(sampleBuf, filename, 'image/jpeg');
    console.log('✅ uploadSpecimenPhoto returned URL:', url);

    const check = await fetch(url);
    console.log('Fetch URL status:', check.status, check.statusText);
    if (check.ok) {
      console.log('🎉 Storage upload and public fetch verified successfully!');
    } else {
      console.error('Failed to fetch uploaded image');
    }
  } catch (err) {
    console.error('❌ uploadSpecimenPhoto failed:', err);
  }
}

run();
