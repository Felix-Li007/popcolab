import Header from '@/components/landing-Header';
import HeroSection from '@/components/landing-Hero';
import EventsSection from '@/components/landing-EventsSection';
import CTASection from '@/components/landing-CTASection';
import Footer from '@/components/landing-Footer';
import ExperiencesCarousel from '@/components/landing-Experiences';
import ImageGallerySection from '@/components/landing-ImageGallerySection';

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
