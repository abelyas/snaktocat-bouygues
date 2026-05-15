import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Snaktocat — GitHub × Bouygues Telecom Workshop',
  description: 'Play Snaktocat at the GitHub × Bouygues Telecom Workshop and compete for the top of the leaderboard!',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0d1117] text-white antialiased min-h-screen overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
