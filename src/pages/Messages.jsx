import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { supabase, getConversations, getMessages, sendMessage } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Car, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { formatPrice } from '@/components/shared/NigerianStates';

export default function Messages() {
  const { user, profile, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEnd = useRef(null);

  useEffect(() => {
    if (!user) return;
    getConversations(user.id).then(setConversations).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!activeConv) return;
    getMessages(activeConv.id).then(setMessages);

    // Real-time subscription
    const sub = supabase
      .channel(`messages:${activeConv.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${activeConv.id}`
      }, payload => {
        setMessages(m => [...m, payload.new]);
      })
      .subscribe();

    return () => supabase.removeChannel(sub);
  }, [activeConv]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !activeConv || sending) return;
    setSending(true);
    try {
      await sendMessage(activeConv.id, user.id, input.trim());
      setInput('');
    } catch { toast.error('Failed to send'); }
    finally { setSending(false); }
  };

  const getOther = (conv) => {
    if (!conv) return null;
    return user.id === conv.buyer_id ? conv.seller : conv.buyer;
  };

  const formatTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (!isAuthenticated) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="text-center">
        <MessageSquare className="w-16 h-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Sign in to view messages</h2>
        <Button onClick={login} className="bg-amber-500 hover:bg-amber-600 text-white h-12 mt-4 px-8">Sign in with Google</Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Messages</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden" style={{ height: '70vh' }}>
          <div className="flex h-full">
            {/* Conversation list */}
            <div className={`w-full md:w-80 border-r border-slate-100 flex flex-col ${activeConv ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-slate-100">
                <p className="font-semibold text-slate-900">Conversations</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-32 text-slate-400">Loading...</div>
                ) : conversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
                    <MessageSquare className="w-10 h-10 mb-3" />
                    <p className="font-medium text-slate-600">No conversations yet</p>
                    <p className="text-sm mt-1">Browse cars and contact sellers to start chatting</p>
                  </div>
                ) : conversations.map(conv => {
                  const other = getOther(conv);
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setActiveConv(conv)}
                      className={`w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left border-b border-slate-50 ${activeConv?.id === conv.id ? 'bg-amber-50 border-l-2 border-l-amber-500' : ''}`}
                    >
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={other?.avatar_url} />
                        <AvatarFallback className="bg-amber-100 text-amber-700 text-sm">
                          {(other?.full_name || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-900 truncate">{other?.full_name || 'User'}</p>
                        <p className="text-xs text-slate-500 truncate">{conv.cars?.title || 'Car inquiry'}</p>
                        {conv.last_message && <p className="text-xs text-slate-400 truncate">{conv.last_message}</p>}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">{formatTime(conv.updated_at)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chat area */}
            <div className={`flex-1 flex flex-col ${!activeConv ? 'hidden md:flex' : 'flex'}`}>
              {!activeConv ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <MessageSquare className="w-12 h-12 mb-3" />
                  <p className="font-medium text-slate-600">Select a conversation</p>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setActiveConv(null)}>
                      <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={getOther(activeConv)?.avatar_url} />
                      <AvatarFallback className="bg-amber-100 text-amber-700 text-sm">
                        {(getOther(activeConv)?.full_name || 'U')[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{getOther(activeConv)?.full_name || 'User'}</p>
                      {activeConv.cars && (
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Car className="w-3 h-3" /> {activeConv.cars.title}
                        </p>
                      )}
                    </div>
                    {getOther(activeConv)?.whatsapp && (
                      <a href={`https://wa.me/${(getOther(activeConv)?.whatsapp || '').replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white h-8 text-xs gap-1">
                          💬 WhatsApp
                        </Button>
                      </a>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 && (
                      <div className="text-center text-slate-400 text-sm py-8">No messages yet. Say hello!</div>
                    )}
                    {messages.map(msg => {
                      const isMe = msg.sender_id === user.id;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                            isMe
                              ? 'bg-amber-500 text-white rounded-br-sm'
                              : 'bg-slate-100 text-slate-900 rounded-bl-sm'
                          }`}>
                            <p>{msg.content}</p>
                            <p className={`text-[10px] mt-1 ${isMe ? 'text-white/70 text-right' : 'text-slate-400'}`}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={messagesEnd} />
                  </div>

                  {/* Input */}
                  <div className="p-4 border-t border-slate-100 flex gap-2">
                    <Input
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                      placeholder="Type a message..."
                      className="flex-1"
                    />
                    <Button onClick={handleSend} disabled={!input.trim() || sending} className="bg-amber-500 hover:bg-amber-600 text-white shrink-0">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
