import React, { useState } from 'react';
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
import { LoginGateView } from './components/Auth/LoginGateView';
import { BaseOperationsView } from './components/CommandCenter/BaseOperationsView';
import { FleetOverviewView } from './components/CommandCenter/FleetOverviewView';
import { CommandApprovalsView } from './components/CommandCenter/CommandApprovalsView';
import { StrategicInsightsView } from './components/CommandCenter/StrategicInsightsView';
import { BaseId, AircraftData, UserRole, VerifyDepartmentTotpResponse } from './types/aircraft';
import { mockAirDoctorService } from './services/mockAirDoctorService';
import { api, setActiveUserRole } from './services/apiClient';
import { SecurityModal } from './components/Security/SecurityModal';


interface AuthSession {
  departmentId: string;
  departmentName: string;
  officer: string;
  serviceId: string;
  role: UserRole;
  defaultTab: string;
  authenticatedAt: string;
}

const SESSION_STORAGE_KEY = 'airdoctor_auth_session';

function getInitialSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.departmentId && parsed?.role) {
        return parsed;
      }
    }
  } catch {
    // sessionStorage fallback
  }
  return null;
}

export function App() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(getInitialSession);
  const [activeNav, setActiveNav] = useState<string>(() => authSession?.defaultTab || 'command-center');
  const [selectedBaseId, setSelectedBaseId] = useState<BaseId>('all');
  const [selectedAircraftId, setSelectedAircraftId] = useState<string>('rafale');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [ledgerRevision, setLedgerRevision] = useState<number>(0);
  const [currentRole, setCurrentRole] = useState<UserRole>(() => authSession?.role || 'Commander');
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);

  const [currentAircraftList, setCurrentAircraftList] = useState<AircraftData[]>(() =>
    mockAirDoctorService.get3DAircraft(selectedBaseId)
  );

  React.useEffect(() => {
    if (authSession?.role) {
      setActiveUserRole(authSession.role);
    }
  }, [authSession]);

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

  const handleDepartmentAuthenticated = (auth: VerifyDepartmentTotpResponse) => {
    const sessionData: AuthSession = {
      departmentId: auth.department_id,
      departmentName: auth.department_name,
      officer: auth.officer,
      serviceId: auth.service_id,
      role: auth.role,
      defaultTab: auth.default_tab,
      authenticatedAt: auth.authenticated_at,
    };

    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    } catch {
      // storage fallback
    }

    setAuthSession(sessionData);
    setCurrentRole(auth.role);
    setActiveUserRole(auth.role);
    setActiveNav(auth.default_tab);

    // Record login entry in SHA-256 Decision Ledger
    api.recordDecision({
      actor: auth.officer,
      action: 'USER_SESSION_AUTHENTICATED',
      previous_state: 'UNAUTHENTICATED_PORTAL_GATE',
      resulting_state: `Authenticated as ${auth.department_name} (${auth.role}) via 2-Step RFC 6238 TOTP`,
      notes: `Identity cleared by MoD Department Security Directory (${auth.service_id}). Access granted to ${auth.default_tab} view with ${auth.role} clearance.`,
      baseId: selectedBaseId,
    }).catch(() => {
      // ledger fallback
    });
    setLedgerRevision((prev) => prev + 1);
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // storage fallback
    }

    if (authSession) {
      api.recordDecision({
        actor: authSession.officer,
        action: 'USER_SESSION_LOCKED',
        previous_state: `Active Session: ${authSession.departmentName} (${authSession.role})`,
        resulting_state: `Session locked for ${authSession.departmentName}. Returned to 2-Step Cybersecurity Gate.`,
        notes: `User manual lock / switch department action. Session terminated. Department profile unmounted.`,
        baseId: selectedBaseId,
      }).catch(() => {});
      setLedgerRevision((prev) => prev + 1);
    }

    setAuthSession(null);
  };

  // If unauthenticated, display the 2-Step Cybersecurity Login Gate first
  if (!authSession) {
    return <LoginGateView onAuthenticated={handleDepartmentAuthenticated} />;
  }

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
        currentDepartment={authSession ? {
          id: authSession.departmentId,
          name: authSession.departmentName,
          officer: authSession.officer,
          serviceId: authSession.serviceId,
          role: authSession.role,
        } : null}
        onLogout={handleLogout}
      />

      {/* 2. Main Layout Container: Sidebar + Active Section */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar matching Images 1 & 2 */}
        <Sidebar
          activeNav={activeNav}
          onNavChange={setActiveNav}
          selectedBaseId={selectedBaseId}
          onSelectBase={handleSelectBase}
          currentRole={currentRole}
          pendingApprovalsCount={5}
        />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 max-w-[1740px] mx-auto w-full">
          {/* PAGE 1: Command Center (Commander) */}
          {activeNav === 'command-center' && (
            <CommandCenterView
              selectedBaseId={selectedBaseId}
              onSelectBase={handleSelectBase}
              onSelectAircraftAndNavigate={handleSelectAircraftAndNavigate}
              onNavigate={setActiveNav}
            />
          )}

          {/* Commander Subview: Base Operations */}
          {activeNav === 'base-operations' && (
            <BaseOperationsView
              onNavigateToCommandCenter={() => setActiveNav('command-center')}
            />
          )}

          {/* Commander Subview: Fleet Overview */}
          {activeNav === 'fleet-overview' && (
            <FleetOverviewView
              onSelectAircraftAndNavigate={handleSelectAircraftAndNavigate}
              onNavigateToCommandCenter={() => setActiveNav('command-center')}
            />
          )}

          {/* Commander Subview: Command Approvals */}
          {activeNav === 'command-approvals' && (
            <CommandApprovalsView
              onNavigateToCommandCenter={() => setActiveNav('command-center')}
            />
          )}

          {/* Commander Subview: Strategic Insights */}
          {activeNav === 'strategic-insights' && (
            <StrategicInsightsView
              onNavigateToCommandCenter={() => setActiveNav('command-center')}
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
          {(activeNav === 'work-orders' || activeNav === 'maintenance-scheduler') && (
            <WorkOrdersView
              selectedBaseId={selectedBaseId}
              onSelectBase={handleSelectBase}
              onLogDecision={handleLogDecisionCallback}
            />
          )}

          {/* PAGE 7: Reports & Analytics */}
          {(activeNav === 'reports' || activeNav === 'reports-analytics' || activeNav === 'reports-ledger') && (
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
