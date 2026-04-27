import type { Metadata, Viewport } from "next";
import "./globals.css";
import { UserProvider } from '@/context/UserContext';
import UserNotifications from '@/components/UserNotifications';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

export const metadata: Metadata = {
  title: "Super Chef — Đặt cơm nhanh, tiện lợi",
  description: "Đặt cơm nhanh chóng, tiện lợi. Nhập mã của bạn, chọn món, xong! Hệ thống đặt cơm trả trước Super Chef.",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Super Chef",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#0891B2",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full">
      <body className="min-h-full flex flex-col">
        <UserProvider>
          <ServiceWorkerRegister />
          <UserNotifications />
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
