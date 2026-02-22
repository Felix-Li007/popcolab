import Header from '@/components/Header';
import HeroSection from '@/components/Hero';
import EventsSection from '@/components/EventsSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';
import ExperiencesCarousel from '@/components/Experiences';
import ImageGallerySection from '@/components/ImageGallerySection';

export default function Home() {
  return (
    <>
      <Header />
      <HeroSection />
      <EventsSection />
      <ExperiencesCarousel />
      <ImageGallerySection />
      <CTASection />
      <Footer />
    </>
  );
}
