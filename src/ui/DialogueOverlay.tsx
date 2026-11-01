import React from 'react';
import { DeadAirState } from '../game/types';
import { MessageSquare, Shield, UserCheck, X } from 'lucide-react';

interface DialogueOverlayProps {
  state: DeadAirState;
  onSelectChoice: (characterId: string, choiceId: string) => void;
  onClose: () => void;
}

export const DialogueOverlay: React.FC<DialogueOverlayProps> = ({
  state,
  onSelectChoice,
  onClose,
}) => {
  const charId = state.activeDialogueCharacterId || 'nadia';
  const character =
    state.characters.find((c) => c.id === charId) || state.characters[0];

  if (!character) return null;

  const currentNode =
    character.nodes.find((n) => n.id === character.currentNodeId) ||
    character.nodes[0];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        data-testid="dialogue-overlay-modal"
        className="relative w-full max-w-3xl rounded-lg border border-white/15 bg-[#0C1117] text-[#E3E7EB] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Top Character Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#12171D] border-b border-white/10">
          <div className="flex items-center gap-4">
            {/* Mid-Close Stylized Character Portrait Avatar */}
            <div className="w-12 h-12 rounded-full border border-[#4FA3B8]/60 bg-[#080B0E] flex items-center justify-center font-mono font-bold text-sm text-[#4FA3B8]">
              {character.name
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[#E3E7EB]">
                  {character.name}
                </h3>
                <span className="text-xs font-mono text-[#4FA3B8]">
                  · {character.role}
                </span>
              </div>
              <div className="text-xs text-[#8E98A4]">{character.roleZh}</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right font-mono text-xs tabular-nums">
              <div className="text-[#469A6C] flex items-center gap-1 justify-end">
                <UserCheck className="w-3.5 h-3.5" />
                <span>TRUST: {character.trust}%</span>
              </div>
              <div className="text-[#8E98A4] text-[11px]">
                STANCE: {character.stance}
              </div>
            </div>

            <button
              type="button"
              data-testid="close-dialogue-btn"
              onClick={onClose}
              className="p-1.5 rounded border border-white/10 hover:border-white/30 text-[#8E98A4] hover:text-[#E3E7EB] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Dialogue Body */}
        <div className="p-6 space-y-5">
          <div className="rounded border border-[#4FA3B8]/30 bg-[#12171D] p-5">
            <div className="text-xs font-mono uppercase tracking-[0.18em] text-[#4FA3B8] mb-2 flex items-center gap-2">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{currentNode.speaker}</span>
            </div>
            <p className="text-sm md:text-base text-[#E3E7EB] leading-relaxed mb-2.5">
              “{currentNode.body}”
            </p>
            <p className="text-xs md:text-sm text-[#8E98A4] leading-relaxed">
              “{currentNode.bodyZh}”
            </p>
          </div>

          {/* Player Dialogue Choices */}
          <div className="space-y-2.5">
            <div className="text-xs font-mono uppercase tracking-[0.16em] text-[#8E98A4]">
              SELECT RESPONSE / 选择回应方式:
            </div>
            {currentNode.choices.map((choice, idx) => (
              <button
                key={choice.id}
                type="button"
                data-testid={`dialogue-choice-${choice.id}`}
                onClick={() => onSelectChoice(character.id, choice.id)}
                className="w-full text-left p-3.5 rounded border border-white/15 bg-[#12171D]/80 hover:border-[#4FA3B8] hover:bg-[#4FA3B8]/15 transition cursor-pointer"
              >
                <div className="text-xs md:text-sm font-medium text-[#E3E7EB]">
                  <span className="font-mono text-[#4FA3B8] mr-2">
                    [{idx + 1}]
                  </span>
                  {choice.label}
                </div>
                <div className="text-xs text-[#8E98A4] mt-0.5 pl-6">
                  {choice.labelZh}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Narrative Context Bar */}
        <div className="px-6 py-3 bg-[#12171D] border-t border-white/10 flex items-center justify-between text-xs font-mono text-[#8E98A4]">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-[#D89B3C]" />
            <span>CORPORATE SUSPICION: {state.flags.corporate_suspicion}%</span>
          </div>
          <div>
            PROJECT LANTERN:{' '}
            <span className="text-[#E3E7EB]">
              {state.flags.discovered_lantern ? 'CONFIRMED' : 'UNVERIFIED'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
