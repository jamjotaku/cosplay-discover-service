import CosplayGallery from '@/components/CosplayGallery';

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 text-center pt-8 relative">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Cosplay Discovery
          </h1>
          <p className="text-gray-600 text-lg mb-6">データベースと連動する高速コスプレギャラリー</p>
          
          <a href="/add" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-full shadow-md transition-all transform hover:-translate-y-0.5">
            ＋ 新しいコスプレを追加する
          </a>
        </header>

        <CosplayGallery />
      </div>
    </main>
  );
}
