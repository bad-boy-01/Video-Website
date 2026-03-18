import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import * as admin from 'firebase-admin';
import Razorpay from 'razorpay';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount_inr } = await req.json();
    if (!amount_inr || amount_inr <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // 1. Initialize Razorpay Server SDK
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error("Razorpay configuration missing.");
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // 2. Draft the Razorpay Order
    const amountInPaise = Math.round(amount_inr * 100);
    const receiptId = crypto.randomUUID();

    const orderOptions = {
      amount: amountInPaise,
      currency: "INR",
      receipt: receiptId,
    };

    const order = await razorpay.orders.create(orderOptions);

    // 3. Track Intent securely in Firestore
    const orderRef = adminDb.collection('payment_orders').doc(order.id);
    await orderRef.set({
      orderId: order.id,
      userId: uid,
      amount: amount_inr,
      currency: "INR",
      receiptId: receiptId,
      status: "created",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return NextResponse.json({ success: true, orderId: order.id, amount: amountInPaise }, { status: 200 });

  } catch (error: any) {
    console.error("Razorpay Create Order Error:", error);
    return NextResponse.json({ error: error.message || "Failed to create order" }, { status: 500 });
  }
}
