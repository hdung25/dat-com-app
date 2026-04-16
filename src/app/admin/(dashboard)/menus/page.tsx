'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Menu {
  date: string;
  cutoff_time: string;
  is_active: boolean;
}

export default function AdminMenusPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDate, setNewDate] = useState('');
  const [newCutoff, setNewCutoff] = useState('09:00');
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchMenus(); }, []);

  const fetchMenus = async () => {
    try {
      const res = await fetch('/api/admin/menus');
      const data = await res.json();
      setMenus(data.menus || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const createMenu = async () => {
    if (!newDate) return;
    setCreating(true);
    try {
      const res = await fetch('/api/admin/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: newDate, cutoff_time: newCutoff }),
      });
      const data = await res.json();
      if (data.success) { setNewDate(''); setShowForm(false); fetchMenus(); }
      else alert(data.error);
    } catch { alert('Lỗi tạo menu'); }
    finally { setCreating(false); }
  };

  const toggleActive = async (date: string, current: boolean) => {
    try {
      await fetch(`/api/admin/menus/${date}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !current }),
      });
      fetchMenus();
    } catch { alert('Lỗi cập nhật'); }
  };

  const deleteMenu = async (date: string) => {
    if (!confirm(`Xóa menu ngày ${date}?`)) return;
    try {
      await fetch(`/api/admin/menus/${date}`, { method: 'DELETE' });
      fetchMenus();
    } catch { alert('Lỗi xóa'); }
  };

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Thực đơn</h1>
          <p className="text-sm text-gray-500">Quản lý thực đơn theo ngày</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {showForm ? 'Đóng' : 'Tạo menu'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-900 mb-3">Tạo menu mới</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-36">
              <label className="block text-xs text-gray-500 mb-1">Ngày</label>
              <input type="date" value={newDate}
                onChange={e => setNewDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>
            <div className="w-32">
              <label className="block text-xs text-gray-500 mb-1">Giờ chốt</label>
              <input type="time" value={newCutoff}
                onChange={e => setNewCutoff(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>
            <div className="self-end">
              <button onClick={createMenu} disabled={creating}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {creating ? 'Đang tạo...' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {menus.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">
          Chưa có menu nào
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Ngày</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Giờ chốt</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Trạng thái</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {menus.map((menu) => (
                <tr key={menu.date} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{menu.date}</td>
                  <td className="px-4 py-3 text-gray-500">{menu.cutoff_time}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(menu.date, menu.is_active)}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors
                        ${menu.is_active
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${menu.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {menu.is_active ? 'Đang mở' : 'Đã tắt'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/admin/menus/${menu.date}`}
                        className="text-xs text-orange-600 hover:text-orange-800 font-medium"
                      >
                        Quản lý món
                      </Link>
                      <button onClick={() => deleteMenu(menu.date)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Xóa
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
  );
}
