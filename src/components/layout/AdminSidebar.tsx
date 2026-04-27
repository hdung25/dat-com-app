'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/admin/dashboard', label: 'Tổng quan' },
  { href: '/admin/orders', label: 'Nhận đơn' },
  { href: '/admin/menus', label: 'Thực đơn' },
  { href: '/admin/dishes', label: 'Thư viện món' },
  { href: '/admin/users', label: 'Mã người dùng' },
  { href: '/admin/reports', label: 'Báo cáo' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-[#18181b] min-h-screen fixed left-0 top-0 z-40">
        <div className="px-6 py-5 border-b border-white/10">
          <Link href="/admin/dashboard">
            <div className="font-bold text-white text-base leading-tight">Đặt Cơm</div>
            <div className="text-xs text-zinc-500 mt-0.5">Quản trị hệ thống</div>
          </Link>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-orange-500 text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
          <Link
            href="/"
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Trang người dùng
          </Link>
          <button
            onClick={() => {
              document.cookie = 'admin_session=; Max-Age=0; path=/';
              window.location.href = '/admin';
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#18181b] border-t border-white/10 z-40">
        <div className="flex justify-around items-center h-14">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center px-2 py-2 text-xs font-medium transition-colors
                  ${isActive ? 'text-orange-500' : 'text-zinc-500'}`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
