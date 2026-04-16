import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ menuId: string }> }
) {
  try {
    const { menuId } = await params;
    const menuDoc = await adminDb.collection('menus').doc(menuId).get();

    if (!menuDoc.exists) {
      return NextResponse.json({ error: 'Menu không tồn tại' }, { status: 404 });
    }

    const itemsSnapshot = await adminDb.collection('menus').doc(menuId).collection('items').get();
    const items = itemsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      menu: { date: menuDoc.id, ...menuDoc.data() },
      items,
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ menuId: string }> }
) {
  try {
    const { menuId } = await params;
    const body = await request.json();

    const menuRef = adminDb.collection('menus').doc(menuId);
    const menuDoc = await menuRef.get();

    if (!menuDoc.exists) {
      return NextResponse.json({ error: 'Menu không tồn tại' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.cutoff_time) updateData.cutoff_time = body.cutoff_time;

    await menuRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating menu:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ menuId: string }> }
) {
  try {
    const { menuId } = await params;

    // Delete all items in the subcollection first
    const itemsSnapshot = await adminDb.collection('menus').doc(menuId).collection('items').get();
    const batch = adminDb.batch();
    itemsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    batch.delete(adminDb.collection('menus').doc(menuId));
    await batch.commit();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting menu:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
