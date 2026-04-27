'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardData {
  today: string;
  total_orders: number;
  total_portions: number;
  total_revenue: number;
  active_users: number;
  total_users: number;
  low_stock_items: Array<{ name: string; remaining: number }>;
  orders: Array<{
    id: string;
    user_code: string;
    full_name: string;
    item_name: string;
    item_price: number;
    quantity: number;
    status: string;
    delivery_address: string;
    created_at: string;
  }>;
  menu_info: {
    date: string;
    cutoff_time: string;
    is_active: boolean;
    total_items: number;
  } | null;
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      const result = await res.json();
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-40 bg-gray-100 rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!data) return <p className="text-red-500 text-sm">Không thể tải dữ liệu.</p>;

  const pendingOrders = data.orders.filter(o => (o.status || 'pending') === 'pending');
  const confirmedOrders = data.orders.filter(o => o.status === 'confirmed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Tổng quan</h1>
          <p className="text-sm text-gray-500">{data.today}</p>
        </div>
        <button
          onClick={fetchDashboard}
          className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
          </svg>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl p-4 text-white shadow-sm shadow-orange-200">
          <p className="text-2xl font-extrabold leading-none">{fmt(data.total_revenue)}</p>
          <p className="text-xs font-semibold text-white/75 uppercase tracking-wide mt-1">Doanh thu hôm nay</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-900">{data.total_orders}</p>
          <p className="text-xs text-gray-500 mt-0.5">Đơn hàng</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-900">{data.total_portions}</p>
          <p className="text-xs text-gray-500 mt-0.5">Suất đã đặt</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-2xl font-bold text-gray-900">{data.active_users} <span className="text-sm text-gray-400 font-normal">/ {data.total_users}</span></p>
          <p className="text-xs text-gray-500 mt-0.5">Người đặt / Tổng mã</p>
        </div>
      </div>

      {/* Menu info */}
      {data.menu_info ? (
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${data.menu_info.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Menu {data.menu_info.date}
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${data.menu_info.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {data.menu_info.is_active ? 'Đang mở' : 'Đã tắt'}
                </span>
              </p>
              <p className="text-xs text-gray-500">Chốt lúc {data.menu_info.cutoff_time} · {data.menu_info.total_items} món</p>
            </div>
          </div>
          <Link href={`/admin/menus/${data.menu_info.date}`} className="text-xs text-orange-600 hover:text-orange-800 font-medium">
            Quản lý →
          </Link>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800">Chưa có menu hôm nay</p>
          <Link href="/admin/menus" className="text-xs text-orange-600 hover:underline mt-1 inline-block">
            Tạo menu →
          </Link>
        </div>
      )}

      {/* Low stock warning */}
      {(data.low_stock_items ?? []).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800 mb-2">Sắp hết số lượng</p>
          <div className="space-y-1">
            {data.low_stock_items.map((item) => (
              <p key={item.name} className="text-xs text-amber-700">
                {item.name} — còn <strong>{item.remaining}</strong> suất
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Pending orders alert */}
      {pendingOrders.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            </span>
            <p className="text-sm font-medium text-amber-800">
              {pendingOrders.length} đơn đang chờ xử lý
            </p>
          </div>
          <Link href="/admin/orders" className="text-xs text-orange-600 hover:text-orange-800 font-medium">
            Xem ngay →
          </Link>
        </div>
      )}

      {/* Today's orders table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Đơn hàng hôm nay ({data.total_orders})
          </h2>
          {data.total_orders > 0 && (
            <Link href="/admin/orders" className="text-xs text-orange-600 hover:text-orange-800 font-medium">
              Quản lý đơn →
            </Link>
          )}
        </div>
        {(data.orders ?? []).length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            Chưa có đơn hàng nào hôm nay
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Mã</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Họ tên</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Món</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500">SL</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Tiền</th>
                  <th className="text-center px-4 py-2.5 text-xs font-medium text-gray-500">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.orders.map((order) => {
                  const status = order.status || 'pending';
                  const statusColors: Record<string, string> = {
                    pending: 'bg-amber-50 text-amber-700',
                    confirmed: 'bg-blue-50 text-blue-700',
                    completed: 'bg-green-50 text-green-700',
                    cancelled: 'bg-red-50 text-red-600',
                  };
                  const statusLabels: Record<string, string> = {
                    pending: 'Chờ', confirmed: 'Xác nhận', completed: 'Xong', cancelled: 'Hủy',
                  };
                  return (
                    <tr key={order.id} className={`hover:bg-gray-50 transition-colors ${status === 'cancelled' ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-2.5 font-mono text-xs font-medium text-orange-600">{order.user_code}</td>
                      <td className="px-4 py-2.5 text-gray-900">{order.full_name}</td>
                      <td className="px-4 py-2.5 text-gray-600">{order.item_name}</td>
                      <td className="px-4 py-2.5 text-center text-gray-900 font-semibold">{order.quantity}</td>
                      <td className="px-4 py-2.5 text-right text-gray-900 font-medium">{fmt(order.item_price * order.quantity)}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[status] || ''}`}>
                          {statusLabels[status] || status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
