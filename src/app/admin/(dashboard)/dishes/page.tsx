'use client';

import { useState, useEffect } from 'react';

interface Dish {
  id: string;
  name: string;
  price: number;
}

export default function AdminDishesPage() {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editPrice, setEditPrice] = useState('');

  useEffect(() => { fetchDishes(); }, []);

  const fetchDishes = async () => {
    try {
      const res = await fetch('/api/admin/dishes');
      const data = await res.json();
      setDishes(data.dishes || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const createDish = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/admin/dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formName.trim(), price: Number(formPrice) || 0 }),
      });
      const data = await res.json();
      if (data.success) {
        setFormName(''); setFormPrice(''); setShowForm(false);
        fetchDishes();
      } else {
        alert(data.error);
      }
    } catch { alert('Lỗi thêm món'); }
    finally { setSaving(false); }
  };

  const startEdit = (dish: Dish) => {
    setEditId(dish.id);
    setEditName(dish.name);
    setEditPrice(String(dish.price));
  };

  const saveEdit = async (id: string) => {
    try {
      await fetch(`/api/admin/dishes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), price: Number(editPrice) || 0 }),
      });
      setEditId(null);
      fetchDishes();
    } catch { alert('Lỗi cập nhật'); }
  };

  const deleteDish = async (id: string, name: string) => {
    if (!confirm(`Xóa món "${name}" khỏi thư viện?`)) return;
    try {
      await fetch(`/api/admin/dishes/${id}`, { method: 'DELETE' });
      fetchDishes();
    } catch { alert('Lỗi xóa'); }
  };

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Thư viện món ăn</h1>
          <p className="text-sm text-gray-500">Tạo sẵn danh sách món — dùng lại khi tạo menu</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {showForm ? 'Đóng' : '+ Thêm món'}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-900 mb-3">Thêm món vào thư viện</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-48">
              <label className="block text-xs text-gray-500 mb-1">Tên món *</label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createDish()}
                placeholder="VD: Cơm sườn bì chả"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>
            <div className="w-36">
              <label className="block text-xs text-gray-500 mb-1">Giá (VNĐ)</label>
              <input
                type="number"
                value={formPrice}
                onChange={e => setFormPrice(e.target.value)}
                placeholder="35000"
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 transition-colors"
              />
            </div>
            <div className="self-end">
              <button
                onClick={createDish}
                disabled={saving || !formName.trim()}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {saving ? 'Đang lưu...' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dish list */}
      {dishes.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">
          Chưa có món nào trong thư viện. Thêm món để dùng lại khi tạo menu.
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Tên món</th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Giá</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {dishes.map((dish) => (
                <tr key={dish.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    {editId === dish.id ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-orange-300 rounded-lg focus:outline-none focus:border-orange-400"
                      />
                    ) : (
                      <span className="font-medium text-gray-900">{dish.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {editId === dish.id ? (
                      <input
                        type="number"
                        value={editPrice}
                        onChange={e => setEditPrice(e.target.value)}
                        className="w-28 px-2 py-1 text-sm border border-orange-300 rounded-lg focus:outline-none focus:border-orange-400"
                      />
                    ) : (
                      dish.price > 0
                        ? new Intl.NumberFormat('vi-VN').format(dish.price) + 'đ'
                        : '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editId === dish.id ? (
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => saveEdit(dish.id)}
                          className="text-xs text-green-600 hover:text-green-800 font-medium"
                        >Lưu</button>
                        <button
                          onClick={() => setEditId(null)}
                          className="text-xs text-gray-400 hover:text-gray-600"
                        >Hủy</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => startEdit(dish)}
                          className="text-xs text-orange-600 hover:text-orange-800 font-medium"
                        >Sửa</button>
                        <button
                          onClick={() => deleteDish(dish.id, dish.name)}
                          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                        >Xóa</button>
                      </div>
                    )}
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
