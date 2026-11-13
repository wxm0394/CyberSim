import React from 'react';
import {
  BookOpen,
  Cpu,
  CheckCircle2,
  Lock,
  ShieldAlert,
  Terminal,
  GitBranch,
  ArrowRight,
} from 'lucide-react';
import { DeadAirState } from '../game/types';
import { LearningLesson } from '../learning/lessonTypes';
import {
  checkLessonPrerequisites,
  getExecutedDiagnosticsForLesson,
} from '../learning/learningProgress';

interface LessonBriefingProps {
  state: DeadAirState;
  lesson: LearningLesson;
  onOpenLab: (lessonId: string) => void;
  onApplyToStory: (lessonId: string, mode: 'analytical' | 'brute_force') => void;
}

export const LessonBriefing: React.FC<LessonBriefingProps> = ({
  state,
  lesson,
  onOpenLab,
  onApplyToStory,
}) => {
  const prereq = checkLessonPrerequisites(state.learning, lesson);
  const isCompleted = state.learning.completedLessonIds.includes(lesson.id);
  const isStoryApplied = state.learning.appliedStoryLessons.includes(lesson.id);
  const isBruteForced = state.learning.bruteForceStoryLessons.includes(
    lesson.id
  );
  const executedDiagCount = getExecutedDiagnosticsForLesson(
    state.learning,
    lesson.id
  ).length;

  return (
    <div className="space-y-5 text-[#E6EDF3]">
      {/* Lesson Header & Metadata */}
      <div className="p-5 bg-[#10151B] border border-[#222D38] rounded space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#8B98A5]">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[#4FA3B8] font-semibold whitespace-nowrap">
              {lesson.code}
            </span>
            <span aria-hidden="true">·</span>
            <span className="whitespace-nowrap">
              Difficulty {lesson.difficulty}/5
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Source: {lesson.source.repository} ({lesson.source.sectionPath})
            </span>
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap">
            {isCompleted ? (
              <span className="text-[#469A6C] font-semibold">
                MASTERED · 已掌握 ({lesson.unlocks.badgeLabel})
              </span>
            ) : prereq.unlocked ? (
              <span className="text-[#D89B3C]">
                AVAILABLE FOR LAB TRAINING · 可进入实验
              </span>
            ) : (
              <span className="text-[#C94B4B]">
                LOCKED · 需先完成 {prereq.missingPrerequisiteTitles.join(', ')}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-xl font-bold tracking-tight text-[#E6EDF3]">
              {lesson.title} —{' '}
              <span className="text-[#9FB1C1] font-normal">
                {lesson.titleZh}
              </span>
            </h2>
            <p className="text-xs font-mono text-[#4FA3B8] mt-1">
              Unlocks Capability: {lesson.unlocks.badgeLabel} (
              {lesson.unlocks.badgeLabelZh}) · CLI:{' '}
              {lesson.unlocks.tools.join(', ')}
            </p>
          </div>

          <button
            type="button"
            disabled={!prereq.unlocked && !state.debugMode}
            onClick={() => onOpenLab(lesson.id)}
            className={`shrink-0 self-start xl:self-center flex items-center gap-2 px-4 py-2.5 text-xs font-mono rounded border transition-colors whitespace-nowrap ${
              !prereq.unlocked && !state.debugMode
                ? 'bg-[#161C22] text-[#647280] border-[#25303B] cursor-not-allowed'
                : 'bg-[#4FA3B8] text-[#080B0E] font-semibold border-[#4FA3B8] hover:bg-[#65B7CB]'
            }`}
          >
            {!prereq.unlocked && !state.debugMode ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Prerequisite Locked</span>
              </>
            ) : (
              <>
                <Cpu className="w-4 h-4" />
                <span>
                  {isCompleted
                    ? `Open ${lesson.lab.code} Sandbox (Completed)`
                    : `Launch ${lesson.lab.code} Interactive Lab (${executedDiagCount}/${lesson.lab.diagnosticActions.length} Diagnostics)`}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Step 1: Narrative Trigger */}
        <div className="p-3.5 bg-[#0A0E12] border-l-2 border-[#D89B3C] rounded-r space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#D89B3C]">
            1. Story Trigger · 案件调查触发点
          </div>
          <p className="text-sm text-[#E6EDF3] leading-relaxed">
            {lesson.narrativeHook}
          </p>
          <p className="text-xs text-[#8B98A5] leading-relaxed">
            {lesson.narrativeHookZh}
          </p>
        </div>
      </div>

      {/* Step 2: Field Manual Concept Cards */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#8B98A5]">
          <span className="uppercase tracking-wider text-[#4FA3B8]">
            2. Field Manual Technical Briefing · 核心网络原理简报
          </span>
          <span>Adapted from {lesson.source.sectionTitle}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {lesson.concepts.map((concept, idx) => (
            <div
              key={concept.id}
              className="p-4 bg-[#10151B] border border-[#222D38] rounded flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-[#4FA3B8]">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>CONCEPT 0{idx + 1}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#8B98A5] truncate">
                    {concept.keyTerms.join(' / ')}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-[#E6EDF3]">
                  {concept.title}
                </h3>
                <div className="text-xs font-medium text-[#9FB1C1]">
                  {concept.titleZh}
                </div>

                <p className="text-xs text-[#C9D6E2] leading-relaxed">
                  {concept.summary}
                </p>
                <p className="text-xs text-[#8B98A5] leading-relaxed">
                  {concept.summaryZh}
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#1B242E]">
                <pre className="p-2.5 bg-[#070A0D] border border-[#19222B] rounded text-[11px] font-mono text-[#4FA3B8] overflow-x-auto whitespace-pre leading-relaxed">
                  {concept.diagramLines.join('\n')}
                </pre>
                <div className="p-2.5 bg-[#0D141A] rounded text-xs">
                  <span className="font-mono font-semibold text-[#469A6C]">
                    FIELD RULE:{' '}
                  </span>
                  <span className="text-[#E6EDF3]">{concept.practicalRule}</span>
                  <div className="text-[#8B98A5] mt-0.5">
                    {concept.practicalRuleZh}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 3 & 4: Investigation Application (Analytical Mastery vs. Brute-Force Consequence) */}
      <div className="p-5 bg-[#10151B] border border-[#222D38] rounded space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-xs font-mono uppercase tracking-wider text-[#469A6C]">
              3 & 4. Field Investigation Decision · 知识运用 vs 强行试错（双路径后果）
            </div>
            <p className="text-xs text-[#8B98A5] mt-0.5">
              Target Node / Artifact:{' '}
              <span className="font-mono text-[#E6EDF3]">
                {lesson.lab.storyApplication.targetHostOrFile}
              </span>
            </p>
          </div>

          <button
            type="button"
            disabled={!prereq.unlocked && !state.debugMode}
            onClick={() => onOpenLab(lesson.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[#4FA3B8] bg-[#14222B] hover:bg-[#1B2E3A] border border-[#4FA3B8]/40 rounded transition-colors"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Open {lesson.lab.code} Sandbox</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Path A: Analytical Mastery */}
          <div className="p-4 bg-[#0C1513] border border-[#469A6C]/40 rounded flex flex-col justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#469A6C] font-semibold">
                  PATH A · ANALYTICAL MASTERY (理解原理并应用工具)
                </span>
                <span className="text-[#8B98A5]">
                  Suspicion {lesson.lab.storyApplication.analyticalSuspicionDelta}% ·
                  Exposure {lesson.lab.storyApplication.analyticalExposureDelta}%
                </span>
              </div>
              <div className="text-sm font-semibold text-[#E6EDF3]">
                {lesson.lab.storyApplication.actionLabel}
              </div>
              <div className="text-xs text-[#9FB1C1]">
                {lesson.lab.storyApplication.actionLabelZh}
              </div>
              <div className="text-xs font-mono text-[#4FA3B8]">
                $ {lesson.lab.storyApplication.analyticalCommand}
              </div>
              <p className="text-xs text-[#8B98A5] pt-1">
                {lesson.lab.storyApplication.analyticalOutcome} (
                {lesson.lab.storyApplication.analyticalOutcomeZh})
              </p>
            </div>

            <button
              type="button"
              disabled={(!isCompleted && !state.debugMode) || isStoryApplied}
              onClick={() => onApplyToStory(lesson.id, 'analytical')}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono rounded border transition-colors ${
                isStoryApplied
                  ? 'bg-[#152821] text-[#469A6C] border-[#469A6C]/40 cursor-default'
                  : !isCompleted && !state.debugMode
                  ? 'bg-[#141A20] text-[#667584] border-[#242F3A] cursor-not-allowed'
                  : 'bg-[#469A6C] text-[#080B0E] font-semibold border-[#469A6C] hover:bg-[#57AE7F]'
              }`}
            >
              {isStoryApplied ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Capability Applied to Case · 已完成精准取证</span>
                </>
              ) : !isCompleted && !state.debugMode ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Complete {lesson.lab.code} First to Unlock</span>
                </>
              ) : (
                <>
                  <Terminal className="w-3.5 h-3.5" />
                  <span>Execute {lesson.unlocks.badgeLabel} on Case</span>
                </>
              )}
            </button>
          </div>

          {/* Path B: Brute-Force Without Understanding */}
          <div className="p-4 bg-[#171012] border border-[#C94B4B]/40 rounded flex flex-col justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#C94B4B] font-semibold">
                  PATH B · UNVERIFIED BRUTE-FORCE (不学原理强行操作)
                </span>
                <span className="text-[#E07A7A]">
                  Suspicion +{lesson.lab.storyApplication.bruteForceSuspicionDelta}% ·
                  Exposure +{lesson.lab.storyApplication.bruteForceExposureDelta}%
                </span>
              </div>
              <div className="text-sm font-semibold text-[#E6EDF3]">
                Bypass {lesson.unlocks.badgeLabel} & Force Raw Action
              </div>
              <div className="text-xs text-[#9FB1C1]">
                跳过原理验证直接执行高噪操作（触发企业安全监控或蜜罐告警）
              </div>
              <div className="text-xs font-mono text-[#E07A7A]">
                $ {lesson.lab.storyApplication.bruteForceCommand}
              </div>
              <p className="text-xs text-[#8B98A5] pt-1">
                {lesson.lab.storyApplication.bruteForceOutcome} (
                {lesson.lab.storyApplication.bruteForceOutcomeZh})
              </p>
            </div>

            <button
              type="button"
              disabled={isBruteForced || isStoryApplied}
              onClick={() => onApplyToStory(lesson.id, 'brute_force')}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono rounded border transition-colors ${
                isBruteForced || isStoryApplied
                  ? 'bg-[#1D1517] text-[#6E5559] border-[#2E2023] cursor-not-allowed'
                  : 'bg-[#291518] text-[#E07A7A] border-[#C94B4B]/50 hover:bg-[#381C20]'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>
                {isBruteForced
                  ? 'Unverified Penalty Logged · 已记录强行操作后果'
                  : isStoryApplied
                  ? 'Resolved Cleanly via Capability'
                  : 'Force Unverified Operation (High Risk)'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Step 5: Open Source Attribution */}
      <div className="p-3.5 bg-[#0B0F14] border border-[#1B242E] rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-[#8B98A5]">
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-[#4FA3B8] shrink-0" />
          <span>
            SOURCE: {lesson.source.repository} (fork: {lesson.source.fork}) ·{' '}
            {lesson.source.sectionPath}
          </span>
        </div>
        <span className="text-[#469A6C]">
          STATUS: {lesson.reviewStatus.toUpperCase()} · EDUCATIONAL ADAPTATION
        </span>
      </div>
    </div>
  );
};
