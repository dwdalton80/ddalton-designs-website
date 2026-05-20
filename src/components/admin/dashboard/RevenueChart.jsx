import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

export default function RevenueChart({ invoices }) {
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    return {
      label: format(d, 'MMM'),
      start: startOfMonth(d),
      end: endOfMonth(d),
    };
  });

  const data = months.map(({ label, start, end }) => {
    const revenue = invoices
      .filter(inv => {
        const d = new Date(inv.created_date);
        return inv.status === 'paid' && d >= start && d <= end;
      })
      .reduce((sum, inv) => sum + (inv.total || 0), 0);
    return { month: label, revenue };
  });

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#FF4D4D" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#FF4D4D" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
        <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
        <Area type="monotone" dataKey="revenue" stroke="#FF4D4D" strokeWidth={2} fill="url(#revenueGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}