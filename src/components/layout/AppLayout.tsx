import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
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
  Eye,
  Shield,
  Wrench,
  Check,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { RoleBadge } from '../common/Badge';
import { ThemeToggle } from '../common/ThemeToggle';
import type { Role } from '../../types';

// Strict, explicit list of roles for the Admin perspective switcher
const ADMIN_ROLES: {
  role: Role;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    role: 'Admin',
    label: 'Admin',
    shortLabel: 'Admin',
    description: 'Full administrative access & all management controls',
    icon: Shield,
  },
  {
    role: 'Technician',
    label: 'Technician',
    shortLabel: 'Tech',
    description: 'Field ticket servicing & maintenance operations',
    icon: Wrench,
  },
  {
    role: 'Viewer',
    label: 'Viewer',
    shortLabel: 'Viewer',
    description: 'Read-only telemetry, asset status & ticket inspection',
    icon: Eye,
  },
];

export const AppLayout: React.FC = () => {
  const { realUser, isRealAdmin, previewRole, setRolePreview, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const location = useLocation();

  const roleSwitcherRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (roleSwitcherRef.current && !roleSwitcherRef.current.contains(target)) {
        setRoleSwitcherOpen(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(target)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setRoleSwitcherOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/tickets', label: 'Tickets', icon: TicketIcon },
    { to: '/assets', label: 'Assets', icon: Cpu },
    { to: '/sites', label: 'Sites', icon: Building2 },
  ];

  const currentRole: Role = previewRole || 'Admin';

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
                    Asset Tracker
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

            {/* Right: Theme Toggle, Role Perspective Switcher & User Profile */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Theme Toggle Button */}
              <ThemeToggle />

              {/* Role Perspective Picker (Visible ONLY when logged in as Admin) */}
              {isRealAdmin && (
                <div ref={roleSwitcherRef} className="relative hidden sm:block">
                  <button
                    id="admin-role-picker-button"
                    onClick={() => {
                      setRoleSwitcherOpen(!roleSwitcherOpen);
                      setUserDropdownOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-xs ${
                      previewRole
                        ? 'bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-500/15 dark:hover:bg-amber-500/25 border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-200'
                        : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800/90 dark:hover:bg-slate-700/90 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                    }`}
                    title="Switch perspective between Admin, Technician, and Viewer"
                    aria-label="Admin Role Switcher"
                    aria-expanded={roleSwitcherOpen}
                  >
                    {currentRole === 'Admin' && <Shield className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                    {currentRole === 'Technician' && <Wrench className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                    {currentRole === 'Viewer' && <Eye className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />}

                    <span className="text-slate-500 dark:text-slate-400 hidden lg:inline">Role:</span>
                    <span className="font-bold">
                      {currentRole === 'Technician' ? 'Tech' : currentRole}
                    </span>

                    {previewRole && (
                      <span className="text-[9px] uppercase px-1 py-0.2 bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold rounded">
                        Preview
                      </span>
                    )}

                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${roleSwitcherOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {roleSwitcherOpen && (
                    <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Role Perspective
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-500/30">
                            Admin Account
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Switch view as Admin, Tech, or Viewer
                        </p>
                      </div>

                      <div className="space-y-1">
                        {ADMIN_ROLES.map(({ role: r, label, shortLabel, description, icon: Icon }) => {
                          const isActive = currentRole === r;
                          return (
                            <button
                              key={r}
                              id={`role-picker-option-${r.toLowerCase()}`}
                              onClick={() => {
                                setRolePreview(r === 'Admin' ? null : r);
                                setRoleSwitcherOpen(false);
                              }}
                              className={`w-full flex items-start justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 shadow-xs'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div
                                  className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                                    isActive
                                      ? 'bg-sky-500 text-white shadow-xs'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                  }`}
                                >
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`text-xs font-bold ${
                                        isActive
                                          ? 'text-sky-700 dark:text-sky-300'
                                          : 'text-slate-800 dark:text-slate-200'
                                      }`}
                                    >
                                      {label}
                                    </span>
                                    {r === 'Technician' && (
                                      <span className="text-[10px] text-slate-400 font-medium">
                                        ({shortLabel})
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                                    {description}
                                  </p>
                                </div>
                              </div>
                              {isActive ? (
                                <span className="flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 shrink-0 ml-2 mt-0.5">
                                  <Check className="w-3.5 h-3.5" />
                                  Active
                                </span>
                              ) : (
                                <span className="text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0 ml-2 mt-0.5">
                                  Select
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* User Profile Pill */}
              <div ref={userDropdownRef} className="relative hidden sm:block">
                <button
                  id="user-profile-menu-button"
                  onClick={() => {
                    setUserDropdownOpen(!userDropdownOpen);
                    setRoleSwitcherOpen(false);
                  }}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                  aria-label="User menu"
                  aria-expanded={userDropdownOpen}
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                    {realUser?.name ? realUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[110px]">{realUser?.name}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
                      {isRealAdmin && previewRole ? `Admin (${previewRole === 'Technician' ? 'Tech' : previewRole})` : realUser?.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-xl dark:shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{realUser?.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{realUser?.email}</p>
                      <div className="mt-2 flex items-center gap-2">
                        {realUser?.role && <RoleBadge role={realUser.role} size="sm" />}
                        {previewRole && (
                          <span className="text-[10px] bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-1.5 py-0.5 rounded font-semibold">
                            Viewing: {previewRole === 'Technician' ? 'Tech' : previewRole}
                          </span>
                        )}
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

        {/* Admin Preview Mode Alert Banner */}
        {previewRole && isRealAdmin && (
          <div className="bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-300/60 dark:border-amber-500/30 px-4 py-2 text-xs flex items-center justify-between text-amber-900 dark:text-amber-200 backdrop-blur-sm">
            <div className="flex items-center gap-2 min-w-0">
              <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="truncate">
                <strong>Preview Mode:</strong> Viewing UI as <strong>{previewRole === 'Technician' ? 'Technician (Tech)' : previewRole}</strong>. Your Admin session is preserved.
              </span>
            </div>
            <button
              onClick={() => setRolePreview(null)}
              className="px-2.5 py-1 bg-amber-600/15 hover:bg-amber-600/25 text-amber-900 dark:text-amber-100 rounded-lg font-bold transition-colors cursor-pointer shrink-0 ml-2 border border-amber-300 dark:border-amber-500/30 text-[11px]"
            >
              Exit to Admin View
            </button>
          </div>
        )}

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
                    {realUser?.name ? realUser.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{realUser?.name}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{realUser?.email}</p>
                  </div>
                </div>
                {realUser?.role && <RoleBadge role={realUser.role} size="sm" />}
              </div>

              {/* Mobile Role Perspective Picker (Admin only: Admin, Tech, Viewer) */}
              {isRealAdmin && (
                <div className="space-y-1.5 my-2.5 p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                      Role Perspective (Admin):
                    </span>
                    <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">
                      {currentRole === 'Technician' ? 'Tech' : currentRole}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {ADMIN_ROLES.map(({ role: r, shortLabel, icon: Icon }) => {
                      const isSelected = currentRole === r;
                      return (
                        <button
                          key={r}
                          onClick={() => {
                            setRolePreview(r === 'Admin' ? null : r);
                            setMobileMenuOpen(false);
                          }}
                          className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold border text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-sky-50 dark:bg-sky-500/20 text-sky-600 dark:text-sky-300 border-sky-300 dark:border-sky-500/40 shadow-xs'
                              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <Icon className="w-4 h-4 mb-1" />
                          <span>{shortLabel}</span>
                        </button>
                      );
                    })}
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
