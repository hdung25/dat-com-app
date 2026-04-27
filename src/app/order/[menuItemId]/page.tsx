'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import { useUser } from '@/context/UserContext';

interface UserInfo {
  full_name: string;
  phone: string;
  delivery_address: string;
  remaining_portions: number;
  already_ordered: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  price: number;
  max_quantity: number | null;
  ordered_count: number;
  is_available: boolean;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

export default function OrderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const menuItemId = params.menuItemId as string; // món được click ban đầu
  const menuDate = searchParams.get('date') || '';
  const { userCode, loading: authLoading } = useUser();

  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [codeError, setCodeError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);

  // Map: itemId -> quantity (0 = không chọn)
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Load tất cả món từ menu hôm nay
  useEffect(() => {
    async function fetchItems() {
      try {
        const res = await fetch('/api/menu/today');
        const data = await res.json();
        if (data.items) {
          setAllItems(data.items);
          // Pre-select món đã click với số lượng 1
          const init: Record<string, number> = {};
          data.items.forEach((it: MenuItem) => {
            init[it.id] = it.id === menuItemId ? 1 : 0;
          });
          setQuantities(init);
        }
      } catch { /* ignore */ }
      finally { setLoadingMenu(false); }
    }
    fetchItems();
  }, [menuItemId]);

  const validateCode = useCallback(
    async (codeValue: string) => {
      if (!codeValue.trim()) return;
      setValidating(true);
      setCodeError('');
      setUserInfo(null);
      try {
        const res = await fetch('/api/orders/validate-code', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: codeValue.trim().toUpperCase(), menuDate }),
        });
        const data = await res.json();
        if (!data.valid) setCodeError(data.error || 'Mã không hợp lệ');
        else setUserInfo(data);
      } catch {
        setCodeError('Lỗi kết nối. Vui lòng thử lại.');
      } finally {
        setValidating(false);
      }
    },
    [menuDate]
  );

  useEffect(() => {
    if (userCode && !authLoading && !code && !userInfo) {
      setCode(userCode);
      validateCode(userCode);
    }
  }, [userCode, authLoading, code, userInfo, validateCode]);

  // Tổng số suất đã chọn
  const totalSelected = Object.values(quantities).reduce((s, q) => s + q, 0);

  // Tổng tiền
  const totalPrice = allItems.reduce((s, item) => {
    return s + item.price * (quantities[item.id] || 0);
  }, 0);

  const setQty = (itemId: string, val: number) => {
    setQuantities(prev => ({ ...prev, [itemId]: Math.max(0, val) }));
  };

  const handleSubmit = async () => {
    if (!userInfo || totalSelected === 0) return;
    if (totalSelected > userInfo.remaining_portions) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const selectedItems = allItems
        .filter(it => (quantities[it.id] || 0) > 0)
        .map(it => ({ menuItemId: it.id, quantity: quantities[it.id] }));

      // Gửi tất cả món trong 1 request duy nhất (atomic transaction)
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          menuDate,
          items: selectedItems,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setSubmitError(data.error || 'Có lỗi xảy ra');
        return;
      }

      sessionStorage.setItem(
        'orderSuccess',
        JSON.stringify({
          item_name: data.item_name,
          quantity: data.quantity,
          delivery_address: data.delivery_address,
          remaining_portions: data.remaining_portions,
        })
      );
      router.push('/success');
    } catch {
      setSubmitError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputBorderClass = codeError
    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
    : userInfo
    ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-200'
    : 'border-slate-200 focus:border-cyan-500 focus:ring-cyan-200';

  const canOrder = userInfo && !userInfo.already_ordered && userInfo.remaining_portions > 0;
  const overLimit = userInfo && totalSelected > userInfo.remaining_portions;

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <main className="max-w-lg mx-auto pb-16 safe-bottom">

        {/* Back */}
        <div className="px-4 pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-cyan-700 transition-colors group"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
              className="group-hover:-translate-x-0.5 transition-transform">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Quay về menu
          </Link>
        </div>

        {/* Hero */}
        <div className="mx-4 mt-4 p-5 bg-gradient-to-br from-cyan-600 to-sky-700 rounded-3xl shadow-lg shadow-cyan-200/50 text-white animate-fade-in-up">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-white/15 rounded-xl flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                <path d="M3 11h18a9 9 0 01-18 0z"/><path d="M8 11V9a4 4 0 018 0v2"/>
              </svg>
            </div>
            <span className="text-xs font-semibold bg-white/15 rounded-full px-3 py-1">Đặt cơm hôm nay</span>
          </div>
          <h1 className="text-xl font-extrabold">Chọn món bạn muốn</h1>
          <p className="text-white/75 text-sm mt-1">Bạn có thể chọn nhiều món cùng lúc</p>
        </div>

        {/* Nhập mã */}
        <div className="mx-4 mt-4 bg-white rounded-3xl shadow-sm border border-slate-100 p-5 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 bg-cyan-50 rounded-xl flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            </div>
            <h3 className="font-bold text-slate-800">Mã xác thực</h3>
          </div>

          <div className="relative">
            <input
              id="user-code"
              type="text"
              value={code}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setCode(val);
                setCodeError('');
                setUserInfo(null);
              }}
              onBlur={() => validateCode(code)}
              placeholder="VD: TRANG-001"
              autoCapitalize="characters"
              className={`w-full px-4 py-3.5 text-lg font-mono tracking-widest bg-slate-50 border-2 rounded-2xl transition-all duration-200
                focus:outline-none focus:ring-3 focus:bg-white ${inputBorderClass}`}
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {validating && (
                <div className="w-5 h-5 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
              )}
              {userInfo && !validating && (
                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
              )}
              {codeError && !validating && (
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="3">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </div>
              )}
            </div>
          </div>

          {codeError && (
            <p className="mt-2 text-sm text-red-600 font-medium flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {codeError}
            </p>
          )}

          {!userInfo && !codeError && !validating && code.length > 0 && (
            <button
              onClick={() => validateCode(code)}
              className="mt-3 px-4 py-2 text-sm font-medium text-cyan-700 border border-cyan-200 rounded-xl hover:bg-cyan-50 transition-colors"
            >
              Kiểm tra mã
            </button>
          )}

          {/* User info */}
          {userInfo && (
            <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
                <span className="text-sm font-bold text-emerald-700">Xác minh thành công</span>
              </div>
              <p className="text-sm font-semibold text-slate-800">{userInfo.full_name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{userInfo.delivery_address}</p>
              <div className="mt-3 inline-flex items-center gap-1.5 bg-cyan-600 text-white text-sm font-bold px-3 py-1.5 rounded-xl">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
                Còn {userInfo.remaining_portions} phần
              </div>
            </div>
          )}

          {userInfo?.already_ordered && (
            <Alert type="warning" className="mt-4">Bạn đã đặt cơm hôm nay rồi!</Alert>
          )}
          {userInfo && !userInfo.already_ordered && userInfo.remaining_portions <= 0 && (
            <Alert type="error" className="mt-4">Không đủ suất. Bạn đã dùng hết suất ăn.</Alert>
          )}
        </div>

        {/* Chọn món */}
        <div className="mx-4 mt-4 animate-fade-in-up" style={{ animationDelay: '160ms' }}>
          <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2">
              <path d="M3 11h18a9 9 0 01-18 0z"/><path d="M8 11V9a4 4 0 018 0v2"/>
            </svg>
            Chọn món
            {totalSelected > 0 && (
              <span className="ml-auto text-xs bg-cyan-100 text-cyan-700 font-bold px-2.5 py-1 rounded-full">
                {totalSelected} suất chọn
              </span>
            )}
          </h3>

          {loadingMenu ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {allItems.map(item => {
                const qty = quantities[item.id] || 0;
                const remaining = item.max_quantity
                  ? item.max_quantity - (item.ordered_count || 0)
                  : null;
                const soldOut = remaining !== null && remaining <= 0;
                const isSelected = qty > 0;
                const maxQtyForItem = Math.min(
                  userInfo ? userInfo.remaining_portions : 3,
                  remaining ?? 99,
                  10
                );

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl border-2 p-4 transition-all duration-200 ${
                      soldOut
                        ? 'border-slate-100 opacity-50'
                        : isSelected
                        ? 'border-cyan-400 shadow-md shadow-cyan-100'
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox */}
                      <button
                        disabled={soldOut || !canOrder}
                        onClick={() => setQty(item.id, qty > 0 ? 0 : 1)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? 'bg-cyan-600 border-cyan-600'
                            : 'border-slate-300'
                        } ${soldOut || !canOrder ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                      </button>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                        <p className="text-sm font-bold text-cyan-700">
                          {item.price > 0 ? formatPrice(item.price) : 'Miễn phí'}
                        </p>
                        {remaining !== null && (
                          <p className="text-xs text-slate-400 mt-0.5">Còn {remaining} suất</p>
                        )}
                      </div>

                      {/* Quantity stepper */}
                      {isSelected && canOrder && !soldOut && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => setQty(item.id, qty - 1)}
                            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors font-bold text-slate-700"
                          >−</button>
                          <span className="w-5 text-center font-bold text-slate-800 text-sm">{qty}</span>
                          <button
                            onClick={() => setQty(item.id, Math.min(qty + 1, maxQtyForItem))}
                            className="w-8 h-8 rounded-xl bg-cyan-600 hover:bg-cyan-700 flex items-center justify-center transition-colors font-bold text-white"
                          >+</button>
                        </div>
                      )}

                      {soldOut && (
                        <span className="shrink-0 text-xs text-slate-400 font-medium">Hết</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Summary bar + submit */}
        {canOrder && (
          <div className="mx-4 mt-5 animate-fade-in-up" style={{ animationDelay: '240ms' }}>
            {totalSelected > 0 && (
              <div className="mb-3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">Tổng ({totalSelected} suất)</span>
                  <span className="text-lg font-extrabold text-cyan-700">{formatPrice(totalPrice)}</span>
                </div>
                {overLimit && (
                  <p className="text-xs text-red-500 font-medium mt-1">
                    ⚠ Vượt quá số suất còn lại ({userInfo!.remaining_portions} suất)
                  </p>
                )}
              </div>
            )}

            {submitError && (
              <Alert type="error" className="mb-3">{submitError}</Alert>
            )}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              loading={submitting}
              onClick={handleSubmit}
              disabled={totalSelected === 0 || !!overLimit || submitting}
            >
              {submitting ? 'Đang xử lý...' : totalSelected === 0 ? 'Chọn ít nhất 1 món' : `Xác nhận đặt ${totalSelected} suất`}
            </Button>
          </div>
        )}

      </main>
    </div>
  );
}
