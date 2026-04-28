import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ valid: false, error: 'Vui lòng nhập mã' }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();

    // Look up user
    const userDoc = await adminDb.collection('users_codes').doc(normalizedCode).get();

    if (!userDoc.exists) {
      return NextResponse.json({ valid: false, error: 'Mã không hợp lệ' });
    }

    const userData = userDoc.data()!;

    // Get orders for this user
    const ordersSnapshot = await adminDb.collection('orders')
      .where('user_code', '==', normalizedCode)
      .get();

    const orders = ordersSnapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString() || '',
      }))
      .sort((a, b) => (b.created_at > a.created_at ? 1 : -1));

    // Group into sessions
    const sessionMap = new Map<string, {
      session_id: string;
      items: Array<{
        id: string;
        item_name: string;
        item_price: number;
        quantity: number;
        status: string;
      }>;
      created_at: string;
      menu_date: string;
      delivery_address: string;
      status: string;
      totalAmount: number;
      totalQty: number;
      discount_type: string | null;
      discount_value: number | null;
      discount_amount: number;
    }>();

    for (const order of orders) {
      const key = (order as Record<string, unknown>).session_id as string ||
        `legacy-${normalizedCode}-${((order as Record<string, unknown>).created_at as string)?.slice(0, 16)}`;

      if (!sessionMap.has(key)) {
        sessionMap.set(key, {
          session_id: key,
          items: [],
          created_at: (order as Record<string, unknown>).created_at as string,
          menu_date: (order as Record<string, unknown>).menu_date as string,
          delivery_address: (order as Record<string, unknown>).delivery_address as string || userData.delivery_address,
          status: 'completed',
          totalAmount: 0,
          totalQty: 0,
          discount_type: null,
          discount_value: null,
          discount_amount: 0,
        });
      }

      const session = sessionMap.get(key)!;
      const orderData = order as Record<string, unknown>;
      session.items.push({
        id: order.id,
        item_name: orderData.item_name as string,
        item_price: orderData.item_price as number,
        quantity: orderData.quantity as number,
        status: (orderData.status as string) || 'pending',
      });
    }

    // Calculate session status and totals
    const sessions = Array.from(sessionMap.values()).map(session => {
      const statuses = session.items.map(i => i.status);
      let status = 'completed';
      if (statuses.includes('pending')) status = 'pending';
      else if (statuses.includes('confirmed')) status = 'confirmed';
      else if (statuses.includes('item_unavailable')) status = 'item_unavailable';
      else if (statuses.every(s => s === 'cancelled')) status = 'cancelled';

      const activeItems = session.items.filter(i => i.status !== 'cancelled');
      const totalAmount = activeItems.reduce((s, i) => s + i.item_price * i.quantity, 0);
      const totalQty = activeItems.reduce((s, i) => s + i.quantity, 0);

      return {
        ...session,
        status,
        totalAmount,
        totalQty,
      };
    });

    // Fetch discount info from order_discounts collection
    for (const session of sessions) {
      try {
        const discountDoc = await adminDb.collection('order_discounts').doc(session.session_id).get();
        if (discountDoc.exists) {
          const discountData = discountDoc.data()!;
          session.discount_type = discountData.discount_type || null;
          session.discount_value = discountData.discount_value || null;
          if (discountData.discount_type === 'percent') {
            session.discount_amount = Math.round(session.totalAmount * (discountData.discount_value / 100));
          } else if (discountData.discount_type === 'amount') {
            session.discount_amount = discountData.discount_value;
          }
        }
      } catch {
        // ignore discount fetch errors
      }
    }

    return NextResponse.json({
      valid: true,
      full_name: userData.full_name,
      phone: userData.phone,
      delivery_address: userData.delivery_address,
      sessions,
    });
  } catch (error) {
    console.error('Error tracking order:', error);
    return NextResponse.json({ valid: false, error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
