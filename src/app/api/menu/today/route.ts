import { NextResponse } from 'next/server';
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

function getVietnamNow(): { hours: number; minutes: number } {
  const now = new Date();
  const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  return { hours: vnTime.getHours(), minutes: vnTime.getMinutes() };
}

export async function GET() {
  try {
    const today = getVietnamToday();

    // First try today's menu
    let menuDoc = await adminDb.collection('menus').doc(today).get();

    if (!menuDoc.exists || !menuDoc.data()?.is_active) {
      // Try to find any active menu
      const activeMenus = await adminDb.collection('menus')
        .where('is_active', '==', true)
        .orderBy('date', 'asc')
        .limit(1)
        .get();

      if (activeMenus.empty) {
        return NextResponse.json({
          menu: null,
          items: [],
          message: 'Chưa có menu hôm nay. Admin đang chuẩn bị... 🍳',
        });
      }
      menuDoc = activeMenus.docs[0];
    }

    const menuData = menuDoc.data()!;
    const menuDate = menuDoc.id;

    // Check cutoff time
    const { hours, minutes } = getVietnamNow();
    const [cutoffH, cutoffM] = (menuData.cutoff_time || '09:00').split(':').map(Number);
    const currentMinutes = hours * 60 + minutes;
    const cutoffMinutes = cutoffH * 60 + cutoffM;

    // Only check cutoff for today's menu
    const isPastCutoff = menuDate === today && currentMinutes >= cutoffMinutes;

    // Get menu items
    const itemsSnapshot = await adminDb
      .collection('menus')
      .doc(menuDate)
      .collection('items')
      .where('is_available', '==', true)
      .get();

    const items = itemsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      menu: {
        date: menuDate,
        cutoff_time: menuData.cutoff_time,
        is_active: menuData.is_active,
      },
      items,
      is_past_cutoff: isPastCutoff,
      cutoff_time: menuData.cutoff_time,
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error: unknown) {
    // Firestore NOT_FOUND (code 5) means the database/collection doesn't exist yet — treat as empty
    const firestoreError = error as { code?: number };
    if (firestoreError.code === 5) {
      return NextResponse.json({
        menu: null,
        items: [],
        message: 'Chưa có menu hôm nay. Admin đang chuẩn bị... 🍳',
      });
    }
    console.error('Error fetching menu:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
