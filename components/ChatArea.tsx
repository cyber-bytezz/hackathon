import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { Send, User, Bot, BookOpen } from 'lucide-react';
import { api } from '../services/api';
import { Message } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface ChatAreaProps {
  activeThreadId: string | null;
  onThreadCreated: (id: string) => void;
  toggleSidebar: () => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ activeThreadId, onThreadCreated }) => {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Local state for messages to handle immediate UI updates
  const [localMessages, setLocalMessages] = useState<Message[]>([]);

  // Fetch conversation history
  const { data: conversationData, isLoading: isHistoryLoading, error } = useQuery({
    queryKey: ['conversation', activeThreadId],
    queryFn: () => api.getConversation(activeThreadId!),
    enabled: !!activeThreadId,
  });

  // Sync local messages with fetched data
  useEffect(() => {
    if (conversationData) {
      setLocalMessages(conversationData.messages);
    } else if (!activeThreadId) {
      setLocalMessages([]);
    }
  }, [conversationData, activeThreadId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, isHistoryLoading]);

  // Resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const mutation = useMutation({
    mutationFn: api.createOrContinueChat,
    onMutate: async (newChatRequest) => {
      // Optimistic update
      const userMsg: Message = { role: 'user', content: newChatRequest.query, timestamp: new Date().toISOString() };
      setLocalMessages((prev) => [...prev, userMsg]);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    },
    onSuccess: (data) => {
      const aiMsg: Message = { 
        role: 'assistant', 
        content: data.answer, 
        timestamp: new Date().toISOString(),
        sources: data.sources 
      };
      setLocalMessages((prev) => [...prev, aiMsg]);
      
      // If this was a new chat, notify parent to update URL/State
      if (!activeThreadId && data.thread_id) {
        onThreadCreated(data.thread_id);
      }
      
      // Invalidate list to show updated message count or new chat
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      // Invalidate current chat to ensure sync
      if (data.thread_id) {
         queryClient.invalidateQueries({ queryKey: ['conversation', data.thread_id] });
      }
    },
    onError: (err) => {
      console.error(err);
      alert('Failed to send message. Check the backend connection.');
    }
  });

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || mutation.isPending) return;

    mutation.mutate({
      query: input,
      thread_id: activeThreadId || undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full relative bg-black rounded-none overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto w-full">
        {!activeThreadId && localMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-100 p-8">
             <div className="bg-white text-black p-4 rounded-full mb-6">
                <Bot size={48} />
             </div>
             <h2 className="text-2xl font-bold mb-2 tracking-tight">RAG Chat AI</h2>
             <p className="text-neutral-500 mb-8 max-w-md text-center">
               Professional document retrieval and generation.
             </p>
          </div>
        ) : (
          <div className="flex flex-col pb-40 pt-4">
             {isHistoryLoading && <div className="p-8 text-center text-neutral-500">Loading history...</div>}
             {error && <div className="p-8 text-center text-red-500">Error loading conversation</div>}
             
             {localMessages.map((msg, idx) => {
               const isUser = msg.role === 'user';
               return (
                 <div 
                   key={idx} 
                   className={`w-full py-6 px-4 ${
                     isUser ? 'bg-black' : 'bg-neutral-900/30 border-y border-neutral-900'
                   }`}
                 >
                   <div className="max-w-3xl mx-auto flex gap-6 text-base m-auto">
                      <div className={`w-8 h-8 shrink-0 rounded-sm flex items-center justify-center border ${isUser ? 'bg-black border-neutral-700 text-neutral-400' : 'bg-white border-white text-black'}`}>
                        {isUser ? <User size={18} /> : <Bot size={18} />}
                      </div>
                      <div className="relative flex-1 overflow-hidden">
                        {isUser ? (
                          <div className="whitespace-pre-wrap text-neutral-200">{msg.content}</div>
                        ) : (
                          <div className="markdown prose prose-invert prose-p:leading-relaxed prose-pre:bg-neutral-950 prose-pre:border prose-pre:border-neutral-800 max-w-none">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                            
                            {/* Sources Section */}
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-6 pt-4 border-t border-neutral-800 text-sm">
                                    <div className="flex items-center gap-2 text-neutral-500 mb-3 text-xs uppercase tracking-wider font-semibold">
                                        <BookOpen size={12} />
                                        Sources
                                    </div>
                                    <div className="grid gap-2">
                                        {msg.sources.map((source, i) => (
                                            <div key={i} className="bg-neutral-950 border border-neutral-800 p-2 rounded text-xs text-neutral-400 font-mono break-all hover:border-neutral-600 transition-colors cursor-default">
                                                {source}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                          </div>
                        )}
                      </div>
                   </div>
                 </div>
               );
             })}
             
             {mutation.isPending && (
                <div className="w-full bg-neutral-900/30 border-y border-neutral-900 py-6 px-4">
                    <div className="max-w-3xl mx-auto flex gap-6">
                        <div className="w-8 h-8 shrink-0 rounded-sm flex items-center justify-center bg-white text-black">
                           <Bot size={18} />
                        </div>
                        <div className="flex items-center gap-2 text-neutral-500">
                            <LoadingSpinner size={16} /> Thinking...
                        </div>
                    </div>
                </div>
             )}
             <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black to-transparent pt-12 pb-8 px-4">
        <div className="max-w-3xl mx-auto">
             <form onSubmit={handleSend} className="relative flex flex-col w-full p-3 bg-neutral-950 rounded-xl border border-neutral-800 shadow-2xl focus-within:border-neutral-600 transition-colors">
                <textarea
                    ref={textareaRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Send a message..."
                    className="w-full resize-none bg-transparent border-0 ring-0 focus:ring-0 text-white placeholder-neutral-500 pr-10 max-h-[200px] overflow-y-auto"
                    style={{ minHeight: '24px' }}
                />
                <button 
                    type="submit" 
                    disabled={mutation.isPending || !input.trim()}
                    className="absolute bottom-3 right-3 p-1.5 rounded-md text-neutral-500 hover:bg-neutral-800 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                >
                    <Send size={14} />
                </button>
             </form>
             <div className="text-center text-[10px] text-neutral-600 mt-3 tracking-wide">
                RAG Chat may display inaccurate info.
             </div>
        </div>
      </div>
    </div>
  );
};