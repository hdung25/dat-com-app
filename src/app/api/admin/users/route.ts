import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search')?.trim().toUpperCase() || '';
    let users: object[] = [];
    let pending: object[] = [];
    try {
      const [usersSnap, pendingSnap] = await Promise.all([
        adminDb.collection('users_codes').orderBy('code', 'asc').get().catch(() => ({ docs: [] })),
        adminDb.collection('pending_users').orderBy('registered_at', 'desc').get().catch(() => ({ docs: [] }))
      ]);

      users = usersSnap.docs.map(doc => ({
        code: doc.id,
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.()?.toISOString() || '',
      }));

      pending = pendingSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        registered_at: doc.data().registered_at?.toDate?.()?.toISOString() || '',
      }));
    } catch (innerErr: unknown) {
      const code = (innerErr as { code?: number }).code;
      if (code !== 5 && code !== 9) throw innerErr;
    }

    if (search) {
      users = users.filter((u: object) => {
        const user = u as Record<string, string>;
        return user.code?.includes(search) || user.full_name?.toUpperCase().includes(search);
      });
      pending = pending.filter((p: object) => {
        const pu = p as Record<string, string>;
        return pu.phone?.includes(search);
      });
    }

    return NextResponse.json({ users, pending });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.code || !body.full_name) {
      return NextResponse.json({ error: 'Vui lòng nhập mã và tên' }, { status: 400 });
    }

    const code = body.code.trim().toUpperCase();

    // Check if code already exists
    const existing = await adminDb.collection('users_codes').doc(code).get();
    if (existing.exists) {
      return NextResponse.json({ error: 'Mã này đã tồn tại' }, { status: 400 });
    }

    await adminDb.collection('users_codes').doc(code).set({
      code,
      full_name: body.full_name,
      phone: body.phone || '',
      delivery_address: body.delivery_address || '',
      total_portions: body.total_portions || 0,
      used_portions: 0,
      remaining_portions: body.total_portions || 0,
      created_at: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true, code });
  } catch (error) {
    console.error('Error creating user:', JSON.stringify(error, null, 2));
    return NextResponse.json({ error: 'Lỗi hệ thống' }, { status: 500 });
  }
}
