import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, coins_to_add } = await req.json();
    
    // 1. Calculate HMAC mapping identically to Razorpay specification
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error("Razorpay secret uninitialized on server.");
    
    const expectedSignature = crypto.createHmac('sha256', secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');
      
    if (expectedSignature !== razorpay_signature) {
       return NextResponse.json({ error: 'Fraudulent signature detected.' }, { status: 400 });
    }
    
    const adminDb = getAdminDb();
    const orderRef = adminDb.collection('payment_orders').doc(razorpay_order_id);
    
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) return NextResponse.json({ error: "Order does not exist in ledger" }, { status: 404 });
    const orderData = orderDoc.data();
    if (orderData?.status === 'completed') return NextResponse.json({ error: "Already processed" }, { status: 400 });
    
    const uid = orderData!.userId;

    // 2. Perform strictly atomic multi-document writes to finalize monetization mathematically
    await adminDb.runTransaction(async (t) => {
       const userRef = adminDb.collection('users').doc(uid);
       t.update(userRef, {
          wallet_balance: admin.firestore.FieldValue.increment(coins_to_add)
       });
       t.update(orderRef, { status: 'completed' });
       
       const txRef = adminDb.collection('transactions').doc();
       t.set(txRef, {
          id: txRef.id,
          userId: uid,
          paymentId: razorpay_payment_id,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          type: "coin_deposit",
          amount_coins: coins_to_add,
          currency: "INR",
          status: "completed",
          createdAt: admin.firestore.FieldValue.serverTimestamp()
       });
    });
    
    return NextResponse.json({ success: true, verified: true });
    
  } catch (error: any) {
    console.error("Razorpay Webhook Verifier Engine Failure:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
