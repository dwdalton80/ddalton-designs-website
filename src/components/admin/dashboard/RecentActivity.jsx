import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function RecentActivity({ requests, invoices }) {
  const activities = [
    ...requests.slice(0, 4).map(r => ({
      id: r.id,
      label: r.name,
      sub: `Contact request — ${r.project_type || 'General'}`,
      time: r.created_date,
      badge: r.status === 'new' ? 'new' : r.status,
      badgeColor: r.status === 'new' ? 'bg-accent/10 text-accent' : 'bg-secondary text-muted-foreground',
      href: '/admin/requests',
    })),
    ...invoices.slice(0, 3).map(i => ({
      id: i.id,
      label: i.client_name,
      sub: `Invoice — $${(i.total || 0).toLocaleString()}`,
      time: i.created_date,
      badge: i.status,
      badgeColor: i.status === 'paid' ? 'bg-green-50 text-green-600' : i.status === 'partial' ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600',
      href: '/admin/invoices',
    })),
  ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 6);

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display font-bold text-xl">Recent Activity</h2>
      </div>
      <div className="space-y-3">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        ) : activities.map((a, i) => (
          <Link key={`${a.id}-${i}`} to={a.href} className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:opacity-70 transition-opacity">
            <div className="min-w-0 flex-1 mr-3">
              <div className="font-medium text-sm truncate">{a.label}</div>
              <div className="text-xs text-muted-foreground">{a.sub}</div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${a.badgeColor}`}>{a.badge}</span>
              <span className="text-xs text-muted-foreground hidden sm:block">{a.time ? formatDistanceToNow(new Date(a.time), { addSuffix: true }) : ''}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}