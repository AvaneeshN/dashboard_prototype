'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/store';
import { GlassCard } from '@/components/ui/GlassCard';
import { ParticleField } from '@/components/ui/ParticleField';
import { 
  Lock, 
  Mail, 
  User, 
  Phone, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Shield, 
  Users,
  Sparkles,
  ArrowUpRight,
  Building
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export const AuthGateway: React.FC = () => {
  const { login, register, submissions } = useStore();
  const router = useRouter();

  const [portalType, setPortalType] = useState<'client' | 'admin'>('client');
  const [authAction, setAuthAction] = useState<'signin' | 'register'>('signin');
  const [sweepDirection, setSweepDirection] = useState<number>(1);
  
  const [email, setEmail] = useState('alex@novatech.io');
  const [password, setPassword] = useState('password123');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handlePortalSwitch = (type: 'client' | 'admin') => {
    if (type === portalType) return;
    setSweepDirection(type === 'admin' ? 1 : -1);
    setPortalType(type);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (type === 'admin') {
      setAuthAction('signin');
      setEmail('admin@company.com');
      setPassword('admin123');
    } else {
      setEmail('alex@novatech.io');
      setPassword('password123');
    }
  };

  const handleActionSwitch = (action: 'signin' | 'register') => {
    if (action === authAction) return;
    setSweepDirection(action === 'register' ? 1 : -1);
    setAuthAction(action);
    setErrorMsg(null);
  };

  const handleQuickDemo = (role: 'client' | 'admin') => {
    if (role === 'admin') {
      handlePortalSwitch('admin');
      setEmail('admin@company.com');
      setPassword('admin123');
    } else {
      handlePortalSwitch('client');
      setEmail('alex@novatech.io');
      setPassword('password123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (portalType === 'client' && authAction === 'register') {
        if (!fullName || !email || !phone) {
          setErrorMsg('Please enter your full name, work email address, and contact phone number.');
          setIsLoading(false);
          return;
        }

        const res = await register({
          fullName,
          email,
          companyName: companyName.trim(),
          phone,
          password: password || 'default123'
        });

        if (res.success) {
          setSuccessMsg('Registration successful. Opening candidate intake form...');
          setTimeout(() => {
            router.push('/client?view=intake');
          }, 500);
        } else {
          setErrorMsg(res.error || 'Registration failed.');
        }
      } else {
        // Sign In
        const res = await login(email, portalType, password);
        if (res.success) {
          if (portalType === 'admin') {
            setSuccessMsg('Admin authenticated. Opening console...');
            setTimeout(() => {
              router.push('/admin');
            }, 500);
          } else {
            const normalized = email.trim().toLowerCase();
            const existingSub = submissions.find(s => s.client_email.toLowerCase() === normalized && s.status === 'submitted');
            
            if (existingSub) {
              setSuccessMsg('Authenticated. Loading your dashboard...');
              setTimeout(() => {
                router.push('/client');
              }, 500);
            } else {
              setSuccessMsg('Authenticated. Redirecting to your intake form...');
              setTimeout(() => {
                router.push('/client?view=intake');
              }, 500);
            }
          }
        } else {
          setErrorMsg(res.error || 'Invalid credentials or access unauthorized.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render-style smooth directional sweep variants with blur & cubic-bezier easing
  const renderSweepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 36 : -36,
      opacity: 0,
      scale: 0.98,
      filter: 'blur(8px)'
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        x: { type: 'spring' as const, stiffness: 400, damping: 32 },
        opacity: { duration: 0.28, ease: 'easeOut' as const },
        scale: { duration: 0.28, ease: 'easeOut' as const },
        filter: { duration: 0.25 }
      }
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -36 : 36,
      opacity: 0,
      scale: 0.98,
      filter: 'blur(8px)',
      transition: {
        duration: 0.2,
        ease: 'easeIn' as const
      }
    })
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] w-full flex items-center justify-center py-12 px-4 sm:px-6 bg-[#fafafa] text-zinc-900 overflow-hidden font-sans">
      
      {/* Interactive Canvas */}
      <ParticleField />

      <div className="relative z-10 w-full max-w-[430px]">
        
        {/* 1. Header Typography */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-xl leading-none">✦</span>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Management Portal
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 leading-tight">
            Enterprise <br />
            <span className="text-zinc-800">apprentice intake</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-2 max-w-xs mx-auto">
            Direct DBT subsidy claiming, candidate quota tracking, and monthly reconciliation console.
          </p>
        </div>

        {/* 2. Switcher Positioned ABOVE the Login Dialog Box */}
        <div className="relative p-1 rounded-full bg-zinc-200/80 border border-zinc-300/80 flex items-center mb-4 shadow-sm backdrop-blur-sm">
          <button
            type="button"
            onClick={() => handlePortalSwitch('client')}
            className={`relative z-10 flex-1 py-2 text-xs font-bold transition-colors text-center cursor-pointer rounded-full flex items-center justify-center gap-1.5 ${
              portalType === 'client' ? 'text-black' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Client Access</span>
          </button>

          <button
            type="button"
            onClick={() => handlePortalSwitch('admin')}
            className={`relative z-10 flex-1 py-2 text-xs font-bold transition-colors text-center cursor-pointer rounded-full flex items-center justify-center gap-1.5 ${
              portalType === 'admin' ? 'text-black' : 'text-zinc-500 hover:text-zinc-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Access</span>
          </button>

          {/* Animated Toggle Pill with Render-style spring */}
          <motion.div
            layoutId="portalSweepPill"
            className="absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-white border border-zinc-300 shadow-sm"
            style={{
              left: portalType === 'client' ? '4px' : 'calc(50%)'
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          />
        </div>

        {/* 3. Render-Style Card Sweep Transition */}
        <div className="relative">
          <AnimatePresence mode="wait" custom={sweepDirection}>
            <motion.div
              key={portalType}
              custom={sweepDirection}
              variants={renderSweepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="relative rounded-3xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-zinc-200/90 bg-white"
            >
              {/* Luminous Render Sweep Leading-Edge Sheen */}
              <motion.div
                initial={{ x: sweepDirection > 0 ? '-100%' : '100%', opacity: 0 }}
                animate={{ x: sweepDirection > 0 ? '100%' : '-100%', opacity: [0, 0.6, 0.6, 0] }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-zinc-900/5 to-transparent pointer-events-none z-20"
              />

              <div className="p-7">
                {/* Client Sub-action Tabs (Sign In vs Register) */}
                {portalType === 'client' && (
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3.5 mb-5">
                    <span className="text-[11px] font-mono font-bold tracking-wider text-zinc-500 uppercase">
                      {authAction === 'signin' ? 'SIGN IN TO WORKSPACE' : 'CREATE NEW ACCOUNT'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleActionSwitch(authAction === 'signin' ? 'register' : 'signin')}
                      className="text-xs text-black hover:underline font-bold cursor-pointer transition-colors"
                    >
                      {authAction === 'signin' ? 'Register ↗' : 'Sign in ↗'}
                    </button>
                  </div>
                )}

                {/* Feedback Alerts */}
                {errorMsg && (
                  <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs animate-shake">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="mb-4 p-3.5 rounded-2xl bg-zinc-100 border border-zinc-300 flex items-start gap-2.5 text-zinc-800 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-black shrink-0 mt-0.5" />
                    <span className="font-medium">{successMsg}</span>
                  </div>
                )}

                {/* Form Fields */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  
                  {/* Registration Full Name */}
                  {portalType === 'client' && authAction === 'register' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">
                          Full Name *
                        </label>
                        <div className="relative">
                          <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Alex Rivera"
                            className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black focus:bg-white transition-all font-medium"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 mb-1">
                          Company / Organization Name
                        </label>
                        <div className="relative">
                          <Building className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="e.g. Acme Corp / NovaTech"
                            className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black focus:bg-white transition-all font-medium"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-zinc-700 mb-1">
                      {portalType === 'admin' ? 'Administrator Email *' : 'Work Email Address *'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={portalType === 'admin' ? 'admin@company.com' : 'alex@novatech.io'}
                        className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-zinc-700">
                        Password *
                      </label>
                      {portalType === 'client' && authAction === 'signin' && (
                        <span className="text-[11px] text-zinc-400 hover:text-black cursor-pointer transition-colors font-medium">
                          Forgot?
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Phone (Mandatory for register) */}
                  {portalType === 'client' && authAction === 'register' && (
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 mb-1">
                        Contact Phone Number *
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 00000"
                          className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black focus:bg-white transition-all font-medium"
                        />
                      </div>
                    </div>
                  )}

                  {/* Pill Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-3 py-3 px-6 rounded-full text-xs font-bold bg-black text-white hover:bg-zinc-800 shadow-md cursor-pointer transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="uppercase tracking-wider">
                          {portalType === 'admin'
                            ? 'LOG IN AS ADMIN'
                            : authAction === 'register'
                            ? 'CREATE ACCOUNT'
                            : 'LOG IN TO WORKSPACE'}
                        </span>
                        <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                      </>
                    )}
                  </button>

                </form>

                {/* Quick Demo Fill Buttons */}
                <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-mono text-[11px]">Quick fill:</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDemo('client')}
                      className="px-3 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-semibold border border-zinc-200 transition-all cursor-pointer"
                    >
                      Client
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDemo('admin')}
                      className="px-3 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-[11px] font-semibold border border-zinc-200 transition-all cursor-pointer"
                    >
                      Admin
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Minimalist Footer Status */}
        <div className="mt-5 text-center text-[11px] font-mono text-zinc-400">
          * Encrypted session & biometric compliance guaranteed
        </div>

      </div>

    </div>
  );
};
