'use client';

import { useState, useEffect } from 'react';

interface DashboardData {
  today: string;
  total_orders: number;
  total_portions: number;
  active_users: number;
  total_users: number;
  low_stock_items: Array<{ name: string; remaining: number }>;
  orders: Array<{
    id: string;
    user_code: string;
    full_name: string;
    item_name: string;
    quantity: number;
    delivery_address: string;
    created_at: string;
  }>;
}

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
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
        <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!data) return <p className="text-red-500 text-sm">Không thể tải dữ liệu.</p>;

  const stats = [
    { label: 'Đơn hôm nay', value: data.total_orders ?? 0 },
    { label: 'Suất đã dùng', value: data.total_portions ?? 0 },
    { label: 'Người đặt', value: data.active_users ?? 0 },
    { label: 'Tổng mã', value: data.total_users ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Tổng quan</h1>
        <p className="text-sm text-gray-500">{data.today}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {(data.low_stock_items ?? []).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-medium text-amber-800 mb-2">Sắp hết số lượng</p>
          <div className="space-y-1">
            {data.low_stock_items.map((item) => (
              <p key={item.name} className="text-xs text-amber-700">
                {item.name} — còn {item.remaining} suất
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">
            Đơn hàng hôm nay ({data.total_orders ?? 0})
          </h2>
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
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 hidden lg:table-cell">Địa chỉ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 font-mono text-xs font-medium text-orange-600">{order.user_code}</td>
                    <td className="px-4 py-2.5 text-gray-900">{order.full_name}</td>
                    <td className="px-4 py-2.5 text-gray-600">{order.item_name}</td>
                    <td className="px-4 py-2.5 text-center text-gray-900">{order.quantity}</td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs hidden lg:table-cell truncate max-w-xs">{order.delivery_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
