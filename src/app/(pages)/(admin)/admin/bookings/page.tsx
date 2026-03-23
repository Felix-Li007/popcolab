import OrderContent from '@/components/admin/bookings/order-content';

type Props = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export default async function AdminBookingsPage({
  searchParams,
}: Readonly<Props>) {
  return <OrderContent searchParams={searchParams} />;
}
