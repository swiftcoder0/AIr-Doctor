import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  Lock,
  Building,
  Plane,
  User,
  Copy,
  Check,
  Filter,
} from 'lucide-react';
import { CommandApprovalItem, ApprovalActionResponse } from '../../types/aircraft';
import { api } from '../../services/apiClient';
import { CommandApprovalsModal } from './CommandApprovalsModal';

interface CommandApprovalsViewProps {
  onNavigateToCommandCenter: () => void;
}

export const CommandApprovalsView: React.FC<CommandApprovalsViewProps> = ({
  onNavigateToCommandCenter,
}) => {
  const [approvals, setApprovals] = useState<CommandApprovalItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [selectedApproval, setSelectedApproval] = useState<CommandApprovalItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadApprovals = () => {
    api.getCommanderApprovals().then((data) => {
      if (data) setApprovals(data);
    });
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const handleOpenModal = (app: CommandApprovalItem) => {
    setSelectedApproval(app);
    setIsModalOpen(true);
  };

  const handleDecisionComplete = (res: ApprovalActionResponse) => {
    setToastMessage(res.message);
    setTimeout(() => setToastMessage(null), 5000);
    loadApprovals();
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredApprovals = approvals.filter((a) => {
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PENDING' && a.status === 'PENDING') ||
      (statusFilter === 'APPROVED' && a.status === 'APPROVED') ||
      (statusFilter === 'REJECTED' && (a.status === 'REJECTED' || a.status === 'CLARIFICATION_REQUESTED'));
    const matchesPriority = priorityFilter === 'ALL' || a.priority === priorityFilter;
    return matchesStatus && matchesPriority;
  });

  const pendingCount = approvals.filter((a) => a.status === 'PENDING').length;
  const approvedCount = approvals.filter((a) => a.status === 'APPROVED').length;
  const rejectedCount = approvals.filter((a) => a.status === 'REJECTED' || a.status === 'CLARIFICATION_REQUESTED').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-150 text-slate-800">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-8 z-50 p-4 bg-slate-900 border border-emerald-500/50 rounded-2xl text-xs text-white shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-4">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4" />
          </div>
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>Command Approvals</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
              {pendingCount} PENDING ACTION
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational sign-offs, fast-track procurements, RTS flight releases & cross-base transfers
          </p>
        </div>

        <button
          onClick={onNavigateToCommandCenter}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          <span>Return to Command Center</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">{pendingCount}</div>
            <div className="text-xs font-bold text-slate-500 mt-1">Pending Decisions</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">{approvedCount}</div>
            <div className="text-xs font-bold text-slate-500 mt-1">Authorized</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">{rejectedCount}</div>
            <div className="text-xs font-bold text-slate-500 mt-1">Rejected / Clarified</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold text-slate-900 leading-none">SHA-256 CHAIN</div>
            <div className="text-[11px] font-semibold text-emerald-700 mt-1">Immutable Decision Ledger</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-wrap items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === st ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5 text-xs font-bold">
          <span className="text-slate-400 uppercase text-[10px] tracking-wider">Priority:</span>
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((pr) => (
            <button
              key={pr}
              onClick={() => setPriorityFilter(pr)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                priorityFilter === pr
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {pr}
            </button>
          ))}
        </div>
      </div>

      {/* Approvals List Cards */}
      <div className="space-y-3">
        {filteredApprovals.map((app) => {
          const isPending = app.status === 'PENDING';
          const isApproved = app.status === 'APPROVED';
          return (
            <div
              key={app.id}
              className={`bg-white rounded-2xl border p-5 transition-all shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md ${
                isPending ? 'border-l-4 border-l-blue-600 border-slate-200' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-blue-600">{app.id}</span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        app.priority === 'CRITICAL'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : app.priority === 'HIGH'
                          ? 'bg-orange-50 text-orange-700 border-orange-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {app.priority} PRIORITY
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {app.type}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isPending
                          ? 'bg-amber-100 text-amber-800'
                          : isApproved
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{app.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{app.justification}</p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1 flex-wrap">
                    <span className="flex items-center gap-1 font-medium">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {app.baseName}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Plane className="w-3.5 h-3.5 text-slate-400" />
                      {app.aircraft}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {app.requester}
                    </span>
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {app.date}
                    </span>
                  </div>

                  {/* If decided, show ledger block receipt */}
                  {app.ledgerHash && (
                    <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-emerald-700">
                      <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Ledger Block: {app.ledgerEntryId} (SHA-256: {app.ledgerHash.slice(0, 16)}...)</span>
                      <button
                        onClick={() => copyHash(app.ledgerHash!)}
                        className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-800"
                        title="Copy Hash"
                      >
                        {copiedHash === app.ledgerHash ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => handleOpenModal(app)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isPending
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    <span>{isPending ? 'Review & Authorize' : 'Inspect Audit Block'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Review Modal */}
      <CommandApprovalsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        approval={selectedApproval}
        onDecisionComplete={handleDecisionComplete}
      />
    </div>
  );
};
