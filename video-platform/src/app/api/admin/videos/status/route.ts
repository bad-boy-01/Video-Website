import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    const decodedToken = await adminAuth.verifyIdToken(authHeader.split('Bearer ')[1]);
    
    // Authorization Check
    const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
    if (!userDoc.exists || userDoc.data()?.role !== 'admin') {
       return NextResponse.json({ error: 'Forbidden: Insufficient Clearance' }, { status: 403 });
    }
    
    // Runtime body parse
    const body = await req.json();
    const { videoId, status } = body;
    
    if (!videoId || !status || !['published', 'hidden', 'processing'].includes(status)) {
       return NextResponse.json({ error: 'Bad Request: Invalid mutation payload' }, { status: 400 });
    }
    
    await adminDb.collection('videos').doc(videoId).update({
       status: status,
       updatedAt: new Date()
    });
    
    return NextResponse.json({ success: true, message: `Video state mutated to ${status}` });
    
  } catch (err: any) {
    console.error("Admin Video Status Update Error", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
