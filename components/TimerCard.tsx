import React, { useState, useEffect, useRef } from 'react';
import { Timer } from '../types';
import { PlayIcon, PauseIcon, TrashIcon, ResetIcon, CopyIcon, TextIcon } from './Icons';
import ClickUpTaskPicker from './ClickUpTaskPicker';

interface TimerCardProps {
  timer: Timer;
  onUpdateTitle: (id: string, title: string) => void;
  onSetElapsedTime: (id: string, seconds: number) => void;
  onToggle: (id: string) => void;
  onReset: (id: string) => void;
  onDelete: (id: string) => void;
  clickupWorkspaceId?: string;
  onLinkClickUpTask: (id: string, taskId: string, taskName: string) => void;
  onUnlinkClickUpTask: (id: string) => void;
}

const TimerCard: React.FC<TimerCardProps> = ({
  timer,
  onUpdateTitle,
  onSetElapsedTime,
  onToggle,
  onReset,
  onDelete,
  clickupWorkspaceId,
  onLinkClickUpTask,
  onUnlinkClickUpTask,
}) => {
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [tempTime, setTempTime] = useState('');
  const [now, setNow] = useState(Date.now());
  const [timeCopied, setTimeCopied] = useState(false);
  const [titleCopied, setTitleCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (timer.isRunning) {
      setNow(Date.now());
      const interval = setInterval(() => {
        setNow(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer.isRunning]);

  const diffMs = (timer.isRunning && timer.sessionStartTime) 
    ? Math.max(0, now - timer.sessionStartTime) 
    : 0;
  
  const currentElapsed = timer.baseSeconds + Math.floor(diffMs / 1000);

  const formatTime = (totalSeconds: number) => {
    const absSeconds = Math.max(0, totalSeconds);
    const h = Math.floor(absSeconds / 3600);
    const m = Math.floor((absSeconds % 3600) / 60);
    const s = absSeconds % 60;
    return `${h.toString().padStart(1, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleCopyTime = async () => {
    const h = Math.floor(currentElapsed / 3600);
    const m = Math.floor((currentElapsed % 3600) / 60);
    const text = `${h}h ${m}m`;
    try {
      await navigator.clipboard.writeText(text);
      setTimeCopied(true);
      setTimeout(() => setTimeCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy time:', err);
    }
  };

  const handleCopyTitle = async () => {
    try {
      await navigator.clipboard.writeText(timer.title || 'Untitled Task');
      setTitleCopied(true);
      setTimeout(() => setTitleCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy title:', err);
    }
  };

  const handleTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = tempTime.split(':').reverse();
    let totalSeconds = 0;
    if (parts[0]) totalSeconds += parseInt(parts[0], 10) || 0;
    if (parts[1]) totalSeconds += (parseInt(parts[1], 10) || 0) * 60;
    if (parts[2]) totalSeconds += (parseInt(parts[2], 10) || 0) * 3600;
    onSetElapsedTime(timer.id, totalSeconds);
    setIsEditingTime(false);
  };

  const handleStartEdit = () => {
    if (timer.isRunning) onToggle(timer.id);
    setTempTime(formatTime(currentElapsed));
    setIsEditingTime(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="group relative flex flex-col p-6 rounded-xl border border-[#e9e9e7] transition-all duration-300 hover:shadow-md bg-white">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <input
          type="text"
          value={timer.title}
          onChange={(e) => onUpdateTitle(timer.id, e.target.value)}
          placeholder="Enter Task Name"
          className="bg-transparent border-none focus:ring-0 font-medium text-[#37352f] placeholder-[#a4a4a2] w-full mr-4 outline-none text-lg"
        />
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Copy Title Button */}
          <button
            onClick={handleCopyTitle}
            className={`p-1.5 rounded transition-colors ${titleCopied ? 'text-green-600 bg-green-50' : 'text-[#a4a4a2] hover:text-[#37352f] hover:bg-[#f7f7f5]'}`}
            title="Copy task name"
          >
            {titleCopied ? <span className="text-[10px] font-bold px-1">Copied!</span> : <TextIcon />}
          </button>

          {/* Copy Time Button */}
          <button
            onClick={handleCopyTime}
            className={`p-1.5 rounded transition-colors ${timeCopied ? 'text-green-600 bg-green-50' : 'text-[#a4a4a2] hover:text-[#37352f] hover:bg-[#f7f7f5]'}`}
            title="Copy duration (Xh Ym)"
          >
            {timeCopied ? <span className="text-[10px] font-bold px-1">Copied!</span> : <CopyIcon />}
          </button>

          <button
            onClick={() => onDelete(timer.id)}
            className="text-[#a4a4a2] hover:text-[#eb5757] p-1.5 rounded hover:bg-[#fff5f5] transition-colors"
            title="Delete timer"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* Timer Display */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {isEditingTime ? (
            <form onSubmit={handleTimeSubmit}>
              <input
                ref={inputRef}
                type="text"
                value={tempTime}
                onChange={(e) => setTempTime(e.target.value)}
                onBlur={handleTimeSubmit}
                className="mono text-4xl font-medium text-[#37352f] w-full max-w-[200px] border-b-2 border-[#37352f] bg-[#f7f7f5] rounded-t px-2 outline-none"
              />
            </form>
          ) : (
            <div 
              onClick={handleStartEdit}
              className={`mono text-5xl font-medium cursor-text select-none transition-all duration-200 hover:bg-[#f7f7f5] rounded px-2 -ml-2 ${
                timer.isRunning ? 'text-[#37352f]' : 'text-[#a4a4a2]'
              }`}
              title="Click to edit"
            >
              {formatTime(currentElapsed)}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          <button
            onClick={() => onReset(timer.id)}
            className="w-10 h-10 flex items-center justify-center rounded-full border border-[#e9e9e7] text-[#a4a4a2] hover:bg-[#f7f7f5] hover:text-[#37352f] transition-all active:scale-95"
            title="Reset"
          >
            <ResetIcon />
          </button>
          <button
            onClick={() => onToggle(timer.id)}
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-all active:scale-90 ${
              timer.isRunning 
                ? 'bg-[#eb5757] text-white shadow-lg shadow-red-100' 
                : 'bg-[#37352f] text-white shadow-lg shadow-gray-200'
            }`}
          >
            {timer.isRunning ? <PauseIcon /> : <PlayIcon />}
          </button>
        </div>
      </div>

      {clickupWorkspaceId && (
        <ClickUpTaskPicker
          workspaceId={clickupWorkspaceId}
          timerTitle={timer.title}
          currentElapsed={currentElapsed}
          linkedTaskId={timer.clickupTaskId}
          linkedTaskName={timer.clickupTaskName}
          onLink={(taskId, taskName) => onLinkClickUpTask(timer.id, taskId, taskName)}
          onUnlink={() => onUnlinkClickUpTask(timer.id)}
        />
      )}
    </div>
  );
};

export default TimerCard;