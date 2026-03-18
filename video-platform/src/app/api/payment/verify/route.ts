import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error("Server Misconfiguration");

    // 1. Mandatory HMAC SHA256 evaluation
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json({ error: 'Invalid Signature. Payment rejected.' }, { status: 400 });
    }

    // DO NOT CREDIT WALLET HERE. Structural security requires the background Webhook handles atomic fulfillment.
    
    return NextResponse.json({ success: true, message: 'Signature verified successfully.' }, { status: 200 });

  } catch (error: any) {
    console.error("Razorpay Verify Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
