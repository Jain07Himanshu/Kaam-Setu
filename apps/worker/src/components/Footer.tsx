import React from 'react';
import { HardHat, ShieldCheck, DollarSign, Clock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-gray-200/80 bg-white text-charcoal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-primary flex items-center justify-center text-white">
              <HardHat className="w-4 h-4 text-brand-cream" />
            </div>
            <span className="font-extrabold text-charcoal">
              Hyper<span className="text-brand-primary">Local</span> Pro
            </span>
            <span className="text-gray-300">|</span>
            <span>Empowering Independent Trade Professionals</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
              <span>Direct Payouts</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-brand-primary" />
              <span>Zero Middleman Delay</span>
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-brand-primary" />
              <span>Full Quote Value Retained</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
