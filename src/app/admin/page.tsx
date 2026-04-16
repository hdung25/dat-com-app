'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/admin/dashboard');
      } else {
        setError(data.error || 'Sai mật khẩu');
      }
    } catch {
      setError('Lỗi kết nối');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f10] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="w-10 h-10 bg-orange-500 rounded-lg mb-4" />
          <h1 className="text-xl font-semibold text-white">Đặt Cơm</h1>
          <p className="text-zinc-500 text-sm mt-1">Đăng nhập vào trang quản trị</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoFocus
              className="w-full px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-sm
                placeholder:text-zinc-600 focus:outline-none focus:border-orange-500 transition-colors"
            />
            {error && (
              <p className="mt-1.5 text-xs text-red-400">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60
              text-white text-sm font-medium rounded-lg transition-colors"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-600">
          <a href="/" className="hover:text-zinc-400 transition-colors">Về trang người dùng</a>
        </p>
      </div>
    </div>
  );
}
