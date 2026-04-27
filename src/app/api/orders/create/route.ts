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
    const body = await request.json();

    // Support 2 modes: single item or multi items
    // Single: { code, menuItemId, menuDate, quantity }
    // Multi:  { code, menuDate, items: [{ menuItemId, quantity }] }
    const { code, menuDate } = body;

    if (!code || !menuDate) {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin' }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Normalize to multi-item format
    let itemRequests: { menuItemId: string; quantity: number }[];
    if (body.items && Array.isArray(body.items)) {
      itemRequests = body.items.map((it: { menuItemId: string; quantity?: number }) => ({
        menuItemId: it.menuItemId,
        quantity: Math.max(1, Math.min(10, Number(it.quantity) || 1)),
      }));
    } else if (body.menuItemId) {
      itemRequests = [{
        menuItemId: body.menuItemId,
        quantity: Math.max(1, Math.min(10, Number(body.quantity) || 1)),
      }];
    } else {
      return NextResponse.json({ success: false, error: 'Thiếu thông tin món' }, { status: 400 });
    }

    const totalQty = itemRequests.reduce((s, it) => s + it.quantity, 0);

    // References
    const userRef = adminDb.collection('users_codes').doc(normalizedCode);
    const menuRef = adminDb.collection('menus').doc(menuDate);

    // Run atomic transaction
    const result = await adminDb.runTransaction(async (transaction) => {
      // 1. Read user
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error('Mã không hợp lệ');
      }
      const userData = userDoc.data()!;

      // 2. Check remaining portions
      if (userData.remaining_portions < totalQty) {
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

      // 5. Check duplicate — 1 user chỉ được đặt 1 lần/ngày
      const existingOrders = await adminDb.collection('orders')
        .where('user_code', '==', normalizedCode)
        .where('menu_date', '==', menuDate)
        .limit(1)
        .get();

      if (!existingOrders.empty) {
        throw new Error('Bạn đã đặt cơm hôm nay rồi. Mỗi người chỉ được đặt 1 lần/ngày.');
      }

      // 6. Read all items and validate
      const itemDocs = await Promise.all(
        itemRequests.map(it => transaction.get(menuRef.collection('items').doc(it.menuItemId)))
      );

      const orderItems: { name: string; price: number; quantity: number; menuItemId: string }[] = [];

      for (let i = 0; i < itemDocs.length; i++) {
        const itemDoc = itemDocs[i];
        const req = itemRequests[i];

        if (!itemDoc.exists || !itemDoc.data()?.is_available) {
          throw new Error(`Món "${itemDoc.data()?.name || req.menuItemId}" đã hết`);
        }
        const itemData = itemDoc.data()!;

        // Check max quantity
        if (itemData.max_quantity !== null && itemData.max_quantity !== undefined) {
          if ((itemData.ordered_count || 0) + req.quantity > itemData.max_quantity) {
            throw new Error(`Món "${itemData.name}" đã hết`);
          }
        }

        orderItems.push({
          name: itemData.name,
          price: itemData.price,
          quantity: req.quantity,
          menuItemId: req.menuItemId,
        });
      }

      // 7. All checks passed — write orders
      const orderIds: string[] = [];
      for (const item of orderItems) {
        const orderRef = adminDb.collection('orders').doc();
        transaction.set(orderRef, {
          user_code: normalizedCode,
          full_name: userData.full_name,
          phone: userData.phone,
          delivery_address: userData.delivery_address,
          menu_date: menuDate,
          menu_item_id: item.menuItemId,
          item_name: item.name,
          item_price: item.price,
          quantity: item.quantity,
          status: 'pending',
          created_at: FieldValue.serverTimestamp(),
        });
        orderIds.push(orderRef.id);

        // Update item ordered count
        transaction.update(menuRef.collection('items').doc(item.menuItemId), {
          ordered_count: FieldValue.increment(item.quantity),
        });
      }

      // Update user portions
      transaction.update(userRef, {
        used_portions: FieldValue.increment(totalQty),
        remaining_portions: FieldValue.increment(-totalQty),
      });

      return {
        order_ids: orderIds,
        remaining_portions: userData.remaining_portions - totalQty,
        item_name: orderItems.length === 1 ? orderItems[0].name : `${orderItems.length} món`,
        quantity: totalQty,
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
