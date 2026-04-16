import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin/* except /admin (login page) and /api/admin/login
  if (pathname.startsWith('/admin/') && !pathname.startsWith('/api/')) {
    const session = request.cookies.get('admin_session');

    if (!session?.value) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Verify the cookie contains our secret
    try {
      const decoded = Buffer.from(session.value, 'base64').toString();
      const secret = process.env.ADMIN_COOKIE_SECRET || 'default-secret';
      if (!decoded.includes(secret)) {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    } catch {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // Protect /order route
  if (pathname.startsWith('/order/')) {
    const userSession = request.cookies.get('user_session');
    if (!userSession?.value) {
      return NextResponse.redirect(new URL('/dang-nhap', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path+', '/order/:path+'],
};
