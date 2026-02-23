import '../styles/landing-CTASection.css';

export default function CTASection() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-[#19464d] to-[#3b6b77] overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#ff8de6]/20 rounded-full -mr-48 -mt-48"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#f9dbf2]/20 rounded-full -ml-40 -mb-40"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-8">
          {/* Main Heading */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Ready to discover how you play?
          </h2>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-3xl mx-auto">
            Join thousands who have uncovered their unique play personality
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
            <button className="bg-[#f52e81] hover:bg-[#e91e75] text-white px-10 py-4 rounded-lg font-bold text-lg transition transform hover:scale-105 shadow-lg w-full sm:w-auto">
              Start Assessment Now
            </button>
            <button className="bg-white/20 hover:bg-white/30 text-white px-10 py-4 rounded-lg font-bold text-lg transition border-2 border-white w-full sm:w-auto">
              Learn More
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-8 pt-12 border-t border-white/20">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">10k+</div>
              <div className="text-white/80">Assessments Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">98%</div>
              <div className="text-white/80">Satisfaction Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">4.9⭐</div>
              <div className="text-white/80">Average Rating</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
