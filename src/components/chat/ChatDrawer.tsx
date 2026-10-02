import React, { useState, useEffect } from 'react';
import { ChatMessage } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Send, X, MessageSquare } from 'lucide-react';

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId?: string;
  jobId?: string;
  recipientId?: string;
  recipientName?: string;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  isOpen,
  onClose,
  bookingId,
  jobId,
  recipientId,
  recipientName
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  const loadMessages = async () => {
    if (!isOpen) return;
    try {
      const msgs = await api.getMessages({ bookingId, jobId });
      setMessages(msgs);
    } catch (e) {
      console.error('Failed to load chat:', e);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3500);
    return () => clearInterval(interval);
  }, [isOpen, bookingId, jobId]);

  if (!isOpen) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText.trim();
    setInputText('');
    setLoading(true);

    try {
      const sent = await api.sendMessage({
        bookingId,
        jobId,
        recipientId,
        text
      });
      setMessages(prev => [...prev, sent]);
    } catch (e: any) {
      alert(e.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-2xs">
      <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-tight">
                {recipientName || 'Job Conversation'}
              </h4>
              <p className="text-[11px] text-slate-500">
                {bookingId ? `Booking #${bookingId}` : (jobId ? `Job #${jobId}` : 'Direct Chat')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6">
              <MessageSquare className="w-10 h-10 mb-2 opacity-40" />
              <p className="text-xs font-semibold text-slate-600">No messages yet</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Discuss service details, address specifics, tools, or timing.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.senderId === user?.id;
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <span className="text-[10px] text-slate-400 mb-0.5 px-1 font-medium">
                    {m.senderName}
                  </span>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm leading-relaxed ${
                      isMine
                        ? 'bg-teal-600 text-white rounded-tr-xs shadow-xs'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs shadow-2xs'
                    }`}
                  >
                    {m.text}
                  </div>
                  <span className="text-[9px] text-slate-400 mt-0.5 px-1">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
          <input
            type="text"
            placeholder="Type your message..."
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="p-2.5 rounded-xl bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40 transition cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
