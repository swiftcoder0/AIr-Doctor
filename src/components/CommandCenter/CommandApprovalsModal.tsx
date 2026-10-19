import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Plane,
  Building,
  User,
  Clock,
  DollarSign,
  FileText,
  Lock,
  Copy,
  Check,
} from 'lucide-react';
import { CommandApprovalItem, ApprovalActionResponse } from '../../types/aircraft';
import { api } from '../../services/apiClient';

interface CommandApprovalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  approval: CommandApprovalItem | null;
  onDecisionComplete: (response: ApprovalActionResponse) => void;
}

export const CommandApprovalsModal: React.FC<CommandApprovalsModalProps> = ({
  isOpen,
  onClose,
  approval,
  onDecisionComplete,
}) => {
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<boolean>(false);

  if (!isOpen || !approval) return null;

  const isPending = approval.status === 'PENDING';

  const handleAction = async (actionType: 'APPROVE' | 'REJECT' | 'CLARIFY') => {
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const rationale = notes.trim() || `${actionType} authorized by Air Fleet Commander.`;
      const res = await api.actionCommanderApproval(approval.id, {
        action: actionType,
        notes: rationale,
        officer_name: 'Wing Cmdr. Aditya (Fleet Commander)',
        officer_role: 'Commander',
      });
      onDecisionComplete(res);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit commander decision. Check RBAC permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyHashToClipboard = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-500/10 text-red-700 border-red-300';
      case 'HIGH':
        return 'bg-orange-500/10 text-orange-700 border-orange-300';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-700 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-blue-400">{approval.id}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadge(
                    approval.priority
                  )}`}
                >
                  {approval.priority} PRIORITY
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                  {approval.type}
                </span>
              </div>
              <h2 className="text-sm font-bold text-white mt-1 leading-snug">{approval.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
          {/* Key Parameters 4-Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                <Building className="w-3 h-3 text-slate-600" /> Operating Base
              </div>
              <div className="font-bold text-slate-900 mt-1 truncate">{approval.baseName}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                <Plane className="w-3 h-3 text-slate-600" /> Target Airframe
              </div>
              <div className="font-bold text-slate-900 mt-1">{approval.aircraft}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                <User className="w-3 h-3 text-slate-600" /> Requesting Officer
              </div>
              <div className="font-bold text-slate-900 mt-1 truncate">{approval.requester}</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <div className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-600" /> Request Date
              </div>
              <div className="font-bold text-slate-900 mt-1">{approval.date}</div>
            </div>
          </div>

          {/* Scope / Amount */}
          <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200/80 flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-blue-900 uppercase">Resource / Scope Specification</div>
              <div className="text-xs font-semibold text-blue-950 mt-0.5">{approval.amountOrScope}</div>
            </div>
          </div>

          {/* Operational Justification */}
          <div>
            <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" /> Operational Justification & Urgency
            </label>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-slate-700 leading-relaxed text-xs">
              {approval.justification}
            </div>
          </div>

          {/* Strategic Impact */}
          <div>
            <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Strategic Fleet Impact
            </label>
            <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/80 text-amber-900 font-medium leading-relaxed text-xs">
              {approval.impact}
            </div>
          </div>

          {/* Decision Status if already made */}
          {!isPending && (
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Decision Executed
                </span>
                <span
                  className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                    approval.status === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-red-500/20 text-red-400 border border-red-500/40'
                  }`}
                >
                  {approval.status}
                </span>
              </div>
              <div className="text-xs text-slate-300">
                Authorized By: <strong>{approval.decidedBy}</strong> • {approval.decidedAt}
              </div>
              {approval.decisionNotes && (
                <div className="text-xs text-slate-400 italic">
                  &ldquo;{approval.decisionNotes}&rdquo;
                </div>
              )}
              {approval.ledgerHash && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-emerald-400">
                  <div className="flex items-center gap-1.5 truncate mr-2">
                    <Lock className="w-3 h-3 shrink-0" />
                    <span className="truncate">SHA-256: {approval.ledgerHash}</span>
                  </div>
                  <button
                    onClick={() => copyHashToClipboard(approval.ledgerHash!)}
                    className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white shrink-0"
                    title="Copy Ledger Hash"
                  >
                    {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Commander Rationale Field if Pending */}
          {isPending && (
            <div>
              <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
                <span>Commander Rationale & Directives (Cryptographic Audit Log)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Enter operational directives, authorization conditions, or fast-track routing instructions..."
                className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer with Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Enforced by MoD RBAC • Commander Authorization Required</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 transition-colors"
            >
              Close
            </button>

            {isPending && (
              <>
                <button
                  disabled={submitting}
                  onClick={() => handleAction('CLARIFY')}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Clarify</span>
                </button>
                <button
                  disabled={submitting}
                  onClick={() => handleAction('REJECT')}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-300 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
                <button
                  disabled={submitting}
                  onClick={() => handleAction('APPROVE')}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{submitting ? 'Executing...' : 'Approve Decision'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
