import PaymentContent from '@/components/admin/bookings/payment-content';

type Props = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export default async function AdminPaymentsPage({ searchParams }: Props) {
  return <PaymentContent searchParams={searchParams} />;
}
