
import React from 'react';
import { Team } from '../types';
import { Users, Plus, UserPlus, Trash2 } from 'lucide-react';

interface TeamsManagerProps {
  teams: Team[];
  onUpdateTeams: (teams: Team[]) => void;
}

const TeamsManager: React.FC<TeamsManagerProps> = ({ teams, onUpdateTeams }) => {
  const handleDeleteTeam = (id: string) => {
    if (confirm('Are you sure you want to remove this team? This will not delete project data.')) {
      onUpdateTeams(teams.filter(t => t.id !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-12">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Teams & Talent</h2>
          <p className="text-slate-500">Coordinate experts across your workspace</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
          <Plus size={20} />
          Create Team
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map(team => (
          <div key={team.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Users size={24} />
              </div>
              <button 
                onClick={() => handleDeleteTeam(team.id)}
                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <h3 className="text-lg font-bold text-slate-800 mb-1">{team.name}</h3>
            <p className="text-sm text-slate-400 mb-6">{team.members.length} Members active</p>

            <div className="space-y-3 mb-6">
              {team.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <img 
                      src={`https://picsum.photos/seed/${member.id}/32/32`} 
                      className="w-8 h-8 rounded-full" 
                      alt={member.name} 
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-slate-700">{member.name}</span>
                      {member.role && (
                        <span className="text-[10px] text-slate-400">{member.role}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-300 uppercase">Member</span>
                </div>
              ))}
            </div>

            <button className="w-full py-2 border border-slate-200 rounded-xl text-slate-500 text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-colors">
              <UserPlus size={16} />
              Add Member
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TeamsManager;
