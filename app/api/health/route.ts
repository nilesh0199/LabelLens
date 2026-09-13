import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'LabelLens Vercel Serverless API',
    ocr_engine: 'Google Cloud Vision API (DOCUMENT_TEXT_DETECTION)',
    llm_engine: 'Google Gemini (gemini-2.0-flash)',
    database: 'Supabase Data-Only (PostgreSQL + Storage)',
    timestamp: new Date().toISOString(),
  });
}
