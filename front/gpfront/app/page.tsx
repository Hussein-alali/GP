// app/page.tsx
import Hero from '@/components/Hero';
import AboutSection from '@/components/AboutSection'; // Import the new component

export default function Home() {
  return (
    <main>
      <Hero />
      <AboutSection /> {/* The new section is added here */}
      {/* Other sections like PropertiesList will go below here */}
    </main>
  );
}