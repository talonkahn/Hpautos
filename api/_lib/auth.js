// Server-side auth + database helpers. SERVER ONLY.
import { createClient } from '@supabase/supabase-js';

const url = () => process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anon = () => process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

/** Privileged client. Only the server may hold SUPABASE_SERVICE_ROLE_KEY (never use a VITE_ prefix). */
export function adminDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url() || !key) throw new HttpError(500, 'Server is missing SUPABASE_SERVICE_ROLE_KEY (add it in Vercel → Environment Variables, no VITE_ prefix).');
  return createClient(url(), key, { auth: { persistSession: false } });
}

/** Verifies the caller's Supabase access token and returns { user, isAdmin }. */
export async function requireUser(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new HttpError(401, 'Please sign in first.');
  if (!url() || !anon()) throw new HttpError(500, 'Server is missing Supabase URL / anon key.');

  const client = createClient(url(), anon(), { auth: { persistSession: false } });
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user) throw new HttpError(401, 'Your session has expired. Please sign in again.');

  const { data: profile } = await adminDb().from('profiles').select('is_admin').eq('id', data.user.id).maybeSingle();
  return { user: data.user, isAdmin: !!profile?.is_admin };
}
