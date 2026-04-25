import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// GET  /api/admin/dishes  — list all dishes in library
export async function GET() {
  try {
    const snap = await adminDb.collection('dish_library').orderBy('name', 'asc').get();
    const dishes = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json({ dishes });
  } catch (err: unknown) {
    const e = err as { code?: number };
    if (e.code === 5 || e.code === 9) return NextResponse.json({ dishes: [] });
    console.error('Error fetching dishes:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}

// POST /api/admin/dishes  — create new dish in library
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Vui lòng nhập tên món' }, { status: 400 });
    }

    const ref = adminDb.collection('dish_library').doc();
    await ref.set({
      name: body.name.trim(),
      price: Number(body.price) || 0,
      created_at: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, id: ref.id });
  } catch (err) {
    console.error('Error creating dish:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
