import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const adminDb = getAdminDb();
    const url = new URL(req.url);
    const checkVideoId = url.searchParams.get('checkVideoId');

    // Check endpoint for single video wishlist status
    if (checkVideoId) {
      const docSnap = await adminDb.collection('wishlist').doc(`${uid}_${checkVideoId}`).get();
      return NextResponse.json({ inWishlist: docSnap.exists });
    }

    // Get all wishlist items
    const wSnap = await adminDb.collection('wishlist')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .get();

    if (wSnap.empty) return NextResponse.json({ videos: [] });

    const videoIds = wSnap.docs.map((d) => d.data().videoId);
    // Batch-fetch videos (Firestore 'in' limit is 30)
    const chunks: string[][] = [];
    for (let i = 0; i < videoIds.length; i += 10) chunks.push(videoIds.slice(i, i + 10));

    const videoFetches = chunks.map((chunk) =>
      adminDb.collection('videos').where(admin.firestore.FieldPath.documentId(), 'in', chunk).get()
    );
    const videoSnaps = await Promise.all(videoFetches);
    const videoMap: Record<string, any> = {};
    videoSnaps.forEach((vs) => vs.docs.forEach((d) => (videoMap[d.id] = { id: d.id, ...d.data() })));

    const videos = videoIds
      .map((id) => videoMap[id])
      .filter(Boolean)
      .map((v) => ({ ...v, storagePath: undefined, hlsPath: undefined }));

    return NextResponse.json({ videos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { videoId } = await req.json();
    if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });

    const adminDb = getAdminDb();
    await adminDb.collection('wishlist').doc(`${uid}_${videoId}`).set({
      userId: uid,
      videoId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const { videoId } = await req.json();
    if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });

    const adminDb = getAdminDb();
    await adminDb.collection('wishlist').doc(`${uid}_${videoId}`).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
