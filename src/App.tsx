/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { ComputerAppId, DeadAirState, FirstPhoneChoice, SceneId } from './game/types';
import {
  loadDeadAirState,
  saveDeadAirState,
  clearDeadAirSave,
  soundFX,
} from './persistence/storage';
import {
  inspectHotspot,
  transitionToScene,
  handleFirstPhoneChoice,
  inspectVirtualFile,
  correlateEvidenceTimeline,
  selectCharacterDialogueChoice,
  executeDeadAirCommand,
} from './game/storyEngine';
import { TitleScreen } from './components/TitleScreen';
import { CinematicSceneView } from './scenes/CinematicSceneView';
import { PhoneOverlay } from './ui/PhoneOverlay';
import { DialogueOverlay } from './ui/DialogueOverlay';
import { JournalModal } from './ui/JournalModal';
import { VirtualDesktopModal } from './computer/VirtualDesktopModal';
import { ForensicTimelineView } from './components/ForensicTimelineView';
import { RotateCcw, Eye, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<DeadAirState>(() => loadDeadAirState());

  // Sync document.body.dataset.state for automated shell handshake
  useEffect(() => {
    document.body.dataset.state = state.shellState;
  }, [state.shellState]);

  // Persist state changes
  useEffect(() => {
    saveDeadAirState(state);
  }, [state]);

  const handleStartGame = useCallback(() => {
    soundFX.playTone('click', state.soundEnabled);
    setState((prev) => ({
      ...prev,
      shellState: 'playing',
    }));
  }, [state.soundEnabled]);

  const handleResetAndStart = useCallback(() => {
    soundFX.playTone('click', state.soundEnabled);
    const fresh = clearDeadAirSave();
    setState(fresh);
  }, [state.soundEnabled]);

  const handleToggleSound = useCallback(() => {
    setState((prev) => {
      const next = !prev.soundEnabled;
      soundFX.playTone('click', next);
      return { ...prev, soundEnabled: next };
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (state.shellState === 'title') {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleStartGame();
        }
        return;
      }

      if (state.shellState === 'playing') {
        if (e.key === 'Escape') {
          setState((prev) => ({ ...prev, activeOverlay: 'NONE' }));
        } else if (e.key === 'p' || e.key === 'P') {
          soundFX.playTone('phone', state.soundEnabled);
          setState((prev) => ({
            ...prev,
            activeOverlay: prev.activeOverlay === 'PHONE' ? 'NONE' : 'PHONE',
            flags: { ...prev.flags, voicemail_played: true },
          }));
        } else if (e.key === 'c' || e.key === 'C') {
          soundFX.playTone('terminal', state.soundEnabled);
          setState((prev) => ({
            ...prev,
            activeOverlay:
              prev.activeOverlay === 'COMPUTER' ? 'NONE' : 'COMPUTER',
          }));
        } else if (e.key === 'j' || e.key === 'J') {
          soundFX.playTone('click', state.soundEnabled);
          setState((prev) => ({
            ...prev,
            activeOverlay:
              prev.activeOverlay === 'JOURNAL' ? 'NONE' : 'JOURNAL',
          }));
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state.shellState, state.soundEnabled, handleStartGame]);

  const onInspectHotspot = (hotspotId: string) => {
    soundFX.playTone('click', state.soundEnabled);
    setState((prev) => inspectHotspot(prev, hotspotId));
  };

  const onTransitionScene = (targetScene: SceneId) => {
    soundFX.playTone('click', state.soundEnabled);
    setState((prev) => transitionToScene(prev, targetScene));
  };

  const onSelectFirstChoice = (choice: FirstPhoneChoice) => {
    soundFX.playTone('phone', state.soundEnabled);
    setState((prev) => handleFirstPhoneChoice(prev, choice));
  };

  const onInspectFile = (filePath: string) => {
    soundFX.playTone('evidence', state.soundEnabled);
    setState((prev) => inspectVirtualFile(prev, filePath));
  };

  const onExecuteCommand = (cmd: string) => {
    soundFX.playTone('terminal', state.soundEnabled);
    setState((prev) => executeDeadAirCommand(prev, cmd));
  };

  const onCorrelateTimeline = () => {
    soundFX.playTone('evidence', state.soundEnabled);
    setState((prev) => correlateEvidenceTimeline(prev));
  };

  const onSelectDialogueChoice = (characterId: string, choiceId: string) => {
    soundFX.playTone('click', state.soundEnabled);
    setState((prev) => selectCharacterDialogueChoice(prev, characterId, choiceId));
  };

  const onSelectComputerApp = (app: ComputerAppId) => {
    soundFX.playTone('click', state.soundEnabled);
    setState((prev) => ({ ...prev, activeComputerApp: app }));
  };

  const hasSavedProgress =
    state.flags.evidence_count > 0 ||
    state.flags.voicemail_played ||
    state.currentScene !== 'APARTMENT_NIGHT';

  if (state.shellState === 'title') {
    return (
      <TitleScreen
        hasSavedProgress={hasSavedProgress}
        soundEnabled={state.soundEnabled}
        onStartGame={handleStartGame}
        onResetAndStart={handleResetAndStart}
        onToggleSound={handleToggleSound}
      />
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#080B0E]">
      <CinematicSceneView
        state={state}
        soundEnabled={state.soundEnabled}
        onInspectHotspot={onInspectHotspot}
        onOpenPhone={() => {
          soundFX.playTone('phone', state.soundEnabled);
          setState((prev) => ({
            ...prev,
            activeOverlay: 'PHONE',
            flags: { ...prev.flags, voicemail_played: true },
          }));
        }}
        onOpenComputer={() => {
          soundFX.playTone('terminal', state.soundEnabled);
          setState((prev) => ({ ...prev, activeOverlay: 'COMPUTER' }));
        }}
        onOpenJournal={() => {
          soundFX.playTone('click', state.soundEnabled);
          setState((prev) => ({ ...prev, activeOverlay: 'JOURNAL' }));
        }}
        onTransitionScene={onTransitionScene}
        onToggleSound={handleToggleSound}
        onResetGame={handleResetAndStart}
      />

      {/* Smartphone Overlay */}
      {state.activeOverlay === 'PHONE' && (
        <PhoneOverlay
          state={state}
          onSelectFirstChoice={onSelectFirstChoice}
          onOpenWorkstation={() => {
            soundFX.playTone('terminal', state.soundEnabled);
            setState((prev) => ({
              ...prev,
              activeOverlay: 'COMPUTER',
              activeComputerApp: 'FILES',
            }));
          }}
          onClose={() =>
            setState((prev) => ({ ...prev, activeOverlay: 'NONE' }))
          }
        />
      )}

      {/* Character Dialogue Overlay */}
      {state.activeOverlay === 'DIALOGUE' && (
        <DialogueOverlay
          state={state}
          onSelectChoice={onSelectDialogueChoice}
          onClose={() =>
            setState((prev) => ({ ...prev, activeOverlay: 'NONE' }))
          }
        />
      )}

      {/* Investigation Notebook & Visual Forensic Timeline Overlay */}
      {state.activeOverlay === 'JOURNAL' && (
        <JournalModal
          state={state}
          onCorrelateTimeline={onCorrelateTimeline}
          onClose={() =>
            setState((prev) => ({ ...prev, activeOverlay: 'NONE' }))
          }
        />
      )}

      {/* Diegetic In-World Workstation OS Overlay */}
      {state.activeOverlay === 'COMPUTER' && (
        <VirtualDesktopModal
          state={state}
          onSelectApp={onSelectComputerApp}
          onInspectFile={onInspectFile}
          onExecuteCommand={onExecuteCommand}
          onCorrelateTimeline={onCorrelateTimeline}
          onClose={() =>
            setState((prev) => ({ ...prev, activeOverlay: 'NONE' }))
          }
        />
      )}

      {/* Chapter 1 Ending Blackout Finale Modal ("WE KNOW WHO YOU ARE.") */}
      {state.shellState === 'gameover' && (
        <div
          data-testid="chapter-finale-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#040608]/95 backdrop-blur-md p-4 overflow-y-auto"
        >
          <div className="w-full max-w-4xl rounded-lg border border-[#C94B4B]/60 bg-[#090C10] text-[#E3E7EB] p-6 md:p-8 shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto">
            <div className="border-b border-white/10 pb-5">
              <div className="text-xs font-mono uppercase tracking-[0.25em] text-[#C94B4B] mb-2">
                REMOTE CARRIER TERMINATED · 03:16 AM · APT 4B BLACKOUT
              </div>
              <h1 className="text-3xl md:text-5xl font-extrabold font-mono tracking-[0.14em] text-[#E3E7EB] mb-3">
                “WE KNOW WHO YOU ARE.”
              </h1>
              <p className="text-sm text-[#C2CAD3] leading-relaxed">
                Your workstation screen cuts to black as a single unbuffered packet overrides the display controller. Eight months after Vespera Data Solutions terminated you, someone inside the 42nd-floor Executive Enclave re-enabled your revoked credentials (<span className="font-mono text-[#D89B3C]">e.ward_09</span>) to sign off on the Project LANTERN cover-up.
              </p>
              <p className="text-xs text-[#8E98A4] mt-1.5">
                第一章完结：屏幕在断连瞬间浮现一行白字——“WE KNOW WHO YOU ARE.”。你已离职八个月的工号 e.ward_09 竟在 48 小时前被重新激活，成为掩盖“灯塔计划”的替罪羊。
              </p>
            </div>

            {/* Chapter 1 Decision & Consequence Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs tabular-nums">
              <div className="p-3.5 rounded border border-white/10 bg-[#12171D]">
                <div className="text-[#8E98A4]">FIRST RESPONSE</div>
                <div className="text-sm font-semibold text-[#4FA3B8] mt-1">
                  {state.flags.first_choice || 'WAIT_CHECK_PC'}
                </div>
              </div>
              <div className="p-3.5 rounded border border-white/10 bg-[#12171D]">
                <div className="text-[#8E98A4]">NADIA TRUST</div>
                <div className="text-sm font-semibold text-[#469A6C] mt-1">
                  {state.flags.trust_nadia}%
                </div>
              </div>
              <div className="p-3.5 rounded border border-white/10 bg-[#12171D]">
                <div className="text-[#8E98A4]">CORPORATE SUSPICION</div>
                <div className="text-sm font-semibold text-[#C94B4B] mt-1">
                  {state.flags.corporate_suspicion}%
                </div>
              </div>
              <div className="p-3.5 rounded border border-white/10 bg-[#12171D]">
                <div className="text-[#8E98A4]">EVIDENCE LOGGED</div>
                <div className="text-sm font-semibold text-[#D89B3C] mt-1">
                  {state.flags.evidence_count} / 6
                </div>
              </div>
            </div>

            {/* Embedded Chronological Forensic Timeline in Finale */}
            <div className="rounded border border-white/10 bg-[#0D1218] p-5">
              <ForensicTimelineView
                evidence={state.evidence}
                timelineCorrelated={state.flags.timeline_correlated}
                onCorrelateTimeline={onCorrelateTimeline}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10">
              <div className="flex items-center gap-2 text-xs font-mono text-[#469A6C]">
                <CheckCircle2 className="w-4 h-4" />
                <span>CHAPTER 1: THE GHOST IN THE MACHINE — COMPLETED</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  data-testid="continue-exploring-btn"
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      shellState: 'playing',
                      activeOverlay: 'NONE',
                    }))
                  }
                  className="flex items-center gap-2 px-4 py-2.5 rounded border border-[#4FA3B8]/50 bg-[#12171D] hover:bg-[#4FA3B8]/20 text-xs font-mono text-[#E3E7EB] cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#4FA3B8]" />
                  <span>RETURN TO SCENE / 继续自由探索</span>
                </button>

                <button
                  type="button"
                  data-testid="replay-chapter-btn"
                  onClick={handleResetAndStart}
                  className="flex items-center gap-2 px-5 py-2.5 rounded bg-[#4FA3B8] hover:bg-[#5eb3c8] text-[#080B0E] font-mono font-semibold text-xs uppercase tracking-wider cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>REPLAY CHAPTER 1 / 重新开始</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
