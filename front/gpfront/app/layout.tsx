import type { ReactNode } from "react";
import ChatIcon from "@/components/ChatIcon";
import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext'; // Import the provider
import Footer from '@/components/Footer';

type Props = {
  children: ReactNode;
};

export default function RootLayout({ children }: Props) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>
        <LanguageProvider>
          {children}
          <ChatIcon />
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
