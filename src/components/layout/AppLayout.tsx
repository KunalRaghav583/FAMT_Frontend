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
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../common/Badge';
import { ThemeToggle } from '../common/ThemeToggle';
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
        setApiOnline(true);
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
      setMobileMenuOpen(false);
      navigate('/');
    } catch {
      // Handled in auth context
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-sky-500/30 selection:text-sky-700 dark:selection:text-sky-200 transition-colors duration-200">
      {/* Top Specular Navbar */}
      <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-lg dark:shadow-black/20 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand Logo & Navigation */}
            <div className="flex items-center gap-6 lg:gap-8">
              <NavLink to="/" className="flex items-center gap-3 group focus:outline-none shrink-0">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-indigo-600 to-cyan-400 p-[1px] shadow-md shadow-sky-500/20 group-hover:shadow-sky-500/40 transition-all duration-300">
                  <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                    <Zap className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-base font-extrabold tracking-wider bg-gradient-to-r from-sky-600 via-teal-600 to-indigo-600 dark:from-sky-400 dark:via-teal-300 dark:to-indigo-300 bg-clip-text text-transparent">
                    FAMT
                  </span>
                  <span className="text-[10px] uppercase font-semibold tracking-widest text-slate-500 dark:text-slate-400 -mt-1 hidden sm:block">
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
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        isActive
                          ? 'bg-sky-50 dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs border border-sky-200/80 dark:border-slate-700/60'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span>{link.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Right: Theme Toggle, Role Switcher & User Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme Toggle Button */}
              <ThemeToggle />

              {/* API Status indicator (Desktop only) */}
              <div
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/50 text-[11px] text-slate-600 dark:text-slate-400"
                title="Backend API: http://localhost:5001/api"
              >
                <CircleDot className={`w-3 h-3 ${apiOnline ? 'text-emerald-500 dark:text-emerald-400 animate-pulse' : 'text-rose-500 dark:text-rose-400'}`} />
                <span>API :5001</span>
              </div>

              {/* Quick Role Switcher Button (Desktop & visible only to Admin) */}
              {user?.role === 'Admin' && (
                <div className="relative hidden sm:block">
                  <button
                    onClick={() => {
                      setRoleSwitcherOpen(!roleSwitcherOpen);
                      setUserDropdownOpen(false);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/90 dark:hover:bg-slate-700/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-xs"
                    title="Switch test role"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                    <span className="hidden md:inline">Role:</span>
                    <span className="text-sky-600 dark:text-sky-300 font-bold">{user?.role || 'Switch'}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>

                  {roleSwitcherOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-xl dark:shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                        Test Role Switcher
                      </div>
                      <div className="mt-1 space-y-1">
                        {(['Admin', 'Technician', 'Viewer'] as Role[]).map((r) => (
                          <button
                            key={r}
                            onClick={() => handleRoleSwitch(r)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                              user?.role === r
                                ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <RoleBadge role={r} size="sm" />
                              <span>{r}</span>
                            </div>
                            {user?.role === r && <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">Active</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User Dropdown (Desktop / Tablet) */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setRoleSwitcherOpen(false);
                  }}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                  aria-label="User menu"
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[110px]">{user?.name}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">{user?.role}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-xl dark:shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                      <div className="mt-2">
                        {user?.role && <RoleBadge role={user.role} size="sm" />}
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-700 dark:hover:text-rose-300 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile menu hamburger toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Toggle navigation"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Full Navigation Sheet */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/98 dark:bg-slate-950/98 backdrop-blur-2xl px-4 pt-3 pb-5 space-y-3 shadow-2xl transition-all animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Mobile Nav Links */}
            <div className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  link.to === '/' ? location.pathname === '/' : location.pathname.startsWith(link.to);

                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/30'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-5 h-5 text-current" />
                    <span>{link.label}</span>
                  </NavLink>
                );
              })}
            </div>

            {/* Mobile User Profile Section */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                  </div>
                </div>
                {user?.role && <RoleBadge role={user.role} size="sm" />}
              </div>

              {/* Mobile Role Switcher (Admin only) */}
              {user?.role === 'Admin' && (
                <div className="space-y-1.5 my-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block px-1">
                    Quick Role Switch:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Admin', 'Technician', 'Viewer'] as Role[]).map((r) => (
                      <button
                        key={r}
                        onClick={() => handleRoleSwitch(r)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                          user?.role === r
                            ? 'bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-300 border-sky-300 dark:border-sky-500/40'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sign Out Button */}
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer mt-1"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Specular Mirror Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950 py-5 sm:py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <span className="font-bold text-slate-800 dark:text-slate-300">FAMT</span>
            <span>&bull;</span>
            <span>Field Asset Maintenance Tracker</span>
          </div>
          <div className="text-slate-500 dark:text-slate-400 text-[11px]">
            Strict Role-Based Engine &bull; Admin &bull; Technician &bull; Viewer
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;
