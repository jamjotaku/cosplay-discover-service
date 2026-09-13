import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // RPC関数を使用して、1000件の取得制限を回避し、一意のリストを直接取得
    const { data, error } = await supabase.rpc('get_unique_cosplayers');

    if (error) throw error;

    const uniqueCosplayers = data.map((d: any) => d.cosplayer);

    return NextResponse.json({ cosplayers: uniqueCosplayers });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
