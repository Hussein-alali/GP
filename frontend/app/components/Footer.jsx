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
          {[
            { href: "https://www.facebook.com/?locale=ar_AR", label: "Facebook", Icon: FaFacebookF },
            { href: "https://www.linkedin.com/login/ar",       label: "LinkedIn",  Icon: FaLinkedinIn },
            { href: "https://x.com/?lang=ar",                  label: "X",         Icon: FaTwitter },
            { href: "https://www.snapchat.com/",               label: "Snapchat",  Icon: FaSnapchatGhost },
            { href: "https://www.tiktok.com/login",            label: "TikTok",    Icon: FaTiktok },
            { href: "https://www.instagram.com/",              label: "Instagram", Icon: FaInstagram },
            { href: "https://www.youtube.com/",                label: "YouTube",   Icon: FaYoutube },
          ].map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              aria-label={label}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...styles.icon, cursor: 'pointer', transition: 'color 0.2s ease, opacity 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#0284c7'; e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#003366'; e.currentTarget.style.opacity = '1'; }}
            >
              <Icon />
            </a>
          ))}
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