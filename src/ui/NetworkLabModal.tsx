import React from 'react';
import {
  CheckCircle2,
  Terminal,
  ShieldAlert,
  Play,
  X,
  Cpu,
  ArrowRight,
  Lock,
  Sparkles,
} from 'lucide-react';
import { DeadAirState } from '../game/types';
import { LearningLesson } from '../learning/lessonTypes';
import {
  areCriticalDiagnosticsComplete,
  getExecutedDiagnosticsForLesson,
} from '../learning/learningProgress';

interface NetworkLabModalProps {
  state: DeadAirState;
  lesson: LearningLesson;
  onExecuteDiagnostic: (lessonId: string, diagnosticId: string) => void;
  onSubmitResolution: (lessonId: string, resolutionId: string) => void;
  onApplyToStory: (lessonId: string, mode: 'analytical' | 'brute_force') => void;
  onClose: () => void;
}

export const NetworkLabModal: React.FC<NetworkLabModalProps> = ({
  state,
  lesson,
  onExecuteDiagnostic,
  onSubmitResolution,
  onApplyToStory,
  onClose,
}) => {
  const executedIds = getExecutedDiagnosticsForLesson(
    state.learning,
    lesson.id
  );
  const allCriticalsDone = areCriticalDiagnosticsComplete(
    state.learning,
    lesson
  );
  const isCompleted = state.learning.completedLessonIds.includes(lesson.id);
  const isStoryApplied = state.learning.appliedStoryLessons.includes(lesson.id);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`GreyOS Network Lab: ${lesson.lab.title}`}
    >
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col bg-[#080B0E] border border-[#24303C] rounded-md shadow-2xl overflow-hidden text-[#E6EDF3]">
        {/* Lab Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#12171D] border-b border-[#24303C]">
          <div className="flex items-center gap-3 min-w-0">
            <Cpu className="w-4 h-4 text-[#4FA3B8] shrink-0" />
            <div className="truncate">
              <div className="flex items-center gap-2 text-xs font-mono text-[#8B98A5]">
                <span className="text-[#4FA3B8] font-semibold">
                  {lesson.lab.code}
                </span>
                <span aria-hidden="true">·</span>
                <span>{lesson.code}</span>
                <span aria-hidden="true">·</span>
                <span>
                  {isCompleted ? 'LAB MASTERED / 已通关' : 'ACTIVE SANDBOX / 实验进行中'}
                </span>
              </div>
              <h2 className="text-base font-semibold tracking-tight text-[#E6EDF3] truncate">
                {lesson.lab.title} — {lesson.lab.titleZh}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Network Lab"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[#8B98A5] hover:text-[#E6EDF3] bg-[#182028] hover:bg-[#222D38] border border-[#2B3846] rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Close Lab [ESC]</span>
          </button>
        </div>

        {/* Lab Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Environment & Symptom Header */}
          <div className="p-4 bg-[#0D1217] border border-[#1E2933] rounded space-y-2">
            <div className="text-[11px] font-mono text-[#4FA3B8] tracking-wider uppercase">
              {lesson.lab.environmentBanner}
            </div>
            <p className="text-sm text-[#E6EDF3] leading-relaxed">
              <strong className="text-[#D89B3C] font-mono mr-2">
                [OBSERVED ANOMALY / 故障现象]
              </strong>
              {lesson.lab.initialSymptom}
            </p>
            <p className="text-xs text-[#8B98A5] leading-relaxed">
              {lesson.lab.initialSymptomZh}
            </p>
            <div className="pt-2 border-t border-[#1A232C] text-xs font-mono text-[#9FB1C1]">
              <span className="text-[#4FA3B8]">OBJECTIVE: </span>
              {lesson.lab.objective} ({lesson.lab.objectiveZh})
            </div>
          </div>

          {/* Simulated Topology Nodes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-[#8B98A5]">
              <span>SANDBOX TOPOLOGY NODES · 实验拓扑节点</span>
              <span>
                Diagnostics Run: {executedIds.length} /{' '}
                {lesson.lab.diagnosticActions.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {lesson.lab.nodes.map((node) => {
                const statusTone =
                  isCompleted && node.status !== 'nominal'
                    ? 'text-[#469A6C] border-[#469A6C]/40'
                    : node.status === 'compromised'
                    ? 'text-[#C94B4B] border-[#C94B4B]/40'
                    : node.status === 'suspect'
                    ? 'text-[#D89B3C] border-[#D89B3C]/40'
                    : 'text-[#4FA3B8] border-[#263442]';
                return (
                  <div
                    key={node.id}
                    className={`p-3.5 bg-[#10161C] border rounded ${statusTone}`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="font-semibold text-[#E6EDF3]">
                        {node.label}
                      </span>
                      <span>{node.address}</span>
                    </div>
                    <p className="text-xs text-[#9FB1C1] leading-snug">
                      {node.role}
                    </p>
                    <p className="text-[11px] text-[#6E7C89] mt-0.5">
                      {node.roleZh}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 1: Hands-On Diagnostic Actions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#4FA3B8]">
                Step 1 · Execute Interactive Diagnostics (Must inspect telemetry before analytical fix)
              </h3>
              <span className="text-xs font-mono text-[#8B98A5]">
                {allCriticalsDone
                  ? 'All Critical Clues Verified · 关键取证已完成'
                  : 'Inspect packets/configs below · 请点击下方命令排查'}
              </span>
            </div>

            <div className="space-y-3">
              {lesson.lab.diagnosticActions.map((diag, idx) => {
                const isExecuted = executedIds.includes(diag.id);
                return (
                  <div
                    key={diag.id}
                    className={`p-4 rounded border transition-colors ${
                      isExecuted
                        ? 'bg-[#0E161B] border-[#4FA3B8]/50'
                        : 'bg-[#11161C] border-[#222D38]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-mono text-[#8B98A5]">
                          <span>DIAGNOSTIC 0{idx + 1}</span>
                          <span aria-hidden="true">·</span>
                          <span>Target: {diag.targetNode}</span>
                          {isExecuted && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-[#469A6C] font-semibold">
                                TELEMETRY CAPTURED
                              </span>
                            </>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-[#E6EDF3]">
                          {diag.label} —{' '}
                          <span className="text-[#9FB1C1] font-normal">
                            {diag.labelZh}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-[#4FA3B8]">
                          $ {diag.commandPreview}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          onExecuteDiagnostic(lesson.id, diag.id)
                        }
                        className={`shrink-0 flex items-center gap-2 px-4 py-2 text-xs font-mono rounded border transition-colors ${
                          isExecuted
                            ? 'bg-[#16262E] text-[#4FA3B8] border-[#4FA3B8]/50 hover:bg-[#1D323C]'
                            : 'bg-[#4FA3B8] text-[#080B0E] font-semibold border-[#4FA3B8] hover:bg-[#63B5C9]'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>
                          {isExecuted
                            ? 'Re-Run Diagnostic'
                            : 'Run Diagnostic / 执行排查'}
                        </span>
                      </button>
                    </div>

                    {isExecuted && (
                      <div className="mt-3 pt-3 border-t border-[#1F2C38] space-y-2.5">
                        <pre className="p-3 bg-[#06080A] border border-[#1B252F] rounded text-xs font-mono text-[#C9D6E2] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                          {diag.telemetryOutput}
                        </pre>
                        <pre className="p-2.5 bg-[#080C10] border border-[#18222C] rounded text-[11px] font-mono text-[#8B98A5] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                          {diag.telemetryOutputZh}
                        </pre>
                        <div className="p-2.5 bg-[#12232B] border-l-2 border-[#4FA3B8] text-xs text-[#E6EDF3]">
                          <div className="font-semibold text-[#4FA3B8] font-mono mb-0.5">
                            FORENSIC CLUE DISCOVERED · 关键诊断结论
                          </div>
                          <div>{diag.revealsClue}</div>
                          <div className="text-[#9FB1C1] mt-0.5">
                            {diag.revealsClueZh}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 2: Operational Resolution (Analytical Fix vs. Brute Force) */}
          <div className="space-y-3 pt-2 border-t border-[#1F2933]">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#469A6C]">
                Step 2 · Execute Operational Resolution (Unlock Field Capability)
              </h3>
              <span className="text-xs font-mono text-[#8B98A5]">
                Unlocks: {lesson.unlocks.badgeLabel} ({lesson.unlocks.tools.join(', ')})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lesson.lab.resolutions.map((res) => {
                const isAnalytical = res.approach === 'analytical';
                const lockedByDiag =
                  isAnalytical && !allCriticalsDone && !state.debugMode;

                return (
                  <div
                    key={res.id}
                    className={`p-4 rounded border flex flex-col justify-between gap-3 ${
                      isAnalytical
                        ? 'bg-[#0E1815] border-[#469A6C]/50'
                        : 'bg-[#191113] border-[#C94B4B]/40'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span
                          className={
                            isAnalytical ? 'text-[#469A6C]' : 'text-[#C94B4B]'
                          }
                        >
                          {isAnalytical
                            ? 'ANALYTICAL FIX · 原理级精准修复 (RECOMMENDED)'
                            : 'RECKLESS SHORTCUT · 盲目强行操作 (HIGH RISK)'}
                        </span>
                        <span className="text-[#8B98A5]">
                          Suspicion {res.suspicionDelta >= 0 ? `+${res.suspicionDelta}%` : `${res.suspicionDelta}%`} · Exposure{' '}
                          {res.exposureDelta >= 0 ? `+${res.exposureDelta}%` : `${res.exposureDelta}%`}
                        </span>
                      </div>
                      <div className="text-sm font-semibold text-[#E6EDF3]">
                        {res.label}
                      </div>
                      <div className="text-xs text-[#9FB1C1]">{res.labelZh}</div>
                      <div className="text-xs font-mono text-[#8B98A5] pt-1">
                        $ {res.commandPreview}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={lockedByDiag}
                      onClick={() => onSubmitResolution(lesson.id, res.id)}
                      className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono rounded border transition-colors ${
                        lockedByDiag
                          ? 'bg-[#151B21] text-[#63707E] border-[#25303B] cursor-not-allowed'
                          : isAnalytical
                          ? 'bg-[#469A6C] text-[#080B0E] font-semibold border-[#469A6C] hover:bg-[#57AD7E]'
                          : 'bg-[#281518] text-[#E07A7A] border-[#C94B4B]/50 hover:bg-[#381C20]'
                      }`}
                    >
                      {lockedByDiag ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>
                            Complete Step 1 Diagnostics First · 请先执行上方两项诊断
                          </span>
                        </>
                      ) : isAnalytical ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>
                            {isCompleted
                              ? 'Analytical Resolution Verified (Re-run)'
                              : 'Apply Analytical Resolution & Unlock Capability'}
                          </span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Test Reckless Brute-Force Path</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step 3: Immediate Field Application once Completed */}
          {isCompleted && (
            <div className="p-4 bg-[#101D1A] border border-[#469A6C] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono text-[#469A6C]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    CAPABILITY UNLOCKED: {lesson.unlocks.badgeLabel} (
                    {lesson.unlocks.badgeLabelZh})
                  </span>
                </div>
                <div className="text-sm font-semibold text-[#E6EDF3]">
                  {lesson.lab.storyApplication.actionLabel}
                </div>
                <div className="text-xs text-[#9FB1C1]">
                  {lesson.lab.storyApplication.actionLabelZh}
                </div>
              </div>

              <button
                type="button"
                disabled={isStoryApplied}
                onClick={() => onApplyToStory(lesson.id, 'analytical')}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 text-xs font-mono rounded border transition-colors ${
                  isStoryApplied
                    ? 'bg-[#172822] text-[#469A6C] border-[#469A6C]/40 cursor-default'
                    : 'bg-[#4FA3B8] text-[#080B0E] font-semibold border-[#4FA3B8] hover:bg-[#64B6CA]'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>
                  {isStoryApplied
                    ? 'Applied to Investigation · 已应用于当前案件'
                    : 'Apply to Active Investigation · 立即应用于调查'}
                </span>
                {!isStoryApplied && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
