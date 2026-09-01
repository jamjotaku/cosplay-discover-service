import { NextResponse } from 'next/server';
import { getTweet } from 'react-tweet/api';
import dictionaryData from '@/data/vtuber_dictionary.json';

// 文字数が「長い」ものから順にマッチングさせる（例：「兎田ぺこら」→「ぺこら」の順）
const sortedDictionary = [...dictionaryData].sort((a, b) => b.name.length - a.name.length);

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    const tweetIdMatch = url.match(/\/status\/(\d+)/);
    if (!tweetIdMatch) {
      return NextResponse.json({ error: '無効なX(Twitter)のURLです。' }, { status: 400 });
    }
    const tweetId = tweetIdMatch[1];

    const tweet = await getTweet(tweetId);
    if (!tweet) {
      return NextResponse.json({ error: 'ツイートの取得に失敗しました。非公開アカウントか削除された可能性があります。' }, { status: 404 });
    }

    const text = tweet.text;
    const images = tweet.photos?.map(p => {
      let url = p.url;
      if (url.includes('pbs.twimg.com/media/')) {
        if (url.includes('name=')) {
          url = url.replace(/name=[a-z0-9_]+/, 'name=large');
        } else {
          url += (url.includes('?') ? '&name=large' : '?name=large');
        }
      }
      return url;
    }) || [];

    let character = '不明';
    let series = '不明';
    let agency = '不明';
    let color = '#cccccc';

    const normalizedText = text.toLowerCase().replace(/[\s\n_　]/g, ""); 

    let matchedCharacters: any[] = [];

    for (const charData of sortedDictionary) {
      const normalizedCharName = charData.name.toLowerCase().replace(/[\s\n_　]/g, "");
      
      let matched = false;
      
      // 1. 名前でのマッチング
      if (normalizedCharName.length >= 2 && normalizedText.includes(normalizedCharName)) {
        matched = true;
      }
      
      // 2. ファンマークでのマッチング
      if (!matched && charData.fanmarks && charData.fanmarks.length > 0) {
        for (const fm of charData.fanmarks) {
          if (text.includes(fm)) {
            matched = true;
            break;
          }
        }
      }
      
      if (matched) {
        // すでに部分一致で含まれているキャラ（例：「ペコラ」と「兎田ぺこら」）の重複を防ぐ
        const isSubset = matchedCharacters.some(existing => existing.name.includes(charData.name));
        if (!isSubset) {
          matchedCharacters.push(charData);
        }
      }
    }

    if (matchedCharacters.length > 0) {
      // 複数見つかった場合はスラッシュで結合
      character = matchedCharacters.map(c => c.name).join('/');
      agency = matchedCharacters[0].agency; // 最初のキャラの事務所を優先
      color = matchedCharacters[0].color;
      
      if (agency === 'Hololive') series = 'ホロライブ';
      else if (agency === 'Nijisanji') series = 'にじさんじ';
      else if (agency === 'VSPO') series = 'ぶいすぽっ！';
    }

    return NextResponse.json({
      success: true,
      tweet: {
        text,
        images,
        author: tweet.user.name,
        screenName: tweet.user.screen_name,
      },
      analysis: {
        series,
        character,
        agency,
        color
      }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}
