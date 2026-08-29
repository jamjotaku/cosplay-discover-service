import { NextResponse } from 'next/server';
import { getTweet } from 'react-tweet/api';
import { GoogleGenerativeAI } from '@google/generative-ai';

// APIキーは後ほど環境変数（.env.local）に設定します
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    // URLからツイートIDを抽出 (例: https://x.com/user/status/123456789)
    const tweetIdMatch = url.match(/\/status\/(\d+)/);
    if (!tweetIdMatch) {
      return NextResponse.json({ error: '無効なX(Twitter)のURLです。' }, { status: 400 });
    }
    const tweetId = tweetIdMatch[1];

    // react-tweetの内部APIを使ってツイート情報を取得（X APIキー不要の魔法のメソッド！）
    const tweet = await getTweet(tweetId);
    if (!tweet) {
      return NextResponse.json({ error: 'ツイートの取得に失敗しました。非公開アカウントか削除された可能性があります。' }, { status: 404 });
    }

    const text = tweet.text;
    const images = tweet.photos?.map(p => p.url) || [];

    let character = '不明';
    let series = '不明';

    // AIによるキャラ名推測処理
    if (process.env.GEMINI_API_KEY) {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        以下のコスプレに関するツイート本文から、「作品名（Series）」と「キャラクター名（Character）」を推測して抽出してください。
        JSON形式でのみ出力してください。キーは "series" と "character" です。
        もし分からない場合は "不明" としてください。
        
        ツイート本文:
        "${text}"
      `;

      try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        // JSON部分を抽出
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          character = parsed.character || '不明';
          series = parsed.series || '不明';
        }
      } catch (aiError) {
        console.error("AI Analysis error:", aiError);
      }
    } else {
      // APIキーが設定されていない場合のモック処理（画面の動きを確認するため）
      character = '初音ミク (AI推測テスト)';
      series = 'VOCALOID (AI推測テスト)';
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
