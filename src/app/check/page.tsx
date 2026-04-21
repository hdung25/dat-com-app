'use client';

import { useState } from 'react';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface CheckData {
  valid: boolean;
  full_name: string;
  phone: string;
  delivery_address: string;
  total_portions: number;
  used_portions: number;
  remaining_portions: number;
  orders: Array<{
    id: string;
    menu_date: string;
    item_name: string;
    quantity: number;
  }>;
  error?: string;
}

export default function CheckPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CheckData | null>(null);
  const [error, setError] = useState('');

  const handleCheck = async () => {
    if (!code.trim()) return;

    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch('/api/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });
      const result = await res.json();

      if (!result.valid) {
        setError(result.error || 'Mã không hợp lệ');
      } else {
        setData(result);
      }
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const usedPercent = data ? Math.round((data.used_portions / data.total_portions) * 100) : 0;

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <main className="max-w-lg mx-auto px-4 py-8 safe-bottom">

        {/* Page header */}
        <div className="text-center mb-6 animate-fade-in-up">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-100 to-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="1.8">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">Tra cứu suất ăn</h1>
          <p className="text-slate-500 mt-1.5 text-sm">Nhập mã để kiểm tra suất ăn còn lại</p>
        </div>

        {/* Input card */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 mb-6 animate-fade-in-up">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                placeholder="VD: TRANG-001"
                autoCapitalize="characters"
                className="w-full px-4 py-3.5 text-lg font-mono tracking-widest bg-slate-50 border-2 border-slate-200 rounded-2xl
                  focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 focus:bg-white transition-all"
              />
            </div>
            <Button
              variant="primary"
              loading={loading}
              onClick={handleCheck}
              className="shrink-0 px-5 rounded-2xl"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={loading ? 'hidden' : ''}>
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
            </Button>
          </div>

          {error && (
            <div className="mt-3 flex items-center gap-2 text-sm text-red-600 font-medium bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {data && (
          <div className="space-y-4 animate-slide-down">

            {/* User info card */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              {/* Header */}
              <div className="gradient-primary p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white/70 text-xs">Tên</p>
                  <p className="text-white font-bold">{data.full_name}</p>
                </div>
              </div>

              <div className="p-5">
                <div className="space-y-3 text-sm text-slate-600 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-cyan-50 rounded-xl flex items-center justify-center shrink-0">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 9a16 16 0 006 6l.36-.36a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                      </svg>
                    </div>
                    {data.phone}
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 bg-cyan-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                    </div>
                    <span className="leading-snug">{data.delivery_address}</span>
                  </div>
                </div>

                {/* Portions summary */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-extrabold text-slate-700">{data.total_portions}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Được cấp</div>
                    </div>
                    <div className="text-center border-x border-slate-200">
                      <div className="text-2xl font-extrabold text-amber-600">{data.used_portions}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Đã dùng</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-extrabold text-cyan-600">{data.remaining_portions}</div>
                      <div className="text-xs text-slate-400 mt-0.5">Còn lại</div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-sky-500 rounded-full transition-all duration-700"
                      style={{ width: `${usedPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 text-right">Đã dùng {usedPercent}%</p>
                </div>
              </div>
            </div>

            {/* Order history */}
            {data.orders.length > 0 && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                {/* Table header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
                  </svg>
                  <h3 className="font-bold text-slate-700">Lịch sử đặt cơm</h3>
                  <span className="ml-auto text-xs bg-cyan-50 text-cyan-600 font-semibold px-2 py-0.5 rounded-full">
                    {data.orders.length} đơn
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                        <th className="text-left px-5 py-3 font-semibold">Ngày</th>
                        <th className="text-left px-4 py-3 font-semibold">Món</th>
                        <th className="text-center px-4 py-3 font-semibold">SL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.orders.map((order, i) => (
                        <tr
                          key={order.id}
                          className={`border-t border-slate-100 hover:bg-cyan-50/40 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}
                        >
                          <td className="px-5 py-3 whitespace-nowrap text-slate-500 font-mono text-xs">{order.menu_date}</td>
                          <td className="px-4 py-3 font-medium text-slate-700">{order.item_name}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 bg-cyan-100 text-cyan-700 font-bold rounded-full text-xs">
                              {order.quantity}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
