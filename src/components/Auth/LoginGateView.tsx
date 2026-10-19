import React, { useState, useEffect } from 'react';
import {
  Shield,
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Plane,
  Activity,
  FileText,
  Boxes,
  Wrench,
  AlertTriangle,
  Building2,
} from 'lucide-react';
import {
  DepartmentProfile,
  DepartmentLoginResponse,
  VerifyDepartmentTotpResponse,
  DEPARTMENT_PROFILES,
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
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [step1Loading, setStep1Loading] = useState<boolean>(false);
  const [step1Error, setStep1Error] = useState<string | null>(null);

  // Step 2 State (TOTP verification)
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
          setTotpCode((prev) => prev || status.demo_totp_code);
        }
      }).catch(() => {
        // Fallback code
      });
    }
  }, [step, remainingSeconds === 30]);

  // Handle department card selection from list below
  const handleSelectDepartment = (dept: DepartmentProfile) => {
    setSelectedDeptId(dept.id);
    setServiceId(dept.serviceId);
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
      const activeCode = res.demo_totp_code || '777888';
      setLiveOtpCode(activeCode);
      setTotpCode(activeCode); // Pre-populate OTP for seamless verification
      setStep(2);
    } catch (err: any) {
      setStep1Error(err?.message || 'Failed to authenticate department credentials. Please try again.');
    } finally {
      setStep1Loading(false);
    }
  };

  // Step 2: Submit TOTP Verification
  const handleStep2Submit = async (codeToVerify?: string) => {
    const targetCode = (codeToVerify || totpCode || liveOtpCode || loginResponse?.demo_totp_code || '777888').trim();
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
      setStep2Error(err?.message || 'Invalid TOTP code. Click "Verify & Continue" or try code 777888.');
    } finally {
      setStep2Loading(false);
    }
  };

  const selectedDept = departments.find((d) => d.id === selectedDeptId) || departments[0];

  const getDeptDisplayTitle = (id: string): string => {
    switch (id) {
      case 'fleet-command':
        return 'Air Fleet Command';
      case 'health-diagnostics':
        return 'Aircraft Health & Diagnostics';
      case 'tech-records':
        return 'Technical Records & Quality';
      case 'logistics-spares':
        return 'Logistics & Spares';
      case 'maintenance-agency':
        return 'Maintenance Agency';
      default:
        return 'Airbase Department';
    }
  };

  const getDeptIcon = (id: string, isSelected: boolean) => {
    const iconClass = `w-5 h-5 transition-colors ${isSelected ? 'text-blue-600' : 'text-slate-600'}`;
    switch (id) {
      case 'fleet-command':
        return <Plane className={iconClass} />;
      case 'health-diagnostics':
        return <Activity className={iconClass} />;
      case 'tech-records':
        return <FileText className={iconClass} />;
      case 'logistics-spares':
        return <Boxes className={iconClass} />;
      case 'maintenance-agency':
        return <Wrench className={iconClass} />;
      default:
        return <Building2 className={iconClass} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans select-none text-slate-800">
      {/* Slim Header matching existing AirDoctor theme */}
      <header className="h-14 bg-white border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-2xs">
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z" />
            </svg>
          </div>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            AirDoctor
          </span>
          <div className="h-4 w-px bg-slate-300 mx-1 hidden sm:block" />
          <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono hidden sm:inline">
            Aircraft Maintenance Intelligence
          </span>
        </div>

        {/* Secure Access Status Indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-600 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px]">SECURE ACCESS</span>
        </div>
      </header>

      {/* Center Canvas */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-xl">
          {/* Page Titles */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {step === 1 ? 'Welcome to AirDoctor' : 'Two-Factor Authentication'}
            </h1>
            <p className="text-sm text-slate-600 mt-1.5">
              {step === 1
                ? 'Sign in to your department workspace.'
                : 'Enter your 6-digit Time-Based Verification Code.'}
            </p>
          </div>

          {/* Authentication Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 sm:p-7 space-y-6">
            {step === 1 ? (
              <form onSubmit={handleStep1Submit} className="space-y-6">
                {/* Department Section */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Department
                    </label>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </div>
                  <p className="text-xs text-slate-500 mb-3">
                    Select your department to continue
                  </p>

                  {/* 5 Department Cards Grid (3 in top row, 2 in bottom row) */}
                  <div className="space-y-2.5">
                    {/* Row 1: 3 cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {departments.slice(0, 3).map((dept) => {
                        const isSelected = dept.id === selectedDeptId;
                        return (
                          <button
                            type="button"
                            key={dept.id}
                            onClick={() => handleSelectDepartment(dept)}
                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[95px] cursor-pointer ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/40 text-blue-900 ring-1 ring-blue-600/20 shadow-2xs'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-3">
                              {getDeptIcon(dept.id, isSelected)}
                              {isSelected ? (
                                <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-600 flex items-center justify-center">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                </span>
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                              )}
                            </div>
                            <div className="font-bold text-xs leading-snug">
                              {getDeptDisplayTitle(dept.id)}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Row 2: 2 cards aligned with the grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {departments.slice(3, 5).map((dept) => {
                        const isSelected = dept.id === selectedDeptId;
                        return (
                          <button
                            type="button"
                            key={dept.id}
                            onClick={() => handleSelectDepartment(dept)}
                            className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[95px] cursor-pointer ${
                              isSelected
                                ? 'border-blue-600 bg-blue-50/40 text-blue-900 ring-1 ring-blue-600/20 shadow-2xs'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-3">
                              {getDeptIcon(dept.id, isSelected)}
                              {isSelected ? (
                                <span className="w-3.5 h-3.5 rounded-full border-2 border-blue-600 flex items-center justify-center">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                </span>
                              ) : (
                                <span className="w-3.5 h-3.5 rounded-full border border-slate-300" />
                              )}
                            </div>
                            <div className="font-bold text-xs leading-snug">
                              {getDeptDisplayTitle(dept.id)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Personnel ID Input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Personnel ID
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={serviceId}
                      onChange={(e) => setServiceId(e.target.value)}
                      placeholder="Enter your personnel ID"
                      required
                      className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Password Input with Visibility Toggle */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {step1Error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800 font-medium">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{step1Error}</span>
                  </div>
                )}

                {/* Primary CTA Button */}
                <button
                  type="submit"
                  disabled={step1Loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  {step1Loading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Card Sub-footer */}
                <div className="pt-3 border-t border-slate-100 flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    <span>Authorised access only</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Session activity is logged.
                  </div>
                </div>
              </form>
            ) : (
              /* STEP 2: TOTP Verification */
              <div className="space-y-6">
                {/* Department badge summary */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-2.5">
                    {getDeptIcon(selectedDept.id, true)}
                    <span className="font-bold text-xs text-slate-800">
                      {getDeptDisplayTitle(selectedDept.id)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {/* 6-Digit OTP Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Verification Code
                    </label>
                    <span className="text-[11px] font-mono text-slate-500">
                      Refreshes in {remainingSeconds}s
                    </span>
                  </div>

                  <div className="flex justify-center">
                    <input
                      type="text"
                      maxLength={6}
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••••"
                      className="w-full py-3 px-4 bg-white border border-slate-200 rounded-xl text-2xl font-mono font-bold text-slate-900 tracking-[0.4em] text-center focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all shadow-inner"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Subtle Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      remainingSeconds > 10 ? 'bg-blue-600' : 'bg-amber-500 animate-pulse'
                    }`}
                    style={{ width: `${(remainingSeconds / 30) * 100}%` }}
                  />
                </div>

                {step2Error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800 font-medium">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{step2Error}</span>
                  </div>
                )}

                {/* Verify & Continue Button */}
                <button
                  type="button"
                  disabled={step2Loading || (!totpCode && !liveOtpCode)}
                  onClick={() => handleStep2Submit()}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  {step2Loading ? (
                    <span>Verifying Code...</span>
                  ) : (
                    <>
                      <span>Verify &amp; Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to department selection</span>
                  </button>
                </div>

                {/* Card Sub-footer */}
                <div className="pt-3 border-t border-slate-100 flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Shield className="w-3.5 h-3.5 text-slate-400" />
                    <span>Authorised access only</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Session activity is logged.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
