import { ArrowRight } from 'lucide-react';

const personalities = [
  {
    id: 1,
    name: 'Creator',
    color: 'bg-[#ffbbf0]',
    icon: '🎨',
    textColor: 'text-[#19464d]',
  },
  {
    id: 2,
    name: 'Inspirer',
    color: 'bg-[#f9dbf2]',
    icon: '✨',
    textColor: 'text-[#19464d]',
  },
  {
    id: 3,
    name: 'Companion',
    color: 'bg-[#f5dd42]',
    icon: '🤗',
    textColor: 'text-[#19464d]',
  },
  {
    id: 4,
    name: 'Connector',
    color: 'bg-[#ffa4eb]',
    icon: '🤝',
    textColor: 'text-white',
  },
];

export default function HeroSection() {
  return (
    <section className="py-16 md:py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[#ffbbf0]/20 px-4 py-2 rounded-full">
              <span className="text-[#19464d] font-semibold text-sm">
                Free Assessment
              </span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl lg:text-5xl font-bold text-black leading-tight">
                Discover Your
                <br />
                Play Personality
              </h1>
              <p className="text-base text-gray-700 leading-relaxed max-w-md">
                Find out how you play best. Take our 2-minute assessment and
                discover your unique play style — no sign up required.
              </p>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="bg-[#f52e81] hover:bg-[#e91e75] text-white px-8 py-4 rounded-lg font-bold flex items-center justify-center gap-2 transition transform hover:scale-105 text-lg w-fit">
                Take the Quiz
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Features */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3">
                <span className="text-[#19464d] text-xl font-bold">●</span>
                <span className="text-gray-700 font-medium">
                  No account needed
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#19464d] text-xl font-bold">●</span>
                <span className="text-gray-700 font-medium">
                  Only 2 minutes
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[#19464d] text-xl font-bold">●</span>
                <span className="text-gray-700 font-medium">
                  Instant results
                </span>
              </div>
            </div>
          </div>

          {/* Right Column - Personality Grid */}
          <div className="relative h-full min-h-[500px] flex items-center justify-center">
            {/* Center circle with question mark */}
            <div className="absolute w-28 h-28 bg-white border-4 border-gray-300 rounded-full flex items-center justify-center shadow-lg z-10">
              <span className="text-5xl text-gray-800 font-bold">?</span>
            </div>

            {/* Personality Cards arranged in grid */}
            <div className="grid grid-cols-2 gap-8 w-full">
              {/* Top-left - Creator */}
              <div
                className={`${personalities[0].color} rounded-3xl p-8 flex flex-col items-center justify-center ${personalities[0].textColor} shadow-lg transform hover:scale-105 transition h-48`}
              >
                <span className="text-6xl mb-3">{personalities[0].icon}</span>
                <h3 className="font-bold text-lg text-center">
                  {personalities[0].name}
                </h3>
                <p className="text-xs opacity-80 text-center pt-1">
                  Unique Strengths
                </p>
              </div>

              {/* Top-right - Inspirer */}
              <div
                className={`${personalities[1].color} rounded-3xl p-8 flex flex-col items-center justify-center ${personalities[1].textColor} shadow-lg transform hover:scale-105 transition h-48`}
              >
                <span className="text-6xl mb-3">{personalities[1].icon}</span>
                <h3 className="font-bold text-lg text-center">
                  {personalities[1].name}
                </h3>
                <p className="text-xs opacity-80 text-center pt-1">
                  Unique Strengths
                </p>
              </div>

              {/* Bottom-left - Companion */}
              <div
                className={`${personalities[2].color} rounded-3xl p-8 flex flex-col items-center justify-center ${personalities[2].textColor} shadow-lg transform hover:scale-105 transition h-48`}
              >
                <span className="text-6xl mb-3">{personalities[2].icon}</span>
                <h3 className="font-bold text-lg text-center">
                  {personalities[2].name}
                </h3>
                <p className="text-xs opacity-80 text-center pt-1">
                  Unique Strengths
                </p>
              </div>

              {/* Bottom-right - Connector */}
              <div
                className={`${personalities[3].color} rounded-3xl p-8 flex flex-col items-center justify-center ${personalities[3].textColor} shadow-lg transform hover:scale-105 transition h-48`}
              >
                <span className="text-6xl mb-3">{personalities[3].icon}</span>
                <h3 className="font-bold text-lg text-center">
                  {personalities[3].name}
                </h3>
                <p className="text-xs opacity-80 text-center pt-1">
                  Unique Strengths
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
