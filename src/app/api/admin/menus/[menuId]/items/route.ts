import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ menuId: string }> }
) {
  try {
    const { menuId } = await params;
    const body = await request.json();

    if (!body.name) {
      return NextResponse.json({ error: 'Vui lòng nhập tên món' }, { status: 400 });
    }

    const itemRef = adminDb.collection('menus').doc(menuId).collection('items').doc();

    await itemRef.set({
      name: body.name,
      image_url: '',
      price: body.price || 0,
      max_quantity: body.max_quantity || null,
      ordered_count: 0,
      is_available: true,
    });

    return NextResponse.json({ success: true, id: itemRef.id });
  } catch (error) {
    console.error('Error adding menu item:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
