import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import logo from '@/assets/logo.jpg';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    // Supabase puts the recovery token in the URL hash.
    // Listening to onAuthStateChange picks up the SIGNED_IN event
    // that fires when Supabase exchanges the token automatically.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    // Also check if user already has a recovery session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    if (!password) { toast.error('Enter a new password'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }

    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast.success('Password updated successfully!');
      setTimeout(() => navigate('/'), 2500);
    } catch (e) {
      setError(e.message || 'Failed to reset password. The link may have expired — request a new one.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src={logo} alt="HP-Autos" className="h-14 w-auto object-contain" />
        </div>

        <Card className="shadow-2xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
            <h1 className="text-white font-bold text-xl">Set New Password</h1>
            <p className="text-white/80 text-sm">Choose a strong password for your HP-Autos account</p>
          </div>
          <CardContent className="p-6 space-y-5">
            {done ? (
              /* Success */
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Password Updated!</h2>
                <p className="text-slate-500 text-sm">Your password has been changed successfully. Redirecting you to the homepage...</p>
                <Button onClick={() => navigate('/')} className="w-full bg-amber-500 hover:bg-amber-600 text-white h-11">
                  Go to Homepage
                </Button>
              </div>
            ) : (
              <>
                {!sessionReady && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-800">Waiting for verification</p>
                      <p className="text-xs text-amber-700 mt-0.5">Make sure you opened this page from the reset link in your email. If you arrived here directly, go back to the app and request a new link.</p>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <div>
                  <Label className="text-slate-700">New Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="pl-10 pr-10"
                      autoFocus
                    />
                    <button onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label className="text-slate-700">Confirm New Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleReset()}
                      placeholder="Repeat new password"
                      className="pl-10"
                    />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                  {confirmPassword && password === confirmPassword && password.length >= 6 && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Passwords match</p>
                  )}
                </div>

                <Button
                  onClick={handleReset}
                  disabled={loading || !sessionReady}
                  className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
                </Button>

                <p className="text-center text-xs text-slate-400">
                  Link expired?{' '}
                  <button onClick={() => navigate('/')} className="text-amber-600 font-semibold hover:underline">
                    Request a new one
                  </button>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
