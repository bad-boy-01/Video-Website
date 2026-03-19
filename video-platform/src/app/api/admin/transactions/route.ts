import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

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

export async function GET(req: Request) {
  try {
    const adminDb = await verifyAdmin(req);
    const url = new URL(req.url);
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');

    let query = adminDb.collection('transactions').orderBy('createdAt', 'desc').limit(100) as any;
    if (type && type !== 'all') query = adminDb.collection('transactions').where('type', '==', type).orderBy('createdAt', 'desc').limit(100);

    const snap = await query.get();
    let transactions = snap.docs.map((d: any) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toMillis?.() || d.data().createdAt,
    })) as any[];

    if (status && status !== 'all') {
      transactions = transactions.filter((t: any) => t.status === status);
    }

    // Enrich with user emails - batch fetch unique user IDs
    const uniqueUserIds = [...new Set(transactions.map((t: any) => t.userId).filter(Boolean))] as string[];
    const userEmailMap: Record<string, string> = {};

    const chunks: string[][] = [];
    for (let i = 0; i < uniqueUserIds.length; i += 10) chunks.push(uniqueUserIds.slice(i, i + 10));

    await Promise.all(
      chunks.map(async (chunk) => {
        const userSnaps = await adminDb.collection('users')
          .where(require('firebase-admin').firestore.FieldPath.documentId(), 'in', chunk)
          .get();
        userSnaps.docs.forEach((d: any) => (userEmailMap[d.id] = d.data().email));
      })
    );

    const enriched = transactions.map((t: any) => ({
      ...t,
      userEmail: userEmailMap[t.userId] || t.userId,
    }));

    return NextResponse.json({ transactions: enriched });
  } catch (error: any) {
    const status = error.message === 'Forbidden' ? 403 : error.message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
