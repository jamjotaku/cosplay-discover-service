"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export default function AuthHeader() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage("ログイン用のメールを送信しました！メールボックスをご確認ください。");
      setEmail("");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="absolute top-4 right-4 z-50">
      {user ? (
        <div className="flex items-center gap-4 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-gray-200">
          <span className="text-sm font-medium text-gray-700">
            {user.email}
          </span>
          <button 
            onClick={handleLogout}
            className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-1.5 px-3 rounded-full transition-colors"
          >
            ログアウト
          </button>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-2 rounded-full shadow-sm border border-gray-200">
          <input 
            type="email" 
            placeholder="メールアドレス" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="text-sm px-3 py-1.5 rounded-full border border-gray-300 focus:outline-none focus:border-blue-500 w-48"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-full transition-colors whitespace-nowrap"
          >
            {loading ? "送信中..." : "ログイン"}
          </button>
        </form>
      )}
      {message && <div className="absolute top-full mt-2 right-0 bg-black/80 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap">{message}</div>}
    </div>
  );
}
