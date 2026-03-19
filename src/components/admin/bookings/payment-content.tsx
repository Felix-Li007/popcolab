import Link from 'next/link';
import { Prisma } from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import PaymentRow, {
  type AdminPaymentListItem,
} from '@/components/admin/bookings/payment-row';
import styles from '@/styles/admin/bookings/payment-content.module.css';

type SearchParamsInput = Record<string, string | string[] | undefined>;

type Props = {
  searchParams?: Promise<SearchParamsInput> | SearchParamsInput;
};

function getFirstValue(
  value: string | string[] | undefined
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseDateFilter(value: string | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseDateRangeEnd(value: string | undefined): Date | null {
  const parsed = parseDateFilter(value);
  if (!parsed) return null;

  const nextDate = new Date(parsed);
  nextDate.setDate(nextDate.getDate() + 1);
  return nextDate;
}

function buildPaymentWhere(params: {
  search: string;
  status: string;
  createdFrom: string;
  createdTo: string;
}): Prisma.PaymentWhereInput {
  const clauses: Prisma.PaymentWhereInput[] = [];
  const trimmedSearch = params.search.trim();

  if (trimmedSearch) {
    clauses.push({
      OR: [
        {
          customer_email: {
            contains: trimmedSearch,
            mode: 'insensitive',
          },
        },
        {
          payment_status: {
            contains: trimmedSearch,
            mode: 'insensitive',
          },
        },
        {
          payment_method: {
            contains: trimmedSearch,
            mode: 'insensitive',
          },
        },
        {
          customer_id: {
            contains: trimmedSearch,
            mode: 'insensitive',
          },
        },
        {
          orders: {
            some: {
              order_status: {
                contains: trimmedSearch,
                mode: 'insensitive',
              },
            },
          },
        },
      ],
    });
  }

  if (params.status) {
    clauses.push({
      payment_status: params.status,
    });
  }

  const createdFromDate = parseDateFilter(params.createdFrom);
  const createdToDate = parseDateRangeEnd(params.createdTo);
  if (createdFromDate || createdToDate) {
    clauses.push({
      created_at: {
        ...(createdFromDate ? { gte: createdFromDate } : {}),
        ...(createdToDate ? { lt: createdToDate } : {}),
      },
    });
  }

  if (clauses.length === 0) {
    return {};
  }

  return {
    AND: clauses,
  };
}

export default async function PaymentContent({ searchParams }: Props) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const search = getFirstValue(resolvedSearchParams.q)?.trim() ?? '';
  const status = getFirstValue(resolvedSearchParams.status)?.trim() ?? '';
  const createdFrom =
    getFirstValue(resolvedSearchParams.created_from)?.trim() ?? '';
  const createdTo =
    getFirstValue(resolvedSearchParams.created_to)?.trim() ?? '';
  const query = { search, status, createdFrom, createdTo };
  const where = buildPaymentWhere(query);

  const payments = (await prisma.payment.findMany({
    where,
    include: {
      orders: {
        orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
        include: {
          order_items: {
            orderBy: [{ schedule_date: 'asc' }, { id: 'asc' }],
            include: {
              experience: {
                select: {
                  experience_title: true,
                  provider: {
                    select: {
                      provider_label: true,
                    },
                  },
                },
              },
            },
          },
          user: {
            select: {
              email: true,
              user_name: true,
            },
          },
        },
      },
    },
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    take: 20,
  })) as AdminPaymentListItem[];

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>
              Payments ({payments.length})
            </span>
          </div>

          <div className={styles.toolbar}>
            <form
              action="/admin/bookings/payments"
              method="GET"
              className={styles.filterForm}
            >
              <div className={styles.searchWrap}>
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={styles.searchIcon}
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
                <input
                  type="search"
                  name="q"
                  defaultValue={query.search}
                  placeholder="Search by customer email, payment status, or method..."
                  className={styles.searchInput}
                />
              </div>

              <select
                name="status"
                defaultValue={query.status}
                className={styles.filterControl}
              >
                <option value="">All Payment Status</option>
                <option value="pending">Pending</option>
                <option value="succeeded">Succeeded</option>
                <option value="processing">Processing</option>
                <option value="requires_payment">Requires Payment</option>
                <option value="failed">Failed</option>
                <option value="canceled">Canceled</option>
              </select>

              <input
                type="date"
                name="created_from"
                defaultValue={query.createdFrom}
                className={styles.filterControl}
              />

              <input
                type="date"
                name="created_to"
                defaultValue={query.createdTo}
                className={styles.filterControl}
              />

              <button type="submit" className={styles.filterButton}>
                Search
              </button>

              <Link
                href="/admin/bookings/payments"
                className={styles.clearLink}
              >
                Clear Filters
              </Link>
            </form>
          </div>

          <div className={styles.tableHeader}>
            <div>Payment</div>
            <div>Customer</div>
            <div>Status</div>
            <div>Method</div>
            <div>Total</div>
            <div>Order</div>
          </div>

          <div className={styles.listArea}>
            {payments.length === 0 ? (
              <div className={styles.emptyState}>No payments yet.</div>
            ) : (
              payments.map(payment => (
                <PaymentRow key={payment.id} payment={payment} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
