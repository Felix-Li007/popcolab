import Header from '@/components/front/page-header';
import HeroSection from '@/components/front/landing-Hero';
import EventsSection from '@/components/front/landing-events';
import CTASection from '@/components/front/landing-CTASection';
import Footer from '@/components/front/page-footer';
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
