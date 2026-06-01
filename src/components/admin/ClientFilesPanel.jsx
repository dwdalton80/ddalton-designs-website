import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { FileText, Download, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';

export default function ClientFilesPanel({ client, onClose }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.ClientFile.filter({ client_email: client.email }, '-created_date', 100)
      .then(d => { setFiles(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [client.email]);

  const del = async (id) => {
    if (!confirm('Delete this file?')) return;
    await base44.entities.ClientFile.delete(id);
    setFiles(f => f.filter(x => x.id !== id));
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-display font-bold text-lg">{client.name}'s Files</h2>
            <p className="text-xs text-muted-foreground">{client.email}</p>
          </div>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}</div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText size={28} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No files uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map(f => (
                <div key={f.id} className="bg-background border border-border rounded-xl p-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <FileText size={16} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{f.file_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatSize(f.file_size)} · {format(new Date(f.created_date), 'MMM d, yyyy')}
                      {f.notes ? ` · ${f.notes}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <a href={f.file_url} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                      <Download size={14} />
                    </a>
                    <button onClick={() => del(f.id)}
                      className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-destructive">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}