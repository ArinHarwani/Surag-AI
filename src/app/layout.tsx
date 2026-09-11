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
  title: 'CIIP — Collaborative Investigative Intelligence Platform | PS #16',
  description:
    'From Fragmented Signals to an Explainable Intelligence Picture. Shared real-time investigative intelligence platform for Jodhpur and Kota Police forces.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
        <InvestigationProvider>{children}</InvestigationProvider>
      </body>
    </html>
  );
}
