import React, { useState } from 'react';
import {
  BookOpen,
  Cpu,
  CheckCircle2,
  Lock,
  GitBranch,
  ShieldCheck,
  Terminal,
  Layers,
  X,
} from 'lucide-react';
import { DeadAirState } from '../game/types';
import {
  KnowledgeCategoryId,
  SourceTrackFilter,
} from '../learning/lessonTypes';
import {
  ALL_LEARNING_LESSONS,
  CAPABILITY_DESCRIPTORS,
  getLessonById,
} from '../data/learningMissions';
import {
  CURATED_SOURCE_REGISTRY,
  CYBERSEC_PROJECTS_ATTRIBUTION_HEADER,
  FQ_BOOK_ATTRIBUTION_HEADER,
  KNOWLEDGE_CATEGORIES,
  SOURCE_TRACK_DESCRIPTORS,
} from '../learning/sourceRegistry';
import {
  checkLessonPrerequisites,
  filterLessonsByTrackAndCategory,
  hasUnlockedCapability,
} from '../learning/learningProgress';
import { LessonBriefing } from './LessonBriefing';
import { NetworkLabModal } from './NetworkLabModal';

interface KnowledgeCodexProps {
  state: DeadAirState;
  onSelectSourceTrack?: (track: SourceTrackFilter) => void;
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
  onSelectSourceTrack,
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

  const activeTrack: SourceTrackFilter =
    state.learning.activeSourceTrack || 'all';

  const visibleLessons = filterLessonsByTrackAndCategory(
    activeTrack,
    state.learning.activeCategoryFilter
  );

  const visibleCategories =
    activeTrack === 'all'
      ? KNOWLEDGE_CATEGORIES
      : KNOWLEDGE_CATEGORIES.filter((c) => c.sourceTrack === activeTrack);

  const trackLessonCount =
    activeTrack === 'all'
      ? ALL_LEARNING_LESSONS.length
      : ALL_LEARNING_LESSONS.filter((l) => l.sourceTrack === activeTrack)
          .length;

  const selectedLesson =
    getLessonById(state.learning.selectedLessonId) ||
    visibleLessons[0] ||
    ALL_LEARNING_LESSONS[0];

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
              ELI WARD&apos;S FIELD MANUAL — GREYOS 6.4 · DUAL-SOURCE KNOWLEDGE &amp; LAB DATABASE
            </span>
          </div>
          <p className="text-xs text-[#8B98A5]">
            Track I:{' '}
            <span className="font-mono text-[#C9D6E2]">hoochanlon/fq-book</span>{' '}
            (Levels 01–07) · Track II:{' '}
            <span className="font-mono text-[#C9D6E2]">
              Lauren-Bitten/CyberSecurity-Projects
            </span>{' '}
            (Levels 08–12)
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
            data-testid="toggle-source-registry-btn"
            onClick={() => setShowSourceRegistry((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[#9FB1C1] hover:text-[#E6EDF3] bg-[#182028] hover:bg-[#222C37] border border-[#2C3947] rounded transition-colors cursor-pointer"
          >
            <GitBranch className="w-3.5 h-3.5 text-[#4FA3B8]" />
            <span>
              {showSourceRegistry
                ? 'Back to Field Manual'
                : 'Source & Curation Registry'}
            </span>
          </button>

          {onCloseOverlay && (
            <button
              type="button"
              onClick={onCloseOverlay}
              aria-label="Close Field Manual"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-[#8B98A5] hover:text-[#E6EDF3] bg-[#182028] hover:bg-[#222C37] border border-[#2C3947] rounded transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close [M]</span>
            </button>
          )}
        </div>
      </div>

      {/* Source-Track Selector Bar (All Sources / Track I / Track II) */}
      <div className="px-5 py-2.5 bg-[#0A0E13] border-b border-[#1E2832] flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-mono text-[#8B98A5] uppercase tracking-wider mr-1">
            <Layers className="w-3.5 h-3.5 text-[#4FA3B8]" />
            <span>Source Track · 知识来源轨道:</span>
          </span>
          {SOURCE_TRACK_DESCRIPTORS.map((track) => {
            const isActive = activeTrack === track.id;
            return (
              <button
                key={track.id}
                type="button"
                data-testid={`source-track-${track.id}`}
                onClick={() => onSelectSourceTrack?.(track.id)}
                className={`px-3 py-1.5 text-xs font-mono rounded border transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#4FA3B8]/20 border-[#4FA3B8] text-[#E6EDF3] font-semibold'
                    : 'bg-[#121820] border-[#222D38] text-[#9FB1C1] hover:text-[#E6EDF3] hover:border-[#344454]'
                }`}
              >
                {track.label}
              </button>
            );
          })}
        </div>
        <div className="text-[11px] font-mono text-[#8B98A5]">
          Showing {visibleLessons.length} of {ALL_LEARNING_LESSONS.length} modules
        </div>
      </div>

      {/* Unlocked Capabilities Matrix Bar */}
      <div className="px-5 py-2 bg-[#0C1015] border-b border-[#1E2832] flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs font-mono">
        <span className="text-[#8B98A5] uppercase tracking-wider">
          Capabilities:
        </span>
        {allCapabilities.map((cap) => {
          const unlocked = hasUnlockedCapability(state.learning, cap.id);
          return (
            <button
              key={cap.id}
              type="button"
              onClick={() => onSelectLesson(cap.unlockedByLessonId)}
              className={`flex items-center gap-1 transition-colors cursor-pointer ${
                unlocked
                  ? 'text-[#469A6C] hover:text-[#65B889] font-semibold'
                  : 'text-[#647280] hover:text-[#9FB1C1]'
              }`}
              title={`${cap.name} (${cap.nameZh}) [CLI: ${cap.cliCommand}]: ${cap.investigationEffect}`}
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
          data-testid="category-filter-all"
          onClick={() => onSelectCategory('all')}
          className={`px-3 py-1.5 text-xs font-mono rounded transition-colors cursor-pointer ${
            state.learning.activeCategoryFilter === 'all'
              ? 'bg-[#4FA3B8] text-[#080B0E] font-semibold'
              : 'bg-[#151C24] text-[#9FB1C1] hover:text-[#E6EDF3]'
          }`}
        >
          All Categories ({trackLessonCount})
        </button>
        {visibleCategories.map((cat) => {
          const active = state.learning.activeCategoryFilter === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              data-testid={`category-filter-${cat.id}`}
              onClick={() => onSelectCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors cursor-pointer ${
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Track I Attribution Card */}
            <div className="p-4 bg-[#10161D] border border-[#24303C] rounded space-y-2">
              <div className="text-xs font-mono text-[#4FA3B8] uppercase">
                TRACK I SOURCE ATTRIBUTION · 网络与互联网基础（Levels 01–07）
              </div>
              <h3 className="text-sm font-semibold text-[#E6EDF3]">
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

            {/* Track II Attribution Card */}
            <div className="p-4 bg-[#10161D] border border-[#469A6C]/40 rounded space-y-2">
              <div className="text-xs font-mono text-[#469A6C] uppercase">
                TRACK II SOURCE ATTRIBUTION · 战术安全工程与反取证（Levels 08–12）
              </div>
              <h3 className="text-sm font-semibold text-[#E6EDF3]">
                {CYBERSEC_PROJECTS_ATTRIBUTION_HEADER.title}
              </h3>
              <p className="text-xs text-[#C9D6E2] leading-relaxed">
                {CYBERSEC_PROJECTS_ATTRIBUTION_HEADER.creditNotice}
              </p>
              <p className="text-xs text-[#8B98A5] leading-relaxed">
                {CYBERSEC_PROJECTS_ATTRIBUTION_HEADER.creditNoticeZh}
              </p>
              <div className="text-xs font-mono text-[#469A6C] pt-1">
                Source: {CYBERSEC_PROJECTS_ATTRIBUTION_HEADER.forkRepository} ·
                Upstream: {CYBERSEC_PROJECTS_ATTRIBUTION_HEADER.upstreamRepository} ·
                License: {CYBERSEC_PROJECTS_ATTRIBUTION_HEADER.license}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {CURATED_SOURCE_REGISTRY.map((entry) => (
              <div
                key={entry.id}
                className="p-4 bg-[#10151B] border border-[#222D38] rounded space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs font-mono gap-2">
                  <span className="text-[#4FA3B8] truncate">
                    [{entry.sourceTrack === 'network_internet' ? 'TRACK I' : 'TRACK II'}]{' '}
                    {entry.sectionPath}
                  </span>
                  <span
                    className={
                      entry.reviewStatus === 'reviewed'
                        ? 'text-[#469A6C] shrink-0'
                        : entry.reviewStatus === 'historical'
                        ? 'text-[#D89B3C] shrink-0'
                        : 'text-[#C94B4B] shrink-0'
                    }
                  >
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
              Curriculum Modules &amp; Interactive Labs ({visibleLessons.length})
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
                  data-testid={`lesson-card-${lesson.id}`}
                  onClick={() => onSelectLesson(lesson.id)}
                  className={`w-full text-left p-3.5 rounded border transition-colors space-y-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-[#141E27] border-[#4FA3B8]'
                      : 'bg-[#10151B] border-[#1F2933] hover:border-[#2F3E4E]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span
                      className={
                        lesson.sourceTrack === 'tactical_security'
                          ? 'text-[#469A6C] font-semibold'
                          : lesson.isMvpCoreLab
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

                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[#8B98A5]">
                    <span className="flex items-center gap-1.5 truncate">
                      <Terminal className="w-3 h-3 text-[#4FA3B8] shrink-0" />
                      <span className="truncate">
                        CLI: {lesson.unlocks.tools.join(', ')}
                      </span>
                    </span>
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-[#151C24] text-[#9FB1C1] shrink-0">
                      {lesson.sourceTrack === 'network_internet' ? 'Track I' : 'Track II'}
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
