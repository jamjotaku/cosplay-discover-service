import CosplayGallery from '@/components/CosplayGallery';
import Link from 'next/link';

export default async function CosplayerPage({ params }: { params: Promise<{ name: string }> }) {
  const resolvedParams = await params;
  const decodedName = decodeURIComponent(resolvedParams.name);

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 pt-4">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200 transition-colors font-bold">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              ギャラリーへ戻る
            </Link>
          </div>

          <div className="text-center">
            <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight break-words">
              <span className="text-blue-600">{decodedName}</span> さんのコスプレ
            </h1>
            <p className="text-gray-500 text-lg mb-6">過去の作品を一覧で確認できます</p>
          </div>
        </header>

        <CosplayGallery fixedCosplayer={decodedName} />
      </div>
    </main>
  );
}
