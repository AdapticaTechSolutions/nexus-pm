
import React, { useState } from 'react';
import { Project, Task, TaskGroup, Team, Ticket, TaskStatus, Priority, CurrencyCode } from '../types';
import { 
  Layout, 
  List, 
  LayoutGrid,
  GanttChart as GanttIcon, 
  DollarSign, 
  Ticket as TicketIcon,
  MessageSquare,
  Plus
} from 'lucide-react';
import KanbanBoard from './KanbanBoard';
import GanttChart from './GanttChart';
import BudgetView from './BudgetView';
import TicketsView from './TicketsView';
import TaskListView from './TaskListView';
import { getProjectHealthStatus } from '../utils/financials';

interface ProjectDetailProps {
  project: Project;
  tasks: Task[];
  taskGroups: TaskGroup[];
  teams: Team[];
  tickets: Ticket[];
  onUpdateTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
  currency: CurrencyCode;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ 
  project, 
  tasks, 
  taskGroups, 
  teams, 
  tickets,
  onUpdateTasks,
  onUpdateProject,
  currency
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'list' | 'kanban' | 'gantt' | 'budget' | 'tickets'>('overview');

  const TabButton = ({ id, icon: Icon, label }: any) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all font-medium ${
        activeTab === id 
          ? 'border-blue-600 text-blue-600 bg-blue-50/30' 
          : 'border-transparent text-slate-500 hover:text-slate-800'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-end mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded">Active Project</span>
              <ProjectHealthIndicator project={project} tasks={tasks} />
            </div>
            <h2 className="text-3xl font-bold text-slate-900">{project.name}</h2>
          </div>
          <div className="flex gap-3">
            <button className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500">
              <MessageSquare size={20} />
            </button>
            <button 
              onClick={() => {/* TODO: Implement add task modal */}}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              <Plus size={20} />
              Add Task
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[70vh]">
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <TabButton id="overview" icon={Layout} label="Overview" />
          <TabButton id="list" icon={List} label="Task List" />
          <TabButton id="kanban" icon={LayoutGrid} label="Kanban Board" />
          <TabButton id="gantt" icon={GanttIcon} label="Gantt Chart" />
          <TabButton id="tickets" icon={TicketIcon} label="Tickets & Backlog" />
          <TabButton id="budget" icon={DollarSign} label="Financials" />
        </div>

        <div className="flex-1 p-0">
          {activeTab === 'overview' && (
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Description</h3>
                  <p className="text-slate-600 leading-relaxed">{project.description}</p>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Core Deliverables</h3>
                  <div className="space-y-3">
                    {project.deliverables.map(d => (
                      <div key={d.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${d.isCompleted ? 'bg-green-500 border-green-500' : 'border-slate-300'}`}>
                          {d.isCompleted && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                        <span className={`text-sm font-medium ${d.isCompleted ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{d.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                 <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Project Teams</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.assignedTeamIds.map(tid => {
                      const team = teams.find(t => t.id === tid);
                      return (
                        <div key={tid} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold border border-blue-100">
                          {team?.name || 'Unknown Team'}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-slate-900 rounded-3xl p-6 text-white overflow-hidden relative">
                  <div className="relative z-10">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Quick Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-2xl font-bold">{tasks.filter(t => t.status === TaskStatus.DONE).length} / {tasks.length}</p>
                        <p className="text-[10px] text-slate-400">Tasks Completed</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{tickets.length}</p>
                        <p className="text-[10px] text-slate-400">Active Tickets</p>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl -mr-16 -mt-16 rounded-full"></div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'list' && (
            <TaskListView tasks={tasks} teams={teams} />
          )}

          {activeTab === 'kanban' && (
            <div className="p-8">
              <KanbanBoard tasks={tasks} taskGroups={taskGroups} onUpdateTasks={onUpdateTasks} />
            </div>
          )}

          {activeTab === 'gantt' && (
            <div className="p-8">
              <GanttChart 
                tasks={tasks} 
                project={project} 
                taskGroups={taskGroups}
                milestones={[]} // TODO: Add milestones support when implemented
              />
            </div>
          )}

          {activeTab === 'tickets' && (
             <div className="p-8">
               <TicketsView tickets={tickets} />
             </div>
          )}

          {activeTab === 'budget' && (
            <div className="p-8">
              <BudgetView project={project} onUpdateProject={onUpdateProject} currency={currency} teams={teams} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ProjectHealthIndicator = ({ project, tasks, size = 'md' }: { project: Project, tasks: Task[], size?: 'sm' | 'md' }) => {
  const health = getProjectHealthStatus(project, tasks);
  const colorMap = {
    green: 'bg-emerald-500 shadow-emerald-200',
    yellow: 'bg-amber-500 shadow-amber-200',
    red: 'bg-rose-500 shadow-rose-200'
  };
  const sizeMap = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3'
  };

  return (
    <div className="flex items-center gap-2">
      <div className={`relative ${sizeMap[size]} rounded-full ${colorMap[health]} shadow-lg animate-pulse`}>
        <div className={`absolute inset-0 rounded-full ${colorMap[health]} opacity-40 animate-ping`}></div>
      </div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        {health === 'green' ? 'Healthy' : health === 'yellow' ? 'Warning' : 'Critical'}
      </span>
    </div>
  );
};

export default ProjectDetail;
