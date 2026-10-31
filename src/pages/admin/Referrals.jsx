import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MoreVertical, Mail } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/** Per-row actions, shared by the phone cards and the desktop table. */
function RowMenu({ referral, onDelete }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <MoreVertical size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a href={`mailto:${referral.referrer_email}`} className="flex items-center gap-2">
            <Mail size={14} /> Email Referrer
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-red-600">
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AdminReferrals() {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [filterStatus, setFilterStatus] = useState('all');
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    loadReferrals();
  }, []);

  const loadReferrals = async () => {
    try {
      const data = await base44.entities.Referral.list('-referral_date', 100);
      setReferrals(data || []);
    } catch (error) {
      console.error('Error loading referrals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const referral = referrals.find(r => r.id === id);
      
      // Only send email if status is actually changing to a notifiable status
      if (referral && referral.status !== newStatus && ['contacted', 'converted', 'rejected'].includes(newStatus)) {
        await base44.functions.invoke('sendReferralStatusUpdate', {
          referrer_email: referral.referrer_email,
          referrer_name: referral.referrer_name,
          status: newStatus,
          referred_client_name: referral.referred_client_name
        });
      }

      await base44.entities.Referral.update(id, { status: newStatus });
      setReferrals(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handlePayoutChange = async (id, newStatus) => {
    try {
      await base44.entities.Referral.update(id, { payout_status: newStatus });
      setReferrals(prev => prev.map(r => r.id === id ? { ...r, payout_status: newStatus } : r));
    } catch (error) {
      console.error('Error updating payout:', error);
    }
  };

  const handleDelete = async () => {
    try {
      await base44.entities.Referral.delete(deleteId);
      setReferrals(prev => prev.filter(r => r.id !== deleteId));
      setDeleteId(null);
    } catch (error) {
      console.error('Error deleting referral:', error);
    }
  };

  const filteredReferrals = filterStatus === 'all' 
    ? referrals 
    : referrals.filter(r => r.status === filterStatus);

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    contacted: 'bg-blue-100 text-blue-800',
    converted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  };

  const payoutColors = {
    unpaid: 'bg-orange-100 text-orange-800',
    paid: 'bg-green-100 text-green-800'
  };

  const stats = {
    total: referrals.length,
    pending: referrals.filter(r => r.status === 'pending').length,
    converted: referrals.filter(r => r.status === 'converted').length,
    unpaid: referrals.filter(r => (r.payout_status || 'unpaid') === 'unpaid').length,
    totalPayable: referrals.filter(
      r => r.status === 'converted' && (r.payout_status || 'unpaid') !== 'paid'
    ).length * 100
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display font-black text-3xl mb-2">Referrals</h1>
        <p className="text-muted-foreground">Track and manage referrals</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total Referrals', value: stats.total },
          { label: 'Pending', value: stats.pending },
          { label: 'Converted', value: stats.converted },
          { label: 'Unpaid', value: stats.unpaid },
          { label: 'Max Payable', value: `$${stats.totalPayable}` }
        ].map((stat, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{stat.label}</div>
            <div className="font-display font-black text-2xl">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {['all', 'pending', 'contacted', 'converted', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filterStatus === status
                ? 'bg-foreground text-primary-foreground'
                : 'bg-secondary text-foreground hover:bg-secondary/80'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {filteredReferrals.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No referrals found
          </div>
        ) : (
          <>
          {/* Six columns need a horizontal scroll on a phone, which buries the
              status and payout controls. Below md each referral is a card. */}
          <div className="md:hidden divide-y divide-border">
            {filteredReferrals.map(referral => (
              <div key={referral.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{referral.referred_client_name}</div>
                    <div className="text-xs text-muted-foreground break-all">{referral.referred_client_email}</div>
                  </div>
                  <div className="shrink-0">
                    <RowMenu referral={referral} onDelete={() => setDeleteId(referral.id)} />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Referred by <span className="text-foreground font-medium">{referral.referrer_name}</span>
                  {' · '}{new Date(referral.referral_date).toLocaleDateString()}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <select
                    value={referral.status}
                    onChange={(e) => handleStatusChange(referral.id, e.target.value)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium border-0 ${statusColors[referral.status]}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="contacted">Contacted</option>
                    <option value="converted">Converted</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <select
                    value={referral.payout_status || 'unpaid'}
                    onChange={(e) => handlePayoutChange(referral.id, e.target.value)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium border-0 ${payoutColors[referral.payout_status || 'unpaid']}`}
                  >
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-secondary/50">
                <tr className="text-sm font-semibold">
                  <th className="text-left px-6 py-4">Referrer</th>
                  <th className="text-left px-6 py-4">Referred Client</th>
                  <th className="text-left px-6 py-4">Status</th>
                  <th className="text-left px-6 py-4">Payout</th>
                  <th className="text-left px-6 py-4">Date</th>
                  <th className="text-right px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReferrals.map(referral => (
                  <tr key={referral.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium">{referral.referrer_name}</div>
                      <div className="text-sm text-muted-foreground">{referral.referrer_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{referral.referred_client_name}</div>
                      <div className="text-sm text-muted-foreground">{referral.referred_client_email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={referral.status}
                        onChange={(e) => handleStatusChange(referral.id, e.target.value)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium border-0 ${statusColors[referral.status]}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="contacted">Contacted</option>
                        <option value="converted">Converted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={referral.payout_status || 'unpaid'}
                        onChange={(e) => handlePayoutChange(referral.id, e.target.value)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium border-0 ${payoutColors[referral.payout_status || 'unpaid']}`}
                      >
                        <option value="unpaid">Unpaid</option>
                        <option value="paid">Paid</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(referral.referral_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <RowMenu referral={referral} onDelete={() => setDeleteId(referral.id)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Referral</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}