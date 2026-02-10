"use client";
import React from 'react';
import { 
  FaFacebookF, 
  FaLinkedinIn, 
  FaTwitter, 
  FaSnapchatGhost, 
  FaTiktok, 
  FaInstagram, 
  FaYoutube 
} from 'react-icons/fa'; // Install react-icons for these
import Link from 'next/link';
import { usePathname } from 'next/navigation';
const Footer = () => {
  const pathname = usePathname(); // 3. Get current path

  // 4. Hide Footer on Login and Register pages
  if (pathname === '/login' || pathname === '/register' || pathname === '/contact') {
    return null;
  }
  return (
    <footer style={styles.footerContainer}>
      <div style={styles.contentWrapper}>
        
        {/* Left Section: Social Icons */}
        <div style={styles.socialIcons}>
          <a href="https://www.facebook.com/?locale=ar_AR" style={styles.icon} aria-label="Facebook"><FaFacebookF /></a>
          <a href="https://www.linkedin.com/login/ar" style={styles.icon} aria-label="LinkedIn"><FaLinkedinIn /></a>
          <a href="https://x.com/?lang=ar" style={styles.icon} aria-label="X"><FaTwitter /></a>
          <a href="https://www.snapchat.com/" style={styles.icon} aria-label="Snapchat"><FaSnapchatGhost /></a>
          <a href="https://www.tiktok.com/login" style={styles.icon} aria-label="TikTok"><FaTiktok /></a>
          <a href="https://www.instagram.com/" style={styles.icon} aria-label="Instagram"><FaInstagram /></a>
          <a href="https://www.youtube.com/" style={styles.icon} aria-label="YouTube"><FaYoutube /></a>
        </div>

        {/* Center Section: Legal Links */}
        <div style={styles.legalLinks}>
          <a href="/terms" style={styles.link}>الشروط و الأحكام</a>
          <span style={styles.divider}>-</span>
          <a href="/privacy" style={styles.link}>سياسة الخصوصية</a>
        </div>

        {/* Right Section: Copyright */}
        <div style={styles.copyright}>
          <span>جميع الحقوق محفوظة لنا  © 2026.</span>
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