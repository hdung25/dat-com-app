import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const phone = cookieStore.get('user_session')?.value;

    if (!phone) {
      return NextResponse.json({ phone: null, code: null });
    }

    const doc = await adminDb.collection('pending_users').doc(phone).get();
    if (!doc.exists) {
      return NextResponse.json({ phone: null, code: null });
    }

    const data = doc.data()!;
    return NextResponse.json({
      phone: data.phone,
      code: data.linked_code || null,
    });
  } catch {
    return NextResponse.json({ phone: null, code: null });
  }
}
