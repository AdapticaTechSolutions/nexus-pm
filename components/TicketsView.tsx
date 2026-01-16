
import React from 'react';
import { Ticket, Priority } from '../types';
import { AlertCircle, Clock, CheckCircle2, Search, Filter } from 'lucide-react';

interface TicketsViewProps {
  tickets: Ticket[];
}

const TicketsView: React.FC<TicketsViewProps> = ({ tickets }) => {
  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case Priority.HIGH: return 'bg-amber-100 text-amber-600';
      case Priority.URGENT: return 'bg-rose-100 text-rose-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'resolved': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'pending': return <Clock size={16} className="text-amber-500" />;
      default: return <AlertCircle size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search tickets, inquiries..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50">
            <Filter size={18} />
            Filter
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700">
            New Ticket
          </button>
        </div>
      </div>

      <div className="overflow-hidden border border-slate-100 rounded-2xl shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Reporter</th>
              <th className="px-6 py-4">Priority</th>
              <th className="px-6 py-4 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tickets.map(ticket => (
              <tr key={ticket.id} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(ticket.status)}
                    <span className="text-xs font-bold capitalize text-slate-700">{ticket.status}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600">{ticket.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{ticket.type}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200"></div>
                    <span className="text-xs text-slate-600">{ticket.reporterName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${getPriorityBadge(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <span className="text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tickets.length === 0 && (
          <div className="p-12 text-center text-slate-400">
             No active tickets found for this project.
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketsView;
