"use client";

import { useState, useMemo } from "react";

type CosplayData = {
  member: string;
  cosplayer: string;
  image: string;
  link: string;
  [key: string]: any;
};

export default function CosplayGallery({ data }: { data: CosplayData[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  // 検索クエリに応じてデータをフィルタリング（キャラ名 or レイヤー名）
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(
      (item) =>
        (item.member && item.member.toLowerCase().includes(query)) ||
        (item.cosplayer && item.cosplayer.toLowerCase().includes(query))
    );
  }, [data, searchQuery]);

  return (
    <div>
      {/* 検索バー */}
      <div className="mb-10 max-w-2xl mx-auto">
        <div className="relative">
          <input
            type="text"
            placeholder="キャラクター名やレイヤー名で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-5 py-4 pl-12 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-lg text-gray-800 bg-white"
          />
          <svg
            className="absolute left-4 top-4 h-6 w-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500 mt-3 text-center">
          全 {data.length} 件中 {filteredData.length} 件を表示
        </p>
      </div>

      {/* ギャラリー */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
        {filteredData.map((item, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="relative aspect-[3/4] bg-gray-100">
              {item.image ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={item.image}
                  alt={`${item.cosplayer} - ${item.member}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>
            <div className="p-5">
              <h3 className="font-bold text-xl text-gray-900 line-clamp-1 mb-1">{item.member}</h3>
              <p className="text-sm text-gray-500 mb-5 line-clamp-1">Cosplayer: <span className="text-gray-700 font-medium">{item.cosplayer}</span></p>
              {item.link ? (
                <a 
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-black hover:bg-gray-800 text-white font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
                >
                  X(Twitter)で見る
                </a>
              ) : (
                <button disabled className="block w-full text-center bg-gray-100 text-gray-400 font-medium py-2.5 px-4 rounded-xl text-sm">
                  リンクなし
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="text-center text-gray-500 py-20">
          「{searchQuery}」に一致するコスプレ写真が見つかりませんでした。
        </div>
      )}
    </div>
  );
}
