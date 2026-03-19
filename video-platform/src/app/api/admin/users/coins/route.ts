import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized');
  const idToken = authHeader.split('Bearer ')[1];
  const decodedToken = await getAdminAuth().verifyIdToken(idToken);
  const adminDb = getAdminDb();
  const userSnap = await adminDb.collection('users').doc(decodedToken.uid).get();
  if (userSnap.data()?.role !== 'admin') throw new Error('Forbidden');
  return adminDb;
}

export async function PATCH(req: Request) {
  try {
    const adminDb = await verifyAdmin(req);
    const { targetUserId, amount, reason } = await req.json();
    if (!targetUserId || amount === undefined) {
      return NextResponse.json({ error: 'targetUserId and amount required' }, { status: 400 });
    }

    await adminDb.runTransaction(async (t) => {
      const userRef = adminDb.collection('users').doc(targetUserId);
      t.update(userRef, {
        wallet_balance: admin.firestore.FieldValue.increment(Number(amount)),
      });
      const txRef = adminDb.collection('transactions').doc();
      t.set(txRef, {
        id: txRef.id,
        userId: targetUserId,
        type: 'admin_adjustment',
        amount_coins: Number(amount),
        currency: 'COINS',
        reason: reason || 'Admin adjustment',
        status: 'completed',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.message === 'Forbidden' ? 403 : error.message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
