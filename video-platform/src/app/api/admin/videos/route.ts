import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new Error('Unauthorized');
  const idToken = authHeader.split('Bearer ')[1];
  const adminAuth = getAdminAuth();
  const decodedToken = await adminAuth.verifyIdToken(idToken);
  const uid = decodedToken.uid;
  const adminDb = getAdminDb();
  const userSnap = await adminDb.collection('users').doc(uid).get();
  if (userSnap.data()?.role !== 'admin') throw new Error('Forbidden');
  return { uid, adminDb };
}

export async function GET(req: Request) {
  try {
    const { adminDb } = await verifyAdmin(req);
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    let query: admin.firestore.Query = adminDb.collection('videos').where('isDeleted', '==', false);
    if (status && status !== 'all') query = query.where('status', '==', status);
    query = query.orderBy('createdAt', 'desc');

    const snap = await query.get();
    let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as any[];

    if (search) {
      const s = search.toLowerCase();
      docs = docs.filter((d: any) => d.title?.toLowerCase().includes(s));
    }

    const total = docs.length;
    const paginated = docs.slice(page * limit, (page + 1) * limit);
    const videos = paginated.map((v: any) => ({ ...v, storagePath: undefined, hlsPath: undefined }));

    return NextResponse.json({ videos, total });
  } catch (error: any) {
    const status = error.message === 'Forbidden' ? 403 : error.message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}

export async function DELETE(req: Request) {
  try {
    const { adminDb } = await verifyAdmin(req);
    const { videoId } = await req.json();
    if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });
    await adminDb.collection('videos').doc(videoId).update({
      isDeleted: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    const status = error.message === 'Forbidden' ? 403 : error.message === 'Unauthorized' ? 401 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
