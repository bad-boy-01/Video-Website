import { NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebase-admin';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary Server SDK
cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface RouteContext {
    params: Promise<{ videoId: string }>;
}

export async function PATCH(req: Request, { params }: RouteContext) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const token = await auth.verifyIdToken(authHeader.split(' ')[1]);

        const adminDoc = await db.collection('users').doc(token.uid).get();
        if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { videoId } = await params;
        const body = await req.json();

        const updateData: any = {};

        // 1. Validate Price
        if (body.price !== undefined) {
            const price = Number(body.price);
            if (isNaN(price) || price < 0) {
                return NextResponse.json({ error: 'Invalid price. Must be 0 or greater.' }, { status: 400 });
            }
            updateData.price = price;
            updateData.isFree = price === 0;
        }

        // 2. Validate Status
        if (body.status !== undefined) {
            if (!['draft', 'published'].includes(body.status)) {
                return NextResponse.json({ error: 'Invalid status. Must be draft or published.' }, { status: 400 });
            }
            updateData.status = body.status;
        }

        if (Object.keys(updateData).length > 0) {
            await db.collection('videos').doc(videoId).update(updateData);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin Video PATCH Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: RouteContext) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const token = await auth.verifyIdToken(authHeader.split(' ')[1]);

        const adminDoc = await db.collection('users').doc(token.uid).get();
        if (!adminDoc.exists || adminDoc.data()?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { videoId } = await params;
        console.log("Deleting video:", videoId);

        // 1. Fetch the document to get the video metadata
        const videoDoc = await db.collection('videos').doc(videoId).get();

        if (!videoDoc.exists) {
            return NextResponse.json({ error: 'Not Found' }, { status: 404 });
        }

        const videoData = videoDoc.data();
        const publicId = videoData?.cloudinaryPublicId;

        if (publicId) {
            console.log("Cloudinary public_id:", publicId);

            // 3. Destroy Cloudinary assets (Wrapped in try/catch to fail-safe to Firestore deletion)
            try {
                await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
            } catch (err) {
                console.error("Cloudinary video delete error:", err);
            }
        } else {
            console.log("Missing Cloudinary public_id. Skipping Cloudinary deletion.");
        }

        // 4. Safely delete Firestore document
        await db.collection('videos').doc(videoId).delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin Video DELETE Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}