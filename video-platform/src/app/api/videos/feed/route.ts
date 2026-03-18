import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export async function GET(req: Request) {
  try {
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const authHeader = req.headers.get('Authorization');
    let uid: string | null = null;
    let userDocData: any = null;
    
    // 1. Authenticate Request
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const idToken = authHeader.split('Bearer ')[1];
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        uid = decodedToken.uid;
        
        const userSnap = await adminDb.collection('users').doc(uid).get();
        if (userSnap.exists) {
          userDocData = userSnap.data();
        }
      } catch (e) {
        // Degrade gracefully to public feed access
      }
    }

    // 2. Fetch Trending Cluster
    const trendingQuery = await adminDb.collection('videos')
      .where('status', '==', 'published')
      .where('visibility', '==', 'public')
      .where('isDeleted', '==', false)
      .orderBy('views', 'desc')
      .limit(20)
      .get();
      
    const trending = trendingQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    let continueWatching: any[] = [];
    let recommended: any[] = [];
    const watchedVideoIds: string[] = [];

    // System Level Upgrade: Hybrid Filtering Prep
    const notInterested = userDocData?.not_interested || [];

    if (uid) {
      // 3. Extract Recent Watch History
      const historyQuery = await adminDb.collection('watch_history')
        .where('userId', '==', uid)
        .orderBy('lastWatchedAt', 'desc')
        .limit(10)
        .get();
        
      const historyDocs = historyQuery.docs.map(doc => doc.data());
      historyDocs.forEach(doc => watchedVideoIds.push(doc.videoId));
      
      if (watchedVideoIds.length > 0) {
        // Prevent N+1 cascading by utilizing batch array constraint fetching!
        const cwVideosQuery = await adminDb.collection('videos')
          .where('__name__', 'in', watchedVideoIds)
          .get();
          
        const cwVideoMap = new Map();
        cwVideosQuery.docs.forEach(doc => cwVideoMap.set(doc.id, doc.data()));
        
        continueWatching = historyDocs.map(hist => {
          const vData = cwVideoMap.get(hist.videoId);
          if (!vData || vData.isDeleted) return null;
          return {
            videoId: hist.videoId,
            progress_seconds: hist.progress_seconds,
            duration_seconds: vData.duration_seconds || 0,
            thumbnailUrl: vData.thumbnailUrl,
            title: vData.title,
            tags: vData.tags || []
          };
        }).filter(Boolean);
        
        // 4. Recommendation Engine (Elite Weighted Scoring Hybrid)
        const tagFrequency: Record<string, number> = {};
        continueWatching.forEach(item => {
           // Establish watch-time weighting matrix (Completion Rate boosts tag strength up to 2x!)
           const completionRate = item.duration_seconds > 0 
             ? Math.min(item.progress_seconds / item.duration_seconds, 1.0) 
             : 0;
           const weightModifier = 1 + completionRate;

           item.tags.forEach((tag: string) => {
             tagFrequency[tag] = (tagFrequency[tag] || 0) + weightModifier;
           });
        });
        
        // Explicitly enforce hard 5 limit
        const topTags = Object.entries(tagFrequency)
          .sort((a, b) => b[1] - a[1])
          .map(entry => entry[0])
          .slice(0, 5);

        if (topTags.length > 0) {
          const recQuery = await adminDb.collection('videos')
            .where('status', '==', 'published')
            .where('visibility', '==', 'public')
            .where('isDeleted', '==', false)
            .where('tags', 'array-contains-any', topTags)
            .limit(30) // Fetch slightly more to aggressively filter
            .get();
            
          let recDocs = recQuery.docs
             .map(doc => ({ id: doc.id, ...doc.data() }))
             .filter(doc => !watchedVideoIds.includes(doc.id))
             .filter(doc => !notInterested.includes(doc.id)); 
             
          // Elite Weighted Scoring Formula
          const now = Date.now();
          recDocs = recDocs.map((doc: any) => {
             const tagMatchCount = doc.tags?.filter((t: string) => topTags.includes(t)).length || 0;
             const viewsNum = doc.views || 0;
             
             // Freshness boost: standard decay over 30 days
             const createdAtMillis = doc.createdAt?.toMillis ? doc.createdAt.toMillis() : Date.now();
             const ageDays = (now - createdAtMillis) / (1000 * 60 * 60 * 24);
             const freshnessBoost = Math.max(0, 10 - ageDays); // up to +10 points if highly fresh
             
             const computedScore = (tagMatchCount * 5) + (viewsNum / 1000) + freshnessBoost;
             return { ...doc, _computedScore: computedScore };
          });
          
          recDocs.sort((a: any, b: any) => b._computedScore - a._computedScore);
          
          // Diversity Control: 70% personalized tags, 30% dynamic broad baseline
          const tagBasedRecs = recDocs.slice(0, 14); // 70% of out 20
          
          const filler = trending
             .filter(t => !watchedVideoIds.includes(t.id))
             .filter(t => !notInterested.includes(t.id))
             .filter(t => !tagBasedRecs.find(tr => tr.id === t.id))
             .slice(0, 20 - tagBasedRecs.length); // 30% of out 20
             
          recommended = [...tagBasedRecs, ...filler];
        }
      }
    }

    // 5. Cold Start Problem Matrix
    if (recommended.length === 0) {
       // If no history, or tags yield zero mapping, blend Trending and Latest Uploads
       const latestQuery = await adminDb.collection('videos')
          .where('status', '==', 'published')
          .where('visibility', '==', 'public')
          .where('isDeleted', '==', false)
          .orderBy('createdAt', 'desc')
          .limit(10)
          .get();
          
       const latestDocs = latestQuery.docs.map(doc => ({ id: doc.id, ...doc.data() }));
       
       // Blend Trending and Latest Uploads to establish immediate user profiling
       const blended = [...trending];
       latestDocs.forEach(ld => {
          if (!blended.find(b => b.id === ld.id)) {
             blended.push(ld);
          }
       });
       
       recommended = blended.slice(0, 20);
    }

    return NextResponse.json({
      success: true,
      data: {
        continueWatching,
        recommended,
        trending
      }
    });

  } catch (error: any) {
    console.error("Feed API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
