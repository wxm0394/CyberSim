import {
  KnowledgeCategoryId,
  LearningLesson,
  LearningProgressState,
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

  return {
    completedLessonIds: Array.isArray(raw.completedLessonIds)
      ? [...raw.completedLessonIds]
      : [],
    unlockedCapabilities: Array.isArray(raw.unlockedCapabilities)
      ? ([...raw.unlockedCapabilities] as UnlockedCapabilityId[])
      : [],
    unlockedTools: Array.isArray(raw.unlockedTools)
      ? [...raw.unlockedTools]
      : [],
    masteredConcepts: Array.isArray(raw.masteredConcepts)
      ? [...raw.masteredConcepts]
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
      ? [...raw.appliedStoryLessons]
      : [],
    bruteForceStoryLessons: Array.isArray(raw.bruteForceStoryLessons)
      ? [...raw.bruteForceStoryLessons]
      : [],
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

export function filterLessonsByCategory(
  category: KnowledgeCategoryId | 'all'
): LearningLesson[] {
  if (category === 'all') {
    return ALL_LEARNING_LESSONS;
  }
  return ALL_LEARNING_LESSONS.filter((l) => l.category === category);
}
