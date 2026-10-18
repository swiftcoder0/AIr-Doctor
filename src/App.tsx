import React, { useState, useMemo } from 'react';
import { Header } from './components/Header/Header';
import { Sidebar } from './components/Sidebar/Sidebar';
import { CommandCenterView } from './components/CommandCenter/CommandCenterView';
import { DigitalTwinView } from './components/DigitalTwin/DigitalTwinView';
import { DataTrustView } from './components/DataTrust/DataTrustView';
import { LogisticsView } from './components/Logistics/LogisticsView';
import { ResourceOptimizerView } from './components/Optimizer/ResourceOptimizerView';
import { WorkOrdersView } from './components/WorkOrders/WorkOrdersView';
import { ReportsAnalyticsView } from './components/Reports/ReportsAnalyticsView';
import { AiAssistantView } from './components/AiAssistant/AiAssistantView';
import { BaseId, AircraftData, UserRole } from './types/aircraft';
import { mockAirDoctorService } from './services/mockAirDoctorService';
import { api, setActiveUserRole } from './services/apiClient';
import { SecurityModal } from './components/Security/SecurityModal';

export function App() {
  const [activeNav, setActiveNav] = useState<string>('command-center');
  const [selectedBaseId, setSelectedBaseId] = useState<BaseId>('all');
  const [selectedAircraftId, setSelectedAircraftId] = useState<string>('rafale');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [ledgerRevision, setLedgerRevision] = useState<number>(0);
  const [currentRole, setCurrentRole] = useState<UserRole>('Commander');
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);

  const [currentAircraftList, setCurrentAircraftList] = useState<AircraftData[]>(() =>
    mockAirDoctorService.get3DAircraft(selectedBaseId)
  );

  React.useEffect(() => {
    let active = true;
    api.get3DAircraft(selectedBaseId).then((data) => {
      if (active && data && data.length > 0) setCurrentAircraftList(data);
    });
    return () => { active = false; };
  }, [selectedBaseId, ledgerRevision]);

  // Synchronize active aircraft if base changes and current aircraft is not in base
  const handleSelectBase = (baseId: BaseId) => {
    setSelectedBaseId(baseId);
    if (baseId === 'base-alpha') {
      setSelectedAircraftId('rafale');
    } else if (baseId === 'base-bravo') {
      setSelectedAircraftId('tejas');
    }
  };

  const handleSelectAircraftAndNavigate = (aircraftId: string) => {
    if (aircraftId.toLowerCase().includes('tejas') || aircraftId.toUpperCase().startsWith('T')) {
      setSelectedAircraftId('tejas');
    } else {
      setSelectedAircraftId('rafale');
    }
    setActiveNav('aircraft-health');
  };

  const handleLogDecisionCallback = () => {
    setLedgerRevision((prev) => prev + 1);
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    setActiveUserRole(role);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans select-none text-slate-800">
      {/* 1. Header with Base Selector, Search & Operations Banner */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedBaseId={selectedBaseId}
        onSelectBase={handleSelectBase}
        onNavigateToAssistant={() => setActiveNav('ai-assistant')}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
      />

      {/* 2. Main Layout Container: Sidebar + Active Section */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar matching Images 1 & 2 */}
        <Sidebar
          activeNav={activeNav}
          onNavChange={setActiveNav}
          selectedBaseId={selectedBaseId}
          onSelectBase={handleSelectBase}
        />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 max-w-[1740px] mx-auto w-full">
          {/* PAGE 1: Command Center (Image 1, 1/4) */}
          {activeNav === 'command-center' && (
            <CommandCenterView
              selectedBaseId={selectedBaseId}
              onSelectBase={handleSelectBase}
              onSelectAircraftAndNavigate={handleSelectAircraftAndNavigate}
              onNavigate={setActiveNav}
            />
          )}

          {/* PAGE 2: Aircraft Health & 3D Digital Twin (Image 1, 2/4) */}
          {(activeNav === 'aircraft-health' || activeNav === 'digital-twin') && (
            <DigitalTwinView
              aircraftList={currentAircraftList}
              selectedAircraftId={selectedAircraftId}
              onSelectAircraft={setSelectedAircraftId}
              searchQuery={searchQuery}
            />
          )}

          {/* PAGE 3: Base Data Import & Data Trust (Image 1, 3/4) */}
          {(activeNav === 'data-import' || activeNav === 'data-trust') && (
            <DataTrustView
              selectedBaseId={selectedBaseId}
              onSelectBase={handleSelectBase}
              onLogDecision={handleLogDecisionCallback}
            />
          )}

          {/* PAGE 4: Maintenance & Logistics (Image 1, 4/4) */}
          {(activeNav === 'maintenance-logistics' || activeNav === 'logistics') && (
            <LogisticsView
              selectedBaseId={selectedBaseId}
              onSelectBase={handleSelectBase}
              onNavigate={setActiveNav}
              onLogDecision={handleLogDecisionCallback}
            />
          )}

          {/* Resource Recovery Optimizer Sandbox */}
          {(activeNav === 'resource-optimizer' || activeNav === 'optimizer') && (
            <ResourceOptimizerView
              onLogDecision={handleLogDecisionCallback}
              onNavigate={setActiveNav}
            />
          )}

          {/* PAGE 5: Dedicated AI Assistant (Image 2, 5/7) */}
          {activeNav === 'ai-assistant' && (
            <AiAssistantView
              selectedBaseId={selectedBaseId}
              onNavigate={setActiveNav}
              onLogDecision={handleLogDecisionCallback}
            />
          )}

          {/* PAGE 6: Work Orders & Maintenance Scheduler (Image 2, 6/7) */}
          {activeNav === 'work-orders' && (
            <WorkOrdersView
              selectedBaseId={selectedBaseId}
              onSelectBase={handleSelectBase}
              onLogDecision={handleLogDecisionCallback}
            />
          )}

          {/* PAGE 7: Reports & Analytics (Image 2, 7/7) */}
          {(activeNav === 'reports-analytics' || activeNav === 'reports-ledger') && (
            <ReportsAnalyticsView
              selectedBaseId={selectedBaseId}
              onSelectBase={handleSelectBase}
              onLogDecision={handleLogDecisionCallback}
            />
          )}
        </main>
      </div>

      {/* Cybersecurity & TOTP MFA Modal (Task 2) */}
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        currentRole={currentRole}
        onRoleSelect={handleRoleChange}
      />
    </div>
  );
}

export default App;
