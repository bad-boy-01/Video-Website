import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  role: "user" | "admin";
  wallet_balance: number;
  subscription_status: "none" | "active" | "cancelled";
  createdAt: number | Timestamp;
  updatedAt?: number | Timestamp;
  not_interested?: string[]; // Behavioral feedback loop for recommendation exclusions
}

export interface Video {
  id: string;
  title: string;
  title_lowercase?: string; // Powers prefix-range search in Firestore
  description?: string;
  thumbnailUrl: string;
  storagePath: string;       // NEVER expose to client
  hlsPath?: string;          // Set after Cloud Function FFmpeg processing
  playbackPolicy: "signed_url" | "tokenized";
  accessType: "free" | "paid" | "subscription";
  visibility: "public" | "private";
  status: "processing" | "published" | "hidden";
  processingStatus?: "pending" | "verified" | "failed";
  price_coins: number;
  tags: string[];
  views: number;
  rating_avg: number;
  rating_count: number;
  isFeatured: boolean;
  isDeleted: boolean;
  duration_seconds: number;
  fileSize: number;
  mimeType: string;
  createdAt: number | Timestamp;
  updatedAt?: number | Timestamp;
}

export interface Purchase {
  id: string;            // Format: userId_videoId
  userId: string;
  videoId: string;
  source: "coins" | "subscription";
  createdAt: Timestamp;
}

export interface Transaction {
  id: string;
  userId: string;
  paymentId?: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  type: "coin_deposit" | "video_purchase" | "subscription_payment";
  amount_coins: number;
  currency: string;
  amount_real?: number;
  videoId?: string | null;
  status: "completed" | "pending" | "failed";
  createdAt: Timestamp;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: "active" | "cancelled" | "expired";
  currentPeriodStart: Timestamp;
  currentPeriodEnd: Timestamp;
  cancelAtPeriodEnd: boolean;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface WatchHistory {
  userId: string;
  videoId: string;
  progress_seconds: number;
  lastWatchedAt: Timestamp;
}

export interface PaymentOrder {
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  receiptId: string;
  status: "created" | "processing" | "completed" | "failed";
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
