import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  type UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';

const googleProvider = new GoogleAuthProvider();

async function createUserDocument(uid: string, email: string, name?: string) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      uid,
      email,
      name: name || '',
      role: 'user',
      wallet_balance: 0,
      subscription_status: 'none',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export async function signUpWithEmail(email: string, password: string, name?: string): Promise<{ user?: UserCredential['user']; error?: string }> {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await createUserDocument(result.user.uid, result.user.email || email, name);
    return { user: result.user };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function loginWithEmail(email: string, password: string): Promise<{ user?: UserCredential['user']; error?: string }> {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function loginWithGoogle(): Promise<{ user?: UserCredential['user']; error?: string }> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await createUserDocument(result.user.uid, result.user.email || '');
    return { user: result.user };
  } catch (e: any) {
    return { error: e.message };
  }
}

export async function logout(): Promise<void> {
  await signOut(auth);
}
