"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "dead">("all");
  const [editingItem, setEditingItem] = useState<any | null>(null);

  const [mergeSource, setMergeSource] = useState("");
  const [mergeTarget, setMergeTarget] = useState("");
  const [isMerging, setIsMerging] = useState(false);

  // パスワードチェチE��
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    if (data.success) {
      setIsAuthenticated(true);
      fetchItems();
    } else {
      alert("パスワードが違いまぁE);
    }
  };

  const fetchItems = async () => {
    setLoading(true);
    let query = supabase.from("cosplay_items").select("*").order("created_at", { ascending: false }).limit(200);
    
    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data, error } = await query;
    if (data) setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchItems();
    }
  }, [filterStatus]);

  const updateStatus = async (id: string, status: string) => {
    if (!confirm(`スチE�EタスめE${status} に変更しますか�E�`)) return;
    const { error } = await supabase.from("cosplay_items").update({ status }).eq("id", id);
    if (!error) fetchItems();
  };

  const deleteItem = async (id: string) => {
    if (!confirm("チE�Eタベ�Eスから完�Eに削除します。よろしぁE��すか�E�E)) return;
    const { error } = await supabase.from("cosplay_items").delete().eq("id", id);
    if (!error) fetchItems();
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    
    const { error } = await supabase.from("cosplay_items").update({
      member: editingItem.member,
      cosplayer: editingItem.cosplayer,
      unit: editingItem.unit,
      tags: typeof editingItem.tags === 'string' ? editingItem.tags.split(',').map((t: string) => t.trim()) : editingItem.tags
    }).eq("id", editingItem.id);
    
    if (!error) {
      setEditingItem(null);
      fetchItems();
    } else {
      alert("更新エラー: " + error.message);
    }
  };

  const handleMerge = async () => {
    if (!mergeSource.trim() || !mergeTarget.trim()) {
      alert("両方の名前を�E力してください");
      return;
    }
    if (!confirm(`、E{mergeSource}」をすべて、E{mergeTarget}」に統合しますか�E�\n允E��戻すことはできません。`)) return;
    
    setIsMerging(true);
    const { error } = await supabase
      .from('cosplay_items')
      .update({ cosplayer: mergeTarget.trim() })
      .eq('cosplayer', mergeSource.trim());
      
    if (error) {
      alert("統合エラー: " + error.message);
    } else {
      alert("統合が完亁E��ました�E�E);
      setMergeSource("");
      setMergeTarget("");
      fetchItems();
    }
    setIsMerging(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-sm max-w-sm w-full">
          <h1 className="text-2xl font-bold mb-6 text-center">Admin Login</h1>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg mb-4" placeholder="Password" />
          <button type="submit" className="w-full bg-gray-900 text-white font-bold py-2 rounded-lg">ログイン</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">管理ダッシュボード</h1>
          <Link href="/" className="text-blue-500 hover:underline">ギャラリーに戻る</Link>
        </div>

        {/* 辞書管理へのリンク */}
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 border border-blue-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-blue-900 mb-1 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              VTuber辞書・あだ名管理
            </h2>
            <p className="text-sm text-gray-500">キャラクターの追加、ファンマークの編集、自動推測用のあだ名を登録します。</p>
          </div>
          <Link href="/admin/dictionary" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-sm whitespace-nowrap">
            辞書を管理する &rarr;
          </Link>
        </div>

        {/* レイヤー名統合ツール */}
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 border border-purple-100">
          <h2 className="text-xl font-bold mb-4 text-purple-900 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            レイヤー吁E統合ツール (表記揺れ�E修正)
          </h2>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm text-gray-600 mb-1">間違ってぁE��名前 (統合�E)</label>
              <input type="text" value={mergeSource} onChange={e => setMergeSource(e.target.value)} placeholder="侁E Ringo@夏コチE className="w-full border p-2.5 rounded-lg" />
            </div>
            <div className="text-gray-400 py-3 hidden md:block">➁E/div>
            <div className="flex-1 w-full">
              <label className="block text-sm text-gray-600 mb-1">正しい名前 (統合�E)</label>
              <input type="text" value={mergeTarget} onChange={e => setMergeTarget(e.target.value)} placeholder="侁E りんぁE className="w-full border p-2.5 rounded-lg" />
            </div>
            <button 
              onClick={handleMerge} 
              disabled={isMerging}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold rounded-lg w-full md:w-auto transition-colors"
            >
              {isMerging ? '統合中...' : '統合を実衁E}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">※統合�Eと同じ名前で登録されてぁE��写真が、すべて統合�Eのレイヤー名に上書きされます、E/p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 flex flex-wrap gap-4 items-center">
          <button onClick={() => setFilterStatus("all")} className={`px-4 py-2 rounded-md font-bold ${filterStatus === "all" ? "bg-gray-800 text-white" : "bg-gray-100"}`}>すべて</button>
          <button onClick={() => setFilterStatus("active")} className={`px-4 py-2 rounded-md font-bold ${filterStatus === "active" ? "bg-green-600 text-white" : "bg-gray-100"}`}>有効 (Active)</button>
          <button onClick={() => setFilterStatus("dead")} className={`px-4 py-2 rounded-md font-bold ${filterStatus === "dead" ? "bg-red-600 text-white" : "bg-gray-100"}`}>死リンク (Dead)</button>
          <button onClick={fetchItems} className="ml-auto px-4 py-2 bg-blue-100 text-blue-700 rounded-md font-bold">チE�Eタを更新</button>
        </div>

        {loading ? <p>読み込み中...</p> : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-4">画僁E/th>
                  <th className="p-4">惁E��</th>
                  <th className="p-4">スチE�Eタス</th>
                  <th className="p-4">操佁E/th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="p-4 w-24">
                      <a href={item.tweet_url} target="_blank" rel="noreferrer">
                        <img src={item.image_url} alt="" className="w-20 h-20 object-cover rounded-md" />
                      </a>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{item.member}</div>
                      <div className="text-blue-600 font-bold mt-1">👤 {item.cosplayer}</div>
                      <div className="text-gray-400 text-xs mt-1">タグ: {item.tags?.join(', ')}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.status}
                      </span>
                      <div className="text-gray-400 text-[10px] mt-2">
                        最終確誁E<br/>{item.last_checked_at ? new Date(item.last_checked_at).toLocaleString() : '未確誁E}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        <button onClick={() => setEditingItem(item)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-700">編雁E/button>
                        {item.status === 'active' ? (
                          <button onClick={() => updateStatus(item.id, 'dead')} className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs font-bold">非表示</button>
                        ) : (
                          <button onClick={() => updateStatus(item.id, 'active')} className="px-3 py-1 bg-green-50 hover:bg-green-100 text-green-600 rounded text-xs font-bold">復活</button>
                        )}
                        <button onClick={() => deleteItem(item.id)} className="px-3 py-1 text-gray-400 hover:text-red-600 rounded text-xs underline">完�E削除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 編雁E��ーダル */}
        {editingItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h2 className="text-xl font-bold mb-4">チE�Eタ編雁E/h2>
              <form onSubmit={saveEdit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">キャラ吁E(允E��ータ)</label>
                  <input type="text" value={editingItem.member || ''} onChange={e => setEditingItem({...editingItem, member: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 font-bold text-blue-600">レイヤー吁E/label>
                  <input type="text" value={editingItem.cosplayer || ''} onChange={e => setEditingItem({...editingItem, cosplayer: e.target.value})} className="w-full border p-2 rounded font-bold" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">ユニット名</label>
                  <input type="text" value={editingItem.unit || ''} onChange={e => setEditingItem({...editingItem, unit: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">タグ (カンマ区刁E��)</label>
                  <input type="text" value={typeof editingItem.tags === 'string' ? editingItem.tags : (editingItem.tags?.join(', ') || '')} onChange={e => setEditingItem({...editingItem, tags: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" onClick={() => setEditingItem(null)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg">キャンセル</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg">保孁E/button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
