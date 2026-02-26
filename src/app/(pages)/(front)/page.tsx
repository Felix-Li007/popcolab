import EventsSection from '@/components/front/landing-events';
import CTASection from '@/components/front/landing-CTASection';
import ExperiencesCarousel from '@/components/front/landing-experiences';
import ImageGallerySection from '@/components/front/landing-imagegallery';
import PersonalitiesSection from '@/components/front/landing-personality';

export default function Home() {
  return (
    <>
      {/* <Header /> */}
      <PersonalitiesSection />
      <EventsSection />
      <ExperiencesCarousel />
      <ImageGallerySection />
      <CTASection />
    </>
  );
}
