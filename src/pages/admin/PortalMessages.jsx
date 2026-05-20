import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, MessageSquare, Users } from 'lucide-react';

export default function AdminPortalMessages() {
  const [messages, setMessages] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedEmail, messages]);

  const loadAll = async () => {
    const [msgs, cls] = await Promise.all([
      base44.entities.PortalMessage.list('-created_date', 200),
      base44.entities.Client.list('name', 50),
    ]);
    setMessages(msgs);
    setClients(cls);
    setLoading(false);
  };

  // Group messages by client email
  const threads = {};
  messages.forEach(m => {
    if (!threads[m.client_email]) threads[m.client_email] = [];
    threads[m.client_email].push(m);
  });

  const threadList = Object.entries(threads).map(([email, msgs]) => {
    const sorted = [...msgs].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    const last = sorted[sorted.length - 1];
    const unread = msgs.filter(m => !m.from_admin && !m.read).length;
    return { email, msgs: sorted, last, unread, clientName: msgs[0]?.client_name || email };
  }).sort((a, b) => new Date(b.last.created_date) - new Date(a.last.created_date));

  const activeThread = threadList.find(t => t.email === selectedEmail);

  const sendReply = async () => {
    if (!reply.trim() || !selectedEmail) return;
    setSending(true);
    await base44.entities.PortalMessage.create({
      client_email: selectedEmail,
      client_name: activeThread?.clientName || selectedEmail,
      body: reply.trim(),
      from_admin: true,
      read: false,
    });
    setReply('');
    await loadAll();
    setSending(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 border-4 border-border border-t-accent rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-black text-3xl">Portal Messages</h1>
        <p className="text-muted-foreground mt-1 text-sm">Client messages from the Client Portal.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden flex" style={{ height: 600 }}>
        {/* Thread list */}
        <div className="w-72 border-r border-border flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Users size={14} />
              Conversations
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threadList.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground text-sm">
                <MessageSquare size={28} className="mx-auto mb-2 opacity-30" />
                No messages yet.
              </div>
            ) : threadList.map(t => (
              <button
                key={t.email}
                onClick={() => setSelectedEmail(t.email)}
                className={`w-full text-left px-4 py-3.5 border-b border-border hover:bg-secondary/50 transition-colors ${selectedEmail === t.email ? 'bg-secondary' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm truncate flex-1">{t.clientName}</div>
                  {t.unread > 0 && (
                    <span className="w-5 h-5 bg-accent text-white rounded-full text-xs flex items-center justify-center ml-2 flex-shrink-0">{t.unread}</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">{t.last.body}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Message pane */}
        <div className="flex-1 flex flex-col min-w-0">
          {!selectedEmail ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">Select a conversation</p>
              </div>
            </div>
          ) : (
            <>
              <div className="px-5 py-4 border-b border-border">
                <div className="font-semibold">{activeThread?.clientName}</div>
                <div className="text-xs text-muted-foreground">{selectedEmail}</div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {activeThread?.msgs.map(msg => (
                  <div key={msg.id} className={`flex ${msg.from_admin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${msg.from_admin
                      ? 'bg-foreground text-primary-foreground rounded-tr-sm'
                      : 'bg-secondary text-foreground rounded-tl-sm'}`}>
                      {!msg.from_admin && <div className="text-xs font-semibold text-accent mb-1">{msg.client_name || msg.client_email}</div>}
                      {msg.from_admin && <div className="text-xs font-semibold text-white/60 mb-1">You</div>}
                      <p className="text-sm leading-relaxed">{msg.body}</p>
                      <div className={`text-xs mt-1 ${msg.from_admin ? 'text-white/40' : 'text-muted-foreground'}`}>
                        {msg.created_date ? new Date(msg.created_date).toLocaleString() : ''}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-border p-4 flex gap-3">
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Type a reply…"
                  rows={2}
                  className="flex-1 resize-none bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
                />
                <button
                  onClick={sendReply}
                  disabled={sending || !reply.trim()}
                  className="px-4 py-2 bg-accent text-white rounded-xl hover:bg-accent/90 transition-all disabled:opacity-50 flex items-center gap-2 self-end font-semibold text-sm"
                >
                  <Send size={14} />
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}