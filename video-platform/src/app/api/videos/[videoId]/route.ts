import { NextResponse } from 'next/server';
import admin, { db } from '@/lib/firebase-admin';

interface RouteContext {
  params: Promise<{ videoId: string }>;
}

export async function GET(req: Request, { params }: RouteContext) {
  try {
    const { videoId } = await params;
    if (!videoId) return NextResponse.json({ error: 'Missing Video ID' }, { status: 400 });

    const docSnap = await db.collection('videos').doc(videoId).get();
    if (!docSnap.exists) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

    return NextResponse.json({ video: { id: docSnap.id, ...docSnap.data() } });
  } catch (error) {
    console.error('Fetch Single Video API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}