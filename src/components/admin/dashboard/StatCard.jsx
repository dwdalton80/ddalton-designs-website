import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';

export default function StatCard({ icon: Icon, label, value, href, colorClass, trend, loading }) {
  return (
    <Link to={href} className="bg-card rounded-2xl border border-border p-5 hover:border-accent transition-all group flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorClass}`}>
          <Icon size={17} />
        </div>
        {trend != null && (
          <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
            <TrendingUp size={11} />
            {trend}%
          </div>
        )}
      </div>
      <div>
        <div className="font-display font-black text-2xl">{loading ? '—' : value}</div>
        <div className="text-xs text-muted-foreground mt-0.5 font-medium">{label}</div>
      </div>
    </Link>
  );
}