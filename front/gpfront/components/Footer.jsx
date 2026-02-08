import React from 'react';
import { 
  Facebook, 
  Linkedin, 
  Twitter, 
  Snapchat, 
  Tiktok, 
  Instagram, 
  Youtube 
} from 'react-icons/fa'; // Install react-icons for these

const Footer = () => {
  return (
    <footer style={styles.footerContainer}>
      <div style={styles.contentWrapper}>
        
        {/* Left Section: Social Icons */}
        <div style={styles.socialIcons}>
          <a href="#" style={styles.icon} aria-label="Facebook"><Facebook /></a>
          <a href="#" style={styles.icon} aria-label="LinkedIn"><Linkedin /></a>
          <a href="#" style={styles.icon} aria-label="X"><Twitter /></a>
          <a href="#" style={styles.icon} aria-label="Snapchat"><Snapchat /></a>
          <a href="#" style={styles.icon} aria-label="TikTok"><Tiktok /></a>
          <a href="#" style={styles.icon} aria-label="Instagram"><Instagram /></a>
          <a href="#" style={styles.icon} aria-label="YouTube"><Youtube /></a>
        </div>

        {/* Center Section: Legal Links */}
        <div style={styles.legalLinks}>
          <a href="/terms" style={styles.link}>الشروط و الأحكام</a>
          <span style={styles.divider}>-</span>
          <a href="/privacy" style={styles.link}>سياسة الخصوصية</a>
        </div>

        {/* Right Section: Copyright */}
        <div style={styles.copyright}>
          <span>جميع الحقوق محفوظة لمجموعة طلعت مصطفى – السعودية © 2026.</span>
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