// app/page.tsx
import Hero from '@/components/Hero';
import AboutSection from '@/components/AboutSection'; // Import the new component
import SearchBox from '@/components/SearchBox'; // Your new component
import Recommendation from '@/components/Recommendation';
export default function Home() {
  return (
    <main>
      <Hero />
      <br></br>
      <SearchBox />
      <Recommendation />
      {/* Other sections like PropertiesList go here */}
      <AboutSection /> {/* The new section is added here */}
      {/* Other sections like PropertiesList will go below here */}
      
    </main>
  );
}