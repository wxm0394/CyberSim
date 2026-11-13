import React, { useState } from 'react';
import {
  BookOpen,
  Cpu,
  CheckCircle2,
  Lock,
  GitBranch,
  ShieldCheck,
  Terminal,
  X,
} from 'lucide-react';
import { DeadAirState } from '../game/types';
import { KnowledgeCategoryId } from '../learning/lessonTypes';
import {
  ALL_LEARNING_LESSONS,
  CAPABILITY_DESCRIPTORS,
  getLessonById,
} from '../data/learningMissions';
import {
  CURATED_SOURCE_REGISTRY,
  FQ_BOOK_ATTRIBUTION_HEADER,
  KNOWLEDGE_CATEGORIES,
} from '../learning/sourceRegistry';
import {
  checkLessonPrerequisites,
  filterLessonsByCategory,
  hasUnlockedCapability,
} from '../learning/learningProgress';
import { LessonBriefing } from './LessonBriefing';
import { NetworkLabModal } from './NetworkLabModal';

interface KnowledgeCodexProps {
  state: DeadAirState;
  onSelectCategory: (category: KnowledgeCategoryId | 'all') => void;
  onSelectLesson: (lessonId: string) => void;
  onOpenLab: (lessonId: string) => void;
  onCloseLab: () => void;
  onExecuteDiagnostic: (lessonId: string, diagnosticId: string) => void;
  onSubmitResolution: (lessonId: string, resolutionId: string) => void;
  onApplyToStory: (lessonId: string, mode: 'analytical' | 'brute_force') => void;
  onCloseOverlay?: () => void;
}

export const KnowledgeCodex: React.FC<KnowledgeCodexProps> = ({
  state,
  onSelectCategory,
  onSelectLesson,
  onOpenLab,
  onCloseLab,
  onExecuteDiagnostic,
  onSubmitResolution,
  onApplyToStory,
  onCloseOverlay,
}) => {
  const [showSourceRegistry, setShowSourceRegistry] = useState(false);

  const visibleLessons = filterLessonsByCategory(
    state.learning.activeCategoryFilter
  );
  const selectedLesson =
    getLessonById(state.learning.selectedLessonId) || ALL_LEARNING_LESSONS[0];
  const activeLabLesson = state.learning.activeLabLessonId
    ? getLessonById(state.learning.activeLabLessonId)
    : undefined;

  const allCapabilities = Object.values(CAPABILITY_DESCRIPTORS);

  return (
    <div className="flex flex-col h-full bg-[#080B0E] text-[#E6EDF3] select-none">
      {/* Top Header Banner */}
      <div className="px-5 py-3.5 bg-[#12171D] border-b border-[#24303C] flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs font-mono text-[#4FA3B8]">
            <BookOpen className="w-3.5 h-3.5" />
            <span>
              ELI WARD&apos;S FIELD MANUAL — GREYOS 6.4 · KNOWLEDGE &amp; TRAINING DATABASE
            </span>
          </div>
          <p className="text-xs text-[#8B98A5]">
            Interactive Networking, DNS, TLS Certificates, Proxy/VPN Routing &amp; Distributed Forensics Curriculum · Adapted from{' '}
            <span className="font-mono text-[#C9D6E2]">hoochanlon/fq-book</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs font-mono text-[#8B98A5] mr-2">
            <span>
              Labs Mastered: {state.learning.completedLessonIds.length}/
              {ALL_LEARNING_LESSONS.length}
            </span>
            <span aria-hidden="true" className="mx-1.5">
              ·
            </span>
            <span className="text-[#469A6C]">
              Capabilities: {state.learning.unlockedCapabilities.length}/
              {allCapabilities.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowSourceRegistry((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[#9FB1C1] hover:text-[#E6EDF3] bg-[#182028] hover:bg-[#222C37] border border-[#2C3947] rounded transition-colors"
          >
            <GitBranch className="w-3.5 h-3.5 text-[#4FA3B8]" />
            <span>
              {showSourceRegistry
                ? 'Back to Field Manual'
                : 'fq-book Source & Curation Registry'}
            </span>
          </button>

          {onCloseOverlay && (
            <button
              type="button"
              onClick={onCloseOverlay}
              aria-label="Close Field Manual"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[#8B98A5] hover:text-[#E6EDF3] bg-[#182028] hover:bg-[#222C37] border border-[#2C3947] rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close [M]</span>
            </button>
          )}
        </div>
      </div>

      {/* Unlocked Capabilities Matrix Bar */}
      <div className="px-5 py-2.5 bg-[#0C1015] border-b border-[#1E2832] flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-mono">
        <span className="text-[#8B98A5] uppercase tracking-wider">
          Unlocked Capabilities · 已解锁调查能力:
        </span>
        {allCapabilities.map((cap) => {
          const unlocked = hasUnlockedCapability(state.learning, cap.id);
          return (
            <button
              key={cap.id}
              type="button"
              onClick={() => onSelectLesson(cap.unlockedByLessonId)}
              className={`flex items-center gap-1.5 transition-colors ${
                unlocked
                  ? 'text-[#469A6C] hover:text-[#65B889] font-semibold'
                  : 'text-[#647280] hover:text-[#9FB1C1]'
              }`}
              title={`${cap.name} (${cap.nameZh}): ${cap.investigationEffect}`}
            >
              {unlocked ? (
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Lock className="w-3 h-3 shrink-0" />
              )}
              <span>{cap.name}</span>
            </button>
          );
        })}
      </div>

      {/* Category Filter Bar (Functional Segmented Buttons) */}
      <div className="px-5 py-2.5 bg-[#0E1319] border-b border-[#1E2832] flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
            state.learning.activeCategoryFilter === 'all'
              ? 'bg-[#4FA3B8] text-[#080B0E] font-semibold'
              : 'bg-[#151C24] text-[#9FB1C1] hover:text-[#E6EDF3]'
          }`}
        >
          All Modules ({ALL_LEARNING_LESSONS.length})
        </button>
        {KNOWLEDGE_CATEGORIES.map((cat) => {
          const active = state.learning.activeCategoryFilter === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                active
                  ? 'bg-[#4FA3B8] text-[#080B0E] font-semibold'
                  : 'bg-[#151C24] text-[#9FB1C1] hover:text-[#E6EDF3]'
              }`}
            >
              {cat.label} · {cat.labelZh}
            </button>
          );
        })}
      </div>

      {/* Main Body: Source Registry Drawer OR Split Sidebar + Briefing */}
      {showSourceRegistry ? (
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="p-4 bg-[#10161D] border border-[#24303C] rounded space-y-2">
            <div className="text-xs font-mono text-[#4FA3B8] uppercase">
              OPEN EDUCATIONAL KNOWLEDGE ATTRIBUTION · 知识库改编与分级治理说明
            </div>
            <h3 className="text-base font-semibold text-[#E6EDF3]">
              {FQ_BOOK_ATTRIBUTION_HEADER.title}
            </h3>
            <p className="text-xs text-[#C9D6E2] leading-relaxed">
              {FQ_BOOK_ATTRIBUTION_HEADER.creditNotice}
            </p>
            <p className="text-xs text-[#8B98A5] leading-relaxed">
              {FQ_BOOK_ATTRIBUTION_HEADER.creditNoticeZh}
            </p>
            <div className="text-xs font-mono text-[#4FA3B8] pt-1">
              Upstream: {FQ_BOOK_ATTRIBUTION_HEADER.upstreamRepository} · Fork:{' '}
              {FQ_BOOK_ATTRIBUTION_HEADER.forkRepository}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CURATED_SOURCE_REGISTRY.map((entry) => (
              <div
                key={entry.id}
                className="p-4 bg-[#10151B] border border-[#222D38] rounded space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[#4FA3B8]">{entry.sectionPath}</span>
                  <span
                    className={
                      entry.reviewStatus === 'reviewed'
                        ? 'text-[#469A6C]'
                        : entry.reviewStatus === 'historical'
                        ? 'text-[#D89B3C]'
                        : 'text-[#C94B4B]'
                    }
                  >
                    {entry.reviewStatus.toUpperCase()} ·{' '}
                    {entry.curationDecision.toUpperCase()}
                  </span>
                </div>
                <div className="text-sm font-semibold text-[#E6EDF3]">
                  {entry.sectionTitle}
                </div>
                <p className="text-xs text-[#9FB1C1]">{entry.adaptationNote}</p>
                <p className="text-xs text-[#8B98A5]">
                  {entry.adaptationNoteZh}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Lesson List (4 cols) */}
          <div className="lg:col-span-4 border-r border-[#1E2832] overflow-y-auto p-3.5 space-y-2.5 bg-[#0A0E12]">
            <div className="text-[11px] font-mono uppercase tracking-wider text-[#8B98A5] px-1">
              Curriculum Modules &amp; MVP Labs · 关卡知识任务
            </div>
            {visibleLessons.map((lesson) => {
              const isSelected = lesson.id === selectedLesson.id;
              const isCompleted = state.learning.completedLessonIds.includes(
                lesson.id
              );
              const isApplied = state.learning.appliedStoryLessons.includes(
                lesson.id
              );
              const prereq = checkLessonPrerequisites(state.learning, lesson);

              return (
                <button
                  key={lesson.id}
                  type="button"
                  onClick={() => onSelectLesson(lesson.id)}
                  className={`w-full text-left p-3.5 rounded border transition-colors space-y-1.5 ${
                    isSelected
                      ? 'bg-[#141E27] border-[#4FA3B8]'
                      : 'bg-[#10151B] border-[#1F2933] hover:border-[#2F3E4E]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span
                      className={
                        lesson.isMvpCoreLab
                          ? 'text-[#4FA3B8] font-semibold'
                          : 'text-[#8B98A5]'
                      }
                    >
                      {lesson.code}
                    </span>
                    <span className="flex items-center gap-1">
                      {isCompleted ? (
                        <span className="text-[#469A6C] flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isApplied ? 'APPLIED' : 'MASTERED'}</span>
                        </span>
                      ) : !prereq.unlocked ? (
                        <span className="text-[#C94B4B] flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>LOCKED</span>
                        </span>
                      ) : (
                        <span className="text-[#D89B3C] flex items-center gap-1">
                          <Cpu className="w-3 h-3" />
                          <span>READY</span>
                        </span>
                      )}
                    </span>
                  </div>

                  <div className="text-sm font-semibold text-[#E6EDF3]">
                    {lesson.title} —{' '}
                    <span className="text-[#9FB1C1] font-normal">
                      {lesson.titleZh}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8B98A5]">
                    <Terminal className="w-3 h-3 text-[#4FA3B8]" />
                    <span className="truncate">
                      Unlocks: {lesson.unlocks.badgeLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Lesson Briefing & Story Application (8 cols) */}
          <div className="lg:col-span-8 overflow-y-auto p-5 bg-[#080B0E]">
            <LessonBriefing
              state={state}
              lesson={selectedLesson}
              onOpenLab={onOpenLab}
              onApplyToStory={onApplyToStory}
            />
          </div>
        </div>
      )}

      {/* Active Interactive Network Lab Modal */}
      {activeLabLesson && (
        <NetworkLabModal
          state={state}
          lesson={activeLabLesson}
          onExecuteDiagnostic={onExecuteDiagnostic}
          onSubmitResolution={onSubmitResolution}
          onApplyToStory={onApplyToStory}
          onClose={onCloseLab}
        />
      )}
    </div>
  );
};
