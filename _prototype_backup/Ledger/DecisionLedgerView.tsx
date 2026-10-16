import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { DecisionLedgerEntry } from '../../types/aircraft';
import { api } from '../../services/api';

export const DecisionLedgerView: React.FC = () => {
  const [entries, setEntries] = useState<DecisionLedgerEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdding, setIsAdding] = useState<boolean>(false);

  // New action form state
  const [actionName, setActionName] = useState<string>('AUTHORIZE_EXPEDITED_LOGISTICS');
  const [prevState, setPrevState] = useState<string>('Awaiting parts shipment');
  const [resultingState, setResultingState] = useState<string>('Expedited via air transport');
  const [notes, setNotes] = useState<string>('Priority authorization granted to restore readiness.');

  useEffect(() => {
    async function loadLedger() {
      setLoading(true);
      const data = await api.getLedger();
      setEntries(data);
      setLoading(false);
    }
    loadLedger();
  }, []);

  const handleCreateDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry = await api.recordDecision({
      action: actionName,
      previous_state: prevState,
      resulting_state: resultingState,
      notes: notes,
      actor: 'demo-commander',
    });
    setEntries((prev) => [newEntry, ...prev]);
    setIsAdding(false);
  };

  const handleDownloadCsv = () => {
    // Generate CSV on client or trigger API
    const csvRows = [
      ['ID', 'Timestamp (UTC)', 'Actor', 'Action', 'Previous State', 'Resulting State', 'Notes', 'Scenario ID'],
      ...entries.map((e) => [
        e.id,
        e.timestamp,
        e.actor,
        e.action,
        `"${e.previous_state.replace(/"/g, '""')}"`,
        `"${e.resulting_state.replace(/"/g, '""')}"`,
        `"${e.notes.replace(/"/g, '""')}"`,
        e.scenario_id,
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

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Append-Only Decision Ledger &amp; Audit Trail
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically chronological log of scenario changes, maintenance decisions, and resource approvals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Report</span>
          </button>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Decision Event</span>
          </button>
        </div>
      </div>

      {/* Manual Entry Form */}
      {isAdding && (
        <form
          onSubmit={handleCreateDecision}
          className="bg-slate-50 p-5 rounded-2xl border border-blue-200 space-y-4 text-xs animate-in fade-in duration-150"
        >
          <h4 className="font-bold text-slate-900 text-sm">Record New Operational Audit Entry</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Action Name</label>
              <input
                type="text"
                value={actionName}
                onChange={(e) => setActionName(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Previous State</label>
              <input
                type="text"
                value={prevState}
                onChange={(e) => setPrevState(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Resulting State</label>
              <input
                type="text"
                value={resultingState}
                onChange={(e) => setResultingState(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-slate-600 font-semibold mb-1">Audit Notes / Rationale</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-800"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 text-white font-bold rounded-lg shadow-2xs hover:bg-blue-700"
            >
              Commit to Ledger
            </button>
          </div>
        </form>
      )}

      {/* Audit History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                <th className="p-3">Event ID</th>
                <th className="p-3">Timestamp (UTC)</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Action</th>
                <th className="p-3">Transition</th>
                <th className="p-3">Rationale / Details</th>
                <th className="p-3">Scenario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-bold text-slate-800">{entry.id}</td>
                  <td className="p-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td className="p-3">
                    <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {entry.actor}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-blue-700">{entry.action}</td>
                  <td className="p-3 text-[11px] text-slate-600">
                    <div>
                      <span className="text-slate-400">From: </span>
                      <span className="font-medium text-slate-700">{entry.previous_state}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">To: </span>
                      <span className="font-bold text-emerald-700">{entry.resulting_state}</span>
                    </div>
                  </td>
                  <td className="p-3 text-[11px] text-slate-600 max-w-sm">{entry.notes}</td>
                  <td className="p-3 font-mono text-[10px] text-slate-500">{entry.scenario_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
