import "./globals.css";
import Navbar from "../components/Navbar";
import type { ReactNode } from "react";
import ChatIcon from "@/components/ChatIcon";

type Props = {
  children: ReactNode;
};


import './globals.css';
import { LanguageProvider } from '@/context/LanguageContext'; // Import the provider
import Footer from '@/components/Footer';

export default function RootLayout({ children }: Props) {
  return (
    <html lang="ar" dir="rtl">
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
