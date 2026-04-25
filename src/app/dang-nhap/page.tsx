'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { loginUser } from '@/lib/auth-client';
import { useUser } from '@/context/UserContext';

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useUser();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await loginUser(phone, password);
      if (data.success) {
        refresh();
        router.push('/');
      } else {
        setError(data.error || 'Sai số điện thoại hoặc mật khẩu');
      }
    } catch {
      setError('Sai số điện thoại hoặc mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50 flex items-center justify-center px-4 py-8">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-200/20 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-200/20 rounded-full translate-y-32 -translate-x-32 blur-3xl" />

      <div className="w-full max-w-sm relative animate-fade-in-up">

        {/* Logo + title */}
        <div className="mb-8 text-center">
          <div className="relative w-20 h-20 rounded-3xl overflow-hidden mx-auto mb-4 shadow-lg ring-4 ring-white">
            <Image src="/logo.png" alt="Super Chef Logo" fill className="object-cover" priority />
          </div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-cyan-700 to-sky-600 bg-clip-text text-transparent">
            Chào mừng trở lại!
          </h1>
          <p className="text-slate-500 text-sm mt-1">Đăng nhập vào tài khoản Super Chef</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className="bg-white/80 backdrop-blur-md rounded-3xl border border-white shadow-xl shadow-cyan-100/50 p-6 space-y-4"
        >
          {/* Phone */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 9a16 16 0 006 6l.36-.36a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
              </svg>
              Số điện thoại
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="0901 234 567"
              className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl
                focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 focus:bg-white
                transition-all text-slate-800 placeholder:text-slate-300"
              autoFocus
            />
          </div>

          {/* Password */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Mật khẩu
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 pr-11 bg-slate-50 border-2 border-slate-100 rounded-2xl
                  focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 focus:bg-white
                  transition-all text-slate-800 placeholder:text-slate-300"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-600 transition-colors p-1"
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 font-medium bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700
              disabled:opacity-60 text-white font-bold rounded-2xl transition-all duration-200
              shadow-md shadow-cyan-200/60 hover:shadow-lg btn-press
              flex items-center justify-center gap-2 mt-1"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin-custom" />
                Đang đăng nhập...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
                </svg>
                Đăng nhập
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          Chưa có tài khoản?{' '}
          <Link href="/dang-ky" className="text-cyan-600 font-bold hover:text-cyan-700 hover:underline transition-colors">
            Đăng ký ngay →
          </Link>
        </p>
      </div>
    </div>
  );
}
