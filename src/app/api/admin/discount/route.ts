import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// GET: get discount for a session
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    if (!sessionId) {
      return NextResponse.json({ discount: null });
    }

    const discountDoc = await adminDb.collection('order_discounts').doc(sessionId).get();
    if (!discountDoc.exists) {
      return NextResponse.json({ discount: null });
    }

    return NextResponse.json({ discount: discountDoc.data() });
  } catch (error) {
    console.error('Error getting discount:', error);
    return NextResponse.json({ discount: null });
  }
}

// POST: set discount for a session
export async function POST(request: NextRequest) {
  try {
    const { sessionId, discountType, discountValue } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Thiếu session ID' }, { status: 400 });
    }

    if (!discountType || !discountValue) {
      // Remove discount if empty
      await adminDb.collection('order_discounts').doc(sessionId).delete();
      return NextResponse.json({ success: true, removed: true });
    }

    if (!['percent', 'amount'].includes(discountType)) {
      return NextResponse.json({ success: false, error: 'Loại giảm giá không hợp lệ' }, { status: 400 });
    }

    const value = Number(discountValue);
    if (isNaN(value) || value <= 0) {
      return NextResponse.json({ success: false, error: 'Giá trị giảm giá không hợp lệ' }, { status: 400 });
    }

    if (discountType === 'percent' && value > 100) {
      return NextResponse.json({ success: false, error: 'Phần trăm giảm không thể > 100%' }, { status: 400 });
    }

    const { FieldValue } = await import('firebase-admin/firestore');

    await adminDb.collection('order_discounts').doc(sessionId).set({
      session_id: sessionId,
      discount_type: discountType,
      discount_value: value,
      updated_at: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting discount:', error);
    return NextResponse.json({ success: false, error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
