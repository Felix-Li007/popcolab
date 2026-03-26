import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Nunito } from 'next/font/google';
import { resolveRoleBranding } from '@/constants/role-branding';
import { getCompanyAction } from '@/actions/user-actions';
import { getCurrentAuthContext } from '@/services/clerk-service';
import './globals.css';
import { ThemeProvider } from 'next-themes';
import { ThemedClerk } from './theme';

const museo = localFont({
  src: [
    {
      path: '../../public/fonts/museo/Museo-700.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-museo',
});

const nunito = Nunito({
  variable: '--font-nunito',
  subsets: ['latin'],
  weight: ['400', '600', '700'],
});

export const metadata: Metadata = {
  title: 'PopColab-Rediscover the Power of Play',
  description: 'Rediscover the Power of Play.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [authContext, companyInfo] = await Promise.all([
    getCurrentAuthContext(),
    getCompanyAction(),
  ]);
  const branding = resolveRoleBranding(authContext.role, companyInfo);

  return (
    <html lang="en" data-role={branding.dataRole} suppressHydrationWarning>
      <body className={`${museo.variable} ${nunito.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ThemedClerk>{children}</ThemedClerk>
        </ThemeProvider>
      </body>
    </html>
  );
}
