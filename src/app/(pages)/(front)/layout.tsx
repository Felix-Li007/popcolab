import Header from '@/components/front/page-header';
import type { Metadata } from 'next';
import PageFooter from '@/components/shared/page-footer';

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
      <PageFooter />
    </>
  );
}
