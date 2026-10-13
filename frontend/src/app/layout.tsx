import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agricultural Farm Management System | Redis DA3',
  description: 'Enterprise farm operations, crop cycle, and ledger platform backed by Redis in-memory database.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[#f8faf7] text-[#1c2720]">
        {children}
      </body>
    </html>
  );
}
