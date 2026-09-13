import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEMO_USERS: Record<string, any> = {
  inspector: {
    username: 'inspector',
    password: 'password123',
    role: 'inspector',
    full_name: 'Rajesh Kumar',
    badge_number: 'LMO-DL-04',
    jurisdiction: 'Central District, Circle 2',
  },
  officer: {
    username: 'officer',
    password: 'password123',
    role: 'officer',
    full_name: 'Dr. S. K. Sharma',
    badge_number: 'AD-CTRL-DL-02',
    jurisdiction: 'Controller Office Delhi',
  },
  admin: {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    full_name: 'Administrator',
    badge_number: 'ADMIN-HQ-01',
    jurisdiction: 'Directorate General',
  },
};

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ detail: 'Username and password required.' }, { status: 400 });
    }

    const cleanUser = username.trim().toLowerCase();

    // Check Supabase Auth if connected
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: username.includes('@') ? username : `${cleanUser}@labellens.dev`,
          password,
        });

        if (!error && data.user) {
          const role = data.user.app_metadata?.role || data.user.user_metadata?.role || 'inspector';
          return NextResponse.json({
            token: data.session?.access_token || `token-${Date.now()}`,
            user: {
              username: cleanUser,
              role,
              full_name: data.user.user_metadata?.full_name || cleanUser,
              badge_number: data.user.user_metadata?.badge_number || 'LMO-01',
              jurisdiction: data.user.user_metadata?.jurisdiction || 'Jurisdiction 1',
            },
          });
        }
      } catch (e) {
        console.warn('[Supabase Auth] Login attempt failed, falling back to local demo accounts.');
      }
    }

    // Fallback to local demo accounts
    const account = DEMO_USERS[cleanUser];
    if (!account || account.password !== password) {
      return NextResponse.json(
        { detail: 'Invalid credentials. Use inspector / password123 or officer / password123' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      token: `demo-token-${account.role}-${Date.now()}`,
      user: {
        username: account.username,
        role: account.role,
        full_name: account.full_name,
        badge_number: account.badge_number,
        jurisdiction: account.jurisdiction,
      },
    });
  } catch (err: any) {
    console.error('[auth/login] Error:', err);
    return NextResponse.json({ detail: err.message || 'Authentication error' }, { status: 500 });
  }
}
