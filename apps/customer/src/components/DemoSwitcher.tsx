import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Check, ExternalLink } from 'lucide-react';

export const DemoSwitcher: React.FC = () => {
  const { user, switchDemoUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const demoCustomers = [
    { name: 'Aarav Sharma', email: 'aarav.customer@kaamsetu.demo', address: 'B-402, Hiranandani Gardens, Powai, Mumbai' },
    { name: 'Pooja Patel', email: 'pooja.customer@kaamsetu.demo', address: '120 Green Glen Layout, Bellandur, Bengaluru' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-beige/60 hover:bg-brand-beige border border-brand-beigeDark text-charcoal transition-colors"
        title="Switch Demo Customer"
      >
        <Users className="w-3.5 h-3.5 text-brand-primary" />
        <span className="hidden sm:inline">Demo Switcher:</span>
        <span className="font-bold text-brand-primaryDark truncate max-w-[110px]">
          {user?.name || 'Customer'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
            Switch Demo Customer
          </div>

          <div className="space-y-1.5">
            {demoCustomers.map((cust) => {
              const isCurrent = user?.email === cust.email;
              return (
                <button
                  key={cust.email}
                  onClick={async () => {
                    await switchDemoUser(cust.email);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    isCurrent
                      ? 'bg-brand-surface text-brand-primaryDark font-semibold border border-brand-secondary/30'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{cust.name}</div>
                    <div className="text-[11px] text-gray-500 truncate">{cust.address}</div>
                  </div>
                  {isCurrent && <Check className="w-4 h-4 text-brand-primary shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-2.5 border-t border-gray-100">
            <div className="text-[11px] text-gray-500 mb-1.5 font-medium">Worker Side application:</div>
            <a
              href="http://localhost:5174"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between p-2 rounded-lg bg-brand-cream/60 hover:bg-brand-cream border border-brand-creamDark text-xs font-semibold text-brand-primaryDark transition-colors"
            >
              <span>Open Kaam Setu Pro Worker App</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
