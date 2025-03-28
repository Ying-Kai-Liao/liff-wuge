import './globals.css';
import type { Metadata } from 'next';
import { Klee_One } from 'next/font/google';
import LiffProvider from './components/LiffProvider';
import Navigation from './components/Navigation';

import { CartProvider } from './hooks/useCart';

const kleeOne = Klee_One({
  weight: ['400', '600'],
  subsets: ['latin'],
  variable: '--font-klee-one',
});

export const metadata: Metadata = {
  title: "吳哥舖全球上網卡",
  description: "為您的旅行提供最佳上網體驗",
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-TW">
      <body className={`${kleeOne.variable} font-klee-one antialiased`}>
        <LiffProvider>
          <CartProvider>
            <Navigation />
            <main className="min-h-screen bg-gray-50">
              {children}
            </main>
          </CartProvider>
        </LiffProvider>
      </body>
    </html>
  );
}
