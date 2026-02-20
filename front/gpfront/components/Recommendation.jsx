"use client";
import React, { useRef, useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link'; 
import { recommendationsAPI } from '@/services/api';

const Recommendation = () => {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const scrollRef = useRef(null);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);

        // Try to read user id from localStorage if available, otherwise fall back to 1
        let userId = 1;
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('user');
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (parsed && parsed.id) {
                userId = parsed.id;
              }
            } catch {
              // ignore parse errors and use default id
            }
          }
        }

        const data = await recommendationsAPI.getRecommendations(userId);
        setItems(data.recommended_properties || []);
      } catch (err) {
        setError(err.message || 'Failed to load recommendations.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  const scroll = (direction) => {
    const { current } = scrollRef;
    if (!current) return;

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
        <h2 className="section-title">
          {isRTL ? 'عقارات مقترحة لك' : 'Recommended Properties for You'}
        </h2>
        <Link href="/properties" className="modern-show-more">
          <span>{isRTL ? 'أظهر المزيد' : 'Show More'}</span>
          <svg 
            width="18" height="18" viewBox="0 0 24 24" fill="none" 
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </Link>
      </div>

      {loading && (
        <p style={{ padding: '0 1.5rem', fontSize: '0.95rem' }}>
          {isRTL ? 'جاري تحميل التوصيات...' : 'Loading recommendations...'}
        </p>
      )}

      {error && !loading && (
        <p style={{ padding: '0 1.5rem', color: '#c33', fontSize: '0.9rem' }}>
          {error}
        </p>
      )}

      {!loading && !error && items.length === 0 && (
        <p style={{ padding: '0 1.5rem', fontSize: '0.95rem' }}>
          {isRTL
            ? 'لا توجد توصيات حتى الآن. أضف بعض العقارات لبدء التخصيص.'
            : 'No recommendations yet. Add some properties to get personalized suggestions.'}
        </p>
      )}

      {items.length > 0 && (
        <div className="carousel-wrapper">
          <button className="arrow-btn prev" onClick={() => scroll('left')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          
          <div className="scroll-container" ref={scrollRef}>
            <div className="discover-card">
              <Link href="/properties" className="discover-link">
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

            {items.map((item, index) => {
              const price =
                typeof item.price === 'number'
                  ? item.price.toLocaleString('en-US', { maximumFractionDigits: 0 })
                  : item.price;

              const title = item.type
                ? `${item.type} - ${item.city || ''}`.trim()
                : item.city || 'Property';

              const details = [
                item.bedrooms != null ? `${item.bedrooms} BR` : null,
                item.bathrooms != null ? `${item.bathrooms} BA` : null,
                item.area != null ? `${Math.round(item.area)} m²` : null,
              ].filter(Boolean).join(' • ');

              return (
                <div key={index} className="compound-card clickable-card">
                  <Link href="/" className="card-inner-link">
                    <div
                      className="card-image"
                      style={{
                        backgroundImage:
                          'url(https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2070&auto=format&fit=crop)',
                      }}
                    ></div>
                    <div className="card-info">
                      <h3 className="compound-name">{title}</h3>
                      <div className="info-row">
                        <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        <span>{item.city || item.location || 'N/A'}</span>
                      </div>
                      {details && (
                        <div className="info-row">
                          <svg className="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                          <span>{details}</span>
                        </div>
                      )}
                      <div className="card-price">
                        {price
                          ? isRTL
                            ? `تبدأ من ${price}`
                            : `Starts from ${price}`
                          : '-'}
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>

          <button className="arrow-btn next" onClick={() => scroll('right')}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      )}
    </section>
  );
};

export default Recommendation;