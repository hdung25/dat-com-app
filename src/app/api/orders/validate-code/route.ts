import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ valid: false, error: 'Vui lòng nhập mã' }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Look up user code
    const userDoc = await adminDb.collection('users_codes').doc(normalizedCode).get();

    if (!userDoc.exists) {
      return NextResponse.json({ valid: false, error: 'Mã không hợp lệ' });
    }

    const userData = userDoc.data()!;

    return NextResponse.json({
      valid: true,
      full_name: userData.full_name,
      phone: userData.phone,
      delivery_address: userData.delivery_address,
      remaining_portions: userData.remaining_portions,
    });
  } catch (error) {
    console.error('Error validating code:', error);
    return NextResponse.json({ valid: false, error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
