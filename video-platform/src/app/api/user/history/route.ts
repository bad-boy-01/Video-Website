import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const decodedToken = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
    const uid = decodedToken.uid;
    
    // 1. Fetch telemetry history
    const historyQuery = await adminDb.collection('watch_history')
      .where('userId', '==', uid)
      .orderBy('lastWatchedAt', 'desc')
      .limit(30)
      .get();
      
    if (historyQuery.empty) {
       return NextResponse.json({ success: true, history: [] });
    }
    
    const historyDocs = historyQuery.docs.map(doc => doc.data());
    const videoIds = historyDocs.map(d => d.videoId);
    
    // 2. Hydrate with video metadata using batch `in` clause to prevent N+1 cascading performance dips
    const videosQuery = await adminDb.collection('videos')
      .where('__name__', 'in', videoIds)
      .get();
      
    const videoMap = new Map();
    videosQuery.docs.forEach(doc => videoMap.set(doc.id, doc.data()));
    
    // 3. Assemble and cleanse unified payload
    const payload = historyDocs.map(hist => {
       const vData = videoMap.get(hist.videoId);
       if (!vData || vData.isDeleted) return null; // Drop missing/deleted vectors
       
       return {
          videoId: hist.videoId,
          progress_seconds: hist.progress_seconds,
          lastWatchedAt: hist.lastWatchedAt?.toMillis ? hist.lastWatchedAt.toMillis() : null,
          video: {
             title: vData.title,
             thumbnailUrl: vData.thumbnailUrl,
             duration_seconds: vData.duration_seconds || 0,
             accessType: vData.accessType,
             tags: vData.tags || []
          }
       };
    }).filter(Boolean);
    
    return NextResponse.json({ success: true, history: payload });
    
  } catch (err: any) {
    console.error("Watch History API Error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
