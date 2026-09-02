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
  Building,
  KeyRound,
  ArrowUpRight,
  Eye,
  EyeOff
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export const AuthGateway: React.FC = () => {
  const { login, register, submissions } = useStore();
  const router = useRouter();

  const [portalType, setPortalType] = useState<'client' | 'admin'>('client');
  const [authAction, setAuthAction] = useState<'signin' | 'register'>('signin');
  const [sweepDirection, setSweepDirection] = useState<number>(1);
  
  // Client Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Admin Passkey State
  const [adminPasskey, setAdminPasskey] = useState('');
  const [showPasskey, setShowPasskey] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handlePortalSwitch = (type: 'client' | 'admin') => {
    if (type === portalType) return;
    setSweepDirection(type === 'admin' ? 1 : -1);
    setPortalType(type);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleActionSwitch = (action: 'signin' | 'register') => {
    if (action === authAction) return;
    setSweepDirection(action === 'register' ? 1 : -1);
    setAuthAction(action);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (portalType === 'admin') {
        // Administrator Passkey Authentication
        if (!adminPasskey.trim()) {
          setErrorMsg('Please enter the administrator security passkey.');
          setIsLoading(false);
          return;
        }

        const res = await login('admin@company.com', 'admin', adminPasskey.trim());
        if (res.success) {
          setSuccessMsg('Passkey verified. Unlocking Administrator Console...');
          setTimeout(() => {
            router.push('/admin');
          }, 400);
        } else {
          setErrorMsg(res.error || 'Invalid administrator security passkey.');
        }
      } else if (authAction === 'register') {
        // Client Registration
        if (!fullName.trim() || !email.trim() || !phone.trim()) {
          setErrorMsg('Please enter your full name, work email address, and contact phone number.');
          setIsLoading(false);
          return;
        }

        const res = await register({
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          companyName: companyName.trim(),
          phone: phone.trim(),
          password: password || 'default123'
        });

        if (res.success) {
          setErrorMsg(null);
          setSuccessMsg(`📧 Verification email sent to ${email.trim().toLowerCase()}! Please check your inbox and click the verification link, then sign in below.`);
          setAuthAction('signin');
          setPassword('');
        } else {
          setErrorMsg(res.error || 'Registration failed.');
        }
      } else {
        // Client Sign In
        if (!email.trim() || !password) {
          setErrorMsg('Please enter your registered email and password.');
          setIsLoading(false);
          return;
        }

        const res = await login(email.trim().toLowerCase(), 'client', password);
        if (res.success) {
          const sub = res.submission;
          const isSubmitted = sub && (sub.status === 'submitted' || sub.status === 'under_review' || sub.status === 'approved');
          
          if (isSubmitted) {
            setSuccessMsg('Authenticated. Loading your quota dashboard...');
            setTimeout(() => {
              router.push('/client');
            }, 300);
          } else {
            setSuccessMsg('Authenticated. Loading your intake form...');
            setTimeout(() => {
              router.push('/client?view=intake');
            }, 300);
          }
        } else {
          setErrorMsg(res.error || 'Invalid credentials or user not found. Please register if new.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSweepVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 30 : -30,
      opacity: 0,
      scale: 0.98,
      filter: 'blur(6px)'
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        x: { type: 'spring' as const, stiffness: 400, damping: 32 },
        opacity: { duration: 0.25, ease: 'easeOut' as const },
        scale: { duration: 0.25, ease: 'easeOut' as const },
        filter: { duration: 0.22 }
      }
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -30 : 30,
      opacity: 0,
      scale: 0.98,
      filter: 'blur(6px)',
      transition: {
        x: { type: 'spring' as const, stiffness: 400, damping: 32 },
        opacity: { duration: 0.2, ease: 'easeIn' as const },
        filter: { duration: 0.18 }
      }
    })
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden bg-[#fafafa] font-sans">
      <ParticleField />

      <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center">
        
        {/* Header Branding */}
        <div className="text-center mb-6 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase text-zinc-600 bg-white border border-zinc-200 shadow-xs">
            <span>✦</span>
            <span>Management Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Enterprise apprentice intake
          </h1>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
            Direct DBT subsidy claiming, candidate quota tracking, and monthly reconciliation console.
          </p>
        </div>

        {/* Outer Glass Container */}
        <div className="w-full bg-white/90 backdrop-blur-xl border border-zinc-200/80 rounded-3xl p-6 sm:p-7 shadow-xl shadow-zinc-900/5">
          
          {/* Top Role Selector Pill Tabs */}
          <div className="p-1 rounded-full bg-zinc-100 border border-zinc-200/80 grid grid-cols-2 gap-1 mb-5">
            <button
              type="button"
              onClick={() => handlePortalSwitch('client')}
              className={`py-2 px-4 rounded-full text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                portalType === 'client'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Client Access</span>
            </button>

            <button
              type="button"
              onClick={() => handlePortalSwitch('admin')}
              className={`py-2 px-4 rounded-full text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer ${
                portalType === 'admin'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Passkey</span>
            </button>
          </div>

          {/* Form Content Area */}
          <AnimatePresence mode="wait" custom={sweepDirection}>
            <motion.div
              key={portalType + (portalType === 'client' ? authAction : 'admin')}
              custom={sweepDirection}
              variants={renderSweepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="w-full"
            >
              {portalType === 'admin' ? (
                /* ADMIN PASSKEY FORM */
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-center space-y-1.5">
                    <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center mx-auto shadow-xs">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <h3 className="text-xs font-bold text-zinc-900 uppercase font-mono tracking-wider">
                      Master Administrator Passkey
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      Enter the organization security passkey to access supervisor controls.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-zinc-600 uppercase font-mono tracking-wider">
                      Security Passkey *
                    </label>
                    <div className="relative">
                      <input
                        type={showPasskey ? 'text' : 'password'}
                        required
                        autoFocus
                        value={adminPasskey}
                        onChange={(e) => setAdminPasskey(e.target.value)}
                        placeholder="Enter master passkey..."
                        className="w-full pl-4 pr-10 py-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-sm placeholder-zinc-400 focus:outline-none focus:border-black focus:bg-white transition-all font-mono tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasskey(!showPasskey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer p-1"
                      >
                        {showPasskey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 py-3 px-6 rounded-full text-xs font-bold bg-black text-white hover:bg-zinc-800 shadow-md cursor-pointer transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="uppercase tracking-wider">UNLOCK ADMIN CONSOLE</span>
                        <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* CLIENT SIGN IN / REGISTER FORM */
                <div>
                  {/* Action Sub-Tab Bar */}
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-4">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-600">
                      {authAction === 'signin' ? 'Sign in to workspace' : 'Create client account'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleActionSwitch(authAction === 'signin' ? 'register' : 'signin')}
                      className="text-xs font-bold text-zinc-900 hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{authAction === 'signin' ? 'Register' : 'Sign in'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 mb-3">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-3">
                    {authAction === 'register' && (
                      <>
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-zinc-600">Full Name *</label>
                          <div className="relative">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                              type="text"
                              required
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="e.g. Alex Rivera"
                              className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black focus:bg-white transition-all font-medium"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-zinc-600">Company / Organization *</label>
                          <div className="relative">
                            <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                              type="text"
                              required
                              value={companyName}
                              onChange={(e) => setCompanyName(e.target.value)}
                              placeholder="e.g. NovaTech Solutions Pvt Ltd"
                              className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black focus:bg-white transition-all font-medium"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-zinc-600">Contact Phone Number *</label>
                          <div className="relative">
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
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
                      </>
                    )}

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-zinc-600">Work Email Address *</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@company.com"
                          className="w-full pl-10 pr-3 py-2.5 rounded-2xl bg-zinc-50 border border-zinc-200 text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-black focus:bg-white transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-zinc-600">Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
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
                            {authAction === 'register' ? 'CREATE WORKSPACE ACCOUNT' : 'LOG IN TO WORKSPACE'}
                          </span>
                          <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Minimalist Footer Status */}
        <div className="mt-5 text-center text-[11px] font-mono text-zinc-400">
          * Encrypted session & compliance validation guaranteed
        </div>

      </div>
    </div>
  );
};
