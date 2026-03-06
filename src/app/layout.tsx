import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { ThemedClerk } from './theme';

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['600', '700'],
});

export const metadata: Metadata = {
  title: 'PopColab-Rediscover the Power of Play',
  description: 'Rediscover the Power of Play.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} antialiased`}>
        <ThemeProvider>
          <ThemedClerk>{children}</ThemedClerk>
        </ThemeProvider>
      </body>
    </html>
  );
}
