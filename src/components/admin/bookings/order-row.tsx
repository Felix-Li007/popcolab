import Link from 'next/link';
import type { OrderStatus } from '@/libs/prisma/client';
import { formatCadAmount } from '@/utils/experience';
import styles from '@/styles/admin/bookings/order-content.module.css';

type DecimalLike = {
  toString(): string;
};

export type AdminOrderListItem = {
  id: number;
  order_status: OrderStatus;
  created_at: Date;
  updated_at: Date;
  expired_at: Date | null;
  user: {
    email: string;
    user_name: string | null;
  };
  proposal: {
    id: number;
  } | null;
  payment: {
    id: number;
    payment_status: string;
    payment_method: string;
    customer_email: string;
    grand_total: DecimalLike | null;
  } | null;
  order_items: Array<{
    id: number;
    item_type: 'EXPERIENCE' | 'EVENT';
    experience_id: number | null;
    event_id: number | null;
    item_price: DecimalLike;
    schedule_date: Date;
    start_time: Date;
    end_time: Date;
    experience: {
      experience_title: string;
      provider: {
        provider_label: string;
      };
    } | null;
    event: {
      eventTitle: string;
      eventLocation: string;
    } | null;
  }>;
};

type Props = {
  order: AdminOrderListItem;
};

function formatDate(value: Date | null) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleDateString('en-CA');
}

function formatTime(value: Date | null) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleTimeString('en-CA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatScheduleSlot(item: {
  schedule_date: Date;
  start_time: Date;
  end_time: Date;
}) {
  return `${formatDate(item.schedule_date)} ${formatTime(item.start_time)} - ${formatTime(item.end_time)}`;
}

function getOrderStatusClass(status: OrderStatus) {
  switch (status) {
    case 'PAID':
      return styles.orderStatusSuccess;
    case 'PROCESSING':
      return styles.orderStatusProcessing;
    case 'PAYMENT_FAILED':
    case 'CANCELED':
      return styles.orderStatusError;
    default:
      return styles.orderStatusDefault;
  }
}

function getPaymentStatusClass(status: string | null | undefined) {
  switch (status) {
    case 'succeeded':
      return styles.paymentStatusSuccess;
    case 'processing':
      return styles.paymentStatusProcessing;
    case 'requires_payment':
    case 'failed':
    case 'canceled':
      return styles.paymentStatusError;
    default:
      return styles.paymentStatusDefault;
  }
}

function getPrimaryItemLabel(
  item: AdminOrderListItem['order_items'][number] | null
) {
  if (!item) return null;

  if (item.item_type === 'EVENT') {
    return item.event?.eventTitle ?? `Event #${item.event_id ?? '-'}`;
  }

  return (
    item.experience?.experience_title ??
    `Experience #${item.experience_id ?? '-'}`
  );
}

function getPrimaryItemMeta(
  item: AdminOrderListItem['order_items'][number] | null
) {
  if (!item) return null;

  if (item.item_type === 'EVENT') {
    return item.event?.eventLocation ?? 'Event';
  }

  return item.experience?.provider.provider_label ?? 'Experience';
}

function getPrimaryItemHref(
  item: AdminOrderListItem['order_items'][number] | null
) {
  if (!item) return null;

  if (item.item_type === 'EVENT' && item.event_id) {
    return `/admin/events?view=${item.event_id}`;
  }

  if (item.item_type === 'EXPERIENCE' && item.experience_id) {
    return `/admin/experiences?view=${item.experience_id}`;
  }

  return null;
}

export default function OrderRow({ order }: Readonly<Props>) {
  const primaryItem = order.order_items[0] ?? null;
  const additionalItemCount = Math.max(0, order.order_items.length - 1);
  const primaryItemHref = getPrimaryItemHref(primaryItem);
  const primaryItemLabel = getPrimaryItemLabel(primaryItem);
  const primaryItemMeta = getPrimaryItemMeta(primaryItem);
  let totalAmount = null;

  if (order.payment?.grand_total) {
    totalAmount = Number(order.payment.grand_total.toString());
  } else if (primaryItem) {
    totalAmount = Number(primaryItem.item_price.toString());
  }

  return (
    <section className={styles.row}>
      <div className={styles.rowGrid}>
        <div>
          <p className={styles.mobileLabel}>Order</p>
          <p className={styles.primaryText}>#{order.id}</p>
          <p className={styles.secondarySmall}>
            {formatDate(order.created_at)}
          </p>
        </div>

        <div>
          <p className={styles.mobileLabel}>Customer</p>
          <p className={styles.primaryText}>
            {order.user.user_name || order.user.email}
          </p>
          <p className={styles.secondaryText}>{order.user.email}</p>
        </div>

        <div>
          <p className={styles.mobileLabel}>Item</p>
          {primaryItem ? (
            <>
              <p className={styles.primaryText}>
                {primaryItemHref && primaryItemLabel ? (
                  <Link
                    href={primaryItemHref}
                    className={styles.experienceLink}
                  >
                    {primaryItemLabel}
                  </Link>
                ) : (
                  (primaryItemLabel ?? 'Untitled item')
                )}
              </p>
              <p className={styles.secondaryText}>{primaryItemMeta}</p>
              {additionalItemCount > 0 ? (
                <p className={styles.secondarySmall}>
                  + {additionalItemCount} more item
                  {additionalItemCount === 1 ? '' : 's'}
                </p>
              ) : null}
            </>
          ) : (
            <p className={styles.secondaryText}>No order items</p>
          )}
        </div>

        <div>
          <p className={styles.mobileLabel}>Schedule</p>
          <p className={styles.primaryText}>
            {primaryItem ? formatScheduleSlot(primaryItem) : 'Not set'}
          </p>
          <p className={styles.secondaryText}>
            Expires {formatDate(order.expired_at)}
          </p>
        </div>

        <div>
          <p className={styles.mobileLabel}>Status</p>
          <div className={styles.badges}>
            <span
              className={`${styles.badge} ${getOrderStatusClass(order.order_status)}`}
            >
              {order.order_status}
            </span>
            <span
              className={`${styles.badge} ${getPaymentStatusClass(order.payment?.payment_status)}`}
            >
              {order.payment?.payment_status ?? 'Not linked'}
            </span>
          </div>
        </div>

        <div>
          <p className={styles.mobileLabel}>Total</p>
          <p className={styles.primaryText}>{formatCadAmount(totalAmount)}</p>
          <p className={styles.secondaryText}>
            {order.payment?.payment_method ?? 'No payment method'}
          </p>
        </div>
      </div>

      <div className={styles.metaRow}>
        <span className={styles.metaLabel}>Meta:</span>
        Proposal {order.proposal ? `#${order.proposal.id}` : 'Direct checkout'}
        {' · '}
        Payment {order.payment ? `#${order.payment.id}` : 'Not linked'}
        {' · '}
        Payment Email {order.payment?.customer_email ?? 'Not set'}
        {' · '}
        Updated {formatDate(order.updated_at)}
      </div>
    </section>
  );
}
