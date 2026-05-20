import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, FileText, Receipt, CheckSquare, ArrowUpRight, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.ClientRequest.list('-created_date', 5),
      base44.entities.Estimate.list('-created_date', 50),
      base44.entities.Invoice.list('-created_date', 50),
      base44.entities.Task.list('-created_date', 50),
    ]).then(([r, e, i, t]) => {
      setRequests(r);
      setEstimates(e);
      setInvoices(i);
      setTasks(t);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const newRequests = requests.filter(r => r.status === 'new').length;
  const pendingEstimates = estimates.filter(e => ['draft', 'sent'].includes(e.status)).length;
  const unpaidInvoices = invoices.filter(i => i.status !== 'paid').length;
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0);
  const activeTasks = tasks.filter(t => t.status !== 'done').length;

  const stats = [
    { icon: Inbox, label: 'New Requests', value: newRequests, href: '/admin/requests', color: 'bg-blue-50 text-blue-600' },
    { icon: FileText, label: 'Pending Estimates', value: pendingEstimates, href: '/admin/estimates', color: 'bg-yellow-50 text-yellow-600' },
    { icon: Receipt, label: 'Unpaid Invoices', value: unpaidInvoices, href: '/admin/invoices', color: 'bg-red-50 text-red-600' },
    { icon: TrendingUp, label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, href: '/admin/invoices', color: 'bg-green-50 text-green-600' },
    { icon: CheckSquare, label: 'Active Tasks', value: activeTasks, href: '/admin/tasks', color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, Derek.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        {stats.map(({ icon: Icon, label, value, href, color }) => (
          <Link key={label} to={href} className="bg-card rounded-2xl border border-border p-5 hover:border-accent transition-all group">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={17} />
            </div>
            <div className="font-display font-black text-2xl">{loading ? '—' : value}</div>
            <div className="text-xs text-muted-foreground mt-0.5 font-medium">{label}</div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-xl">Recent Requests</h2>
            <Link to="/admin/requests" className="text-xs text-accent font-semibold flex items-center gap-1 hover:underline">
              View All <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">No requests yet.</p>
            ) : requests.slice(0, 5).map(r => (
              <Link key={r.id} to="/admin/requests" className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:opacity-70 transition-opacity">
                <div>
                  <div className="font-medium text-sm">{r.name}</div>
                  <div className="text-xs text-muted-foreground capitalize">{r.project_type || 'General'}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${r.status === 'new' ? 'bg-accent/10 text-accent' : 'bg-secondary text-muted-foreground'}`}>
                  {r.status}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Active Tasks */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-xl">Active Tasks</h2>
            <Link to="/admin/tasks" className="text-xs text-accent font-semibold flex items-center gap-1 hover:underline">
              View All <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {tasks.filter(t => t.status !== 'done').length === 0 ? (
              <p className="text-sm text-muted-foreground">No active tasks.</p>
            ) : tasks.filter(t => t.status !== 'done').slice(0, 5).map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <div className="font-medium text-sm">{t.title}</div>
                  <div className="text-xs text-muted-foreground">{t.project_name || 'No project'}</div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${t.status === 'in_progress' ? 'bg-blue-50 text-blue-600' : 'bg-secondary text-muted-foreground'}`}>
                  {t.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}