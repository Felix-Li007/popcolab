import AdminLayout from '@/components/layout/AdminLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsGrid from '@/components/dashboard/StatsGrid';
import PersonalitySection from '@/components/dashboard/PersonalitySection';
import EventsTable from '@/components/dashboard/EventsTable';
import QuickActions from '@/components/dashboard/QuickActions';
import RecentActivity from '@/components/dashboard/RecentActivity';
import QuizChart from '@/components/dashboard/QuizChart';
import AdminFooter from '@/components/Footer';

export default function Admin() {
  return (
    <AdminLayout>
      <div className="flex flex-col min-h-full">
        {/* Main content area */}
        <div className="flex flex-1 gap-0">
          {/* Left: main dashboard */}
          <div className="flex-1 min-w-0 p-4 space-y-5">
            <DashboardHeader />
            <StatsGrid />
            <PersonalitySection />
            <EventsTable />
          </div>

          {/* Right: sidebar panel */}
          <aside className="w-56 shrink-0 p-4 space-y-4 border-l border-gray-100 hidden lg:block">
            <QuickActions />
            <RecentActivity />
            <QuizChart />
          </aside>
        </div>

        {/* Footer */}
        <AdminFooter />
      </div>
    </AdminLayout>
  );
}
