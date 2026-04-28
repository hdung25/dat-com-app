'use client';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import { useUser } from '@/context/UserContext';

interface OrderItem {
  id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  status: string;
}

interface OrderSession {
  session_id: string;
  items: OrderItem[];
  created_at: string;
  menu_date: string;
  delivery_address: string;
  status: string;
  totalAmount: number;
  totalQty: number;
  discount_type: string | null;
  discount_value: number | null;
  discount_amount: number;
}

interface TrackData {
  valid: boolean;
  full_name: string;
  phone: string;
  delivery_address: string;
  sessions: OrderSession[];
  error?: string;
}

const STATUS_STEPS = [
  {
    key: 'pending',
    label: 'Đã gửi đơn',
    sublabel: 'Chờ xác nhận',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FFFFFF' : '#94A3B8'} strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/>
      </svg>
    ),
  },
  {
    key: 'confirmed',
    label: 'Đã xác nhận',
    sublabel: 'Đang chuẩn bị',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FFFFFF' : '#94A3B8'} strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    key: 'completed',
    label: 'Hoàn thành',
    sublabel: 'Đã giao đến bạn',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FFFFFF' : '#94A3B8'} strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
  },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; stepIndex: number }> = {
  pending:          { color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', label: 'Chờ xác nhận', stepIndex: 0 },
  confirmed:        { color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', label: 'Đang chuẩn bị', stepIndex: 1 },
  completed:        { color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', label: 'Đã giao', stepIndex: 2 },
  cancelled:        { color: 'text-red-600', bg: 'bg-red-50 border-red-200', label: 'Đã hủy', stepIndex: -1 },
  item_unavailable: { color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', label: 'Hết món', stepIndex: -1 },
};

const fmt = (n: number) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function StatusStepper({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  if (config.stepIndex === -1) {
    // cancelled or item_unavailable
    return (
      <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border ${config.bg}`}>
        <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
          {status === 'cancelled' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          )}
        </div>
        <div>
          <p className={`font-bold text-sm ${config.color}`}>{config.label}</p>
          <p className="text-xs text-slate-400">
            {status === 'cancelled' ? 'Đơn hàng đã bị hủy' : 'Có món đã hết, đang chờ xử lý'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0 w-full py-3">
      {STATUS_STEPS.map((step, i) => {
        const isActive = i <= config.stepIndex;
        const isCurrent = i === config.stepIndex;
        return (
          <div key={step.key} className="flex items-center flex-1">
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0" style={{ minWidth: '64px' }}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                  isCurrent
                    ? 'bg-gradient-to-br from-cyan-500 to-sky-600 shadow-lg shadow-cyan-200/60 ring-4 ring-cyan-100 scale-110'
                    : isActive
                    ? 'bg-gradient-to-br from-cyan-500 to-sky-600 shadow-md shadow-cyan-200/40'
                    : 'bg-slate-100 border-2 border-slate-200'
                }`}
              >
                {isActive && i < config.stepIndex ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  step.icon(isActive)
                )}
              </div>
              <div className="text-center">
                <p className={`text-xs font-bold leading-tight ${isActive ? 'text-cyan-700' : 'text-slate-400'}`}>
                  {step.label}
                </p>
                <p className={`text-[10px] leading-tight mt-0.5 ${isCurrent ? 'text-cyan-600' : 'text-slate-300'}`}>
                  {step.sublabel}
                </p>
              </div>
            </div>

            {/* Connector line */}
            {i < STATUS_STEPS.length - 1 && (
              <div className="flex-1 mx-1">
                <div className={`h-1 rounded-full transition-all duration-500 ${
                  i < config.stepIndex
                    ? 'bg-gradient-to-r from-cyan-400 to-sky-500'
                    : 'bg-slate-200'
                }`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function TrackOrderPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TrackData | null>(null);
  const [error, setError] = useState('');
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const { userCode, loading: authLoading } = useUser();

  const handleTrack = useCallback(async (codeValue?: string) => {
    const trackCode = codeValue || code;
    if (!trackCode.trim()) return;

    setLoading(true);
    setError('');
    setData(null);

    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: trackCode.trim().toUpperCase() }),
      });
      const result = await res.json();

      if (!result.valid) {
        setError(result.error || 'Mã không hợp lệ');
      } else {
        setData(result);
        // Auto expand the first session
        if (result.sessions?.length > 0) {
          setExpandedSession(result.sessions[0].session_id);
        }
      }
    } catch {
      setError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [code]);

  // Auto-fill code from auth context
  useEffect(() => {
    if (userCode && !authLoading && !code && !data) {
      setCode(userCode);
      handleTrack(userCode);
    }
  }, [userCode, authLoading, code, data, handleTrack]);

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <main className="max-w-lg mx-auto px-4 py-6 safe-bottom">
        {/* Page header */}
        <div className="text-center mb-6 animate-fade-in-up">
          <div className="w-16 h-16 bg-gradient-to-br from-cyan-100 via-sky-100 to-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="1.8">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800">Theo dõi đơn hàng</h1>
          <p className="text-slate-500 mt-1.5 text-sm">Xem trạng thái đơn hàng của bạn</p>
        </div>

        {/* Input */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-5 mb-6 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={code}
                onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(''); setData(null); }}
                onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                placeholder="VD: TRANG-001"
                autoCapitalize="characters"
                className="w-full px-4 py-3.5 text-lg font-mono tracking-widest bg-slate-50 border-2 border-slate-200 rounded-2xl
                  focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 focus:bg-white transition-all"
              />
            </div>
            <Button
              variant="primary"
              loading={loading}
              onClick={() => handleTrack()}
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
          <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '160ms' }}>

            {/* User info banner */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="gradient-primary p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white/70 text-xs">Xin chào</p>
                  <p className="text-white font-bold">{data.full_name}</p>
                </div>
                <div className="ml-auto text-right">
                  <span className="text-white/70 text-xs">Tổng đơn</span>
                  <p className="text-white font-extrabold text-lg">{data.sessions.length}</p>
                </div>
              </div>
            </div>

            {/* Sessions list */}
            {data.sessions.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 py-14 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
                  </svg>
                </div>
                <p className="text-sm text-slate-400 font-medium">Chưa có đơn hàng nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.sessions.map((session, idx) => {
                  const isExpanded = expandedSession === session.session_id;
                  const statusConfig = STATUS_CONFIG[session.status] || STATUS_CONFIG.pending;
                  const time = formatTime(session.created_at);
                  const date = session.menu_date;
                  const isCombo = session.items.length > 1;
                  const finalAmount = session.totalAmount - session.discount_amount;

                  return (
                    <div
                      key={session.session_id}
                      className={`bg-white rounded-3xl shadow-sm border overflow-hidden transition-all duration-300 animate-fade-in-up ${
                        session.status === 'cancelled' ? 'border-slate-100 opacity-70' : 'border-slate-100'
                      }`}
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      {/* Session header */}
                      <div
                        className="p-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
                        onClick={() => setExpandedSession(isExpanded ? null : session.session_id)}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="text-xs font-mono text-slate-400">{date}</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${statusConfig.bg} ${statusConfig.color}`}>
                                {statusConfig.label}
                              </span>
                              {isCombo && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-violet-50 text-violet-600 border border-violet-200">
                                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                                    <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
                                  </svg>
                                  Combo {session.items.length} món
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                              </svg>
                              {time}
                              <span className="text-slate-300">·</span>
                              <span>{session.totalQty} suất</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            {session.discount_amount > 0 ? (
                              <>
                                <p className="text-xs text-slate-400 line-through">{fmt(session.totalAmount)}</p>
                                <p className="text-sm font-extrabold text-emerald-600">{fmt(finalAmount)}</p>
                                <p className="text-[10px] text-emerald-500 font-medium">
                                  -{session.discount_type === 'percent' ? `${session.discount_value}%` : fmt(session.discount_amount)}
                                </p>
                              </>
                            ) : (
                              <p className="text-sm font-extrabold text-slate-800">{fmt(session.totalAmount)}</p>
                            )}
                          </div>
                        </div>

                        {/* Status stepper (always visible in compact form) */}
                        <StatusStepper status={session.status} />

                        {/* Expand indicator */}
                        <div className="flex items-center justify-center mt-1">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2"
                            className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                            <polyline points="6 9 12 15 18 9"/>
                          </svg>
                        </div>
                      </div>

                      {/* Expanded detail */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 animate-slide-down">
                          {/* Delivery address */}
                          {session.delivery_address && (
                            <div className="px-4 py-2.5 bg-cyan-50/50 border-b border-cyan-100/50 flex items-start gap-2">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2" className="shrink-0 mt-0.5">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                              </svg>
                              <span className="text-xs text-slate-600 font-medium">{session.delivery_address}</span>
                            </div>
                          )}

                          {/* Items list */}
                          <div className="divide-y divide-slate-50">
                            {session.items.map(item => {
                              const itemStatusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                              return (
                                <div key={item.id} className={`px-4 py-3 flex items-center justify-between ${item.status === 'cancelled' ? 'opacity-50 bg-slate-50' : ''}`}>
                                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                    <div className="w-8 h-8 bg-cyan-50 rounded-xl flex items-center justify-center shrink-0">
                                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="1.5">
                                        <path d="M3 11h18a9 9 0 01-18 0z"/><path d="M8 11V9a4 4 0 018 0v2"/>
                                      </svg>
                                    </div>
                                    <div className="min-w-0">
                                      <p className={`text-sm font-semibold text-slate-800 truncate ${item.status === 'cancelled' ? 'line-through' : ''}`}>
                                        {item.item_name}
                                      </p>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-xs text-slate-400">×{item.quantity}</span>
                                        {item.status !== session.status && (
                                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${itemStatusConfig.bg} ${itemStatusConfig.color}`}>
                                            {itemStatusConfig.label}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <span className="text-sm font-bold text-slate-700 shrink-0">
                                    {fmt(item.item_price * item.quantity)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Total */}
                          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-slate-500 font-medium">Tổng ({session.totalQty} suất)</span>
                              <span className="text-sm font-extrabold text-slate-800">{fmt(session.totalAmount)}</span>
                            </div>
                            {session.discount_amount > 0 && (
                              <>
                                <div className="flex items-center justify-between mt-1.5">
                                  <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
                                      <line x1="7" y1="7" x2="7.01" y2="7"/>
                                    </svg>
                                    Giảm giá {session.discount_type === 'percent' ? `(${session.discount_value}%)` : ''}
                                  </span>
                                  <span className="text-xs font-bold text-emerald-600">-{fmt(session.discount_amount)}</span>
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200">
                                  <span className="text-sm text-slate-700 font-bold">Thành tiền</span>
                                  <span className="text-base font-extrabold text-cyan-700">{fmt(finalAmount)}</span>
                                </div>
                              </>
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
        )}
      </main>
    </div>
  );
}
