import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { phone, code } = await request.json();
    
    if (!phone || !code) {
      return NextResponse.json({ success: false, error: 'Thiếu số điện thoại hoặc mã' }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Verify code exists in users_codes
    const codeRef = adminDb.collection('users_codes').doc(normalizedCode);
    const codeDoc = await codeRef.get();
    
    if (!codeDoc.exists) {
      return NextResponse.json({ success: false, error: 'Mã không tồn tại' }, { status: 404 });
    }

    // Process updates atomically
    const batch = adminDb.batch();

    // 1. Update pending_users to link the code
    const pendingRef = adminDb.collection('pending_users').doc(phone);
    batch.update(pendingRef, { linked_code: normalizedCode });

    // 2. Update users_codes to associate the phone (if not already set)
    batch.update(codeRef, { phone });

    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error linking pending user:', error);
    return NextResponse.json({ success: false, error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
