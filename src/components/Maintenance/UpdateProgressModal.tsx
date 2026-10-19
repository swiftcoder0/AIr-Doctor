import React, { useState } from 'react';
import { X, CheckCircle, ArrowRight, Shield, AlertTriangle, Clock } from 'lucide-react';
import { MaintenanceWorkOrderItem } from '../../types/aircraft';

interface UpdateProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: MaintenanceWorkOrderItem;
  onUpdate: (targetStageIndex: number, stageName: string, notes: string, responsible: string) => Promise<void>;
  currentRole?: string;
}

const STAGES = [
  { step: 1, name: 'Work Order Created', code: 'WO_CREATED' },
  { step: 2, name: 'Aircraft Received', code: 'AIRCRAFT_RECEIVED' },
  { step: 3, name: 'Inspection & Diagnosis', code: 'INSPECTION_DIAGNOSIS' },
  { step: 4, name: 'Awaiting Parts', code: 'AWAITING_PARTS' },
  { step: 5, name: 'Repair & Testing', code: 'REPAIR_TESTING' },
  { step: 6, name: 'Inspection & Sign-off', code: 'INSPECTION_SIGNOFF' },
  { step: 7, name: 'Return to Service', code: 'RETURN_TO_SERVICE' },
];

export const UpdateProgressModal: React.FC<UpdateProgressModalProps> = ({
  isOpen,
  onClose,
  workOrder,
  onUpdate,
  currentRole = 'Engineer',
}) => {
  const [selectedStep, setSelectedStep] = useState<number>(
    Math.min(7, workOrder.stage_index + 1)
  );
  const [notes, setNotes] = useState<string>('');
  const [responsible, setResponsible] = useState<string>(workOrder.assigned_tech || 'MWO R. Sharma');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const targetStage = STAGES.find((s) => s.step === selectedStep) || STAGES[selectedStep - 1];
  const isViewer = currentRole.toLowerCase() === 'viewer';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) {
      setErrorMsg('Viewers have read-only access. Only Maintenance Engineers or Commanders may update progress.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onUpdate(selectedStep, targetStage.name, notes, responsible);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update progress.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <h3 className="text-base font-bold text-slate-900">Update Workflow Stage</h3>
            <p className="text-xs text-slate-500">
              {workOrder.id} • {workOrder.aircraft} ({workOrder.issue})
            </p>
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

          {/* Current vs Target */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Current Stage</div>
              <div className="text-xs font-bold text-slate-800 mt-0.5">
                Step {workOrder.stage_index}: {workOrder.current_stage}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Target Stage</div>
              <div className="text-xs font-bold text-blue-700 mt-0.5">
                Step {selectedStep}: {targetStage.name}
              </div>
            </div>
          </div>

          {/* Target Stage Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select New Workflow Stage
            </label>
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {STAGES.map((s) => {
                const isCurrent = s.step === workOrder.stage_index;
                const isSelected = s.step === selectedStep;
                const isPast = s.step < workOrder.stage_index;

                return (
                  <button
                    key={s.step}
                    type="button"
                    onClick={() => setSelectedStep(s.step)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/80 text-blue-900 font-bold shadow-xs'
                        : isPast
                        ? 'border-slate-200 bg-slate-50/50 text-slate-500 hover:border-slate-300'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isPast
                            ? 'bg-emerald-500 text-white'
                            : isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {isPast ? '✓' : s.step}
                      </span>
                      <span>{s.name}</span>
                    </div>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
                        Current
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Responsible Engineer */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Responsible Personnel / Authorised Officer
            </label>
            <input
              type="text"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              placeholder="e.g. MWO R. Sharma"
            />
          </div>

          {/* Milestone Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Stage Milestone Notes &amp; Actions Taken
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              placeholder="Describe repairs conducted, test readings, or next critical milestones..."
            />
          </div>

          {/* Cryptographic Ledger notice */}
          <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <Shield className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>
              This update will be recorded into the cryptographically verified SHA-256 AirDoctor Decision Ledger.
            </span>
          </div>

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
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? 'Updating...' : 'Advance Stage & Record'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
