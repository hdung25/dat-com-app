'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Button from '@/components/ui/Button';
import Alert from '@/components/ui/Alert';
import QuantitySelector from '@/components/ui/QuantitySelector';
import { useUser } from '@/context/UserContext';

interface UserInfo {
  full_name: string;
  phone: string;
  delivery_address: string;
  remaining_portions: number;
  already_ordered: boolean;
}

interface ItemInfo {
  id: string;
  name: string;
  price: number;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

export default function OrderPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const menuItemId = params.menuItemId as string;
  const menuDate = searchParams.get('date') || '';
  const { userCode, loading: authLoading } = useUser();

  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [codeError, setCodeError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [itemInfo, setItemInfo] = useState<ItemInfo | null>(null);

  // Fetch item info
  useEffect(() => {
    async function fetchItem() {
      try {
        const res = await fetch(`/api/menu/today`);
        const data = await res.json();
        if (data.items) {
          const item = data.items.find((i: ItemInfo) => i.id === menuItemId);
          if (item) setItemInfo(item);
        }
      } catch {
        // Ignore
      }
    }
    fetchItem();
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

        if (!data.valid) {
          setCodeError(data.error || 'Mã không hợp lệ');
        } else {
          setUserInfo(data);
        }
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

  const handleSubmit = async () => {
    if (!userInfo || userInfo.already_ordered || userInfo.remaining_portions < quantity) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          menuItemId,
          menuDate,
          quantity,
        }),
      });
      const data = await res.json();

      if (data.success) {
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
      } else {
        setSubmitError(data.error || 'Có lỗi xảy ra');
      }
    } catch {
      setSubmitError('Lỗi kết nối. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const maxQty = userInfo ? Math.min(userInfo.remaining_portions, 3) : 1;
  const hasError =
    !!codeError ||
    userInfo?.already_ordered ||
    (userInfo && userInfo.remaining_portions <= 0);

  const inputBorderClass = codeError
    ? 'border-red-400 focus:border-red-500 focus:ring-red-200'
    : userInfo
    ? 'border-emerald-400 focus:border-emerald-500 focus:ring-emerald-200'
    : 'border-slate-200 focus:border-cyan-500 focus:ring-cyan-200';

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <main className="max-w-lg mx-auto pb-12 safe-bottom">

        {/* Back link */}
        <div className="px-4 pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-cyan-700 transition-colors group"
          >
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.2"
              className="group-hover:-translate-x-0.5 transition-transform"
            >
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Quay về menu
          </Link>
        </div>

        {/* Dish summary card */}
        {itemInfo && (
          <div className="mx-4 mt-4 p-5 bg-gradient-to-br from-cyan-600 to-sky-700 rounded-3xl shadow-lg shadow-cyan-200/50 text-white animate-fade-in-up">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center">
                {/* Bowl icon */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8">
                  <path d="M3 11h18a9 9 0 01-18 0z"/>
                  <path d="M8 11V9a4 4 0 018 0v2"/>
                </svg>
              </div>
              <div className="text-xs font-semibold bg-white/15 rounded-full px-3 py-1">
                Món bạn chọn
              </div>
            </div>
            <h2 className="text-xl font-extrabold leading-tight">{itemInfo.name}</h2>
            <p className="text-white/80 font-bold text-lg mt-1">{formatPrice(itemInfo.price)}</p>
          </div>
        )}

        {/* Order form */}
        <div
          className="mx-4 mt-4 bg-white rounded-3xl shadow-sm border border-slate-100 p-5 animate-fade-in-up"
          style={{ animationDelay: '100ms' }}
        >
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 bg-cyan-50 rounded-xl flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
              </svg>
            </div>
            <h3 className="font-bold text-lg text-slate-800">Thông tin đặt hàng</h3>
          </div>

          {/* Code input */}
          <div className="mb-5">
            <label htmlFor="user-code" className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 mb-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2.2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
              Mã của bạn
              <span className="text-red-500 ml-0.5">*</span>
            </label>
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
                  <div className="w-5 h-5 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin-custom" />
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
              <div className="mt-2 flex items-center gap-1.5 text-sm text-red-600 font-medium">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {codeError}
              </div>
            )}

            {!userInfo && !codeError && !validating && code.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => validateCode(code)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="mr-1.5">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
                Kiểm tra mã
              </Button>
            )}
          </div>

          {/* User info card  */}
          {userInfo && !userInfo.already_ordered && userInfo.remaining_portions > 0 && (
            <div className="animate-slide-down">
              {/* Info display */}
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  </div>
                  <span className="text-sm font-bold text-emerald-700">Xác minh thành công</span>
                </div>

                <div className="space-y-2.5 text-sm text-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-cyan-50 rounded-xl flex items-center justify-center shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <span className="font-semibold">{userInfo.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-cyan-50 rounded-xl flex items-center justify-center shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 9a16 16 0 006 6l.36-.36a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                      </svg>
                    </div>
                    <span>{userInfo.phone}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 bg-cyan-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
                      </svg>
                    </div>
                    <span className="leading-snug">{userInfo.delivery_address}</span>
                  </div>
                </div>

                {/* Remaining portions */}
                <div className="mt-3 flex items-center gap-2 bg-cyan-600 text-white font-bold px-4 py-2 rounded-xl text-sm w-fit">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
                  </svg>
                  Còn lại: {userInfo.remaining_portions} phần
                </div>
              </div>

              {/* Quantity selector */}
              <div className="mb-5 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-4">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                  Số lượng
                </label>
                <QuantitySelector value={quantity} max={maxQty} onChange={setQuantity} />
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-3">
                  <span>Tổng thanh toán</span>
                  <span className="text-base font-bold text-cyan-700">
                    {itemInfo ? formatPrice(itemInfo.price * quantity) : '--'}
                  </span>
                </div>
              </div>

              {/* Submit error */}
              {submitError && (
                <Alert type="error" className="mb-4">
                  {submitError}
                </Alert>
              )}

              {/* Confirm button */}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={submitting}
                onClick={handleSubmit}
                disabled={!!hasError || submitting}
              >
                {submitting ? (
                  'Đang xử lý...'
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="mr-2">
                      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                    </svg>
                    Xác nhận đặt cơm
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Error: Already ordered */}
          {userInfo?.already_ordered && (
            <Alert type="warning" className="mt-4">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Bạn đã đặt cơm hôm nay rồi!
              </div>
            </Alert>
          )}

          {/* Error: No portions */}
          {userInfo && !userInfo.already_ordered && userInfo.remaining_portions <= 0 && (
            <Alert type="error" className="mt-4">
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                Không đủ suất. Bạn đã dùng hết suất ăn.
              </div>
            </Alert>
          )}
        </div>
      </main>
    </div>
  );
}
