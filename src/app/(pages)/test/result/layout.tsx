import Header from '@/components/page-Header';
import Footer from '@/components/page-Footer';

export default function ResultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-12">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
