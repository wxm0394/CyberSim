import React, { useState } from 'react';
import { DeadAirState } from '../game/types';
import { ForensicTimelineView } from '../components/ForensicTimelineView';
import { BookOpen, Users, ShieldAlert, Briefcase, X } from 'lucide-react';

interface JournalModalProps {
  state: DeadAirState;
  onCorrelateTimeline: () => void;
  onClose: () => void;
}

export const JournalModal: React.FC<JournalModalProps> = ({
  state,
  onCorrelateTimeline,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'TIMELINE' | 'PEOPLE' | 'STATE'>(
    'TIMELINE'
  );

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        data-testid="journal-modal"
        className="relative w-full max-w-4xl rounded-lg border border-white/15 bg-[#0C1015] text-[#E3E7EB] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Top Header & Tab Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-[#12171D] border-b border-white/10">
          <div>
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#4FA3B8]">
              ELI WARD CASEBOOK · CHAPTER 1: THE GHOST IN THE MACHINE
            </div>
            <h2 className="text-base font-semibold text-[#E3E7EB]">
              Forensic Investigation &amp; Dossiers / 调查笔记与取证时间线
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="journal-tab-timeline"
              onClick={() => setActiveTab('TIMELINE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition cursor-pointer ${
                activeTab === 'TIMELINE'
                  ? 'bg-[#4FA3B8] text-[#080B0E] font-semibold'
                  : 'bg-[#080B0E] text-[#8E98A4] hover:text-[#E3E7EB]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>FORENSIC TIMELINE ({state.flags.evidence_count}/6)</span>
            </button>

            <button
              type="button"
              data-testid="journal-tab-people"
              onClick={() => setActiveTab('PEOPLE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition cursor-pointer ${
                activeTab === 'PEOPLE'
                  ? 'bg-[#4FA3B8] text-[#080B0E] font-semibold'
                  : 'bg-[#080B0E] text-[#8E98A4] hover:text-[#E3E7EB]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>CHARACTERS (5)</span>
            </button>

            <button
              type="button"
              data-testid="journal-tab-state"
              onClick={() => setActiveTab('STATE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition cursor-pointer ${
                activeTab === 'STATE'
                  ? 'bg-[#4FA3B8] text-[#080B0E] font-semibold'
                  : 'bg-[#080B0E] text-[#8E98A4] hover:text-[#E3E7EB]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>NARRATIVE FLAGS &amp; ITEMS</span>
            </button>

            <button
              type="button"
              data-testid="close-journal-btn"
              onClick={onClose}
              className="ml-2 p-1.5 rounded border border-white/10 hover:border-white/30 text-[#8E98A4] hover:text-[#E3E7EB] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'TIMELINE' && (
            <ForensicTimelineView
              evidence={state.evidence}
              timelineCorrelated={state.flags.timeline_correlated}
              onCorrelateTimeline={onCorrelateTimeline}
            />
          )}

          {activeTab === 'PEOPLE' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {state.characters.map((char) => (
                <div
                  key={char.id}
                  className="rounded border border-white/15 bg-[#12171D] p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-[#E3E7EB]">
                        {char.name}
                      </h3>
                      <span className="text-xs font-mono text-[#4FA3B8] tabular-nums">
                        TRUST: {char.trust}%
                      </span>
                    </div>
                    <div className="text-xs font-mono text-[#D89B3C] mb-2">
                      {char.role} / {char.roleZh}
                    </div>
                    <p className="text-xs text-[#C2CAD3] leading-relaxed mb-2">
                      {char.bio}
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-[#8E98A4] border-t border-white/10 pt-2">
                    STANCE: {char.stance} · LOCATION: {char.location}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'STATE' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[#4FA3B8] mb-3">
                  CHAPTER 1 NARRATIVE STATE VARIABLES
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs tabular-nums">
                  <div className="p-3 rounded border border-white/10 bg-[#12171D]">
                    <div className="text-[#8E98A4]">trust_nadia</div>
                    <div className="text-base font-semibold text-[#E3E7EB] mt-1">
                      {state.flags.trust_nadia}%
                    </div>
                  </div>
                  <div className="p-3 rounded border border-white/10 bg-[#12171D]">
                    <div className="text-[#8E98A4]">contacted_moth</div>
                    <div className="text-base font-semibold text-[#4FA3B8] mt-1">
                      {String(state.flags.contacted_moth)}
                    </div>
                  </div>
                  <div className="p-3 rounded border border-white/10 bg-[#12171D]">
                    <div className="text-[#8E98A4]">evidence_count</div>
                    <div className="text-base font-semibold text-[#469A6C] mt-1">
                      {state.flags.evidence_count} / 6
                    </div>
                  </div>
                  <div className="p-3 rounded border border-white/10 bg-[#12171D]">
                    <div className="text-[#8E98A4]">discovered_lantern</div>
                    <div className="text-base font-semibold text-[#D89B3C] mt-1">
                      {String(state.flags.discovered_lantern)}
                    </div>
                  </div>
                  <div className="p-3 rounded border border-white/10 bg-[#12171D]">
                    <div className="text-[#8E98A4]">corporate_suspicion</div>
                    <div className="text-base font-semibold text-[#C94B4B] mt-1">
                      {state.flags.corporate_suspicion}%
                    </div>
                  </div>
                  <div className="p-3 rounded border border-white/10 bg-[#12171D]">
                    <div className="text-[#8E98A4]">journalist_contact</div>
                    <div className="text-base font-semibold text-[#E3E7EB] mt-1">
                      {String(state.flags.journalist_contact)}
                    </div>
                  </div>
                  <div className="p-3 rounded border border-white/10 bg-[#12171D]">
                    <div className="text-[#8E98A4]">player_exposure</div>
                    <div className="text-base font-semibold text-[#D89B3C] mt-1">
                      {state.flags.player_exposure}%
                    </div>
                  </div>
                  <div className="p-3 rounded border border-white/10 bg-[#12171D]">
                    <div className="text-[#8E98A4]">first_choice</div>
                    <div className="text-sm font-semibold text-[#E3E7EB] mt-1">
                      {state.flags.first_choice || 'NONE'}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-mono uppercase tracking-[0.2em] text-[#4FA3B8] mb-3 flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>PHYSICAL ITEMS &amp; HARDWARE KEYS</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {state.inventory.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded border ${
                        item.acquired
                          ? 'border-white/15 bg-[#12171D]'
                          : 'border-white/5 bg-[#080B0E] opacity-50'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-[#E3E7EB]">
                        <span>
                          {item.name} / {item.nameZh}
                        </span>
                        <span className="font-mono text-[11px] text-[#4FA3B8]">
                          {item.acquired ? 'ACQUIRED' : 'LOCKED'}
                        </span>
                      </div>
                      <p className="text-xs text-[#8E98A4] mt-1">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
