import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const from = request.nextUrl.searchParams.get('from');
    const to = request.nextUrl.searchParams.get('to');
    const format = request.nextUrl.searchParams.get('format');

    let query = adminDb.collection('orders').orderBy('created_at', 'desc');

    // We can't do range queries on menu_date directly without Firestore
    // composite indexes, so we fetch and filter
    const snapshot = await query.limit(1000).get();

    let orders = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.()?.toISOString() || '',
    }));

    // Filter by date range
    if (from) {
      orders = orders.filter((o) => (o as Record<string, unknown>).menu_date as string >= from);
    }
    if (to) {
      orders = orders.filter((o) => (o as Record<string, unknown>).menu_date as string <= to);
    }

    // CSV export
    if (format === 'csv') {
      const BOM = '\uFEFF';
      const headers = 'Ngày,Mã,Họ tên,Món,Số lượng,Giá,Địa chỉ,SĐT';
      const rows = orders.map((o) => {
        const order = o as Record<string, unknown>;
        return [
          order.menu_date,
          order.user_code,
          order.full_name,
          order.item_name,
          order.quantity,
          order.item_price,
          `"${(order.delivery_address as string || '').replace(/"/g, '""')}"`,
          order.phone,
        ].join(',');
      });

      const csv = BOM + headers + '\n' + rows.join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="bao-cao-${from || 'all'}-${to || 'all'}.csv"`,
        },
      });
    }

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
