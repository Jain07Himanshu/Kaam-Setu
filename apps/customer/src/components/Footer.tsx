import React from 'react';
import { Wrench, ShieldCheck, HeartHandshake, Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-20 border-t border-gray-200/80 bg-white text-charcoal">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white">
                <Wrench className="w-4 h-4 text-brand-cream" />
              </div>
              <span className="font-extrabold text-lg text-charcoal">
                Hyper<span className="text-brand-primary">Local</span>
              </span>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Your Neighborhood. Connected. Empowering local communities with transparent, reliable on-demand household services.
            </p>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Platform Guarantee</h5>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-primary shrink-0" />
                <span>Verified Trade Pros</span>
              </li>
              <li className="flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-brand-primary shrink-0" />
                <span>Fair Transparent Quotes</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-brand-primary shrink-0" />
                <span>Real-Time Matching</span>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Popular Categories</h5>
            <div className="grid grid-cols-2 gap-1.5 text-xs text-gray-600">
              <span>Plumbing</span>
              <span>Electrical</span>
              <span>Home Cleaning</span>
              <span>Appliance Repair</span>
              <span>Carpentry</span>
              <span>Painting</span>
            </div>
          </div>

          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Hackathon Prototype</h5>
            <div className="p-3 rounded-xl bg-brand-cream/50 border border-brand-creamDark text-xs text-gray-700 space-y-1">
              <div className="font-semibold text-brand-primaryDark">Connected Monorepo</div>
              <div className="text-[11px] text-gray-600">
                Shared PostgreSQL/Prisma DB & Socket.IO events connecting Customer & Worker portals.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-3">
          <div>© 2026 HyperLocal Platform. Built for Local Neighborhood Empowerment.</div>
          <div className="flex items-center gap-4">
            <span className="hover:text-gray-600 cursor-pointer">Privacy & Data Safeguards</span>
            <span className="hover:text-gray-600 cursor-pointer">Terms of Service</span>
            <span className="hover:text-gray-600 cursor-pointer">Fair Matching Charter</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
