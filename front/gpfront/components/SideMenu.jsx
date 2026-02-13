// components/SideMenu.jsx
"use client";
import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

const SideMenu = ({ isOpen, onClose }) => {
  const { t, language, toggleLanguage } = useLanguage();

  const slideClass = isOpen ? 'open' : '';

  return (
    <>
      {/* Dark Overlay */}
      <div 
        className={`menu-overlay ${isOpen ? 'visible' : ''}`} 
        onClick={onClose}
      ></div>

      {/* Sliding Menu Panel */}
      <div className={`side-menu-panel ${slideClass}`}>
        
        {/* Top: Close Button */}
        <div className="side-menu-header">
           {/* FIX: Changed <button> to <div> to ensure click works with animation */}
           <div 
              role="button"
              onClick={(e) => {
                e.stopPropagation(); // Prevents click issues
                onClose();
              }} 
              className="nav-cta-btn" 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                cursor: 'pointer', 
                color: 'white',
                padding: '4px',
                userSelect: 'none' // Prevents text highlighting
              }}
           >
              {/* 1. Icon First */}
              <div className="nav-icon-circle" style={{ pointerEvents: 'none' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </div>

              {/* 2. Text Second */}
              <span className="nav-text-label" style={{ pointerEvents: 'none' }}>{t.menuItems.close}</span>
           </div>
        </div>

        {/* Center: Navigation Links */}
        <div className="side-menu-links">
          <Link href="/" className="side-link" onClick={onClose}>{t.menuItems.home}</Link>
          <Link href="/about" className="side-link" onClick={onClose}>{t.menuItems.about}</Link>
          <Link href="/contact" className="side-link" onClick={onClose}>{t.menuItems.projects}</Link>
          <Link href="/contact" className="side-link" onClick={onClose}>{t.menuItems.contact}</Link>
          
          {/* Language Switcher */}
          <div className="side-link lang-switch" onClick={() => { toggleLanguage(); onClose(); }}>
            {t.menuItems.language}
          </div>
        </div>

        {/* Bottom: Phone Number (Clickable) */}
        <div className="side-menu-footer">
           <Link 
             href="/contact" 
             className="footer-phone" 
             onClick={onClose} 
             style={{ textDecoration: 'none', cursor: 'pointer' }}
           >
              <span className="phone-number">920019691</span>
              <span className="phone-label">{t.menuItems.unifiedNumber}</span>
              <div className="footer-icon-box">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              </div>
           </Link>
        </div>

      </div>
    </>
  );
};

export default SideMenu;