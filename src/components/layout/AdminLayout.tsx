import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function AdminLayout({
  children,
  personalitiesCount,
}: {
  children: React.ReactNode;
  personalitiesCount?: number;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar personalitiesCount={personalitiesCount} />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav personalitiesCount={personalitiesCount} />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
