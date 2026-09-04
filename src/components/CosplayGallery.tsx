"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import dictionary from "@/data/vtuber_dictionary.json";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

type Agency = "All" | "Hololive" | "Nijisanji" | "VSPO" | "Favorites";

export default function CosplayGallery({ fixedCosplayer }: { fixedCosplayer?: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeAgency, setActiveAgency] = useState<Agency>("All");
  const [sortOrder, setSortOrder] = useState<"Random" | "Default" | "Debut">("Random");
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  // セッションごとのランダムシード（0〜1）
  const [randomSeed] = useState(() => Math.random());

  // Auth & Favorites state
  const [user, setUser] = useState<{ id: string; nickname: string } | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // ログイン状態とFavoritesの同期
  const syncAuth = () => {
    const storedUser = localStorage.getItem("cosplay_user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchFavorites(parsedUser.id);
    } else {
      setUser(null);
      setFavorites(new Set());
    }
  };

  useEffect(() => {
    syncAuth();
    window.addEventListener("auth_changed", syncAuth);
    return () => window.removeEventListener("auth_changed", syncAuth);
  }, []);

  const fetchFavorites = async (userId: string) => {
    const { data, error } = await supabase
      .from('custom_favorites')
      .select('link')
      .eq('user_id', userId);
      
    if (!error && data) {
      setFavorites(new Set(data.map(f => f.link)));
    }
  };

  const toggleFavorite = async (link: string) => {
    if (!user) {
      alert("推し登録をするにはログインが必要です！");
      return;
    }

    const newFavorites = new Set(favorites);
    const isCurrentlyFavorite = newFavorites.has(link);

    if (isCurrentlyFavorite) {
      newFavorites.delete(link);
      setFavorites(newFavorites);
      await supabase
        .from('custom_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('link', link);
    } else {
      newFavorites.add(link);
      setFavorites(newFavorites);
      await supabase
        .from('custom_favorites')
        .insert({ user_id: user.id, link });
    }
  };

  const fetchCosplays = async (isLoadMore = false) => {
    if (loading) return;
    setLoading(true);
    
    const currentOffset = isLoadMore ? items.length : 0;
    
    // 1. レイヤー固定モード or お気に入りモード の場合 (RPCを使わずに直接取得)
    if (fixedCosplayer || activeAgency === "Favorites") {
      
      let query = supabase
        .from('cosplay_items')
        .select('*')
        .eq('status', 'active');
        
      if (fixedCosplayer) {
        query = query.eq('cosplayer', fixedCosplayer);
      } else if (activeAgency === "Favorites") {
        const favArray = Array.from(favorites);
        if (favArray.length === 0) {
          setItems([]);
          setHasMore(false);
          setLoading(false);
          return;
        }
        query = query.in('tweet_url', favArray);
      }
        
      if (searchQuery.trim()) {
        const q = `%${searchQuery.trim()}%`;
        query = query.or(`cosplayer.ilike.${q},unit.ilike.${q},member.ilike.${q},tags.cs.{${searchQuery.trim()}}`);
      }
      
      if (sortOrder === "Debut") query = query.order('debut_order', { ascending: true, nullsFirst: false });
      else if (sortOrder === "Default") query = query.order('created_at', { ascending: false });
      
      // クライアント側でシャッフルするため上限1000件を一括取得
      query = query.limit(1000);
      
      const { data, error } = await query;
      if (data) {
        let sorted = [...data];
        if (sortOrder === "Random") {
          sorted.sort(() => Math.random() - 0.5); // 簡易シャッフル
        }
        setItems(sorted);
        setHasMore(false); // 全件取得するため無限スクロールは停止
      }
      setLoading(false);
      return;
    }

    // 2. 通常のRPCフェッチ（完全に重複しないランダムページネーション）
    const { data, error } = await supabase.rpc('get_cosplays', {
      p_sort_type: sortOrder.toLowerCase(),
      p_seed: randomSeed,
      p_agency: activeAgency === "All" ? null : activeAgency,
      p_search: searchQuery.trim() || null,
      p_limit: 30,
      p_offset: currentOffset
    });

    if (data) {
      if (isLoadMore) {
        setItems(prev => [...prev, ...data]);
      } else {
        setItems(data);
      }
      setHasMore(data.length === 30);
    }
    setLoading(false);
  };

  // 検索条件が変わったらリセットして再取得
  useEffect(() => {
    setItems([]);
    setHasMore(true);
    fetchCosplays(false);
  }, [searchQuery, activeAgency, sortOrder, fixedCosplayer]);

  // 無限スクロールの監視
  const observer = useRef<IntersectionObserver | null>(null);
  const observerTarget = useCallback((node: HTMLDivElement | null) => {
    if (loading || !hasMore) return;
    if (observer.current) observer.current.disconnect();
    if (node) {
      observer.current = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting) {
            fetchCosplays(true);
          }
        },
        { rootMargin: "600px" }
      );
      observer.current.observe(node);
    }
  }, [loading, hasMore]);

  // 取得したデータをUI表示用に整形
  const displayedData = useMemo(() => {
    return items.map(item => {
      const matchedChars = (item.tags || []).map((t: string) => dictionary.find(d => d.name === t)).filter(Boolean);
      return {
        ...item,
        image: item.image_url,
        link: item.tweet_url,
        matchedChars: matchedChars,
        color: matchedChars.length > 0 ? matchedChars[0].color : "#9ca3af",
      };
    });
  }, [items]);

  return (
    <div>
      {/* 検索バー・事務所タブ (レイヤー固定モードでは非表示) */}
      {!fixedCosplayer && (
        <>
          <div className="mb-8 max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="キャラクター名やレイヤー名で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-5 py-4 pl-12 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-lg text-gray-800 bg-white"
              />
              <svg className="absolute left-4 top-4 h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <button onClick={() => setActiveAgency("All")} className={`px-6 py-2.5 rounded-full font-bold transition-all shadow-sm ${activeAgency === "All" ? "bg-gray-800 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}>
              すべて ({activeAgency === "All" && displayedData.length > 0 ? "..." : "ALL"})
            </button>
            <button onClick={() => setActiveAgency("Hololive")} className={`px-6 py-2.5 rounded-full font-bold transition-all shadow-sm ${activeAgency === "Hololive" ? "bg-blue-400 text-white" : "bg-white text-gray-600 hover:bg-blue-50 border border-gray-200"}`}>
              ホロライブ
            </button>
            <button onClick={() => setActiveAgency("Nijisanji")} className={`px-6 py-2.5 rounded-full font-bold transition-all shadow-sm ${activeAgency === "Nijisanji" ? "bg-gray-900 text-white" : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"}`}>
              にじさんじ
            </button>
            <button onClick={() => setActiveAgency("VSPO")} className={`px-6 py-2.5 rounded-full font-bold transition-all shadow-sm ${activeAgency === "VSPO" ? "bg-indigo-500 text-white" : "bg-white text-gray-600 hover:bg-indigo-50 border border-gray-200"}`}>
              ぶいすぽっ！
            </button>
            <button onClick={() => setActiveAgency("Favorites")} className={`px-6 py-2.5 rounded-full font-bold transition-all shadow-sm flex items-center gap-2 ${activeAgency === "Favorites" ? "bg-pink-500 text-white" : "bg-white text-pink-500 hover:bg-pink-50 border border-pink-200"}`}>
              <svg className="w-5 h-5" fill={activeAgency === "Favorites" ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              推し
            </button>
          </div>
        </>
      )}

      {/* 並び順トグル */}
      <div className="flex justify-end mb-6">
        <div className="inline-flex bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          <button
            onClick={() => setSortOrder("Random")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${sortOrder === "Random" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            🎲 ランダム
          </button>
          <button
            onClick={() => setSortOrder("Default")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${sortOrder === "Default" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            🕒 追加順
          </button>
          <button
            onClick={() => setSortOrder("Debut")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${sortOrder === "Debut" ? "bg-gray-100 text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            🌟 デビュー順
          </button>
        </div>
      </div>

      {/* ギャラリー */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {displayedData.map((item, index) => {
          const isFavorite = favorites.has(item.link);
          
          return (
            <div key={item.id || index} className="break-inside-avoid bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">
              {/* お気に入りボタン */}
              <button
                onClick={() => toggleFavorite(item.link)}
                className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:scale-110 transition-transform opacity-0 group-hover:opacity-100 sm:opacity-100"
              >
                <svg className={`w-6 h-6 ${isFavorite ? 'text-pink-500' : 'text-gray-400'}`} fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              <div className="relative min-h-[200px] bg-gray-100">
                <a href={item.link} target="_blank" rel="noopener noreferrer" className="block">
                  {item.image ? (
                    <img src={item.image} alt={`${item.cosplayer} - ${item.member}`} className="w-full h-auto object-cover hover:opacity-90 transition-opacity" loading="lazy" />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-400">No Image</span>
                    </div>
                  )}
                </a>
              </div>

              <div className="p-5">
                {item.unit ? (
                  <>
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <button 
                        onClick={() => { if(!fixedCosplayer) { setSearchQuery(item.unit!); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}
                        className={`font-bold text-xl text-gray-900 transition-colors text-left ${!fixedCosplayer ? 'hover:text-purple-600' : ''}`}
                      >
                        👑 {item.unit}
                      </button>
                      <div className="flex -space-x-1 items-center">
                        {item.matchedChars && item.matchedChars.slice(0, 5).map((char: any, i: number) => (
                          <div key={i} className="w-3.5 h-3.5 rounded-full border border-white z-0" style={{ backgroundColor: char.color }} title={char.name}></div>
                        ))}
                        {item.matchedChars && item.matchedChars.length > 5 && (
                          <div className="w-6 h-3.5 rounded-full border border-white bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-600 z-10 -ml-1">
                            +{item.matchedChars.length - 5}
                          </div>
                        )}
                      </div>
                    </div>
                    {item.matchedChars && item.matchedChars.length > 0 && (
                      <div className="flex flex-wrap gap-x-2 gap-y-1 mb-3 pl-1 max-h-[80px] overflow-y-auto">
                        {item.matchedChars.map((char: any, i: number) => (
                          <button 
                            key={i}
                            onClick={() => { if(!fixedCosplayer) { setSearchQuery(char.name); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}
                            className={`text-xs text-gray-500 transition-colors ${!fixedCosplayer ? 'hover:text-blue-600' : ''}`}
                          >
                            #{char.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-3">
                    {item.matchedChars && item.matchedChars.length > 0 ? (
                      item.matchedChars.map((char: any, i: number) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: char.color }}></div>
                          <button 
                            onClick={() => { if(!fixedCosplayer) { setSearchQuery(char.name); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}
                            className={`font-bold text-xl text-gray-900 transition-colors text-left ${!fixedCosplayer ? 'hover:text-blue-600' : ''}`}
                          >
                            {char.name}
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <button 
                          onClick={() => { if(!fixedCosplayer) { setSearchQuery(item.member); window.scrollTo({ top: 0, behavior: 'smooth' }); } }}
                          className={`font-bold text-xl text-gray-900 transition-colors text-left ${!fixedCosplayer ? 'hover:text-blue-600' : ''}`}
                        >
                          {item.member}
                        </button>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-gray-600 mt-4 border-t pt-4">
                  <span className="text-sm font-medium">Cosplayer:</span>
                  {fixedCosplayer ? (
                    <span className="font-bold text-blue-600">{item.cosplayer}</span>
                  ) : (
                    <Link href={`/cosplayer/${encodeURIComponent(item.cosplayer)}`} className="font-bold text-blue-600 hover:underline">
                      {item.cosplayer}
                    </Link>
                  )}
                </div>
                
                <div className="mt-4">
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="block w-full py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-center rounded-xl transition-colors">
                    X(Twitter)で見る
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && items.length === 0 && fixedCosplayer && (
        <div className="text-center py-20">
          <p className="text-xl text-gray-500 font-bold">写真がまだ登録されていません。</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-10">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <p className="mt-2 text-gray-500 font-medium">読み込み中...</p>
        </div>
      )}

      <div ref={observerTarget} className="h-20 w-full"></div>
    </div>
  );
}
