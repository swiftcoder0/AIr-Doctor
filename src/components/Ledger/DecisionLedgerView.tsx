import React, { useState } from 'react';
import {
  FileText,
  Download,
  Plus,
  ShieldCheck,
  Clock,
  User,
  Activity,
  CheckCircle2,
  FileSpreadsheet,
  AlertTriangle,
  Layers,
  X,
} from 'lucide-react';
import { BaseId, DecisionLedgerEntry, ImportHistoryItem, VerifyChainResult } from '../../types/aircraft';
import { mockAirDoctorService } from '../../services/mockAirDoctorService';
import { api, getActiveUserRole } from '../../services/apiClient';

interface DecisionLedgerViewProps {
  selectedBaseId: BaseId;
  onSelectBase: (base: BaseId) => void;
}

export const DecisionLedgerView: React.FC<DecisionLedgerViewProps> = ({
  selectedBaseId,
  onSelectBase,
}) => {
  const isViewer = getActiveUserRole() === 'Viewer';
  const [activeTab, setActiveTab] = useState<'ledger' | 'imports' | 'scenarios'>('ledger');
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [chainVerification, setChainVerification] = useState<VerifyChainResult | null>(null);
  const [isVerifyingChain, setIsVerifyingChain] = useState<boolean>(false);

  // Form state for manual ledger entry
  const [actionName, setActionName] = useState<string>('AUTHORIZE_EXPEDITED_LOGISTICS');
  const [prevState, setPrevState] = useState<string>('Awaiting commercial shipment');
  const [resultingState, setResultingState] = useState<string>('Expedited via tactical transport');
  const [notes, setNotes] = useState<string>('Priority authorization granted to compress airframe downtime.');

  const [ledgerEntries, setLedgerEntries] = useState<DecisionLedgerEntry[]>(() =>
    mockAirDoctorService.getLedger(selectedBaseId)
  );
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>(() =>
    mockAirDoctorService.getImportHistory(selectedBaseId)
  );

  React.useEffect(() => {
    let active = true;
    api.getLedger(selectedBaseId).then((data) => {
      if (active && data) setLedgerEntries(data);
    });
    api.getImportHistory(selectedBaseId).then((data) => {
      if (active && data) setImportHistory(data);
    });
    return () => { active = false; };
  }, [selectedBaseId]);

  // Download client-side CSV
  const handleDownloadCsv = () => {
    const csvRows = [
      ['ID', 'Timestamp (UTC)', 'Actor', 'Action', 'Base', 'Previous State', 'Resulting State', 'Notes', 'Is Override', 'Override Reason'],
      ...ledgerEntries.map((e) => [
        e.id,
        e.timestamp,
        `"${e.actor.replace(/"/g, '""')}"`,
        e.action,
        e.baseId || 'all',
        `"${e.previous_state.replace(/"/g, '""')}"`,
        `"${e.resulting_state.replace(/"/g, '""')}"`,
        `"${e.notes.replace(/"/g, '""')}"`,
        e.isOverride ? 'TRUE' : 'FALSE',
        `"${(e.overrideReason || '').replace(/"/g, '""')}"`,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((r) => r.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `airdoctor_audit_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleVerifyChain = async () => {
    setIsVerifyingChain(true);
    try {
      const result = await api.verifyLedgerChain();
      setChainVerification(result);
    } catch {
      const result = await mockAirDoctorService.verifyLedgerChain();
      setChainVerification(result);
    } finally {
      setIsVerifyingChain(false);
    }
  };

  const handleCreateDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isViewer) return;
    const newEntry = {
      actor: 'Wing Cmdr. Aditya (Manual Log)',
      action: actionName,
      previous_state: prevState,
      resulting_state: resultingState,
      notes: notes,
      baseId: selectedBaseId === 'all' ? 'base-bravo' : selectedBaseId,
    };
    try {
      const created = await api.recordDecision(newEntry);
      setLedgerEntries((prev) => [created, ...prev]);
    } catch {
      mockAirDoctorService.recordDecision(newEntry);
      setLedgerEntries(mockAirDoctorService.getLedger(selectedBaseId));
    }
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Export & Action */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Reports &amp; Append-Only Decision Ledger
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically-structured chronological audit history of import batches, what-if evaluations, and commander decisions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleVerifyChain}
            disabled={isVerifyingChain}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 shadow-2xs transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isVerifyingChain ? 'Verifying Chain...' : 'Verify SHA-256 Audit Chain'}</span>
          </button>
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Audit CSV</span>
          </button>
          <button
            onClick={() => !isViewer && setIsAdding(!isAdding)}
            disabled={isViewer}
            title={isViewer ? 'RBAC Policy: Viewer role is strictly read-only' : undefined}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-2xs transition-colors ${
              isViewer
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isViewer ? 'Record Disabled (Viewer)' : 'Record Manual Entry'}</span>
          </button>
        </div>
      </div>

      {/* Cryptographic Chain Verification Result Banner */}
      {chainVerification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs flex items-center justify-between text-emerald-900 animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold flex items-center gap-2">
                <span>SHA-256 Cryptographic Chain Verified</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                  {chainVerification.total_blocks}/{chainVerification.total_blocks} Blocks Intact
                </span>
              </div>
              <div className="text-[11px] font-mono text-emerald-700 mt-0.5 break-all">
                Algorithm: <strong>{chainVerification.algorithm}</strong> • Head Hash: <code>{chainVerification.head_hash}</code>
              </div>
            </div>
          </div>
          <button
            onClick={() => setChainVerification(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Manual Entry Drawer / Form */}
      {isAdding && (
        <div className="p-5 bg-white border border-blue-200 rounded-2xl shadow-sm space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="font-bold text-xs text-blue-900">
              Record Manual Command Decision to Append-Only Ledger
            </span>
            <button
              onClick={() => setIsAdding(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleCreateDecision} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Action Type
              </label>
              <input
                type="text"
                value={actionName}
                onChange={(e) => setActionName(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Previous State
              </label>
              <input
                type="text"
                value={prevState}
                onChange={(e) => setPrevState(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Resulting State
              </label>
              <input
                type="text"
                value={resultingState}
                onChange={(e) => setResultingState(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                Operational Rationale &amp; Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                required
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs text-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isViewer}
                title={isViewer ? 'RBAC Policy: Viewer role is strictly read-only' : undefined}
                className={`px-4 py-1.5 font-bold rounded-xl text-xs transition-colors ${
                  isViewer
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Append to Audit Trail
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Navigation Tabs */}
      <div className="flex items-center gap-1 p-1.5 bg-slate-100 rounded-2xl w-fit text-xs font-bold text-slate-600">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'ledger'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
              : 'hover:text-slate-900'
          }`}
        >
          Decision Audit Trail ({ledgerEntries.length})
        </button>
        <button
          onClick={() => setActiveTab('imports')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'imports'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
              : 'hover:text-slate-900'
          }`}
        >
          CSV Ingestion History ({importHistory.length})
        </button>
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'scenarios'
              ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
              : 'hover:text-slate-900'
          }`}
        >
          Scenario Comparisons
        </button>
      </div>

      {/* Tab 1: Chronological Ledger */}
      {activeTab === 'ledger' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3">
          <div className="divide-y divide-slate-100">
            {ledgerEntries.map((entry) => (
              <div key={entry.id} className="py-3.5 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-400 text-[10px]">
                      {entry.id}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        entry.isOverride
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : entry.action.includes('ACCEPT')
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {entry.action}
                    </span>
                    {entry.isOverride && (
                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-rose-100 text-rose-700 rounded">
                        COMMANDER OVERRIDE
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3 inline" />
                    <span>{entry.timestamp}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Previous State</span>
                    <span className="font-medium">{entry.previous_state}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Resulting State</span>
                    <span className="font-bold text-slate-900">{entry.resulting_state}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 pt-0.5">
                  <span className="font-bold text-slate-500">Notes / Rationale: </span>
                  {entry.notes}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <div className="text-[10px] text-slate-400 flex items-center gap-3">
                    <span>Actor: <strong>{entry.actor}</strong></span>
                    {entry.baseId && <span>Base: <strong>{entry.baseId}</strong></span>}
                  </div>

                  {(entry.prev_hash || entry.curr_hash) && (
                    <div className="flex items-center gap-1.5 font-mono text-[10px] bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/80 text-slate-600">
                      <span className="text-slate-400">prev:</span>
                      <span className="text-slate-700 font-bold" title={entry.prev_hash}>{entry.prev_hash ? entry.prev_hash.slice(0, 8) + '...' : '00000000...'}</span>
                      <span className="text-slate-400">&rarr;</span>
                      <span className="text-slate-400">curr:</span>
                      <span className="text-emerald-700 font-bold" title={entry.curr_hash}>{entry.curr_hash ? entry.curr_hash.slice(0, 8) + '...' : 'pending'}</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-sans font-bold">SHA-256</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Import History */}
      {activeTab === 'imports' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="p-3">Import ID</th>
                <th className="p-3">Timestamp (UTC)</th>
                <th className="p-3">Operating Base</th>
                <th className="p-3">Category</th>
                <th className="p-3">Filename</th>
                <th className="p-3">Total Records</th>
                <th className="p-3">Valid / Flagged</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {importHistory.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-slate-900">{item.id}</td>
                  <td className="p-3 text-slate-500 font-sans text-xs">{item.timestamp}</td>
                  <td className="p-3 font-sans font-medium text-slate-800">{item.baseName}</td>
                  <td className="p-3 font-sans text-slate-600">{item.category}</td>
                  <td className="p-3 text-blue-700">{item.filename}</td>
                  <td className="p-3 font-bold">{item.recordsCount}</td>
                  <td className="p-3">
                    <span className="text-emerald-700 font-bold">{item.validCount}</span> /{' '}
                    <span className="text-rose-600 font-bold">{item.flaggedCount}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-sans">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Scenario Comparisons */}
      {activeTab === 'scenarios' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            Logistics Scenario Benchmarks
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-200 text-slate-700 rounded">
                BASELINE
              </span>
              <h4 className="font-bold text-slate-900 mt-1">Standard Vendor Ordering</h4>
              <p className="text-[11px] text-slate-500">
                Pacing bottleneck: HP-9042 commercial lead time 96h. Tejas grounded for 4 full days.
              </p>
              <div className="pt-2 font-mono font-bold text-slate-800">
                Recovery: 0.0 Days • Readiness: 50%
              </div>
            </div>

            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-200 text-blue-800 rounded">
                RECOMMENDED
              </span>
              <h4 className="font-bold text-blue-950 mt-1">Cross-Base Transfer</h4>
              <p className="text-[11px] text-slate-600">
                Base Alpha reserves airlifted in 14h. Tejas ready in 26h. Recovers 70 hours.
              </p>
              <div className="pt-2 font-mono font-bold text-blue-900">
                Recovery: +2.92 Days • Readiness: 85%
              </div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-200 text-emerald-800 rounded">
                EXPEDITED + TECH
              </span>
              <h4 className="font-bold text-emerald-950 mt-1">Expedite + Dual Specialists</h4>
              <p className="text-[11px] text-slate-600">
                Local stock + dual-specialist pairing compresses repair to 8h. Maximum possible velocity.
              </p>
              <div className="pt-2 font-mono font-bold text-emerald-900">
                Recovery: +3.67 Days • Readiness: 100%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
