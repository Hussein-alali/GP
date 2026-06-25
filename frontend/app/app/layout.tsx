import type { ReactNode } from "react";
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext';
import Footer from '@/components/Footer';
import ChatBot from '@/components/ChatBot';

type Props = {
  children: ReactNode;
};

export default function RootLayout({ children }: Props) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>
        <LanguageProvider>
          {children}
          <ChatBot />
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
