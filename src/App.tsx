import React, { useState, useEffect } from 'react';
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
import { TechRecordsView } from './components/TechRecords/TechRecordsView';
import { LogisticsDashboardView } from './components/Logistics/LogisticsDashboardView';
import { MaintenanceControlCentreView } from './components/Maintenance/MaintenanceControlCentreView';
import { DepartmentSetupWorkspaceView } from './components/DepartmentWorkspace/DepartmentSetupWorkspaceView';
import { AccessRestrictedView } from './components/Security/AccessRestrictedView';
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
const ACTIVE_NAV_STORAGE_KEY = 'airdoctor_active_nav';

// Map each department to its authorized primary landing page
export function getDepartmentLandingPage(departmentId: string): string {
  switch (departmentId) {
    case 'fleet-command':
      return 'command-center';
    case 'health-diagnostics':
      return 'aircraft-health';
    case 'tech-records':
      return 'tech-records';
    case 'logistics-spares':
      return 'logistics-spares';
    case 'maintenance-agency':
      return 'maintenance-agency';
    default:
      return 'command-center';
  }
}

// Strict department RBAC route permission matrix
export const DEPARTMENT_ALLOWED_ROUTES: Record<string, string[]> = {
  'fleet-command': [
    'command-center',
    'base-operations',
    'fleet-overview',
    'command-approvals',
    'strategic-insights',
    'reports',
    'reports-analytics',
    'ai-assistant',
  ],
  'health-diagnostics': [
    'aircraft-health',
    'digital-twin',
    'component-analytics',
    'ai-predictions',
    'usage-simulator',
    'diagnostic-cases',
    'reports-health',
    'reports',
    'reports-analytics',
    'ai-assistant',
  ],
  'tech-records': [
    'tech-records',
    'records-overview',
    'import-records',
    'data-sources',
    'aircraft-records',
    'maintenance-history',
    'inspection-records',
    'component-changes',
    'previous-records',
    'verify-queue',
    'audit-trail',
    'reports-tech',
    'data-trust',
    'data-import',
    'audit-ledger',
    'reports',
    'reports-analytics',
    'reports-ledger',
    'ai-assistant',
  ],
  'logistics-spares': [
    'logistics-spares',
    'logistics-overview',
    'spares-inventory',
    'material-requests',
    'transfers',
    'procurement',
    'stock-movement',
    'suppliers-sources',
    'resource-optimizer',
    'optimizer',
    'maintenance-logistics',
    'logistics',
    'reports-logistics',
    'reports',
    'reports-analytics',
    'ai-assistant',
  ],
  'maintenance-agency': [
    'maintenance-agency',
    'maintenance-overview',
    'assigned-work-orders',
    'work-orders',
    'repair-workflow',
    'technicians-bays',
    'hangar-bays',
    'parts-materials',
    'inspection-signoff',
    'rtf-schedule',
    'documents-reports',
    'reports-maintenance',
    'activity-history',
    'maintenance-scheduler',
    'reports',
    'reports-analytics',
    'ai-assistant',
  ],
};

export function isRouteAuthorizedForDepartment(departmentId: string, route: string): boolean {
  const allowed = DEPARTMENT_ALLOWED_ROUTES[departmentId];
  if (!allowed) return false;
  return allowed.includes(route);
}

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

  // Restore activeNav strictly respecting department permissions
  const [activeNav, setActiveNav] = useState<string>(() => {
    const sess = getInitialSession();
    if (!sess) return 'command-center';
    try {
      const savedNav = sessionStorage.getItem(ACTIVE_NAV_STORAGE_KEY);
      if (savedNav && isRouteAuthorizedForDepartment(sess.departmentId, savedNav)) {
        return savedNav;
      }
    } catch {
      // storage fallback
    }
    return getDepartmentLandingPage(sess.departmentId);
  });

  const [selectedBaseId, setSelectedBaseId] = useState<BaseId>('all');
  const [selectedAircraftId, setSelectedAircraftId] = useState<string>('rafale');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [ledgerRevision, setLedgerRevision] = useState<number>(0);
  const [currentRole, setCurrentRole] = useState<UserRole>(() => authSession?.role || 'Commander');
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);

  const [currentAircraftList, setCurrentAircraftList] = useState<AircraftData[]>(() =>
    mockAirDoctorService.get3DAircraft(selectedBaseId)
  );

  useEffect(() => {
    if (authSession?.role) {
      setActiveUserRole(authSession.role);
    }
  }, [authSession]);

  useEffect(() => {
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

  const handleNavChange = (newNav: string) => {
    setActiveNav(newNav);
    try {
      sessionStorage.setItem(ACTIVE_NAV_STORAGE_KEY, newNav);
    } catch {
      // storage fallback
    }
  };

  const handleSelectAircraftAndNavigate = (aircraftId: string) => {
    if (aircraftId.toLowerCase().includes('tejas') || aircraftId.toUpperCase().startsWith('T')) {
      setSelectedAircraftId('tejas');
    } else {
      setSelectedAircraftId('rafale');
    }
    if (authSession && isRouteAuthorizedForDepartment(authSession.departmentId, 'aircraft-health')) {
      handleNavChange('aircraft-health');
    }
  };

  const handleLogDecisionCallback = () => {
    setLedgerRevision((prev) => prev + 1);
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    setActiveUserRole(role);
  };

  const handleDepartmentAuthenticated = (auth: VerifyDepartmentTotpResponse) => {
    const landingTab = getDepartmentLandingPage(auth.department_id);
    const sessionData: AuthSession = {
      departmentId: auth.department_id,
      departmentName: auth.department_name,
      officer: auth.officer,
      serviceId: auth.service_id,
      role: auth.role,
      defaultTab: landingTab,
      authenticatedAt: auth.authenticated_at,
    };

    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
      sessionStorage.setItem(ACTIVE_NAV_STORAGE_KEY, landingTab);
    } catch {
      // storage fallback
    }

    setAuthSession(sessionData);
    setCurrentRole(auth.role);
    setActiveUserRole(auth.role);
    setActiveNav(landingTab);

    // Record login entry in SHA-256 Decision Ledger
    api.recordDecision({
      actor: auth.officer,
      action: 'USER_SESSION_AUTHENTICATED',
      previous_state: 'UNAUTHENTICATED_PORTAL_GATE',
      resulting_state: `Authenticated as ${auth.department_name} (${auth.role}) via 2-Step RFC 6238 TOTP`,
      notes: `Identity cleared by MoD Department Security Directory (${auth.service_id}). Access granted to ${landingTab} view with ${auth.role} clearance.`,
      baseId: selectedBaseId,
    }).catch(() => {
      // ledger fallback
    });
    setLedgerRevision((prev) => prev + 1);
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem(ACTIVE_NAV_STORAGE_KEY);
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
    setActiveNav('command-center');
    setCurrentRole('Commander');
  };

  // If unauthenticated, display the 2-Step Cybersecurity Login Gate first
  if (!authSession) {
    return <LoginGateView onAuthenticated={handleDepartmentAuthenticated} />;
  }

  // Check if current activeNav is authorized for the active department session
  const isAuthorized = isRouteAuthorizedForDepartment(authSession.departmentId, activeNav);

  return (
    <div className="h-screen max-h-screen bg-[#F8FAFC] flex font-sans select-none text-slate-800 overflow-hidden">
      {/* 1. Left Navigation Sidebar extending full height (100vh) */}
      <Sidebar
        activeNav={activeNav}
        onNavChange={handleNavChange}
        selectedBaseId={selectedBaseId}
        onSelectBase={handleSelectBase}
        currentRole={currentRole}
        currentDepartmentId={authSession.departmentId}
        currentDepartmentName={authSession.departmentName}
        pendingApprovalsCount={5}
      />

      {/* 2. Right Side: Clean Header + Scrollable Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header with Search, Live Render Indicator & Controls */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedBaseId={selectedBaseId}
          onSelectBase={handleSelectBase}
          onNavigateToAssistant={() => handleNavChange('ai-assistant')}
          currentRole={currentRole}
          onRoleChange={handleRoleChange}
          onOpenSecurityModal={() => setIsSecurityModalOpen(true)}
          currentDepartment={{
            id: authSession.departmentId,
            name: authSession.departmentName,
            officer: authSession.officer,
            serviceId: authSession.serviceId,
            role: authSession.role,
          }}
          onLogout={handleLogout}
        />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 max-w-[1740px] mx-auto w-full">
          {/* Route Guard: If route is unauthorized for this department, display Access Restricted screen */}
          {!isAuthorized ? (
            <AccessRestrictedView
              attemptedRoute={activeNav}
              departmentId={authSession.departmentId}
              departmentName={authSession.departmentName}
              officer={authSession.officer}
              serviceId={authSession.serviceId}
              role={authSession.role}
              permittedLandingRoute={getDepartmentLandingPage(authSession.departmentId)}
              permittedLandingLabel={authSession.departmentName.split('(')[0].trim()}
              onNavigateHome={() => handleNavChange(getDepartmentLandingPage(authSession.departmentId))}
              onLogout={handleLogout}
            />
          ) : (
            <>
              {/* PAGE 1: Command Center (Fleet Command Only) */}
              {activeNav === 'command-center' && (
                <CommandCenterView
                  selectedBaseId={selectedBaseId}
                  onSelectBase={handleSelectBase}
                  onSelectAircraftAndNavigate={handleSelectAircraftAndNavigate}
                  onNavigate={handleNavChange}
                />
              )}

              {/* Commander Subview: Base Operations */}
              {activeNav === 'base-operations' && (
                <BaseOperationsView
                  onNavigateToCommandCenter={() => handleNavChange('command-center')}
                />
              )}

              {/* Commander Subview: Fleet Overview */}
              {activeNav === 'fleet-overview' && (
                <FleetOverviewView
                  onSelectAircraftAndNavigate={handleSelectAircraftAndNavigate}
                  onNavigateToCommandCenter={() => handleNavChange('command-center')}
                />
              )}

              {/* Commander Subview: Command Approvals */}
              {activeNav === 'command-approvals' && (
                <CommandApprovalsView
                  onNavigateToCommandCenter={() => handleNavChange('command-center')}
                />
              )}

              {/* Commander Subview: Strategic Insights */}
              {activeNav === 'strategic-insights' && (
                <StrategicInsightsView
                  onNavigateToCommandCenter={() => handleNavChange('command-center')}
                />
              )}

              {/* PAGE 2: Aircraft Health & Diagnostics Workspace (3D Digital Twin, Analytics, Predictions, Simulator, Cases) */}
              {(activeNav === 'aircraft-health' ||
                activeNav === 'digital-twin' ||
                activeNav === 'component-analytics' ||
                activeNav === 'ai-predictions' ||
                activeNav === 'usage-simulator' ||
                activeNav === 'diagnostic-cases') && (
                <DigitalTwinView
                  aircraftList={currentAircraftList}
                  selectedAircraftId={selectedAircraftId}
                  onSelectAircraft={setSelectedAircraftId}
                  searchQuery={searchQuery}
                  activeNav={activeNav}
                />
              )}

              {/* PAGE 3: Technical Records & Quality Workspace */}
              {(activeNav === 'tech-records' ||
                activeNav === 'records-overview' ||
                activeNav === 'import-records' ||
                activeNav === 'data-sources' ||
                activeNav === 'aircraft-records' ||
                activeNav === 'maintenance-history' ||
                activeNav === 'inspection-records' ||
                activeNav === 'component-changes' ||
                activeNav === 'previous-records' ||
                activeNav === 'verify-queue' ||
                activeNav === 'audit-trail') && (
                <TechRecordsView
                  activeNav={activeNav}
                  onNavigate={handleNavChange}
                  onLogDecision={handleLogDecisionCallback}
                />
              )}

              {/* PAGE 4: Logistics & Spares Workspace */}
              {(activeNav === 'logistics-spares' ||
                activeNav === 'logistics-overview' ||
                activeNav === 'spares-inventory' ||
                activeNav === 'material-requests' ||
                activeNav === 'transfers' ||
                activeNav === 'procurement' ||
                activeNav === 'stock-movement' ||
                activeNav === 'suppliers-sources') && (
                <LogisticsDashboardView
                  activeNav={activeNav}
                  onNavigate={handleNavChange}
                  onLogDecision={handleLogDecisionCallback}
                />
              )}

              {/* PAGE 5: Maintenance Control Centre Workspace */}
              {(activeNav === 'maintenance-agency' ||
                activeNav === 'maintenance-overview' ||
                activeNav === 'assigned-work-orders' ||
                activeNav === 'repair-workflow' ||
                activeNav === 'technicians-bays' ||
                activeNav === 'parts-materials' ||
                activeNav === 'inspection-signoff' ||
                activeNav === 'documents-reports' ||
                activeNav === 'activity-history' ||
                (authSession.departmentId === 'maintenance-agency' &&
                  (activeNav === 'work-orders' ||
                    activeNav === 'hangar-bays' ||
                    activeNav === 'rtf-schedule' ||
                    activeNav === 'reports-maintenance'))) && (
                <MaintenanceControlCentreView
                  activeNav={activeNav}
                  onNavigate={handleNavChange}
                  onLogDecision={handleLogDecisionCallback}
                  currentRole={currentRole}
                  selectedBaseId={selectedBaseId}
                />
              )}

              {/* Legacy Technical Records Tools: Data Import, Trust Records */}
              {(activeNav === 'data-import' || activeNav === 'data-trust') && (
                <DataTrustView
                  selectedBaseId={selectedBaseId}
                  onSelectBase={handleSelectBase}
                  onLogDecision={handleLogDecisionCallback}
                />
              )}

              {/* Legacy Maintenance Logistics View (for other departments) */}
              {(activeNav === 'maintenance-logistics' || activeNav === 'logistics') && (
                <LogisticsView
                  selectedBaseId={selectedBaseId}
                  onSelectBase={handleSelectBase}
                  onNavigate={handleNavChange}
                  onLogDecision={handleLogDecisionCallback}
                />
              )}

              {/* Logistics Tools: Resource Recovery Optimizer */}
              {(activeNav === 'resource-optimizer' || activeNav === 'optimizer') && (
                <ResourceOptimizerView
                  onLogDecision={handleLogDecisionCallback}
                  onNavigate={handleNavChange}
                />
              )}

              {/* Legacy Work Orders View (for non-maintenance departments) */}
              {authSession.departmentId !== 'maintenance-agency' &&
                (activeNav === 'work-orders' ||
                  activeNav === 'maintenance-scheduler' ||
                  activeNav === 'hangar-bays' ||
                  activeNav === 'rtf-schedule') && (
                  <WorkOrdersView
                    selectedBaseId={selectedBaseId}
                    onSelectBase={handleSelectBase}
                    onLogDecision={handleLogDecisionCallback}
                  />
                )}

              {/* Dedicated AI Assistant */}
              {activeNav === 'ai-assistant' && (
                <AiAssistantView
                  selectedBaseId={selectedBaseId}
                  onNavigate={handleNavChange}
                  onLogDecision={handleLogDecisionCallback}
                />
              )}

              {/* Reports & Analytics (Department Authorized Reports & Audit Ledger) */}
              {(activeNav === 'reports' ||
                activeNav === 'reports-analytics' ||
                activeNav === 'reports-health' ||
                activeNav === 'reports-tech' ||
                activeNav === 'reports-logistics' ||
                activeNav === 'reports-maintenance' ||
                activeNav === 'audit-ledger' ||
                activeNav === 'reports-ledger') && (
                <ReportsAnalyticsView
                  selectedBaseId={selectedBaseId}
                  onSelectBase={handleSelectBase}
                  onLogDecision={handleLogDecisionCallback}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Cybersecurity & TOTP MFA Modal */}
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
