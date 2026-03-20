'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState, useMemo } from 'react';
import { Search, PlayCircle } from 'lucide-react'; // Assuming you use lucide-react for icons
import Link from 'next/link';

export default function BrowsePage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Action', 'Education', 'Documentary', 'Premium'];

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch('/api/videos');
        if (!res.ok) throw new Error('Failed to fetch videos');
        const data = await res.json();
        setVideos(data.videos || []);
      } catch (error) {
        console.error('Error querying vault archives:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  // Client-side filtering for fast UX (assuming moderate dataset size)
  const filteredVideos = useMemo(() => {
    return videos.filter(video => {
      const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || video.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [videos, searchQuery, activeCategory]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">

        {/* Header & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <h1 className="text-4xl font-black tracking-tight">Vault Archives</h1>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search archives..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-full focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-8 scrollbar-hide">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap px-6 py-2 rounded-full font-medium transition-colors ${activeCategory === category ? 'bg-indigo-600 text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white'}`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Video Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse bg-gray-900 rounded-2xl overflow-hidden border border-gray-800">
                <div className="aspect-video bg-gray-800 relative"></div>
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-800 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-800 rounded w-full"></div>
                  <div className="h-4 bg-gray-800 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredVideos.map(video => (
              <Link key={video.id} href={`/watch/${video.id}`} className="group cursor-pointer bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 hover:border-indigo-500/50 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] transition-all duration-300 transform hover:-translate-y-1">
                <div className="aspect-video bg-gray-800 relative overflow-hidden">
                  {video.thumbnailUrl && <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-80" />
                  <PlayCircle className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-lg mb-2 text-white group-hover:text-indigo-400 transition-colors line-clamp-1">{video.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2">{video.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        {!loading && filteredVideos.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl">No archives found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}