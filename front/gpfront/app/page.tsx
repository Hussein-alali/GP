"use client";

import { useState } from "react";

const images = [
  "/Img1.jpg",
  "/hero2.jpg",
  "/hero3.jpg",
];

export default function HomePage() {
  const [current, setCurrent] = useState(0);

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <section
      className="hero"
      style={{ backgroundImage: `url(${images[current]})` }}
    >
      <div className="hero-overlay" />

      <div className="hero-content">
        <h1>فنادق ومنتجعات راقية</h1>
        <p>
          امتلك سجل المجموعة باكورة من الفنادق والمنتجعات السياحية
          والتي تعد بمثابة نقاط جذب في مصر والشرق الأوسط
        </p>

        <button className="hero-btn">اعرف المزيد</button>
      </div>

      <button className="arrow left" onClick={prevSlide}>
        ‹
      </button>

      <button className="arrow right" onClick={nextSlide}>
        ›
      </button>
    </section>
  );
}
