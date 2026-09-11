import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { InvestigationProvider } from '@/lib/store/investigation-context';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'NEXUS Intel Fusion — Collaborative Investigative Intelligence Platform',
  description:
    'From Fragmented Signals to an Explainable Intelligence Picture. Classified Joint Operational Fusion Command for Jodhpur and Kota Police forces.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[#EFECE6] text-[#111111] flex flex-col font-mono selection:bg-[#F5C842] selection:text-black">
        <InvestigationProvider>{children}</InvestigationProvider>
      </body>
    </html>
  );
}
