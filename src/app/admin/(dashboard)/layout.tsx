import AdminSidebar from '@/components/layout/AdminSidebar';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="md:ml-56 p-6 pb-20 md:pb-6">
        {children}
      </main>
    </div>
  );
}
