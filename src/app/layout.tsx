import type { Metadata, Viewport } from "next";
import "./globals.css";
import { UserProvider } from '@/context/UserContext';

export const metadata: Metadata = {
  title: "Đặt Cơm — Hệ thống đặt cơm trả trước",
  description: "Đặt cơm nhanh chóng, tiện lợi. Nhập mã của bạn, chọn món, xong!",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🍱</text></svg>",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#F97316",
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
