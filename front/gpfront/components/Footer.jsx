// "use client";
// import React from 'react';
// import { 
//   FaFacebookF, 
//   FaLinkedinIn, 
//   FaTwitter, 
//   FaSnapchatGhost, 
//   FaTiktok, 
//   FaInstagram, 
//   FaYoutube 
// } from 'react-icons/fa'; // Install react-icons for these
// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// const Footer = () => {
//   const pathname = usePathname(); // 3. Get current path

//   // 4. Hide Footer on Login and Register pages
//   if (pathname === '/login' || pathname === '/register' || pathname === '/contact') {
//     return null;
//   }
//   return (
//     <footer style={styles.footerContainer}>
//       <div style={styles.contentWrapper}>
        
//         {/* Left Section: Social Icons */}
//         <div style={styles.socialIcons}>
//           <a href="https://www.facebook.com/?locale=ar_AR" style={styles.icon} aria-label="Facebook"><FaFacebookF /></a>
//           <a href="https://www.linkedin.com/login/ar" style={styles.icon} aria-label="LinkedIn"><FaLinkedinIn /></a>
//           <a href="https://x.com/?lang=ar" style={styles.icon} aria-label="X"><FaTwitter /></a>
//           <a href="https://www.snapchat.com/" style={styles.icon} aria-label="Snapchat"><FaSnapchatGhost /></a>
//           <a href="https://www.tiktok.com/login" style={styles.icon} aria-label="TikTok"><FaTiktok /></a>
//           <a href="https://www.instagram.com/" style={styles.icon} aria-label="Instagram"><FaInstagram /></a>
//           <a href="https://www.youtube.com/" style={styles.icon} aria-label="YouTube"><FaYoutube /></a>
//         </div>

//         {/* Center Section: Legal Links */}
//         <div style={styles.legalLinks}>
//           <a href="/terms" style={styles.link}>الشروط و الأحكام</a>
//           <span style={styles.divider}>-</span>
//           <a href="/privacy" style={styles.link}>سياسة الخصوصية</a>
//         </div>

//         {/* Right Section: Copyright */}
//         <div style={styles.copyright}>
//           <span>جميع الحقوق محفوظة لنا  © 2026.</span>
//         </div>

//       </div>
//     </footer>
//   );
// };

// // Simple Styles
// const styles = {
//   footerContainer: {
//     backgroundColor: '#f5f5f5', // Light grey background from your image
//     padding: '20px 40px',
//     borderTop: '1px solid #e0e0e0',
//     fontFamily: 'Arial, sans-serif',
//     direction: 'rtl', // Right-to-Left for Arabic content
//   },
//   contentWrapper: {
//     display: 'flex',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     maxWidth: '1200px',
//     margin: '0 auto',
//     flexWrap: 'wrap',
//     gap: '20px'
//   },
//   socialIcons: {
//     display: 'flex',
//     gap: '15px',
//     fontSize: '18px',
//     color: '#003366', // Deep blue/navy from the icons
//     order: 1,
//   },
//   legalLinks: {
//     display: 'flex',
//     gap: '8px',
//     fontSize: '14px',
//     color: '#666',
//     order: 2,
//   },
//   copyright: {
//     fontSize: '14px',
//     color: '#666',
//     order: 3,
//   },
//   link: {
//     textDecoration: 'none',
//     color: 'inherit',
//   },
//   icon: {
//     color: 'inherit',
//     textDecoration: 'none',
//   },
//   divider: {
//     margin: '0 5px'
//   }
// };

// export default Footer;
// components/Footer.jsx
"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext'; // 1. Import Hook

const Footer = () => {
  const pathname = usePathname();
  const { t } = useLanguage(); // 2. Get content

  // Hide Footer on Login, Register, Contact pages
  if (pathname === '/login' || pathname === '/register' || pathname === '/contact') {
    return null;
  }

  return (
    <footer className="footer-section">
      <div className="footer-container">
        
        {/* Copyright Text */}
        <div className="footer-right">
          <p>{t.footer.rights}</p>
        </div>

        {/* Links (Privacy & Terms) */}
        <div className="footer-center">
          <Link href="/privacy" className="footer-link">{t.footer.privacy}</Link>
          <span className="separator"> - </span>
          <Link href="/terms" className="footer-link">{t.footer.terms}</Link>
        </div>

        {/* Social Icons (Keep these hardcoded as they don't require translation) */}
        <div className="footer-left">
          {/* YouTube */}
          <a href="#" aria-label="YouTube">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
          </a>
          {/* Instagram */}
          <a href="#" aria-label="Instagram">
             <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
          </a>
          {/* TikTok */}
          <a href="#" aria-label="TikTok">
             <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93v6.14c0 3.48-2.32 6.66-5.79 7.42-3.47.76-6.88-1.26-7.85-4.59-.97-3.32 1.04-6.64 4.38-7.53 1.06-.28 2.19-.28 3.25 0v4.22c-.67-.28-1.43-.27-2.09-.01-.73.29-1.26.96-1.32 1.74-.06.77.34 1.54 1.05 1.93.71.4 1.59.39 2.29-.02.7-.42 1.13-1.17 1.15-1.98V.02h.85z"/></svg>
          </a>
          {/* Snapchat */}
          <a href="#" aria-label="Snapchat">
             <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12.005 0C8.12 0 5.56 2.657 5.56 5.882c0 1.258.483 2.172 1.045 3.033.402.617.518.895.347 1.765-.333 1.706-2.502 2.222-2.502 4.14 0 1.488 1.616 2.17 2.396 2.404.757.228 1.27.135 1.114.735-.09.345-.373.49-.974.49-.933 0-1.76-.328-1.76-.328-.314-.132-.612.046-.684.375-.084.383.155.76.53.905 0 0 1.01.455 2.188.455 1.353 0 1.966-.583 2.368-1.144.372-.516.48-.564.877-.564.397 0 .504.048.877.564.402.56.96 1.144 2.368 1.144 1.176 0 2.187-.455 2.187-.455.374-.145.614-.522.53-.905-.072-.33-.37-.507-.684-.375 0 0-.827.328-1.76.328-.6 0-.883-.145-.973-.49-.156-.6-.357-1.488 1.113-1.716.78-.234 2.396-.916 2.396-2.404 0-1.92-2.17-2.434-2.502-4.14-.17-.87.055-1.148.347-1.765.562-.86 1.045-1.775 1.045-3.033C18.45 2.657 15.89 0 12.005 0z"/></svg>
          </a>
          {/* X (Twitter) */}
          <a href="#" aria-label="X">
             <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          </a>
          {/* LinkedIn */}
          <a href="#" aria-label="LinkedIn">
             <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          </a>
          {/* Facebook */}
          <a href="#" aria-label="Facebook">
             <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
          </a>
        </div>

      </div>
    </footer>
  );
};
// Simple Styles
const styles = {
  footerContainer: {
    backgroundColor: '#f5f5f5', // Light grey background from your image
    padding: '20px 40px',
    borderTop: '1px solid #e0e0e0',
    fontFamily: 'Arial, sans-serif',
    direction: 'rtl', // Right-to-Left for Arabic content
  },
  contentWrapper: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
    flexWrap: 'wrap',
    gap: '20px'
  },
  socialIcons: {
    display: 'flex',
    gap: '15px',
    fontSize: '18px',
    color: '#003366', // Deep blue/navy from the icons
    order: 1,
  },
  legalLinks: {
    display: 'flex',
    gap: '8px',
    fontSize: '14px',
    color: '#666',
    order: 2,
  },
  copyright: {
    fontSize: '14px',
    color: '#666',
    order: 3,
  },
  link: {
    textDecoration: 'none',
    color: 'inherit',
  },
  icon: {
    color: 'inherit',
    textDecoration: 'none',
  },
  divider: {
    margin: '0 5px'
  }
};

export default Footer;