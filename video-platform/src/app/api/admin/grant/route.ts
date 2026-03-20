import { NextResponse } from 'next/server';
import admin, { auth, db } from '@/lib/firebase-admin';

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const token = authHeader.split(' ')[1];

        const decodedToken = await auth.verifyIdToken(token);
        const adminUid = decodedToken.uid;

        // 1. Verify the requester actually has the 'admin' role
        const adminDoc = await db.collection('users').doc(adminUid).get();
        if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
        }

        const body = await req.json();
        const { targetEmail, grantType, value } = body;

        if (!targetEmail || !grantType || !value) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 2. Look up target user by email
        let targetUid = '';
        try {
            const targetUserRecord = await auth.getUserByEmail(targetEmail);
            targetUid = targetUserRecord.uid;
        } catch (e) {
            return NextResponse.json({ error: 'User not found with this email' }, { status: 404 });
        }

        // 3. Execute the grant
        if (grantType === 'coins') {
            await db.collection('users').doc(targetUid).set({
                wallet_balance: admin.firestore.FieldValue.increment(Number(value))
            }, { merge: true });

            await db.collection('transactions').add({
                userId: targetUid,
                amount: Number(value),
                description: 'Admin System Grant',
                type: 'grant',
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });
        } else if (grantType === 'pass') {
            const daysInMs = Number(value) * 24 * 60 * 60 * 1000;
            const expiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + daysInMs);
            await db.collection('users').doc(targetUid).set({ subscription_status: 'active', subscription_expires_at: expiresAt }, { merge: true });
        } else {
            return NextResponse.json({ error: 'Invalid grant type' }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: `Successfully granted ${value} ${grantType} to ${targetEmail}` });
    } catch (error) {
        console.error('Admin Grant API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}