"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AddCosplayPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const [editCharacter, setEditCharacter] = useState("");
  const [editCosplayer, setEditCosplayer] = useState("");
  const [editAgency, setEditAgency] = useState("");
  const [editUnit, setEditUnit] = useState("");

  // サジェスト用のレイヤー名リスト
  const [knownCosplayers, setKnownCosplayers] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    const fetchCosplayers = async () => {
      try {
        const res = await fetch("/api/cosplay/cosplayers");
        const data = await res.json();
        if (data.cosplayers) {
          setKnownCosplayers(data.cosplayers);
        }
      } catch (err) {
        console.error("サジェストデータの取得に失敗しました", err);
      }
    };
    fetchCosplayers();
  }, []);

  const handleAnalyze = async () => {
    if (!url) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "エラーが発生しました");
      }
      setResult(data);
      setEditCharacter(data.analysis.character || "");
      setEditCosplayer(data.tweet.author || "");
      setEditAgency(data.analysis.agency || "");
      setEditUnit(""); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      const payload = {
        member: editCharacter,
        cosplayer: editCosplayer,
        image: result.tweet.images && result.tweet.images.length > 0 ? result.tweet.images[0] : "",
        link: url,
        unit: editUnit
      };
      
      const res = await fetch('/api/cosplay/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const responseData = await res.json();
      
      if (!res.ok) {
        throw new Error(responseData.error || '保存に失敗しました');
      }

      alert('データベースに登録しました！');
      setUrl("");
      setResult(null);
      setEditCharacter("");
      setEditCosplayer("");
      setEditAgency("");
      setEditUnit("");
      
      // 新しい名前を追加したかもしれないのでサジェスト更新
      if (!knownCosplayers.includes(editCosplayer)) {
        setKnownCosplayers(prev => [...prev, editCosplayer].sort());
      }
    } catch (err: any) {
      alert('エラーが発生しました: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredCosplayers = knownCosplayers
    .filter(name => name.toLowerCase().includes(editCosplayer.toLowerCase()))
    .slice(0, 50);

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-blue-500 hover:underline mb-8 inline-block">
          &larr; ギャラリーに戻る
        </Link>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">コスプレ写真を追加</h1>
          <p className="text-gray-500 mb-8">
            X(Twitter)の画像付きツイートのURLを貼り付けるだけで、ローカルのVTuber辞書と高速照合してキャラクター名を特定します。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <input
              type="text"
              placeholder="https://x.com/username/status/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleAnalyze}
              disabled={loading || !url}
              className="bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white font-medium py-3 px-8 rounded-xl transition-colors whitespace-nowrap"
            >
              {loading ? "辞書と照合中..." : "抽出する"}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8">
              {error}
            </div>
          )}

          {result && (
            <div className="animate-fade-in border-t border-gray-100 pt-8 mt-4">
              <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded mr-2">解析完了</span>
                プレビュー（修正可能）
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 画像プレビュー */}
                <div className="bg-gray-100 rounded-xl overflow-hidden aspect-[3/4] relative">
                  {result.tweet.images && result.tweet.images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={result.tweet.images[0]} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">画像なし</div>
                  )}
                </div>

                {/* 解析結果（編集フォーム） */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">ユニット名・備考（任意）</label>
                    <input
                      type="text"
                      value={editUnit}
                      onChange={(e) => setEditUnit(e.target.value)}
                      className="w-full text-gray-900 bg-white px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      placeholder="例: ChroNoiR、miComet など"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">推測されたキャラクター名</label>
                    <input
                      type="text"
                      value={editCharacter}
                      onChange={(e) => setEditCharacter(e.target.value)}
                      className="w-full font-bold text-lg text-gray-900 bg-white px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      placeholder="キャラクター名"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">推測された事務所（参考）</label>
                    <input
                      type="text"
                      value={editAgency}
                      onChange={(e) => setEditAgency(e.target.value)}
                      className="w-full text-gray-700 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-500 mb-1">投稿者（レイヤー名）</label>
                    <input
                      type="text"
                      value={editCosplayer}
                      onChange={(e) => setEditCosplayer(e.target.value)}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className="w-full text-gray-900 bg-white px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      autoComplete="off"
                    />
                    {showSuggestions && (
                      <ul className="absolute z-10 w-full bg-white border border-gray-200 mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredCosplayers.map((name, i) => (
                          <li
                            key={i}
                            onClick={() => {
                              setEditCosplayer(name);
                              setShowSuggestions(false);
                            }}
                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 border-b border-gray-50 last:border-0"
                          >
                            {name}
                          </li>
                        ))}
                        {filteredCosplayers.length === 0 && (
                          <li className="px-4 py-3 text-sm text-gray-400 italic">候補がありません (新規登録になります)</li>
                        )}
                      </ul>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      Xアカウント名: @{result.tweet.screenName}
                    </p>
                    <p className="text-[10px] text-blue-500 mt-1 font-medium">
                      ※入力欄をタップすると過去に登録された名前がサジェストされます。表記揺れを防ぐため同じ人は同じ名前を選択してください。
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">ツイート本文</label>
                    <p className="text-gray-600 text-xs whitespace-pre-wrap line-clamp-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      {result.tweet.text}
                    </p>
                  </div>

                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 px-4 rounded-xl mt-6 shadow-md transition-all transform hover:-translate-y-1"
                  >
                    {saving ? "保存中..." : "この内容でデータベースに登録"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
