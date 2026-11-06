import { useEffect, useState } from 'react';
import { supabase } from './supabase';

/** Calls our own serverless function — the Roqqu private key never touches the browser. */
export async function roqqu(action, params = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  let res;
  try {
    res = await fetch('/api/roqqu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
      body: JSON.stringify({ action, ...params }),
    });
  } catch { throw new Error('Could not reach the server. Check your connection.'); }
  let json;
  try { json = await res.json(); } catch { throw new Error('The server did not respond correctly. Is the API running?'); }
  if (!json.ok) throw new Error(json.error || 'Request failed');
  return json.data;
}

let healthCache = null;
/** { mode: 'mock'|'live', keysPresent, serviceRole, assets } — fetched once per page load. */
export function useRoqquHealth() {
  const [health, setHealth] = useState(healthCache);
  useEffect(() => {
    if (healthCache) return;
    roqqu('health').then((h) => { healthCache = h; setHealth(h); }).catch(() => setHealth({ mode: 'unreachable' }));
  }, []);
  return health;
}

export const getMyDealerProfile = async (userId) => {
  const { data } = await supabase.from('dealer_profiles').select('*').eq('user_id', userId).maybeSingle();
  return data;
};

export const getVerifiedDealer = async (wallet) => {
  if (!wallet) return null;
  const { data } = await supabase.from('verified_dealers').select('*').eq('wallet_address', wallet.toLowerCase()).maybeSingle();
  return data;
};

export const getMyPayouts = async (userId) => {
  const { data } = await supabase.from('payouts').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10);
  return data || [];
};
