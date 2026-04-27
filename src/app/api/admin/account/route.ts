import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

// GET: lấy thông tin admin settings
export async function GET() {
  try {
    const settingsDoc = await adminDb.collection('settings').doc('admin').get();
    const settings = settingsDoc.exists ? settingsDoc.data() : {};

    return NextResponse.json({
      admin_name: settings?.admin_name || 'Admin',
      admin_email: settings?.admin_email || '',
      created_at: settings?.created_at?.toDate?.()?.toISOString() || '',
      notification_enabled: settings?.notification_enabled ?? true,
    });
  } catch (error: unknown) {
    const e = error as { code?: number };
    if (e.code === 5) {
      return NextResponse.json({
        admin_name: 'Admin',
        admin_email: '',
        notification_enabled: true,
      });
    }
    console.error('Settings error:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}

// PATCH: cập nhật settings
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { admin_name, admin_email, notification_enabled } = body;

    const updateData: Record<string, unknown> = {};
    if (admin_name !== undefined) updateData.admin_name = admin_name;
    if (admin_email !== undefined) updateData.admin_email = admin_email;
    if (notification_enabled !== undefined) updateData.notification_enabled = notification_enabled;

    await adminDb.collection('settings').doc('admin').set(updateData, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ success: false, error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
