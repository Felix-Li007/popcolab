const galleryItems = [
  {
    id: 1,
    title: 'Creative Spaces',
    image: '🏢',
  },
  {
    id: 2,
    title: 'Team Collaboration',
    image: '👥',
  },
  {
    id: 3,
    title: 'Innovation Hub',
    image: '💡',
  },
  {
    id: 4,
    title: 'Play & Learn',
    image: '🎓',
  },
  {
    id: 5,
    title: 'Community',
    image: '🤝',
  },
  {
    id: 6,
    title: 'Creative Expression',
    image: '🎨',
  },
];

export default function ImageGallerySection() {
  return (
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-[#19464d]">
            Gallery
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Explore our amazing experiences and see what Pop CoLab is all about
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {galleryItems.map(item => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 h-64 cursor-pointer"
            >
              {/* Background with gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#f9dbf2] to-[#ff8de6] group-hover:from-[#ffa4eb] group-hover:to-[#f52e81] transition-all duration-300 flex items-center justify-center">
                <span className="text-8xl group-hover:scale-110 transition-transform duration-300">
                  {item.image}
                </span>
              </div>

              {/* Overlay with title */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end p-6">
                <h3 className="text-white font-bold text-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {item.title}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* View More Button */}
        <div className="text-center mt-12">
          <button className="bg-[#f52e81] hover:bg-[#e91e75] text-white px-8 py-3 rounded-lg font-bold transition transform hover:scale-105">
            View More Gallery
          </button>
        </div>
      </div>
    </section>
  );
}
