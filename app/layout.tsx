import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import LiffProvider from "./components/LiffProvider";
import Navigation from "./components/Navigation";
import { InquiryProvider } from "./hooks/useInquiry";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "eSIM 目錄 - LINE Bot",
  description: "eSIM 國家與電信方案查詢服務",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LiffProvider>
          <InquiryProvider>
            <Navigation />
            <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
              {children}
            </main>
            </InquiryProvider>
          </LiffProvider>
      </body>
    </html>
  );
}
