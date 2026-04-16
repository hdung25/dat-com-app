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

  const validateCode = useCallback(async (codeValue: string) => {
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
  }, [menuDate]);

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
        // Store success data for success page
        sessionStorage.setItem('orderSuccess', JSON.stringify({
          item_name: data.item_name,
          quantity: data.quantity,
          delivery_address: data.delivery_address,
          remaining_portions: data.remaining_portions,
        }));
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
  const hasError = !!codeError || userInfo?.already_ordered || (userInfo && userInfo.remaining_portions <= 0);

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <main className="max-w-lg mx-auto pb-8 safe-bottom">
        {/* Back button */}
        <div className="px-4 pt-3">
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-primary transition-colors">
            ← Quay lại
          </Link>
        </div>

        {/* Dish summary */}
        {itemInfo && (
          <div className="mx-4 mt-3 p-4 bg-orange-50 rounded-xl border border-orange-100 animate-fade-in-up">
            <h2 className="text-xl font-bold text-orange-900">{itemInfo.name}</h2>
            <p className="text-orange-700 font-medium mt-1">{formatPrice(itemInfo.price)}</p>
          </div>
        )}

        {/* Order form */}
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.08)] p-5 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <h3 className="font-bold text-lg text-text-primary mb-4">Thông tin đặt hàng</h3>

          {/* Code input */}
          <div className="mb-4">
            <label htmlFor="user-code" className="block text-sm font-medium text-text-primary mb-1.5">
              Mã của bạn <span className="text-error">*</span>
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
                className={`w-full px-4 py-3.5 text-lg font-mono tracking-wide bg-white border-2 rounded-xl transition-all duration-200
                  focus:outline-none focus:ring-2
                  ${codeError
                    ? 'border-error focus:border-error focus:ring-error/20'
                    : userInfo
                    ? 'border-success focus:border-success focus:ring-success/20'
                    : 'border-border focus:border-primary focus:ring-primary/20'
                  }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {validating && (
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin-custom" />
                )}
                {userInfo && !validating && (
                  <span className="text-success text-xl">✓</span>
                )}
              </div>
            </div>
            {codeError && (
              <p className="mt-1.5 text-sm text-error font-medium">❌ {codeError}</p>
            )}

            {!userInfo && !codeError && !validating && code.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => validateCode(code)}
              >
                Kiểm tra mã
              </Button>
            )}
          </div>

          {/* User info card */}
          {userInfo && !userInfo.already_ordered && userInfo.remaining_portions > 0 && (
            <div className="animate-slide-down">
              <div className="bg-green-50 border-t-4 border-success rounded-xl p-4 mb-4">
                <div className="space-y-2 text-sm">
                  <p><span className="mr-2">👤</span><span className="font-medium">{userInfo.full_name}</span></p>
                  <p><span className="mr-2">📞</span>{userInfo.phone}</p>
                  <p><span className="mr-2">📍</span>{userInfo.delivery_address}</p>
                </div>
                <div className="mt-3 inline-flex items-center gap-2 bg-primary/10 text-primary font-bold px-3 py-1.5 rounded-full text-sm">
                  🎫 Còn lại: {userInfo.remaining_portions} phần
                </div>
              </div>

              {/* Quantity selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-text-primary mb-3">Số lượng</label>
                <QuantitySelector
                  value={quantity}
                  max={maxQty}
                  onChange={setQuantity}
                />
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
                disabled={hasError || submitting}
              >
                {submitting ? 'Đang xử lý...' : 'Xác nhận đặt cơm 🍱'}
              </Button>
            </div>
          )}

          {/* Error: Already ordered */}
          {userInfo?.already_ordered && (
            <Alert type="warning" className="mt-4">
              ⚠️ Bạn đã đặt cơm hôm nay rồi!
            </Alert>
          )}

          {/* Error: No portions */}
          {userInfo && !userInfo.already_ordered && userInfo.remaining_portions <= 0 && (
            <Alert type="error" className="mt-4">
              ❌ Không đủ suất. Bạn đã dùng hết suất ăn.
            </Alert>
          )}
        </div>
      </main>
    </div>
  );
}
