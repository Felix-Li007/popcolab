"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const experiences = [
  {
    id: 1,
    image: "https://tse1.mm.bing.net/th/id/OIP.JBlFLG5dUdwSdqw9yeo_8gHaLH?pid=ImgDet&w=178&h=267&c=7&dpr=1.5&o=7&rm=3", 
    title: "Zero-proof Cocktail Experience",
    subtitle:
      "Stir Up Creativity: Non-Alcoholic Cocktail Workshops Using Premium Spirits and Products from Solar Market!",
    description:
      "Welcome to the Pop CoLab Zero-Proof Cocktail Experience – a hands-on, alcohol-free tasting that blends inclusivity, wellness, and creativity. Discover innovative products from Solar Market, then craft your own signature beverage or sample a recipe co-created by Pop CoLab and Solar Market.",
  },
  {
    id: 2,
    image: "https://tse4.mm.bing.net/th/id/OIP.cMDMeLnayv4BkvlV7gGbagHaD4?rs=1&pid=ImgDetMain&o=7&rm=3",
    title: "Team Building Workshop",
    subtitle: "Strengthen Your Team Bond Through Creative Play",
    description:
      "Experience our innovative team building workshop designed to enhance communication, boost creativity, and foster stronger workplace connections through interactive play experiences.",
  },
  {
    id: 3,
    image: "https://th.bing.com/th/id/OIP.ufV2lSjMJvLAyTUhK7t5hwHaEO?w=305&h=180&c=7&r=0&o=7&dpr=1.5&pid=1.7&rm=3",
    title: "Creative Workshop",
    subtitle: "Unlock Your Creative Potential",
    description:
      "Join us for an immersive creative session that blends art, play, and personal discovery to help you unlock your unique creative talents.",
  },
];

export default function ExperiencesCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const total = experiences.length;

  const goToPrevious = () =>
    setCurrentIndex((prev) => (prev === 0 ? total - 1 : prev - 1));
  const goToNext = () =>
    setCurrentIndex((prev) => (prev === total - 1 ? 0 : prev + 1));

  const current = experiences[currentIndex];

  return (
    <section className="py-16 md:py-24 bg-[#f5e6de] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Label */}
        <p className="text-center text-[#19464d] font-semibold text-sm uppercase tracking-wide mb-8">
          Most Played Experiences
        </p>

        {/* Carousel Container */}
        <div className="relative flex flex-col md:flex-row items-center md:items-start justify-between gap-8 md:gap-12">
          {/* Left Arrow */}
          <button
            onClick={goToPrevious}
            className="flex-shrink-0 p-2 rounded-full hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#f52e81] transition mb-4 md:mb-0"
            aria-label="Previous experience"
          >
            <ChevronLeft className="w-8 h-8 text-[#19464d]" />
          </button>

          {/* Image */}
          <div className="flex-shrink-0 w-full md:w-1/2">
            <img
              src={current.image}
              alt={current.title}
              className="w-full h-64 md:h-80 object-cover rounded-lg shadow-lg"
            />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-6 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold text-[#19464d] leading-tight mb-2">
              {current.title}
            </h2>
            <p className="text-sm text-[#6390a4] font-semibold">{current.subtitle}</p>
            <p className="text-gray-700 leading-relaxed">{current.description}</p>

            <button className="border-2 border-[#19464d] text-[#19464d] hover:bg-[#19464d] hover:text-white px-6 py-2 rounded-lg font-semibold transition">
              Learn More
            </button>
          </div>

          {/* Right Arrow */}
          <button
            onClick={goToNext}
            className="flex-shrink-0 p-2 rounded-full hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-[#f52e81] transition mt-4 md:mt-0"
            aria-label="Next experience"
          >
            <ChevronRight className="w-8 h-8 text-[#19464d]" />
          </button>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-12">
          {experiences.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to experience ${idx + 1}`}
              aria-current={idx === currentIndex ? "true" : undefined}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex ? "bg-[#f52e81] w-8" : "bg-[#19464d] w-2"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}