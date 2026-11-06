import React from 'react';
import { FlaskConical, ServerCrash } from 'lucide-react';
import { useRoqquHealth } from '@/lib/roqquClient';

export default function TestModeBanner() {
  const h = useRoqquHealth();
  if (!h) return null;
  if (h.mode === 'unreachable') return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex gap-2">
      <ServerCrash className="w-4 h-4 shrink-0 mt-0.5" />The payments API isn't reachable. Locally, run <code className="bg-red-100 px-1 rounded">npm run dev</code> (it serves /api); on Vercel, redeploy.
    </div>
  );
  if (h.mode === 'mock') return (
    <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-800 flex gap-2">
      <FlaskConical className="w-4 h-4 shrink-0 mt-0.5" />
      <span><b>Test mode.</b> Roqqu responses are simulated and deposit addresses are intentionally invalid, so no real money can move. Never send real funds to a test address.</span>
    </div>
  );
  return null;
}
