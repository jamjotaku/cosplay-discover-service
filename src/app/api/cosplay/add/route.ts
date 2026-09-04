import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import dictionaryData from '@/data/vtuber_dictionary.json';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { member, cosplayer, image, link, unit } = data;

    if (!link || !image) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 });
    }

    const matchedChars = dictionaryData.filter((d: any) => d.name === member || (member && member.includes(d.name)));
    const tags = matchedChars.map((d: any) => d.name);
    const agency = matchedChars.length > 0 ? matchedChars[0].agency : null;
    let debut_order = null;
    if (matchedChars.length > 0) {
      debut_order = Math.min(...matchedChars.map((d: any) => dictionaryData.findIndex((x: any) => x.name === d.name)));
    }

    const { error } = await supabase.from('cosplay_items').insert({
      member: member || '',
      cosplayer: cosplayer || '',
      image_url: image,
      tweet_url: link,
      unit: unit || '',
      tags,
      agency,
      debut_order,
      status: 'active'
    });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'このツイートは既に登録されています' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    const errorMessage = err.message || JSON.stringify(err) || '不明なエラー';
    return NextResponse.json({ error: 'サーバーエラーが発生しました: ' + errorMessage }, { status: 500 });
  }
}
