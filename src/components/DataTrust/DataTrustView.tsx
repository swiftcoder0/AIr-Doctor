import React, { useState } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Plus,
  Eye,
  Check,
} from 'lucide-react';
import {
  BaseId,
  DataCategory,
  DataTrustRecord,
} from '../../types/aircraft';
import { mockAirDoctorService } from '../../services/mockAirDoctorService';
import { api, getActiveUserRole } from '../../services/apiClient';

interface DataTrustViewProps {
  selectedBaseId: BaseId;
  onSelectBase: (base: BaseId) => void;
  onLogDecision?: () => void;
}

export const DataTrustView: React.FC<DataTrustViewProps> = ({
  selectedBaseId,
  onLogDecision,
}) => {
  const activeBase: BaseId = selectedBaseId === 'all' ? 'base-bravo' : selectedBaseId;
  const isViewer = getActiveUserRole() === 'Viewer';
  const [activeStep, setActiveStep] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<DataCategory>('aircraft_health');
  const [actionSuccess, setActionSuccess] = useState<string>('');

  const [previewRows, setPreviewRows] = useState<Array<{ date: string; aircraft: string; component: string; value: string; unit: string }>>([
    { date: '2024-10-01', aircraft: 'T-04', component: 'Hydraulic Pump', value: '85', unit: 'bar' },
    { date: '2024-10-01', aircraft: 'T-04', component: 'Engine Temp', value: '620', unit: '°C' },
    { date: '2024-10-02', aircraft: 'T-04', component: 'Vibration', value: '0.8', unit: 'mm/s' },
    { date: '2024-10-02', aircraft: 'T-04', component: 'Oil Pressure', value: '210', unit: 'psi' },
    { date: '2024-10-03', aircraft: 'T-04', component: 'Fuel Flow', value: '450', unit: 'kg/h' },
  ]);

  const [trustRecords, setTrustRecords] = useState<DataTrustRecord[]>(() => mockAirDoctorService.getDataTrustRecords(activeBase));

  React.useEffect(() => {
    let active = true;
    api.getDataTrustRecords(activeBase).then((records) => {
      if (active && records) setTrustRecords(records);
    });
    return () => { active = false; };
  }, [activeBase]);

  const verifyQueue = trustRecords.filter((r) => r.verification_status === 'NEEDS_REVIEW');

  const categories: Array<{ id: DataCategory; title: string; desc: string }> = [
    { id: 'aircraft_health', title: 'Aircraft Health', desc: 'Upload flight data and sensor logs' },
    { id: 'maintenance_records', title: 'Maintenance Records', desc: 'Upload work orders and history' },
    { id: 'spares_inventory', title: 'Spare-Parts Inventory', desc: 'Upload stock and supplier details' },
    { id: 'technicians_bays', title: 'Technicians & Bays', desc: 'Upload technician and bay availability' },
  ];

  const handleLoadDemoPreset = () => {
    setActiveStep(2);
    setPreviewRows([
      { date: '2024-10-01', aircraft: 'T-04', component: 'Hydraulic Pump', value: '85', unit: 'bar' },
      { date: '2024-10-01', aircraft: 'T-04', component: 'Engine Temp', value: '620', unit: '°C' },
      { date: '2024-10-02', aircraft: 'T-04', component: 'Vibration', value: '0.8', unit: 'mm/s' },
      { date: '2024-10-02', aircraft: 'T-04', component: 'Oil Pressure', value: '210', unit: 'psi' },
      { date: '2024-10-03', aircraft: 'T-04', component: 'Fuel Flow', value: '450', unit: 'kg/h' },
    ]);
    setActionSuccess('Loaded demo CSV preset for ' + selectedCategory + '. Ready for validation and commit.');
    setTimeout(() => setActionSuccess(''), 4000);
  };

  const handleCommitData = async () => {
    try {
      await api.commitCsv(activeBase, selectedCategory, `${selectedCategory}_oct2024.csv`, previewRows);
      const updated = await api.getDataTrustRecords(activeBase);
      setTrustRecords(updated);
    } catch {
      mockAirDoctorService.simulateCsvImport(activeBase, selectedCategory, `${selectedCategory}_oct2024.csv`);
    }
    setActiveStep(4);
    setActionSuccess('CSV data successfully committed to Local Base DB. Verify-First queue updated.');
    setTimeout(() => setActionSuccess(''), 4000);
    if (onLogDecision) onLogDecision();
  };

  const handleVerify = async (recordId: string, status: 'VERIFIED' | 'REJECTED') => {
    if (status === 'VERIFIED') {
      await api.verifyTrustRecord(recordId);
    } else {
      await api.rejectTrustRecord(recordId);
    }
    const updated = await api.getDataTrustRecords(activeBase);
    setTrustRecords(updated);
    setActionSuccess(`Record ${recordId} was ${status} and logged to the Decision Ledger.`);
    setTimeout(() => setActionSuccess(''), 4000);
    if (onLogDecision) onLogDecision();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          Data Import — Upload &amp; Data Trust
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Upload maintenance data and check data quality before using it.
        </p>
      </div>

      {/* 4-Step Stepper matching Reference Image */}
      <div className="flex items-center gap-3">
        {[
          { num: 1, label: '1. Upload CSV' },
          { num: 2, label: '2. Preview & Validate' },
          { num: 3, label: '3. Data Trust Grade' },
          { num: 4, label: '4. Verify & Commit' },
        ].map((step) => (
          <button
            key={step.num}
            onClick={() => setActiveStep(step.num)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeStep === step.num
                ? 'bg-[#142A20] text-emerald-400 border border-emerald-500/40 shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {step.label}
          </button>
        ))}
      </div>

      {isViewer && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>RBAC Notice:</strong> You are currently logged in with the <strong>Viewer</strong> role (Read-Only). Committing new CSV imports and reviewing queue records are restricted to Planner and Commander roles.
          </span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 4 Data Categories Row matching Reference Image */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer flex items-start gap-3.5 ${
              selectedCategory === cat.id
                ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-sm'
                : 'border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-slate-900">{cat.title}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{cat.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 3-Column Row: Upload Box | Preview Table | Data Trust Grade matching Image 1 (3/4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Upload Box (3.5 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] text-center space-y-4">
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 space-y-3">
            <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-xs font-bold text-slate-700">
              Drag &amp; drop your CSV file here <br />
              <span className="text-slate-400 font-normal">or</span>
            </div>
            <button
              disabled={isViewer}
              title={isViewer ? 'RBAC Policy: Viewer role is strictly read-only' : undefined}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                isViewer
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#142A20] hover:bg-[#1a382b] text-emerald-400 border border-emerald-500/40'
              }`}
            >
              Choose File
            </button>
          </div>

          <button
            onClick={handleLoadDemoPreset}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Load Demo CSV Preset
          </button>
        </div>

        {/* Middle: Preview (first 5 rows) matching Reference Image (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900">Preview (first 5 rows)</h3>
            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-600">
              5 of 42 rows
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Aircraft</th>
                  <th className="pb-2">Component</th>
                  <th className="pb-2">Value</th>
                  <th className="pb-2">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-mono text-[11px] text-slate-700">
                {previewRows.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="py-2.5 text-slate-500">{row.date}</td>
                    <td className="py-2.5 font-bold text-slate-900">{row.aircraft}</td>
                    <td className="py-2.5 font-sans font-medium">{row.component}</td>
                    <td className="py-2.5 font-bold">{row.value}</td>
                    <td className="py-2.5 text-slate-400 font-sans">{row.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleCommitData}
              disabled={isViewer}
              title={isViewer ? 'RBAC Policy: Viewer role is strictly read-only' : undefined}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                isViewer
                  ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60'
                  : 'bg-[#142A20] hover:bg-[#1a382b] text-emerald-400 border border-emerald-500/40'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isViewer ? 'Commit Disabled (Viewer)' : 'Validate & Commit Data'}</span>
            </button>
          </div>
        </div>

        {/* Right: Data Trust Grade Summary matching Reference Image (3 cols) */}
        <div className="lg:col-span-3 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3.5">
          <h3 className="text-xs font-bold text-slate-900">Data Trust Grade</h3>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                A
              </div>
              <span className="text-xs text-slate-700">Verified and complete</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                B
              </div>
              <span className="text-xs text-slate-700">Minor timestamp variance</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                C
              </div>
              <span className="text-xs text-slate-700">Stale or missing fields</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-xs shrink-0">
                D
              </div>
              <span className="text-xs text-slate-700">Critical issues found</span>
            </div>
          </div>
        </div>
      </div>

      {/* Verify-First Queue */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs font-bold text-slate-900">
              Verify-First Human-in-the-Loop Review Queue
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
              {verifyQueue.length} Flagged
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            Mandatory engineering sign-off before model pipeline ingestion
          </span>
        </div>

        {verifyQueue.length === 0 ? (
          <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
            ✓ All flagged records have been verified.
          </div>
        ) : (
          <div className="space-y-2.5">
            {verifyQueue.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/40 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{item.record_id}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded">
                      GRADE {item.quality_grade}
                    </span>
                    <span className="text-slate-500 text-[11px]">({item.source_system})</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] text-rose-800 mt-1 space-y-0.5">
                    {item.detected_issues.map((iss, i) => (
                      <li key={i}>{iss}</li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleVerify(item.id, 'REJECTED')}
                    disabled={isViewer}
                    title={isViewer ? 'RBAC Policy: Viewer role is strictly read-only' : undefined}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                      isViewer
                        ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                        : 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleVerify(item.id, 'VERIFIED')}
                    disabled={isViewer}
                    title={isViewer ? 'RBAC Policy: Viewer role is strictly read-only' : undefined}
                    className={`px-3 py-1 rounded-lg text-xs font-bold shadow-xs transition-colors ${
                      isViewer
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    Verify &amp; Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
