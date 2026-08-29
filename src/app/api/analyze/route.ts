import { NextResponse } from 'next/server';
import { getTweet } from 'react-tweet/api';
import Papa from 'papaparse';

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQgV5MvOa8ZUcpQ9jL1HhYQOLS_y78ZoOnQI96iru-5JZVTrRc5Li4hBkN7igEyB5p73EuaaEfLC38G/pub?gid=0&single=true&output=csv";

// 辞書データをオンメモリでキャッシュ（毎回5000件取得すると遅いため）
let cachedDictionary: string[] = [];
let lastFetchTime = 0;

async function getCharacterDictionary() {
  const now = Date.now();
  // 1時間（3600000ms）ごとにキャッシュを更新
  if (cachedDictionary.length > 0 && now - lastFetchTime < 3600000) {
    return cachedDictionary;
  }

  try {
    const res = await fetch(CSV_URL, { next: { revalidate: 3600 } });
    const csvText = await res.text();
    const parsed = Papa.parse<{ member: string }>(csvText, {
      header: true,
      skipEmptyLines: true,
    });
    
    const characters = new Set<string>();
    parsed.data.forEach(row => {
      // キャラクター名（member列）を抽出。※ゴミデータや短すぎる文字は省く
      if (row.member && row.member.trim().length > 1) {
        characters.add(row.member.trim());
      }
    });

    // 誤爆を防ぐため、文字数が「長い」ものから順番にマッチングさせる（例：「初音ミク」→「ミク」の順）
    cachedDictionary = Array.from(characters).sort((a, b) => b.length - a.length);
    lastFetchTime = now;
    return cachedDictionary;
  } catch (error) {
    console.error("CSV Fetch Error:", error);
    return cachedDictionary;
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    // URLからツイートIDを抽出
    const tweetIdMatch = url.match(/\/status\/(\d+)/);
    if (!tweetIdMatch) {
      return NextResponse.json({ error: '無効なX(Twitter)のURLです。' }, { status: 400 });
    }
    const tweetId = tweetIdMatch[1];

    // react-tweetの内部APIを使ってツイート情報を取得
    const tweet = await getTweet(tweetId);
    if (!tweet) {
      return NextResponse.json({ error: 'ツイートの取得に失敗しました。非公開アカウントか削除された可能性があります。' }, { status: 404 });
    }

    const text = tweet.text;
    const images = tweet.photos?.map(p => p.url) || [];

    let character = '不明';
    let series = '不明';

    // --- 【辞書マッチング機能】 ---
    const dictionary = await getCharacterDictionary();
    // スペースや記号、大文字小文字の違いを吸収するために正規化
    const normalizedText = text.toLowerCase().replace(/[\s\n_　]/g, ""); 

    for (const charName of dictionary) {
      const normalizedCharName = charName.toLowerCase().replace(/[\s\n_　]/g, "");
      
      // ツイート本文内に、辞書のキャラクター名が含まれているかチェック
      if (normalizedCharName.length >= 2 && normalizedText.includes(normalizedCharName)) {
        character = charName;
        series = "データベース登録キャラクター"; // 現在のCSVに作品名列がないため固定
        break; // 最初にマッチした（一番長い）単語を採用して終了
      }
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
        character
      }
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'サーバーエラーが発生しました。' }, { status: 500 });
  }
}
