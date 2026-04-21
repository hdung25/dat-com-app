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
  const colors = [
    '#0891B2', '#06B6D4', '#67E8F9', '#0284C7',
    '#059669', '#10B981', '#F59E0B', '#6366F1',
  ];
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
        borderRadius: Math.random() > 0.5 ? '50%' : '3px',
      }}
    />
  );
}

function SuccessCheckmark() {
  return (
    <div className="flex justify-center mb-6">
      <div className="relative">
        {/* Glow halo */}
        <div className="absolute inset-0 rounded-full bg-emerald-400/20 scale-125 animate-pulse-custom" />
        <svg width="100" height="100" viewBox="0 0 100 100" className="relative drop-shadow-xl">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#059669"
            strokeWidth="4"
            className="success-circle"
          />
          <circle cx="50" cy="50" r="42" fill="#D1FAE5" opacity="0.6" />
          <path
            d="M30 50 L45 65 L72 35"
            fill="none"
            stroke="#059669"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="success-check"
          />
        </svg>
      </div>
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
      {Array.from({ length: 18 }, (_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}

      <div className="w-full max-w-md animate-fade-in-up">
        <SuccessCheckmark />

        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-slate-800 mb-1">
            Đặt cơm thành công! 🎉
          </h1>
          <p className="text-slate-500 text-sm">Đơn hàng của bạn đã được ghi nhận</p>
        </div>

        {/* Order summary card */}
        {orderData && (
          <div
            className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-5 animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
          >
            {/* Card header */}
            <div className="gradient-primary p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                </svg>
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium">Đơn hàng của bạn</p>
                <p className="text-white font-bold">{orderData.item_name}</p>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                  Số lượng
                </div>
                <span className="font-bold text-slate-800 bg-cyan-50 text-cyan-700 px-3 py-1 rounded-full text-sm">
                  {orderData.quantity} phần
                </span>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-sm text-slate-500 shrink-0">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  Giao đến
                </div>
                <span className="font-semibold text-slate-700 text-right text-sm">{orderData.delivery_address}</span>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                    Suất còn lại
                  </div>
                  <div className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-sky-600 text-white font-bold px-4 py-1.5 rounded-full text-sm shadow-sm shadow-cyan-200">
                    {orderData.remaining_portions} phần
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!orderData && (
          <div
            className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-5 text-center animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="1.5" className="mx-auto mb-3">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
            <p className="text-slate-500 text-sm">Đơn hàng đã được ghi nhận thành công.</p>
          </div>
        )}

        {/* Back to home */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white font-bold py-4 rounded-2xl btn-press transition-all duration-200 shadow-md shadow-cyan-200/50 hover:shadow-lg"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Về trang chủ
        </Link>
      </div>
    </div>
  );
}
