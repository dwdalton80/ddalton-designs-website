import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock, Zap, CheckCircle2 } from 'lucide-react';

const statusIcons = {
  todo: Clock,
  in_progress: Zap,
  done: CheckCircle2,
};

const priorityDot = {
  high: 'bg-red-500',
  medium: 'bg-yellow-400',
  low: 'bg-green-400',
};

export default function TaskProgress({ tasks }) {
  const active = tasks.filter(t => t.status !== 'done');
  const done = tasks.filter(t => t.status === 'done').length;
  const pct = tasks.length > 0 ? Math.round((done / tasks.length) * 100) : 0;

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-bold text-xl">Active Tasks</h2>
        <Link to="/admin/tasks" className="text-xs text-accent font-semibold flex items-center gap-1 hover:underline">
          View All <ArrowUpRight size={12} />
        </Link>
      </div>

      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>{done} of {tasks.length} tasks complete</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="space-y-2.5">
        {active.length === 0 ? (
          <p className="text-sm text-muted-foreground">All tasks complete!</p>
        ) : active.slice(0, 5).map(t => {
          const Icon = statusIcons[t.status] || Clock;
          return (
            <div key={t.id} className="flex items-center gap-3 py-1.5 border-b border-border last:border-0">
              <Icon size={14} className={t.status === 'in_progress' ? 'text-accent' : 'text-muted-foreground'} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{t.title}</div>
                <div className="text-xs text-muted-foreground">{t.project_name || 'No project'}</div>
              </div>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDot[t.priority] || 'bg-muted'}`} title={t.priority} />
            </div>
          );
        })}
      </div>
    </div>
  );
}