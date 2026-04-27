'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';

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
}

function getVietnamToday(): string {
  const now = new Date();
  const vn = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const y = vn.getFullYear();
  const m = String(vn.getMonth() + 1).padStart(2, '0');
  const d = String(vn.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
const fmtNum = (n: number) => new Intl.NumberFormat('vi-VN').format(n);

const BAR_COLORS = [
  { bar: 'from-orange-500 to-amber-400', badge: 'bg-orange-500', text: 'text-orange-600' },
  { bar: 'from-slate-600 to-slate-500', badge: 'bg-slate-600', text: 'text-slate-600' },
  { bar: 'from-amber-600 to-yellow-500', badge: 'bg-amber-600', text: 'text-amber-700' },
];

export default function AdminReportsPage() {
  const today = getVietnamToday();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [orders, setOrders] = useState<OrderReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'orders'>('overview');

  const fetchReports = useCallback(async (f?: string, t?: string) => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (f) p.set('from', f);
      if (t) p.set('to', t);
      const res = await fetch(`/api/admin/reports?${p}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setActiveTab('overview');
      setSelectedCode(null);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  // Auto-load today on mount
  useEffect(() => { fetchReports(today, today); }, [fetchReports, today]);

  const exportCSV = () => {
    const p = new URLSearchParams();
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    p.set('format', 'csv');
    window.open(`/api/admin/reports?${p}`, '_blank');
  };

  const stats = useMemo(() => {
    if (orders.length === 0) return null;
    const totalRevenue = orders.reduce((s, o) => s + o.item_price * o.quantity, 0);
    const totalQty = orders.reduce((s, o) => s + o.quantity, 0);
    const uniqueCustomers = new Set(orders.map(o => o.user_code)).size;

    const dishMap = new Map<string, { totalQuantity: number; totalRevenue: number }>();
    orders.forEach(o => {
      const ex = dishMap.get(o.item_name) || { totalQuantity: 0, totalRevenue: 0 };
      ex.totalQuantity += o.quantity;
      ex.totalRevenue += o.item_price * o.quantity;
      dishMap.set(o.item_name, ex);
    });

    const dishStats: DishStat[] = Array.from(dishMap.entries())
      .map(([name, d]) => ({
        name,
        totalQuantity: d.totalQuantity,
        totalRevenue: d.totalRevenue,
        percentage: totalQty > 0 ? (d.totalQuantity / totalQty) * 100 : 0,
      }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity);

    return { totalRevenue, totalQty, uniqueCustomers, orderCount: orders.length, dishStats };
  }, [orders]);

  const shown = selectedCode ? orders.filter(o => o.user_code === selectedCode) : orders;

  // Detect if we're looking at today or a range
  const isToday = from === today && to === today;
  const rangeLabel = !from && !to ? 'Toàn bộ' : from === to ? from : `${from} → ${to}`;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Báo cáo</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading ? 'Đang tải...' : isToday ? 'Hôm nay' : rangeLabel}
          </p>
        </div>
        {orders.length > 0 && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Xuất CSV
          </button>
        )}
      </div>

      {/* ── KPI Cards ── */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl p-4 text-white shadow-sm shadow-orange-200">
            <p className="text-xs font-semibold text-white/75 uppercase tracking-wide mb-1">Doanh thu</p>
            <p className="text-2xl font-extrabold leading-none">{fmt(stats.totalRevenue)}</p>
            <div className="mt-2 flex items-center gap-1 text-white/70 text-xs">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
              </svg>
              Tổng thu
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Suất ăn</p>
            <p className="text-2xl font-extrabold text-gray-900 leading-none">{fmtNum(stats.totalQty)}</p>
            <div className="mt-2 flex items-center gap-1 text-gray-400 text-xs">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 11h18a9 9 0 01-18 0z"/><path d="M8 11V9a4 4 0 018 0v2"/>
              </svg>
              Đã đặt
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Đơn hàng</p>
            <p className="text-2xl font-extrabold text-gray-900 leading-none">{fmtNum(stats.orderCount)}</p>
            <div className="mt-2 flex items-center gap-1 text-gray-400 text-xs">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
              </svg>
              Giao dịch
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Khách hàng</p>
            <p className="text-2xl font-extrabold text-gray-900 leading-none">{fmtNum(stats.uniqueCustomers)}</p>
            <div className="mt-2 flex items-center gap-1 text-gray-400 text-xs">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/>
              </svg>
              Người đặt
            </div>
          </div>
        </div>
      ) : !loading && (
        <div className="bg-white border border-gray-200 rounded-xl py-14 text-center">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-500">Không có đơn hàng</p>
          <p className="text-xs text-gray-400 mt-1">Thử chọn khoảng thời gian khác bên dưới</p>
        </div>
      )}

      {/* ── Tabs khi có dữ liệu ── */}
      {stats && (
        <>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
            {(['overview', 'orders'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                  activeTab === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'overview' ? 'Món bán chạy' : 'Chi tiết đơn'}
              </button>
            ))}
          </div>

          {/* Món bán chạy */}
          {activeTab === 'overview' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">Xếp hạng món ăn</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Tỉ lệ % trên tổng suất ăn đã đặt</p>
                </div>
                <span className="text-xs text-gray-400 bg-gray-50 border border-gray-200 rounded-full px-3 py-1">
                  {stats.dishStats.length} món
                </span>
              </div>

              <div className="divide-y divide-gray-50">
                {stats.dishStats.map((dish, idx) => {
                  const color = BAR_COLORS[idx] || BAR_COLORS[2];
                  return (
                    <div key={dish.name} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50/60 transition-colors">
                      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx < 3 ? color.badge + ' text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {idx + 1}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`text-sm font-semibold truncate ${idx < 3 ? 'text-gray-900' : 'text-gray-600'}`}>
                            {dish.name}
                          </span>
                          <span className={`text-xs font-bold ml-3 shrink-0 ${idx < 3 ? color.text : 'text-gray-400'}`}>
                            {dish.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out ${
                              idx < 3 ? color.bar : 'from-gray-300 to-gray-200'
                            }`}
                            style={{ width: `${Math.max(dish.percentage, 2)}%` }}
                          />
                        </div>
                      </div>

                      <div className="shrink-0 text-right min-w-[90px]">
                        <p className="text-sm font-bold text-gray-900">{fmtNum(dish.totalQuantity)} suất</p>
                        <p className="text-xs text-gray-400">{fmt(dish.totalRevenue)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs text-gray-500">Tổng <strong>{stats.totalQty}</strong> suất</span>
                <span className="text-sm font-bold text-gray-900">{fmt(stats.totalRevenue)}</span>
              </div>
            </div>
          )}

          {/* Chi tiết đơn hàng */}
          {activeTab === 'orders' && (
            <>
              {selectedCode && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-500">Đang lọc:</span>
                  <span className="font-mono text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded font-medium">
                    {selectedCode}
                  </span>
                  <button onClick={() => setSelectedCode(null)} className="text-xs text-gray-400 hover:text-gray-600">
                    Bỏ lọc
                  </button>
                </div>
              )}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{shown.length} đơn hàng</span>
                  {shown.length > 0 && (
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-500">{shown.reduce((s, o) => s + o.quantity, 0)} suất</span>
                      <span className="text-xs font-semibold text-gray-900">
                        {fmt(shown.reduce((s, o) => s + o.item_price * o.quantity, 0))}
                      </span>
                    </div>
                  )}
                </div>
                {shown.length === 0 ? (
                  <div className="py-10 text-center text-sm text-gray-400">Không có đơn hàng</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {['Ngày', 'Mã', 'Họ tên', 'Món', 'SL', 'Thành tiền', 'Địa chỉ'].map((h, i) => (
                            <th key={i} className={`px-4 py-2.5 text-xs font-medium text-gray-500
                              ${i === 4 ? 'text-center' : i === 5 ? 'text-right' : 'text-left'}
                              ${i === 6 ? 'hidden lg:table-cell' : ''}`}>
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
                              <button
                                onClick={() => setSelectedCode(o.user_code === selectedCode ? null : o.user_code)}
                                className="font-mono text-xs font-medium text-orange-600 hover:underline"
                              >
                                {o.user_code}
                              </button>
                            </td>
                            <td className="px-4 py-2.5 text-gray-900">{o.full_name}</td>
                            <td className="px-4 py-2.5 text-gray-600">{o.item_name}</td>
                            <td className="px-4 py-2.5 text-center font-semibold text-gray-900">{o.quantity}</td>
                            <td className="px-4 py-2.5 text-right font-medium text-gray-900 whitespace-nowrap">
                              {fmt(o.item_price * o.quantity)}
                            </td>
                            <td className="px-4 py-2.5 text-gray-400 text-xs hidden lg:table-cell truncate max-w-xs">
                              {o.delivery_address}
                            </td>
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

      {/* ── Bộ lọc ngày (đặt DƯỚI) ── */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Lọc theo khoảng thời gian</p>
        <div className="flex flex-wrap gap-3 items-end">
          {/* Quick filters */}
          <div className="flex gap-2 flex-wrap">
            {[
              { label: 'Hôm nay', f: today, t: today },
              {
                label: 'Tuần này',
                f: (() => {
                  const d = new Date();
                  d.setDate(d.getDate() - d.getDay() + 1);
                  return d.toISOString().slice(0,10);
                })(),
                t: today,
              },
              {
                label: 'Tháng này',
                f: today.slice(0,8) + '01',
                t: today,
              },
              { label: 'Tất cả', f: '', t: '' },
            ].map(({ label, f, t }) => (
              <button
                key={label}
                onClick={() => {
                  setFrom(f); setTo(t);
                  fetchReports(f || undefined, t || undefined);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  from === f && to === t
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 flex flex-wrap gap-3 items-end min-w-0">
            <div className="flex-1 min-w-32">
              <label className="block text-xs text-gray-500 mb-1">Từ ngày</label>
              <input
                type="date" value={from}
                onChange={e => setFrom(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 transition-colors bg-white"
              />
            </div>
            <div className="flex-1 min-w-32">
              <label className="block text-xs text-gray-500 mb-1">Đến ngày</label>
              <input
                type="date" value={to}
                onChange={e => setTo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 transition-colors bg-white"
              />
            </div>
            <button
              onClick={() => fetchReports(from || undefined, to || undefined)}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              {loading ? 'Đang tải...' : 'Xem'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
