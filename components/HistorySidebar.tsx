import React from 'react';
import { HistoryItem } from '../types';
import { CloseIcon, TrashIcon, RestoreIcon } from './Icons';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  historyItems: HistoryItem[];
  onDeleteOne: (id: string) => void;
  onClearAll: () => void;
  onRestore: (item: HistoryItem) => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  historyItems,
  onDeleteOne,
  onClearAll,
  onRestore,
}) => {
  if (!isOpen) return null;

  const formatDuration = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#e9e9e7]">
          <h2 className="text-xl font-bold text-[#37352f]">History</h2>
          <button 
            onClick={onClose}
            className="p-2 text-[#a4a4a2] hover:bg-[#f7f7f5] hover:text-[#37352f] rounded transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {historyItems.length === 0 ? (
            <div className="text-center text-[#a4a4a2] py-12">
              <p>No history records found.</p>
              <p className="text-sm mt-2">Deleted timers will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {historyItems.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white border border-[#e9e9e7] rounded-lg p-4 hover:border-[#d3d1cb] hover:shadow-sm transition-all flex justify-between items-start gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[#37352f] truncate">
                      {item.title || 'Untitled Task'}
                    </h3>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[#a4a4a2]">
                      <span className="font-mono text-[#37352f] bg-[#f7f7f5] px-1.5 py-0.5 rounded">
                        {formatDuration(item.totalSeconds)}
                      </span>
                      <span>•</span>
                      <span>Deleted {formatDate(item.deletedAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onRestore(item)}
                      className="p-2 text-[#a4a4a2] hover:text-[#37352f] hover:bg-[#f7f7f5] rounded transition-colors"
                      title="Restore to dashboard"
                    >
                      <RestoreIcon />
                    </button>
                    <button
                      onClick={() => onDeleteOne(item.id)}
                      className="p-2 text-[#a4a4a2] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete permanently"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {historyItems.length > 0 && (
          <div className="p-6 border-t border-[#e9e9e7] bg-[#fbfbfa]">
            <button
              onClick={onClearAll}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-[#e9e9e7] text-[#a4a4a2] rounded-lg font-medium hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all text-sm"
            >
              <TrashIcon />
              <span>Clear All History</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistorySidebar;
