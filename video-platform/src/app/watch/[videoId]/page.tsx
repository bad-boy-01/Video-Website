'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft } from 'lucide-react';

export default function WatchPage() {
  const { videoId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/');
      return;
    }

    const fetchVideo = async () => {
      try {
        const res = await fetch(`/api/videos/${videoId}`);
        if (!res.ok) throw new Error('Failed to fetch video');
        const data = await res.json();
        setVideo(data.video);
      } catch (error) {
        console.error('Error fetching video', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideo();
  }, [videoId, user, authLoading, router]);

  if (loading || authLoading) return <div className="min-h-screen bg-gray-950 flex items-center justify-center text-white">Loading encrypted feed...</div>;
  if (!video) return <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white"><h1 className="text-2xl font-bold mb-4">Video not found or access restricted</h1><button onClick={() => router.back()} className="text-indigo-500 hover:underline">Go Back</button></div>;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="p-4 flex items-center gap-4 border-b border-gray-800 bg-gray-900">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-full transition-colors"><ArrowLeft className="w-6 h-6" /></button>
        <h1 className="text-xl font-bold truncate">{video.title}</h1>
      </div>
      <div className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 flex flex-col">
        <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
          <video controls autoPlay className="w-full h-full object-contain" src={video.videoUrl} poster={video.thumbnailUrl || ''}></video>
        </div>
        <div className="mt-8 bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-2xl font-black mb-2">{video.title}</h2>
          <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">{video.description}</p>
        </div>
      </div>
    </div>
  );
}