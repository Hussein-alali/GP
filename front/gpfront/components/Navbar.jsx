
"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext'; // 1. Import Hook

const Navbar = () => {
  const pathname = usePathname();
  const { t, toggleLanguage } = useLanguage(); // 2. Get translations & toggle function

  if (pathname === '/login' || pathname === '/register' || pathname === '/contact') {
    return null;
  }

  return (
    <nav className="transparent-nav">
      
      {/* Right Side (Menu) */}
      <div className="nav-section">
        <div className="nav-item">
          <span className="nav-text-label">{t.nav.menu}</span> {/* Dynamic Text */}
          <div className="nav-icon-circle">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </div>
        </div>
      </div>

      {/* Center (Logo) */}
      <Link href="/" className="logo-container" style={{ textDecoration: 'none', cursor: 'pointer',width:'100px', height:'100px' }}>
        <div className="logo-wrapper">
            <img 
          src="/RSLOGO2.png" 
          alt="Smart Estate Logo" 
          className="logo-img" style={{ width: '130%', height: '100%', objectFit: 'contain' }}
        />
        </div>
      </Link>

      {/* Left Side */}
      <div className="nav-section">
        
        {/* Language Toggle Button */}
        <div className="nav-item" onClick={toggleLanguage} style={{cursor: 'pointer'}}>
          <span className="nav-text-label">{t.nav.langBtn}</span> {/* "English" or "العربية" */}
          <div className="nav-icon-circle">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
          </div>
        </div>

        {/* Login */}
        <Link href="/login" className="nav-item" style={{textDecoration: 'none'}}>
            <span className="nav-text-label">{t.nav.login}</span>
            <div className="nav-icon-circle">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
        </Link>
        
        {/* Register Interest */}
        <Link href="/contact" className="nav-item" style={{textDecoration: 'none'}}>
            <span className="nav-text-label">{t.nav.register}</span>
            <div className="nav-icon-circle filled-blue">
               <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </div>
        </Link>

      </div>
    </nav>
  );
};

export default Navbar;