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
    const search = url.searchParams.get('search');

    const snap = await adminDb.collection('users').orderBy('createdAt', 'desc').limit(50).get();
    let users = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

    if (search) {
      const s = search.toLowerCase();
      users = users.filter((u: any) => u.email?.toLowerCase().includes(s));
    }

    return NextResponse.json({ users });
  } catch (error: any) {
    const status = error.message === 'Forbidden' ? 403 : error.message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
