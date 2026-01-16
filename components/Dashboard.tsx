
import React from 'react';
import { Project, Task, TaskStatus, CurrencyCode } from '../types';
import { 
  ArrowUpRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FolderOpen,
  Plus
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../utils/currency';
import { getTotalProjectSpend } from '../utils/financials';

interface DashboardProps {
  projects: Project[];
  tasks: Task[];
  onProjectClick: (id: string) => void;
  onCreateProject?: () => void;
  currency: CurrencyCode;
}

const Dashboard: React.FC<DashboardProps> = ({ projects, tasks, onProjectClick, onCreateProject, currency }) => {
  const stats = [
    { label: 'Active Projects', value: projects.length, icon: FolderOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Pending Tasks', value: tasks.filter(t => t.status !== TaskStatus.DONE).length, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Completed', value: tasks.filter(t => t.status === TaskStatus.DONE).length, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Urgent Tickets', value: 2, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  const chartData = projects.map(p => ({
    name: p.name.split(' ')[0],
    budget: p.budgetAllocated,
    spent: getTotalProjectSpend(p)
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
          <p className="text-slate-500">Overview of your projects and tasks</p>
        </div>
        {onCreateProject && (
          <button 
            onClick={onCreateProject}
            className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={20} />
            Create Project
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                <stat.icon size={24} />
              </div>
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg flex items-center gap-1">
                +12% <ArrowUpRight size={12} />
              </span>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
            <p className="text-2xl font-bold text-slate-800 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 text-center lg:text-left">Financial Allocation vs Expenditure (Live)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  formatter={(value: number) => formatCurrency(value, currency)}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="budget" name="Allocated" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="spent" name="Spent (Actual + Accrued)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Recent Projects</h3>
          <div className="space-y-4">
            {projects.slice(0, 3).map(proj => {
              const totalSpent = getTotalProjectSpend(proj);
              const progress = Math.round((totalSpent / proj.budgetAllocated) * 100);
              return (
                <div 
                  key={proj.id} 
                  onClick={() => onProjectClick(proj.id)}
                  className="group p-4 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{proj.name}</span>
                    <span className="text-xs text-slate-400 font-medium">{formatCurrency(totalSpent, currency)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${progress > 100 ? 'bg-rose-500' : 'bg-blue-600'}`} 
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Budget Used</span>
                    <span className={`text-[10px] font-bold ${progress > 100 ? 'text-rose-600' : 'text-slate-600'}`}>{progress}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
