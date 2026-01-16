
import React from 'react';
import { CurrencyCode } from '../types';
import { Settings as SettingsIcon, Globe, CreditCard, Bell, Shield } from 'lucide-react';

interface SettingsProps {
  currency: CurrencyCode;
  onCurrencyChange: (code: CurrencyCode) => void;
}

const Settings: React.FC<SettingsProps> = ({ currency, onCurrencyChange }) => {
  const currencies: { code: CurrencyCode; name: string; symbol: string }[] = [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Workspace Settings</h2>
        <p className="text-slate-500">Configure global preferences for your professional environment</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <aside className="space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl font-bold transition-all">
            <Globe size={18} />
            General
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-medium transition-all">
            <CreditCard size={18} />
            Billing
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-medium transition-all">
            <Bell size={18} />
            Notifications
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl font-medium transition-all">
            <Shield size={18} />
            Security
          </button>
        </aside>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Globe size={18} className="text-blue-600" />
              Regional Preferences
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Workspace Currency
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {currencies.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => onCurrencyChange(c.code)}
                      className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                        currency === c.code
                          ? 'border-blue-600 bg-blue-50/50 text-blue-600'
                          : 'border-slate-100 hover:border-slate-200 text-slate-500'
                      }`}
                    >
                      <span className="text-xl font-bold mb-1">{c.symbol}</span>
                      <span className="text-xs font-bold">{c.code}</span>
                      <span className="text-[10px] opacity-60">{c.name}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-4 text-xs text-slate-400 italic">
                  * All existing project budgets and expenses will be displayed in the selected currency.
                </p>
              </div>

              <div className="pt-6 border-t border-slate-50">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Language & Locale
                </label>
                <select className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none">
                  <option>English (United States)</option>
                  <option>English (United Kingdom)</option>
                  <option>Deutsch (Deutschland)</option>
                  <option>日本語 (日本)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
             <div className="relative z-10">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-2">Nexus Pro Plan</h3>
                <p className="text-slate-400 text-sm mb-6">You are currently using the advanced project tracking features.</p>
                <button className="bg-white text-slate-900 px-6 py-2 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors">
                  Upgrade Plan
                </button>
             </div>
             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl -mr-16 -mt-16"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
