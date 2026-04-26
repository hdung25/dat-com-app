'use client';

import { useState, useMemo } from 'react';

interface OrderReport {
  id: string;
  menu_date: string;
  user_code: string;
  full_name: string;
  item_name: string;
  quantity: number;
  item_price: number;
  delivery_address: string;
  phone: string;
}

interface DishStat {
  name: string;
  totalQuantity: number;
  totalRevenue: number;
  percentage: number;
  orderCount: number;
}

export default function AdminReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [orders, setOrders] = useState<OrderReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders'>('overview');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (from) p.set('from', from);
      if (to) p.set('to', to);
      const res = await fetch(`/api/admin/reports?${p}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setSearched(true);
      setActiveTab('overview');
    } catch { alert('Lỗi tải báo cáo'); }
    finally { setLoading(false); }
  };

  const exportCSV = () => {
    const p = new URLSearchParams();
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    p.set('format', 'csv');
    window.open(`/api/admin/reports?${p}`, '_blank');
  };

  const stats = useMemo(() => {
    if (orders.length === 0) return null;

    const totalRevenue = orders.reduce((s, o) => s + (o.item_price * o.quantity), 0);
    const totalQuantity = orders.reduce((s, o) => s + o.quantity, 0);
    const totalOrders = orders.length;
    const uniqueCustomers = new Set(orders.map(o => o.user_code)).size;

    const dishMap = new Map<string, { totalQuantity: number; totalRevenue: number; orderCount: number }>();
    orders.forEach(o => {
      const existing = dishMap.get(o.item_name) || { totalQuantity: 0, totalRevenue: 0, orderCount: 0 };
      existing.totalQuantity += o.quantity;
      existing.totalRevenue += o.item_price * o.quantity;
      existing.orderCount += 1;
      dishMap.set(o.item_name, existing);
    });

    const dishStats: DishStat[] = Array.from(dishMap.entries())
      .map(([name, data]) => ({
        name,
        totalQuantity: data.totalQuantity,
        totalRevenue: data.totalRevenue,
        percentage: totalQuantity > 0 ? (data.totalQuantity / totalQuantity) * 100 : 0,
        orderCount: data.orderCount,
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity);

    return { totalRevenue, totalQuantity, totalOrders, uniqueCustomers, dishStats };
  }, [orders]);

  const shown = selectedCode ? orders.filter(o => o.user_code === selectedCode) : orders;
  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
  const fmtNum = (n: number) => new Intl.NumberFormat('vi-VN').format(n);
  const inp = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 transition-colors bg-white";

  const barColors = [
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Báo cáo</h1>
        <p className="text-sm text-gray-500">Doanh thu, món bán chạy và chi tiết đơn hàng</p>
      </div>

      {/* Bộ lọc ngày */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-36">
            <label className="block text-xs text-gray-500 mb-1">Từ ngày</label>
            <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={inp} />
          </div>
          <div className="flex-1 min-w-36">
            <label className="block text-xs text-gray-500 mb-1">Đến ngày</label>
            <input type="date" value={to} onChange={e => setTo(e.target.value)} className={inp} />
          </div>
          <div className="flex gap-2">
            <button onClick={fetchReports} disabled={loading}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors">
              {loading ? 'Đang tải...' : 'Xem báo cáo'}
            </button>
            {orders.length > 0 && (
              <button onClick={exportCSV}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
                Xuất CSV
              </button>
            )}
          </div>
        </div>
      </div>

      {searched && stats && (
        <>
          {/* === THỐNG KÊ TỔNG QUAN === */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Doanh thu</p>
              <p className="text-xl font-bold text-gray-900">{fmt(stats.totalRevenue)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Suất ăn</p>
              <p className="text-xl font-bold text-gray-900">{fmtNum(stats.totalQuantity)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Đơn hàng</p>
              <p className="text-xl font-bold text-gray-900">{fmtNum(stats.totalOrders)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Khách hàng</p>
              <p className="text-xl font-bold text-gray-900">{fmtNum(stats.uniqueCustomers)}</p>
            </div>
          </div>

          {/* Tab chuyển đổi */}
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'overview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Món bán chạy
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'orders'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Chi tiết đơn hàng
            </button>
          </div>

          {/* === TAB: MÓN BÁN CHẠY === */}
          {activeTab === 'overview' && stats.dishStats.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Xếp hạng món ăn</h3>
                <p className="text-xs text-gray-400 mt-0.5">Tỉ lệ % tính trên tổng số suất ăn đã đặt</p>
              </div>
              <div className="divide-y divide-gray-50">
                {stats.dishStats.map((dish, idx) => (
                  <div key={dish.name} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/60 transition-colors">
                    {/* Thứ hạng */}
                    <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx === 0
                        ? 'bg-orange-500 text-white'
                        : idx === 1
                        ? 'bg-gray-700 text-white'
                        : idx === 2
                        ? 'bg-amber-600 text-white'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {idx + 1}
                    </div>

                    {/* Tên & thanh tiến độ */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-sm font-medium truncate ${idx < 3 ? 'text-gray-900' : 'text-gray-600'}`}>
                          {dish.name}
                        </span>
                        <span className={`text-xs font-bold ml-3 shrink-0 ${idx < 3 ? 'text-gray-900' : 'text-gray-500'}`}>
                          {dish.percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${
                            idx < 3 ? barColors[idx] : 'bg-gray-300'
                          }`}
                          style={{ width: `${Math.max(dish.percentage, 1.5)}%` }}
                        />
                      </div>
                    </div>

                    {/* Số liệu */}
                    <div className="shrink-0 text-right min-w-[80px]">
                      <p className="text-xs font-semibold text-gray-900">{fmtNum(dish.totalQuantity)} suất</p>
                      <p className="text-[11px] text-gray-400">{fmt(dish.totalRevenue)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">Tổng <strong>{stats.dishStats.length}</strong> món</span>
                <span className="text-xs font-semibold text-gray-900">{fmt(stats.totalRevenue)}</span>
              </div>
            </div>
          )}

          {/* === TAB: CHI TIẾT ĐƠN HÀNG === */}
          {activeTab === 'orders' && (
            <>
              {selectedCode && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Đang lọc:</span>
                  <span className="font-mono text-xs font-medium bg-orange-50 text-orange-700 px-2 py-1 rounded">
                    {selectedCode}
                  </span>
                  <button onClick={() => setSelectedCode(null)}
                    className="text-xs text-gray-400 hover:text-gray-600">
                    Bỏ lọc
                  </button>
                </div>
              )}

              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{shown.length} đơn hàng</span>
                  {shown.length > 0 && (
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500">
                        Tổng {shown.reduce((s, o) => s + o.quantity, 0)} suất
                      </span>
                      <span className="text-xs font-semibold text-gray-900">
                        {fmt(shown.reduce((s, o) => s + o.item_price * o.quantity, 0))}
                      </span>
                    </div>
                  )}
                </div>
                {shown.length === 0 ? (
                  <div className="py-12 text-center text-sm text-gray-400">
                    Không có đơn hàng trong khoảng thời gian này
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {['Ngày', 'Mã', 'Họ tên', 'Món', 'SL', 'Giá', 'Thành tiền', 'Địa chỉ'].map((h, i) => (
                            <th key={i} className={`px-4 py-2.5 text-xs font-medium text-gray-500
                              ${i === 4 ? 'text-center' : i === 5 || i === 6 ? 'text-right' : 'text-left'}
                              ${i === 7 ? 'hidden lg:table-cell' : ''}`}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {shown.map((o) => (
                          <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{o.menu_date}</td>
                            <td className="px-4 py-2.5">
                              <button onClick={() => setSelectedCode(o.user_code === selectedCode ? null : o.user_code)}
                                className="font-mono text-xs font-medium text-orange-600 hover:underline">
                                {o.user_code}
                              </button>
                            </td>
                            <td className="px-4 py-2.5 text-gray-900">{o.full_name}</td>
                            <td className="px-4 py-2.5 text-gray-600">{o.item_name}</td>
                            <td className="px-4 py-2.5 text-center text-gray-900">{o.quantity}</td>
                            <td className="px-4 py-2.5 text-right text-gray-600 whitespace-nowrap">{fmt(o.item_price)}</td>
                            <td className="px-4 py-2.5 text-right text-gray-900 font-medium whitespace-nowrap">{fmt(o.item_price * o.quantity)}</td>
                            <td className="px-4 py-2.5 text-gray-400 text-xs hidden lg:table-cell truncate max-w-xs">{o.delivery_address}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {searched && orders.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-xl py-16 text-center">
          <p className="text-sm text-gray-400">Không có đơn hàng trong khoảng thời gian này</p>
        </div>
      )}
    </div>
  );
}
