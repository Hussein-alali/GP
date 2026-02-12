import "./globals.css";
import Navbar from "../components/Navbar";
import type { ReactNode } from "react";


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
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
