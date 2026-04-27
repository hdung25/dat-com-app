'use client';

import { useState, useEffect, useCallback } from 'react';

interface OrderItem {
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
  menu_item_id: string;
  menu_date: string;
  session_id: string;
}

interface Session {
  session_id: string;
  user_code: string;
  full_name: string;
  phone: string;
  delivery_address: string;
  created_at: string;
  items: OrderItem[];
  totalAmount: number;
  totalQty: number;
  status: string; // aggregated
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Chờ xử lý', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  confirmed: { label: 'Đã xác nhận', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  completed: { label: 'Hoàn thành', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  cancelled: { label: 'Đã hủy', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  item_unavailable: { label: 'Hết món', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
};

function getVietnamToday(): string {
  const now = new Date();
  const vn = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  return `${vn.getFullYear()}-${String(vn.getMonth() + 1).padStart(2, '0')}-${String(vn.getDate()).padStart(2, '0')}`;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

function groupToSessions(orders: OrderItem[]): Session[] {
  const map = new Map<string, OrderItem[]>();

  for (const o of orders) {
    // Use session_id if available, otherwise group by user_code + close timestamp (legacy orders)
    const key = o.session_id || `legacy-${o.user_code}-${o.created_at?.slice(0, 16)}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(o);
  }

  const sessions: Session[] = [];
  for (const [sid, items] of map) {
    const first = items[0];
    // Session status = worst status (pending > confirmed > completed)
    const statuses = items.map(i => i.status || 'pending');
    let status = 'completed';
    if (statuses.includes('pending')) status = 'pending';
    else if (statuses.includes('confirmed')) status = 'confirmed';
    else if (statuses.includes('item_unavailable')) status = 'item_unavailable';
    else if (statuses.every(s => s === 'cancelled')) status = 'cancelled';

    sessions.push({
      session_id: sid,
      user_code: first.user_code,
      full_name: first.full_name,
      phone: first.phone,
      delivery_address: first.delivery_address,
      created_at: first.created_at,
      items,
      totalAmount: items.filter(i => i.status !== 'cancelled').reduce((s, i) => s + i.item_price * i.quantity, 0),
      totalQty: items.filter(i => i.status !== 'cancelled').reduce((s, i) => s + i.quantity, 0),
      status,
    });
  }

  sessions.sort((a, b) => {
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
    return tb - ta;
  });

  return sessions;
}

export default function AdminOrdersPage() {
  const today = getVietnamToday();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(today);
  const [filter, setFilter] = useState<string>('all');
  const [updating, setUpdating] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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
      if (data.success) fetchOrders(date);
      else alert(data.error);
    } catch { alert('Lỗi cập nhật'); }
    finally { setUpdating(null); }
  };

  const updateSessionStatus = async (session: Session, status: string) => {
    setUpdating(session.session_id);
    try {
      const activeItems = session.items.filter(i => i.status !== 'cancelled');
      for (const item of activeItems) {
        await fetch('/api/admin/orders', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: item.id, status }),
        });
      }
      fetchOrders(date);
    } catch { alert('Lỗi cập nhật'); }
    finally { setUpdating(null); }
  };

  const markSoldOut = async (itemName: string, menuItemId: string) => {
    if (!confirm(`Báo hết món "${itemName}"?`)) return;
    try {
      const res = await fetch('/api/admin/sold-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuDate: date, menuItemId, reason: `Món "${itemName}" đã hết.` }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Đã báo hết! ${data.affected_orders} đơn bị ảnh hưởng.`);
        fetchOrders(date);
      } else alert(data.error);
    } catch { alert('Lỗi'); }
  };

  const toggleExpand = (sid: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid); else next.add(sid);
      return next;
    });
  };

  const sessions = groupToSessions(orders);
  const filteredSessions = filter === 'all'
    ? sessions
    : sessions.filter(s => s.status === filter);

  const counts = {
    all: sessions.length,
    pending: sessions.filter(s => s.status === 'pending').length,
    confirmed: sessions.filter(s => s.status === 'confirmed').length,
    completed: sessions.filter(s => s.status === 'completed').length,
    cancelled: sessions.filter(s => s.status === 'cancelled').length,
  };

  const totalRevenue = sessions.filter(s => s.status !== 'cancelled').reduce((s, se) => s + se.totalAmount, 0);
  const totalQty = sessions.filter(s => s.status !== 'cancelled').reduce((s, se) => s + se.totalQty, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Nhận đơn</h1>
          <p className="text-sm text-gray-500">{date === today ? 'Hôm nay' : date} · {sessions.length} đơn · {totalQty} suất · {fmt(totalRevenue)}</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 bg-white" />
          <button onClick={() => fetchOrders(date)} className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { count: counts.pending, label: 'Chờ xử lý', bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', sub: 'text-amber-600' },
          { count: counts.confirmed, label: 'Đã xác nhận', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', sub: 'text-blue-600' },
          { count: counts.completed, label: 'Hoàn thành', bg: 'bg-green-50 border-green-200', text: 'text-green-700', sub: 'text-green-600' },
          { count: counts.cancelled, label: 'Đã hủy', bg: 'bg-red-50 border-red-200', text: 'text-red-600', sub: 'text-red-500' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} border rounded-xl px-4 py-3 text-center`}>
            <p className={`text-lg font-extrabold ${s.text}`}>{s.count}</p>
            <p className={`text-xs ${s.sub}`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg overflow-x-auto">
        {[
          { key: 'all', label: `Tất cả (${counts.all})` },
          { key: 'pending', label: `Chờ (${counts.pending})` },
          { key: 'confirmed', label: `Xác nhận (${counts.confirmed})` },
          { key: 'completed', label: `Xong (${counts.completed})` },
          { key: 'cancelled', label: `Hủy (${counts.cancelled})` },
        ].map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${filter === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Sessions */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-36 bg-gray-100 rounded-xl animate-pulse" />)}</div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl py-14 text-center">
          <p className="text-sm text-gray-400">Không có đơn hàng</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map(session => {
            const statusInfo = STATUS_MAP[session.status] || STATUS_MAP.pending;
            const isUpdating = updating === session.session_id;
            const isExpanded = expanded.has(session.session_id);
            const time = session.created_at ? new Date(session.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';

            return (
              <div key={session.session_id} className={`bg-white border rounded-xl overflow-hidden transition-all ${session.status === 'cancelled' ? 'opacity-60' : ''}`}>
                {/* Session header — clickable */}
                <div className="p-4 cursor-pointer hover:bg-gray-50/50 transition-colors" onClick={() => toggleExpand(session.session_id)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-mono text-xs font-bold text-orange-600">{session.user_code}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusInfo.bg} ${statusInfo.color}`}>{statusInfo.label}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">{session.items.length} món</span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">{session.full_name}</p>
                      {session.phone && <p className="text-xs text-gray-400 mt-0.5">{session.phone}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">{time}</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">{fmt(session.totalAmount)}</p>
                    </div>
                  </div>

                  {/* Items preview (collapsed) */}
                  {!isExpanded && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {session.items.map(item => (
                        <span key={item.id} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg border ${item.status === 'cancelled' ? 'bg-red-50 border-red-200 text-red-500 line-through' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                          {item.item_name} <span className="font-bold">×{item.quantity}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Expand arrow */}
                  <div className="flex items-center justify-center mt-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {/* Address */}
                    {session.delivery_address && (
                      <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex items-start gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" className="shrink-0 mt-0.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        <span className="text-xs text-gray-500">{session.delivery_address}</span>
                      </div>
                    )}

                    {/* Items list */}
                    <div className="divide-y divide-gray-50">
                      {session.items.map(item => {
                        const itemStatus = item.status || 'pending';
                        const itemStatusInfo = STATUS_MAP[itemStatus] || STATUS_MAP.pending;
                        return (
                          <div key={item.id} className={`px-4 py-3 ${itemStatus === 'cancelled' ? 'opacity-50 bg-gray-50' : ''}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-sm font-medium text-gray-800">{item.item_name}</span>
                                <span className="text-xs bg-gray-200 text-gray-600 rounded px-1.5 py-0.5 font-bold">×{item.quantity}</span>
                                {itemStatus !== session.status && (
                                  <span className={`text-xs px-1.5 py-0.5 rounded border ${itemStatusInfo.bg} ${itemStatusInfo.color}`}>{itemStatusInfo.label}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-sm font-bold text-gray-900">{fmt(item.item_price * item.quantity)}</span>
                                {/* Per-item actions */}
                                {itemStatus !== 'cancelled' && itemStatus !== 'completed' && (
                                  <div className="flex gap-1 ml-2">
                                    <button onClick={(e) => { e.stopPropagation(); markSoldOut(item.item_name, item.menu_item_id); }} className="p-1 text-amber-500 hover:bg-amber-50 rounded transition-colors" title="Báo hết món này">
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); if (confirm(`Hủy "${item.item_name}" cho ${session.full_name}?`)) updateStatus(item.id, 'cancelled'); }} className="p-1 text-red-400 hover:bg-red-50 rounded transition-colors" title="Hủy món này">
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Session total + actions */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-gray-500 font-medium">Tổng đơn ({session.totalQty} suất)</span>
                        <span className="text-base font-extrabold text-gray-900">{fmt(session.totalAmount)}</span>
                      </div>

                      {/* Session-level actions */}
                      {session.status !== 'completed' && session.status !== 'cancelled' && (
                        <div className="flex gap-2">
                          {session.status === 'pending' && (
                            <>
                              <button onClick={() => updateSessionStatus(session, 'confirmed')} disabled={isUpdating}
                                className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors">
                                {isUpdating ? '...' : '✓ Xác nhận đơn'}
                              </button>
                              <button onClick={() => { if (confirm(`Hủy toàn bộ đơn của ${session.full_name}?`)) updateSessionStatus(session, 'cancelled'); }} disabled={isUpdating}
                                className="px-4 py-2.5 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors">
                                Hủy đơn
                              </button>
                            </>
                          )}
                          {session.status === 'confirmed' && (
                            <>
                              <button onClick={() => updateSessionStatus(session, 'completed')} disabled={isUpdating}
                                className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors">
                                {isUpdating ? '...' : '✓ Đã giao xong'}
                              </button>
                              <button onClick={() => { if (confirm(`Hủy toàn bộ đơn của ${session.full_name}?`)) updateSessionStatus(session, 'cancelled'); }} disabled={isUpdating}
                                className="px-4 py-2.5 border border-red-200 text-red-500 hover:bg-red-50 text-xs font-medium rounded-lg transition-colors">
                                Hủy đơn
                              </button>
                            </>
                          )}
                        </div>
                      )}
                      {session.status === 'item_unavailable' && (
                        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 font-medium">⚠ Có món đã hết — đang chờ khách chọn lại</div>
                      )}
                    </div>
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
