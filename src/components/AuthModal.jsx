import logo from '@/assets/logo.jpg';
import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { resetPassword } from '@/lib/supabase';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, Mail, Lock, User, Phone, CheckCircle2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// tab: 'login' | 'register' | 'forgot'
export default function AuthModal({ open, onClose, defaultTab = 'login', redirectMessage = '' }) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '', confirmPassword: '', resetEmail: '' });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLogin = async () => {
    if (!form.email || !form.password) { toast.error('Enter email and password'); return; }
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      onClose();
    } catch (e) {
      toast.error(e.message === 'Invalid login credentials' ? 'Wrong email or password' : e.message);
    } finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!form.email || !form.password || !form.fullName) { toast.error('Fill all required fields'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await register(form.email, form.password, form.fullName, form.phone);
      toast.success('Account created! Check your email to confirm, then sign in.');
      setTab('login');
    } catch (e) {
      toast.error(e.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleForgot = async () => {
    if (!form.resetEmail) { toast.error('Enter your email address'); return; }
    setLoading(true);
    try {
      await resetPassword(form.resetEmail.trim().toLowerCase());
      setResetSent(true);
    } catch (e) {
      toast.error(e.message || 'Failed to send reset email. Check the address and try again.');
    } finally { setLoading(false); }
  };

  const goBack = () => { setResetSent(false); setTab('login'); };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl w-[95vw] sm:w-full">

        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-6 py-7 text-center">
          <div className="flex items-center justify-center mb-2">
            <img src={logo} alt="HP-Autos" className="h-12 w-auto object-contain" />
          </div>
          {redirectMessage && (
            <p className="text-amber-400 text-xs sm:text-sm mt-2 bg-amber-500/10 rounded-lg px-3 py-1.5">{redirectMessage}</p>
          )}
        </div>

        {/* Tabs — only show for login/register, not forgot */}
        {tab !== 'forgot' && (
          <div className="flex border-b border-slate-100">
            {[['login', 'Sign In'], ['register', 'Create Account']].map(([t, label]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === t ? 'text-amber-600 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="px-6 py-5">
          <AnimatePresence mode="wait">

            {/* ── SIGN IN ─────────────────────────────────────────── */}
            {tab === 'login' && (
              <motion.div key="login" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                <div>
                  <Label className="text-slate-700">Email Address</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="you@example.com" className="pl-10" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-slate-700">Password</Label>
                    <button
                      onClick={() => { setResetSent(false); set('resetEmail', form.email); setTab('forgot'); }}
                      className="text-xs text-amber-600 hover:text-amber-700 font-medium hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="Your password" className="pl-10 pr-10" />
                    <button onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button onClick={handleLogin} disabled={loading} className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-semibold">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                </Button>
                <p className="text-center text-sm text-slate-500">
                  No account?{' '}
                  <button onClick={() => setTab('register')} className="text-amber-600 font-semibold hover:underline">Create one free</button>
                </p>
              </motion.div>
            )}

            {/* ── REGISTER ────────────────────────────────────────── */}
            {tab === 'register' && (
              <motion.div key="register" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                <div>
                  <Label className="text-slate-700">Full Name <span className="text-red-500">*</span></Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Your full name" className="pl-10" />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-700">Email Address <span className="text-red-500">*</span></Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" className="pl-10" />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-700">Phone / WhatsApp</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+2348012345678" className="pl-10" />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-700">Password <span className="text-red-500">*</span></Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min. 6 characters" className="pl-10 pr-10" />
                    <button onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-700">Confirm Password <span className="text-red-500">*</span></Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} onKeyDown={e => e.key === 'Enter' && handleRegister()} placeholder="Repeat password" className="pl-10" />
                  </div>
                </div>
                <Button onClick={handleRegister} disabled={loading} className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-semibold">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                </Button>
                <p className="text-center text-xs text-slate-400">By registering you agree to our terms.</p>
                <p className="text-center text-sm text-slate-500">
                  Already have an account?{' '}
                  <button onClick={() => setTab('login')} className="text-amber-600 font-semibold hover:underline">Sign in</button>
                </p>
              </motion.div>
            )}

            {/* ── FORGOT PASSWORD ──────────────────────────────────── */}
            {tab === 'forgot' && (
              <motion.div key="forgot" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">
                {!resetSent ? (
                  <>
                    <div className="text-center pb-1">
                      <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Lock className="w-7 h-7 text-amber-600" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900">Reset your password</h3>
                      <p className="text-sm text-slate-500 mt-1">Enter your email and we'll send you a reset link</p>
                    </div>
                    <div>
                      <Label className="text-slate-700">Email Address</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          type="email"
                          value={form.resetEmail}
                          onChange={e => set('resetEmail', e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleForgot()}
                          placeholder="you@example.com"
                          className="pl-10"
                          autoFocus
                        />
                      </div>
                    </div>
                    <Button onClick={handleForgot} disabled={loading} className="w-full h-11 bg-amber-500 hover:bg-amber-600 text-white font-semibold">
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                    </Button>
                    <button onClick={goBack} className="w-full flex items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors pt-1">
                      <ArrowLeft className="w-4 h-4" /> Back to Sign In
                    </button>
                  </>
                ) : (
                  /* Success state */
                  <div className="text-center py-4 space-y-4">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Check your email</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">
                      We sent a password reset link to<br />
                      <span className="font-semibold text-slate-900">{form.resetEmail}</span>
                    </p>
                    <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-3">
                      Click the link in the email to set a new password. Check your spam folder if you don't see it within a minute.
                    </p>
                    <Button onClick={goBack} variant="outline" className="w-full h-11 gap-2">
                      <ArrowLeft className="w-4 h-4" /> Back to Sign In
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
