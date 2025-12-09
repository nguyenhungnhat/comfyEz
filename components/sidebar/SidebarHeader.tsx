import React from 'react';
import { Settings, GitFork } from 'lucide-react';

interface SidebarHeaderProps {
    onOpenWorkflows: () => void;
    onOpenSettings: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ onOpenWorkflows, onOpenSettings }) => {
  return (
    <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
      <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        ComfyEz
      </h1>
      <div className="flex gap-1">
           <button 
              onClick={onOpenWorkflows}
              className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
              title="Workflow Editor"
          >
              <GitFork size={20} />
          </button>
          <button 
              onClick={onOpenSettings}
              className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
              title="Settings"
          >
              <Settings size={20} />
          </button>
      </div>
    </div>
  );
};

export default SidebarHeader;