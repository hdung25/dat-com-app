import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

function getVietnamToday(): string {
  const now = new Date();
  const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const y = vnTime.getFullYear();
  const m = String(vnTime.getMonth() + 1).padStart(2, '0');
  const d = String(vnTime.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function GET() {
  try {
    const today = getVietnamToday();

    // Today's orders
    let orders: any[] = [];
    try {
      const ordersSnapshot = await adminDb.collection('orders')
        .where('menu_date', '==', today)
        .orderBy('created_at', 'desc')
        .get();

      orders = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString() || '',
      }));
    } catch (err: any) {
      if (err.code === 9) {
        console.log('\n--- 🔥 YÊU CẦU TẠO INDEX TRÊN FIRESTORE CHO DASHBOARD ---');
        console.log('Collection "orders" thiếu Composite Index. Hãy click vào đoạn URL bắt đầu bằng https://console.firebase.google.com trong lỗi dưới đây để tạo tự động:');
        console.log(err.details || err.message);
        console.log('------------------------------------------------------------------\n');
      } else if (err.code !== 5) {
        throw err;
      }
    }

    const totalOrders = orders.length;
    const totalPortions = orders.reduce((sum, o) => sum + ((o as Record<string, unknown>).quantity as number || 0), 0);

    // Check menu items for low stock
    let lowStockItems: Array<{ name: string; remaining: number }> = [];
    try {
      const menuDoc = await adminDb.collection('menus').doc(today).get();

      if (menuDoc.exists) {
        const itemsSnapshot = await adminDb.collection('menus').doc(today).collection('items').get();
        lowStockItems = itemsSnapshot.docs
          .filter((doc) => {
            const data = doc.data();
            return data.max_quantity && (data.max_quantity - (data.ordered_count || 0)) <= 5;
          })
          .map((doc) => {
            const data = doc.data();
            return {
              name: data.name,
              remaining: data.max_quantity - (data.ordered_count || 0),
            };
          });
      }
    } catch (err: any) {
      if (err.code !== 5) throw err;
    }

    // Active user count
    let activeUsers = 0;
    let totalUsers = 0;
    try {
      const usersSnapshot = await adminDb.collection('users_codes').get();
      totalUsers = usersSnapshot.size;
      activeUsers = usersSnapshot.docs.filter((doc) => doc.data().remaining_portions > 0).length;
    } catch (err: any) {
      if (err.code !== 5) throw err;
    }

    return NextResponse.json({
      today,
      total_orders: totalOrders,
      total_portions: totalPortions,
      active_users: activeUsers,
      total_users: totalUsers,
      low_stock_items: lowStockItems,
      orders,
    });
  } catch (error: any) {
    if (error.code === 5 || error.code === 9) {
      return NextResponse.json({
        today: getVietnamToday(),
        total_orders: 0,
        total_portions: 0,
        active_users: 0,
        total_users: 0,
        low_stock_items: [],
        orders: [],
      });
    }
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
