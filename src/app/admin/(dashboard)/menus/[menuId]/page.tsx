'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  max_quantity: number | null;
  ordered_count: number;
  is_available: boolean;
}

interface MenuInfo {
  date: string;
  cutoff_time: string;
  is_active: boolean;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

export default function AdminMenuDetailPage() {
  const params = useParams();
  const menuId = params.menuId as string;
  const [menu, setMenu] = useState<MenuInfo | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', price: '', max_quantity: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchMenu();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuId]);

  const fetchMenu = async () => {
    try {
      const res = await fetch(`/api/admin/menus/${menuId}`);
      const data = await res.json();
      setMenu(data.menu);
      setItems(data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addItem = async () => {
    if (!formData.name) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/admin/menus/${menuId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          price: Number(formData.price) || 0,
          max_quantity: formData.max_quantity ? Number(formData.max_quantity) : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFormData({ name: '', price: '', max_quantity: '' });
        setShowForm(false);
        fetchMenu();
      } else {
        alert(data.error);
      }
    } catch {
      alert('Lỗi thêm món');
    } finally {
      setAdding(false);
    }
  };

  const toggleItem = async (itemId: string, currentAvailable: boolean) => {
    try {
      await fetch(`/api/admin/menus/${menuId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: !currentAvailable }),
      });
      fetchMenu();
    } catch {
      alert('Lỗi cập nhật');
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!confirm('Xóa món này?')) return;
    try {
      await fetch(`/api/admin/menus/${menuId}/items/${itemId}`, { method: 'DELETE' });
      fetchMenu();
    } catch {
      alert('Lỗi xóa mon');
    }
  };

  if (loading) {
    return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 skeleton rounded-2xl" />)}</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <Link href="/admin/menus" className="text-text-secondary hover:text-primary transition-colors text-sm">
          ← Thực đơn
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Menu {menuId}</h1>
          {menu && (
            <p className="text-text-secondary text-sm flex items-center gap-2 mt-1">
              Chốt lúc {menu.cutoff_time}
              <Badge variant={menu.is_active ? 'success' : 'gray'}>
                {menu.is_active ? 'Hoạt động' : 'Tắt'}
              </Badge>
            </p>
          )}
        </div>
        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Đóng' : '+ Thêm món'}
        </Button>
      </div>

      {/* Add item form */}
      {showForm && (
        <Card className="p-5 mb-6 animate-slide-down">
          <h3 className="font-semibold mb-4">Thêm món mới</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1">Tên món *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="VD: Cơm sườn bì chả"
                className="w-full px-3 py-2 border-2 border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Giá (VNĐ)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="35000"
                  className="w-full px-3 py-2 border-2 border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Số lượng tối đa</label>
                <input
                  type="number"
                  value={formData.max_quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_quantity: e.target.value }))}
                  placeholder="Không giới hạn"
                  className="w-full px-3 py-2 border-2 border-border rounded-lg focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>
            <Button variant="primary" loading={adding} onClick={addItem}>
              Thêm món
            </Button>
          </div>
        </Card>
      )}

      {/* Items list */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          <p className="text-4xl mb-3">🍽️</p>
          <p>Chưa có món nào trong menu này.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center text-2xl">
                  {item.name.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-text-primary truncate">{item.name}</h4>
                  <p className="text-sm text-primary font-bold">{formatPrice(item.price)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {item.max_quantity && (
                      <span className="text-xs text-text-secondary">
                        Đã đặt: {item.ordered_count || 0}/{item.max_quantity}
                      </span>
                    )}
                    <Badge variant={item.is_available ? 'success' : 'danger'} size="sm">
                      {item.is_available ? 'Còn hàng' : 'Hết hàng'}
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleItem(item.id, item.is_available)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${item.is_available ? 'bg-success' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${item.is_available ? 'translate-x-5' : ''}`} />
                  </button>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
