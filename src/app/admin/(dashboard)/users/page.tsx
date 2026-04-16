'use client';

import { useState, useEffect } from 'react';

interface UserCode {
  code: string;
  full_name: string;
  phone: string;
  delivery_address: string;
  total_portions: number;
  used_portions: number;
  remaining_portions: number;
}

interface PendingUser {
  id: string;
  phone: string;
  registered_at: string;
  linked_code: string | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserCode[]>([]);
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ code: '', full_name: '', phone: '', delivery_address: '', total_portions: '20' });
  const [editUser, setEditUser] = useState<UserCode | null>(null);
  const [addPortions, setAddPortions] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async (q = '') => {
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      setUsers(data.users || []);
      setPending(data.pending || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const createUser = async () => {
    if (!form.code || !form.full_name) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, total_portions: Number(form.total_portions) || 0 }),
      });
      const data = await res.json();
      if (data.success) {
        setForm({ code: '', full_name: '', phone: '', delivery_address: '', total_portions: '20' });
        setShowForm(false);
        fetchUsers();
      } else alert(data.error);
    } catch { alert('Lỗi tạo mã'); }
    finally { setCreating(false); }
  };

  const handleTopUp = async () => {
    if (!editUser || !addPortions) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${editUser.code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ add_portions: Number(addPortions) }),
      });
      const data = await res.json();
      if (data.success) { setEditUser(null); setAddPortions(''); fetchUsers(); }
      else alert(data.error);
    } catch { alert('Lỗi cập nhật'); }
    finally { setSaving(false); }
  };

  const handleLinkPending = async (phone: string, code: string) => {
    if (!code) return;
    try {
      const res = await fetch('/api/admin/users/link-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchUsers();
      } else {
        alert(data.error || 'Lỗi gán mã');
      }
    } catch { alert('Lỗi gán mã'); }
  };

  const inp = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 transition-colors";

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  );

  const pendingUnlinked = pending.filter(p => !p.linked_code);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Mã người dùng</h1>
          <p className="text-sm text-gray-500">{users.length} mã trong hệ thống</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors">
          {showForm ? 'Đóng' : 'Tạo mã'}
        </button>
      </div>

      <div className="flex gap-2">
        <input type="text" value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchUsers(search)}
          placeholder="Tìm theo mã hoặc tên..."
          className={inp}
        />
        <button onClick={() => fetchUsers(search)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
          Tìm
        </button>
      </div>

      {pendingUnlinked.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-orange-100 flex items-center justify-between">
            <span className="text-sm font-medium text-orange-900">Chờ gán mã ({pendingUnlinked.length})</span>
          </div>
          <div className="divide-y divide-orange-100">
            {pendingUnlinked.map(pu => (
              <div key={pu.id} className="flex items-center justify-between px-4 py-3">
                <div className="text-sm text-orange-900 font-medium">SĐT: {pu.phone}</div>
                <div className="flex gap-2">
                  <input type="text"
                    placeholder="Nhập mã (VD: TRANG-001)"
                    className={inp + " w-48 bg-white"}
                    id={`link-code-${pu.id}`}
                  />
                  <button
                    onClick={() => {
                      const inputEl = document.getElementById(`link-code-${pu.id}`) as HTMLInputElement;
                      handleLinkPending(pu.phone, inputEl?.value);
                    }}
                    className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Gán mã
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-900 mb-3">Tạo mã mới</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'code', label: 'Mã *', placeholder: 'TRANG-001', mono: true },
              { key: 'full_name', label: 'Họ tên *', placeholder: 'Nguyễn Văn A' },
              { key: 'phone', label: 'Số điện thoại', placeholder: '0901234567' },
              { key: 'total_portions', label: 'Số suất', placeholder: '20' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                <input
                  type={f.key === 'total_portions' ? 'number' : 'text'}
                  value={form[f.key as keyof typeof form]}
                  onChange={e => setForm(p => ({
                    ...p,
                    [f.key]: f.key === 'code' ? e.target.value.toUpperCase() : e.target.value
                  }))}
                  placeholder={f.placeholder}
                  className={`${inp} ${f.mono ? 'font-mono' : ''}`}
                />
              </div>
            ))}
            <div className="sm:col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Địa chỉ giao</label>
              <input type="text" value={form.delivery_address}
                onChange={e => setForm(p => ({ ...p, delivery_address: e.target.value }))}
                placeholder="123 Nguyễn Huệ, Q1, TP.HCM"
                className={inp}
              />
            </div>
          </div>
          <div className="mt-3">
            <button onClick={createUser} disabled={creating}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              {creating ? 'Đang tạo...' : 'Tạo mã'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Mã', 'Họ tên', 'SĐT', 'Tổng', 'Đã dùng', 'Còn lại', ''].map((h, i) => (
                  <th key={i} className={`px-4 py-2.5 text-xs font-medium text-gray-500 ${i >= 3 && i <= 5 ? 'text-center' : i === 6 ? 'text-right' : 'text-left'} ${i === 2 ? 'hidden md:table-cell' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">Chưa có mã nào</td></tr>
              ) : users.map((user) => (
                <tr key={user.code} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-xs font-medium text-orange-600">{user.code}</td>
                  <td className="px-4 py-2.5 text-gray-900">{user.full_name}</td>
                  <td className="px-4 py-2.5 text-gray-500 hidden md:table-cell">{user.phone}</td>
                  <td className="px-4 py-2.5 text-center text-gray-600">{user.total_portions}</td>
                  <td className="px-4 py-2.5 text-center text-gray-600">{user.used_portions}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium
                      ${user.remaining_portions > 5 ? 'bg-green-50 text-green-700' :
                        user.remaining_portions > 0 ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-600'}`}>
                      {user.remaining_portions}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => { setEditUser(user); setAddPortions(''); }}
                      className="text-xs text-orange-600 hover:text-orange-800 font-medium">
                      Nạp suất
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {editUser && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setEditUser(null)}>
          <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-xl"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-gray-900 mb-0.5">Nạp thêm suất</h3>
            <p className="text-xs text-gray-500 mb-4">
              {editUser.full_name} · {editUser.code} · Còn {editUser.remaining_portions} suất
            </p>
            <label className="block text-xs text-gray-500 mb-1">Số suất thêm vào</label>
            <input type="number" value={addPortions}
              onChange={e => setAddPortions(e.target.value)}
              placeholder="10" min="1" autoFocus
              className={`${inp} mb-4`}
            />
            <div className="flex gap-2">
              <button onClick={() => setEditUser(null)}
                className="flex-1 py-2 border border-gray-200 hover:bg-gray-50 text-sm text-gray-700 rounded-lg transition-colors">
                Hủy
              </button>
              <button onClick={handleTopUp} disabled={saving}
                className="flex-1 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
                {saving ? 'Đang lưu...' : 'Nạp suất'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
