'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { registerUser } from '@/lib/auth-client';
import { useUser } from '@/context/UserContext';

export default function RegisterPage() {
  const router = useRouter();
  const { refresh } = useUser();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone.match(/^(0|\+84)[0-9]{8,10}$/)) {
      setError('Số điện thoại không hợp lệ');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu ít nhất 6 ký tự');
      return;
    }
    if (password !== confirm) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      const data = await registerUser(phone, password);
      if (data.success) {
        refresh();
        router.push('/');
      } else {
        setError(data.error || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    } catch {
      setError('Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/) ? 3
    : 2;

  const strengthLabel = ['', 'Yếu', 'Trung bình', 'Mạnh'];
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-400'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50 flex items-center justify-center px-4 py-8">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-200/20 rounded-full -translate-y-32 translate-x-32 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-200/20 rounded-full translate-y-32 -translate-x-32 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-teal-100/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative animate-fade-in-up">

        {/* Logo + title */}
        <div className="mb-8 text-center">
          <div className="relative w-20 h-20 rounded-3xl overflow-hidden mx-auto mb-4 shadow-lg ring-4 ring-white">
            <Image src="/logo.png" alt="Super Chef Logo" fill className="object-cover" priority />
          </div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-cyan-700 to-sky-600 bg-clip-text text-transparent">
            Tạo tài khoản
          </h1>
          <p className="text-slate-500 text-sm mt-1">Đăng ký để đặt cơm hàng ngày</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleRegister}
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
                placeholder="Ít nhất 6 ký tự"
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
            {/* Password strength */}
            {password.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3].map(level => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        passwordStrength >= level ? strengthColor[passwordStrength] : 'bg-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-medium ${
                  passwordStrength === 1 ? 'text-red-500' :
                  passwordStrength === 2 ? 'text-amber-500' : 'text-emerald-600'
                }`}>
                  {strengthLabel[passwordStrength]}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className={`w-full px-4 py-3 pr-11 bg-slate-50 border-2 rounded-2xl
                  focus:outline-none focus:ring-2 focus:bg-white transition-all
                  text-slate-800 placeholder:text-slate-300
                  ${confirm.length > 0
                    ? confirm === password
                      ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-200'
                      : 'border-red-300 focus:border-red-400 focus:ring-red-200'
                    : 'border-slate-100 focus:border-cyan-500 focus:ring-cyan-200'
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-600 transition-colors p-1"
              >
                {showConfirm ? (
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
              {/* Match indicator */}
              {confirm.length > 0 && (
                <div className={`absolute right-10 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center ${
                  confirm === password ? 'bg-emerald-100' : 'bg-red-100'
                }`}>
                  {confirm === password ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="3">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  )}
                </div>
              )}
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
                Đang đăng ký...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
                Tạo tài khoản
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-5">
          Đã có tài khoản?{' '}
          <Link href="/dang-nhap" className="text-cyan-600 font-bold hover:text-cyan-700 hover:underline transition-colors">
            Đăng nhập ngay →
          </Link>
        </p>
      </div>
    </div>
  );
}
