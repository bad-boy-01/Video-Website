import { NextResponse } from 'next/server';
import admin, { db } from '@/lib/firebase-admin';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status');

        let queryRef: any = db.collection('videos').orderBy('createdAt', 'desc');

        if (status && status !== 'all') {
            queryRef = queryRef.where('status', '==', status);
        }

        const snapshot = await queryRef.get();

        const videos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return NextResponse.json({ videos });
    } catch (error) {
        console.error('Fetch Videos API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}