import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json({ success: false, error: 'Chưa cấu hình mật khẩu admin' }, { status: 500 });
    }

    if (password !== adminPassword) {
      return NextResponse.json({ success: false, error: 'Sai mật khẩu' }, { status: 401 });
    }

    // Create a simple session token
    const secret = process.env.ADMIN_COOKIE_SECRET || 'default-secret';
    const token = Buffer.from(`admin:${Date.now()}:${secret}`).toString('base64');

    const cookieStore = await cookies();
    cookieStore.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 28800, // 8 hours
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ success: false, error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
