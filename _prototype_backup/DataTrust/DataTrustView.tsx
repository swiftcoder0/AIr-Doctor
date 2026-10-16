import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  Info,
} from 'lucide-react';
import { DataTrustRecord, TrustGrade } from '../../types/aircraft';
import { api } from '../../services/api';

export const DataTrustView: React.FC = () => {
  const [records, setRecords] = useState<DataTrustRecord[]>([]);
  const [verifyFirst, setVerifyFirst] = useState<DataTrustRecord[]>([]);
  const [activeGradeFilter, setActiveGradeFilter] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [allRecs, vfRecs] = await Promise.all([
        api.getDataTrustRecords(),
        api.getVerifyFirst(),
      ]);
      setRecords(allRecs);
      setVerifyFirst(vfRecs);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredRecords = records.filter((r) => {
    if (activeGradeFilter === 'all') return true;
    if (activeGradeFilter === 'verify_first') return r.requires_human_verification;
    return r.quality_grade === activeGradeFilter;
  });

  const gradeCounts = {
    A: records.filter((r) => r.quality_grade === 'A').length,
    B: records.filter((r) => r.quality_grade === 'B').length,
    C: records.filter((r) => r.quality_grade === 'C').length,
    D: records.filter((r) => r.quality_grade === 'D').length,
  };

  return (
    <div className="space-y-6">
      {/* Primary Principle Warning Card */}
      <div className="p-4 bg-amber-500/10 border-l-4 border-amber-500 rounded-xl flex items-start gap-3 text-xs text-amber-950">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-extrabold text-sm text-slate-900">
            Core Data Trust Principle
          </div>
          <p className="leading-relaxed text-slate-700">
            <strong>Never treat low-quality data as trustworthy just because a predictive model computes an answer.</strong>{' '}
            Sensor noise, stale timestamps, unit mismatches, and dropped packets degrade model validity. Flawed records are routed to the Human-in-the-Loop "Verify First" queue before operational acceptance.
          </p>
        </div>
      </div>

      {/* Grade Distribution Scorecards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { grade: 'A', label: 'Grade A — Verified Nominal', count: gradeCounts.A, color: 'text-emerald-700 bg-emerald-50 border-emerald-200', desc: 'Complete, fresh, plausibility verified' },
          { grade: 'B', label: 'Grade B — Minor Variance', count: gradeCounts.B, color: 'text-blue-700 bg-blue-50 border-blue-200', desc: 'Acceptable timestamp lag (< 12h)' },
          { grade: 'C', label: 'Grade C — Degraded / Stale', count: gradeCounts.C, color: 'text-amber-700 bg-amber-50 border-amber-200', desc: 'Stale (> 48h) or packet CRC jitter' },
          { grade: 'D', label: 'Grade D — Critical Anomaly', count: gradeCounts.D, color: 'text-rose-700 bg-rose-50 border-rose-200', desc: 'Missing field or impossible reading' },
        ].map((item) => (
          <div
            key={item.grade}
            onClick={() => setActiveGradeFilter(item.grade)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              activeGradeFilter === item.grade
                ? 'ring-2 ring-blue-500 shadow-sm'
                : 'hover:shadow-xs'
            } ${item.color}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black">{item.grade}</span>
              <span className="text-xl font-extrabold font-mono">{item.count}</span>
            </div>
            <div className="font-bold text-xs mt-1">{item.label}</div>
            <p className="text-[10px] opacity-80 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Verify First Human-in-the-Loop Queue */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">
              "Verify First" Human-in-the-Loop Review Queue
            </h3>
            <span className="text-xs font-extrabold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
              {verifyFirst.length} Critical Items
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Automated ML inference suppressed until physical check
          </span>
        </div>

        <div className="space-y-3">
          {verifyFirst.map((item) => (
            <div
              key={item.record_id}
              className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-800 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                    {item.record_id}
                  </span>
                  <span className="font-bold text-slate-900">
                    {item.aircraft_tail} • {item.component_name}
                  </span>
                  <span className="px-2 py-0.5 rounded font-extrabold text-[10px] bg-rose-100 text-rose-800 uppercase">
                    Grade {item.quality_grade}
                  </span>
                </div>
                <div className="text-slate-600">
                  Metric: <strong>{item.metric_name}</strong> • Reported: <strong>{String(item.reported_value)} {item.unit}</strong>
                  {item.hidden_ground_truth !== undefined && (
                    <span className="text-slate-400 ml-2 italic">
                      (Simulated Truth: {String(item.hidden_ground_truth)} {item.unit})
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 text-[11px] text-rose-800 font-medium">
                  {item.issues_detected.map((iss, idx) => (
                    <span key={idx} className="bg-rose-100/70 px-2 py-0.5 rounded">
                      • {iss}
                    </span>
                  ))}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <button
                  onClick={() => alert(`Marked ${item.record_id} as verified by technician.`)}
                  className="px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-50 text-rose-700 font-bold rounded-lg text-xs shadow-2xs transition-colors"
                >
                  Verify &amp; Clear
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filterable Raw Records Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04)] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h4 className="text-sm font-bold text-slate-900">Telemetry Data Quality Records</h4>
          <div className="flex items-center gap-1.5 text-xs">
            {['all', 'A', 'B', 'C', 'D'].map((g) => (
              <button
                key={g}
                onClick={() => setActiveGradeFilter(g)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  activeGradeFilter === g
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {g === 'all' ? 'All Grades' : `Grade ${g}`}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold bg-slate-50/70">
                <th className="p-2.5">Record ID</th>
                <th className="p-2.5">Aircraft</th>
                <th className="p-2.5">Component &amp; Metric</th>
                <th className="p-2.5">Reported Value</th>
                <th className="p-2.5">Grade</th>
                <th className="p-2.5">Detected Flaws</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((r) => (
                <tr key={r.record_id} className="hover:bg-slate-50">
                  <td className="p-2.5 font-mono font-bold text-slate-800">{r.record_id}</td>
                  <td className="p-2.5 font-semibold text-slate-900">{r.aircraft_tail}</td>
                  <td className="p-2.5 text-slate-700">
                    <div>{r.component_name}</div>
                    <div className="text-[10px] text-slate-400">{r.metric_name}</div>
                  </td>
                  <td className="p-2.5 font-mono font-bold text-slate-800">
                    {String(r.reported_value)} {r.unit}
                  </td>
                  <td className="p-2.5">
                    <span
                      className={`px-2 py-0.5 rounded font-black text-[10px] ${
                        r.quality_grade === 'A'
                          ? 'bg-emerald-100 text-emerald-800'
                          : r.quality_grade === 'B'
                          ? 'bg-blue-100 text-blue-800'
                          : r.quality_grade === 'C'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {r.quality_grade}
                    </span>
                  </td>
                  <td className="p-2.5 text-[11px] text-slate-500 max-w-xs">
                    {r.issues_detected.length > 0 ? (
                      <span className="text-amber-800">{r.issues_detected.join('; ')}</span>
                    ) : (
                      <span className="text-emerald-700">None (Passed all constraints)</span>
                    )}
                  </td>
                  <td className="p-2.5">
                    {r.requires_human_verification ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                        Requires Review
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">
                        Cleared
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
