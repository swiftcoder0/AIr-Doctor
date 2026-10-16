import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  Plus,
  Search,
  ChevronDown,
  Bot,
  Send,
  X,
  Wrench,
  Check,
} from 'lucide-react';
import { WorkOrder, BaseId } from '../../types/aircraft';
import { mockAirDoctorService } from '../../services/mockAirDoctorService';

import { api } from '../../services/apiClient';

interface WorkOrdersViewProps {
  selectedBaseId: BaseId;
  onSelectBase: (base: BaseId) => void;
  onLogDecision?: () => void;
}

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({
  selectedBaseId,
  onLogDecision,
}) => {
  const [statusTab, setStatusTab] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [baseFilter, setBaseFilter] = useState<string>('All');
  const [aircraftFilter, setAircraftFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // AI Planner chat state
  const [plannerInput, setPlannerInput] = useState<string>('');
  const [appliedSchedule, setAppliedSchedule] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string>('');

  // Create Work Order modal state
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newAircraft, setNewAircraft] = useState<string>('Tejas T-04');
  const [newComponent, setNewComponent] = useState<string>('Hydraulic System');
  const [newType, setNewType] = useState<'Overhaul' | 'Inspection' | 'Check' | 'Repair'>('Overhaul');
  const [newEstHours, setNewEstHours] = useState<number>(18);
  const [newPriority, setNewPriority] = useState<'High' | 'Medium' | 'Low'>('High');

  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(() =>
    mockAirDoctorService.getWorkOrders(
      selectedBaseId,
      statusTab === 'All' ? 'All' : statusTab,
      searchQuery,
      aircraftFilter,
      statusFilter
    )
  );

  useEffect(() => {
    let active = true;
    api.getWorkOrders(selectedBaseId, statusTab, searchQuery).then((data) => {
      if (active && data) setWorkOrders(data);
    });
    return () => { active = false; };
  }, [selectedBaseId, statusTab, searchQuery, refreshTrigger]);

  const handleApplySchedule = async () => {
    await api.updateWorkOrder('WO-1042', {
      scheduledDate: '13 Oct 2024',
      status: 'Scheduled',
    });
    await api.updateWorkOrder('WO-1041', {
      assignedBay: 'Bay 2 (Quick-Turn)',
    });
    setAppliedSchedule(true);
    setActionSuccess('AI-suggested schedule applied! WO-1042 rescheduled to 13 Oct post spare-delivery. Downtime reduced by 18 hours.');
    setRefreshTrigger((prev) => prev + 1);
    setTimeout(() => setActionSuccess(''), 4500);
    if (onLogDecision) onLogDecision();
  };

  const handleCreateWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createWorkOrder({
      aircraft: newAircraft,
      component: newComponent,
      type: newType,
      status: 'Scheduled',
      scheduledDate: '15 Oct 2024',
      estHours: newEstHours,
      priority: newPriority,
      baseId: newAircraft.includes('Rafale') ? 'base-alpha' : 'base-bravo',
    });
    setShowCreateModal(false);
    setActionSuccess(`Created new work order for ${newAircraft} (${newComponent}). Ready-time recalculated.`);
    setRefreshTrigger((prev) => prev + 1);
    setTimeout(() => setActionSuccess(''), 4500);
    if (onLogDecision) onLogDecision();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header matching Reference Image 2 (6/7) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Maintenance Scheduler &amp; Work Orders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Plan, track and manage all maintenance activities with AI recommendations.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Work Order</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* 5 Metric Summary Cards matching Reference Image */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">24</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Total Work Orders</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">12</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">On Schedule</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">
              {appliedSchedule ? '7' : '8'}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Delayed</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">4</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Critical</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 leading-none">3</div>
            <div className="text-xs font-semibold text-slate-500 mt-1">Due This Week</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Work Orders Table (Left) + AI Maintenance Planner (Right) matching Image 2 (6/7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Work Orders Table Section (8.5 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          {/* Status Filter Tabs matching Reference Image */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'All', label: 'All Work Orders (24)' },
              { id: 'Scheduled', label: 'Scheduled (12)' },
              { id: 'In Progress', label: 'In Progress (6)' },
              { id: 'Delayed', label: 'Delayed (4)' },
              { id: 'Completed', label: 'Completed (2)' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  statusTab === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filter Bar: Search + Dropdowns matching Reference Image */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
            <div className="sm:col-span-6 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search work order, aircraft or component..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="sm:col-span-2 relative">
              <select
                value={baseFilter}
                onChange={(e) => setBaseFilter(e.target.value)}
                className="appearance-none w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 pr-6 text-xs text-slate-700 cursor-pointer"
              >
                <option value="All">All Bases</option>
                <option value="base-alpha">Base Alpha</option>
                <option value="base-bravo">Base Bravo</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            <div className="sm:col-span-2 relative">
              <select
                value={aircraftFilter}
                onChange={(e) => setAircraftFilter(e.target.value)}
                className="appearance-none w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 pr-6 text-xs text-slate-700 cursor-pointer"
              >
                <option value="All">All Aircraft</option>
                <option value="Tejas">Tejas</option>
                <option value="Rafale">Rafale</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>

            <div className="sm:col-span-2 relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 pr-6 text-xs text-slate-700 cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Delayed">Delayed</option>
                <option value="In Progress">In Progress</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Work Orders Table matching Image 2 (6/7) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="pb-3">ID</th>
                  <th className="pb-3">Aircraft</th>
                  <th className="pb-3">Component</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Scheduled Date</th>
                  <th className="pb-3">Est. Hours</th>
                  <th className="pb-3">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium">
                {workOrders.map((wo) => (
                  <tr key={wo.id} className="hover:bg-slate-50/70">
                    <td className="py-3 font-mono font-bold text-slate-900">{wo.id}</td>
                    <td className="py-3 font-bold text-slate-800">{wo.aircraft}</td>
                    <td className="py-3 text-slate-700">{wo.component}</td>
                    <td className="py-3 text-slate-600">{wo.type}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          wo.status === 'Delayed'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : wo.status === 'In Progress'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : wo.status === 'Scheduled'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {wo.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-600 font-mono text-[11px]">{wo.scheduledDate}</td>
                    <td className="py-3 font-mono text-slate-700 font-bold">{wo.estHours}h</td>
                    <td className="py-3">
                      <span
                        className={`text-[10px] font-bold ${
                          wo.priority === 'High'
                            ? 'text-rose-600 font-extrabold'
                            : wo.priority === 'Medium'
                            ? 'text-amber-600 font-bold'
                            : 'text-slate-500'
                        }`}
                      >
                        {wo.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: AI Maintenance Planner matching Image 2 (6/7) (3.5 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">AI Maintenance Planner</h3>
              <p className="text-[10px] text-slate-500">
                Get AI suggestions for scheduling, resource allocation and delay reduction.
              </p>
            </div>
          </div>

          {/* Prompt Bubble */}
          <div className="bg-slate-100/80 rounded-xl p-2.5 text-xs text-slate-700 font-medium">
            "Suggest optimal schedule for next week"
          </div>

          {/* AI Recommendation Card matching Reference Image */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
            <p className="text-slate-700 text-[11px] leading-relaxed">
              Based on current workload and resource availability, here is the optimized plan:
            </p>
            <ul className="space-y-1 text-[11px] text-slate-800 font-medium list-disc list-inside">
              <li>Reschedule WO-1042 to 13 Oct (after spare arrival).</li>
              <li>Move WO-1041 to Bay 2 to avoid conflict.</li>
              <li>Allocate 1 additional technician for avionics checks.</li>
              <li className="text-emerald-700 font-bold">This reduces total downtime by 18 hours.</li>
            </ul>

            <button
              onClick={handleApplySchedule}
              disabled={appliedSchedule}
              className={`w-full py-2 rounded-xl text-xs font-bold transition-all ${
                appliedSchedule
                  ? 'bg-emerald-100 text-emerald-800 cursor-default'
                  : 'bg-[#142A20] hover:bg-[#1a382b] text-emerald-400 border border-emerald-500/40 shadow-xs'
              }`}
            >
              {appliedSchedule ? '✓ Suggested Schedule Applied' : 'Apply Suggested Schedule'}
            </button>
          </div>

          {/* Input Bar */}
          <div className="flex items-center gap-1.5 pt-2">
            <input
              type="text"
              value={plannerInput}
              onChange={(e) => setPlannerInput(e.target.value)}
              placeholder="Ask about scheduling, delays..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
            />
            <button
              onClick={() => {
                if (plannerInput) {
                  setActionSuccess('AI Planner analyzed schedule constraints for next sorties.');
                  setPlannerInput('');
                  setTimeout(() => setActionSuccess(''), 4000);
                }
              }}
              className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Create Work Order */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden select-none">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Create Demo Work Order</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkOrder} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Aircraft</label>
                <select
                  value={newAircraft}
                  onChange={(e) => setNewAircraft(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Tejas T-04">Tejas T-04</option>
                  <option value="Rafale R-01">Rafale R-01</option>
                  <option value="Rafale R-02">Rafale R-02</option>
                  <option value="Tejas T-07">Tejas T-07</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Component</label>
                <select
                  value={newComponent}
                  onChange={(e) => setNewComponent(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Hydraulic System">Hydraulic System</option>
                  <option value="Engine">Engine</option>
                  <option value="Avionics">Avionics</option>
                  <option value="Landing Gear">Landing Gear</option>
                  <option value="Flight Control">Flight Control</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="Overhaul">Overhaul</option>
                    <option value="Inspection">Inspection</option>
                    <option value="Check">Check</option>
                    <option value="Repair">Repair</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Est. Hours</label>
                  <input
                    type="number"
                    value={newEstHours}
                    onChange={(e) => setNewEstHours(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    min={1}
                    max={72}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-xs"
                >
                  Create &amp; Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
