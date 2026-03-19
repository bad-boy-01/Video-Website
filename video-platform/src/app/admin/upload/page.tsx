'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { UploadCloud, FileVideo } from 'lucide-react';

export default function AdminUploadPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !user) return;
    if (file.size > 500 * 1024 * 1024) { // 500MB client-side check
      alert('File is too large. Maximum size is 500MB.');
      return;
    }

    setUploading(true);
    try {
      const videoId = crypto.randomUUID();
      const storageRef = ref(storage, `videos/${videoId}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(p);
        },
        (error) => {
          console.error('Upload failed:', error);
          setUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          await setDoc(doc(db, 'videos', videoId), {
            id: videoId,
            title,
            description,
            videoUrl: downloadURL,
            uploaderId: user.uid,
            status: 'published', // Auto-publish flag
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          setUploading(false);
          router.push('/admin/videos');
        }
      );
    } catch (error) {
      console.error('Error in upload process:', error);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 p-8 text-white flex items-center justify-center">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-3xl font-black mb-8 flex items-center gap-3"><UploadCloud className="text-indigo-500" /> Secure Upload</h1>
        <form onSubmit={handleUpload} className="space-y-6">
          <div>
            <label className="block mb-2 text-sm font-medium">Video Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block mb-2 text-sm font-medium">Description</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 bg-gray-800 rounded-lg border border-gray-700 outline-none focus:border-indigo-500 h-32"
            />
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-700 rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-gray-800/50 transition-all"
          >
            <FileVideo className="w-12 h-12 text-gray-500 mb-4" />
            <p className="text-gray-300 font-medium">{file ? file.name : 'Click to select video file'}</p>
            <p className="text-sm text-gray-500 mt-2">MP4, WebM, or OGG (Max 500MB)</p>
            <input ref={fileInputRef} type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} required className="hidden" />
          </div>

          {uploading && (
            <div className="w-full bg-gray-800 rounded-full h-2.5 mb-4 overflow-hidden">
              <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              <p className="text-xs text-indigo-400 mt-2 text-center">Uploading... {Math.round(progress)}%</p>
            </div>
          )}

          <button type="submit" disabled={uploading || !file} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-4 px-4 rounded-xl shadow-lg transition-all">
            {uploading ? 'Encrypting & Publishing...' : 'Upload & Publish'}
          </button>
        </form>
      </div>
    </div>
  );
}