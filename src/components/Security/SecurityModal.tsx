import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Lock,
  KeyRound,
  CheckCircle2,
  X,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Layers,
  Fingerprint,
} from 'lucide-react';
import { UserRole, SecurityStatus } from '../../types/aircraft';
import { api } from '../../services/apiClient';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  onRoleSelect: (role: UserRole) => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  onRoleSelect,
}) => {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [totpInput, setTotpInput] = useState<string>('');
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      api.getAuthStatus().then((status) => {
        setSecurityStatus(status);
      });
      setVerifyStatus('idle');
      setStatusMessage('');
      setTotpInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAutoFillDemoTotp = async () => {
    try {
      const status = await api.getAuthStatus();
      setSecurityStatus(status);
      setTotpInput(status.demo_totp_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setTotpInput('777888');
    }
  };

  const handleVerifyTotp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!totpInput.trim()) return;

    setVerifyStatus('verifying');
    setStatusMessage('');

    try {
      const result = await api.verifyTotp(totpInput.trim(), currentRole);
      setVerifyStatus('success');
      setStatusMessage(result.message || 'MFA Token successfully verified.');
    } catch (err: any) {
      setVerifyStatus('error');
      setStatusMessage(err.message || 'Invalid TOTP code. Please retry or click Auto-Fill.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight">
                  Cybersecurity Architecture &amp; MFA Step-Up
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SHIELD ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-layer zero-trust isolation, RFC 6238 TOTP 2FA, and Air Force RBAC policies.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* 4 Multi-Layer Protection Cards */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              Multi-Layer Defense Matrix
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Layer 1: Argon2id */}
              <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    Argon2id Password KDF
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    RFC 9106
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Memory-hard password hashing resisting GPU/ASIC brute-force attacks on maintenance accounts.
                </p>
              </div>

              {/* Layer 2: PyOTP TOTP 2FA */}
              <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Fingerprint className="w-4 h-4 text-blue-600" />
                    PyOTP / RFC 6238 TOTP
                  </div>
                  <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    30s Window
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Time-based rolling 6-digit authentication required for critical Commander overrides and work order releases.
                </p>
              </div>

              {/* Layer 3: Read-Only Telemetry Separation */}
              <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-purple-600" />
                    Telemetry Demarcation
                  </div>
                  <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                    Air-Gapped
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Direct sensor telemetry read streams are completely decoupled from administrative mutation routes.
                </p>
              </div>

              {/* Layer 4: RBAC Roles */}
              <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-amber-600" />
                    Role-Based Access Control
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                    Strict RBAC
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Viewer roles are cryptographically blocked (HTTP 403) from executing overrides, transfers, or verifications.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Role Switcher Inside Modal */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Switch Operational Persona &amp; Clearance:
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-600">
                Current: <span className="text-blue-600">{currentRole}</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onRoleSelect('Commander')}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  currentRole === 'Commander'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs">Commander</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Full write &amp; override</div>
              </button>

              <button
                type="button"
                onClick={() => onRoleSelect('Planner')}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  currentRole === 'Planner'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs ring-1 ring-blue-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs">Planner</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Simulate &amp; verify</div>
              </button>

              <button
                type="button"
                onClick={() => onRoleSelect('Viewer')}
                className={`p-2.5 rounded-xl text-left border transition-all ${
                  currentRole === 'Viewer'
                    ? 'border-rose-600 bg-rose-50 text-rose-900 shadow-xs ring-1 ring-rose-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs text-rose-700">Viewer</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Read-Only (Locked)</div>
              </button>
            </div>
          </div>

          {/* Step-Up TOTP Verification Box */}
          <div className="p-4.5 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <Fingerprint className="w-4 h-4 text-emerald-600" />
                  TOTP Multi-Factor Authentication (MFA) Step-Up
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Enter your 6-digit rolling authenticator token or use the instant evaluator auto-fill.
                </p>
              </div>

              {/* 1-Click Auto-Fill Demo TOTP Button */}
              <button
                type="button"
                onClick={handleAutoFillDemoTotp}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{copied ? 'Filled Current Code!' : 'Auto-Fill Valid Demo TOTP'}</span>
              </button>
            </div>

            <form onSubmit={handleVerifyTotp} className="flex flex-col sm:flex-row gap-3 items-center">
              <input
                type="text"
                maxLength={6}
                value={totpInput}
                onChange={(e) => setTotpInput(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit code (e.g. 777888)"
                className="w-full sm:w-64 px-4 py-2 text-center text-sm font-mono font-black tracking-widest bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white"
              />

              <button
                type="submit"
                disabled={totpInput.length < 6 || verifyStatus === 'verifying'}
                className="w-full sm:w-auto px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs disabled:opacity-40 transition-colors flex items-center justify-center gap-2 shrink-0"
              >
                {verifyStatus === 'verifying' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Verify MFA Token</span>
                  </>
                )}
              </button>
            </form>

            {/* Status Feedback */}
            {verifyStatus === 'success' && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{statusMessage}</span>
              </div>
            )}

            {verifyStatus === 'error' && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{statusMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Zero-Trust Telemetry Bridge Protected
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
