import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const revalidate = 3600; // 1時間キャッシュ

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('cosplay_items')
      .select('cosplayer');

    if (error) throw error;

    // 重複を排除してソート
    const uniqueCosplayers = Array.from(new Set(data.map(d => d.cosplayer).filter(Boolean))).sort();

    return NextResponse.json({ cosplayers: uniqueCosplayers });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
