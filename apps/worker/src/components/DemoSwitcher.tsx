import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HardHat, Check, ExternalLink } from 'lucide-react';

export const DemoSwitcher: React.FC = () => {
  const { user, switchDemoWorker } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const demoWorkers = [
    { name: 'Suresh Kumar', email: 'suresh.plumber@kaamsetu.demo', trade: 'Master Plumber (10 yrs)' },
    { name: 'Priya Sharma', email: 'priya.electric@kaamsetu.demo', trade: 'Certified Electrician (7 yrs)' },
    { name: 'Rajesh Verma', email: 'rajesh.cleaning@kaamsetu.demo', trade: 'Deep Cleaning Specialist' },
    { name: 'Anita Roy', email: 'anita.appliances@kaamsetu.demo', trade: 'Appliance & AC Tech' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-cream/70 hover:bg-brand-cream border border-brand-creamDark text-charcoal transition-colors"
        title="Switch Demo Worker"
      >
        <HardHat className="w-3.5 h-3.5 text-brand-primary" />
        <span className="hidden sm:inline">Worker:</span>
        <span className="font-bold text-brand-primaryDark truncate max-w-[110px]">
          {user?.name || 'Worker'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Switch Demo Worker Pro
          </div>

          <div className="space-y-1.5">
            {demoWorkers.map((w) => {
              const isCurrent = user?.email === w.email;
              return (
                <button
                  key={w.email}
                  onClick={async () => {
                    await switchDemoWorker(w.email);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    isCurrent
                      ? 'bg-brand-surface text-brand-primaryDark font-semibold border border-brand-secondary/30'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{w.name}</div>
                    <div className="text-[11px] text-gray-500">{w.trade}</div>
                  </div>
                  {isCurrent && <Check className="w-4 h-4 text-brand-primary shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-2.5 border-t border-gray-100">
            <div className="text-[11px] text-gray-500 mb-1.5 font-medium">Customer Side application:</div>
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-2 rounded-lg bg-brand-surface hover:bg-brand-surface/80 border border-brand-secondary/30 text-xs font-semibold text-brand-primaryDark transition-colors"
            >
              <span>Open Kaam Setu Customer App</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
