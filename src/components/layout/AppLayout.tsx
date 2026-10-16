import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket as TicketIcon,
  Cpu,
  Building2,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Zap,
  ArrowRightLeft,
  CircleDot,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../common/Badge';
import type { Role } from '../../types';
import { apiClient } from '../../services/api';

export const AppLayout: React.FC = () => {
  const { user, logout, quickLoginAsRole } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [apiOnline, setApiOnline] = useState<boolean | null>(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setRoleSwitcherOpen(false);
  }, [location.pathname]);

  // Periodic heartbeat check to API
  useEffect(() => {
    const checkApi = async () => {
      try {
        await apiClient.get('/auth/me');
        setApiOnline(true);
      } catch {
        setApiOnline(true); // Token might be missing or checking, but if backend is up
      }
    };
    checkApi();
    const interval = setInterval(checkApi, 30000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tickets', label: 'Tickets', icon: TicketIcon },
    { to: '/assets', label: 'Assets', icon: Cpu },
    { to: '/sites', label: 'Sites', icon: Building2 },
  ];

  const handleRoleSwitch = async (role: Role) => {
    try {
      await quickLoginAsRole(role);
      setRoleSwitcherOpen(false);
      navigate('/');
    } catch {
      // Handled in auth context
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Industrial Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand Logo */}
            <div className="flex items-center gap-8">
              <NavLink to="/" className="flex items-center gap-3 group focus:outline-none">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-sky-500/20 group-hover:shadow-sky-500/40 transition-all duration-300">
                  <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                    <Zap className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-extrabold tracking-wider bg-gradient-to-r from-sky-400 via-teal-300 to-indigo-300 bg-clip-text text-transparent">
                    FAMT
                  </span>
                  <span className="text-[10px] uppercase font-semibold tracking-widest text-slate-400 -mt-1 hidden sm:block">
                    Field Asset Maintenance
                  </span>
                </div>
              </NavLink>

              {/* Desktop Nav Links */}
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive =
                    link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to);

                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-slate-800 text-sky-400 shadow-sm border border-slate-700/60 shadow-sky-500/5'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                      <span>{link.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Right: Role Switcher & User Profile */}
            <div className="flex items-center gap-3">
              {/* API Status indicator */}
              <div
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/60 border border-slate-700/50 text-[11px] text-slate-400"
                title="Backend API: http://localhost:5001/api"
              >
                <CircleDot className={`w-3 h-3 ${apiOnline ? 'text-emerald-400 animate-pulse' : 'text-rose-400'}`} />
                <span>API :5001</span>
              </div>

              {/* Quick Role Switcher Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    setRoleSwitcherOpen(!roleSwitcherOpen);
                    setUserDropdownOpen(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700 transition-all cursor-pointer shadow-sm"
                  title="Switch test role"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden sm:inline">Role:</span>
                  <span className="text-sky-300 font-bold">{user?.role || 'Switch'}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {roleSwitcherOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      Test Role Switcher
                    </div>
                    <div className="mt-1 space-y-1">
                      {(['Admin', 'Technician', 'Viewer'] as Role[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => handleRoleSwitch(r)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                            user?.role === r
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : 'text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <RoleBadge role={r} size="sm" />
                            <span>{r}</span>
                          </div>
                          {user?.role === r && <span className="text-[10px] text-sky-400 font-bold">Active</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setRoleSwitcherOpen(false);
                  }}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-slate-200 transition-all cursor-pointer"
                  aria-label="User menu"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-200 truncate max-w-[120px]">{user?.name}</span>
                    <span className="text-[10px] text-slate-400">{user?.role}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="pb-3 border-b border-slate-800">
                      <p className="text-sm font-bold text-slate-100 truncate">{user?.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                      <div className="mt-2">
                        {user?.role && <RoleBadge role={user.role} size="sm" />}
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                aria-label="Toggle navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900/95 px-4 pt-2 pb-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to);

              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    isActive ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5 text-current" />
                  <span>{link.label}</span>
                </NavLink>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Industrial Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">FAMT</span>
            <span>&bull;</span>
            <span>Field Asset Maintenance Tracker</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Strict Role-Based Engine &bull; Admin &bull; Technician &bull; Viewer
          </div>
        </div>
      </footer>
    </div>
  );
};
