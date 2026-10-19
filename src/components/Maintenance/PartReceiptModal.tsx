import React, { useState } from 'react';
import { X, CheckCircle, PackageCheck, AlertTriangle, Truck, MapPin } from 'lucide-react';
import { MaintenanceWorkOrderItem, MaintenancePartRequirement, ConfirmPartReceiptRequest } from '../../types/aircraft';

interface PartReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: MaintenanceWorkOrderItem;
  part: MaintenancePartRequirement | null;
  onConfirmReceipt: (req: ConfirmPartReceiptRequest) => Promise<void>;
  currentRole?: string;
}

export const PartReceiptModal: React.FC<PartReceiptModalProps> = ({
  isOpen,
  onClose,
  workOrder,
  part,
  onConfirmReceipt,
  currentRole = 'Engineer',
}) => {
  const [qtyReceived, setQtyReceived] = useState<number>(1);
  const [receivedBy, setReceivedBy] = useState<string>('MWO R. Sharma (Hangar Lead)');
  const [storageLocation, setStorageLocation] = useState<string>('Bay 2 – Active Tool Rack A');
  const [notes, setNotes] = useState<string>('Package received via flight IL-402, tamper seals intact.');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen || !part) return null;

  const isViewer = currentRole.toLowerCase() === 'viewer';
  const remainingNeeded = Math.max(1, part.required_qty - part.received_qty);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) {
      setErrorMsg('Viewers cannot record parts receipt. Engineering or Custodian privileges required.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onConfirmReceipt({
        work_order_id: workOrder.id,
        part_number: part.part_number,
        quantity_received: qtyReceived,
        received_by: receivedBy,
        storage_location: storageLocation,
        notes: notes,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to confirm part receipt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Confirm Part Receipt</h3>
              <p className="text-xs text-slate-500">
                {part.part_number} • {part.part_name}
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

          {/* Part Summary Box */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Required</div>
              <div className="font-bold text-slate-800 text-sm mt-0.5">{part.required_qty} units</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase font-bold">Already Recv</div>
              <div className="font-bold text-slate-800 text-sm mt-0.5">{part.received_qty} units</div>
            </div>
            <div>
              <div className="text-[10px] text-amber-600 uppercase font-bold">In Transit</div>
              <div className="font-bold text-amber-700 text-sm mt-0.5">{remainingNeeded} units</div>
            </div>
          </div>

          {/* Quantity to Confirm */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Quantity Received in Hangar
            </label>
            <input
              type="number"
              min={1}
              max={remainingNeeded + 5}
              value={qtyReceived}
              onChange={(e) => setQtyReceived(parseInt(e.target.value) || 1)}
              required
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 font-bold"
            />
          </div>

          {/* Received By */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Confirmed &amp; Received By
            </label>
            <input
              type="text"
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              required
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Storage / Staging Location */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Staging / Bay Tool Location
            </label>
            <div className="relative">
              <input
                type="text"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                required
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
              />
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Receipt Inspection Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Logistics Integration Notice */}
          <div className="p-2.5 bg-blue-50 border border-blue-200/60 rounded-xl text-[11px] text-blue-800 flex items-start gap-2">
            <Truck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Linked to Logistics Request <strong>{part.linked_request_id || 'REQ-2045'}</strong>. Confirming receipt will release the active spares blocker and advance workflow to Repair &amp; Testing.
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
              className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              {isSubmitting ? 'Confirming...' : 'Confirm Receipt & Slotted'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
