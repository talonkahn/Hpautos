import logo from '@/assets/logo.jpg';
import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Car, Eye, EyeOff, Loader2, Mail, Lock, User, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function AuthModal({ open, onClose, defaultTab = 'login', redirectMessage = '' }) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '', confirmPassword: '' });

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
      toast.success('Account created! Check your email to confirm your account, then sign in.');
      setTab('login');
    } catch (e) {
      toast.error(e.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 px-6 py-8 text-center">
          <div className="flex items-center justify-center mb-3">
            <img src={logo} alt="HP-Autos" className="h-14 w-auto object-contain" />
          </div>
          {redirectMessage && (
            <p className="text-amber-400 text-sm mt-2 bg-amber-500/10 rounded-lg px-3 py-1.5">{redirectMessage}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {['login', 'register'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${tab === t ? 'text-amber-600 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <div className="px-6 py-6">
          <AnimatePresence mode="wait">
            {tab === 'login' ? (
              <motion.div key="login" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                <div>
                  <Label className="text-slate-700">Email Address</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="email" value={form.email} onChange={e => set('email', e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      placeholder="you@example.com" className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-slate-700">Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type={showPass ? 'text' : 'password'} value={form.password}
                      onChange={e => set('password', e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      placeholder="Your password" className="pl-10 pr-10"
                    />
                    <button onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button onClick={handleLogin} disabled={loading} className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                </Button>
                <p className="text-center text-sm text-slate-500">
                  No account?{' '}
                  <button onClick={() => setTab('register')} className="text-amber-600 font-semibold hover:underline">Create one free</button>
                </p>
              </motion.div>
            ) : (
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
                    <Input
                      type={showPass ? 'text' : 'password'} value={form.password}
                      onChange={e => set('password', e.target.value)}
                      placeholder="Min. 6 characters" className="pl-10 pr-10"
                    />
                    <button onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-700">Confirm Password <span className="text-red-500">*</span></Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="password" value={form.confirmPassword}
                      onChange={e => set('confirmPassword', e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleRegister()}
                      placeholder="Repeat password" className="pl-10"
                    />
                  </div>
                </div>
                <Button onClick={handleRegister} disabled={loading} className="w-full h-12 bg-amber-500 hover:bg-amber-600 text-white font-semibold">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
                </Button>
                <p className="text-center text-xs text-slate-400">
                  By registering you agree to our terms. Your account is only needed to contact sellers on WhatsApp.
                </p>
                <p className="text-center text-sm text-slate-500">
                  Already have an account?{' '}
                  <button onClick={() => setTab('login')} className="text-amber-600 font-semibold hover:underline">Sign in</button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
