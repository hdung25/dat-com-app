'use client';

import { useState, useEffect, useCallback } from 'react';

interface Order {
  id: string;
  user_code: string;
  full_name: string;
  phone: string;
  item_name: string;
  item_price: number;
  quantity: number;
  delivery_address: string;
  status: string;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Chờ xử lý', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  confirmed: { label: 'Đã xác nhận', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  completed: { label: 'Hoàn thành', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  cancelled: { label: 'Đã hủy', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
};

function getVietnamToday(): string {
  const now = new Date();
  const vn = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  return `${vn.getFullYear()}-${String(vn.getMonth() + 1).padStart(2, '0')}-${String(vn.getDate()).padStart(2, '0')}`;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

export default function AdminOrdersPage() {
  const today = getVietnamToday();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(today);
  const [filter, setFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = useCallback(async (d: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?date=${d}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchOrders(date); }, [date, fetchOrders]);

  // Auto-refresh every 30s
  useEffect(() => {
    const timer = setInterval(() => fetchOrders(date), 30000);
    return () => clearInterval(timer);
  }, [date, fetchOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    setUpdating(orderId);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchOrders(date);
      } else {
        alert(data.error);
      }
    } catch { alert('Lỗi cập nhật'); }
    finally { setUpdating(null); }
  };

  const filtered = filter === 'all'
    ? orders
    : orders.filter(o => (o.status || 'pending') === filter);

  const counts = {
    all: orders.length,
    pending: orders.filter(o => (o.status || 'pending') === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  };

  const totalRevenue = orders
    .filter(o => (o.status || 'pending') !== 'cancelled')
    .reduce((s, o) => s + o.item_price * o.quantity, 0);

  const totalQty = orders
    .filter(o => (o.status || 'pending') !== 'cancelled')
    .reduce((s, o) => s + o.quantity, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Nhận đơn</h1>
          <p className="text-sm text-gray-500">
            {date === today ? 'Hôm nay' : date} · {totalQty} suất · {fmt(totalRevenue)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white"
          />
          <button
            onClick={() => fetchOrders(date)}
            className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-center">
          <p className="text-lg font-extrabold text-amber-700">{counts.pending}</p>
          <p className="text-xs text-amber-600">Chờ xử lý</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-center">
          <p className="text-lg font-extrabold text-blue-700">{counts.confirmed}</p>
          <p className="text-xs text-blue-600">Đã xác nhận</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-center">
          <p className="text-lg font-extrabold text-green-700">{counts.completed}</p>
          <p className="text-xs text-green-600">Hoàn thành</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
          <p className="text-lg font-extrabold text-red-600">{counts.cancelled}</p>
          <p className="text-xs text-red-500">Đã hủy</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {[
          { key: 'all', label: `Tất cả (${counts.all})` },
          { key: 'pending', label: `Chờ (${counts.pending})` },
          { key: 'confirmed', label: `Xác nhận (${counts.confirmed})` },
          { key: 'completed', label: `Xong (${counts.completed})` },
          { key: 'cancelled', label: `Hủy (${counts.cancelled})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
              filter === tab.key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl py-14 text-center">
          <p className="text-sm text-gray-400">Không có đơn hàng</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(order => {
            const status = order.status || 'pending';
            const statusInfo = STATUS_MAP[status] || STATUS_MAP.pending;
            const isUpdating = updating === order.id;
            const time = order.created_at
              ? new Date(order.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div
                key={order.id}
                className={`bg-white border rounded-xl p-4 transition-all ${
                  status === 'cancelled' ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-orange-600">{order.user_code}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${statusInfo.bg} ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">{order.full_name}</p>
                    {order.phone && (
                      <p className="text-xs text-gray-400 mt-0.5">{order.phone}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{time}</span>
                </div>

                {/* Món + SL */}
                <div className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-800">{order.item_name}</span>
                    <span className="text-xs bg-gray-200 text-gray-600 rounded px-1.5 py-0.5 font-bold">x{order.quantity}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900">{fmt(order.item_price * order.quantity)}</span>
                </div>

                {/* Địa chỉ */}
                {order.delivery_address && (
                  <p className="text-xs text-gray-500 mb-3 flex items-start gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {order.delivery_address}
                  </p>
                )}

                {/* Action buttons */}
                {status !== 'completed' && status !== 'cancelled' && (
                  <div className="flex gap-2">
                    {status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(order.id, 'confirmed')}
                          disabled={isUpdating}
                          className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          {isUpdating ? '...' : 'Xác nhận'}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hủy đơn của ${order.full_name}? Suất sẽ được hoàn lại.`)) {
                              updateStatus(order.id, 'cancelled');
                            }
                          }}
                          disabled={isUpdating}
                          className="px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors"
                        >
                          Hủy
                        </button>
                      </>
                    )}
                    {status === 'confirmed' && (
                      <>
                        <button
                          onClick={() => updateStatus(order.id, 'completed')}
                          disabled={isUpdating}
                          className="flex-1 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          {isUpdating ? '...' : 'Đã xong'}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hủy đơn của ${order.full_name}? Suất sẽ được hoàn lại.`)) {
                              updateStatus(order.id, 'cancelled');
                            }
                          }}
                          disabled={isUpdating}
                          className="px-4 py-2 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors"
                        >
                          Hủy
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
