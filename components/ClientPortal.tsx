
/**
 * Client Portal Component
 * 
 * Provides read-only access for clients to:
 * - View project progress and timelines
 * - See milestones and deliverables
 * - Submit tickets, inquiries, and backlog requests
 * - View project financials (spend to date)
 * 
 * Clients have read-only access except for ticket submission.
 * 
 * @module components/ClientPortal
 */

import React, { useState } from 'react';
import { Project, Ticket, Task, TaskStatus, CurrencyCode, TicketType, Priority } from '../types';
import { 
  BarChart3, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  ArrowRight,
  Plus,
  X
} from 'lucide-react';
import { formatCurrency } from '../utils/currency';
import { getTotalProjectSpend } from '../utils/financials';
import { ticketService } from '../core/services/TicketService';
import { getAppConfig } from '../config/AppConfig';

interface ClientPortalProps {
  projects: Project[];
  tickets: Ticket[];
  tasks: Task[];
  onProjectClick: (id: string) => void;
  currency: CurrencyCode;
  onTicketCreated?: (ticket: Ticket) => void; // Callback when ticket is created
}

const ClientPortal: React.FC<ClientPortalProps> = ({ 
  projects, 
  tickets, 
  tasks, 
  onProjectClick, 
  currency,
  onTicketCreated 
}) => {
  const config = getAppConfig();
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    type: TicketType.INQUIRY as TicketType,
    title: '',
    description: '',
    priority: Priority.MEDIUM as Priority,
    projectId: '',
  });

  /**
   * Handle ticket submission
   * Validates input and creates ticket using ticket service
   */
  const handleSubmitTicket = () => {
    if (!ticketForm.title || !ticketForm.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const ticket = ticketService.createTicket({
        ...ticketForm,
        reporterName: 'Client User', // In real app, get from auth context
        reporterEmail: 'client@example.com',
      });

      // Call callback if provided
      if (onTicketCreated) {
        onTicketCreated(ticket);
      }

      // Reset form
      setTicketForm({
        type: TicketType.INQUIRY,
        title: '',
        description: '',
        priority: Priority.MEDIUM,
        projectId: '',
      });
      setShowTicketForm(false);
      alert('Ticket submitted successfully!');
    } catch (error) {
      alert(`Error submitting ticket: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  return (
    <div className="max-w-7xl mx-auto space-y-12">
      <div className="bg-slate-900 rounded-[40px] p-12 text-white relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-4xl font-bold mb-4">Welcome back, Sarah.</h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Your projects are currently on track. We've completed {tasks.filter(t => t.status === TaskStatus.DONE).length} tasks this week and are moving into the final phase of the Apollo rebranding.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 blur-[80px] rounded-full -ml-32 -mb-32"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
            <TrendingUp size={24} />
          </div>
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Overall Progress</h3>
          <p className="text-3xl font-bold text-slate-900 mb-4">76%</p>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
             <div className="bg-blue-600 h-full w-[76%] rounded-full"></div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
            <CheckCircle2 size={24} />
          </div>
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Milestones Hit</h3>
          <p className="text-3xl font-bold text-slate-900">14 / 18</p>
          <p className="text-xs text-slate-400 mt-2">Next milestone: UX Handoff</p>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-6">
            <MessageSquare size={24} />
          </div>
          <h3 className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2">Inquiries</h3>
          <p className="text-3xl font-bold text-slate-900">{tickets.length}</p>
          {config.features.clientTicketingEnabled && (
            <button 
              onClick={() => setShowTicketForm(true)}
              className="text-amber-600 text-xs font-bold hover:underline mt-2"
            >
              Submit New Request
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <section>
          <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
             <BarChart3 className="text-blue-600" /> My Projects
          </h3>
          <div className="space-y-4">
            {projects.map(proj => (
              <div 
                key={proj.id} 
                className="bg-white p-6 rounded-3xl border border-slate-100 hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => onProjectClick(proj.id)}
              >
                <div className="flex justify-between items-center">
                   <div>
                      <h4 className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{proj.name}</h4>
                      <p className="text-sm text-slate-400">Target Delivery: {new Date(proj.endDate).toLocaleDateString()}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Spent to date</p>
                      <p className="text-sm font-bold text-slate-700">{formatCurrency(getTotalProjectSpend(proj), currency)}</p>
                   </div>
                   <ArrowRight size={20} className="text-slate-200 group-hover:text-blue-600 transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
             <Clock className="text-amber-600" /> Recent Activity
          </h3>
          <div className="bg-white rounded-3xl border border-slate-100 p-8 space-y-8">
            <div className="relative">
              <div className="absolute left-[15px] top-2 bottom-0 w-px bg-slate-100"></div>
              {[
                { title: 'New deliverable uploaded: Brand Book v2', time: '2 hours ago', type: 'upload' },
                { title: 'Task completed: Homepage SEO optimization', time: '5 hours ago', type: 'task' },
                { title: 'Sarah Jenkins raised a ticket', time: 'Yesterday', type: 'ticket' },
              ].map((activity, idx) => (
                <div key={idx} className="flex gap-6 mb-8 relative z-10">
                   <div className="w-8 h-8 bg-white border border-slate-100 rounded-full flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                   </div>
                   <div>
                      <p className="text-sm font-bold text-slate-800">{activity.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{activity.time}</p>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Ticket Submission Modal */}
      {showTicketForm && config.features.clientTicketingEnabled && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900">Submit New Ticket</h3>
              <button
                onClick={() => setShowTicketForm(false)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Type
                </label>
                <select
                  value={ticketForm.type}
                  onChange={(e) => setTicketForm({ ...ticketForm, type: e.target.value as TicketType })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={TicketType.INQUIRY}>Inquiry</option>
                  <option value={TicketType.ISSUE}>Issue</option>
                  <option value={TicketType.FEATURE_REQUEST}>Feature Request</option>
                  <option value={TicketType.BACKLOG_ITEM}>Backlog Item</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Project (Optional)
                </label>
                <select
                  value={ticketForm.projectId}
                  onChange={(e) => setTicketForm({ ...ticketForm, projectId: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a project...</option>
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id}>{proj.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Priority
                </label>
                <select
                  value={ticketForm.priority}
                  onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as Priority })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={Priority.LOW}>Low</option>
                  <option value={Priority.MEDIUM}>Medium</option>
                  <option value={Priority.HIGH}>High</option>
                  <option value={Priority.URGENT}>Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={ticketForm.title}
                  onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of your request"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Provide detailed information about your request..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSubmitTicket}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Submit Ticket
                </button>
                <button
                  onClick={() => setShowTicketForm(false)}
                  className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;
