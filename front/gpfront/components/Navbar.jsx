// components/Navbar.jsx
"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import SideMenu from './SideMenu';

const Navbar = () => {
  const pathname = usePathname();
  const { t, toggleLanguage } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (pathname === '/login' || pathname === '/register' || pathname === '/contact') {
    return null;
  }

  // Simple handlers
  const handleLanguageClick = (e) => {
    e.stopPropagation();
    toggleLanguage();
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setIsMenuOpen(true);
  };

  return (
    <>
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      {/* FIX: dir="ltr" forces the layout to stay Left-to-Right.
          This prevents buttons from swapping places when language changes. */}
      <nav className="transparent-nav" dir="ltr">
        
        {/* --- LEFT SIDE: ACTIONS (Always Left) --- */}
        <div className="nav-section">
            
             {/* 1. Language Button */}
             <div 
               className="nav-item nav-cta-btn" 
               onClick={handleLanguageClick} 
               style={{cursor: 'pointer'}}
             >
                 <div className="nav-icon-circle">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                 </div>
                 <span className="nav-text-label">{t.nav.langBtn}</span>
            </div>

            {/* 2. Login */}
            <Link href="/login" className="nav-item nav-cta-btn" style={{textDecoration: 'none'}}>
                <div className="nav-icon-circle">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                </div>
                <span className="nav-text-label">{t.nav.login}</span>
            </Link>
            
            {/* 3. Register */}
            <Link href="/contact" className="nav-item nav-cta-btn" style={{textDecoration: 'none'}}>
                <div className="nav-icon-circle filled-blue">
                   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                </div>
                <span className="nav-text-label">{t.nav.register}</span>
            </Link>

        </div>

        {/* --- CENTER: LOGO --- */}
        <Link href="/" className="logo-container" style={{ textDecoration: 'none', cursor: 'pointer' }}>
            <div className="logo-wrapper">
               <img src="/RSLOGO2.png" alt="Logo" className="logo-img" />
            </div>
        </Link>

        {/* --- RIGHT SIDE: MENU BUTTON (Always Right) --- */}
        <div className="nav-section">
          <div 
            className="nav-item nav-cta-btn" 
            onClick={handleMenuClick} 
            style={{ cursor: 'pointer' }}
          >
            <div className="nav-icon-circle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </div>
            <span className="nav-text-label">{t.nav.menu}</span>
          </div>
        </div>

      </nav>
    </>
  );
};

export default Navbar;