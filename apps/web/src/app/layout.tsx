import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShiftFlow — Slim personeelsbeheer, zonder zorgen',
  description:
    'Modern platform voor personeelsplanning en werkroosters. Sneller, gebruiksvriendelijker en slimmer dan klassieke planningssoftware.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
