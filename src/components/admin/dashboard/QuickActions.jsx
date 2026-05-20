import { Link } from 'react-router-dom';
import { UserPlus, FilePlus, ReceiptText, CheckSquare, Image } from 'lucide-react';

const actions = [
  { label: 'New Client', icon: UserPlus, href: '/admin/clients' },
  { label: 'New Estimate', icon: FilePlus, href: '/admin/estimates' },
  { label: 'New Invoice', icon: ReceiptText, href: '/admin/invoices' },
  { label: 'Add Task', icon: CheckSquare, href: '/admin/tasks' },
  { label: 'Add Portfolio', icon: Image, href: '/admin/portfolio' },
];

export default function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(({ label, icon: Icon, href }) => (
        <Link
          key={label}
          to={href}
          className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-semibold hover:border-accent hover:text-accent transition-all"
        >
          <Icon size={14} />
          {label}
        </Link>
      ))}
    </div>
  );
}