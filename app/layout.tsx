import type { Metadata } from 'next';
import './globals.css';
import { ExchangeRateProvider } from '../contexts/ExchangeRateContext';
import { ToastProvider } from '../contexts/ToastContext';

export const metadata: Metadata = {
  title: 'إدارة المحمصات التجارية',
  description: 'نظام إدارة محامص متكامل',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="h-full">
      <body className="h-full min-h-screen text-emerald-50 antialiased">
        {/* خلفية المحمصة الثابتة */}
        <div className="fixed inset-0 -z-20 roastery-bg" />
        <link rel="preload" href="/roasterybg.jpg" as="image" />

        {/* طبقة تعتيم داكنة خفيفة فوق الخلفية */}
        <div className="fixed inset-0 -z-10 roastery-overlay" />

        {/* طبقة المحتوى الرئيسية */}
        <div className="relative z-0 flex min-h-screen flex-col">
          <ToastProvider>
            <ExchangeRateProvider>
              <main className="container mx-auto px-4 md:px-8 py-24 min-h-screen">
                {children}
              </main>
            </ExchangeRateProvider>
          </ToastProvider>
        </div>
      </body>
    </html>
  );
}