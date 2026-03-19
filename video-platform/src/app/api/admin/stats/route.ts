import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const decodedToken = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
    
    // Verify Admin Role Securely via DB
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
       return NextResponse.json({ error: 'Forbidden: Insufficient Clearance' }, { status: 403 });
    }
    
    // Aggregate global metrics concurrently
    const [videosTotal, videosPublished, usersTotal, txTotal] = await Promise.all([
       adminDb.collection('videos').count().get(),
       adminDb.collection('videos').where('status', '==', 'published').count().get(),
       adminDb.collection('users').count().get(),
       adminDb.collection('transactions').count().get()
    ]);
    
    // Fetch recent ingest pipeline (last 10)
    const recentVideosSnap = await adminDb.collection('videos')
       .orderBy('createdAt', 'desc')
       .limit(10)
       .get();
       
    const recentVideos = recentVideosSnap.docs.map(doc => {
       const d = doc.data();
       return {
          id: doc.id,
          title: d.title,
          status: d.status || 'processing',
          createdAt: d.createdAt?.toMillis ? d.createdAt.toMillis() : null,
          thumbnailUrl: d.thumbnailUrl
       };
    });
    
    return NextResponse.json({
       success: true,
       stats: {
          totalVideos: videosTotal.data().count,
          publishedVideos: videosPublished.data().count,
          totalUsers: usersTotal.data().count,
          totalTransactions: txTotal.data().count
       },
       recentVideos
    });
    
  } catch (err: any) {
    console.error("Admin Stats API Error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
