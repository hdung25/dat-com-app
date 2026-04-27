import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

// Admin đánh dấu món hết → tạo thông báo cho user
export async function POST(request: NextRequest) {
  try {
    const { menuDate, menuItemId, reason } = await request.json();

    if (!menuDate || !menuItemId) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin' }, { status: 400 });
    }

    // 1. Đánh dấu món hết
    const itemRef = adminDb.collection('menus').doc(menuDate).collection('items').doc(menuItemId);
    const itemDoc = await itemRef.get();

    if (!itemDoc.exists) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy món' }, { status: 404 });
    }

    const itemData = itemDoc.data()!;
    await itemRef.update({ is_available: false });

    // 2. Tìm tất cả đơn đang pending/confirmed cho món này
    const affectedOrders = await adminDb.collection('orders')
      .where('menu_date', '==', menuDate)
      .where('menu_item_id', '==', menuItemId)
      .where('status', 'in', ['pending', 'confirmed'])
      .get();

    // 3. Tạo thông báo cho từng user bị ảnh hưởng
    const batch = adminDb.batch();
    const notifiedUsers = new Set<string>();

    for (const orderDoc of affectedOrders.docs) {
      const order = orderDoc.data();
      const userCode = order.user_code;

      // Đánh dấu đơn là cần user xử lý
      batch.update(orderDoc.ref, { status: 'item_unavailable' });

      if (!notifiedUsers.has(userCode)) {
        notifiedUsers.add(userCode);

        // Tạo notification document
        const notifRef = adminDb.collection('notifications').doc();
        batch.set(notifRef, {
          user_code: userCode,
          type: 'item_unavailable',
          title: `Món "${itemData.name}" đã hết`,
          message: reason || `Rất tiếc, món "${itemData.name}" đã hết. Vui lòng chọn món khác hoặc hủy đơn.`,
          menu_date: menuDate,
          menu_item_id: menuItemId,
          item_name: itemData.name,
          order_id: orderDoc.id,
          is_read: false,
          created_at: new Date(),
        });
      }
    }

    await batch.commit();

    return NextResponse.json({
      success: true,
      affected_orders: affectedOrders.size,
      notified_users: notifiedUsers.size,
    });
  } catch (error) {
    console.error('Sold out error:', error);
    return NextResponse.json({ success: false, error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
