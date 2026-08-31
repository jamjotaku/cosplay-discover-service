import Papa from 'papaparse';
import CosplayGallery from '@/components/CosplayGallery';

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRlfU_ch8RSqi8kvmeUs5savNiV6nw8R0SpQbnzocWErtnU-dUNiFyrSJNRmmbaMnojlhqXjMURWDpE/pub?gid=1691074498&single=true&output=csv";

export default async function Home() {
  // GoogleスプレッドシートのCSVをサーバーサイドで取得（60秒キャッシュ）
  const res = await fetch(CSV_URL, { next: { revalidate: 60 } });
  const csvText = await res.text();
  
  // CSVテキストをJSONオブジェクトにパース
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  // スプレッドシート上で中身を消去して「,,,」のようになった空の行を除外する
  const data = (parsed.data as any[]).filter(row => row.member && row.member.trim() !== "");

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 text-center pt-8 relative">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Cosplay Discovery
          </h1>
          <p className="text-gray-600 text-lg mb-6">スプレッドシートと連動するコスプレギャラリー</p>
          
          <a href="/add" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-full shadow-md transition-all transform hover:-translate-y-0.5">
            ＋ 新しいコスプレを追加する
          </a>
        </header>

        {/* 検索機能付きのクライアントコンポーネントを呼び出し */}
        <CosplayGallery data={data} />
      </div>
    </main>
  );
}
