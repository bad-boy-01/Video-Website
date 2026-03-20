import { NextResponse } from 'next/server';
import admin, { auth, db } from '@/lib/firebase-admin';

export async function PATCH(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const token = await auth.verifyIdToken(authHeader.split(' ')[1]);

    const adminDoc = await db.collection('users').doc(token.uid).get();
    if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { targetUid, coins } = body;
    if (!targetUid || coins === undefined) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    await db.collection('users').doc(targetUid).update({
      wallet_balance: admin.firestore.FieldValue.increment(Number(coins))
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin Grant Coins Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}