import HeroSection from '@/components/front/landing-hero';
import EventsSection from '@/components/front/landing-events';
import CTASection from '@/components/front/landing-CTASection';
import ExperiencesCarousel from '@/components/front/landing-experiences';
import ImageGallerySection from '@/components/front/landing-imagegallery';

export default function Home() {
  return (
    <>
      {/* <Header /> */}
      <HeroSection />
      <EventsSection />
      <ExperiencesCarousel />
      <ImageGallerySection />
      <CTASection />
    </>
  );
}
