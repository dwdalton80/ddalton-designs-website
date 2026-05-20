import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, MessageSquare } from 'lucide-react';

export default function PortalMessages({ user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    loadMessages();
  }, [user.email]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    const data = await base44.entities.PortalMessage.filter({ client_email: user.email }, 'created_date', 100);
    setMessages(data);
    setLoading(false);
    // Mark unread messages from admin as read
    const unread = data.filter(m => m.from_admin && !m.read);
    unread.forEach(m => base44.entities.PortalMessage.update(m.id, { read: true }));
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    setSending(true);
    await base44.entities.PortalMessage.create({
      client_email: user.email,
      client_name: user.full_name,
      body: newMessage.trim(),
      from_admin: false,
      read: false,
    });
    setNewMessage('');
    await loadMessages();
    setSending(false);
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-7 h-7 border-4 border-border border-t-accent rounded-full animate-spin" /></div>;

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      <div>
        <h2 className="font-display font-bold text-2xl mb-1">Messages</h2>
        <p className="text-sm text-muted-foreground">Communicate directly with Derek about your projects.</p>
      </div>

      {/* Message thread */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: 420 }}>
        <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ maxHeight: 420 }}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <MessageSquare size={32} className="mb-3 opacity-30" />
              <p className="text-sm">No messages yet. Send one below!</p>
            </div>
          ) : messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.from_admin ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${msg.from_admin
                ? 'bg-secondary text-foreground rounded-tl-sm'
                : 'bg-foreground text-primary-foreground rounded-tr-sm'}`}>
                {msg.from_admin && (
                  <div className="text-xs font-semibold text-accent mb-1">Derek @ DDalton Designs</div>
                )}
                <p className="text-sm leading-relaxed">{msg.body}</p>
                <div className={`text-xs mt-1 ${msg.from_admin ? 'text-muted-foreground' : 'text-white/50'}`}>
                  {msg.created_date ? new Date(msg.created_date).toLocaleString() : ''}
                </div>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border p-4 flex gap-3">
          <textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Type a message…"
            rows={2}
            className="flex-1 resize-none bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent transition-colors"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !newMessage.trim()}
            className="px-4 py-2 bg-accent text-white rounded-xl hover:bg-accent/90 transition-all disabled:opacity-50 flex items-center gap-2 self-end font-semibold text-sm"
          >
            <Send size={14} />
            Send
          </button>
        </div>
      </div>
    </div>
  );
}