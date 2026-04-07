import Link from 'next/link';
import { Prisma } from '@/libs/prisma/client';
import { prisma } from '@/libs/prisma-client';
import OrderRow, {
  type AdminOrderListItem,
} from '@/components/admin/bookings/order-row';
import styles from '@/styles/admin/bookings/order-content.module.css';

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

function buildOrderWhere(params: {
  search: string;
  status: string;
  createdFrom: string;
  createdTo: string;
}): Prisma.OrderWhereInput {
  const clauses: Prisma.OrderWhereInput[] = [];
  const trimmedSearch = params.search.trim();

  if (trimmedSearch) {
    clauses.push({
      OR: [
        {
          order_status: {
            contains: trimmedSearch,
            mode: 'insensitive',
          },
        },
        {
          payment: {
            is: {
              customer_email: {
                contains: trimmedSearch,
                mode: 'insensitive',
              },
            },
          },
        },
        {
          user: {
            email: {
              contains: trimmedSearch,
              mode: 'insensitive',
            },
          },
        },
        {
          order_items: {
            some: {
              OR: [
                {
                  experience: {
                    experience_title: {
                      contains: trimmedSearch,
                      mode: 'insensitive',
                    },
                  },
                },
                {
                  event: {
                    eventTitle: {
                      contains: trimmedSearch,
                      mode: 'insensitive',
                    },
                  },
                },
              ],
            },
          },
        },
      ],
    });
  }

  if (params.status) {
    clauses.push({
      order_status: params.status,
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

export default async function OrderContent({ searchParams }: Readonly<Props>) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const search = getFirstValue(resolvedSearchParams.q)?.trim() ?? '';
  const status = getFirstValue(resolvedSearchParams.status)?.trim() ?? '';
  const createdFrom =
    getFirstValue(resolvedSearchParams.created_from)?.trim() ?? '';
  const createdTo =
    getFirstValue(resolvedSearchParams.created_to)?.trim() ?? '';
  const query = { search, status, createdFrom, createdTo };
  const where = buildOrderWhere(query);

  const orders = (await prisma.order.findMany({
    where,
    include: {
      user: {
        select: {
          email: true,
          user_name: true,
        },
      },
      proposal: {
        select: {
          id: true,
        },
      },
      payment: {
        select: {
          id: true,
          payment_status: true,
          payment_method: true,
          customer_email: true,
          grand_total: true,
        },
      },
      order_items: {
        orderBy: [
          { schedule_date: 'asc' },
          { start_time: 'asc' },
          { end_time: 'asc' },
          { id: 'asc' },
        ],
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
          event: {
            select: {
              eventTitle: true,
              eventLocation: true,
            },
          },
        },
      },
    },
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    take: 20,
  })) as AdminOrderListItem[];

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Orders ({orders.length})</span>
          </div>

          <div className={styles.toolbar}>
            <form
              action="/admin/bookings"
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
                  placeholder="Search by experience, event, order status, or customer email..."
                  className={styles.searchInput}
                />
              </div>

              <select
                name="status"
                defaultValue={query.status}
                className={styles.filterControl}
              >
                <option value="">All Order Status</option>
                <option value="PENDING_PAYMENT">Pending Payment</option>
                <option value="PAID">Paid</option>
                <option value="PROCESSING">Processing</option>
                <option value="PAYMENT_FAILED">Payment Failed</option>
                <option value="CANCELED">Canceled</option>
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

              <Link href="/admin/bookings" className={styles.clearLink}>
                Clear Filters
              </Link>
            </form>
          </div>

          <div className={styles.tableHeader}>
            <div>Order</div>
            <div>Customer</div>
            <div>Item</div>
            <div>Schedule</div>
            <div>Status</div>
            <div>Total</div>
          </div>

          <div className={styles.listArea}>
            {orders.length === 0 ? (
              <div className={styles.emptyState}>
                No orders match the current filters.
              </div>
            ) : (
              orders.map(order => <OrderRow key={order.id} order={order} />)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
