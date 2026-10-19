import React, { useEffect } from 'react';
import { Shield, ExternalLink, X, Check, Globe } from 'lucide-react';

interface LogisticsNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export const LogisticsNoticeModal: React.FC<LogisticsNoticeModalProps> = ({
  isOpen,
  onClose,
  onContinue,
}) => {
  // Handle keyboard accessibility (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="logistics-notice-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-start justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 text-blue-400 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest uppercase bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30">
                  SYSTEM ARCHITECTURE &amp; COMPLIANCE NOTICE
                </span>
              </div>
              <h2
                id="logistics-notice-title"
                className="text-lg sm:text-xl font-black text-white tracking-tight mt-1"
              >
                Logistics &amp; Spares: Existing Systems and Future Integration
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content (English & Hindi) */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm leading-relaxed divide-y divide-slate-100">
          {/* Section 1: English Notice */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5" />
              <span>English Notice</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-2.5 text-slate-700">
              <p>
                Indian Air Force logistics and maintenance are already supported by existing digital systems. Public Ministry of Defence information identifies <strong>IMMOLS</strong> (Integrated Material Management Online System) for automated inventory/material management and <strong>e-MMS</strong> (Electronic Maintenance Management System) for maintenance management.
              </p>
              <p>
                AirDoctor is currently a prototype and is not connected to these systems. In the future, integration may be explored through authorised interfaces, approved data exchange or documented exports, subject to the relevant organisation's permission and technical availability.
              </p>
              <p className="font-semibold text-slate-900">
                Until an authorised connection is established, AirDoctor will use its configured backend data or clearly labelled synthetic demonstration data. This prototype does not replace official inventory, maintenance, procurement or authorisation systems.
              </p>
            </div>
          </div>

          {/* Section 2: Hindi Notice */}
          <div className="pt-5 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider">
              <Globe className="w-3.5 h-3.5" />
              <span>हिंदी सूचना (Hindi Notice)</span>
            </div>
            <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 space-y-2.5 text-slate-800 font-sans">
              <p>
                भारतीय वायु सेना में लॉजिस्टिक्स और रखरखाव के लिए पहले से डिजिटल प्रणालियाँ मौजूद हैं। रक्षा मंत्रालय की सार्वजनिक जानकारी के अनुसार, <strong>IMMOLS</strong> (Integrated Material Management Online System) सामग्री एवं इन्वेंटरी प्रबंधन के लिए और <strong>e-MMS</strong> (Electronic Maintenance Management System) रखरखाव प्रबंधन के लिए उपयोग की जाने वाली प्रणालियाँ हैं।
              </p>
              <p>
                AirDoctor अभी एक प्रोटोटाइप है और इन प्रणालियों से जुड़ा हुआ नहीं है। भविष्य में संबंधित संगठन की अनुमति और तकनीकी उपलब्धता के अधीन अधिकृत इंटरफेस, स्वीकृत डेटा एक्सचेंज या दस्तावेज़ित डेटा एक्सपोर्ट के माध्यम से एकीकरण की संभावना देखी जा सकती है।
              </p>
              <p className="font-semibold text-slate-900">
                जब तक अधिकृत कनेक्शन स्थापित नहीं होता, AirDoctor अपने कॉन्फ़िगर किए गए बैकएंड डेटा या स्पष्ट रूप से लेबल किए गए सिम्युलेटेड डेमो डेटा का उपयोग करेगा। यह प्रोटोटाइप आधिकारिक इन्वेंटरी, रखरखाव, खरीद या अनुमति-प्रदान प्रणालियों का विकल्प नहीं है।
              </p>
            </div>
          </div>

          {/* Section 3: Official Public Reference Sources */}
          <div className="pt-5 space-y-3">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Public Reference — Official Government Sources
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Link 1 */}
              <a
                href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=1959466"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-3 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-blue-700 font-bold text-xs">
                    <span>Ministry of Defence</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div className="text-xs font-semibold text-slate-900 mt-1 leading-snug">
                    IMMOLS and e-MMS Announcement
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    Press Information Bureau (PIB) official release on defence digitization.
                  </div>
                </div>
                <div className="mt-2 text-[10px] font-mono text-slate-400 group-hover:text-blue-600 truncate">
                  pib.gov.in/PressReleasePage.aspx?PRID=1959466 &rarr;
                </div>
              </a>

              {/* Link 2 */}
              <a
                href="https://www.cgda.nic.in/ifa/manuals/airforce.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="group p-3 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-blue-700 font-bold text-xs">
                    <span>CGDA / MoD (Finance)</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                  <div className="text-xs font-semibold text-slate-900 mt-1 leading-snug">
                    IFA Air Force Manual
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                    Controller General of Defence Accounts official procurement and financial guidelines.
                  </div>
                </div>
                <div className="mt-2 text-[10px] font-mono text-slate-400 group-hover:text-blue-600 truncate">
                  cgda.nic.in/ifa/manuals/airforce.pdf &rarr;
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200/90 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Not Now
          </button>
          <button
            type="button"
            onClick={onContinue}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Continue to Logistics</span>
          </button>
        </div>
      </div>
    </div>
  );
};
