import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SePay Demo',
  description: 'SePay Payment Gateway Integration Demo',
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

