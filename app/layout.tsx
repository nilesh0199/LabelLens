import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'LabelLens - Packaged Commodity Inspection Platform',
  description: 'AI-assisted regulatory inspection and statutory compliance verification platform under the Legal Metrology (Packaged Commodities) Rules, 2011.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
