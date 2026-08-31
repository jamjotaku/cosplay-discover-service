"use client";

import { useState, useMemo } from "react";
import dictionary from "@/data/vtuber_dictionary.json";

type CosplayData = {
  member: string;
  cosplayer: string;
  image: string;
  link: string;
  [key: string]: any;
};

type Agency = "All" | "Hololive" | "Nijisanji" | "VSPO";

export default function CosplayGallery({ data }: { data: CosplayData[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeAgency, setActiveAgency] = useState<Agency>("All");

  // Enhance data with agency and color from the dictionary
  const enhancedData = useMemo(() => {
    return data.map(item => {
      // Find the character in the dictionary
      const charInfo = dictionary.find(d => 
        d.name === item.member || (item.member && item.member.includes(d.name))
      );
      return {
        ...item,
        agency: charInfo ? charInfo.agency as Agency : "Unknown",
        color: charInfo ? charInfo.color : "#9ca3af" // Default gray
      };
    });
  }, [data]);

  // Filter by search and agency
  const filteredData = useMemo(() => {
    return enhancedData.filter((item) => {
      // Agency filter
      if (activeAgency !== "All" && item.agency !== activeAgency) {
        return false;
      }
      
      // Text search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesMember = item.member && item.member.toLowerCase().includes(query);
        const matchesCosplayer = item.cosplayer && item.cosplayer.toLowerCase().includes(query);
        if (!matchesMember && !matchesCosplayer) {
          return false;
        }
      }
      
      return true;
    });
  }, [enhancedData, searchQuery, activeAgency]);

  return (
    <div>
      {/* 検索バー */}
      <div className="mb-8 max-w-2xl mx-auto">
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
      </div>

      {/* 事務所タブ */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        <button
          onClick={() => setActiveAgency("All")}
          className={`px-5 py-2.5 rounded-full font-medium transition-colors ${
            activeAgency === "All" ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          すべて
        </button>
        <button
          onClick={() => setActiveAgency("Hololive")}
          className={`px-5 py-2.5 rounded-full font-medium transition-colors ${
            activeAgency === "Hololive" ? "bg-[#56B5D7] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          ホロライブ
        </button>
        <button
          onClick={() => setActiveAgency("Nijisanji")}
          className={`px-5 py-2.5 rounded-full font-medium transition-colors ${
            activeAgency === "Nijisanji" ? "bg-[#2C2C2C] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          にじさんじ
        </button>
        <button
          onClick={() => setActiveAgency("VSPO")}
          className={`px-5 py-2.5 rounded-full font-medium transition-colors ${
            activeAgency === "VSPO" ? "bg-[#A5C1E7] text-gray-900" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          ぶいすぽっ！
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-6 text-center">
        全 {enhancedData.length} 件中 {filteredData.length} 件を表示
      </p>

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
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                <h3 className="font-bold text-xl text-gray-900 line-clamp-1">{item.member}</h3>
              </div>
              <p className="text-sm text-gray-500 mb-5 line-clamp-1">Cosplayer: <span className="text-gray-700 font-medium">{item.cosplayer}</span></p>
              {item.link ? (
                <a 
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center hover:opacity-90 text-white font-medium py-2.5 px-4 rounded-xl transition-opacity text-sm"
                  style={{ backgroundColor: item.color === '#ffffff' ? '#000000' : item.color, color: item.color === '#ffffff' ? 'white' : 'white', textShadow: '0px 1px 2px rgba(0,0,0,0.5)' }}
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
