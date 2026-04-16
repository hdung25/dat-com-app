import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ menuId: string; itemId: string }> }
) {
  try {
    const { menuId, itemId } = await params;
    const body = await request.json();

    const itemRef = adminDb.collection('menus').doc(menuId).collection('items').doc(itemId);
    const itemDoc = await itemRef.get();

    if (!itemDoc.exists) {
      return NextResponse.json({ error: 'Món không tồn tại' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.image_url !== undefined) updateData.image_url = body.image_url;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.max_quantity !== undefined) updateData.max_quantity = body.max_quantity;
    if (body.is_available !== undefined) updateData.is_available = body.is_available;

    await itemRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ menuId: string; itemId: string }> }
) {
  try {
    const { menuId, itemId } = await params;
    await adminDb.collection('menus').doc(menuId).collection('items').doc(itemId).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
