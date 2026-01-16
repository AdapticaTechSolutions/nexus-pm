
import React from 'react';
import { Project, Task, CurrencyCode } from '../types';
import { Calendar, DollarSign, Target, ChevronRight, Plus } from 'lucide-react';
import { ProjectHealthIndicator } from './ProjectDetail';
import { formatCurrency } from '../utils/currency';
import { getTotalProjectSpend } from '../utils/financials';

interface ProjectListProps {
  projects: Project[];
  tasks: Task[];
  onProjectClick: (id: string) => void;
  onCreateProject?: () => void;
  currency: CurrencyCode;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, tasks, onProjectClick, onCreateProject, currency }) => {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Projects</h2>
          <p className="text-slate-500">Managing {projects.length} active initiatives</p>
        </div>
        <button 
          onClick={onCreateProject}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          Create Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map(project => {
          const projectTasks = tasks.filter(t => t.projectId === project.id);
          const totalSpent = getTotalProjectSpend(project);
          return (
            <div 
              key={project.id} 
              className="bg-white border border-slate-100 rounded-3xl p-8 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group cursor-pointer"
              onClick={() => onProjectClick(project.id)}
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="mb-2">
                    <ProjectHealthIndicator project={project} tasks={projectTasks} size="sm" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-slate-500 text-sm line-clamp-2">{project.description}</p>
                </div>
                <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl">
                  <Target size={24} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Calendar size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Timeline</span>
                  </div>
                  <div className="text-sm font-bold text-slate-700">
                    {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <DollarSign size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Total Spend</span>
                  </div>
                  <div className="text-sm font-bold text-slate-700">
                    {formatCurrency(totalSpent, currency)} / {formatCurrency(project.budgetAllocated, currency)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                      <img src={`https://picsum.photos/seed/${project.id}${i}/32/32`} alt="user" />
                    </div>
                  ))}
                </div>
                <button className="flex items-center gap-1 text-blue-600 font-bold text-sm">
                  View Details <ChevronRight size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProjectList;
