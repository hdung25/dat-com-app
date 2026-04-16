import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

function getVietnamNow(): { today: string; hours: number; minutes: number } {
  const now = new Date();
  const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const y = vnTime.getFullYear();
  const m = String(vnTime.getMonth() + 1).padStart(2, '0');
  const d = String(vnTime.getDate()).padStart(2, '0');
  return {
    today: `${y}-${m}-${d}`,
    hours: vnTime.getHours(),
    minutes: vnTime.getMinutes(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const { code, menuItemId, menuDate, quantity = 1 } = await request.json();

    if (!code || !menuItemId || !menuDate) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin' }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();
    const qty = Math.max(1, Math.min(3, Number(quantity)));

    // References
    const userRef = adminDb.collection('users_codes').doc(normalizedCode);
    const menuRef = adminDb.collection('menus').doc(menuDate);
    const itemRef = menuRef.collection('items').doc(menuItemId);

    // Run atomic transaction
    const result = await adminDb.runTransaction(async (transaction) => {
      // 1. Read user
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error('Mã không hợp lệ');
      }
      const userData = userDoc.data()!;

      // 2. Check remaining portions
      if (userData.remaining_portions < qty) {
        throw new Error(`Không đủ suất. Bạn chỉ còn ${userData.remaining_portions} phần`);
      }

      // 3. Read menu
      const menuDoc = await transaction.get(menuRef);
      if (!menuDoc.exists || !menuDoc.data()?.is_active) {
        throw new Error('Menu không khả dụng');
      }

      // 4. Check cutoff time (only for today's menu)
      const { today, hours, minutes } = getVietnamNow();
      if (menuDate === today) {
        const menuData = menuDoc.data()!;
        const [cutoffH, cutoffM] = (menuData.cutoff_time || '09:00').split(':').map(Number);
        const currentMinutes = hours * 60 + minutes;
        const cutoffMinutes = cutoffH * 60 + cutoffM;
        if (currentMinutes >= cutoffMinutes) {
          throw new Error(`Đã hết giờ đặt (chốt lúc ${menuData.cutoff_time})`);
        }
      }

      // 5. Read menu item
      const itemDoc = await transaction.get(itemRef);
      if (!itemDoc.exists || !itemDoc.data()?.is_available) {
        throw new Error('Món này đã hết');
      }
      const itemData = itemDoc.data()!;

      // 6. Check max quantity
      if (itemData.max_quantity !== null && itemData.max_quantity !== undefined) {
        if ((itemData.ordered_count || 0) + qty > itemData.max_quantity) {
          throw new Error('Món này đã hết');
        }
      }

      // 7. Check duplicate order
      const existingOrders = await adminDb.collection('orders')
        .where('user_code', '==', normalizedCode)
        .where('menu_date', '==', menuDate)
        .limit(1)
        .get();

      if (!existingOrders.empty) {
        throw new Error('Bạn đã đặt cơm hôm nay rồi');
      }

      // 8. All checks passed — write
      // Create order document
      const orderRef = adminDb.collection('orders').doc();
      transaction.set(orderRef, {
        user_code: normalizedCode,
        full_name: userData.full_name,
        phone: userData.phone,
        delivery_address: userData.delivery_address,
        menu_date: menuDate,
        menu_item_id: menuItemId,
        item_name: itemData.name,
        item_price: itemData.price,
        quantity: qty,
        created_at: FieldValue.serverTimestamp(),
      });

      // Update user portions
      transaction.update(userRef, {
        used_portions: FieldValue.increment(qty),
        remaining_portions: FieldValue.increment(-qty),
      });

      // Update item ordered count
      transaction.update(itemRef, {
        ordered_count: FieldValue.increment(qty),
      });

      return {
        order_id: orderRef.id,
        remaining_portions: userData.remaining_portions - qty,
        item_name: itemData.name,
        quantity: qty,
        delivery_address: userData.delivery_address,
      };
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống';
    console.error('Error creating order:', error);
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
