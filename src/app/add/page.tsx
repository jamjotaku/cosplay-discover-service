"use client";

import { useState } from "react";
import Link from "next/link";

export default function AddCosplayPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

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
        member: result.analysis.character,
        cosplayer: result.tweet.author,
        image: result.tweet.images && result.tweet.images.length > 0 ? result.tweet.images[0] : "",
        link: url
      };
      const qs = new URLSearchParams(payload).toString();
      // 先ほど発行したGASのウェブアプリURL
      const gasUrl = `https://script.google.com/macros/s/AKfycbw0SKfTltoEYs8vk6ez9sGYLxTs7ore8lOlNlhxpfEfJnHnQKnU4hSlDwu6HXr7Qoz8/exec?${qs}`;
      
      await fetch(gasUrl, { mode: 'no-cors' });
      alert('スプレッドシートに登録しました！');
      setUrl("");
      setResult(null);
    } catch (err: any) {
      alert('エラーが発生しました: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-blue-500 hover:underline mb-8 inline-block">
          &larr; ギャラリーに戻る
        </Link>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-10">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">コスプレ写真を追加</h1>
          <p className="text-gray-500 mb-8">
            X(Twitter)の画像付きツイートのURLを貼り付けるだけで、ローカルのVTuber辞書（252名）と高速照合してキャラクター名を特定します。
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
                プレビュー
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

                {/* 解析結果 */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">推測された事務所</label>
                    <div className="font-bold text-xl text-gray-900 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                      {result.analysis.agency}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">推測されたキャラクター名</label>
                    <div className="font-bold text-xl text-white px-4 py-3 rounded-lg border shadow-sm" style={{ backgroundColor: result.analysis.color === '#ffffff' ? '#000000' : result.analysis.color, textShadow: '0px 1px 2px rgba(0,0,0,0.5)' }}>
                      {result.analysis.character}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">投稿者</label>
                    <div className="text-gray-900">{result.tweet.author} (@{result.tweet.screenName})</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">ツイート本文</label>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap line-clamp-4 bg-gray-50 p-3 rounded-lg">
                      {result.tweet.text}
                    </p>
                  </div>

                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 px-4 rounded-xl mt-4 shadow-md transition-all transform hover:-translate-y-1"
                  >
                    {saving ? "保存中..." : "この内容でスプレッドシートに登録"}
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
