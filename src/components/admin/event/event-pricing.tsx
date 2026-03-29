'use client';

import type { Event } from '@/types/event-type';
import styles from '@/styles/admin/events/event-form.module.css';

export type EventPricingDraft = {
  priceLevel: NonNullable<Event['event_pricing']>[number]['price_level'];
  eventPrice: string;
};

type Props = {
  pricing: EventPricingDraft[];
  onChange?: (pricing: EventPricingDraft[]) => void;
  readOnly?: boolean;
};

const PRICING_LEVELS: EventPricingDraft['priceLevel'][] = [
  'ADULT',
  'SENIOR',
  'YOUTH',
  'CHILD',
];

const PRICING_LABELS: Record<EventPricingDraft['priceLevel'], string> = {
  ADULT: 'Adult',
  SENIOR: 'Senior',
  YOUTH: 'Youth',
  CHILD: 'Child',
};

function getPricingValue(
  pricing: EventPricingDraft[],
  level: EventPricingDraft['priceLevel']
) {
  return pricing.find(item => item.priceLevel === level)?.eventPrice ?? '';
}

export default function EventPricingPanel({
  pricing,
  onChange,
  readOnly = false,
}: Readonly<Props>) {
  return (
    <div className={styles.sectionPanel}>
      <div className={styles.pricingGrid}>
        {PRICING_LEVELS.map(level => (
          <label key={level} className={styles.pricingCard}>
            <span className={styles.pricingCardLabel}>
              {PRICING_LABELS[level]}
            </span>
            <div className={styles.pricingInputWrap}>
              <span className={styles.pricingCurrency}>$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={getPricingValue(pricing, level)}
                onChange={event => {
                  if (!onChange) return;

                  const nextValue = event.target.value;
                  onChange(
                    PRICING_LEVELS.map(priceLevel => ({
                      priceLevel,
                      eventPrice:
                        priceLevel === level
                          ? nextValue
                          : getPricingValue(pricing, priceLevel),
                    }))
                  );
                }}
                placeholder="0.00"
                readOnly={readOnly}
                disabled={readOnly}
                className={`${styles.input} ${readOnly ? styles.viewField : ''} ${styles.pricingInput}`}
              />
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
