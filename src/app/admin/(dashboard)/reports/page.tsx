'use client';

import { useState } from 'react';

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

export default function AdminReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [orders, setOrders] = useState<OrderReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

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

  const shown = selectedCode ? orders.filter(o => o.user_code === selectedCode) : orders;
  const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
  const inp = "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-orange-400 transition-colors";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Báo cáo</h1>
        <p className="text-sm text-gray-500">Xem và xuất dữ liệu đơn hàng</p>
      </div>

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

      {searched && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">{shown.length} đơn hàng</span>
            {shown.length > 0 && (
              <span className="text-xs text-gray-500">
                Tổng {shown.reduce((s, o) => s + o.quantity, 0)} suất
              </span>
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
                    {['Ngày', 'Mã', 'Họ tên', 'Món', 'SL', 'Giá', 'Địa chỉ'].map((h, i) => (
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
                        <button onClick={() => setSelectedCode(o.user_code === selectedCode ? null : o.user_code)}
                          className="font-mono text-xs font-medium text-orange-600 hover:underline">
                          {o.user_code}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-gray-900">{o.full_name}</td>
                      <td className="px-4 py-2.5 text-gray-600">{o.item_name}</td>
                      <td className="px-4 py-2.5 text-center text-gray-900">{o.quantity}</td>
                      <td className="px-4 py-2.5 text-right text-gray-600 whitespace-nowrap">{fmt(o.item_price)}</td>
                      <td className="px-4 py-2.5 text-gray-400 text-xs hidden lg:table-cell truncate max-w-xs">{o.delivery_address}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
