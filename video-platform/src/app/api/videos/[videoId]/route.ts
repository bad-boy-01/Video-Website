import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb, getAdminStorage } from '@/lib/firebase/admin';

export async function GET(req: Request, { params }: { params: Promise<{ videoId: string }> }) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const adminStorage = getAdminStorage();
    
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;
    const { videoId } = await params;
    
    const videoSnap = await adminDb.collection('videos').doc(videoId).get();
    if (!videoSnap.exists) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }
    const video = videoSnap.data() as any;
    
    // Strict Database Driven Access Gate
    let hasAccess = false;
    
    // Subscriber VIP Bypass Override with expiry check
    const userSnap = await adminDb.collection('users').doc(uid).get();
    const userData = userSnap.data();
    const subExpiry = userData?.subscription_expires_at?.toMillis?.();
    const isSubActive = userData?.subscription_status === 'active' &&
      subExpiry && subExpiry > Date.now();

    // Auto-cancel expired subscriptions
    if (userData?.subscription_status === 'active' && subExpiry && subExpiry <= Date.now()) {
      await adminDb.collection('users').doc(uid).update({ subscription_status: 'cancelled' });
    }
    
    if (isSubActive) {
       hasAccess = true;
    } else if (video.accessType === 'free') {
       hasAccess = true;
    } else if (video.accessType === 'paid') {
       // Only allow check if explicitly purchased globally
       const purchaseSnap = await adminDb.collection('purchases').doc(`${uid}_${videoId}`).get();
       hasAccess = purchaseSnap.exists;
    }
    
    if (!hasAccess) {
       // Deny delivery but supply metadata for paywall rendering!
       return NextResponse.json({ 
         accessDenied: true, 
         video: { title: video.title, price_coins: video.price_coins, accessType: video.accessType, views: video.views, tags: video.tags || [] } 
       });
    }
    
    const bucket = adminStorage.bucket();
    const targetPath = video.hlsPath || video.storagePath; // Graceful degradation built in
    
    const [playbackUrl] = await bucket.file(targetPath).getSignedUrl({
      action: 'read',
      expires: Date.now() + 2 * 60 * 60 * 1000, // Valid precisely 2 hours exactly as requested
      responseType: targetPath.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp4'
    });
    
    return NextResponse.json({ 
      success: true, 
      playbackUrl: playbackUrl,
      isHLS: targetPath.endsWith('.m3u8'),
      video: { title: video.title, views: video.views, tags: video.tags || [], accessType: video.accessType } 
    });
    
  } catch (err: any) {
    console.error("Video Fetching Critical Issue", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
