import '@/styles/landing-ImageGallerySection.css';

const galleryItems = [
  { id: 1, title: 'Creative Spaces', image: '🏢' },
  { id: 2, title: 'Team Collaboration', image: '👥' },
  { id: 3, title: 'Innovation Hub', image: '💡' },
  { id: 4, title: 'Play & Learn', image: '🎓' },
  { id: 5, title: 'Community', image: '🤝' },
  { id: 6, title: 'Creative Expression', image: '🎨' },
];

export default function ImageGallerySection() {
  return (
    <section className="image-gallery-section">
      <div className="image-gallery-container">
        {/* Section Header */}
        <div className="gallery-header">
          <h2 className="gallery-title">Gallery</h2>
          <p className="gallery-subtitle">
            Explore our amazing experiences and see what Pop CoLab is all about
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="gallery-items-grid">
          {galleryItems.map(item => (
            <div key={item.id} className="gallery-item">
              {/* Background with gradient */}
              <div className="gallery-item-background">
                <span className="gallery-item-emoji">{item.image}</span>
              </div>

              {/* Overlay with title */}
              <div className="gallery-item-overlay">
                <h3 className="gallery-item-title">{item.title}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* View More Button */}
        <div className="gallery-button-wrapper">
          <button className="gallery-view-more-btn">View More Gallery</button>
        </div>
      </div>
    </section>
  );
}
