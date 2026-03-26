'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/ui/Button';
import GalleryModel from '@/components/shared/gallery-model';
import type { DashboardExperienceCardData } from '@/types/experience-dashboard-type';
import styles from '@/styles/dashboard/experience-card.module.css';

function formatMoney(value: number | null) {
  if (value === null || Number.isNaN(value)) return 'N/A';
  return `$${value.toFixed(0)}`;
}

function splitDeliveryMethods(value: string) {
  return value
    .split(';')
    .map(item => item.trim())
    .filter(Boolean);
}

export default function ExperienceCard({
  exp,
  featured = false,
  onView,
}: {
  exp: DashboardExperienceCardData;
  featured?: boolean;
  onView?: () => void;
}) {
  const router = useRouter();
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const deliveryMethods = splitDeliveryMethods(exp.deliveryMethods);
  const galleryImages = useMemo(() => exp.images ?? [], [exp.images]);
  const priceLabel =
    exp.pricing.startingPrice !== null
      ? `${formatMoney(exp.pricing.startingPrice)}${
          exp.pricing.addingPrice !== null
            ? ` + ${formatMoney(exp.pricing.addingPrice)} add-on`
            : ''
        }`
      : 'Pricing on request';

  function openGallery() {
    if (galleryImages.length === 0) return;
    setActiveImageIndex(0);
    setIsGalleryOpen(true);
  }

  function closeGallery() {
    setIsGalleryOpen(false);
  }

  function showPreviousImage() {
    setActiveImageIndex(current =>
      current === 0 ? galleryImages.length - 1 : current - 1
    );
  }

  function showNextImage() {
    setActiveImageIndex(current =>
      current === galleryImages.length - 1 ? 0 : current + 1
    );
  }

  return (
    <article className={`${styles.root} group`}>
      <div className={styles.header}>
        <div className={styles.categoryWrap}>
          <span className={styles.categoryPill}>{exp.categoryTitle}</span>
        </div>

        <div className={styles.popBadge}>
          <p className={styles.popLabel}>POP</p>
          <p className={styles.popValue}>{exp.popularityIndex}</p>
        </div>
      </div>

      <div className={styles.titleWrap}>
        <h3 className={styles.title}>{exp.experienceTitle}</h3>
      </div>

      <div className={styles.body}>
        <button
          type="button"
          onClick={openGallery}
          disabled={galleryImages.length === 0}
          className={styles.imageButton}
        >
          {galleryImages.length > 0 ? (
            <span className="absolute right-2 top-2 z-10 inline-flex items-center rounded-full border border-gray-200 bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-600 shadow-sm backdrop-blur-sm">
              {galleryImages.length}
            </span>
          ) : null}

          {exp.imageUrl ? (
            <Image
              src={exp.imageUrl}
              alt={exp.imageAlt || exp.experienceTitle}
              fill
              className={styles.image}
              priority={featured}
            />
          ) : (
            <div className={styles.imageFallback}>
              <div className={styles.fallbackIcon}>🖼️</div>
              <div className={styles.fallbackText}>
                <p className={styles.fallbackLabel}>No image available</p>
              </div>
              <div className={styles.fallbackProviderWrap}>
                <span className={styles.fallbackProviderPill}>
                  {exp.providerType}
                </span>
              </div>
            </div>
          )}
        </button>

        <div className={styles.details}>
          <div className={styles.infoGrid}>
            <div className={styles.infoCard}>
              <p className={styles.infoLabel}>Duration</p>
              <p className={styles.infoValue}>
                {exp.durationMin}-{exp.durationMax} min
              </p>
            </div>
            <div className={styles.infoCard}>
              <p className={styles.infoLabel}>Capacity</p>
              <p className={styles.infoValue}>{exp.capacityMax}</p>
            </div>
          </div>

          <div className={styles.pricingCard}>
            <p className={styles.pricingLabel}>
              Pricing: <span className={styles.pricingValue}>{priceLabel}</span>
            </p>
          </div>

          <div className={styles.deliveryCard}>
            <div className={styles.deliveryWrap}>
              <span className={styles.deliveryLabel}>Delivery:</span>
              {deliveryMethods.length > 0 ? (
                deliveryMethods.map(method => (
                  <span key={method} className={styles.deliveryPill}>
                    {method}
                  </span>
                ))
              ) : (
                <span className={styles.deliveryPill}>
                  {exp.deliveryMethods}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <Button
          variant="ghost"
          size="sm"
          onClick={onView}
          className={styles.viewButton}
        >
          View
        </Button>
        <Button
          variant="primary"
          size="sm"
          onClick={() =>
            router.push(`/dashboard/experiences/${exp.id}/checkout`)
          }
          className={styles.bookButton}
        >
          Book Now
        </Button>
      </div>

      <GalleryModel
        isOpen={isGalleryOpen}
        onClose={closeGallery}
        title={exp.experienceTitle}
        images={galleryImages}
        activeImageIndex={activeImageIndex}
        onPrevious={showPreviousImage}
        onNext={showNextImage}
        featured={featured}
      />
    </article>
  );
}
