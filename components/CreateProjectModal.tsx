import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, Users } from 'lucide-react';
import { CurrencyCode, Team } from '../types';
import { createProject, CreateProjectPayload } from '../lib/supabase/services/projects';
import { getTeams } from '../lib/supabase/services/teams';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currency: CurrencyCode;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currency,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [formData, setFormData] = useState<Partial<CreateProjectPayload>>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    budgetAllocated: 0,
    currency: currency,
    clientId: '',
    assignedTeamIds: [],
  });

  useEffect(() => {
    if (isOpen) {
      loadTeams();
    }
  }, [isOpen]);

  const loadTeams = async () => {
    try {
      const teamsData = await getTeams();
      setTeams(teamsData);
    } catch (err) {
      console.error('Error loading teams:', err);
      setError('Failed to load teams');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!formData.name || !formData.description || !formData.startDate || 
          !formData.endDate || !formData.clientId || !formData.budgetAllocated) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        setError('End date must be after start date');
        setLoading(false);
        return;
      }

      await createProject({
        name: formData.name!,
        description: formData.description!,
        startDate: formData.startDate!,
        endDate: formData.endDate!,
        budgetAllocated: formData.budgetAllocated!,
        currency: formData.currency || currency,
        clientId: formData.clientId!,
        assignedTeamIds: formData.assignedTeamIds || [],
      });

      onSuccess();
      onClose();
      // Reset form
      setFormData({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        budgetAllocated: 0,
        currency: currency,
        clientId: '',
        assignedTeamIds: [],
      });
    } catch (err: any) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleTeamToggle = (teamId: string) => {
    const current = formData.assignedTeamIds || [];
    if (current.includes(teamId)) {
      setFormData({
        ...formData,
        assignedTeamIds: current.filter(id => id !== teamId),
      });
    } else {
      setFormData({
        ...formData,
        assignedTeamIds: [...current, teamId],
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">Create New Project</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Project Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                <Calendar size={16} className="inline mr-2" />
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                <Calendar size={16} className="inline mr-2" />
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              <DollarSign size={16} className="inline mr-2" />
              Budget Allocated *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.budgetAllocated}
              onChange={(e) => setFormData({ ...formData, budgetAllocated: parseFloat(e.target.value) || 0 })}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Client ID *
            </label>
            <input
              type="text"
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              placeholder="Enter client UUID"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-slate-400 mt-1">Enter the UUID of the client for this project</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              <Users size={16} className="inline mr-2" />
              Assign Teams
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-4">
              {teams.length === 0 ? (
                <p className="text-sm text-slate-400">No teams available</p>
              ) : (
                teams.map((team) => (
                  <label
                    key={team.id}
                    className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.assignedTeamIds?.includes(team.id) || false}
                      onChange={() => handleTeamToggle(team.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">{team.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
