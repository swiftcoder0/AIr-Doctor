import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, ArrowRight } from 'lucide-react';
import { UserRole } from '../../types/aircraft';

interface AccessRestrictedViewProps {
  attemptedRoute: string;
  departmentId: string;
  departmentName: string;
  officer: string;
  serviceId: string;
  role: UserRole;
  permittedLandingRoute: string;
  permittedLandingLabel: string;
  onNavigateHome: () => void;
  onLogout: () => void;
}

export const AccessRestrictedView: React.FC<AccessRestrictedViewProps> = ({
  attemptedRoute,
  departmentName,
  officer,
  serviceId,
  role,
  permittedLandingLabel,
  onNavigateHome,
  onLogout,
}) => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 select-none">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200/90 shadow-xl p-8 text-center space-y-6">
        {/* Security Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8 text-rose-600 animate-pulse" />
        </div>

        {/* Title and Message */}
        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-rose-100 text-rose-800 border border-rose-200">
            RBAC Access Isolation Policy
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Access Not Permitted for This Department
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            Your current authenticated session does not have clearance to view or access the{' '}
            <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
              {attemptedRoute}
            </span>{' '}
            interface.
          </p>
        </div>

        {/* Active Session Context Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left text-xs space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 pb-1">
            Current Authenticated Identity
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Department:</span>
            <span className="font-bold text-slate-800 text-right truncate max-w-[280px]">
              {departmentName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Officer / Personnel:</span>
            <span className="font-bold text-slate-800">{officer}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Service ID:</span>
            <span className="font-mono font-bold text-slate-700">{serviceId}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Security Clearance:</span>
            <span className="font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded text-[11px]">
              {role}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={onNavigateHome}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <span>Return to {permittedLandingLabel}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onLogout}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Switch Department / Re-authenticate</span>
          </button>
        </div>

        {/* Sub-footer */}
        <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
          MoD Cybersecurity Protocol RFC 6238 • Attempt logged to SHA-256 Decision Ledger
        </div>
      </div>
    </div>
  );
};
