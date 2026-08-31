"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export default function AuthHeader() {
  const [user, setUser] = useState<User | null>(null);
  
  // モーダルの状態
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // フォームの状態
  const [userId, setUserId] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsModalOpen(false); // ログイン成功時にモーダルを閉じる
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userId.length < 3 || password.length < 6) {
      setMessage("IDは3文字以上、パスワードは6文字以上にしてください。");
      return;
    }
    
    setLoading(true);
    setMessage("");
    
    // IDに含まれる記号（アンダーバーなど）がSupabaseの厳格なメールアドレスチェックで弾かれるため、
    // IDを安全な英数字のみの文字列（16進数）に変換してからダミーメールを生成します
    const hexId = Array.from(new TextEncoder().encode(userId)).map(b => b.toString(16).padStart(2, '0')).join('');
    const dummyEmail = `u${hexId}@gmail.com`;

    if (isSignUp) {
      if (!nickname) {
        setMessage("ニックネームを入力してください。");
        setLoading(false);
        return;
      }
      
      const { error } = await supabase.auth.signUp({ 
        email: dummyEmail, 
        password,
        options: {
          data: { nickname } // ユーザーメタデータにニックネームを保存
        }
      });
      
      if (error) setMessage(error.message);
      else {
        setMessage("登録完了！自動ログインしました。");
        setUserId("");
        setPassword("");
        setNickname("");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: dummyEmail, password });
      if (error) {
        setMessage("IDまたはパスワードが間違っています。");
      } else {
        setMessage("");
        setUserId("");
        setPassword("");
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // 表示用のニックネームまたはIDを取得
  const displayName = user?.user_metadata?.nickname || user?.email?.split('@')[0] || "Unknown";

  return (
    <>
      <div className="absolute top-4 right-4 z-40">
        {user ? (
          <div className="flex items-center gap-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md border border-gray-200">
            <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <span className="text-lg">👤</span> {displayName}
            </span>
            <button 
              onClick={handleLogout}
              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-1.5 px-3 rounded-full transition-colors"
            >
              ログアウト
            </button>
          </div>
        ) : (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-white/90 hover:bg-white backdrop-blur-md px-4 py-2 rounded-full shadow-md border border-gray-200 text-sm font-bold text-gray-700 transition-all hover:shadow-lg"
          >
            <span className="text-lg">👤</span> ログイン / 登録
          </button>
        )}
      </div>

      {/* ログイン・登録モーダル */}
      {isModalOpen && !user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="p-8">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-6 text-center">
                {isSignUp ? "アカウント登録" : "ログイン"}
              </h2>
              
              <form onSubmit={handleAuth} className="space-y-4">
                {isSignUp && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">表示名（ニックネーム）</label>
                    <input 
                      type="text" 
                      placeholder="例: 推し活太郎" 
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      required={isSignUp}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">ログインID（半角英数）</label>
                  <input 
                    type="text" 
                    placeholder="example_id" 
                    value={userId}
                    onChange={(e) => setUserId(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1 ml-1">パスワード（6文字以上）</label>
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                  />
                </div>
                
                {message && (
                  <div className="text-red-500 text-sm font-medium text-center bg-red-50 p-2 rounded-lg">
                    {message}
                  </div>
                )}
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-colors mt-2 shadow-md"
                >
                  {loading ? "処理中..." : (isSignUp ? "登録してはじめる" : "ログイン")}
                </button>
              </form>
              
              <div className="mt-6 text-center">
                <button 
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setMessage(""); }}
                  className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors"
                >
                  {isSignUp ? "すでにアカウントをお持ちの方はこちら" : "初めての方はこちら（新規登録）"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
