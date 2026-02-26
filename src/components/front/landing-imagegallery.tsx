import styles from '@/styles/landing-gallery.module.css';

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
    <section className={styles['image-gallery-section']}>
      <div className={styles['image-gallery-container']}>
        {/* Section Header */}
        <div className={styles['gallery-header']}>
          <h2 className={styles['gallery-title']}>Gallery</h2>
          <p className={styles['gallery-subtitle']}>
            Explore our amazing experiences and see what Pop CoLab is all about
          </p>
        </div>

        {/* Gallery Grid */}
        <div className={styles['gallery-items-grid']}>
          {galleryItems.map(item => (
            <div key={item.id} className={styles['gallery-item']}>
              {/* Background with gradient */}
              <div className={styles['gallery-item-background']}>
                <span className={styles['gallery-item-emoji']}>
                  {item.image}
                </span>
              </div>

              {/* Overlay with title */}
              <div className={styles['gallery-item-overlay']}>
                <h3 className={styles['gallery-item-title']}>{item.title}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* View More Button */}
        <div className={styles['gallery-button-wrapper']}>
          <button className={styles['gallery-view-more-btn']}>
            View More Gallery
          </button>
        </div>
      </div>
    </section>
  );
}
