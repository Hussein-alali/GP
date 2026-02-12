// components/Footer.jsx
"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext'; // Import translation hook
import { 
  FaFacebookF, 
  FaLinkedinIn, 
  FaTwitter, 
  FaSnapchatGhost, 
  FaTiktok, 
  FaInstagram, 
  FaYoutube 
} from 'react-icons/fa';

const Footer = () => {
  const pathname = usePathname();
  const { t, language } = useLanguage(); // Get language and translations

  // Hide Footer on Login, Register, and Contact pages
  if (pathname === '/login' || pathname === '/register' || pathname === '/contact') {
    return null;
  }

  // Styles object (Moved inside component to access 'language' state for direction)
  const styles = {
    footerContainer: {
      backgroundColor: '#f5f5f5',
      padding: '20px 40px',
      borderTop: '1px solid #e0e0e0',
      fontFamily: 'Arial, sans-serif',
      direction: language === 'ar' ? 'rtl' : 'ltr', // Dynamic Direction!
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
      color: '#003366',
      order: 1, // Keep your order
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
      display: 'flex',
      alignItems: 'center'
    },
    divider: {
      margin: '0 5px'
    }
  };

  return (
    <footer style={styles.footerContainer}>
      <div style={styles.contentWrapper}>
        
        {/* Section 1: Social Icons (Your specific links) */}
        <div style={styles.socialIcons}>
          <a href="https://www.facebook.com/?locale=ar_AR" style={styles.icon} aria-label="Facebook" target="_blank" rel="noopener noreferrer"><FaFacebookF /></a>
          <a href="https://www.linkedin.com/login/ar" style={styles.icon} aria-label="LinkedIn" target="_blank" rel="noopener noreferrer"><FaLinkedinIn /></a>
          <a href="https://x.com/?lang=ar" style={styles.icon} aria-label="X" target="_blank" rel="noopener noreferrer"><FaTwitter /></a>
          <a href="https://www.snapchat.com/" style={styles.icon} aria-label="Snapchat" target="_blank" rel="noopener noreferrer"><FaSnapchatGhost /></a>
          <a href="https://www.tiktok.com/login" style={styles.icon} aria-label="TikTok" target="_blank" rel="noopener noreferrer"><FaTiktok /></a>
          <a href="https://www.instagram.com/" style={styles.icon} aria-label="Instagram" target="_blank" rel="noopener noreferrer"><FaInstagram /></a>
          <a href="https://www.youtube.com/" style={styles.icon} aria-label="YouTube" target="_blank" rel="noopener noreferrer"><FaYoutube /></a>
        </div>

        {/* Section 2: Legal Links (Translated Text) */}
        <div style={styles.legalLinks}>
          <Link href="/terms" style={styles.link}>{t.footer.terms}</Link>
          <span style={styles.divider}>-</span>
          <Link href="/privacy" style={styles.link}>{t.footer.privacy}</Link>
        </div>

        {/* Section 3: Copyright (Translated Text) */}
        <div style={styles.copyright}>
          <span>{t.footer.rights}</span>
        </div>

      </div>
    </footer>
  );
};

export default Footer;