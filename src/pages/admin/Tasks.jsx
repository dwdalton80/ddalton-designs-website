import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Plus, X, Trash2, CheckSquare, Clock, Zap } from 'lucide-react';
import { format } from 'date-fns';

const STATUSES = ['todo', 'in_progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];
const STATUS_STYLES = {
  todo: 'bg-secondary text-muted-foreground',
  in_progress: 'bg-blue-500/15 text-blue-500',
  done: 'bg-green-500/15 text-green-500',
};
const PRIORITY_STYLES = {
  low: 'bg-secondary text-muted-foreground',
  medium: 'bg-yellow-500/15 text-yellow-500',
  high: 'bg-red-500/15 text-red-500',
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ title: '', project_name: '', estimated_hours: '', actual_hours: '', status: 'todo', priority: 'medium', due_date: '', notes: '' });

  const fetch = () => {
    base44.entities.Task.list('-created_date', 200)
      .then(d => { setTasks(d); setLoading(false); })
      .catch(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const save = async (e) => {
    e.preventDefault();
    await base44.entities.Task.create({
      ...form,
      estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : undefined,
      actual_hours: form.actual_hours ? parseFloat(form.actual_hours) : undefined,
    });
    setShowForm(false);
    setForm({ title: '', project_name: '', estimated_hours: '', actual_hours: '', status: 'todo', priority: 'medium', due_date: '', notes: '' });
    fetch();
  };

  const updateStatus = async (id, status) => {
    await base44.entities.Task.update(id, { status });
    fetch();
  };

  const del = async (id) => {
    await base44.entities.Task.delete(id);
    fetch();
  };

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
  const totalHours = tasks.filter(t => t.actual_hours).reduce((s, t) => s + (t.actual_hours || 0), 0);
  const doneTasks = tasks.filter(t => t.status === 'done').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-black text-3xl">Productivity</h1>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-all">
          <Plus size={16} /> Add Task
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card rounded-2xl border border-border p-5">
          <Zap size={18} className="text-accent mb-2" />
          <div className="font-display font-black text-2xl">{tasks.filter(t => t.status === 'in_progress').length}</div>
          <div className="text-xs text-muted-foreground mt-0.5">In Progress</div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <CheckSquare size={18} className="text-green-600 mb-2" />
          <div className="font-display font-black text-2xl">{doneTasks}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Completed</div>
        </div>
        <div className="bg-card rounded-2xl border border-border p-5">
          <Clock size={18} className="text-blue-600 mb-2" />
          <div className="font-display font-black text-2xl">{totalHours.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Hours Logged</div>
        </div>
      </div>

      <div className="flex gap-2 mb-5">
        {['all', ...STATUSES].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${filter === f ? 'bg-foreground text-primary-foreground' : 'border border-border hover:border-foreground'}`}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <CheckSquare size={32} className="mx-auto mb-3 opacity-30" />
          <p>No tasks found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => (
            <div key={task.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
              <button
                onClick={() => updateStatus(task.id, task.status === 'done' ? 'todo' : task.status === 'todo' ? 'in_progress' : 'done')}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${task.status === 'done' ? 'bg-green-500 border-green-500' : task.status === 'in_progress' ? 'border-blue-400' : 'border-border'}`}
              >
                {task.status === 'done' && <X size={10} className="text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</div>
                <div className="flex items-center gap-2 mt-0.5">
                  {task.project_name && <span className="text-xs text-muted-foreground">{task.project_name}</span>}
                  {task.due_date && <span className="text-xs text-muted-foreground">· Due {format(new Date(task.due_date), 'MMM d')}</span>}
                  {task.estimated_hours && <span className="text-xs text-muted-foreground">· {task.actual_hours || 0}/{task.estimated_hours}h</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize hidden sm:block ${PRIORITY_STYLES[task.priority]}`}>{task.priority}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[task.status]}`}>{task.status.replace('_', ' ')}</span>
                <button onClick={() => del(task.id)} className="text-muted-foreground hover:text-destructive transition-colors ml-1"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display font-bold text-xl">New Task</h2>
              <button onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={save} className="space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Task Title *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" placeholder="What needs to be done?" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Project</label>
                  <input value={form.project_name} onChange={e => setForm({ ...form, project_name: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" placeholder="Project name" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm">
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Priority</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm">
                    {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Est. Hours</label>
                  <input type="number" step="0.5" value={form.estimated_hours} onChange={e => setForm({ ...form, estimated_hours: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Actual Hours</label>
                  <input type="number" step="0.5" value={form.actual_hours} onChange={e => setForm({ ...form, actual_hours: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm resize-none" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-border rounded-xl text-sm font-medium">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-all">Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}