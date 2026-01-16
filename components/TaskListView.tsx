
import React from 'react';
import { Task, TaskStatus, Priority, Team } from '../types';
import { Calendar, User, Tag, ChevronRight, Info } from 'lucide-react';

interface TaskListViewProps {
  tasks: Task[];
  teams: Team[];
}

const TaskListView: React.FC<TaskListViewProps> = ({ tasks, teams }) => {
  const getStatusStyle = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE: return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case TaskStatus.IN_PROGRESS: return 'bg-blue-50 text-blue-700 border-blue-100';
      case TaskStatus.REVIEW: return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const getPriorityStyle = (priority: Priority) => {
    switch (priority) {
      case Priority.URGENT: return 'text-rose-600 bg-rose-50';
      case Priority.HIGH: return 'text-amber-600 bg-amber-50';
      case Priority.MEDIUM: return 'text-blue-600 bg-blue-50';
      default: return 'text-slate-500 bg-slate-100';
    }
  };

  return (
    <div className="overflow-hidden bg-white">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Task Details</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assignee</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Priority</th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Due Date</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const assignedTeam = teams.find(t => t.id === task.assigneeTeamId);
              return (
                <tr key={task.id} className="group hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-5 max-w-md">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                        {task.title}
                      </span>
                      <span className="text-xs text-slate-500 mt-1 line-clamp-1 group-hover:line-clamp-none transition-all duration-300">
                        {task.description}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                        <User size={14} />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">
                        {assignedTeam ? assignedTeam.name : 'Unassigned'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusStyle(task.status)} uppercase`}>
                      {task.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${getPriorityStyle(task.priority).split(' ')[0]}`}></div>
                      <span className={`text-xs font-bold ${getPriorityStyle(task.priority).split(' ')[0]}`}>
                        {task.priority}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar size={14} />
                      <span className="text-xs font-medium">
                        {new Date(task.endDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {tasks.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center">
            <Info className="text-slate-200 mb-4" size={48} />
            <p className="text-slate-400 font-medium">No tasks found for this project criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskListView;
