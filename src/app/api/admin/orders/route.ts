import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

function getVietnamToday(): string {
  const now = new Date();
  const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const y = vnTime.getFullYear();
  const m = String(vnTime.getMonth() + 1).padStart(2, '0');
  const d = String(vnTime.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function GET(request: NextRequest) {
  try {
    const dateParam = request.nextUrl.searchParams.get('date');
    const date = dateParam || getVietnamToday();

    const ordersSnapshot = await adminDb.collection('orders')
      .where('menu_date', '==', date)
      .orderBy('created_at', 'desc')
      .get();

    const orders = ordersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.()?.toISOString() || '',
    }));

    return NextResponse.json({ orders, date });
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code === 5 || err.code === 9) {
      return NextResponse.json({ orders: [], date: getVietnamToday() });
    }
    console.error('Orders list error:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}

// PATCH: update order status
export async function PATCH(request: NextRequest) {
  try {
    const { orderId, status } = await request.json();

    if (!orderId || !status) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin' }, { status: 400 });
    }

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: 'Trạng thái không hợp lệ' }, { status: 400 });
    }

    const orderRef = adminDb.collection('orders').doc(orderId);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy đơn hàng' }, { status: 404 });
    }

    await orderRef.update({ status });

    // If cancelled, refund portions back to user
    if (status === 'cancelled') {
      const orderData = orderDoc.data()!;
      const userRef = adminDb.collection('users_codes').doc(orderData.user_code);
      const { FieldValue } = await import('firebase-admin/firestore');
      await userRef.update({
        used_portions: FieldValue.increment(-orderData.quantity),
        remaining_portions: FieldValue.increment(orderData.quantity),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Order update error:', error);
    return NextResponse.json({ success: false, error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
