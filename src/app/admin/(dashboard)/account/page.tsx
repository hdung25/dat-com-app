'use client';

import { useState, useEffect } from 'react';

interface AdminSettings {
  admin_name: string;
  admin_email: string;
  notification_enabled: boolean;
}

export default function AdminAccountPage() {
  const [settings, setSettings] = useState<AdminSettings>({
    admin_name: '',
    admin_email: '',
    notification_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Change password
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/account');
      const data = await res.json();
      setSettings({
        admin_name: data.admin_name || '',
        admin_email: data.admin_email || '',
        notification_enabled: data.notification_enabled ?? true,
      });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const saveSettings = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch('/api/admin/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch { alert('Lỗi lưu cài đặt'); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    setPwError('');
    setPwSuccess(false);

    if (!currentPw || !newPw) {
      setPwError('Vui lòng điền đủ mật khẩu');
      return;
    }
    if (newPw.length < 6) {
      setPwError('Mật khẩu mới cần ít nhất 6 ký tự');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('Mật khẩu xác nhận không khớp');
      return;
    }

    setChangingPw(true);
    try {
      // Verify current password
      const loginRes = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: currentPw }),
      });
      const loginData = await loginRes.json();
      if (!loginData.success) {
        setPwError('Mật khẩu hiện tại không đúng');
        return;
      }

      // Save new password to settings (for reference, actual env var can't be changed)
      await fetch('/api/admin/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password_hint: 'Đã đổi lần cuối: ' + new Date().toLocaleString('vi-VN') }),
      });

      setPwSuccess(true);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => setPwSuccess(false), 5000);
    } catch {
      setPwError('Lỗi hệ thống');
    } finally {
      setChangingPw(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Bạn chắc chắn muốn đăng xuất?')) {
      document.cookie = 'admin_session=; Max-Age=0; path=/';
      window.location.href = '/admin';
    }
  };

  const inp = "w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-white";

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 bg-gray-100 rounded animate-pulse" />
        {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Quản lý tài khoản</h1>
        <p className="text-sm text-gray-500">Cài đặt thông tin và bảo mật</p>
      </div>

      {/* Profile section */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Thông tin cá nhân</h2>
            <p className="text-xs text-gray-400">Cập nhật tên và email quản trị</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Tên admin</label>
            <input
              type="text"
              value={settings.admin_name}
              onChange={e => setSettings(s => ({ ...s, admin_name: e.target.value }))}
              placeholder="Tên admin"
              className={inp}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label>
            <input
              type="email"
              value={settings.admin_email}
              onChange={e => setSettings(s => ({ ...s, admin_email: e.target.value }))}
              placeholder="admin@example.com"
              className={inp}
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-800">Thông báo</p>
              <p className="text-xs text-gray-400">Nhận thông báo khi có đơn mới</p>
            </div>
            <button
              onClick={() => setSettings(s => ({ ...s, notification_enabled: !s.notification_enabled }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                settings.notification_enabled ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.notification_enabled ? 'translate-x-5' : ''
              }`} />
            </button>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={saveSettings}
              disabled={saving}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            {saved && (
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5"/>
                </svg>
                Đã lưu
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Security section */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Bảo mật</h2>
            <p className="text-xs text-gray-400">Đổi mật khẩu đăng nhập admin</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Mật khẩu hiện tại</label>
            <input
              type="password"
              value={currentPw}
              onChange={e => { setCurrentPw(e.target.value); setPwError(''); }}
              placeholder="••••••"
              className={inp}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Mật khẩu mới</label>
            <input
              type="password"
              value={newPw}
              onChange={e => { setNewPw(e.target.value); setPwError(''); }}
              placeholder="Ít nhất 6 ký tự"
              className={inp}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={confirmPw}
              onChange={e => { setConfirmPw(e.target.value); setPwError(''); }}
              placeholder="Nhập lại mật khẩu mới"
              className={inp}
            />
          </div>

          {pwError && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {pwError}
            </p>
          )}

          {pwSuccess && (
            <p className="text-xs text-green-600 font-medium flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Xác nhận mật khẩu thành công. Lưu ý: mật khẩu thực tế thay đổi qua biến môi trường trên Vercel.
            </p>
          )}

          <button
            onClick={changePassword}
            disabled={changingPw}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors"
          >
            {changingPw ? 'Đang xử lý...' : 'Đổi mật khẩu'}
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white border border-red-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-red-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-red-800">Phiên đăng nhập</h2>
            <p className="text-xs text-red-400">Đăng xuất khỏi trang admin</p>
          </div>
        </div>

        <div className="p-5">
          <button
            onClick={handleLogout}
            className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
