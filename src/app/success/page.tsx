'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface OrderData {
  item_name: string;
  quantity: number;
  delivery_address: string;
  remaining_portions: number;
}

function ConfettiPiece({ index }: { index: number }) {
  const colors = ['#F97316', '#EA580C', '#FDBA74', '#16A34A', '#F59E0B', '#DC2626', '#3B82F6', '#8B5CF6'];
  const color = colors[index % colors.length];
  const left = Math.random() * 100;
  const delay = Math.random() * 2;
  const size = 6 + Math.random() * 8;

  return (
    <div
      className="confetti-piece"
      style={{
        backgroundColor: color,
        left: `${left}%`,
        top: '-10px',
        width: `${size}px`,
        height: `${size}px`,
        animationDelay: `${delay}s`,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
      }}
    />
  );
}

function SuccessCheckmark() {
  return (
    <div className="flex justify-center mb-6">
      <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-lg">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#16A34A"
          strokeWidth="4"
          className="success-circle"
        />
        <circle cx="50" cy="50" r="42" fill="#DCFCE7" opacity="0.5" />
        <path
          d="M30 50 L45 65 L72 35"
          fill="none"
          stroke="#16A34A"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="success-check"
        />
      </svg>
    </div>
  );
}

export default function SuccessPage() {
  const [orderData, setOrderData] = useState<OrderData | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('orderSuccess');
    if (stored) {
      setOrderData(JSON.parse(stored));
      sessionStorage.removeItem('orderSuccess');
    }
  }, []);

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4 safe-bottom">
      {/* Confetti */}
      {Array.from({ length: 15 }, (_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}

      <div className="w-full max-w-md animate-fade-in-up">
        <SuccessCheckmark />

        <h1 className="text-2xl font-bold text-text-primary text-center mb-2">
          Đặt cơm thành công! 🎉
        </h1>
        <p className="text-text-secondary text-center mb-6">
          Đơn hàng của bạn đã được ghi nhận
        </p>

        {/* Order summary card */}
        {orderData && (
          <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.08)] p-5 mb-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">Món ăn</span>
                <span className="font-semibold">{orderData.item_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-text-secondary text-sm">Số lượng</span>
                <span className="font-semibold">{orderData.quantity} phần</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-text-secondary text-sm">Giao đến</span>
                <span className="font-semibold text-right max-w-[60%]">{orderData.delivery_address}</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary text-sm">Suất còn lại</span>
                  <span className="inline-flex items-center gap-1 bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-sm">
                    🎫 {orderData.remaining_portions} phần
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!orderData && (
          <div className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.08)] p-5 mb-6 text-center text-text-secondary animate-fade-in-up">
            <p>Đơn hàng đã được ghi nhận thành công.</p>
          </div>
        )}

        <Link
          href="/"
          className="block w-full text-center border-2 border-primary text-primary font-semibold py-3.5 rounded-2xl btn-press hover:bg-primary hover:text-white transition-all duration-200"
        >
          ← Về trang chủ
        </Link>
      </div>
    </div>
  );
}
