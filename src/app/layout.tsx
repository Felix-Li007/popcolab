import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const poppins = Poppins({
  // This is a font designated by the client
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['600' /* semi-bold */, '700' /* bold */],
});

export const metadata: Metadata = {
  title: 'Pop CoLab Admin',
  description: 'Pop CoLab – Rediscover the Power of Play',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${poppins.variable} antialiased`}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
