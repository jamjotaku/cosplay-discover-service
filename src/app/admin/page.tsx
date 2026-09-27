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

  // 繝代せ繝ｯ繝ｼ繝峨メ繧ｧ繝・け
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
      alert("繝代せ繝ｯ繝ｼ繝峨′驕輔＞縺ｾ縺・);
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
    if (!confirm(`繧ｹ繝・・繧ｿ繧ｹ繧・${status} 縺ｫ螟画峩縺励∪縺吶°・歔)) return;
    const { error } = await supabase.from("cosplay_items").update({ status }).eq("id", id);
    if (!error) fetchItems();
  };

  const deleteItem = async (id: string) => {
    if (!confirm("繝・・繧ｿ繝吶・繧ｹ縺九ｉ螳悟・縺ｫ蜑企勁縺励∪縺吶ゅｈ繧阪＠縺・〒縺吶°・・)) return;
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
      alert("譖ｴ譁ｰ繧ｨ繝ｩ繝ｼ: " + error.message);
    }
  };

  const handleMerge = async () => {
    if (!mergeSource.trim() || !mergeTarget.trim()) {
      alert("荳｡譁ｹ縺ｮ蜷榊燕繧貞・蜉帙＠縺ｦ縺上□縺輔＞");
      return;
    }
    if (!confirm(`縲・{mergeSource}縲阪ｒ縺吶∋縺ｦ縲・{mergeTarget}縲阪↓邨ｱ蜷医＠縺ｾ縺吶°・歃n蜈・↓謌ｻ縺吶％縺ｨ縺ｯ縺ｧ縺阪∪縺帙ｓ縲Ａ)) return;
    
    setIsMerging(true);
    const { error } = await supabase
      .from('cosplay_items')
      .update({ cosplayer: mergeTarget.trim() })
      .eq('cosplayer', mergeSource.trim());
      
    if (error) {
      alert("邨ｱ蜷医お繝ｩ繝ｼ: " + error.message);
    } else {
      alert("邨ｱ蜷医′螳御ｺ・＠縺ｾ縺励◆・・);
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
          <button type="submit" className="w-full bg-gray-900 text-white font-bold py-2 rounded-lg">繝ｭ繧ｰ繧､繝ｳ</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">邂｡逅・・ム繝・す繝･繝懊・繝・/h1>
          <Link href="/" className="text-blue-500 hover:underline">繧ｮ繝｣繝ｩ繝ｪ繝ｼ縺ｫ謌ｻ繧・/Link>
        </div>

        {/* 繝ｬ繧､繝､繝ｼ蜷咲ｵｱ蜷医ヤ繝ｼ繝ｫ */}
        <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 border border-purple-100">
          <h2 className="text-xl font-bold mb-4 text-purple-900 flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            繝ｬ繧､繝､繝ｼ蜷・邨ｱ蜷医ヤ繝ｼ繝ｫ (陦ｨ險俶昭繧後・菫ｮ豁｣)
          </h2>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm text-gray-600 mb-1">髢馴＆縺｣縺ｦ縺・ｋ蜷榊燕 (邨ｱ蜷亥・)</label>
              <input type="text" value={mergeSource} onChange={e => setMergeSource(e.target.value)} placeholder="萓・ Ringo@螟上さ繝・ className="w-full border p-2.5 rounded-lg" />
            </div>
            <div className="text-gray-400 py-3 hidden md:block">筐・/div>
            <div className="flex-1 w-full">
              <label className="block text-sm text-gray-600 mb-1">豁｣縺励＞蜷榊燕 (邨ｱ蜷亥・)</label>
              <input type="text" value={mergeTarget} onChange={e => setMergeTarget(e.target.value)} placeholder="萓・ 繧翫ｓ縺・ className="w-full border p-2.5 rounded-lg" />
            </div>
            <button 
              onClick={handleMerge} 
              disabled={isMerging}
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold rounded-lg w-full md:w-auto transition-colors"
            >
              {isMerging ? '邨ｱ蜷井ｸｭ...' : '邨ｱ蜷医ｒ螳溯｡・}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-3">窶ｻ邨ｱ蜷亥・縺ｨ蜷後§蜷榊燕縺ｧ逋ｻ骭ｲ縺輔ｌ縺ｦ縺・ｋ蜀咏悄縺後√☆縺ｹ縺ｦ邨ｱ蜷亥・縺ｮ繝ｬ繧､繝､繝ｼ蜷阪↓荳頑嶌縺阪＆繧後∪縺吶・/p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm mb-6 flex flex-wrap gap-4 items-center">
          <button onClick={() => setFilterStatus("all")} className={`px-4 py-2 rounded-md font-bold ${filterStatus === "all" ? "bg-gray-800 text-white" : "bg-gray-100"}`}>縺吶∋縺ｦ</button>
          <button onClick={() => setFilterStatus("active")} className={`px-4 py-2 rounded-md font-bold ${filterStatus === "active" ? "bg-green-600 text-white" : "bg-gray-100"}`}>譛牙柑 (Active)</button>
          <button onClick={() => setFilterStatus("dead")} className={`px-4 py-2 rounded-md font-bold ${filterStatus === "dead" ? "bg-red-600 text-white" : "bg-gray-100"}`}>豁ｻ繝ｪ繝ｳ繧ｯ (Dead)</button>
          <button onClick={fetchItems} className="ml-auto px-4 py-2 bg-blue-100 text-blue-700 rounded-md font-bold">繝・・繧ｿ繧呈峩譁ｰ</button>
        </div>

        {loading ? <p>隱ｭ縺ｿ霎ｼ縺ｿ荳ｭ...</p> : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="p-4">逕ｻ蜒・/th>
                  <th className="p-4">諠・ｱ</th>
                  <th className="p-4">繧ｹ繝・・繧ｿ繧ｹ</th>
                  <th className="p-4">謫堺ｽ・/th>
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
                      <div className="text-blue-600 font-bold mt-1">側 {item.cosplayer}</div>
                      <div className="text-gray-400 text-xs mt-1">繧ｿ繧ｰ: {item.tags?.join(', ')}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${item.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.status}
                      </span>
                      <div className="text-gray-400 text-[10px] mt-2">
                        譛邨ら｢ｺ隱・<br/>{item.last_checked_at ? new Date(item.last_checked_at).toLocaleString() : '譛ｪ遒ｺ隱・}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        <button onClick={() => setEditingItem(item)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold text-gray-700">邱ｨ髮・/button>
                        {item.status === 'active' ? (
                          <button onClick={() => updateStatus(item.id, 'dead')} className="px-3 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-xs font-bold">髱櫁｡ｨ遉ｺ</button>
                        ) : (
                          <button onClick={() => updateStatus(item.id, 'active')} className="px-3 py-1 bg-green-50 hover:bg-green-100 text-green-600 rounded text-xs font-bold">蠕ｩ豢ｻ</button>
                        )}
                        <button onClick={() => deleteItem(item.id)} className="px-3 py-1 text-gray-400 hover:text-red-600 rounded text-xs underline">螳悟・蜑企勁</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 邱ｨ髮・Δ繝ｼ繝繝ｫ */}
        {editingItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h2 className="text-xl font-bold mb-4">繝・・繧ｿ邱ｨ髮・/h2>
              <form onSubmit={saveEdit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">繧ｭ繝｣繝ｩ蜷・(蜈・ョ繝ｼ繧ｿ)</label>
                  <input type="text" value={editingItem.member || ''} onChange={e => setEditingItem({...editingItem, member: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1 font-bold text-blue-600">繝ｬ繧､繝､繝ｼ蜷・/label>
                  <input type="text" value={editingItem.cosplayer || ''} onChange={e => setEditingItem({...editingItem, cosplayer: e.target.value})} className="w-full border p-2 rounded font-bold" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">繝ｦ繝九ャ繝亥錐</label>
                  <input type="text" value={editingItem.unit || ''} onChange={e => setEditingItem({...editingItem, unit: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">繧ｿ繧ｰ (繧ｫ繝ｳ繝槫玄蛻・ｊ)</label>
                  <input type="text" value={typeof editingItem.tags === 'string' ? editingItem.tags : (editingItem.tags?.join(', ') || '')} onChange={e => setEditingItem({...editingItem, tags: e.target.value})} className="w-full border p-2 rounded" />
                </div>
                
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" onClick={() => setEditingItem(null)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg">繧ｭ繝｣繝ｳ繧ｻ繝ｫ</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg">菫晏ｭ・/button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
