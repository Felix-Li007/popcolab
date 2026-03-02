import Header from '@/components/front/page-header';
import Footer from '@/components/front/page-footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PopColab Front',
  description: 'Front pages of PopColab app',
};

export default function FrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
