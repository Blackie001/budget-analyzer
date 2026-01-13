import type { Metadata } from 'next';
import './globals.css';
import { runMigrations } from '@/lib/init';

export const metadata: Metadata = {
  title: 'Funds Management System',
  description: 'Premium Personal Finance Tracker',
};

// Run DB Init (Note: In dev this might run multiple times, ideally use a singleton pattern or check existence, but safe for SQLite IF NOT EXISTS)
runMigrations();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
