import { NextResponse } from 'next/server';
import admin, { auth, db } from '@/lib/firebase-admin';

export async function PATCH(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { displayName, bio, emailNotifications } = body;

    const token = authHeader.split(' ')[1];

    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    if (displayName) { // Prevents setting an empty string which crashes Firebase Auth
      await auth.updateUser(userId, { displayName });
    }

    const firestoreUpdate: Record<string, string | boolean> = {};
    if (displayName !== undefined) firestoreUpdate.displayName = displayName;
    if (bio !== undefined) firestoreUpdate.bio = bio;
    if (emailNotifications !== undefined) firestoreUpdate.emailNotifications = emailNotifications;

    if (Object.keys(firestoreUpdate).length > 0) {
      await db.collection('users').doc(userId).set(firestoreUpdate, { merge: true });
    }

    return NextResponse.json({ success: true, message: "Profile updated" });
  } catch (error) {
    console.error('Profile Update API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}