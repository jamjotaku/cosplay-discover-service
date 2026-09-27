"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { checkAdminAuth } from "@/lib/adminAuth";
import { useRouter } from "next/navigation";

export default function DictionaryAdminPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    if (!checkAdminAuth()) {
      router.push("/admin");
      return;
    }
    fetchDictionary();
  }, [router]);

  const fetchDictionary = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('vtuber_dictionary').select('*').order('created_at', { ascending: true });
    if (error) {
      alert("取得エラー: " + error.message);
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: editingItem.name,
        agency: editingItem.agency,
        color: editingItem.color || '#9ca3af',
        fanmarks: typeof editingItem.fanmarks === 'string' ? editingItem.fanmarks.split(',').map((s: string) => s.trim()).filter(Boolean) : editingItem.fanmarks,
        aliases: typeof editingItem.aliases === 'string' ? editingItem.aliases.split(',').map((s: string) => s.trim()).filter(Boolean) : editingItem.aliases
      };

      if (editingItem.id) {
        // Update
        const { error } = await supabase.from('vtuber_dictionary').update(payload).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        // Insert
        const { error } = await supabase.from('vtuber_dictionary').insert([payload]);
        if (error) throw error;
      }
      setEditingItem(null);
      fetchDictionary();
    } catch (err: any) {
      alert("保存エラー: " + err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("本当に削除しますか？")) return;
    const { error } = await supabase.from('vtuber_dictionary').delete().eq('id', id);
    if (error) alert("削除エラー: " + error.message);
    else fetchDictionary();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link href="/admin" className="text-gray-500 hover:underline mb-2 inline-block">&larr; 管理トップに戻る</Link>
            <h1 className="text-3xl font-black text-gray-900">VTuber辞書 管理</h1>
          </div>
          <button 
            onClick={() => setEditingItem({ name: '', agency: 'Hololive', color: '#000000', fanmarks: [], aliases: [] })}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-blue-700"
          >
            + 新規追加
          </button>
        </div>

        {loading ? <p>読み込み中...</p> : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 border-b border-gray-100">
                <tr>
                  <th className="p-4">名前</th>
                  <th className="p-4">事務所</th>
                  <th className="p-4">ファンマーク</th>
                  <th className="p-4">あだ名 (エイリアス)</th>
                  <th className="p-4">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="p-4 font-bold flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      {item.name}
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">{item.agency}</span>
                    </td>
                    <td className="p-4 text-lg">{item.fanmarks?.join(' ')}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {item.aliases?.map((a: string, i: number) => (
                          <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">{a}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <button onClick={() => setEditingItem({...item, fanmarks: item.fanmarks?.join(', '), aliases: item.aliases?.join(', ')})} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-xs font-bold mr-2">編集</button>
                      <button onClick={() => handleDelete(item.id)} className="px-3 py-1 text-red-500 hover:bg-red-50 rounded text-xs">削除</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 編集モーダル */}
        {editingItem && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h2 className="text-xl font-bold mb-4">{editingItem.id ? '辞書を編集' : '新規登録'}</h2>
              <form onSubmit={handleSave} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1 font-bold">キャラクター名 (必須)</label>
                  <input required type="text" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="w-full border p-2.5 rounded-lg" placeholder="例: 星街すいせい" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">事務所 (必須)</label>
                  <select required value={editingItem.agency} onChange={e => setEditingItem({...editingItem, agency: e.target.value})} className="w-full border p-2.5 rounded-lg bg-white">
                    <option value="Hololive">Hololive</option>
                    <option value="Nijisanji">Nijisanji</option>
                    <option value="VSPO">VSPO</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">テーマカラー (HEX)</label>
                  <input type="text" value={editingItem.color} onChange={e => setEditingItem({...editingItem, color: e.target.value})} className="w-full border p-2.5 rounded-lg" placeholder="#000000" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">ファンマーク (カンマ区切り)</label>
                  <input type="text" value={editingItem.fanmarks || ''} onChange={e => setEditingItem({...editingItem, fanmarks: e.target.value})} className="w-full border p-2.5 rounded-lg" placeholder="例: ☄️, 🍎" />
                </div>
                <div className="bg-blue-50 p-4 rounded-xl mt-2 border border-blue-100">
                  <label className="block text-sm text-blue-900 mb-1 font-bold">あだ名・エイリアス (カンマ区切り)</label>
                  <p className="text-xs text-blue-600 mb-2">※これを入れると自動抽出の命中率が劇的に上がります</p>
                  <input type="text" value={editingItem.aliases || ''} onChange={e => setEditingItem({...editingItem, aliases: e.target.value})} className="w-full border-blue-200 border p-2.5 rounded-lg" placeholder="例: すいちゃん, すいせい" />
                </div>
                
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                  <button type="button" onClick={() => setEditingItem(null)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium">キャンセル</button>
                  <button type="submit" className="px-5 py-2.5 bg-black hover:bg-gray-800 text-white font-bold rounded-xl">保存する</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
