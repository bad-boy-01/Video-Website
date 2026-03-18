import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').toLowerCase().trim();
    const tags = searchParams.getAll('tags').slice(0, 10); // Hard cap at 10 for array-contains-any
    const accessType = searchParams.get('accessType'); // "free" | "paid" | "subscription"
    const sortBy = searchParams.get('sortBy') || 'relevance'; // "relevance" | "views" | "newest"

    if (!q && tags.length === 0 && !accessType) {
      return NextResponse.json({ error: 'Provide at least one search parameter.' }, { status: 400 });
    }

    let results: any[] = [];

    // Strategy: Run independent Firestore queries and merge server-side
    // This avoids compound query index explosions while staying within NoSQL constraints

    if (q) {
      // 1. Prefix range query on title_lowercase (Firestore-native text search pattern)
      const titleQuery = await adminDb.collection('videos')
        .where('status', '==', 'published')
        .where('visibility', '==', 'public')
        .where('isDeleted', '==', false)
        .where('title_lowercase', '>=', q)
        .where('title_lowercase', '<=', q + '\uf8ff')
        .limit(30)
        .get();

      titleQuery.docs.forEach(doc => {
        results.push({ id: doc.id, ...doc.data() });
      });
    }

    if (tags.length > 0) {
      // 2. Tag-based query (separate pass to merge results)
      const tagQuery = await adminDb.collection('videos')
        .where('status', '==', 'published')
        .where('visibility', '==', 'public')
        .where('isDeleted', '==', false)
        .where('tags', 'array-contains-any', tags)
        .limit(30)
        .get();

      tagQuery.docs.forEach(doc => {
        // Deduplicate by ID
        if (!results.find(r => r.id === doc.id)) {
          results.push({ id: doc.id, ...doc.data() });
        }
      });
    }

    // If neither q nor tags were given, do a baseline published query
    if (!q && tags.length === 0) {
      const baseQuery = await adminDb.collection('videos')
        .where('status', '==', 'published')
        .where('visibility', '==', 'public')
        .where('isDeleted', '==', false)
        .limit(30)
        .get();
      baseQuery.docs.forEach(doc => results.push({ id: doc.id, ...doc.data() }));
    }

    // 3. Apply accessType filter in memory (avoids complex composite indexes)
    if (accessType) {
      results = results.filter(v => v.accessType === accessType);
    }

    // 4. Compute Weighted Relevance Score
    const now = Date.now();
    results = results.map(v => {
      const titleMatch = q && v.title_lowercase?.includes(q) ? 10 : 0;
      const tagMatchCount = tags.length > 0
        ? (v.tags || []).filter((t: string) => tags.includes(t)).length
        : 0;
      const viewScore = (v.views || 0) / 1000;
      const ageDays = v.createdAt?.toMillis
        ? (now - v.createdAt.toMillis()) / (1000 * 60 * 60 * 24)
        : 365;
      const freshnessBoost = Math.max(0, 10 - ageDays);

      const score = titleMatch + (tagMatchCount * 3) + viewScore + freshnessBoost;
      return { ...v, _score: score };
    });

    // 5. Sort
    if (sortBy === 'views') {
      results.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sortBy === 'newest') {
      results.sort((a, b) => {
        const aMs = a.createdAt?.toMillis?.() || 0;
        const bMs = b.createdAt?.toMillis?.() || 0;
        return bMs - aMs;
      });
    } else {
      // Default: relevance score DESC
      results.sort((a, b) => b._score - a._score);
    }

    // 6. Limit and strip internal score field from response
    const payload = results.slice(0, 20).map(({ _score, ...rest }) => rest);

    return NextResponse.json({ success: true, results: payload, total: payload.length });

  } catch (error: any) {
    console.error("Search API Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
