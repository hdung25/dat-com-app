import Header from '@/components/layout/Header';
import Link from 'next/link';
import Badge from '@/components/ui/Badge';

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
    'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'
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
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error('Failed to fetch');
    return await res.json();
  } catch {
    // If API fails, return empty state
    return { menu: null, items: [], is_past_cutoff: false, cutoff_time: '', message: 'Chưa có menu hôm nay.' };
  }
}

export default async function HomePage() {
  const data = await getMenu();

  return (
    <div className="min-h-screen bg-bg">
      <Header />

      <main className="max-w-2xl mx-auto pb-8 safe-bottom">
        {/* Hero */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-dark to-orange-700 mx-4 mt-4 rounded-2xl p-6 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
          <div className="relative">
            <h1 className="text-3xl font-bold mb-1">Hôm nay ăn gì?</h1>
            <p className="text-white/80 text-sm">Chọn món → nhập mã → xong!</p>
          </div>
        </div>

        {/* Date badge */}
        {data.menu && (
          <div className="px-4 mt-4">
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-border text-sm font-medium text-text-secondary">
              <span>📅</span>
              {formatVietnameseDate(data.menu.date)}
            </div>
          </div>
        )}

        {/* Cutoff warning */}
        {data.is_past_cutoff && (
          <div className="mx-4 mt-4 bg-primary/10 border border-primary/20 rounded-xl p-4 text-center animate-fade-in-up">
            <p className="text-base font-semibold text-primary-dark">
              ⏰ Đã hết giờ đặt hôm nay. Hẹn gặp lại ngày mai!
            </p>
          </div>
        )}

        {/* No menu state */}
        {!data.menu && (
          <div className="text-center py-16 px-4 animate-fade-in-up">
            <div className="text-6xl mb-4">🍳</div>
            <h2 className="text-xl font-bold text-text-primary mb-2">
              {data.message || 'Chưa có menu hôm nay'}
            </h2>
            <p className="text-text-secondary">Admin đang chuẩn bị thực đơn cho bạn...</p>
          </div>
        )}

        {/* Menu items */}
        {data.menu && data.items.length > 0 && (
          <div className="px-4 mt-4 space-y-4">
            {!data.is_past_cutoff && (
              <p className="text-sm text-text-secondary">
                ⏰ Đặt trước <span className="font-semibold text-primary">{data.cutoff_time}</span> hôm nay
              </p>
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
                    className="bg-white rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden card-press animate-fade-in-up"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    {/* Dish photo */}
                    <div className="aspect-[16/9] relative overflow-hidden bg-gradient-to-br from-orange-50 to-amber-100 flex items-center justify-center">
                      <span className="text-4xl font-bold text-orange-200">
                        {item.name.charAt(0)}
                      </span>
                      {isSoldOut && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-bold text-lg bg-red-500 px-4 py-2 rounded-full">Đã hết</span>
                        </div>
                      )}
                    </div>

                    {/* Card content */}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-text-primary mb-1 line-clamp-2">
                        {item.name}
                      </h3>
                      <p className="text-xl font-bold text-primary mb-3">
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
                          className="block w-full bg-gradient-to-r from-primary to-primary-dark text-white text-center font-semibold py-3 rounded-xl btn-press hover:shadow-lg transition-shadow"
                        >
                          Đặt ngay →
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="w-full bg-gray-200 text-gray-400 font-semibold py-3 rounded-xl cursor-not-allowed"
                        >
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

        {/* Empty items state */}
        {data.menu && data.items.length === 0 && (
          <div className="text-center py-16 px-4 animate-fade-in-up">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-bold text-text-primary mb-2">Chưa có món nào</h2>
            <p className="text-text-secondary">Admin đang cập nhật thực đơn...</p>
          </div>
        )}
      </main>
    </div>
  );
}
