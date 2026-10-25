import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Check, HardHat, User as UserIcon } from 'lucide-react';

export const DemoSwitcher: React.FC = () => {
  const { user, switchDemoUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const demoCustomers = [
    { name: 'Aarav Sharma', email: 'aarav.customer@kaamsetu.demo', role: 'Customer', desc: 'Powai, Mumbai' },
    { name: 'Pooja Patel', email: 'pooja.customer@kaamsetu.demo', role: 'Customer', desc: 'Bellandur, Bengaluru' },
  ];

  const demoWorkers = [
    { name: 'Suresh Kumar', email: 'suresh.plumber@kaamsetu.demo', role: 'Master Plumber', desc: '10 yrs exp · ₹399/hr' },
    { name: 'Priya Sharma', email: 'priya.electric@kaamsetu.demo', role: 'Electrician', desc: '7 yrs exp · ₹450/hr' },
    { name: 'Rajesh Verma', email: 'rajesh.cleaning@kaamsetu.demo', role: 'Cleaning Expert', desc: '5 yrs exp · ₹349/hr' },
    { name: 'Anita Roy', email: 'anita.appliances@kaamsetu.demo', role: 'Appliance & AC', desc: '6 yrs exp · ₹499/hr' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-beige/60 hover:bg-brand-beige border border-brand-beigeDark text-charcoal transition-colors shadow-sm"
        title="Switch Demo Persona"
      >
        {user?.role === 'WORKER' ? (
          <HardHat className="w-3.5 h-3.5 text-brand-primary" />
        ) : (
          <Users className="w-3.5 h-3.5 text-brand-primary" />
        )}
        <span className="hidden sm:inline">Demo Switcher:</span>
        <span className="font-bold text-brand-primaryDark truncate max-w-[110px]">
          {user?.name || 'Switch Role'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[85vh] overflow-y-auto">
          {/* Customers Section */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
            <UserIcon className="w-3.5 h-3.5 text-brand-primary" />
            <span>Customer Personas</span>
          </div>

          <div className="space-y-1.5 mb-3.5">
            {demoCustomers.map((cust) => {
              const isCurrent = user?.email === cust.email;
              return (
                <button
                  key={cust.email}
                  onClick={async () => {
                    await switchDemoUser(cust.email);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    isCurrent
                      ? 'bg-brand-surface text-brand-primaryDark font-bold border border-brand-secondary/40'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <div className="font-bold text-charcoal">{cust.name}</div>
                    <div className="text-[11px] text-gray-500">{cust.desc}</div>
                  </div>
                  {isCurrent && <Check className="w-4 h-4 text-brand-primary shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Trade Pros Section */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1 pt-2 border-t border-gray-100">
            <HardHat className="w-3.5 h-3.5 text-brand-primary" />
            <span>Worker Pro Personas</span>
          </div>

          <div className="space-y-1.5">
            {demoWorkers.map((wrk) => {
              const isCurrent = user?.email === wrk.email;
              return (
                <button
                  key={wrk.email}
                  onClick={async () => {
                    await switchDemoUser(wrk.email);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    isCurrent
                      ? 'bg-brand-surface text-brand-primaryDark font-bold border border-brand-secondary/40'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <div className="font-bold text-charcoal flex items-center gap-1.5">
                      <span>{wrk.name}</span>
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-brand-cream text-brand-primaryDark border border-brand-creamDark">
                        {wrk.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500">{wrk.desc}</div>
                  </div>
                  {isCurrent && <Check className="w-4 h-4 text-brand-primary shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
