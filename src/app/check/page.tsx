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
        <div className="text-center mb-6 animate-fade-in-up">
          <div className="text-5xl mb-3">🎫</div>
          <h1 className="text-2xl font-bold text-text-primary">Tra cứu suất ăn</h1>
          <p className="text-text-secondary mt-1">Nhập mã để kiểm tra suất ăn còn lại</p>
        </div>

        {/* Input card */}
        <Card className="p-5 mb-6 animate-fade-in-up">
          <div className="flex gap-3">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
              placeholder="VD: TRANG-001"
              autoCapitalize="characters"
              className="flex-1 px-4 py-3 text-lg font-mono tracking-wide bg-white border-2 border-border rounded-xl
                focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            <Button
              variant="primary"
              loading={loading}
              onClick={handleCheck}
              className="px-6"
            >
              Tra cứu
            </Button>
          </div>
          {error && (
            <p className="mt-3 text-sm text-error font-medium">❌ {error}</p>
          )}
        </Card>

        {/* Results */}
        {data && (
          <div className="space-y-4 animate-slide-down">
            {/* User info */}
            <Card className="p-5">
              <div className="space-y-2 text-sm mb-4">
                <p><span className="mr-2">👤</span><span className="font-semibold">{data.full_name}</span></p>
                <p><span className="mr-2">📞</span>{data.phone}</p>
                <p><span className="mr-2">📍</span>{data.delivery_address}</p>
              </div>

              {/* Portions summary */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-text-primary">{data.total_portions}</div>
                    <div className="text-text-secondary">Được cấp</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-dark">{data.used_portions}</div>
                    <div className="text-text-secondary">Đã dùng</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">{data.remaining_portions}</div>
                    <div className="text-text-secondary">Còn lại</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary-dark rounded-full transition-all duration-700"
                    style={{ width: `${usedPercent}%` }}
                  />
                </div>
                <p className="text-xs text-text-secondary mt-1.5 text-right">Đã dùng {usedPercent}%</p>
              </div>
            </Card>

            {/* Order history */}
            {data.orders.length > 0 && (
              <Card className="overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold text-text-primary">Lịch sử đặt cơm</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-text-secondary">
                        <th className="text-left px-4 py-2.5 font-medium">Ngày</th>
                        <th className="text-left px-4 py-2.5 font-medium">Món</th>
                        <th className="text-center px-4 py-2.5 font-medium">SL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.orders.map((order) => (
                        <tr key={order.id} className="border-t border-border/50 hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 whitespace-nowrap">{order.menu_date}</td>
                          <td className="px-4 py-2.5">{order.item_name}</td>
                          <td className="px-4 py-2.5 text-center">{order.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
