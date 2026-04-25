'use client';

import { useState, useEffect } from 'react';
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

interface LibraryDish {
  id: string;
  name: string;
  price: number;
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
  // Mode: 'library' = chọn từ thư viện, 'manual' = nhập tay
  const [addMode, setAddMode] = useState<'none' | 'library' | 'manual'>('none');
  const [libraryDishes, setLibraryDishes] = useState<LibraryDish[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [selectedDishes, setSelectedDishes] = useState<Set<string>>(new Set());
  const [maxQuantityMap, setMaxQuantityMap] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  // Manual form
  const [formData, setFormData] = useState({ name: '', price: '', max_quantity: '' });

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

  const openLibrary = async () => {
    setAddMode('library');
    setSelectedDishes(new Set());
    setMaxQuantityMap({});
    if (libraryDishes.length === 0) {
      setLibraryLoading(true);
      try {
        const res = await fetch('/api/admin/dishes');
        const data = await res.json();
        setLibraryDishes(data.dishes || []);
      } catch { /* ignore */ }
      finally { setLibraryLoading(false); }
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedDishes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addFromLibrary = async () => {
    if (selectedDishes.size === 0) return;
    setAdding(true);
    try {
      const toAdd = libraryDishes.filter(d => selectedDishes.has(d.id));
      // Already in menu?
      const existingNames = new Set(items.map(i => i.name.toLowerCase()));
      const filtered = toAdd.filter(d => !existingNames.has(d.name.toLowerCase()));

      if (filtered.length === 0) {
        alert('Các món đã chọn đều đã có trong menu này rồi.');
        setAdding(false);
        return;
      }

      await Promise.all(
        filtered.map(dish =>
          fetch(`/api/admin/menus/${menuId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: dish.name,
              price: dish.price,
              max_quantity: maxQuantityMap[dish.id] ? Number(maxQuantityMap[dish.id]) : null,
            }),
          })
        )
      );
      setAddMode('none');
      setSelectedDishes(new Set());
      fetchMenu();
    } catch {
      alert('Lỗi thêm món');
    } finally {
      setAdding(false);
    }
  };

  const addManual = async () => {
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
        setAddMode('none');
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
      alert('Lỗi xóa món');
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

        {/* Add buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => setAddMode(addMode === 'library' ? 'none' : 'library')}
            className="text-sm"
          >
            {addMode === 'library' ? 'Đóng' : '📚 Chọn từ thư viện'}
          </Button>
          <Button
            variant="primary"
            onClick={() => setAddMode(addMode === 'manual' ? 'none' : 'manual')}
          >
            {addMode === 'manual' ? 'Đóng' : '+ Nhập tay'}
          </Button>
        </div>
      </div>

      {/* Library picker */}
      {addMode === 'library' && (
        <Card className="p-5 mb-6 animate-slide-down">
          <h3 className="font-semibold mb-1">Chọn món từ thư viện</h3>
          <p className="text-xs text-text-secondary mb-4">
            Chọn một hoặc nhiều món, nhập số lượng tối đa nếu cần, rồi nhấn Thêm vào menu.
          </p>

          {libraryLoading ? (
            <div className="space-y-2">
              {[1,2,3].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : libraryDishes.length === 0 ? (
            <div className="text-center py-8 text-sm text-text-secondary">
              Thư viện chưa có món nào.{' '}
              <Link href="/admin/dishes" className="text-orange-600 hover:underline font-medium">
                Thêm món vào thư viện →
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-4 max-h-72 overflow-y-auto pr-1">
                {libraryDishes.map(dish => {
                  const alreadyAdded = items.some(i => i.name.toLowerCase() === dish.name.toLowerCase());
                  const isSelected = selectedDishes.has(dish.id);
                  return (
                    <div
                      key={dish.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors cursor-pointer
                        ${alreadyAdded
                          ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'border-orange-400 bg-orange-50'
                          : 'border-border hover:border-orange-200 bg-white'}`}
                      onClick={() => !alreadyAdded && toggleSelect(dish.id)}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-colors
                        ${isSelected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'}`}>
                        {isSelected && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-text-primary truncate">{dish.name}</p>
                        <p className="text-xs text-text-secondary">{dish.price > 0 ? formatPrice(dish.price) : 'Chưa có giá'}</p>
                      </div>
                      {alreadyAdded && (
                        <span className="text-xs text-gray-400 shrink-0">Đã có trong menu</span>
                      )}
                      {isSelected && !alreadyAdded && (
                        <div className="shrink-0" onClick={e => e.stopPropagation()}>
                          <input
                            type="number"
                            placeholder="SL tối đa"
                            value={maxQuantityMap[dish.id] || ''}
                            onChange={e => setMaxQuantityMap(prev => ({ ...prev, [dish.id]: e.target.value }))}
                            className="w-24 px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm text-text-secondary">
                  Đã chọn <strong>{selectedDishes.size}</strong> món
                </span>
                <Button
                  variant="primary"
                  loading={adding}
                  onClick={addFromLibrary}
                  className={selectedDishes.size === 0 ? 'opacity-50' : ''}
                >
                  Thêm vào menu
                </Button>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Manual form */}
      {addMode === 'manual' && (
        <Card className="p-5 mb-6 animate-slide-down">
          <h3 className="font-semibold mb-4">Thêm món mới (nhập tay)</h3>
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
            <Button variant="primary" loading={adding} onClick={addManual}>
              Thêm món
            </Button>
          </div>
        </Card>
      )}

      {/* Items list */}
      {items.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          <p className="text-4xl mb-3">🍽️</p>
          <p>Chưa có món nào. Chọn từ thư viện hoặc nhập tay.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center text-2xl">
                  {item.name.charAt(0)}
                </div>

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
