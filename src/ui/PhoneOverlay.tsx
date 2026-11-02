import React from 'react';
import { DeadAirState, FirstPhoneChoice } from '../game/types';
import {
  PhoneCall,
  MessageSquareWarning,
  ShieldAlert,
  Radio,
  Laptop,
  Users,
  X,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface PhoneOverlayProps {
  state: DeadAirState;
  onSelectFirstChoice: (choice: FirstPhoneChoice) => void;
  onOpenWorkstation: () => void;
  onClose: () => void;
}

export const PhoneOverlay: React.FC<PhoneOverlayProps> = ({
  state,
  onSelectFirstChoice,
  onOpenWorkstation,
  onClose,
}) => {
  const unlockedMessages = state.phoneMessages.filter((m) => m.unlocked);
  const currentChoice = state.flags.first_choice;
  const isLocked =
    state.flags.first_choice_locked || state.flags.first_choice !== null;

  const choiceOptions: {
    id: Exclude<FirstPhoneChoice, null>;
    title: string;
    titleZh: string;
    effect: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'CALL_NADIA',
      title: '1. Call Nadia Back Immediately',
      titleZh: '立即回拨 Nadia 的电话',
      effect:
        'Unlocks cellular dead-air handoff trace (+10% Nadia Trust, +15% Corporate Suspicion, +15% Exposure)',
      icon: <PhoneCall className="w-4 h-4 text-[#D89B3C]" />,
    },
    {
      id: 'TRACE_SMS',
      title: '2. Trace the Anonymous Warning SMS Header',
      titleZh: '对匿名警告短信执行 SS7 信令溯源',
      effect:
        'Identifies disposable Port District SIP relay "MOTH_RELAY_0" (+5% Corporate Suspicion, +5% Exposure)',
      icon: <Radio className="w-4 h-4 text-[#4FA3B8]" />,
    },
    {
      id: 'WAIT_CHECK_PC',
      title: '3. Enable Cellular Silence & Inspect Workstation First',
      titleZh: '开启蜂窝静默，先在本地 Linux 电脑检验归档包',
      effect:
        'Zero cellular exposure (-5% Corporate Suspicion, +0% Exposure, stealth forensic protocol)',
      icon: <Laptop className="w-4 h-4 text-[#469A6C]" />,
    },
    {
      id: 'CONTACT_ALLY',
      title: '4. Send Encrypted Canary to Rhea Solis & Daniel Cross',
      titleZh: '向记者 Rhea 与前导师 Daniel 发送加密信标',
      effect:
        'Opens external backchannel warning (+5% Nadia Trust, +5% Suspicion, +5% Exposure)',
      icon: <Users className="w-4 h-4 text-[#4FA3B8]" />,
    },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        data-testid="phone-overlay-modal"
        className="relative w-full max-w-2xl rounded-lg border border-white/15 bg-[#0D1218] text-[#E3E7EB] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Top Smartphone Status Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#12171D] border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D89B3C] ring-2 ring-[#D89B3C]/40" />
            <div>
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#4FA3B8]">
                GRAPHENE-OS HANDSET · ELI WARD
              </div>
              <div className="text-sm font-semibold text-[#E3E7EB]">
                Scene 2: A Voicemail &amp; Anonymous Warning / 凌晨语音与警告短信
              </div>
            </div>
          </div>

          <button
            type="button"
            data-testid="close-phone-btn"
            onClick={onClose}
            className="p-1.5 rounded border border-white/10 hover:border-white/30 text-[#8E98A4] hover:text-[#E3E7EB] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Message & Voicemail Feed */}
        <div className="p-5 overflow-y-auto space-y-4">
          {unlockedMessages.map((msg) => (
            <div
              key={msg.id}
              data-testid={`phone-msg-${msg.id}`}
              className={`rounded border p-4 ${
                msg.type === 'VOICEMAIL'
                  ? 'border-[#D89B3C]/50 bg-[#D89B3C]/10'
                  : msg.sender.includes('UNKNOWN') || msg.sender.includes('MOTH')
                  ? 'border-[#C94B4B]/50 bg-[#C94B4B]/10'
                  : 'border-[#4FA3B8]/40 bg-[#12171D]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  {msg.type === 'VOICEMAIL' ? (
                    <PhoneCall className="w-3.5 h-3.5 text-[#D89B3C]" />
                  ) : (
                    <MessageSquareWarning className="w-3.5 h-3.5 text-[#C94B4B]" />
                  )}
                  <span className="font-semibold text-[#E3E7EB]">
                    {msg.sender}
                  </span>
                  <span className="text-[#8E98A4]">({msg.senderRole})</span>
                </div>
                <span className="text-[#8E98A4] tabular-nums">
                  {msg.timestamp}
                </span>
              </div>

              <p className="text-xs md:text-sm text-[#E3E7EB] leading-relaxed font-mono mb-1.5">
                {msg.body}
              </p>
              <p className="text-xs text-[#8E98A4] leading-relaxed">
                {msg.bodyZh}
              </p>
            </div>
          ))}

          {/* First Narrative Decision Block (Strictly One-Time) */}
          <div className="rounded border border-white/15 bg-[#12171D] p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="text-xs font-mono uppercase tracking-[0.16em] text-[#D89B3C] flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                <span>FIRST CRITICAL DECISION · 第一处叙事抉择（不可撤销）</span>
              </div>
              {isLocked && currentChoice && (
                <span
                  data-testid="phone-choice-locked-badge"
                  className="flex items-center gap-1 text-xs font-mono text-[#469A6C]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  LOCKED: {currentChoice}
                </span>
              )}
            </div>

            <p className="text-xs text-[#C2CAD3] mb-3">
              {isLocked
                ? 'Your initial cellular response has been permanently logged in Chapter 1 state. Other options are now locked.'
                : 'How do you respond to Nadia’s cut-off voicemail and the unknown watcher’s warning? This decision can only be confirmed once.'}
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              {choiceOptions.map((opt) => {
                const isSelected = currentChoice === opt.id;
                const isDisabled = isLocked && !isSelected;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isLocked}
                    data-testid={`phone-choice-${opt.id}`}
                    onClick={() => {
                      if (!isLocked) {
                        onSelectFirstChoice(opt.id);
                      }
                    }}
                    className={`w-full text-left p-3 rounded border transition flex items-start gap-3 ${
                      isSelected
                        ? 'border-[#4FA3B8] bg-[#4FA3B8]/20 text-[#E3E7EB] shadow-md shadow-[#4FA3B8]/10 cursor-default'
                        : isDisabled
                        ? 'border-white/5 bg-[#080B0E]/40 text-[#8E98A4] opacity-45 cursor-not-allowed'
                        : 'border-white/10 bg-[#080B0E]/80 hover:border-[#4FA3B8]/60 text-[#E3E7EB] cursor-pointer'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{opt.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs font-semibold text-[#E3E7EB]">
                          {opt.title}{' '}
                          <span className="font-normal text-[#8E98A4]">
                            / {opt.titleZh}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#4FA3B8] flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            CONFIRMED
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-[#8E98A4] mt-0.5">
                        {opt.effect}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer CTA to transition directly to Workstation OS */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#12171D] border-t border-white/10">
          <div className="text-xs font-mono text-[#8E98A4] tabular-nums">
            NADIA TRUST: {state.flags.trust_nadia}% · SUSPICION:{' '}
            {state.flags.corporate_suspicion}% · EXPOSURE:{' '}
            {state.flags.player_exposure}%
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              data-testid="phone-to-workstation-btn"
              onClick={onOpenWorkstation}
              className="px-4 py-2 rounded bg-[#4FA3B8] hover:bg-[#5eb3c8] text-[#080B0E] font-mono font-semibold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              BOOT WORKSTATION (incident_0427.zip) →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
