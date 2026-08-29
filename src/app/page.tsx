import Papa from 'papaparse';

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQgV5MvOa8ZUcpQ9jL1HhYQOLS_y78ZoOnQI96iru-5JZVTrRc5Li4hBkN7igEyB5p73EuaaEfLC38G/pub?gid=0&single=true&output=csv";

type CosplayData = {
  member: string;
  cosplayer: string;
  image: string;
  link: string;
  [key: string]: any;
};

export default async function Home() {
  // GoogleスプレッドシートのCSVをサーバーサイドで取得（60秒キャッシュ）
  const res = await fetch(CSV_URL, { next: { revalidate: 60 } });
  const csvText = await res.text();
  
  // CSVテキストをJSONオブジェクトにパース
  const parsed = Papa.parse<CosplayData>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const data = parsed.data;

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 text-center pt-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Cosplay Discovery
          </h1>
          <p className="text-gray-600 text-lg">スプレッドシートと連動するコスプレギャラリー</p>
        </header>

        {/* ギャラリーのグリッド表示 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {data.map((item, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="relative aspect-[3/4] bg-gray-100">
                {item.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.image}
                    alt={`${item.cosplayer} - ${item.member}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-bold text-xl text-gray-900 line-clamp-1 mb-1">{item.member}</h3>
                <p className="text-sm text-gray-500 mb-5 line-clamp-1">Cosplayer: <span className="text-gray-700 font-medium">{item.cosplayer}</span></p>
                {item.link ? (
                  <a 
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center bg-black hover:bg-gray-800 text-white font-medium py-2.5 px-4 rounded-xl transition-colors text-sm"
                  >
                    X(Twitter)で見る
                  </a>
                ) : (
                  <button disabled className="block w-full text-center bg-gray-100 text-gray-400 font-medium py-2.5 px-4 rounded-xl text-sm">
                    リンクなし
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {data.length === 0 && (
          <div className="text-center text-gray-500 py-20">
            データが見つかりませんでした。スプレッドシートを確認してください。
          </div>
        )}
      </div>
    </main>
  );
}
