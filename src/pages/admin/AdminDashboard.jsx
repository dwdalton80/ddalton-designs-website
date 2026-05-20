import { useState, useEffect } from 'react';
import { Inbox, FileText, Receipt, CheckSquare, TrendingUp, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatCard from '@/components/admin/dashboard/StatCard';
import RevenueChart from '@/components/admin/dashboard/RevenueChart';
import QuickActions from '@/components/admin/dashboard/QuickActions';
import RecentActivity from '@/components/admin/dashboard/RecentActivity';
import TaskProgress from '@/components/admin/dashboard/TaskProgress';
import InvoiceSummary from '@/components/admin/dashboard/InvoiceSummary';

export default function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.ClientRequest.list('-created_date', 20),
      base44.entities.Estimate.list('-created_date', 50),
      base44.entities.Invoice.list('-created_date', 50),
      base44.entities.Task.list('-created_date', 50),
      base44.entities.Client.list('-created_date', 50),
    ]).then(([r, e, i, t, c]) => {
      setRequests(r);
      setEstimates(e);
      setInvoices(i);
      setTasks(t);
      setClients(c);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const newRequests = requests.filter(r => r.status === 'new').length;
  const pendingEstimates = estimates.filter(e => ['draft', 'sent'].includes(e.status)).length;
  const unpaidInvoices = invoices.filter(i => i.status !== 'paid').length;
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0);
  const activeTasks = tasks.filter(t => t.status !== 'done').length;

  const stats = [
    { icon: Inbox, label: 'New Requests', value: newRequests, href: '/admin/requests', colorClass: 'bg-blue-50 text-blue-600' },
    { icon: Users, label: 'Total Clients', value: clients.length, href: '/admin/clients', colorClass: 'bg-purple-50 text-purple-600' },
    { icon: FileText, label: 'Pending Estimates', value: pendingEstimates, href: '/admin/estimates', colorClass: 'bg-yellow-50 text-yellow-600' },
    { icon: Receipt, label: 'Unpaid Invoices', value: unpaidInvoices, href: '/admin/invoices', colorClass: 'bg-red-50 text-red-600' },
    { icon: TrendingUp, label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, href: '/admin/invoices', colorClass: 'bg-green-50 text-green-600' },
    { icon: CheckSquare, label: 'Active Tasks', value: activeTasks, href: '/admin/tasks', colorClass: 'bg-orange-50 text-orange-600' },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-3xl">{greeting}, Derek.</h1>
          <p className="text-muted-foreground mt-1 text-sm">Here's what's happening with your business today.</p>
        </div>
        <QuickActions />
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map(s => <StatCard key={s.label} {...s} loading={loading} />)}
      </div>

      {/* Revenue Chart */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="mb-4">
          <h2 className="font-display font-bold text-xl">Revenue (Last 6 Months)</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Paid invoices only</p>
        </div>
        <RevenueChart invoices={invoices} />
      </div>

      {/* Bottom Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RecentActivity requests={requests} invoices={invoices} />
        <TaskProgress tasks={tasks} />
        <InvoiceSummary invoices={invoices} />
      </div>
    </div>
  );
}