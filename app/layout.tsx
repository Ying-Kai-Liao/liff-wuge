import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import LiffProvider from './components/LiffProvider';
import Navigation from './components/Navigation';

import { CartProvider } from './hooks/useCart';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "環球 eSIM 服務",
  description: "為您的旅行提供最佳連線體驗",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className={`${inter.variable} font-sans antialiased`}>
        <LiffProvider>
          <CartProvider>
            <Navigation />
            <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
              {children}
            </main>
          </CartProvider>
        </LiffProvider>
      </body>
    </html>
  );
}
