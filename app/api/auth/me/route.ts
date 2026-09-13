import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ detail: 'Not authenticated' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  return NextResponse.json({
    authenticated: true,
    token,
  });
}
