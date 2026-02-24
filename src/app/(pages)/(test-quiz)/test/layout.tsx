import Header from '@/components/page-Header';
import Footer from '@/components/page-Footer';

export default function TestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1 flex items-start justify-center py-12 px-4">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
