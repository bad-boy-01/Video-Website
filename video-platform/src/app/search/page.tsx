"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const ACCESS_TYPE_OPTIONS = [
  { label: "All", value: "" },
  { label: "Free", value: "free" },
  { label: "Paid", value: "paid" },
  { label: "Subscription", value: "subscription" },
];

const SORT_OPTIONS = [
  { label: "Relevance", value: "relevance" },
  { label: "Most Viewed", value: "views" },
  { label: "Newest", value: "newest" },
];

const POPULAR_TAGS = ["action", "comedy", "drama", "tech", "education", "gaming", "music", "sports"];

function SearchResults() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(searchParams.getAll("tags"));
  const [accessType, setAccessType] = useState(searchParams.get("accessType") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "relevance");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const runSearch = async (overrides: Record<string, any> = {}) => {
    const q = overrides.query ?? query;
    const tags = overrides.tags ?? selectedTags;
    const access = overrides.accessType ?? accessType;
    const sort = overrides.sortBy ?? sortBy;

    setLoading(true);
    setSearched(true);

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    tags.forEach((t: string) => params.append("tags", t));
    if (access) params.set("accessType", access);
    params.set("sortBy", sort);

    // Update URL without navigation
    router.replace(`/search?${params.toString()}`, { scroll: false });

    try {
      const res = await fetch(`/api/videos/search?${params.toString()}`);
      const data = await res.json();
      if (res.ok) setResults(data.results || []);
    } catch (err) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-search on initial mount if params present
  useEffect(() => {
    if (searchParams.get("q") || searchParams.getAll("tags").length > 0) {
      runSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTag = (tag: string) => {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(next);
    runSearch({ tags: next });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-indigo-500/30">

      {/* Sticky Search Header */}
      <header className="sticky top-0 z-50 border-b border-gray-800/60 bg-gray-950/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center gap-4">
          <Link href="/" className="text-xl font-black shrink-0">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400">Vault</span>Stream
          </Link>
          <form className="flex flex-1 gap-3" onSubmit={e => { e.preventDefault(); runSearch(); }}>
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                id="search-input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search videos, tags, creators..."
                className="w-full rounded-xl border border-gray-700 bg-gray-900 py-3 pl-12 pr-4 text-white placeholder-gray-500 outline-none ring-0 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                autoComplete="off"
              />
            </div>
            <button type="submit" id="search-submit" className="rounded-xl bg-indigo-600 px-7 py-3 font-bold text-white transition hover:bg-indigo-500 shadow-lg shadow-indigo-500/20">
              Search
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 flex gap-8">

        {/* Filters Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 space-y-8 sticky top-28 self-start">
          {/* Access Type */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Access Type</h3>
            <div className="flex flex-col gap-1.5">
              {ACCESS_TYPE_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => { setAccessType(opt.value); runSearch({ accessType: opt.value }); }}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition ${accessType === opt.value ? "bg-indigo-600 text-white" : "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Sort By</h3>
            <div className="flex flex-col gap-1.5">
              {SORT_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => { setSortBy(opt.value); runSearch({ sortBy: opt.value }); }}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold transition ${sortBy === opt.value ? "bg-indigo-600 text-white" : "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-white"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Popular Tags</h3>
            <div className="flex flex-wrap gap-2">
              {POPULAR_TAGS.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${selectedTags.includes(tag) ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/30" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Results Grid */}
        <main className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <p className="text-gray-400 text-sm font-medium">
              {!searched ? "Enter a search term above." : loading ? "Searching..." : `${results.length} result${results.length !== 1 ? "s" : ""} found`}
            </p>
          </div>

          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden animate-pulse">
                  <div className="aspect-video bg-gray-800"></div>
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-800 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-800 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <svg className="h-16 w-16 text-gray-700 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-400 mb-2">No results found</h2>
              <p className="text-gray-600 text-sm">Try different keywords or remove some filters.</p>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {results.map(video => (
                <Link href={`/watch/${video.id}`} key={video.id}
                  className="group rounded-2xl border border-gray-800 bg-gray-900 overflow-hidden shadow-lg hover:-translate-y-1.5 transition-all duration-300 hover:border-indigo-500/40 hover:shadow-[0_0_25px_rgba(99,102,241,0.1)] flex flex-col">
                  <div className="aspect-video relative overflow-hidden bg-black">
                    {video.thumbnailUrl && (
                      <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent"></div>
                    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-md border ${
                      video.accessType === "free" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" :
                      video.accessType === "paid" ? "bg-amber-500/20 text-amber-400 border-amber-500/30" :
                      "bg-purple-500/20 text-purple-400 border-purple-500/30"}`}>
                      {video.accessType?.toUpperCase()}
                    </span>
                  </div>
                  <div className="p-5 flex flex-col gap-3 flex-grow">
                    <h3 className="font-bold text-white leading-snug line-clamp-2 group-hover:text-indigo-300 transition-colors">{video.title}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-auto">
                      {(video.tags || []).slice(0, 3).map((tag: string) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded-md bg-gray-800 text-gray-500 font-medium">#{tag}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-600 font-medium pt-1 border-t border-gray-800">
                      <span>{(video.views || 0).toLocaleString()} views</span>
                      {video.price_coins > 0 && video.accessType === "paid" && (
                        <span className="text-amber-500 font-bold">{video.price_coins} coins</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    // Suspense required since we use useSearchParams in a child component
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-950"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-500"></div></div>}>
      <SearchResults />
    </Suspense>
  );
}
