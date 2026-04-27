import Image from 'next/image';
import Header from '@/components/layout/Header';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

interface MenuItemData {
  id: string;
  name: string;
  price: number;
  max_quantity: number | null;
  ordered_count: number;
  is_available: boolean;
}

interface MenuData {
  date: string;
  cutoff_time: string;
  is_active: boolean;
}

interface MenuResponse {
  menu: MenuData | null;
  items: MenuItemData[];
  is_past_cutoff: boolean;
  cutoff_time: string;
  message?: string;
}

function formatVietnameseDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const months = [
    'tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6',
    'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12',
  ];
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} năm ${date.getFullYear()}`;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
}

async function getMenu(): Promise<MenuResponse> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/menu/today`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    return { menu: null, items: [], is_past_cutoff: false, cutoff_time: '', message: 'Chưa có menu hôm nay.' };
  }
}

export default async function HomePage() {
  const data = await getMenu();

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <main className="max-w-2xl mx-auto pb-12 safe-bottom">

        {/* ── Hero Banner ── */}
        <div className="relative overflow-hidden gradient-hero mx-4 mt-4 rounded-3xl p-6 text-white shadow-xl shadow-cyan-900/25">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
          <div className="absolute bottom-0 left-0 w-36 h-36 bg-cyan-400/10 rounded-full translate-y-12 -translate-x-12" />
          <div className="absolute top-1/2 right-12 w-20 h-20 bg-sky-300/10 rounded-full -translate-y-10" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-semibold mb-3 border border-white/20">
                {/* Sparkle icon */}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                </svg>
                Menu hôm nay
              </div>
              <h1 className="text-3xl font-extrabold mb-1 leading-tight">Hôm nay<br/>ăn gì? 🍱</h1>
              <p className="text-white/75 text-sm mt-2">Chọn món → nhập mã → xong!</p>
            </div>

            {/* Logo floating */}
            <div className="shrink-0 w-16 h-16 rounded-2xl overflow-hidden shadow-lg ring-2 ring-white/20 animate-float">
              <Image
                src="/logo.png"
                alt="Super Chef"
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* ── Date Badge ── */}
        {data.menu && (
          <div className="px-4 mt-4 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-white rounded-2xl px-4 py-2.5 shadow-sm border border-cyan-100 text-sm font-medium text-slate-600">
              {/* Calendar icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="3" ry="3"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {formatVietnameseDate(data.menu.date)}
            </div>
          </div>
        )}

        {/* ── Cutoff Warning ── */}
        {data.is_past_cutoff && (
          <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 animate-fade-in-up">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              {/* Clock icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-amber-800 text-sm">Đã hết giờ đặt hôm nay</p>
              <p className="text-amber-600 text-xs mt-0.5">Hẹn gặp lại ngày mai bạn nhé! 👋</p>
            </div>
          </div>
        )}

        {/* ── No Menu State ── */}
        {!data.menu && (
          <div className="text-center py-20 px-4 animate-fade-in-up">
            <div className="w-24 h-24 bg-cyan-50 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="1.5">
                <path d="M3 11h18M3 11a9 9 0 0118 0M3 11v2a9 9 0 0018 0v-2"/><path d="M9 11V7a3 3 0 016 0v4"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              {data.message || 'Chưa có menu hôm nay'}
            </h2>
            <p className="text-slate-500 text-sm">Admin đang chuẩn bị thực đơn cho bạn...</p>
          </div>
        )}

        {/* ── Menu Grid ── */}
        {data.menu && data.items.length > 0 && (
          <div className="px-4 mt-5 space-y-4">
            {/* Cutoff time notice */}
            {!data.is_past_cutoff && (
              <div className="flex items-center gap-2 bg-cyan-50 border border-cyan-100 rounded-xl px-4 py-2.5 animate-fade-in-up">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <p className="text-sm text-slate-600">
                  Đặt trước{' '}
                  <span className="font-bold text-cyan-700">{data.cutoff_time}</span>{' '}
                  hôm nay
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {data.items.map((item, index) => {
                const remaining = item.max_quantity
                  ? item.max_quantity - (item.ordered_count || 0)
                  : null;
                const isSoldOut = remaining !== null && remaining <= 0;

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 card-press animate-fade-in-up"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    {/* Visual placeholder */}
                    <div className="aspect-[16/9] relative overflow-hidden bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-100 flex items-center justify-center">
                      {/* Pattern */}
                      <div className="absolute inset-0 opacity-20"
                        style={{
                          backgroundImage: `radial-gradient(circle at 25% 25%, #0891B2 1px, transparent 1px),
                                            radial-gradient(circle at 75% 75%, #06B6D4 1px, transparent 1px)`,
                          backgroundSize: '32px 32px'
                        }}
                      />
                      <div className="relative flex flex-col items-center gap-1">
                        {/* Bowl icon */}
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0891B2" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 11h18a9 9 0 01-18 0z"/>
                          <path d="M8 11V9a4 4 0 018 0v2"/>
                          <path d="M12 3c0 0 0-1 0-1"/>
                          <path d="M9.5 2.5c0 0 1.5-1 2.5 0 1-.5 2.5.5 2.5.5" strokeWidth="1" strokeDasharray="1.5 1"/>
                        </svg>
                        <span className="text-2xl font-black text-cyan-200 select-none">
                          {item.name.charAt(0)}
                        </span>
                      </div>

                      {/* Sold out overlay */}
                      {isSoldOut && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                          <span className="text-white font-bold text-sm bg-red-500/90 px-4 py-1.5 rounded-full flex items-center gap-1.5">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                            </svg>
                            Đã hết
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card content */}
                    <div className="p-4">
                      <h3 className="font-bold text-base text-slate-800 mb-1 line-clamp-2 leading-snug">
                        {item.name}
                      </h3>
                      <p className="text-xl font-extrabold text-cyan-700 mb-3">
                        {formatPrice(item.price)}
                      </p>

                      {remaining !== null && !isSoldOut && (
                        <Badge
                          variant={remaining > 5 ? 'success' : remaining > 0 ? 'warning' : 'danger'}
                          className="mb-3"
                        >
                          Còn {remaining} suất
                        </Badge>
                      )}

                      {!data.is_past_cutoff && !isSoldOut ? (
                        <Link
                          href={`/order/${item.id}?date=${data.menu!.date}`}
                          className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-700 hover:to-sky-700 text-white text-center font-semibold py-3 rounded-2xl btn-press shadow-md shadow-cyan-200/50 hover:shadow-lg hover:shadow-cyan-300/50 transition-all duration-200"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>
                          </svg>
                          Đặt ngay
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="w-full bg-slate-100 text-slate-400 font-semibold py-3 rounded-2xl cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                          </svg>
                          {isSoldOut ? 'Đã hết' : 'Hết giờ đặt'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Empty Items State ── */}
        {data.menu && data.items.length === 0 && (
          <div className="text-center py-20 px-4 animate-fade-in-up">
            <div className="w-24 h-24 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-inner">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-700 mb-2">Chưa có món nào</h2>
            <p className="text-slate-400 text-sm">Admin đang cập nhật thực đơn...</p>
          </div>
        )}

      </main>
    </div>
  );
}
