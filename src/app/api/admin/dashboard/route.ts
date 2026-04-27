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
    let orders: Record<string, unknown>[] = [];
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
    } catch (err: unknown) {
      const e = err as { code?: number; details?: string; message?: string };
      if (e.code === 9) {
        console.log('--- Firestore composite index required for orders ---');
        console.log(e.details || e.message);
      } else if (e.code !== 5) {
        throw err;
      }
    }

    // Compute stats from real order data
    const activeOrders = orders.filter(o => (o.status as string || 'pending') !== 'cancelled');
    const totalOrders = activeOrders.length;
    const totalPortions = activeOrders.reduce((sum, o) => sum + ((o.quantity as number) || 0), 0);
    const totalRevenue = activeOrders.reduce((sum, o) =>
      sum + ((o.item_price as number) || 0) * ((o.quantity as number) || 0), 0);
    const uniqueOrderers = new Set(activeOrders.map(o => o.user_code as string)).size;

    // Check menu items for low stock
    let lowStockItems: Array<{ name: string; remaining: number }> = [];
    let menuInfo: { date: string; cutoff_time: string; is_active: boolean; total_items: number } | null = null;
    try {
      const menuDoc = await adminDb.collection('menus').doc(today).get();

      if (menuDoc.exists) {
        const menuData = menuDoc.data()!;
        const itemsSnapshot = await adminDb.collection('menus').doc(today).collection('items').get();

        menuInfo = {
          date: today,
          cutoff_time: menuData.cutoff_time || '09:00',
          is_active: menuData.is_active ?? false,
          total_items: itemsSnapshot.size,
        };

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
    } catch (err: unknown) {
      const e = err as { code?: number };
      if (e.code !== 5) throw err;
    }

    // Total users
    let totalUsers = 0;
    try {
      const usersSnapshot = await adminDb.collection('users_codes').get();
      totalUsers = usersSnapshot.size;
    } catch (err: unknown) {
      const e = err as { code?: number };
      if (e.code !== 5) throw err;
    }

    return NextResponse.json({
      today,
      total_orders: totalOrders,
      total_portions: totalPortions,
      total_revenue: totalRevenue,
      active_users: uniqueOrderers,
      total_users: totalUsers,
      low_stock_items: lowStockItems,
      menu_info: menuInfo,
      orders,
    });
  } catch (error: unknown) {
    const e = error as { code?: number };
    if (e.code === 5 || e.code === 9) {
      return NextResponse.json({
        today: getVietnamToday(),
        total_orders: 0,
        total_portions: 0,
        total_revenue: 0,
        active_users: 0,
        total_users: 0,
        low_stock_items: [],
        menu_info: null,
        orders: [],
      });
    }
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
