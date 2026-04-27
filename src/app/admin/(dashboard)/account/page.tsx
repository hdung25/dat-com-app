'use client';

import { useState, useEffect, useCallback } from 'react';

interface UserCode {
  code: string;
  full_name: string;
  phone: string;
  delivery_address: string;
  total_portions: number;
  used_portions: number;
  remaining_portions: number;
}

interface AdminSettings {
  admin_name: string;
  admin_email: string;
  notification_enabled: boolean;
}

export default function AdminAccountPage() {
  const [settings, setSettings] = useState<AdminSettings>({ admin_name: '', admin_email: '', notification_enabled: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  // User management
  const [users, setUsers] = useState<UserCode[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ code: '', full_name: '', phone: '', delivery_address: '', total_portions: '20' });
  const [creating, setCreating] = useState(false);
  const [editUser, setEditUser] = useState<UserCode | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', delivery_address: '', total_portions: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => { fetchSettings(); fetchUsers(); }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/account');
      const data = await res.json();
      setSettings({ admin_name: data.admin_name || '', admin_email: data.admin_email || '', notification_enabled: data.notification_enabled ?? true });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const fetchUsers = useCallback(async (q = '') => {
    setUsersLoading(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      setUsers(data.users || []);
    } catch { /* ignore */ }
    finally { setUsersLoading(false); }
  }, []);

  const saveSettings = async () => {
    setSaving(true); setSaved(false);
    try {
      const res = await fetch('/api/admin/account', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
      if ((await res.json()).success) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch { alert('Lỗi lưu'); }
    finally { setSaving(false); }
  };

  const changePassword = async () => {
    setPwError(''); setPwSuccess(false);
    if (!currentPw || !newPw) { setPwError('Vui lòng điền đủ'); return; }
    if (newPw.length < 6) { setPwError('Mật khẩu mới cần ít nhất 6 ký tự'); return; }
    if (newPw !== confirmPw) { setPwError('Mật khẩu xác nhận không khớp'); return; }
    setChangingPw(true);
    try {
      const r = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: currentPw }) });
      if (!(await r.json()).success) { setPwError('Mật khẩu hiện tại không đúng'); return; }
      setPwSuccess(true); setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch { setPwError('Lỗi'); }
    finally { setChangingPw(false); }
  };

  const createUser = async () => {
    if (!addForm.code || !addForm.full_name) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...addForm, total_portions: Number(addForm.total_portions) || 0 }) });
      const data = await res.json();
      if (data.success) { setAddForm({ code: '', full_name: '', phone: '', delivery_address: '', total_portions: '20' }); setShowAddForm(false); fetchUsers(); }
      else alert(data.error);
    } catch { alert('Lỗi tạo'); }
    finally { setCreating(false); }
  };

  const startEdit = (u: UserCode) => {
    setEditUser(u);
    setEditForm({ full_name: u.full_name, phone: u.phone, delivery_address: u.delivery_address, total_portions: String(u.total_portions) });
  };

  const saveEdit = async () => {
    if (!editUser) return;
    setEditSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${editUser.code}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: editForm.full_name, phone: editForm.phone, delivery_address: editForm.delivery_address, total_portions: Number(editForm.total_portions) }) });
      if ((await res.json()).success) { setEditUser(null); fetchUsers(); }
      else alert('Lỗi cập nhật');
    } catch { alert('Lỗi'); }
    finally { setEditSaving(false); }
  };

  const deleteUser = async (code: string) => {
    if (!confirm(`Xóa người dùng "${code}"? Hành động này không thể hoàn tác.`)) return;
    setDeleting(code);
    try {
      const res = await fetch(`/api/admin/users/${code}`, { method: 'DELETE' });
      if ((await res.json()).success) fetchUsers();
      else alert('Lỗi xóa');
    } catch { alert('Lỗi'); }
    finally { setDeleting(null); }
  };

  const inp = "w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-white";

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Quản lý tài khoản</h1>
        <p className="text-sm text-gray-500">Cài đặt thông tin, bảo mật & quản lý người dùng</p>
      </div>

      {/* Admin Profile */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-w-2xl">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div><h2 className="text-sm font-semibold text-gray-900">Thông tin cá nhân</h2><p className="text-xs text-gray-400">Cập nhật tên và email quản trị</p></div>
        </div>
        <div className="p-5 space-y-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Tên admin</label><input type="text" value={settings.admin_name} onChange={e => setSettings(s => ({ ...s, admin_name: e.target.value }))} className={inp} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Email</label><input type="email" value={settings.admin_email} onChange={e => setSettings(s => ({ ...s, admin_email: e.target.value }))} placeholder="admin@example.com" className={inp} /></div>
          <div className="flex items-center justify-between py-2">
            <div><p className="text-sm font-medium text-gray-800">Thông báo</p><p className="text-xs text-gray-400">Nhận thông báo khi có đơn mới</p></div>
            <button onClick={() => setSettings(s => ({ ...s, notification_enabled: !s.notification_enabled }))} className={`relative w-11 h-6 rounded-full transition-colors ${settings.notification_enabled ? 'bg-orange-500' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.notification_enabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={saveSettings} disabled={saving} className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors">{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
            {saved && <span className="text-xs text-green-600 font-medium">✓ Đã lưu</span>}
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden max-w-2xl">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-slate-600 to-slate-800 rounded-xl flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          </div>
          <div><h2 className="text-sm font-semibold text-gray-900">Bảo mật</h2><p className="text-xs text-gray-400">Đổi mật khẩu đăng nhập admin</p></div>
        </div>
        <div className="p-5 space-y-4">
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Mật khẩu hiện tại</label><input type="password" value={currentPw} onChange={e => { setCurrentPw(e.target.value); setPwError(''); }} className={inp} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Mật khẩu mới</label><input type="password" value={newPw} onChange={e => { setNewPw(e.target.value); setPwError(''); }} placeholder="Ít nhất 6 ký tự" className={inp} /></div>
          <div><label className="block text-xs font-medium text-gray-500 mb-1.5">Xác nhận</label><input type="password" value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setPwError(''); }} className={inp} /></div>
          {pwError && <p className="text-xs text-red-600 font-medium">{pwError}</p>}
          {pwSuccess && <p className="text-xs text-green-600 font-medium">✓ Xác nhận thành công</p>}
          <button onClick={changePassword} disabled={changingPw} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-colors">{changingPw ? 'Đang xử lý...' : 'Đổi mật khẩu'}</button>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
            </div>
            <div><h2 className="text-sm font-semibold text-gray-900">Quản lý người dùng</h2><p className="text-xs text-gray-400">{users.length} tài khoản</p></div>
          </div>
          <button onClick={() => setShowAddForm(!showAddForm)} className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-lg transition-colors">{showAddForm ? 'Đóng' : '+ Thêm'}</button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-gray-50 flex gap-2">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchUsers(search)} placeholder="Tìm mã hoặc tên..." className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400" />
          <button onClick={() => fetchUsers(search)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg">Tìm</button>
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="px-5 py-4 border-b border-gray-100 bg-orange-50/50">
            <p className="text-sm font-medium text-gray-900 mb-3">Thêm người dùng mới</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="block text-xs text-gray-500 mb-1">Mã *</label><input type="text" value={addForm.code} onChange={e => setAddForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="TRANG-001" className={`${inp} font-mono`} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Họ tên *</label><input type="text" value={addForm.full_name} onChange={e => setAddForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Nguyễn Văn A" className={inp} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">SĐT</label><input type="text" value={addForm.phone} onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))} placeholder="0901234567" className={inp} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Số suất</label><input type="number" value={addForm.total_portions} onChange={e => setAddForm(p => ({ ...p, total_portions: e.target.value }))} className={inp} /></div>
              <div className="sm:col-span-2"><label className="block text-xs text-gray-500 mb-1">Địa chỉ giao</label><input type="text" value={addForm.delivery_address} onChange={e => setAddForm(p => ({ ...p, delivery_address: e.target.value }))} className={inp} /></div>
            </div>
            <button onClick={createUser} disabled={creating} className="mt-3 px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg">{creating ? 'Đang tạo...' : 'Tạo mã'}</button>
          </div>
        )}

        {/* Users table */}
        {usersLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Đang tải...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">Chưa có người dùng</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                {['Mã', 'Họ tên', 'SĐT', 'Địa chỉ', 'Suất', 'Còn', ''].map((h, i) => (
                  <th key={i} className={`px-4 py-2.5 text-xs font-medium text-gray-500 text-left ${i >= 4 ? 'text-center' : ''} ${i === 6 ? 'text-right' : ''} ${(i === 2 || i === 3) ? 'hidden lg:table-cell' : ''}`}>{h}</th>
                ))}
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.code} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs font-medium text-orange-600">{u.code}</td>
                    <td className="px-4 py-2.5 text-gray-900">{u.full_name}</td>
                    <td className="px-4 py-2.5 text-gray-500 hidden lg:table-cell">{u.phone}</td>
                    <td className="px-4 py-2.5 text-gray-500 hidden lg:table-cell text-xs max-w-[150px] truncate">{u.delivery_address}</td>
                    <td className="px-4 py-2.5 text-center text-gray-600">{u.total_portions}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${u.remaining_portions > 5 ? 'bg-green-50 text-green-700' : u.remaining_portions > 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>{u.remaining_portions}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => startEdit(u)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button onClick={() => deleteUser(u.code)} disabled={deleting === u.code} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Xóa">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Logout */}
      <div className="bg-white border border-red-200 rounded-xl p-5 max-w-2xl">
        <button onClick={() => { document.cookie = 'admin_session=; Max-Age=0; path=/'; window.location.href = '/admin'; }} className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-xl transition-colors">Đăng xuất</button>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setEditUser(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-1">Sửa người dùng</h3>
            <p className="text-xs text-gray-400 mb-4 font-mono">{editUser.code}</p>
            <div className="space-y-3">
              <div><label className="block text-xs text-gray-500 mb-1">Họ tên</label><input type="text" value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} className={inp} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">SĐT</label><input type="text" value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} className={inp} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Địa chỉ giao</label><input type="text" value={editForm.delivery_address} onChange={e => setEditForm(f => ({ ...f, delivery_address: e.target.value }))} className={inp} /></div>
              <div><label className="block text-xs text-gray-500 mb-1">Tổng suất</label><input type="number" value={editForm.total_portions} onChange={e => setEditForm(f => ({ ...f, total_portions: e.target.value }))} className={inp} /></div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEditUser(null)} className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 text-sm text-gray-700 rounded-xl">Hủy</button>
              <button onClick={saveEdit} disabled={editSaving} className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium rounded-xl">{editSaving ? 'Đang lưu...' : 'Lưu'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
