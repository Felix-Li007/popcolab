const events = [
  {
    id: 1,
    number: "1",
    title: "Corporate Teams",
    description: "Build stronger workplace cultures",
    image: "👥",
    bgColor: "bg-[#f9dbd2]",
  },
  {
    id: 2,
    number: "2",
    title: "Public Groups",
    description: "For teams, groups and curious members.",
    image: "🎭",
    bgColor: "bg-[#f9dbf2]",
  },
  {
    id: 3,
    number: "3",
    title: "Upcoming Events",
    description: "See what's coming up in the community",
    image: "🎉",
    bgColor: "bg-[#fcf9e4]",
  },
];

export default function EventsSection() {
  return (
    <section className="py-16 md:py-24 bg-[#f5f5f5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-[#19464d]">
            Want to see more?
          </h2>
          <a href="#" className="text-[#f52e81] font-bold hover:text-[#e91e75] transition text-lg">
            Find more Events →
          </a>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {events.map((event) => (
            <div key={event.id} className="relative">
              {/* Event Number */}
              <div className="absolute -left-6 -top-6 w-16 h-16 bg-[#f52e81] text-white rounded-full flex items-center justify-center font-bold text-3xl shadow-lg z-10">
                {event.number}
              </div>

              {/* Event Card */}
              <div className={`${event.bgColor} rounded-2xl p-8 h-full flex flex-col pt-12 shadow-md hover:shadow-lg transition`}>
                {/* Image Area */}
                <div className="text-6xl mb-6 h-20 flex items-center">
                  {event.image}
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-[#19464d]">
                    {event.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {event.description}
                  </p>
                </div>

                {/* Learn More Link */}
                <div className="mt-6 pt-4 border-t border-gray-300/50">
                  <a href="#" className="text-[#f52e81] font-bold hover:text-[#e91e75] transition inline-flex items-center gap-2">
                    Learn More →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
