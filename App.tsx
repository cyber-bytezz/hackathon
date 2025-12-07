import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { cn } from './lib/utils';

const App: React.FC = () => {
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);

  return (
    <div className={cn(
        "flex flex-col md:flex-row bg-black w-full flex-1 mx-auto overflow-hidden h-screen"
    )}>
      <Sidebar 
        activeThreadId={activeThreadId} 
        onSelectThread={setActiveThreadId}
        isOpen={false} // Managed internally by UI component
        toggleSidebar={() => {}} // Managed internally
      />
      
      <ChatArea 
        activeThreadId={activeThreadId}
        onThreadCreated={(newId) => setActiveThreadId(newId)}
        toggleSidebar={() => {}} // Redundant now
      />
    </div>
  );
};

export default App;