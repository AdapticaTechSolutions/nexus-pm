
import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Users, 
  UserCircle, 
  Ticket as TicketIcon, 
  LogOut, 
  Menu,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Plus,
  BarChart3,
  Settings as SettingsIcon
} from 'lucide-react';
import { ViewRole, Project, Task, TaskGroup, Team, Ticket, CurrencyCode } from './types';
import { mockProjects, mockTasks, mockTaskGroups, mockTeams, mockTickets } from './mockData';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import TeamsManager from './components/TeamsManager';
import ClientPortal from './components/ClientPortal';
import Settings from './components/Settings';

const App: React.FC = () => {
  const [role, setRole] = useState<ViewRole>('admin');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');

  // State Management
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [taskGroups, setTaskGroups] = useState<TaskGroup[]>(mockTaskGroups);
  const [teams, setTeams] = useState<Team[]>(mockTeams);
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);

  const activeProject = useMemo(() => 
    projects.find(p => p.id === selectedProjectId), 
    [projects, selectedProjectId]
  );

  const navigateToProject = (id: string) => {
    setSelectedProjectId(id);
    setActiveTab('project-detail');
  };

  const updateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...updates } : p));
  };

  const SidebarItem = ({ id, icon: Icon, label, disabled = false }: any) => (
    <button
      onClick={() => !disabled && setActiveTab(id)}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        activeTab === id 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
          : 'text-slate-500 hover:bg-white hover:text-blue-600'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <Icon size={20} />
      {isSidebarOpen && <span className="font-medium">{label}</span>}
    </button>
  );

  const renderContent = () => {
    if (role === 'client') {
      return (
        <ClientPortal 
          projects={projects} 
          tickets={tickets} 
          tasks={tasks}
          onProjectClick={navigateToProject} 
          currency={currency}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard projects={projects} tasks={tasks} onProjectClick={navigateToProject} currency={currency} />;
      case 'projects':
        return <ProjectList projects={projects} tasks={tasks} onProjectClick={navigateToProject} currency={currency} />;
      case 'project-detail':
        return activeProject ? (
          <ProjectDetail 
            project={activeProject} 
            tasks={tasks.filter(t => t.projectId === activeProject.id)}
            taskGroups={taskGroups.filter(tg => tg.projectId === activeProject.id)}
            teams={teams}
            tickets={tickets.filter(t => t.projectId === activeProject.id)}
            onUpdateTasks={setTasks}
            onUpdateProject={updateProject}
            currency={currency}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-[60vh] text-slate-400">
            <FolderKanban size={64} className="mb-4 opacity-20" />
            <p>Select a project to view details</p>
          </div>
        );
      case 'teams':
        return <TeamsManager teams={teams} onUpdateTeams={setTeams} />;
      case 'settings':
        return <Settings currency={currency} onCurrencyChange={setCurrency} />;
      default:
        return <Dashboard projects={projects} tasks={tasks} onProjectClick={navigateToProject} currency={currency} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-slate-50 border-r border-slate-200 transition-all duration-300 flex flex-col`}
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <div className="flex items-center gap-2 font-bold text-xl text-blue-700">
              <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white italic">N</div>
              <span>Nexus<span className="text-slate-900">PM</span></span>
            </div>
          )}
          {!isSidebarOpen && (
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-white italic mx-auto font-bold">N</div>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-2 mt-4">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 mb-2">Main Menu</div>
          <SidebarItem id="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem id="projects" icon={FolderKanban} label="Projects" />
          <SidebarItem id="teams" icon={Users} label="Team Members" />
          <SidebarItem id="settings" icon={SettingsIcon} label="Settings" />
          
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 mt-6 mb-2">Workspace</div>
          <SidebarItem id="project-detail" icon={ChevronRight} label="Active Project" disabled={!selectedProjectId} />
          <SidebarItem id="reports" icon={BarChart3} label="Analytics" disabled />
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-4">
          <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700">
                <UserCircle size={20} />
              </div>
              {isSidebarOpen && (
                <div className="flex flex-col">
                  <span className="text-xs font-bold truncate">Alex Rivera</span>
                  <span className="text-[10px] text-slate-500 capitalize">{role}</span>
                </div>
              )}
            </div>
            {isSidebarOpen && (
              <button 
                onClick={() => setRole(role === 'admin' ? 'client' : 'admin')}
                className="w-full text-center py-1 text-[10px] font-semibold text-blue-600 hover:underline"
              >
                Switch to {role === 'admin' ? 'Client Portal' : 'Admin View'}
              </button>
            )}
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-red-500 transition-colors">
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
            >
              <Menu size={20} />
            </button>
            <h1 className="font-semibold text-slate-800 capitalize">
              {role === 'client' ? 'Client Portal' : activeTab.replace('-', ' ')}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
              <TrendingUp size={16} />
              <span>Project Velocity: 84%</span>
            </div>
            <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 relative">
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
              <TicketIcon size={20} />
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
