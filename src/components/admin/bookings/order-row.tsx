import Link from 'next/link';
import { formatCadAmount } from '@/utils/experience';
import styles from '@/styles/admin/bookings/order-content.module.css';

type DecimalLike = {
  toString(): string;
};

export type AdminOrderListItem = {
  id: number;
  order_status: string;
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
    experience_id: number;
    item_price: DecimalLike;
    schedule_date: Date;
    experience: {
      experience_title: string;
      provider: {
        provider_label: string;
      };
    };
  }>;
};

type Props = {
  order: AdminOrderListItem;
};

function formatDate(value: Date | null) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleString('en-CA');
}

function getOrderStatusClass(status: string) {
  switch (status) {
    case 'paid':
      return styles.orderStatusSuccess;
    case 'processing':
      return styles.orderStatusProcessing;
    case 'payment_failed':
    case 'canceled':
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

export default function OrderRow({ order }: Readonly<Props>) {
  const primaryItem = order.order_items[0] ?? null;
  const additionalItemCount = Math.max(0, order.order_items.length - 1);
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
          <p className={styles.mobileLabel}>Experience</p>
          {primaryItem ? (
            <>
              <p className={styles.primaryText}>
                <Link
                  href={`/admin/experiences?view=${primaryItem.experience_id}`}
                  className={styles.experienceLink}
                >
                  {primaryItem.experience.experience_title}
                </Link>
              </p>
              <p className={styles.secondaryText}>
                {primaryItem.experience.provider.provider_label}
              </p>
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
            {primaryItem ? formatDate(primaryItem.schedule_date) : 'Not set'}
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
