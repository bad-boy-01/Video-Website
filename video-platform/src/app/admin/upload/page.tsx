"use client";

import AdminRoute from "@/components/AdminRoute";
import { useState } from "react";
import { db, storage } from "@/lib/firebase/config";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, doc, setDoc, updateDoc } from "firebase/firestore";
import { Video } from "@/types/database";

export default function AdminUploadPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [accessType, setAccessType] = useState<Video["accessType"]>("free");
  const [visibility, setVisibility] = useState<Video["visibility"]>("public");
  const [tags, setTags] = useState("");
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const MAX_VIDEO_SIZE_MB = 1024; // 1 GB limit
  const MAX_THUMBNAIL_SIZE_MB = 5; // 5 MB limit

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!["video/mp4", "video/webm"].includes(file.type)) {
        setError("Invalid video format. Only MP4 and WEBM are allowed.");
        setVideoFile(null);
        return;
      }
      if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
        setError(`Video size exceeds ${MAX_VIDEO_SIZE_MB}MB limit.`);
        setVideoFile(null);
        return;
      }
      setError(null);
      setVideoFile(file);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Invalid thumbnail format. Must be an image.");
        setThumbnailFile(null);
        return;
      }
      if (file.size > MAX_THUMBNAIL_SIZE_MB * 1024 * 1024) {
        setError(`Thumbnail size exceeds ${MAX_THUMBNAIL_SIZE_MB}MB limit.`);
        setThumbnailFile(null);
        return;
      }
      setError(null);
      setThumbnailFile(file);
    }
  };

  const uploadFile = (file: File, path: string): Promise<{ downloadUrl: string | null; storagePath: string }> => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          if (file === videoFile) {
            const currentProgress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(currentProgress);
          }
        },
        (error) => reject(error),
        async () => {
          let downloadUrl = null;
          // We only fetch a public download URL for thumbnails. Secure videos only return their raw storagePath.
          if (file === thumbnailFile) {
            downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          }
          resolve({ downloadUrl, storagePath: uploadTask.snapshot.ref.fullPath });
        }
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !thumbnailFile || !title) {
      setError("Please fill all required fields and select files.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);
    setProgress(0);

    try {
      const videoId = crypto.randomUUID();
      const videoExtension = videoFile.name.split('.').pop();
      const thumbnailExtension = thumbnailFile.name.split('.').pop();

      // Enforce strict segregation between private raw videos and public thumbnails
      const videoStoragePath = `videos/${videoId}/video.${videoExtension}`;
      const thumbnailStoragePath = `thumbnails/${videoId}/thumbnail.${thumbnailExtension}`;

      // Upload both files concurrently
      const [videoUploadRes, thumbnailUploadRes] = await Promise.all([
        uploadFile(videoFile, videoStoragePath),
        uploadFile(thumbnailFile, thumbnailStoragePath)
      ]);

      const tagArray = tags.split(",").map(t => t.trim()).filter(Boolean);

      const videoData: Video = {
        id: videoId,
        title,
        title_lowercase: title.toLowerCase(), // Powers prefix-range search in /api/videos/search
        description,
        thumbnailUrl: thumbnailUploadRes.downloadUrl!, // Public
        storagePath: videoUploadRes.storagePath,       // DO NOT EXPOSE PUBLIC URL
        playbackPolicy: 'signed_url',
        price_coins: price,
        accessType,
        visibility,
        rating_avg: 0,
        rating_count: 0,
        isFeatured: false,
        isDeleted: false,
        duration_seconds: 0,
        fileSize: videoFile.size,
        mimeType: videoFile.type,
        views: 0,
        tags: tagArray,
        status: 'processing',
        processingStatus: 'pending',
        createdAt: Date.now(),
      };

      const videoRef = doc(collection(db, "videos"), videoId);
      await setDoc(videoRef, videoData);

      setSuccess("Video uploaded successfully! Status set to 'processing'. Backend validation will auto-publish this soon.");
      setTitle("");
      setDescription("");
      setPrice(0);
      setTags("");
      setVideoFile(null);
      setThumbnailFile(null);
      setProgress(0);
      
      // Reset file input elements manually if needed
      (document.getElementById("videoInput") as HTMLInputElement).value = "";
      (document.getElementById("thumbnailInput") as HTMLInputElement).value = "";
      
    } catch (err: any) {
      setError(err.message || "Failed to upload video.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AdminRoute>
      <div className="min-h-screen bg-gray-950 p-8 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl">
          <h1 className="mb-6 text-2xl font-bold">Admin Video Upload</h1>
          
          {error && <div className="mb-6 rounded-lg bg-red-500/10 p-4 border border-red-500/20 text-red-400">{error}</div>}
          {success && <div className="mb-6 rounded-lg bg-green-500/10 p-4 border border-green-500/20 text-green-400">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-gray-400">Title *</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} disabled={isUploading} className="w-full rounded-lg bg-gray-800 p-3 border border-gray-700 outline-none focus:border-blue-500" />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">Tags (comma separated)</label>
                <input type="text" value={tags} onChange={e => setTags(e.target.value)} disabled={isUploading} className="w-full rounded-lg bg-gray-800 p-3 border border-gray-700 outline-none focus:border-blue-500" placeholder="action, comedy, premium" />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm text-gray-400">Description</label>
                <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} disabled={isUploading} className="w-full rounded-lg bg-gray-800 p-3 border border-gray-700 outline-none focus:border-blue-500" />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">Access Type</label>
                <select value={accessType} onChange={e => setAccessType(e.target.value as Video["accessType"])} disabled={isUploading} className="w-full rounded-lg bg-gray-800 p-3 border border-gray-700 outline-none focus:border-blue-500">
                  <option value="free">Free</option>
                  <option value="paid">Paid (Coins)</option>
                  <option value="subscription">Subscription Only</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">Price (Coins)</label>
                <input type="number" min={0} value={price} onChange={e => setPrice(Number(e.target.value))} disabled={isUploading || accessType === 'free'} className="w-full rounded-lg bg-gray-800 p-3 border border-gray-700 outline-none focus:border-blue-500 disabled:opacity-50" />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-400">Visibility</label>
                <select value={visibility} onChange={e => setVisibility(e.target.value as Video["visibility"])} disabled={isUploading} className="w-full rounded-lg bg-gray-800 p-3 border border-gray-700 outline-none focus:border-blue-500">
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 mt-6 p-6 bg-gray-800/50 rounded-xl border border-gray-700">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">Thumbnail Image *</label>
                <input id="thumbnailInput" required type="file" accept="image/*" onChange={handleThumbnailChange} disabled={isUploading} className="block w-full text-sm text-gray-400 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-700 file:py-2 file:px-4 file:text-sm file:font-semibold file:text-white hover:file:bg-gray-600" />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">Video File (MP4/WEBM) *</label>
                <input id="videoInput" required type="file" accept="video/mp4,video/webm" onChange={handleVideoChange} disabled={isUploading} className="block w-full text-sm text-gray-400 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-700 file:py-2 file:px-4 file:text-sm file:font-semibold file:text-white hover:file:bg-gray-600" />
              </div>
            </div>

            {isUploading && (
              <div className="w-full bg-gray-800 rounded-full h-2.5 mt-4">
                <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                <p className="text-xs text-gray-400 mt-2 text-right">{Math.round(progress)}%</p>
              </div>
            )}

            <button type="submit" disabled={isUploading} className="w-full mt-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 shadow-lg">
              {isUploading ? "Uploading Securely..." : "Upload Video to Vault"}
            </button>
          </form>
        </div>
      </div>
    </AdminRoute>
  );
}
