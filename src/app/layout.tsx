import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { StoreProvider } from '@/lib/store';
import { Navbar } from '@/components/ui/Navbar';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap'
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'WF47 ZYNG | Apprentice Intake & Analytics Portal',
  description: 'WF47 ZYNG - Enterprise Apprentice Intake, DBT Subsidy Management & Payroll Reconciliation Portal. Powered by Workforce2047 Partners LLP.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen flex flex-col bg-[#fafafa] text-zinc-900 font-sans antialiased selection:bg-black selection:text-white">
        <StoreProvider>
          <Navbar />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
        </StoreProvider>
      </body>
    </html>
  );
}
