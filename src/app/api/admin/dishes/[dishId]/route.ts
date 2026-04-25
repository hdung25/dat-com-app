import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// DELETE /api/admin/dishes/[dishId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ dishId: string }> }
) {
  try {
    const { dishId } = await params;
    await adminDb.collection('dish_library').doc(dishId).delete();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting dish:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}

// PATCH /api/admin/dishes/[dishId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ dishId: string }> }
) {
  try {
    const { dishId } = await params;
    const body = await request.json();
    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name.trim();
    if (body.price !== undefined) update.price = Number(body.price) || 0;
    await adminDb.collection('dish_library').doc(dishId).update(update);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating dish:', err);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
