import {
  KnowledgeCategoryId,
  LearningLesson,
  LearningProgressState,
  SourceTrackFilter,
  UnlockedCapabilityId,
} from './lessonTypes';
import { ALL_LEARNING_LESSONS, getLessonById } from '../data/learningMissions';

export function createInitialLearningState(): LearningProgressState {
  return {
    completedLessonIds: [],
    unlockedCapabilities: [],
    unlockedTools: [],
    masteredConcepts: [],
    executedDiagnosticsByLesson: {},
    labResolutionByLesson: {},
    appliedStoryLessons: [],
    bruteForceStoryLessons: [],
    activeSourceTrack: 'all',
    activeCategoryFilter: 'all',
    selectedLessonId: 'lesson_02_dns',
    activeLabLessonId: null,
  };
}

export function migrateLearningState(
  raw?: Partial<LearningProgressState> | null
): LearningProgressState {
  const base = createInitialLearningState();
  if (!raw || typeof raw !== 'object') {
    return base;
  }

  const validSourceTrack: SourceTrackFilter =
    raw.activeSourceTrack === 'network_internet' ||
    raw.activeSourceTrack === 'tactical_security' ||
    raw.activeSourceTrack === 'all'
      ? raw.activeSourceTrack
      : 'all';

  return {
    completedLessonIds: Array.isArray(raw.completedLessonIds)
      ? Array.from(new Set(raw.completedLessonIds))
      : [],
    unlockedCapabilities: Array.isArray(raw.unlockedCapabilities)
      ? (Array.from(new Set(raw.unlockedCapabilities)) as UnlockedCapabilityId[])
      : [],
    unlockedTools: Array.isArray(raw.unlockedTools)
      ? Array.from(new Set(raw.unlockedTools))
      : [],
    masteredConcepts: Array.isArray(raw.masteredConcepts)
      ? Array.from(new Set(raw.masteredConcepts))
      : [],
    executedDiagnosticsByLesson:
      raw.executedDiagnosticsByLesson &&
      typeof raw.executedDiagnosticsByLesson === 'object'
        ? { ...raw.executedDiagnosticsByLesson }
        : {},
    labResolutionByLesson:
      raw.labResolutionByLesson && typeof raw.labResolutionByLesson === 'object'
        ? { ...raw.labResolutionByLesson }
        : {},
    appliedStoryLessons: Array.isArray(raw.appliedStoryLessons)
      ? Array.from(new Set(raw.appliedStoryLessons))
      : [],
    bruteForceStoryLessons: Array.isArray(raw.bruteForceStoryLessons)
      ? Array.from(new Set(raw.bruteForceStoryLessons))
      : [],
    activeSourceTrack: validSourceTrack,
    activeCategoryFilter: raw.activeCategoryFilter || 'all',
    selectedLessonId:
      raw.selectedLessonId && getLessonById(raw.selectedLessonId)
        ? raw.selectedLessonId
        : 'lesson_02_dns',
    activeLabLessonId: raw.activeLabLessonId || null,
  };
}

export function checkLessonPrerequisites(
  progress: LearningProgressState,
  lesson: LearningLesson
): { unlocked: boolean; missingPrerequisiteTitles: string[] } {
  const missing: string[] = [];
  for (const prereqId of lesson.prerequisites) {
    if (!progress.completedLessonIds.includes(prereqId)) {
      const prereqLesson = getLessonById(prereqId);
      missing.push(
        prereqLesson ? `${prereqLesson.code}: ${prereqLesson.title}` : prereqId
      );
    }
  }
  return {
    unlocked: missing.length === 0,
    missingPrerequisiteTitles: missing,
  };
}

export function hasUnlockedCapability(
  progress: LearningProgressState,
  capability: UnlockedCapabilityId
): boolean {
  return progress.unlockedCapabilities.includes(capability);
}

export function getExecutedDiagnosticsForLesson(
  progress: LearningProgressState,
  lessonId: string
): string[] {
  return progress.executedDiagnosticsByLesson[lessonId] || [];
}

export function areCriticalDiagnosticsComplete(
  progress: LearningProgressState,
  lesson: LearningLesson
): boolean {
  const executed = getExecutedDiagnosticsForLesson(progress, lesson.id);
  const criticalIds = lesson.lab.diagnosticActions
    .filter((d) => d.isCriticalClue)
    .map((d) => d.id);
  return criticalIds.every((id) => executed.includes(id));
}

export function filterLessonsByTrackAndCategory(
  track: SourceTrackFilter,
  category: KnowledgeCategoryId | 'all'
): LearningLesson[] {
  return ALL_LEARNING_LESSONS.filter((lesson) => {
    const matchesTrack = track === 'all' || lesson.sourceTrack === track;
    const matchesCategory = category === 'all' || lesson.category === category;
    return matchesTrack && matchesCategory;
  });
}

export function filterLessonsByCategory(
  category: KnowledgeCategoryId | 'all'
): LearningLesson[] {
  return filterLessonsByTrackAndCategory('all', category);
}
