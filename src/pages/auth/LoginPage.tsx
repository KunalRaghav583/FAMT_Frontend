import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Zap, Lock, Mail, Shield, Wrench, Eye, ArrowRight } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { ThemeToggle } from '../../components/common/ThemeToggle';
import type { Role } from '../../types';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { login, quickLoginAsRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axErr = err as { response?: { data?: { error?: string } } };
        setErrorMsg(axErr.response?.data?.error || 'Invalid email or password');
      } else {
        setErrorMsg('Failed to connect to backend server');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (role: Role) => {
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await quickLoginAsRole(role);
      navigate(from, { replace: true });
    } catch {
      setErrorMsg(`Could not log in as ${role}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-sky-500/30 transition-colors duration-200">
      {/* Top corner Theme Switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <ThemeToggle showLabel />
      </div>

      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        {/* Brand Icon & Heading */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-xl shadow-sky-500/25 mb-4">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Zap className="w-7 h-7 text-sky-400" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
            Sign In to <span className="bg-gradient-to-r from-sky-500 to-indigo-500 dark:from-sky-400 dark:to-indigo-400 bg-clip-text text-transparent">FAMT</span>
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Field Asset Maintenance & Lifecycle Tracker
          </p>
        </div>

        {/* 1-Click Test Role Accounts Section */}
        <div className="mt-8 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center mb-3">
            Quick 1-Click Evaluation Credentials
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleQuickLogin('Admin')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100/80 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/50 text-purple-700 dark:text-purple-200 transition-all cursor-pointer group disabled:opacity-50"
            >
              <Shield className="w-4 h-4 text-purple-500 dark:text-purple-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Admin</span>
              <span className="text-[10px] text-purple-600 dark:text-purple-400/80">Full Access</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleQuickLogin('Technician')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-200 transition-all cursor-pointer group disabled:opacity-50"
            >
              <Wrench className="w-4 h-4 text-amber-500 dark:text-amber-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Technician</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400/80">Workflow</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleQuickLogin('Viewer')}
              className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-cyan-50 hover:bg-cyan-100/80 dark:bg-cyan-950/40 dark:hover:bg-cyan-900/50 border border-cyan-200 dark:border-cyan-800/50 text-cyan-700 dark:text-cyan-200 transition-all cursor-pointer group disabled:opacity-50"
            >
              <Eye className="w-4 h-4 text-cyan-500 dark:text-cyan-400 mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-bold">Viewer</span>
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400/80">Read-Only</span>
            </button>
          </div>
        </div>

        {/* Card Form */}
        <div className="mt-5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl dark:shadow-2xl">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-200 text-xs sm:text-sm font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. admin@famt.dev"
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={submitting}
              className="w-full mt-2"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Need a new account?{' '}
              <Link to="/register" className="font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 transition-colors">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
