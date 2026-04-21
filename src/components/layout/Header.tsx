'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import { logoutUser } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { phone, loading, refresh } = useUser();
  const router = useRouter();

  const handleLogout = async () => {
    await logoutUser();
    refresh();
    router.push('/dang-nhap');
  };

  return (
    <header className="sticky top-0 z-40 glass border-b border-cyan-100/80 shadow-sm shadow-cyan-900/5">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-md ring-2 ring-cyan-200/50 group-hover:ring-cyan-400/60 transition-all duration-200">
            <Image
              src="/logo.png"
              alt="CƠMCƠM Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-cyan-700 to-sky-600 bg-clip-text text-transparent">
            CƠMCƠM
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-3 text-sm font-medium">
          <Link
            href="/check"
            className="flex items-center gap-1.5 text-slate-600 hover:text-cyan-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-cyan-50"
          >
            {/* Search icon */}
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <span className="hidden sm:inline">Tra cứu</span>
          </Link>

          {!loading && (
            phone ? (
              <div className="flex items-center gap-2.5">
                <div className="hidden sm:flex items-center gap-1.5 bg-cyan-50 text-cyan-700 rounded-full px-3 py-1 text-xs font-semibold">
                  {/* User icon */}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                  {phone}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors text-sm px-2 py-1.5 rounded-lg hover:bg-red-50"
                >
                  {/* Logout icon */}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  <span className="hidden sm:inline">Thoát</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/dang-nhap"
                  className="text-slate-600 hover:text-cyan-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-cyan-50"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/dang-ky"
                  className="bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white px-4 py-1.5 rounded-full font-semibold transition-all duration-200 shadow-sm shadow-cyan-200 btn-press"
                >
                  Đăng ký
                </Link>
              </div>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
