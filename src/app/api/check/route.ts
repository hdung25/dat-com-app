import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ valid: false, error: 'Vui lòng nhập mã' }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Look up user
    const userDoc = await adminDb.collection('users_codes').doc(normalizedCode).get();

    if (!userDoc.exists) {
      return NextResponse.json({ valid: false, error: 'Mã không hợp lệ' });
    }

    const userData = userDoc.data()!;

    // Get recent orders (last 10)
    // Note: avoid combining .where() + .orderBy() on different fields to prevent
    // requiring a composite Firestore index that may not exist yet.
    const ordersSnapshot = await adminDb.collection('orders')
      .where('user_code', '==', normalizedCode)
      .get();

    const orders = ordersSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString() || '',
      }))
      .sort((a, b) => (b.created_at > a.created_at ? 1 : -1))
      .slice(0, 10);

    return NextResponse.json({
      valid: true,
      full_name: userData.full_name,
      phone: userData.phone,
      delivery_address: userData.delivery_address,
      total_portions: userData.total_portions,
      used_portions: userData.used_portions,
      remaining_portions: userData.remaining_portions,
      orders,
    });
  } catch (error) {
    console.error('Error checking code:', error);
    return NextResponse.json({ valid: false, error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
