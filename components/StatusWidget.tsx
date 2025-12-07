import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { Server, Database, Activity } from 'lucide-react';
import { useSidebar } from './ui/sidebar';
import { motion } from 'framer-motion';

export const StatusWidget: React.FC = () => {
  const { open } = useSidebar();
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['health'],
    queryFn: api.getHealth,
    refetchInterval: 30000, // Poll every 30s
  });

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: api.getStats,
    refetchInterval: 60000,
  });

  const isHealthy = health?.status === 'healthy' && health?.pinecone_connected && health?.gemini_connected;

  if (healthLoading && open) return <div className="text-xs text-gray-500 p-4">Loading status...</div>;

  return (
    <div className={`border-t border-white/20 pt-4 mt-auto transition-all duration-300 ${open ? '' : 'flex flex-col items-center'}`}>
      {open ? (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full"
        >
            <div className="flex items-center gap-2 mb-2 px-3">
                <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-white' : 'bg-gray-600'}`} />
                <span className="text-xs font-medium text-gray-300">System Status</span>
            </div>
            
            <div className="space-y-2 px-3 text-xs text-gray-400">
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Server size={12}/> API</span>
                    <span className={health?.status === 'healthy' ? 'text-white' : 'text-gray-500'}>{health?.status || 'Down'}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Database size={12}/> Vector DB</span>
                    <span className={health?.pinecone_connected ? 'text-white' : 'text-gray-500'}>{health?.pinecone_connected ? 'Connected' : 'Error'}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1"><Activity size={12}/> AI Model</span>
                    <span className={health?.gemini_connected ? 'text-white' : 'text-gray-500'}>{health?.gemini_connected ? 'Ready' : 'Error'}</span>
                </div>
                {stats && (
                <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="flex justify-between mb-1">
                        <span>Documents</span>
                        <span className="text-white">{stats.total_vector_count.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-700 h-1 rounded overflow-hidden">
                        <div 
                            className="bg-white h-full" 
                            style={{ width: `${Math.min(stats.index_fullness * 100, 100)}%` }}
                        />
                    </div>
                </div>
                )}
            </div>
        </motion.div>
      ) : (
        <div className="flex flex-col gap-4 pb-2 items-center">
             <div title="System Status" className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-white' : 'bg-gray-600'}`} />
             <div className="flex flex-col gap-3 text-gray-500">
                 <div title={`API: ${health?.status || 'Unknown'}`}>
                    <Server size={14} className={health?.status === 'healthy' ? 'text-white' : 'text-gray-600'} />
                 </div>
                 <div title={`Vector DB: ${health?.pinecone_connected ? 'Connected' : 'Disconnected'}`}>
                    <Database size={14} className={health?.pinecone_connected ? 'text-white' : 'text-gray-600'} />
                 </div>
                 <div title={`AI Model: ${health?.gemini_connected ? 'Connected' : 'Disconnected'}`}>
                    <Activity size={14} className={health?.gemini_connected ? 'text-white' : 'text-gray-600'} />
                 </div>
             </div>
        </div>
      )}
    </div>
  );
};