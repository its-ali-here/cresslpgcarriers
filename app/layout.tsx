import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CRESS LPG Carriers — Business Management',
  description: 'Fleet and business management system for CRESS LPG Carriers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Barlow:wght@400;500;600&family=Barlow+Semi+Condensed:wght@500;600&family=Roboto+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
