/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  ComputerAppId,
  DeadAirState,
  FirstPhoneChoice,
  SceneId,
} from './game/types';
import {
  loadDeadAirState,
  saveDeadAirState,
  clearDeadAirSave,
  soundFX,
} from './persistence/storage';
import {
  canAccessWorkstation,
  inspectHotspot,
  transitionToScene,
  handleFirstPhoneChoice,
  inspectVirtualFile,
  correlateEvidenceTimeline,
  selectCharacterDialogueChoice,
  selectNetworkHost,
  executeDeadAirCommand,
  openPhoneOverlay,
  openWorkstationOverlay,
  toggleWorkstationOverlay,
  resolveChapterOneEnding,
} from './game/storyEngine';
import {
  selectLearningSourceTrack,
  selectLearningCategory,
  selectLearningLesson,
  openNetworkLabForLesson,
  closeNetworkLab,
  executeLabDiagnosticStep,
  submitLabResolution,
  applyLessonCapabilityToStory,
} from './learning/learningEngine';
import {
  KnowledgeCategoryId,
  SourceTrackFilter,
} from './learning/lessonTypes';
import { CHAPTER_ONE_ENDINGS } from './data/storyData';
import { TitleScreen } from './components/TitleScreen';
import { CinematicSceneView } from './scenes/CinematicSceneView';
import { PhoneOverlay } from './ui/PhoneOverlay';
import { DialogueOverlay } from './ui/DialogueOverlay';
import { JournalModal } from './ui/JournalModal';
import { KnowledgeCodex } from './ui/KnowledgeCodex';
import { VirtualDesktopModal } from './computer/VirtualDesktopModal';
import { ForensicTimelineView } from './components/ForensicTimelineView';
import { RotateCcw, Eye, CheckCircle2, ShieldAlert, Users } from 'lucide-react';

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

  const handleToggleDebugMode = useCallback(() => {
    setState((prev) => ({
      ...prev,
      debugMode: !prev.debugMode,
    }));
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
          setState((prev) =>
            prev.activeOverlay === 'PHONE'
              ? { ...prev, activeOverlay: 'NONE' }
              : openPhoneOverlay(prev)
          );
        } else if (e.key === 'c' || e.key === 'C') {
          if (canAccessWorkstation(state)) {
            soundFX.playTone('terminal', state.soundEnabled);
          }
          setState((prev) => toggleWorkstationOverlay(prev));
        } else if (e.key === 'j' || e.key === 'J') {
          soundFX.playTone('click', state.soundEnabled);
          setState((prev) => ({
            ...prev,
            activeOverlay:
              prev.activeOverlay === 'JOURNAL' ? 'NONE' : 'JOURNAL',
          }));
        } else if (e.key === 'm' || e.key === 'M') {
          soundFX.playTone('click', state.soundEnabled);
          setState((prev) => ({
            ...prev,
            activeOverlay:
              prev.activeOverlay === 'FIELD_MANUAL' ? 'NONE' : 'FIELD_MANUAL',
          }));
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    state.shellState,
    state.currentScene,
    state.soundEnabled,
    handleStartGame,
  ]);

  const onInspectHotspot = (hotspotId: string) => {
    soundFX.playTone('click', state.soundEnabled);
    setState((prev) => inspectHotspot(prev, hotspotId));
  };

  const onTransitionScene = (targetScene: SceneId, forceDebug = false) => {
    soundFX.playTone('click', state.soundEnabled);
    setState((prev) => transitionToScene(prev, targetScene, { forceDebug }));
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
    setState((prev) =>
      selectCharacterDialogueChoice(prev, characterId, choiceId)
    );
  };

  const onSelectComputerApp = (app: ComputerAppId) => {
    soundFX.playTone('click', state.soundEnabled);
    setState((prev) => ({ ...prev, activeComputerApp: app }));
  };

  const onSelectNetworkHost = (ip: string) => {
    soundFX.playTone('click', state.soundEnabled);
    setState((prev) => selectNetworkHost(prev, ip));
  };

  const onSelectLearningSourceTrackHandler = (track: SourceTrackFilter) => {
    soundFX.playTone('click', state.soundEnabled);
    setState((prev) => selectLearningSourceTrack(prev, track));
  };

  const onSelectLearningCategoryHandler = (
    category: KnowledgeCategoryId | 'all'
  ) => {
    soundFX.playTone('click', state.soundEnabled);
    setState((prev) => selectLearningCategory(prev, category));
  };

  const onSelectLearningLessonHandler = (lessonId: string) => {
    soundFX.playTone('click', state.soundEnabled);
    setState((prev) => selectLearningLesson(prev, lessonId));
  };

  const onOpenNetworkLabHandler = (lessonId: string) => {
    soundFX.playTone('terminal', state.soundEnabled);
    setState((prev) => openNetworkLabForLesson(prev, lessonId));
  };

  const onCloseNetworkLabHandler = () => {
    soundFX.playTone('click', state.soundEnabled);
    setState((prev) => closeNetworkLab(prev));
  };

  const onExecuteLabDiagnosticHandler = (
    lessonId: string,
    diagnosticId: string
  ) => {
    soundFX.playTone('terminal', state.soundEnabled);
    setState((prev) => executeLabDiagnosticStep(prev, lessonId, diagnosticId));
  };

  const onSubmitLabResolutionHandler = (
    lessonId: string,
    resolutionId: string
  ) => {
    soundFX.playTone('evidence', state.soundEnabled);
    setState((prev) => submitLabResolution(prev, lessonId, resolutionId));
  };

  const onApplyLessonToStoryHandler = (
    lessonId: string,
    mode: 'analytical' | 'brute_force'
  ) => {
    soundFX.playTone('evidence', state.soundEnabled);
    setState((prev) => applyLessonCapabilityToStory(prev, lessonId, mode));
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

  const activeEndingId = state.endingId || resolveChapterOneEnding(state);
  const endingReport = CHAPTER_ONE_ENDINGS[activeEndingId];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#080B0E]">
      <CinematicSceneView
        state={state}
        soundEnabled={state.soundEnabled}
        onInspectHotspot={onInspectHotspot}
        onOpenPhone={() => {
          soundFX.playTone('phone', state.soundEnabled);
          setState((prev) => openPhoneOverlay(prev));
        }}
        onOpenComputer={() => {
          soundFX.playTone('terminal', state.soundEnabled);
          setState((prev) => openWorkstationOverlay(prev));
        }}
        onOpenJournal={() => {
          soundFX.playTone('click', state.soundEnabled);
          setState((prev) => ({ ...prev, activeOverlay: 'JOURNAL' }));
        }}
        onOpenFieldManual={() => {
          soundFX.playTone('click', state.soundEnabled);
          setState((prev) => ({ ...prev, activeOverlay: 'FIELD_MANUAL' }));
        }}
        onTransitionScene={onTransitionScene}
        onToggleSound={handleToggleSound}
        onToggleDebugMode={handleToggleDebugMode}
        onResetGame={handleResetAndStart}
      />

      {/* Smartphone Overlay */}
      {state.activeOverlay === 'PHONE' && (
        <PhoneOverlay
          state={state}
          onSelectFirstChoice={onSelectFirstChoice}
          onOpenWorkstation={() => {
            if (canAccessWorkstation(state)) {
              soundFX.playTone('terminal', state.soundEnabled);
            }
            setState((prev) => openWorkstationOverlay(prev, 'FILES'));
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

      {/* Standalone Field Manual & Network Lab Overlay [M] */}
      {state.activeOverlay === 'FIELD_MANUAL' && (
        <div
          data-testid="field-manual-overlay"
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 md:p-6"
        >
          <div className="w-full max-w-6xl h-[88vh] rounded-lg border border-[#469A6C]/50 bg-[#080B0E] shadow-2xl overflow-hidden flex flex-col">
            <KnowledgeCodex
              state={state}
              onSelectSourceTrack={onSelectLearningSourceTrackHandler}
              onSelectCategory={onSelectLearningCategoryHandler}
              onSelectLesson={onSelectLearningLessonHandler}
              onOpenLab={onOpenNetworkLabHandler}
              onCloseLab={onCloseNetworkLabHandler}
              onExecuteDiagnostic={onExecuteLabDiagnosticHandler}
              onSubmitResolution={onSubmitLabResolutionHandler}
              onApplyToStory={onApplyLessonToStoryHandler}
              onCloseOverlay={() =>
                setState((prev) => ({ ...prev, activeOverlay: 'NONE' }))
              }
            />
          </div>
        </div>
      )}

      {/* Diegetic In-World Workstation OS Overlay (Strictly guarded to Apartment 4B scenes) */}
      {state.activeOverlay === 'COMPUTER' && canAccessWorkstation(state) && (
        <VirtualDesktopModal
          state={state}
          onSelectApp={onSelectComputerApp}
          onInspectFile={onInspectFile}
          onExecuteCommand={onExecuteCommand}
          onCorrelateTimeline={onCorrelateTimeline}
          onSelectNetworkHost={onSelectNetworkHost}
          onSelectLearningSourceTrack={onSelectLearningSourceTrackHandler}
          onSelectLearningCategory={onSelectLearningCategoryHandler}
          onSelectLearningLesson={onSelectLearningLessonHandler}
          onOpenNetworkLab={onOpenNetworkLabHandler}
          onCloseNetworkLab={onCloseNetworkLabHandler}
          onExecuteLabDiagnostic={onExecuteLabDiagnosticHandler}
          onSubmitLabResolution={onSubmitLabResolutionHandler}
          onApplyLessonToStory={onApplyLessonToStoryHandler}
          onClose={() =>
            setState((prev) => ({ ...prev, activeOverlay: 'NONE' }))
          }
        />
      )}

      {/* Chapter 1 Multi-Ending Settlement Finale Modal */}
      {state.shellState === 'gameover' && endingReport && (
        <div
          data-testid="chapter-finale-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#040608]/95 backdrop-blur-md p-4 overflow-y-auto"
        >
          <div className="w-full max-w-4xl rounded-lg border border-[#C94B4B]/60 bg-[#090C10] text-[#E3E7EB] p-6 md:p-8 shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto">
            {/* Core Twist Header */}
            <div className="border-b border-white/10 pb-5">
              <div className="text-xs font-mono uppercase tracking-[0.25em] text-[#C94B4B] mb-2">
                REMOTE CARRIER TERMINATED · 03:16 AM · APT 4B BLACKOUT
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold font-mono tracking-[0.14em] text-[#E3E7EB] mb-3">
                “WE KNOW WHO YOU ARE.”
              </h1>

              {/* Dynamic Ending Banner */}
              <div
                data-testid={`ending-banner-${endingReport.id}`}
                className={`mt-4 p-4 rounded border ${
                  endingReport.id === 'ENDING_A_SIGNAL_LEAKS'
                    ? 'border-[#469A6C] bg-[#469A6C]/10'
                    : endingReport.id === 'ENDING_B_DIRTY_BARGAIN'
                    ? 'border-[#D89B3C] bg-[#D89B3C]/10'
                    : 'border-[#C94B4B] bg-[#C94B4B]/10'
                }`}
              >
                <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#4FA3B8] mb-1">
                  {endingReport.code} · CHAPTER 1 OUTCOME
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-[#E3E7EB]">
                  {endingReport.title}{' '}
                  <span className="text-base font-normal text-[#C2CAD3]">
                    / {endingReport.titleZh}
                  </span>
                </h2>
                <div className="text-xs font-mono text-[#D89B3C] mt-1">
                  {endingReport.subtitle} · {endingReport.subtitleZh}
                </div>
                <p className="text-sm text-[#E3E7EB] leading-relaxed mt-3">
                  {endingReport.epilogue}
                </p>
                <p className="text-xs text-[#8E98A4] leading-relaxed mt-2">
                  {endingReport.epilogueZh}
                </p>
              </div>
            </div>

            {/* Chapter 1 Decision & Consequence Settlement Report */}
            <div>
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#4FA3B8] mb-3 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                <span>CHAPTER 1 SETTLEMENT REPORT · 第一章决策与数值结算</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs tabular-nums">
                <div className="p-3 rounded border border-white/10 bg-[#12171D]">
                  <div className="text-[#8E98A4]">FIRST RESPONSE</div>
                  <div className="text-sm font-semibold text-[#4FA3B8] mt-1">
                    {state.flags.first_choice || 'NONE'}
                  </div>
                </div>
                <div className="p-3 rounded border border-white/10 bg-[#12171D]">
                  <div className="text-[#8E98A4]">NADIA TRUST</div>
                  <div className="text-sm font-semibold text-[#469A6C] mt-1">
                    {state.flags.trust_nadia}%
                  </div>
                </div>
                <div className="p-3 rounded border border-white/10 bg-[#12171D]">
                  <div className="text-[#8E98A4]">CORPORATE SUSPICION</div>
                  <div className="text-sm font-semibold text-[#C94B4B] mt-1">
                    {state.flags.corporate_suspicion}%
                  </div>
                </div>
                <div className="p-3 rounded border border-white/10 bg-[#12171D]">
                  <div className="text-[#8E98A4]">PLAYER EXPOSURE</div>
                  <div className="text-sm font-semibold text-[#D89B3C] mt-1">
                    {state.flags.player_exposure}%
                  </div>
                </div>
                <div className="p-3 rounded border border-white/10 bg-[#12171D]">
                  <div className="text-[#8E98A4]">EVIDENCE LOGGED</div>
                  <div className="text-sm font-semibold text-[#E3E7EB] mt-1">
                    {state.flags.evidence_count} / 6
                  </div>
                </div>
                <div className="p-3 rounded border border-white/10 bg-[#12171D]">
                  <div className="text-[#8E98A4]">TIMELINE CORRELATED</div>
                  <div className="text-sm font-semibold text-[#469A6C] mt-1">
                    {state.flags.timeline_correlated ? 'YES' : 'NO'}
                  </div>
                </div>
                <div className="p-3 rounded border border-white/10 bg-[#12171D]">
                  <div className="text-[#8E98A4]">JOURNALIST CHANNEL</div>
                  <div className="text-sm font-semibold text-[#4FA3B8] mt-1">
                    {state.flags.rhea_allied
                      ? 'ALLIED DEAD-DROP'
                      : state.flags.journalist_contact
                      ? 'CONTACTED ONLY'
                      : 'NONE'}
                  </div>
                </div>
                <div className="p-3 rounded border border-white/10 bg-[#12171D]">
                  <div className="text-[#8E98A4]">MOTH CONTACTED</div>
                  <div className="text-sm font-semibold text-[#D89B3C] mt-1">
                    {state.flags.contacted_moth ? 'ACTIVE' : 'UNREAD'}
                  </div>
                </div>
                <div className="p-3 rounded border border-white/10 bg-[#12171D]">
                  <div className="text-[#8E98A4]">HOSTS COMPROMISED</div>
                  <div className="text-sm font-semibold text-[#469A6C] mt-1">
                    {state.flags.compromised_hosts_count} / 3
                  </div>
                </div>
                <div className="p-3 rounded border border-white/10 bg-[#12171D]">
                  <div className="text-[#8E98A4]">DARK-FIBER PROXY</div>
                  <div className="text-sm font-semibold text-[#4FA3B8] mt-1">
                    {state.flags.relay_tunnel_active ? 'ROUTED (-10% EXP)' : 'DIRECT'}
                  </div>
                </div>
                <div className="p-3 rounded border border-white/10 bg-[#12171D]">
                  <div className="text-[#8E98A4]">CAMERA #04 NVRAM</div>
                  <div className="text-sm font-semibold text-[#469A6C] mt-1">
                    {state.flags.camera_scrubbed
                      ? 'SCRUBBED'
                      : state.flags.camera_tracked
                      ? 'GAIT LOCKED'
                      : 'UNTOUCHED'}
                  </div>
                </div>
                <div className="p-3 rounded border border-white/10 bg-[#12171D]">
                  <div className="text-[#8E98A4]">KEYRING COUNTER-PROOF</div>
                  <div className="text-sm font-semibold text-[#4FA3B8] mt-1">
                    {state.flags.counter_proof_secured ? 'SECURED (M. HALE)' : 'MISSING'}
                  </div>
                </div>
              </div>
            </div>

            {/* Character Fates */}
            <div>
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#4FA3B8] mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>CHARACTER STATUS &amp; FATES · 关键人物命运</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {endingReport.characterFates.map((cf) => (
                  <div
                    key={cf.name}
                    className="p-3.5 rounded border border-white/10 bg-[#12171D]"
                  >
                    <div className="text-xs font-semibold text-[#E3E7EB]">
                      {cf.name}
                    </div>
                    <div className="text-xs text-[#C2CAD3] mt-1">
                      {cf.status}
                    </div>
                    <div className="text-[11px] text-[#8E98A4] mt-0.5">
                      {cf.statusZh}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chapter 2 Narrative Hook */}
            <div className="p-4 rounded border border-[#4FA3B8]/40 bg-[#4FA3B8]/10">
              <div className="text-xs font-mono font-semibold text-[#4FA3B8]">
                {endingReport.chapterTwoHook}
              </div>
              <div className="text-xs text-[#C2CAD3] mt-1">
                {endingReport.chapterTwoHookZh}
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
                <span>
                  CHAPTER 1 COMPLETED — {endingReport.code}:{' '}
                  {endingReport.title}
                </span>
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
                  <span>RETURN TO SCENE / 继续调查</span>
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
