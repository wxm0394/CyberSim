import React from 'react';
import { DeadAirState } from '../game/types';
import {
  MessageSquare,
  Shield,
  UserCheck,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

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

  const nodeIndex =
    character.nodes.findIndex((n) => n.id === currentNode.id) + 1;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        data-testid="dialogue-overlay-modal"
        className="relative w-full max-w-3xl rounded-lg border border-white/15 bg-[#0C1117] text-[#E3E7EB] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Top Character Header & Dynamic Relationship Meter */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-[#12171D] border-b border-white/10">
          <div className="flex items-center gap-4">
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
              <div
                className={`flex items-center gap-1 justify-end ${
                  character.trust >= 65
                    ? 'text-[#469A6C]'
                    : character.trust >= 50
                    ? 'text-[#4FA3B8]'
                    : 'text-[#D89B3C]'
                }`}
              >
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
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-[0.18em] text-[#4FA3B8] mb-2">
              <span className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{currentNode.speaker}</span>
              </span>
              <span className="text-[#8E98A4] tabular-nums">
                STAGE {nodeIndex} / {character.nodes.length}
              </span>
            </div>
            <p className="text-sm md:text-base text-[#E3E7EB] leading-relaxed mb-2.5">
              “{currentNode.body}”
            </p>
            <p className="text-xs md:text-sm text-[#8E98A4] leading-relaxed">
              “{currentNode.bodyZh}”
            </p>
          </div>

          {/* Consequence Hint for Nadia Trust */}
          {character.id === 'nadia' && (
            <div className="flex items-center gap-2 text-xs font-mono text-[#8E98A4] px-1">
              <AlertTriangle className="w-3.5 h-3.5 text-[#D89B3C] shrink-0" />
              <span>
                CONSEQUENCE NOTE: Maintaining Nadia Trust &ge; 65% unlocks her
                Enclave fiber-tap filter (-5% Exposure) and enables Ending A.
              </span>
            </div>
          )}

          {/* Player Dialogue Choices */}
          <div className="space-y-2.5">
            <div className="text-xs font-mono uppercase tracking-[0.16em] text-[#8E98A4]">
              SELECT RESPONSE / 选择回应方式:
            </div>
            {currentNode.choices.map((choice, idx) => {
              const eventKey = `dialogue:${character.id}:${choice.id}`;
              const nodeLockKey = `${character.id}:${currentNode.id}`;
              const resolvedChoiceId = state.resolvedDialogueNodes[nodeLockKey];
              const wasSelected =
                state.completedEvents.includes(eventKey) ||
                resolvedChoiceId === choice.id;
              const isLockedOut =
                Boolean(resolvedChoiceId) && resolvedChoiceId !== choice.id;

              return (
                <button
                  key={choice.id}
                  type="button"
                  disabled={isLockedOut}
                  data-testid={`dialogue-choice-${choice.id}`}
                  onClick={() => onSelectChoice(character.id, choice.id)}
                  className={`w-full text-left p-3.5 rounded border transition ${
                    wasSelected
                      ? 'border-[#4FA3B8] bg-[#4FA3B8]/15 cursor-default'
                      : isLockedOut
                      ? 'border-white/5 bg-[#0A0E13] opacity-45 cursor-not-allowed'
                      : 'border-white/15 bg-[#12171D]/80 hover:border-[#4FA3B8] hover:bg-[#4FA3B8]/15 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs md:text-sm font-medium text-[#E3E7EB]">
                      <span className="font-mono text-[#4FA3B8] mr-2">
                        [{idx + 1}]
                      </span>
                      {choice.label}
                    </div>
                    {wasSelected && (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-[#469A6C] shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        RECORDED
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#8E98A4] mt-0.5 pl-6">
                    {choice.labelZh}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Narrative Context Bar */}
        <div className="px-6 py-3 bg-[#12171D] border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#8E98A4] tabular-nums">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#D89B3C]" />
              <span>SUSPICION: {state.flags.corporate_suspicion}%</span>
            </span>
            <span>EXPOSURE: {state.flags.player_exposure}%</span>
          </div>
          <div>
            MEDIA DEAD-DROP:{' '}
            <span
              className={
                state.flags.rhea_allied ? 'text-[#469A6C]' : 'text-[#8E98A4]'
              }
            >
              {state.flags.rhea_allied ? 'ACTIVE (RHEA SOLIS)' : 'INACTIVE'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
