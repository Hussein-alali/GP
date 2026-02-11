// "use client";

// import React, { useState, useEffect } from 'react';
// import Navbar from './Navbar';

// const Hero = () => {
//   const [currentSlide, setCurrentSlide] = useState(0);

//   const slides = [
//     {
//       id: 1,
//       image: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop",
//       tag: "بيبان",
//       title: "فنادق ومنتجعات راقية",
//       subtitle: "إمتلك سجل المجموعة بكوكبة من الفنادق والمنتجعات السياحية والتي تعد بمثابة نقاط جذب فى مصر والشرق الأوسط.",
//       buttonText: "اعرف المزيد"
//     },
//     {
//       id: 2,
//       image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2070&auto=format&fit=crop",
//       tag: "منتجع",
//       title: "إطلالات بحرية خلابة",
//       subtitle: "استمتع بأفضل الأوقات مع العائلة في أفخم المنتجعات المطلة على البحر.",
//       buttonText: "احجز الآن"
//     },
//     {
//       id: 3,
//       image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2070&auto=format&fit=crop",
//       tag: "سكن",
//       title: "فلل عصرية فاخرة",
//       subtitle: "تصاميم معمارية فريدة تجمع بين الرفاهية والطبيعة.",
//       buttonText: "شاهد الوحدات"
//     }
//   ];

//   const nextSlide = () => {
//     setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
//   };

//   const prevSlide = () => {
//     setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
//   };

//   // Optional: Auto-play slider
//   useEffect(() => {
//     const timer = setInterval(() => {
//       nextSlide();
//     }, 5000); // Change slide every 5 seconds
//     return () => clearInterval(timer);
//   }, [currentSlide]);

//   return (
//     <div className="hero-container">
//       <Navbar />

//       {slides.map((slide, index) => (
//         <div 
//           key={slide.id} 
//           style={{ 
//             opacity: index === currentSlide ? 1 : 0,
//             pointerEvents: index === currentSlide ? 'all' : 'none', // Prevent clicking hidden slides
//             transition: 'opacity 0.8s ease-in-out',
//             position: 'absolute',
//             width: '100%',
//             height: '100%',
//             top: 0,
//             left: 0
//           }}
//         >
//           <img src={slide.image} alt={slide.title} className="slide-image" />
//           <div className="overlay"></div>
          
//           <div className={`hero-content ${index === currentSlide ? 'active' : ''}`}>
//             <span className="category-tag">{slide.tag}</span>
//             <h1 className="hero-title">{slide.title}</h1>
//             <p className="hero-subtitle">{slide.subtitle}</p>
//             <button className="hero-btn">{slide.buttonText}</button>
//           </div>
//         </div>
//       ))}

//       {/* Navigation Arrows */}
//       <button className="nav-arrow nav-right-arrow" onClick={nextSlide}>
//         {/* Right Arrow (Next in RTL if you want visual direction matching arrow) */}
//         <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
//       </button>

//       <button className="nav-arrow nav-left-arrow" onClick={prevSlide}>
//          {/* Left Arrow */}
//         <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
//       </button>

//       <div className="scroll-indicator"></div>
//     </div>
//   );
// };

// export default Hero;
// components/Hero.jsx
"use client";
import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { useLanguage } from '@/context/LanguageContext'; // Import Hook

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { t } = useLanguage(); // Get translations

  // Get the slides based on current language
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
      image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=2070&auto=format&fit=crop",
      ...t.hero.slides[2]
    }
  ];

  // ... (Rest of your carousel logic: useEffect, nextSlide, prevSlide etc.) ...
  // Keep the rest of the component exactly the same, just ensure you use 
  // the 'slides' variable we just defined above.
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="hero-container">
       {/* Background Images */}
       {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
          style={{ backgroundImage: `url(${slide.image})` }}
        >
          <div className="overlay"></div>
        </div>
      ))}

      {/* Navbar is inside Hero in your design */}
      <Navbar />

      {/* Hero Content */}
      <div className="hero-content">
         <div className="hero-tag">{slides[currentSlide].tag}</div>
         <h1 className="hero-title">{slides[currentSlide].title}</h1>
         <p className="hero-subtitle">{slides[currentSlide].subtitle}</p>
         
         <button className="hero-btn">
            {slides[currentSlide].buttonText}
         </button>

         {/* ... Dots and Arrows ... */}
      </div>
    </div>
  );
};
export default Hero;