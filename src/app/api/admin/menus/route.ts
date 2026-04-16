import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET() {
  try {
    let menus: object[] = [];
    try {
      const menusSnapshot = await adminDb.collection('menus')
        .orderBy('date', 'desc')
        .limit(30)
        .get();
      menus = menusSnapshot.docs.map((doc) => ({
        date: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString() || '',
      }));
    } catch (innerErr: unknown) {
      const code = (innerErr as { code?: number }).code;
      if (code !== 5 && code !== 9) throw innerErr;
      // collection empty or index missing — return empty array
    }
    return NextResponse.json({ menus });
  } catch (error) {
    console.error('Error fetching menus:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { date, cutoff_time = '09:00' } = await request.json();

    if (!date) {
      return NextResponse.json({ error: 'Vui lòng chọn ngày' }, { status: 400 });
    }

    // Check if menu already exists
    const existing = await adminDb.collection('menus').doc(date).get();
    if (existing.exists) {
      return NextResponse.json({ error: 'Menu ngày này đã tồn tại' }, { status: 400 });
    }

    await adminDb.collection('menus').doc(date).set({
      date,
      cutoff_time,
      is_active: false,
      created_at: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, date });
  } catch (error) {
    console.error('Error creating menu:', JSON.stringify(error, null, 2));
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
