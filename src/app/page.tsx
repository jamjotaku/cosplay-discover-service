import Papa from 'papaparse';
import CosplayGallery from '@/components/CosplayGallery';

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQgV5MvOa8ZUcpQ9jL1HhYQOLS_y78ZoOnQI96iru-5JZVTrRc5Li4hBkN7igEyB5p73EuaaEfLC38G/pub?gid=0&single=true&output=csv";

export default async function Home() {
  // GoogleスプレッドシートのCSVをサーバーサイドで取得（60秒キャッシュ）
  const res = await fetch(CSV_URL, { next: { revalidate: 60 } });
  const csvText = await res.text();
  
  // CSVテキストをJSONオブジェクトにパース
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const data = parsed.data as any[];

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 text-center pt-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Cosplay Discovery
          </h1>
          <p className="text-gray-600 text-lg">スプレッドシートと連動するコスプレギャラリー</p>
        </header>

        {/* 検索機能付きのクライアントコンポーネントを呼び出し */}
        <CosplayGallery data={data} />
      </div>
    </main>
  );
}
