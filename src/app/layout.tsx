import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/store';

export const metadata: Metadata = {
  title: 'Cabinet Ivoire Immo | Gestion Locative & Quittances de Loyer',
  description:
    'Application de gestion immobilière : encaissement de loyers, commission 10%, quittances de loyer officielles A4 avec QR Code et bordereaux de reversement.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-slate-100 text-slate-900">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
