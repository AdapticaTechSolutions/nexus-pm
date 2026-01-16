
import React, { useState } from 'react';
import { Project, BudgetExpense, CurrencyCode, Team, ResourceAllocation } from '../types';
import { DollarSign, TrendingUp, Wallet, Plus, Trash2, ReceiptText, PieChart, Users, Zap } from 'lucide-react';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';
import { getTotalProjectSpend, calculateAccruedResourceCosts, calculateMonthsElapsed } from '../utils/financials';

interface BudgetViewProps {
  project: Project;
  onUpdateProject: (projectId: string, updates: Partial<Project>) => void;
  currency: CurrencyCode;
  teams: Team[];
}

const BudgetView: React.FC<BudgetViewProps> = ({ project, onUpdateProject, currency, teams }) => {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddResource, setShowAddResource] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: '', amount: '', description: '' });
  const [newResource, setNewResource] = useState({ teamId: '', rate: '' });

  const totalSpent = getTotalProjectSpend(project);
  const accruedResources = calculateAccruedResourceCosts(project);
  const spentPercent = Math.round((totalSpent / project.budgetAllocated) * 100);
  const remaining = project.budgetAllocated - totalSpent;
  const symbol = getCurrencySymbol(currency);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newExpense.amount);
    if (isNaN(amount)) return;

    const expense: BudgetExpense = {
      id: `e-${Date.now()}`,
      category: newExpense.category,
      amount: amount,
      date: new Date().toISOString().split('T')[0],
      description: newExpense.description
    };

    const updatedExpenses = [...(project.expenses || []), expense];
    const totalManualSpent = updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0);

    onUpdateProject(project.id, {
      expenses: updatedExpenses,
      budgetSpent: totalManualSpent
    });

    setNewExpense({ category: '', amount: '', description: '' });
    setShowAddExpense(false);
  };

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(newResource.rate);
    if (!newResource.teamId || isNaN(rate)) return;

    const allocation: ResourceAllocation = {
      id: `ra-${Date.now()}`,
      teamId: newResource.teamId,
      monthlyRate: rate,
      startDate: new Date().toISOString().split('T')[0]
    };

    onUpdateProject(project.id, {
      resourceAllocations: [...(project.resourceAllocations || []), allocation]
    });

    setNewResource({ teamId: '', rate: '' });
    setShowAddResource(false);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const updatedExpenses = project.expenses.filter(e => e.id !== expenseId);
    const totalManualSpent = updatedExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    onUpdateProject(project.id, {
      expenses: updatedExpenses,
      budgetSpent: totalManualSpent
    });
  };

  const handleDeleteResource = (allocId: string) => {
    onUpdateProject(project.id, {
      resourceAllocations: project.resourceAllocations.filter(a => a.id !== allocId)
    });
  };

  return (
    <div className="space-y-10">
      {/* Financial Health Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Total Allocation</p>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(project.budgetAllocated, currency)}</p>
          <div className="mt-3 w-full h-1 bg-slate-200 rounded-full overflow-hidden">
             <div className="h-full bg-blue-600 w-full opacity-30"></div>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Manual Expenses</p>
          <p className="text-2xl font-bold text-slate-900">{formatCurrency(project.budgetSpent || 0, currency)}</p>
          <p className="text-[10px] text-slate-400 mt-1 italic">One-time costs</p>
        </div>

        <div className="bg-blue-600 p-6 rounded-3xl shadow-lg shadow-blue-100 text-white">
          <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mb-1">Resource Burn</p>
          <p className="text-2xl font-bold">{formatCurrency(accruedResources, currency)}</p>
          <p className="text-[10px] text-blue-200 mt-1 flex items-center gap-1">
            <Zap size={10} /> Auto-accruing monthly
          </p>
        </div>

        <div className={`p-6 rounded-3xl border ${remaining < 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Remaining</p>
          <p className={`text-2xl font-bold ${remaining < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {formatCurrency(remaining, currency)}
          </p>
          <div className="mt-3 w-full h-1 bg-slate-200 rounded-full overflow-hidden">
             <div 
               className={`h-full ${spentPercent > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
               style={{ width: `${Math.min(spentPercent, 100)}%` }}
             ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Resource Allocation & Burn Tracker */}
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Users size={18} className="text-blue-600" />
                Monthly Resource Burn
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Auto-payments based on monthly rates</p>
            </div>
            <button 
              onClick={() => setShowAddResource(!showAddResource)}
              className="bg-slate-900 text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <Plus size={18} />
            </button>
          </div>

          {showAddResource && (
            <form onSubmit={handleAddResource} className="mb-6 p-4 bg-blue-50/50 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="grid grid-cols-2 gap-3">
                <select 
                  required
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20"
                  value={newResource.teamId}
                  onChange={e => setNewResource({...newResource, teamId: e.target.value})}
                >
                  <option value="">Select Team...</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <input 
                  required
                  type="number"
                  placeholder={`Rate (${symbol}/mo)`}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20"
                  value={newResource.rate}
                  onChange={e => setNewResource({...newResource, rate: e.target.value})}
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white text-xs font-bold py-2 rounded-lg">Confirm Allocation</button>
            </form>
          )}

          <div className="space-y-4 flex-1">
            {(project.resourceAllocations || []).length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm italic">No resource burn configured.</div>
            ) : (
              project.resourceAllocations.map(alloc => {
                const team = teams.find(t => t.id === alloc.teamId);
                const elapsed = calculateMonthsElapsed(alloc.startDate);
                const accrued = elapsed * alloc.monthlyRate;
                
                return (
                  <div key={alloc.id} className="group p-5 bg-slate-50 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-white transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                            <Users size={20} />
                         </div>
                         <div>
                            <p className="text-sm font-bold text-slate-800">{team?.name || 'Unknown Team'}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                               {formatCurrency(alloc.monthlyRate, currency)} / month
                            </p>
                         </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteResource(alloc.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-end border-t border-slate-100 pt-4">
                       <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Elapsed</p>
                          <p className="text-sm font-bold text-slate-700">{elapsed.toFixed(1)} Months</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Accrued Spend</p>
                          <p className="text-sm font-bold text-blue-600">{formatCurrency(accrued, currency)}</p>
                       </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <div className="mt-8 bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative">
             <div className="relative z-10 flex justify-between items-center">
                <div>
                   <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Monthly Burn</p>
                   <p className="text-2xl font-bold">
                      {formatCurrency(project.resourceAllocations?.reduce((s,a) => s + a.monthlyRate, 0) || 0, currency)}
                   </p>
                </div>
                <div className="text-right">
                   <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">Next Auto-Bill</p>
                   <p className="text-sm font-bold">In 14 Days</p>
                </div>
             </div>
             <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/20 blur-2xl -mr-12 -mt-12"></div>
          </div>
        </div>

        {/* Manual Expense Ledger */}
        <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ReceiptText size={18} className="text-blue-600" />
                Manual Expense Ledger
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Assets, software, and external consulting</p>
            </div>
            <button 
              onClick={() => setShowAddExpense(!showAddExpense)}
              className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
            >
              <Plus size={18} />
            </button>
          </div>

          {showAddExpense && (
            <form onSubmit={handleAddExpense} className="mb-6 p-4 bg-slate-50 rounded-2xl space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="grid grid-cols-2 gap-3">
                <input 
                  required
                  placeholder="Category"
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20"
                  value={newExpense.category}
                  onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                />
                <input 
                  required
                  type="number"
                  placeholder={`Amount (${symbol})`}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20"
                  value={newExpense.amount}
                  onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                />
              </div>
              <input 
                placeholder="Description..."
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500/20"
                value={newExpense.description}
                onChange={e => setNewExpense({...newExpense, description: e.target.value})}
              />
              <button type="submit" className="w-full bg-slate-800 text-white text-xs font-bold py-2 rounded-lg">Log Expense</button>
            </form>
          )}

          <div className="flex-1 overflow-y-auto max-h-[500px] custom-scrollbar pr-2">
            <div className="space-y-3">
              {(project.expenses || []).length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm italic">No manual expenses yet.</div>
              ) : (
                [...(project.expenses || [])].reverse().map(exp => (
                  <div key={exp.id} className="group flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-400 shadow-sm">
                        <DollarSign size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{exp.category}</p>
                        <p className="text-[10px] text-slate-400">{exp.description || 'General expense'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-800">{formatCurrency(exp.amount, currency)}</p>
                        <p className="text-[10px] text-slate-400">{new Date(exp.date).toLocaleDateString()}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-rose-500 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetView;
