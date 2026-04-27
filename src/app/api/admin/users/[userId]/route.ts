import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();

    const userRef = adminDb.collection('users_codes').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Mã không tồn tại' }, { status: 404 });
    }

    const userData = userDoc.data()!;
    const updateData: Record<string, unknown> = {};

    if (body.full_name !== undefined) updateData.full_name = body.full_name;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.delivery_address !== undefined) updateData.delivery_address = body.delivery_address;

    // Handle portion top-up
    if (body.add_portions !== undefined && body.add_portions > 0) {
      updateData.total_portions = userData.total_portions + body.add_portions;
      updateData.remaining_portions = userData.remaining_portions + body.add_portions;
    }

    // Handle direct set of total_portions (for edit mode)
    if (body.total_portions !== undefined && body.add_portions === undefined) {
      const diff = body.total_portions - userData.total_portions;
      updateData.total_portions = body.total_portions;
      updateData.remaining_portions = Math.max(0, userData.remaining_portions + diff);
    }

    await userRef.update(updateData);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const userRef = adminDb.collection('users_codes').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'Mã không tồn tại' }, { status: 404 });
    }

    await userRef.delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
