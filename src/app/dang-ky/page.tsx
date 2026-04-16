'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    } catch (err) {
      setError('Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const inp = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 transition-colors";

  return (
    <div className="min-h-screen bg-[#FFF7ED] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="w-10 h-10 bg-orange-500 rounded-xl mx-auto mb-3" />
          <h1 className="text-xl font-semibold text-gray-900">Tạo tài khoản</h1>
          <p className="text-sm text-gray-500 mt-1">Đăng ký để đặt cơm hàng ngày</p>
        </div>

        <form onSubmit={handleRegister} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Số điện thoại</label>
            <input type="tel" value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="0901234567"
              className={inp}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Mật khẩu</label>
            <input type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Ít nhất 6 ký tự"
              className={inp}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Xác nhận mật khẩu</label>
            <input type="password" value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Nhập lại mật khẩu"
              className={inp}
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
            {loading ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Đã có tài khoản?{' '}
          <Link href="/dang-nhap" className="text-orange-600 font-medium hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
