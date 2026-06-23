// components/Hero.jsx
"use client";
import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { useLanguage } from '@/context/LanguageContext'; // Import Hook
import Link from 'next/link'; 

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = useLanguage(); // Get translations

  // 1. Get the slides based on current language
  const slides = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop",
      ...t.hero.slides[0] // Spread the translated text
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop",
      ...t.hero.slides[1]
    },
    {
      id: 3,
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop",
      ...t.hero.slides[2]
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  // Auto-play slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); 
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="hero-container">
      <Navbar />

      {/* 2. Loop through slides using the reliable <img> tag structure */}
      {slides.map((slide, index) => (
        <div 
          key={slide.id} 
          style={{ 
            opacity: index === currentSlide ? 1 : 0,
            pointerEvents: index === currentSlide ? 'all' : 'none',
            transition: 'opacity 0.8s ease-in-out',
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            zIndex: -1 // Ensure images stay behind content
          }}
        >
          {/* Image */}
          <img 
            src={slide.image} 
            alt={slide.title} 
            className="slide-image" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          
          {/* Dark Overlay */}
          <div className="overlay"></div>
          
          {/* Text Content */}
    <div className={`hero-content ${index === currentSlide ? 'active' : ''}`}>
  <span className="hero-tag">{slide.tag}</span>
  <h1 className="hero-title">{slide.title}</h1>
  <p className="hero-subtitle">{slide.subtitle}</p>
</div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button className="nav-arrow nav-right-arrow" onClick={nextSlide}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
      </button>

      <button className="nav-arrow nav-left-arrow" onClick={prevSlide}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
      </button>

    </div>
  );
};

export default Hero;