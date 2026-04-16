'use client';

import React from 'react';
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
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900">
          <div className="w-6 h-6 bg-orange-500 rounded-md" />
          <span>Đặt Cơm</span>
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link href="/check" className="text-gray-600 hover:text-gray-900 transition-colors">
            Tra cứu
          </Link>
          {!loading && (
            phone ? (
              <div className="flex items-center gap-3">
                <span className="text-orange-600 font-mono text-xs hidden sm:inline-block">
                  {phone}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  Thoát
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/dang-nhap" className="text-gray-600 hover:text-gray-900 transition-colors">
                  Đăng nhập
                </Link>
                <Link href="/dang-ky" className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg transition-colors">
                  Đăng ký
                </Link>
              </div>
            )
          )}
        </div>
      </div>
    </header>
  );
}
