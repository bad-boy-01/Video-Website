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
    const { videoId, price_coins } = await req.json();
    if (!videoId || price_coins === undefined) {
      return NextResponse.json({ error: 'videoId and price_coins required' }, { status: 400 });
    }
    await adminDb.collection('videos').doc(videoId).update({
      price_coins: Number(price_coins),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.message === 'Forbidden' ? 403 : error.message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
