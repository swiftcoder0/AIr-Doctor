import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Shield,
  Lock,
  Key,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Building2,
  User,
  Clock,
  Sparkles,
  Plane,
  FileText,
  Boxes,
  Wrench,
  Compass,
} from 'lucide-react';
import {
  DepartmentProfile,
  DepartmentLoginResponse,
  VerifyDepartmentTotpResponse,
  DEPARTMENT_PROFILES,
  UserRole,
} from '../../types/aircraft';
import { api } from '../../services/apiClient';

interface LoginGateViewProps {
  onAuthenticated: (auth: VerifyDepartmentTotpResponse) => void;
}

export const LoginGateView: React.FC<LoginGateViewProps> = ({ onAuthenticated }) => {
  // Step state: 1 = Department & Password, 2 = TOTP Verification
  const [step, setStep] = useState<1 | 2>(1);

  // Departments list (from API or fallback)
  const [departments, setDepartments] = useState<DepartmentProfile[]>(DEPARTMENT_PROFILES);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('fleet-command');

  // Step 1 Form fields
  const [serviceId, setServiceId] = useState<string>('IAF-CMD-01');
  const [password, setPassword] = useState<string>('AirDoctor@2026');
  const [step1Loading, setStep1Loading] = useState<boolean>(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);

  // Step 2 State
  const [loginResponse, setLoginResponse] = useState<DepartmentLoginResponse | null>(null);
  const [totpCode, setTotpCode] = useState<string>('');
  const [step2Loading, setStep2Loading] = useState<boolean>(false);
  const [step2Error, setStep2Error] = useState<string | null>(null);

  // Live RFC 6238 TOTP Countdown (30-second window)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    return 30 - (Math.floor(Date.now() / 1000) % 30);
  });
  const [liveOtpCode, setLiveOtpCode] = useState<string>('');

  // Fetch departments on mount
  useEffect(() => {
    api.getDepartments().then((list) => {
      if (list && list.length > 0) {
        setDepartments(list);
      }
    }).catch(() => {
      // Handled by mock fallback
    });
  }, []);

  // Timer loop for 30s TOTP window
  useEffect(() => {
    const updateCountdown = () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const rem = 30 - (nowSec % 30);
      setRemainingSeconds(rem);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // When step 2 is active or remaining seconds reset to 30, re-fetch active TOTP code
  useEffect(() => {
    if (step === 2) {
      api.getAuthStatus().then((status) => {
        if (status?.demo_totp_code) {
          setLiveOtpCode(status.demo_totp_code);
        }
      }).catch(() => {
        // Fallback code
      });
    }
  }, [step, remainingSeconds === 30]);

  // Handle department card selection
  const handleSelectDepartment = (dept: DepartmentProfile) => {
    setSelectedDeptId(dept.id);
    setServiceId(dept.serviceId);
    setPassword('AirDoctor@2026'); // Evaluator 1-click convenience
    setStep1Error(null);
  };

  // Step 1: Submit password authentication
  const handleStep1Submit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStep1Loading(true);
    setStep1Error(null);

    try {
      const res = await api.loginDepartment({
        department_id: selectedDeptId,
        service_id: serviceId,
        password: password,
      });

      setLoginResponse(res);
      setLiveOtpCode(res.demo_totp_code || '777888');
      setStep(2);
    } catch (err: any) {
      setStep1Error(err?.message || 'Failed to authenticate department credentials. Please try again.');
    } finally {
      setStep1Loading(false);
    }
  };

  // Step 2: Submit TOTP Verification
  const handleStep2Submit = async (codeToVerify?: string) => {
    const targetCode = (codeToVerify || totpCode).trim();
    if (!targetCode) {
      setStep2Error('Please enter a 6-digit TOTP OTP code.');
      return;
    }

    setStep2Loading(true);
    setStep2Error(null);

    try {
      const res = await api.verifyDepartmentTotp({
        department_id: selectedDeptId,
        totp_code: targetCode,
      });

      onAuthenticated(res);
    } catch (err: any) {
      setStep2Error(err?.message || 'Invalid TOTP code. Please use the current 30-second token or click Auto-Fill.');
    } finally {
      setStep2Loading(false);
    }
  };

  // 1-Click Auto Fill & Unlock for evaluators
  const handleAutoFillAndSubmit = () => {
    const code = liveOtpCode || loginResponse?.demo_totp_code || '777888';
    setTotpCode(code);
    handleStep2Submit(code);
  };

  const selectedDept = departments.find((d) => d.id === selectedDeptId) || departments[0];

  const getDeptIcon = (id: string) => {
    switch (id) {
      case 'fleet-command':
        return <Plane className="w-5 h-5 text-emerald-600" />;
      case 'health-diagnostics':
        return <Compass className="w-5 h-5 text-blue-600" />;
      case 'tech-records':
        return <FileText className="w-5 h-5 text-indigo-600" />;
      case 'logistics-spares':
        return <Boxes className="w-5 h-5 text-amber-600" />;
      case 'maintenance-agency':
        return <Wrench className="w-5 h-5 text-slate-700" />;
      default:
        return <Building2 className="w-5 h-5 text-blue-600" />;
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'Commander':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Planner':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Viewer':
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans select-none text-slate-800">
      {/* Top Persistent Synthetic Data Banner */}
      <div className="bg-slate-900 text-slate-200 border-b border-slate-800 px-6 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono font-bold tracking-wider text-slate-100">
            MINISTRY OF DEFENCE • DEFENCE LOGISTICS &amp; READINESS
          </span>
        </div>
        <div className="hidden md:flex items-center gap-3">
          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-[11px] font-mono text-emerald-400 font-semibold border border-slate-700">
            SYNTHETIC / UNCLASSIFIED DATA — SIMULATED DEMO WORKFLOW
          </span>
          <span className="text-slate-400 font-mono text-[11px]">
            RFC 9106 ARGON2ID + RFC 6238 TOTP ACTIVE
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-5xl">
          {/* Header Branding */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>MoD Smart India Hackathon 2026 Solution</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              AirDoctor — Multi-Agency Integrated Maintenance Portal
            </h1>
            <p className="text-sm text-slate-600 max-w-2xl mx-auto mt-2">
              Breaking down 5 fragmented airbase silos into a unified real-time operational picture.
              Authenticate as your agency officer below to access authorized role views.
            </p>
          </div>

          {/* STEP 1: Department Selection + Password */}
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden transition-all">
              {/* Step indicator */}
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    Step 1 of 2: Select Airbase Department &amp; Password
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                  Step 2 requires Time-Based OTP (RFC 6238)
                </span>
              </div>

              <div className="p-6 space-y-6">
                {/* 5 Department Cards Quick-Select Grid */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      Who is Opening AirDoctor? (1-Click Evaluator Quick Select)
                    </label>
                    <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
                      Click any card to auto-fill credentials
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {departments.map((dept) => {
                      const isSelected = dept.id === selectedDeptId;
                      return (
                        <div
                          key={dept.id}
                          onClick={() => handleSelectDepartment(dept)}
                          className={`relative p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-md'
                              : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="p-2 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
                              {getDeptIcon(dept.id)}
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadge(
                                dept.role
                              )}`}
                            >
                              {dept.role.toUpperCase()}
                            </span>
                          </div>

                          <div className="font-bold text-xs text-slate-900 leading-snug">
                            {dept.name}
                          </div>
                          <div className="text-[11px] font-semibold text-blue-700 mt-1 flex items-center gap-1">
                            <User className="w-3 h-3 text-blue-500" />
                            {dept.officer}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            Service ID: {dept.serviceId}
                          </div>

                          <p className="text-[11px] text-slate-600 mt-2 line-clamp-2 leading-relaxed bg-white/70 p-1.5 rounded border border-slate-200/50">
                            {dept.description}
                          </p>

                          {isSelected && (
                            <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                              <CheckCircle2 className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Form Credentials Section */}
                <form onSubmit={handleStep1Submit} className="pt-2 border-t border-slate-200 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Officer Service ID / Department Tag
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <User className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          value={serviceId}
                          onChange={(e) => setServiceId(e.target.value)}
                          placeholder="e.g. IAF-CMD-01"
                          required
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Department Security Key (Password)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Key className="w-4 h-4" />
                        </div>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="AirDoctor@2026"
                          required
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Evaluator Convenience Info Box */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2 text-xs text-slate-600">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800">Evaluator Preset: </span>
                      Password is pre-set to{' '}
                      <code className="px-1.5 py-0.5 bg-white border border-slate-300 rounded text-blue-700 font-mono font-bold">
                        AirDoctor@2026
                      </code>
                      . Selecting any department card above automatically configures valid credentials.
                    </div>
                  </div>

                  {step1Error && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800 font-medium">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{step1Error}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end pt-2">
                    <button
                      type="submit"
                      disabled={step1Loading}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                    >
                      {step1Loading ? (
                        <span>Verifying Credentials...</span>
                      ) : (
                        <>
                          <span>Verify Password &amp; Request TOTP Code</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* STEP 2: RFC 6238 TOTP Multi-Factor Verification */}
          {step === 2 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden transition-all max-w-2xl mx-auto">
              {/* Step indicator */}
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span className="font-bold text-slate-800 text-sm">
                    Step 2 of 2: Time-Based OTP (TOTP) Verification
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change Department</span>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Officer & Role Profile Banner */}
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      {getDeptIcon(selectedDept.id)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        {selectedDept.officer}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        {selectedDept.name} • <span className="font-mono">{selectedDept.serviceId}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getRoleBadge(
                      selectedDept.role
                    )}`}
                  >
                    {selectedDept.role.toUpperCase()}
                  </span>
                </div>

                {/* 30-Second RFC 6238 Countdown Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>RFC 6238 TOTP Cycle Validity</span>
                    </span>
                    <span className="font-mono font-bold text-blue-700">
                      {remainingSeconds}s remaining
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        remainingSeconds > 10 ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                      }`}
                      style={{ width: `${(remainingSeconds / 30) * 100}%` }}
                    />
                  </div>
                </div>

                {/* 6-Digit OTP Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 text-center">
                    Enter 6-Digit Authenticator OTP Code
                  </label>
                  <div className="flex justify-center">
                    <input
                      type="text"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-56 py-3 px-4 bg-slate-50 border-2 border-slate-300 rounded-xl text-2xl font-mono font-extrabold text-slate-900 tracking-[0.5em] text-center focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all shadow-inner"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Evaluator Demo Helper Box */}
                <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                      <ShieldCheck className="w-4 h-4 text-blue-700" />
                      <span>Evaluator Demo Helper</span>
                    </div>
                    <span className="text-[10px] bg-blue-200/80 text-blue-800 font-mono font-bold px-2 py-0.5 rounded">
                      ACTIVE RFC 6238 TOKEN
                    </span>
                  </div>

                  <p className="text-xs text-blue-800 leading-relaxed">
                    AirDoctor uses standards-compliant RFC 6238 TOTP. In demo mode, the active code for the
                    current 30-second window is computed below:
                  </p>

                  <div className="flex items-center justify-between gap-3 p-2.5 bg-white rounded-lg border border-blue-200">
                    <div className="font-mono text-base font-extrabold text-blue-900 tracking-wider">
                      {liveOtpCode || loginResponse?.demo_totp_code || '777888'}
                    </div>
                    <button
                      type="button"
                      onClick={handleAutoFillAndSubmit}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Auto-Fill OTP &amp; Unlock</span>
                    </button>
                  </div>
                </div>

                {step2Error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800 font-medium">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{step2Error}</span>
                  </div>
                )}

                {/* Submit Actions */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-all cursor-pointer"
                  >
                    ← Back to Step 1
                  </button>

                  <button
                    type="button"
                    disabled={step2Loading || totpCode.length < 6}
                    onClick={() => handleStep2Submit()}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
                  >
                    {step2Loading ? (
                      <span>Verifying Token...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify OTP &amp; Access Portal</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer note */}
          <div className="text-center text-xs text-slate-500 mt-6">
            Protected under Ministry of Defence RBAC &amp; SHA-256 Tamper-Evident Ledger Integrity Protocols
          </div>
        </div>
      </div>
    </div>
  );
};
