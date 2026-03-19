import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const decodedToken = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
    const uid = decodedToken.uid;
    
    // Extract videoId dependency payload
    const body = await req.json();
    const { videoId } = body;
    
    if (!videoId) return NextResponse.json({ error: 'Missing core target vector' }, { status: 400 });
    
    // We execute the purchase precisely as an isolated Atomic Transaction to guarantee wealth parity globally!
    const res = await adminDb.runTransaction(async (t) => {
       const userRef = adminDb.collection('users').doc(uid);
       const videoRef = adminDb.collection('videos').doc(videoId);
       
       const [userSnap, videoSnap] = await Promise.all([t.get(userRef), t.get(videoRef)]);
       
       if (!userSnap.exists) throw new Error("Registered User Profile missing");
       if (!videoSnap.exists) throw new Error("Asset missing from catalog");
       
       const uData = userSnap.data()!;
       const vData = videoSnap.data()!;
       
       // Access checks
       if (vData.accessType !== 'paid') throw new Error("Asset requires alternative authorization tier");
       
       const price = vData.price_coins || 0;
       const balance = uData.wallet_balance || 0;
       
       if (balance < price) {
          throw new Error("Insufficient coins. Please replenish logical wallet arrays to proceed.");
       }
       
       // 1. Decrement Wallet exactly by scalar value logically mapped
       t.update(userRef, {
          wallet_balance: FieldValue.increment(-price)
       });
       
       // 2. Insert definitive purchases state-gate token
       const purchaseRef = adminDb.collection('purchases').doc(`${uid}_${videoId}`);
       t.set(purchaseRef, {
          userId: uid,
          videoId: videoId,
          source: 'coins',
          createdAt: FieldValue.serverTimestamp()
       });
       
       // 3. Keep Ledger synchronization complete precisely matching deposit logic tracking structures
       const txRef = adminDb.collection('transactions').doc();
       t.set(txRef, {
          userId: uid,
          videoId: videoId,
          type: 'video_purchase',
          amount_coins: price,
          status: 'completed',
          createdAt: FieldValue.serverTimestamp()
       });
       
       return { success: true };
    });
    
    return NextResponse.json(res);
    
  } catch (err: any) {
    console.error("Video Purchase API Loop Error", err);
    if (err.message.includes("Insufficient") || err.message.includes("missing")) {
       return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
