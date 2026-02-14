"use client";
import React, { useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link'; 

const CompoundCarousel = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const scrollRef = useRef(null);

  const compounds = [
    {
      id: 1,
      name: "Riverton - ريفرتون",
      location: "التجمع الخامس - القاهرة الجديدة",
      types: "ستوديو ، شقق ، تاون هاوس",
      price: "5,800,000",
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop"
    },
    {
      id: 2,
      name: "O West - أوراسكوم",
      location: "طريق الواحات - 6 أكتوبر",
      types: "ستوديو ، شقق ، فيلا",
      price: "7,029,000",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop"
    }
  ];

  const scroll = (direction) => {
    const { current } = scrollRef;
    const scrollAmount = 350; 
    if (direction === 'left') {
      current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    } else {
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="compounds-section" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="section-header">
        <h2 className="section-title">{isRTL ? 'دليل الشراء' : 'Buying Guide'}</h2>
        {/* Main "Show More" Button - Redirects to main list */}
        <Link href="/compounds" className="modern-show-more">
          <span>{isRTL ? 'أظهر المزيد' : 'Show More'}</span>
          <svg 
            width="18" height="18" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </Link>
      </div>

      <div className="carousel-wrapper">
        <button className="arrow-btn prev" onClick={() => scroll('left')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        
        <div className="scroll-container" ref={scrollRef}>
          {/* SEPARATE CARD: Discover More - Redirects to /compounds */}
          <div className="discover-card">
            <Link href="/" className="discover-link">
              <span>{isRTL ? 'اكتشف أكثر' : 'Discover More'}</span>
              <svg 
                width="20" height="20" viewBox="0 0 24 24" fill="none" 
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: isRTL ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </Link>
          </div>

          {/* HOUSE CARDS: Redirect to /contact or individual page */}
          {compounds.map((item) => (
            <div key={item.id} className="compound-card clickable-card">
              <Link href="/" className="card-inner-link">
                <div className="card-image" style={{ backgroundImage: `url(${item.image})` }}></div>
                <div className="card-info">
                  <h3 className="compound-name">{item.name}</h3>
                  <div className="info-row">
                    <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span>{item.location}</span>
                  </div>
                  <div className="info-row">
                    <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                    <span>{item.types}</span>
                  </div>
                  <div className="card-price">
                    {isRTL ? `تبدأ من ${item.price}` : `Starts from ${item.price}`}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        <button className="arrow-btn next" onClick={() => scroll('right')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>
    </section>
  );
};

export default CompoundCarousel;