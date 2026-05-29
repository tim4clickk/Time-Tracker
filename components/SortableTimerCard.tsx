import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import TimerCard from './TimerCard';
import { Timer } from '../types';

interface Props {
  timer: Timer;
  onUpdateTitle: (id: string, title: string) => void;
  onSetElapsedTime: (id: string, seconds: number) => void;
  onToggle: (id: string) => void;
  onReset: (id: string) => void;
  onDelete: (id: string) => void;
  clickupWorkspaceId?: string;
  onLinkClickUpTask: (id: string, taskId: string, taskName: string) => void;
  onUnlinkClickUpTask: (id: string) => void;
  onMarkSynced: (id: string) => void;
}

const SortableTimerCard: React.FC<Props> = ({ timer, ...props }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: timer.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-50' : ''}>
      <TimerCard
        timer={timer}
        dragHandleProps={{ ...attributes, ...listeners }}
        {...props}
      />
    </div>
  );
};

export default SortableTimerCard;
