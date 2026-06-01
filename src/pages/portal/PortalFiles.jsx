import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, FileText, Trash2, Loader2, CheckCircle } from 'lucide-react';

export default function PortalFiles({ user }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const inputRef = useRef();

  const fetchFiles = () => {
    base44.entities.ClientFile.filter({ client_email: user.email }, '-created_date', 50)
      .then(d => { setFiles(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchFiles(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.ClientFile.create({
      client_email: user.email,
      client_name: user.full_name,
      file_url,
      file_name: file.name,
      file_size: file.size,
      notes: notes.trim(),
    });
    setNotes('');
    setUploadSuccess(true);
    setTimeout(() => setUploadSuccess(false), 3000);
    inputRef.current.value = '';
    setUploading(false);
    fetchFiles();
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl mb-1">Project Files</h2>
        <p className="text-muted-foreground text-sm">Upload assets, documents, or reference files for your project. Derek will be notified.</p>
      </div>

      {/* Upload Area */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-accent hover:bg-accent/5 transition-all"
        >
          {uploading ? (
            <Loader2 size={32} className="text-accent animate-spin" />
          ) : uploadSuccess ? (
            <CheckCircle size={32} className="text-green-500" />
          ) : (
            <Upload size={32} className="text-muted-foreground" />
          )}
          <div className="text-center">
            <p className="font-semibold text-sm">{uploading ? 'Uploading...' : uploadSuccess ? 'Uploaded!' : 'Click to upload a file'}</p>
            <p className="text-xs text-muted-foreground mt-1">Any file type accepted</p>
          </div>
        </div>
        <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
        <div className="mt-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">Notes (optional)</label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="e.g. Logo source files, final approved version..."
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-accent text-sm resize-none"
          />
        </div>
      </div>

      {/* File List */}
      <div>
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">Uploaded Files</h3>
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
              <div key={f.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="font-medium text-sm hover:text-accent transition-colors truncate block">{f.file_name}</a>
                  <div className="text-xs text-muted-foreground">{formatSize(f.file_size)}{f.notes ? ` · ${f.notes}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}