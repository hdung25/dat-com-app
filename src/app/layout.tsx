import type { Metadata, Viewport } from "next";
import "./globals.css";
import { UserProvider } from '@/context/UserContext';

export const metadata: Metadata = {
  title: "CƠMCƠM — Đặt cơm nhanh, tiện lợi",
  description: "Đặt cơm nhanh chóng, tiện lợi. Nhập mã của bạn, chọn món, xong! Hệ thống đặt cơm trả trước CƠMCƠM.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
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
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
