import React, { useState } from 'react';
import { ShieldAlert, Info, X, AlertTriangle } from 'lucide-react';

export const UnclassifiedBanner: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="bg-amber-500 text-slate-950 px-4 py-1.5 flex items-center justify-between text-xs font-bold tracking-wide select-none shadow-xs border-b border-amber-600/30">
        <div className="flex items-center gap-2 mx-auto">
          <ShieldAlert className="w-4 h-4 text-slate-950 shrink-0" />
          <span>SYNTHETIC / UNCLASSIFIED DATA — FOR PROTOTYPE DEMONSTRATION &amp; PLANNING ONLY</span>
          <button
            onClick={() => setShowModal(true)}
            className="ml-2 inline-flex items-center gap-1 bg-amber-600/30 hover:bg-amber-600/50 text-slate-950 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase transition-colors"
          >
            <Info className="w-3 h-3" />
            <span>Scope Notice</span>
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs select-none">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900">Synthetic Data &amp; Safety Disclaimer</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-slate-600 leading-relaxed">
              <p>
                <strong>1. Synthetic Environment:</strong> All aircraft models, designations (e.g. AeroJet Mark-IV, RotorLift H-12), tail numbers (GEN-J101, GEN-H201), telemetry values, component health scores, inventory, and readiness estimates in this system are strictly <strong>synthetic and fictional</strong>.
              </p>
              <p>
                <strong>2. Operational Disconnection:</strong> This application operates strictly in a read-only demonstration mode and has zero connections to operational defense systems or real telemetry sensors.
              </p>
              <p>
                <strong>3. Non-Certification:</strong> AirDoctor predictions and models are illustrative planning tools. They <strong>do not certify airworthiness</strong>, guarantee accident prevention, or identify exact physical failure locations without human maintenance inspections.
              </p>
              <p>
                <strong>4. Model Integration:</strong> Machine Learning inferences are currently computed in <em>Mock Mode</em> using deterministic synthetic boundary parameters while ML models are trained separately in Jupyter/Python.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors"
              >
                Acknowledged
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
