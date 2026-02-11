import "./globals.css";
import Navbar from "../components/Navbar";
// import Footer from "../components/Footer";
import type { ReactNode } from "react";
// import { LanguageProvider } from '@/context/LanguageContext'; // Import the provider

// export const metadata = {
//   title: "Real Estate AI",
//   description: "AI powered real estate platform",
// };

type Props = {
  children: ReactNode;
};

// export default function RootLayout({ children }: Props) {
//   return (
//     <html lang="en">
//       <body>
//         <Navbar />
//         {children}
//         <Footer />
//       </body>
//     </html>
//   );
// }
// app/layout.jsx
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
