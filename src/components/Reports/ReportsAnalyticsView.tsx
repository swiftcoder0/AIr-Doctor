import React, { useState } from 'react';
import {
  BarChart2,
  Calendar,
  Download,
  FileText,
  TrendingUp,
  Clock,
  Wrench,
  Bot,
  Send,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  Plus,
  X,
} from 'lucide-react';
import { BaseId, DecisionLedgerEntry } from '../../types/aircraft';
import { mockAirDoctorService } from '../../services/mockAirDoctorService';

import { api } from '../../services/apiClient';

interface ReportsAnalyticsViewProps {
  selectedBaseId: BaseId;
  onSelectBase: (base: BaseId) => void;
  onLogDecision?: () => void;
}

export const ReportsAnalyticsView: React.FC<ReportsAnalyticsViewProps> = ({
  selectedBaseId,
  onLogDecision,
}) => {
  const [dateRange, setDateRange] = useState<string>('01 Oct 2024 – 31 Oct 2024');
  const [actionSuccess, setActionSuccess] = useState<string>('');
  const [insightsInput, setInsightsInput] = useState<string>('');

  // Decision Ledger state
  const [isAddingLedger, setIsAddingLedger] = useState<boolean>(false);
  const [actionName, setActionName] = useState<string>('AUTHORIZE_EXPEDITED_LOGISTICS');
  const [prevState, setPrevState] = useState<string>('Awaiting commercial shipment');
  const [resultingState, setResultingState] = useState<string>('Expedited via tactical transport');
  const [notes, setNotes] = useState<string>('Priority authorization granted to compress airframe downtime.');

  const [ledgerEntries, setLedgerEntries] = useState<DecisionLedgerEntry[]>(() =>
    mockAirDoctorService.getLedger(selectedBaseId)
  );

  React.useEffect(() => {
    let active = true;
    api.getLedger(selectedBaseId).then((entries) => {
      if (active && entries) setLedgerEntries(entries);
    });
    return () => { active = false; };
  }, [selectedBaseId]);

  // Client-side CSV Download
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

    setActionSuccess('Exported complete Decision Ledger audit history to CSV.');
    setTimeout(() => setActionSuccess(''), 4000);
  };

  const handleCreateDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry = {
      actor: 'Air Commander',
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
    setIsAddingLedger(false);
    setActionSuccess('New command decision appended to the Decision Ledger.');
    setTimeout(() => setActionSuccess(''), 4000);
    if (onLogDecision) onLogDecision();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header matching Reference Image 2 (7/7) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Reports, Analytics &amp; Decision Support
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track trends, generate reports and get AI insights for better decisions.
          </p>
        </div>

        {/* Date Range Picker & Generate Report Button matching Reference Image */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{dateRange}</span>
          </div>

          <button
            onClick={() => {
              setActionSuccess('Operational readiness report generated for ' + dateRange);
              setTimeout(() => setActionSuccess(''), 4000);
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            Generate Report
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Top 4 KPI Cards with Sparklines matching Image 2 (7/7) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Fleet Readiness */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
              <span className="text-xs text-slate-500 font-semibold">Fleet Readiness</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">76%</div>
            <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
              <span>▲ +6% from last month</span>
            </div>
          </div>
          {/* Blue Sparkline SVG */}
          <div className="w-20 h-10">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-blue-500 fill-none stroke-[2.5]">
              <path d="M 0 32 Q 25 28 40 18 T 75 22 T 100 8" />
            </svg>
          </div>
        </div>

        {/* Card 2: Downtime (Hours) */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="text-xs text-slate-500 font-semibold">Downtime (Hours)</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">324</div>
            <div className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
              <span>▼ -18% from last month</span>
            </div>
          </div>
          {/* Red Sparkline SVG */}
          <div className="w-20 h-10">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-rose-500 fill-none stroke-[2.5]">
              <path d="M 0 10 Q 30 14 50 25 T 80 20 T 100 32" />
            </svg>
          </div>
        </div>

        {/* Card 3: Maintenance Cost */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
              <span className="text-xs text-slate-500 font-semibold">Maintenance Cost (₹)</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">1.2 Cr</div>
            <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
              <span>▼ -12% from last month</span>
            </div>
          </div>
          {/* Green Sparkline SVG */}
          <div className="w-20 h-10">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-emerald-500 fill-none stroke-[2.5]">
              <path d="M 0 8 Q 20 12 45 22 T 80 18 T 100 28" />
            </svg>
          </div>
        </div>

        {/* Card 4: Avg. Repair Time */}
        <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs text-slate-500 font-semibold">Avg. Repair Time</span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">26h</div>
            <div className="text-[11px] font-bold text-purple-600 flex items-center gap-1">
              <span>▼ -22% from last month</span>
            </div>
          </div>
          {/* Purple Sparkline SVG */}
          <div className="w-20 h-10">
            <svg viewBox="0 0 100 40" className="w-full h-full stroke-purple-500 fill-none stroke-[2.5]">
              <path d="M 0 12 Q 35 15 55 24 T 80 20 T 100 30" />
            </svg>
          </div>
        </div>
      </div>

      {/* Charts Grid matching Image 2 (7/7) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Chart 1: Fleet Readiness Trend (4 cols) */}
        <div className="md:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <h3 className="text-xs font-bold text-slate-900">Fleet Readiness Trend</h3>
          <div className="h-44 w-full relative">
            <svg viewBox="0 0 300 160" className="w-full h-full">
              {/* Grid lines */}
              <line x1="30" y1="20" x2="290" y2="20" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="30" y1="60" x2="290" y2="60" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="30" y1="100" x2="290" y2="100" stroke="#F1F5F9" strokeDasharray="3 3" />
              <line x1="30" y1="140" x2="290" y2="140" stroke="#E2E8F0" />

              {/* Y Axis Labels */}
              <text x="5" y="24" className="text-[9px] fill-slate-400 font-mono">100%</text>
              <text x="12" y="64" className="text-[9px] fill-slate-400 font-mono">75%</text>
              <text x="12" y="104" className="text-[9px] fill-slate-400 font-mono">50%</text>
              <text x="18" y="144" className="text-[9px] fill-slate-400 font-mono">0%</text>

              {/* Trend Curve */}
              <path
                d="M 40 100 L 95 85 L 160 65 L 225 70 L 285 55"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.5"
              />

              {/* Points */}
              <circle cx="40" cy="100" r="3.5" fill="#3B82F6" />
              <circle cx="95" cy="85" r="3.5" fill="#3B82F6" />
              <circle cx="160" cy="65" r="3.5" fill="#3B82F6" />
              <circle cx="225" cy="70" r="3.5" fill="#3B82F6" />
              <circle cx="285" cy="55" r="3.5" fill="#3B82F6" />

              {/* X Axis Labels */}
              <text x="32" y="156" className="text-[9px] fill-slate-400 font-mono">1 Oct</text>
              <text x="85" y="156" className="text-[9px] fill-slate-400 font-mono">8 Oct</text>
              <text x="148" y="156" className="text-[9px] fill-slate-400 font-mono">15 Oct</text>
              <text x="215" y="156" className="text-[9px] fill-slate-400 font-mono">22 Oct</text>
              <text x="268" y="156" className="text-[9px] fill-slate-400 font-mono">31 Oct</text>
            </svg>
          </div>
        </div>

        {/* Chart 2: Downtime by Cause (Donut) matching Image 2 (4 cols) */}
        <div className="md:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
          <h3 className="text-xs font-bold text-slate-900">Downtime by Cause</h3>
          <div className="flex items-center gap-4">
            {/* SVG Donut */}
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="36" stroke="#F87171" strokeWidth="16" fill="transparent" strokeDasharray="95 131" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="36" stroke="#FB923C" strokeWidth="16" fill="transparent" strokeDasharray="63 163" strokeDashoffset="-95" />
                <circle cx="50" cy="50" r="36" stroke="#FBBF24" strokeWidth="16" fill="transparent" strokeDasharray="41 185" strokeDashoffset="-158" />
                <circle cx="50" cy="50" r="36" stroke="#60A5FA" strokeWidth="16" fill="transparent" strokeDasharray="18 208" strokeDashoffset="-199" />
                <circle cx="50" cy="50" r="36" stroke="#CBD5E1" strokeWidth="16" fill="transparent" strokeDasharray="9 217" strokeDashoffset="-217" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-black text-slate-900 leading-none">324</span>
                <span className="text-[9px] text-slate-400 mt-0.5">Total Hours</span>
              </div>
            </div>

            {/* Legend matching Reference Image */}
            <div className="space-y-1.5 text-[11px] font-medium flex-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-xs bg-rose-400" />
                  Parts Shortage
                </span>
                <span className="font-bold text-slate-900">42%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-xs bg-orange-400" />
                  Maintenance Bay
                </span>
                <span className="font-bold text-slate-900">28%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-xs bg-amber-400" />
                  Technician Shortage
                </span>
                <span className="font-bold text-slate-900">18%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-xs bg-blue-400" />
                  Inspection
                </span>
                <span className="font-bold text-slate-900">8%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-600">
                  <span className="w-2 h-2 rounded-xs bg-slate-300" />
                  Other
                </span>
                <span className="font-bold text-slate-900">4%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart 3: Top Components (By Downtime) matching Image 2 (4 cols) */}
        <div className="md:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
          <h3 className="text-xs font-bold text-slate-900">Top Components (By Downtime)</h3>
          <div className="space-y-2.5 text-xs">
            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                <span>Hydraulic System</span>
                <span className="font-mono font-bold text-slate-900">120h</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-rose-400 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                <span>Engine</span>
                <span className="font-mono font-bold text-slate-900">86h</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-400 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                <span>Avionics</span>
                <span className="font-mono font-bold text-slate-900">54h</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: '42%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                <span>Landing Gear</span>
                <span className="font-mono font-bold text-slate-900">32h</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: '28%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-semibold text-slate-700 mb-1">
                <span>Flight Control</span>
                <span className="font-mono font-bold text-slate-900">18h</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-sky-300 rounded-full" style={{ width: '16%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Row: AI Insights & Recommendations + Decision Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Right AI Insights Panel matching Image 2 (7/7) (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3.5">
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">AI Insights &amp; Recommendations</h3>
              <p className="text-[10px] text-slate-500">
                Get insights on trends, risks and improvement opportunities.
              </p>
            </div>
          </div>

          <div className="bg-slate-100 rounded-xl px-3 py-1.5 text-xs text-slate-700 font-medium w-fit">
            "What are the key issues this month?"
          </div>

          {/* Insights Text matching Reference Image */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
            <span className="font-bold text-slate-900 block">Key Insights:</span>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-700">
              <li>Hydraulic system caused 42% of total downtime.</li>
              <li>Spare shortage is the main bottleneck (120 hours).</li>
              <li>Fleet readiness improved by 6% compared to last month.</li>
            </ol>

            <span className="font-bold text-slate-900 block pt-1.5">Recommendations:</span>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700">
              <li>Transfer spare HP-9042 from Base Alpha.</li>
              <li>Schedule preventive maintenance for hydraulic system.</li>
              <li>Allocate 1 additional technician to reduce backlog.</li>
            </ul>
          </div>

          {/* Input Bar */}
          <div className="flex items-center gap-1.5 pt-1">
            <input
              type="text"
              value={insightsInput}
              onChange={(e) => setInsightsInput(e.target.value)}
              placeholder="Ask for insights, comparisons..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            <button
              onClick={() => {
                if (insightsInput) {
                  setActionSuccess('AI Insights generated for: ' + insightsInput);
                  setInsightsInput('');
                  setTimeout(() => setActionSuccess(''), 4000);
                }
              }}
              className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Left: Append-Only Decision Ledger & Audit Trail (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-900">
                Decision Ledger &amp; Audit Trail ({ledgerEntries.length})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadCsv}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1 shadow-2xs"
              >
                <Download className="w-3 h-3" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => setIsAddingLedger(!isAddingLedger)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Add Entry</span>
              </button>
            </div>
          </div>

          {/* New Entry Form */}
          {isAddingLedger && (
            <form onSubmit={handleCreateDecision} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs animate-in fade-in">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={actionName}
                  onChange={(e) => setActionName(e.target.value)}
                  placeholder="Action Name"
                  className="p-1.5 bg-white border border-slate-200 rounded-lg font-mono font-bold"
                  required
                />
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Operational Notes"
                  className="p-1.5 bg-white border border-slate-200 rounded-lg"
                  required
                />
              </div>
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsAddingLedger(false)}
                  className="px-2.5 py-1 text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-slate-900 text-white font-bold rounded-lg"
                >
                  Record Entry
                </button>
              </div>
            </form>
          )}

          {/* Ledger Table */}
          <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto pr-1">
            {ledgerEntries.map((entry) => (
              <div key={entry.id} className="py-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[10px] text-slate-400">
                      {entry.id}
                    </span>
                    <span className="px-1.5 py-0.2 rounded font-mono font-bold text-[9px] bg-slate-100 text-slate-700">
                      {entry.action}
                    </span>
                    {entry.isOverride && (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded">
                        OVERRIDE
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {entry.timestamp.slice(0, 16).replace('T', ' ')}
                  </span>
                </div>
                <p className="text-slate-600 text-[11px] leading-snug">
                  {entry.notes}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
