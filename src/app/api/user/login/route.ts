import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json();

    if (!phone || !password) {
      return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
    }

    const doc = await adminDb.collection('pending_users').doc(phone).get();
    if (!doc.exists) {
      return NextResponse.json({ error: 'Số điện thoại hoặc mật khẩu không đúng' }, { status: 401 });
    }

    const data = doc.data()!;
    const match = await bcrypt.compare(password, data.password_hash);
    if (!match) {
      return NextResponse.json({ error: 'Số điện thoại hoặc mật khẩu không đúng' }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set('user_session', phone, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      code: data.linked_code || null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
