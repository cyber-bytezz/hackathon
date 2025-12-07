import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { MessageSquare, Trash2, Edit2, Plus, Check, X, Server } from 'lucide-react';
import { StatusWidget } from './StatusWidget';
import { LoadingSpinner } from './LoadingSpinner';
import { Sidebar as UISidebar, SidebarBody, SidebarLink, useSidebar } from './ui/sidebar';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeThreadId: string | null;
  onSelectThread: (id: string | null) => void;
  isOpen: boolean;
  toggleSidebar: () => void;
}

// Custom component to handle the specific needs of a conversation item (rename/delete)
// inside the framer-motion sidebar context
const ConversationItem = ({ 
  conv, 
  isActive, 
  onSelect, 
  onRename, 
  onDelete 
}: { 
  conv: any; 
  isActive: boolean; 
  onSelect: () => void;
  onRename: (id: string, newTitle: string) => void;
  onDelete: (id: string) => void;
}) => {
  const { open, animate } = useSidebar();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conv.title);

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRename(conv.thread_id, editTitle);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 py-2 px-1">
        <input 
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          className="bg-neutral-900 text-white border border-neutral-700 text-xs p-1 rounded w-full outline-none min-w-0"
          autoFocus
        />
        <button onClick={handleRename} className="p-1 text-white hover:text-gray-300 shrink-0"><Check size={14}/></button>
        <button onClick={(e) => { e.stopPropagation(); setIsEditing(false); }} className="p-1 text-white hover:text-gray-300 shrink-0"><X size={14}/></button>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group/item flex items-center gap-2 py-2 px-2 cursor-pointer transition-colors rounded-md",
        open ? "justify-start" : "justify-center",
        isActive 
          ? "bg-white text-black font-medium" 
          : "text-neutral-400 hover:text-white hover:bg-neutral-900"
      )}
      title={!open ? conv.title : undefined}
    >
      <MessageSquare className={cn("h-4 w-4 flex-shrink-0 transition-colors", isActive ? "text-black" : "text-neutral-500 group-hover/item:text-white")} />
      
      <motion.div
        animate={{
          display: animate ? (open ? "flex" : "none") : "flex",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="flex-1 overflow-hidden items-center justify-between gap-2"
      >
        <span className="text-sm truncate block flex-1">{conv.title || 'New Chat'}</span>
        
        {/* Actions only show on hover and if open */}
        {open && (
          <div className={cn(
            "flex items-center gap-1 transition-opacity",
            isActive ? "opacity-100" : "opacity-0 md:group-hover/item:opacity-100"
          )}>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              className={cn("p-1", isActive ? "text-black/70 hover:text-black" : "text-neutral-400 hover:text-white")}
              title="Rename"
            >
              <Edit2 size={12} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(conv.thread_id); }}
              className={cn("p-1", isActive ? "text-black/70 hover:text-black" : "text-neutral-400 hover:text-white")}
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const SidebarContent: React.FC<SidebarProps & { setOpen: (o: boolean) => void }> = ({ activeThreadId, onSelectThread, setOpen }) => {
    const queryClient = useQueryClient();
    const { open } = useSidebar();
    
    const { data, isLoading } = useQuery({
      queryKey: ['conversations'],
      queryFn: api.getConversations,
    });
  
    const deleteMutation = useMutation({
      mutationFn: api.deleteConversation,
      onSuccess: (_, deletedId) => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
        if (activeThreadId === deletedId) {
          onSelectThread(null);
        }
      },
    });
  
    const renameMutation = useMutation({
      mutationFn: ({ id, title }: { id: string; title: string }) => api.renameConversation(id, title),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
      },
    });
  
    const handleDelete = (id: string) => {
      if (window.confirm('Are you sure you want to delete this conversation?')) {
        deleteMutation.mutate(id);
      }
    };
  
    const sortedConversations = data?.conversations.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );

    return (
        <SidebarBody className="justify-between gap-10 bg-black border-r border-neutral-900">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          
          {/* Logo / Brand */}
          <div className={cn(
             "flex items-center gap-2 mb-8 mt-2 px-1",
             open ? "justify-start" : "justify-center"
          )}>
             <div className="h-6 w-6 bg-white rounded-sm shrink-0 flex items-center justify-center">
                <span className="text-black font-bold text-xs">AI</span>
             </div>
             <motion.span
                animate={{
                  display: open ? "inline-block" : "none",
                  opacity: open ? 1 : 0,
                }}
                className="font-bold text-white text-lg tracking-tight whitespace-pre"
              >
                RAG Chat
              </motion.span>
          </div>

          {/* New Chat Button */}
          <div onClick={() => {
              onSelectThread(null);
              if (window.innerWidth < 768) setOpen(false);
          }} className={cn(
              "flex items-center gap-2 py-2 mb-4 cursor-pointer transition-all border border-neutral-800 hover:border-white rounded-md",
              open ? "px-3 justify-start bg-neutral-950 hover:bg-neutral-900" : "justify-center bg-transparent border-none px-0"
          )}>
               <Plus className="text-white h-4 w-4 flex-shrink-0" />
               <motion.span
                 animate={{
                   display: open ? "inline-block" : "none",
                   opacity: open ? 1 : 0,
                 }}
                 className="text-white text-sm font-medium"
               >
                 New Chat
               </motion.span>
          </div>

          {/* Conversation List */}
          <div className="flex flex-col gap-1">
             <div className={cn(
                "text-[10px] font-bold text-neutral-600 mb-2 px-2 uppercase tracking-widest",
                open ? "text-left" : "text-center"
             )}>
                {open ? 'History' : '•••'}
             </div>
             {isLoading ? (
                <div className="flex justify-center p-2"><LoadingSpinner size={16}/></div>
             ) : (
                sortedConversations?.map((conv) => (
                    <ConversationItem 
                        key={conv.thread_id}
                        conv={conv}
                        isActive={activeThreadId === conv.thread_id}
                        onSelect={() => {
                          onSelectThread(conv.thread_id);
                          if (window.innerWidth < 768) setOpen(false);
                        }}
                        onRename={(id, title) => renameMutation.mutate({ id, title })}
                        onDelete={handleDelete}
                    />
                ))
             )}
          </div>
        </div>

        {/* Footer / Status */}
        <div className="mt-auto">
             <StatusWidget />
        </div>
      </SidebarBody>
    );
}

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const [open, setOpen] = useState(false);

  return (
    <UISidebar open={open} setOpen={setOpen}>
       <SidebarContent {...props} setOpen={setOpen} />
    </UISidebar>
  );
};