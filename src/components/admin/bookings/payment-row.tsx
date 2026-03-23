import Link from 'next/link';
import { formatCadAmount } from '@/utils/experience';
import styles from '@/styles/admin/bookings/payment-content.module.css';

type DecimalLike = {
  toString(): string;
};

export type AdminPaymentListItem = {
  id: number;
  order_amount: DecimalLike | null;
  grand_total: DecimalLike | null;
  gst_rate: number | null;
  pst_rate: number | null;
  hst_rate: number | null;
  gst_amount: DecimalLike | null;
  hst_amount: DecimalLike | null;
  payment_method: string;
  customer_id: string;
  customer_email: string;
  payment_status: string;
  created_at: Date;
  updated_at: Date;
  orders: Array<{
    id: number;
    order_status: string;
    created_at: Date;
    expired_at: Date | null;
    user: {
      email: string;
      user_name: string | null;
    };
    order_items: Array<{
      id: number;
      experience_id: number;
      schedule_date: Date;
      experience: {
        experience_title: string;
        provider: {
          provider_label: string;
        };
      };
    }>;
  }>;
};

type Props = {
  payment: AdminPaymentListItem;
};

function formatDate(value: Date | null) {
  if (!value) return 'Not set';
  return new Date(value).toLocaleString('en-CA');
}

function toNumberOrNull(value: DecimalLike | null) {
  if (!value) {
    return null;
  }

  return Number(value.toString());
}

function getPaymentStatusClass(status: string) {
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

function getOrderStatusClass(status: string | null | undefined) {
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

function getLinkedOrdersLabel(orderCount: number) {
  if (orderCount === 1) {
    return '1 linked order';
  }

  return `${orderCount} linked orders`;
}

function getMoreItemsLabel(itemCount: number) {
  if (itemCount === 1) {
    return '+ 1 more item';
  }

  return `+ ${itemCount} more items`;
}

function getMoreOrdersLabel(orderCount: number) {
  if (orderCount === 1) {
    return '+ 1 more linked order';
  }

  return `+ ${orderCount} more linked orders`;
}

function PaymentTotals({ payment }: Readonly<Props>) {
  return (
    <>
      <p className={styles.primaryText}>
        {formatCadAmount(toNumberOrNull(payment.grand_total))}
      </p>
      <p className={styles.secondaryText}>
        Order Amount {formatCadAmount(toNumberOrNull(payment.order_amount))}
      </p>
      <p className={styles.secondarySmall}>
        GST{' '}
        {payment.gst_amount
          ? formatCadAmount(Number(payment.gst_amount.toString()))
          : 'Not set'}
        {' · '}
        HST{' '}
        {payment.hst_amount
          ? formatCadAmount(Number(payment.hst_amount.toString()))
          : 'Not set'}
      </p>
    </>
  );
}

function PaymentOrderSummary({
  primaryOrder,
  primaryItem,
  additionalItemCount,
  additionalOrderCount,
}: Readonly<{
  primaryOrder: AdminPaymentListItem['orders'][number] | null;
  primaryItem:
    | AdminPaymentListItem['orders'][number]['order_items'][number]
    | null;
  additionalItemCount: number;
  additionalOrderCount: number;
}>) {
  if (!primaryOrder) {
    return <p className={styles.secondaryText}>No linked order</p>;
  }

  return (
    <>
      <p className={styles.primaryText}>
        <Link href="/admin/bookings" className={styles.orderLink}>
          #{primaryOrder.id}
        </Link>
      </p>
      <p className={styles.secondaryText}>{primaryOrder.user.email}</p>
      {primaryItem ? (
        <>
          <p className={styles.secondaryText}>
            <Link
              href={`/admin/experiences?view=${primaryItem.experience_id}`}
              className={styles.orderLink}
            >
              {primaryItem.experience.experience_title}
            </Link>
          </p>
          <p className={styles.secondarySmall}>
            {primaryItem.experience.provider.provider_label}
            {' · '}
            {formatDate(primaryItem.schedule_date)}
          </p>
          {additionalItemCount > 0 ? (
            <p className={styles.secondarySmall}>
              {getMoreItemsLabel(additionalItemCount)}
            </p>
          ) : null}
        </>
      ) : null}
      {additionalOrderCount > 0 ? (
        <p className={styles.secondarySmall}>
          {getMoreOrdersLabel(additionalOrderCount)}
        </p>
      ) : null}
    </>
  );
}

export default function PaymentRow({ payment }: Readonly<Props>) {
  const primaryOrder = payment.orders[0] ?? null;
  const primaryItem = primaryOrder?.order_items[0] ?? null;
  const additionalOrderCount = Math.max(0, payment.orders.length - 1);
  const additionalItemCount = Math.max(
    0,
    (primaryOrder?.order_items.length ?? 0) - 1
  );

  return (
    <section className={styles.row}>
      <div className={styles.rowGrid}>
        <div>
          <p className={styles.mobileLabel}>Payment</p>
          <p className={styles.primaryText}>#{payment.id}</p>
          <p className={styles.secondarySmall}>
            {formatDate(payment.created_at)}
          </p>
        </div>

        <div>
          <p className={styles.mobileLabel}>Customer</p>
          <p className={styles.primaryText}>{payment.customer_email}</p>
          <p className={styles.secondaryText}>
            {primaryOrder?.user.user_name ||
              primaryOrder?.user.email ||
              'No linked order'}
          </p>
          <p className={styles.secondarySmall}>
            Customer ID {payment.customer_id}
          </p>
        </div>

        <div>
          <p className={styles.mobileLabel}>Status</p>
          <div className={styles.badges}>
            <span
              className={`${styles.badge} ${getPaymentStatusClass(payment.payment_status)}`}
            >
              {payment.payment_status}
            </span>
            <span
              className={`${styles.badge} ${getOrderStatusClass(primaryOrder?.order_status)}`}
            >
              {primaryOrder?.order_status ?? 'No order'}
            </span>
          </div>
          <p className={styles.secondarySmall}>
            {getLinkedOrdersLabel(payment.orders.length)}
          </p>
        </div>

        <div>
          <p className={styles.mobileLabel}>Method</p>
          <p className={styles.primaryText}>{payment.payment_method}</p>
          <p className={styles.secondaryText}>
            GST {payment.gst_rate ?? 'N/A'} · PST {payment.pst_rate ?? 'N/A'} ·
            HST {payment.hst_rate ?? 'N/A'}
          </p>
        </div>

        <div>
          <p className={styles.mobileLabel}>Total</p>
          <PaymentTotals payment={payment} />
        </div>

        <div>
          <p className={styles.mobileLabel}>Order</p>
          <PaymentOrderSummary
            primaryOrder={primaryOrder}
            primaryItem={primaryItem}
            additionalItemCount={additionalItemCount}
            additionalOrderCount={additionalOrderCount}
          />
        </div>
      </div>

      <div className={styles.metaRow}>
        <span className={styles.metaLabel}>Meta:</span>
        Created {formatDate(payment.created_at)}
        {' · '}
        Updated {formatDate(payment.updated_at)}
        {' · '}
        Order Created{' '}
        {primaryOrder ? formatDate(primaryOrder.created_at) : 'Not set'}
        {' · '}
        Order Expires{' '}
        {primaryOrder ? formatDate(primaryOrder.expired_at) : 'Not set'}
      </div>
    </section>
  );
}
