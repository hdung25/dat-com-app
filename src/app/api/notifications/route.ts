import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// GET: lấy thông báo cho user
export async function GET(request: NextRequest) {
  try {
    const userCode = request.nextUrl.searchParams.get('code');

    if (!userCode) {
      return NextResponse.json({ notifications: [] });
    }

    const snapshot = await adminDb.collection('notifications')
      .where('user_code', '==', userCode.toUpperCase())
      .where('is_read', '==', false)
      .orderBy('created_at', 'desc')
      .limit(20)
      .get();

    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.()?.toISOString() || '',
    }));

    return NextResponse.json({ notifications });
  } catch (error: unknown) {
    const e = error as { code?: number };
    if (e.code === 5 || e.code === 9) {
      return NextResponse.json({ notifications: [] });
    }
    console.error('Notifications error:', error);
    return NextResponse.json({ notifications: [] });
  }
}

// PATCH: đánh dấu đã đọc
export async function PATCH(request: NextRequest) {
  try {
    const { notificationId } = await request.json();
    if (!notificationId) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    await adminDb.collection('notifications').doc(notificationId).update({
      is_read: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification update error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
