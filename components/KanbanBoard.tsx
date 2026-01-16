
import React, { useState } from 'react';
import { Task, TaskGroup, TaskStatus, Priority } from '../types';
import { MoreHorizontal, Paperclip, MessageSquare } from 'lucide-react';

interface KanbanBoardProps {
  tasks: Task[];
  taskGroups: TaskGroup[];
  // Fix: Use React.Dispatch<React.SetStateAction<Task[]>> for consistency with React state setters
  onUpdateTasks: React.Dispatch<React.SetStateAction<Task[]>>;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, taskGroups, onUpdateTasks }) => {
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<TaskStatus | null>(null);

  const columns = [
    { id: TaskStatus.TODO, title: 'To Do', color: 'bg-slate-100', hoverColor: 'ring-slate-300' },
    { id: TaskStatus.IN_PROGRESS, title: 'In Progress', color: 'bg-blue-50', hoverColor: 'ring-blue-200' },
    { id: TaskStatus.REVIEW, title: 'Review', color: 'bg-amber-50', hoverColor: 'ring-amber-200' },
    { id: TaskStatus.DONE, title: 'Done', color: 'bg-emerald-50', hoverColor: 'ring-emerald-200' },
  ];

  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.LOW: return 'bg-slate-100 text-slate-600';
      case Priority.MEDIUM: return 'bg-blue-100 text-blue-600';
      case Priority.HIGH: return 'bg-amber-100 text-amber-600';
      case Priority.URGENT: return 'bg-rose-100 text-rose-600';
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggingTaskId(taskId);
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    if (dragOverColumnId !== status) {
      setDragOverColumnId(status);
    }
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    
    // Update state globally
    onUpdateTasks((prevTasks: Task[]) => 
      prevTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
    );
    
    setDraggingTaskId(null);
    setDragOverColumnId(null);
  };

  const handleDragEnd = () => {
    setDraggingTaskId(null);
    setDragOverColumnId(null);
  };

  return (
    <div className="flex gap-6 h-full overflow-x-auto pb-4 custom-scrollbar">
      {columns.map(col => (
        <div 
          key={col.id} 
          className="w-80 shrink-0 flex flex-col"
          onDragOver={(e) => handleDragOver(e, col.id)}
          onDrop={(e) => handleDrop(e, col.id)}
          onDragLeave={() => setDragOverColumnId(null)}
        >
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-slate-800">{col.title}</h3>
              <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {tasks.filter(t => t.status === col.id).length}
              </span>
            </div>
            <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={18} /></button>
          </div>

          <div className={`flex-1 rounded-2xl p-3 space-y-4 min-h-[50vh] transition-all duration-200 border-2 border-transparent ${
            dragOverColumnId === col.id ? `${col.color} ring-2 ${col.hoverColor} border-dashed` : col.color
          }`}>
            {tasks.filter(t => t.status === col.id).map(task => (
              <div 
                key={task.id} 
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onDragEnd={handleDragEnd}
                className={`bg-white p-4 rounded-xl shadow-sm border border-slate-200/50 hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
                  draggingTaskId === task.id ? 'opacity-40 scale-95 border-blue-400 border-2' : 'opacity-100'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <div className="flex -space-x-1">
                    <img src={`https://picsum.photos/seed/${task.id}/24/24`} className="w-6 h-6 rounded-full border-2 border-white" alt="avatar" />
                  </div>
                </div>
                <h4 className="text-sm font-bold text-slate-800 mb-2">{task.title}</h4>
                <p className="text-xs text-slate-500 mb-4 line-clamp-2">{task.description}</p>
                
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-slate-400">
                    <span className="flex items-center gap-1 text-[10px] font-medium"><MessageSquare size={12} /> 3</span>
                    <span className="flex items-center gap-1 text-[10px] font-medium"><Paperclip size={12} /> 1</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {new Date(task.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            ))}
            
            <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-bold hover:border-blue-300 hover:text-blue-400 hover:bg-white/50 transition-all">
              + Add Task
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
