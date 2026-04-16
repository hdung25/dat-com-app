import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json();

    if (!phone || !password) {
      return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 });
    }
    if (!phone.match(/^(0|\+84)[0-9]{8,10}$/)) {
      return NextResponse.json({ error: 'Số điện thoại không hợp lệ' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Mật khẩu ít nhất 6 ký tự' }, { status: 400 });
    }

    // Check duplicate
    const existing = await adminDb.collection('pending_users').doc(phone).get();
    if (existing.exists) {
      return NextResponse.json({ error: 'Số điện thoại này đã được đăng ký' }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);

    await adminDb.collection('pending_users').doc(phone).set({
      phone,
      password_hash: hashed,
      linked_code: null,
      registered_at: FieldValue.serverTimestamp(),
    });

    // Auto login after register — set cookie
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    cookieStore.set('user_session', phone, {
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
