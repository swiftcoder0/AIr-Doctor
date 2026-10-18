import React, { useState } from 'react';
import {
  Bot,
  Send,
  Package,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Sparkles,
  HelpCircle,
  Wrench,
  Check,
} from 'lucide-react';
import { ChatMessage, BaseId } from '../../types/aircraft';
import { mockAirDoctorService } from '../../services/mockAirDoctorService';
import { api } from '../../services/apiClient';

interface AiAssistantViewProps {
  selectedBaseId: BaseId;
  onNavigate: (nav: string) => void;
  onLogDecision?: () => void;
}

export const AiAssistantView: React.FC<AiAssistantViewProps> = ({
  selectedBaseId,
  onNavigate,
  onLogDecision,
}) => {
  const [chatInput, setChatInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'user',
      timestamp: '14:20',
      text: 'Tell me about hydraulic pump HP-9042. Is it available and what can we do to reduce downtime?',
    },
    {
      id: 'm2',
      sender: 'assistant',
      timestamp: '14:20',
      text: 'Here is the current operational assessment for Hydraulic Pump Kit HP-9042 across all monitored bases:',
      cardData: {
        title: 'Hydraulic Pump Kit (HP-9042)',
        badge: 'In Stock at Base Alpha',
        badgeType: 'success',
        partNumber: 'HP-9042',
        specs: [
          { label: 'Current Stock', value: '1 unit (Base Alpha)' },
          { label: 'Min Required', value: '2 units' },
          { label: 'Supplier Lead Time', value: '6–8 weeks' },
          { label: 'Compatible With', value: 'Tejas (Mk1)' },
          { label: 'Condition', value: 'Serviceable' },
        ],
        recommendations: [
          'Transfer 1 unit from Base Alpha to reduce downtime by 72 hours.',
          'Check alternative spare HP-9042A (compatible variant).',
          'Expedite supplier order (lead time 6–8 weeks).',
        ],
      },
    },
  ]);

  const [actionSuccess, setActionSuccess] = useState<string>('');

  const suggestedChips = [
    'Check spare availability',
    'Why is AR-02 in maintenance?',
    'Suggest alternative spare',
    'Show upcoming maintenance',
    'Explain component health',
  ];

  const exampleQuestions = [
    'Is spare HP-9042 available?',
    'Show all critical spares.',
    'Why is Tejas AR-02 grounded?',
    'Suggest how to reduce downtime.',
    'Explain the health trend of engine.',
    'Compare HP-9042 vs HP-9042A.',
  ];

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      timestamp: 'Just now',
      text: text.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');

    try {
      const response = await api.queryAiAssistant(text, selectedBaseId);
      setMessages((prev) => [...prev, response]);
    } catch {
      const response = mockAirDoctorService.queryAiAssistant(text);
      setMessages((prev) => [...prev, response]);
    }
  };

  const handleApplyTransfer = async () => {
    const entry = {
      actor: 'Air Commander (via AI Assistant)',
      action: 'APPROVE_CROSS_BASE_TRANSFER_FROM_ASSISTANT',
      previous_state: 'Base Bravo HP-9042: 0 units',
      resulting_state: 'Air Courier Dispatched from Base Alpha',
      notes: 'Commander confirmed 72h downtime reduction recommendation via AI Assistant.',
      baseId: 'base-bravo' as const,
    };
    try {
      await api.recordDecision(entry);
    } catch {
      mockAirDoctorService.recordDecision(entry);
    }
    setActionSuccess('Transfer authorized! Decision recorded in Decision Ledger.');
    setTimeout(() => setActionSuccess(''), 4000);
    if (onLogDecision) onLogDecision();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Page Header matching Reference Image */}
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">
          AI Assistant — Spare &amp; Maintenance Advisor
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Ask questions about spares, components, maintenance or fleet readiness.
        </p>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Suggested Chips Row matching Reference Image */}
      <div className="flex flex-wrap items-center gap-2">
        {suggestedChips.map((chip, i) => (
          <button
            key={i}
            onClick={() => handleSend(chip)}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-emerald-600" />
            <span>{chip}</span>
          </button>
        ))}
      </div>

      {/* Main Layout Grid matching Image 2 (5/7) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left / Center: Chat Stream & Response Card (8.5 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col h-[650px] overflow-hidden">
          {/* Chat Messages Scrollable */}
          <div className="flex-1 p-5 space-y-4 overflow-y-auto text-xs">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-2">
                {msg.sender === 'user' ? (
                  <div className="flex justify-end">
                    <div className="bg-slate-900 text-white rounded-2xl px-4 py-2.5 max-w-[85%] text-xs font-medium leading-relaxed">
                      {msg.text}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="space-y-3 max-w-[92%]">
                      <div className="bg-slate-50 rounded-2xl px-4 py-2.5 text-slate-800 leading-relaxed border border-slate-100">
                        {msg.text}
                      </div>

                      {/* Rich Part Card matching Image 2 (5/7) */}
                      {msg.cardData && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3 text-xs">
                          {/* Card Header */}
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <div className="flex items-center gap-2">
                              <Package className="w-4 h-4 text-slate-700" />
                              <h3 className="font-extrabold text-slate-900">
                                {msg.cardData.title}
                              </h3>
                            </div>
                            {msg.cardData.badge && (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                {msg.cardData.badge}
                              </span>
                            )}
                          </div>

                          {/* Card Body: Specs + Thumbnail */}
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                            <div className="sm:col-span-8 space-y-1.5 font-mono text-[11px]">
                              {msg.cardData.specs.map((spec, i) => (
                                <div key={i} className="flex justify-between">
                                  <span className="text-slate-400 font-sans">{spec.label}</span>
                                  <span className="font-bold text-slate-900">
                                    {spec.label === 'Condition' ? (
                                      <span className="text-emerald-700">{spec.value}</span>
                                    ) : (
                                      spec.value
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>

                            {/* Technical Part Render / Graphic */}
                            <div className="sm:col-span-4 bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center space-y-1">
                              <div className="w-14 h-14 mx-auto rounded-lg bg-slate-200/70 flex items-center justify-center text-slate-600">
                                <Wrench className="w-7 h-7" />
                              </div>
                              <span className="text-[10px] font-mono font-bold text-slate-500 block">
                                {msg.cardData.partNumber || 'HP-9042'}
                              </span>
                            </div>
                          </div>

                          {/* Numbered Recommendations */}
                          {msg.cardData.recommendations && (
                            <div className="pt-2 border-t border-slate-100 space-y-2">
                              <span className="font-bold text-slate-900 block">
                                Recommendations
                              </span>
                              <div className="space-y-1.5 text-[11px]">
                                {msg.cardData.recommendations.map((rec, i) => (
                                  <div
                                    key={i}
                                    className={`p-2 rounded-xl flex items-center justify-between gap-2 ${
                                      i === 0
                                        ? 'bg-emerald-50/70 border border-emerald-200 text-emerald-950 font-medium'
                                        : 'bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {i === 0 ? (
                                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                                      ) : (
                                        <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 text-[9px] font-bold flex items-center justify-center shrink-0">
                                          {i + 1}
                                        </span>
                                      )}
                                      <span>{rec}</span>
                                    </div>
                                    {i === 0 && (
                                      <button
                                        onClick={handleApplyTransfer}
                                        className="px-2.5 py-1 bg-[#142A20] hover:bg-[#1a382b] text-emerald-400 border border-emerald-500/40 rounded-lg text-[10px] font-bold shrink-0"
                                      >
                                        Execute Transfer
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom Chat Input matching Image 2 (5/7) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(chatInput);
            }}
            className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask anything about spares, maintenance, aircraft or data..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="w-9 h-9 rounded-xl bg-[#142A20] hover:bg-[#1a382b] text-emerald-400 border border-emerald-500/40 flex items-center justify-center disabled:opacity-40 transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Column: Example Questions matching Image 2 (5/7) (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3.5">
          <h3 className="text-xs font-bold text-slate-900">Example Questions</h3>
          <div className="space-y-2">
            {exampleQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 transition-colors text-xs text-slate-700 flex items-center justify-between group"
              >
                <span>{q}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
          </div>

          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
            <strong>Deterministic Assistance:</strong> Responses query currently loaded operational spares, squadron schedules, and bottleneck logs without external API dependency.
          </div>
        </div>
      </div>
    </div>
  );
};
