"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export default function AuthHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState("");
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
    
    // 裏側でダミーのメールアドレスに変換してSupabaseに渡す
    const dummyEmail = `${userId}@cosplay.local`;

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email: dummyEmail, password });
      if (error) setMessage(error.message);
      else {
        setMessage("登録完了！自動ログインしました。");
        setUserId("");
        setPassword("");
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

  // 表示用のIDをメールアドレスから復元
  const displayId = user?.email?.split('@')[0] || "Unknown";

  return (
    <div className="absolute top-4 right-4 z-50">
      {user ? (
        <div className="flex items-center gap-4 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-md border border-gray-200">
          <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
            <span className="text-lg">👤</span> {displayId}
          </span>
          <button 
            onClick={handleLogout}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-1.5 px-3 rounded-full transition-colors"
          >
            ログアウト
          </button>
        </div>
      ) : (
        <form onSubmit={handleAuth} className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-2 rounded-full shadow-md border border-gray-200">
          <input 
            type="text" 
            placeholder="お好きなID" 
            value={userId}
            onChange={(e) => setUserId(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
            required
            className="text-sm px-3 py-1.5 rounded-full border border-gray-300 focus:outline-none focus:border-blue-500 w-28 bg-gray-50"
          />
          <input 
            type="password" 
            placeholder="パスワード(6文字~)" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="text-sm px-3 py-1.5 rounded-full border border-gray-300 focus:outline-none focus:border-blue-500 w-32 bg-gray-50"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition-colors whitespace-nowrap"
          >
            {loading ? "処理中..." : (isSignUp ? "新規登録" : "ログイン")}
          </button>
          
          <button 
            type="button"
            onClick={() => { setIsSignUp(!isSignUp); setMessage(""); }}
            className="text-xs text-blue-500 hover:underline ml-1 mr-2"
          >
            {isSignUp ? "ログインへ" : "新規登録へ"}
          </button>
        </form>
      )}
      {message && <div className="absolute top-full mt-2 right-0 bg-black/80 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">{message}</div>}
    </div>
  );
}
