'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Features', href: '/#features' },
  { label: 'History', href: '/history' },
];

interface NavbarProps {
  onNavigate?: () => void;
}

export function Navbar({ onNavigate }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/');
    setOpen(false);
  };

  const handleNavClick = () => {
    if (onNavigate) onNavigate();
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
        <Link href="/" onClick={handleNavClick} className="flex items-center gap-3 text-slate-950">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 text-white shadow-lg">
            P
          </span>
          <div>
            <p className="text-lg font-semibold">Percepta AI</p>
            <p className="text-sm text-slate-500">Skin Intelligence</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
              onClick={handleNavClick}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {loading ? (
            <div className="text-sm text-slate-600">Loading...</div>
          ) : user ? (
            <>
              <Link href="/#analyze" className="rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                Analyze
              </Link>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-full bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50">
                Sign in
              </Link>
              <Link href="/signup" className="inline-flex items-center rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-pink-500/20 transition hover:-translate-y-0.5">
                Sign up
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </>
          )}
        </div>

        <button type="button" onClick={() => setOpen(!open)} className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 md:hidden">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-slate-200/70 bg-white/95 px-6 py-5 md:hidden">
          <div className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-3xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={handleNavClick}
              >
                {item.label}
              </Link>
            ))}
            {loading ? (
              <div className="text-sm text-slate-600 px-4 py-3">Loading...</div>
            ) : user ? (
              <>
                <Link href="/#analyze" className="rounded-3xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50" onClick={handleNavClick}>
                  Start Analysis
                </Link>
                <div className="px-4 py-3 text-sm font-medium text-slate-700">
                  {user.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-3xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-100 flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/#analyze" className="rounded-3xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50" onClick={handleNavClick}>
                  Start Analysis
                </Link>
                <Link href="/login" className="rounded-3xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50" onClick={handleNavClick}>
                  Sign in
                </Link>
                <Link href="/signup" className="rounded-3xl bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95" onClick={handleNavClick}>
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
