import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, ShieldCheck, ClipboardCheck, FileCheck } from 'lucide-react';
import { MaintenanceWorkOrderItem, InspectionSignOffRequest } from '../../types/aircraft';

interface InspectionSignOffModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: MaintenanceWorkOrderItem;
  onSubmitSignOff: (req: InspectionSignOffRequest) => Promise<void>;
  currentRole?: string;
}

export const InspectionSignOffModal: React.FC<InspectionSignOffModalProps> = ({
  isOpen,
  onClose,
  workOrder,
  onSubmitSignOff,
  currentRole = 'Engineer',
}) => {
  const [result, setResult] = useState<'PASSED' | 'FAILED'>('PASSED');
  const [authorizeRelease, setAuthorizeRelease] = useState<boolean>(false);
  const [inspectorName, setInspectorName] = useState<string>('Flt Lt. Nair');
  const [inspectorServiceId, setInspectorServiceId] = useState<string>('IAF-QA-881');
  const [signOffNotes, setSignOffNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const [checklist, setChecklist] = useState([
    { item: 'Component physical mounting & torque witness marks verified', passed: true },
    { item: 'High-pressure hydraulic circuit leak containment test (3000 PSI)', passed: true },
    { item: 'Electrical bus insulation & signal continuity checked', passed: true },
    { item: 'Foreign Object Debris (FOD) sweep of bay and wheel-well completed', passed: true },
    { item: 'Built-In Test (BIT) / telemetry self-diagnostic returned zero faults', passed: true },
  ]);

  if (!isOpen) return null;

  const isViewer = currentRole.toLowerCase() === 'viewer';

  const toggleCheck = (idx: number) => {
    setChecklist((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, passed: !c.passed } : c))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) {
      setErrorMsg('Viewers have read-only access. Quality inspection sign-off requires Engineering Authority.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onSubmitSignOff({
        work_order_id: workOrder.id,
        inspector_name: inspectorName,
        inspector_service_id: inspectorServiceId,
        result: result,
        checklist_items: checklist,
        sign_off_notes: signOffNotes,
        authorize_release: result === 'PASSED' && authorizeRelease,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit inspection sign-off.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Quality Inspection &amp; Sign-off</h3>
              <p className="text-xs text-slate-500">
                {workOrder.id} • {workOrder.aircraft} ({workOrder.issue})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Result Toggle */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Inspection Decision</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setResult('PASSED')}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  result === 'PASSED'
                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                Inspection Passed
              </button>
              <button
                type="button"
                onClick={() => {
                  setResult('FAILED');
                  setAuthorizeRelease(false);
                }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  result === 'FAILED'
                    ? 'border-red-500 bg-red-50/80 text-red-800 ring-2 ring-red-500/20'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Inspection Failed (Rework)
              </button>
            </div>
          </div>

          {/* Checklist */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Multi-Point Inspection Checklist
            </label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {checklist.map((c, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleCheck(idx)}
                  className={`flex items-start gap-2.5 p-2 rounded-xl border cursor-pointer transition-colors text-xs ${
                    c.passed
                      ? 'border-slate-200 bg-white hover:bg-slate-50'
                      : 'border-amber-200 bg-amber-50/40 text-amber-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={c.passed}
                    onChange={() => {}}
                    className="mt-0.5 rounded text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-slate-700 text-[11px] leading-tight">{c.item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Inspector Credentials */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Authorized Inspector Name
              </label>
              <input
                type="text"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Service / Badge ID
              </label>
              <input
                type="text"
                value={inspectorServiceId}
                onChange={(e) => setInspectorServiceId(e.target.value)}
                required
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Sign-off notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Quality Assurance Notes &amp; Observations
            </label>
            <textarea
              value={signOffNotes}
              onChange={(e) => setSignOffNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              placeholder="Record test values, torque numbers, or rework requirements..."
            />
          </div>

          {/* Release to Service Gate Checkbox */}
          {result === 'PASSED' && (
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl flex items-start gap-2.5">
              <input
                type="checkbox"
                id="authRelease"
                checked={authorizeRelease}
                onChange={(e) => setAuthorizeRelease(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="authRelease" className="text-xs text-emerald-950 cursor-pointer">
                <span className="font-bold block">Authorize Final Sortie Clearance &amp; Return to Service</span>
                <span className="text-[11px] text-emerald-700">
                  Checking this marks the work order as Released and updates the aircraft status in Air Fleet Command.
                </span>
              </label>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isViewer}
              className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                result === 'PASSED' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              {isSubmitting ? 'Signing...' : result === 'PASSED' ? 'Sign & Certify Inspection' : 'Record Inspection Failure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
