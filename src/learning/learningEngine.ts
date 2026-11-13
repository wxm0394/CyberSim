import { DeadAirState, TerminalOutputLine } from '../game/types';
import {
  KnowledgeCategoryId,
  UnlockedCapabilityId,
} from './lessonTypes';
import {
  ALL_LEARNING_LESSONS,
  CAPABILITY_DESCRIPTORS,
  getLessonById,
} from '../data/learningMissions';
import {
  checkLessonPrerequisites,
  getExecutedDiagnosticsForLesson,
  hasUnlockedCapability,
} from './learningProgress';

function makeTermLine(
  text: string,
  tone: TerminalOutputLine['tone'] = 'output'
): TerminalOutputLine {
  return {
    id: `term-learn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    tone,
  };
}

function clampMetric(val: number): number {
  return Math.min(100, Math.max(0, Math.round(val)));
}

export function selectLearningCategory(
  state: DeadAirState,
  category: KnowledgeCategoryId | 'all'
): DeadAirState {
  const matching =
    category === 'all'
      ? ALL_LEARNING_LESSONS
      : ALL_LEARNING_LESSONS.filter((l) => l.category === category);
  const nextSelected = matching.some(
    (l) => l.id === state.learning.selectedLessonId
  )
    ? state.learning.selectedLessonId
    : matching[0]?.id || state.learning.selectedLessonId;

  return {
    ...state,
    learning: {
      ...state.learning,
      activeCategoryFilter: category,
      selectedLessonId: nextSelected,
    },
  };
}

export function selectLearningLesson(
  state: DeadAirState,
  lessonId: string
): DeadAirState {
  const lesson = getLessonById(lessonId);
  if (!lesson) return state;
  return {
    ...state,
    learning: {
      ...state.learning,
      selectedLessonId: lesson.id,
    },
  };
}

export function openNetworkLabForLesson(
  state: DeadAirState,
  lessonId: string
): DeadAirState {
  const lesson = getLessonById(lessonId);
  if (!lesson) return state;

  const prereq = checkLessonPrerequisites(state.learning, lesson);
  if (!prereq.unlocked && !state.debugMode) {
    const msg = `Prerequisite required before launching ${lesson.code}: complete ${prereq.missingPrerequisiteTitles.join(', ')} first.`;
    return {
      ...state,
      lastFeedbackBanner: msg,
    };
  }

  return {
    ...state,
    learning: {
      ...state.learning,
      selectedLessonId: lesson.id,
      activeLabLessonId: lesson.id,
    },
    lastFeedbackBanner: `Launched ${lesson.lab.code}: ${lesson.lab.title}`,
  };
}

export function closeNetworkLab(state: DeadAirState): DeadAirState {
  return {
    ...state,
    learning: {
      ...state.learning,
      activeLabLessonId: null,
    },
  };
}

export function executeLabDiagnosticStep(
  state: DeadAirState,
  lessonId: string,
  diagnosticId: string
): DeadAirState {
  const lesson = getLessonById(lessonId);
  if (!lesson) return state;

  const diag = lesson.lab.diagnosticActions.find((d) => d.id === diagnosticId);
  if (!diag) return state;

  const currentExecuted = getExecutedDiagnosticsForLesson(
    state.learning,
    lesson.id
  );
  const nextExecuted = currentExecuted.includes(diag.id)
    ? currentExecuted
    : [...currentExecuted, diag.id];

  return {
    ...state,
    learning: {
      ...state.learning,
      executedDiagnosticsByLesson: {
        ...state.learning.executedDiagnosticsByLesson,
        [lesson.id]: nextExecuted,
      },
    },
    terminalHistory: [
      ...state.terminalHistory,
      makeTermLine(`eli@greyos:[netlab]$ ${diag.commandPreview}`, 'command'),
      makeTermLine(diag.telemetryOutput, 'output'),
      makeTermLine(`[DIAGNOSTIC FINDING] ${diag.revealsClue}`, 'highlight'),
    ],
    lastFeedbackBanner: `Lab Diagnostic Complete: ${diag.revealsClue}`,
  };
}

export function submitLabResolution(
  state: DeadAirState,
  lessonId: string,
  resolutionId: string
): DeadAirState {
  const lesson = getLessonById(lessonId);
  if (!lesson) return state;

  const prereq = checkLessonPrerequisites(state.learning, lesson);
  if (!prereq.unlocked && !state.debugMode) {
    return {
      ...state,
      lastFeedbackBanner: `Cannot resolve ${lesson.code}: missing prerequisite ${prereq.missingPrerequisiteTitles.join(', ')}.`,
    };
  }

  const resolution = lesson.lab.resolutions.find((r) => r.id === resolutionId);
  if (!resolution) return state;

  const executed = getExecutedDiagnosticsForLesson(state.learning, lesson.id);
  const missingDiag = resolution.requiresDiagnosticIds.filter(
    (reqId) => !executed.includes(reqId)
  );

  if (missingDiag.length > 0 && !state.debugMode) {
    const missingLabels = lesson.lab.diagnosticActions
      .filter((d) => missingDiag.includes(d.id))
      .map((d) => d.label);
    const msg = `Run diagnostic evidence first before executing analytical fix: ${missingLabels.join(' & ')}`;
    return {
      ...state,
      lastFeedbackBanner: msg,
    };
  }

  // If analytical (optimal), unlock capabilities, tools, concepts, and mark lesson completed
  if (resolution.approach === 'analytical') {
    const wasAlreadyCompleted = state.learning.completedLessonIds.includes(
      lesson.id
    );
    const nextCompleted = wasAlreadyCompleted
      ? state.learning.completedLessonIds
      : [...state.learning.completedLessonIds, lesson.id];

    const nextCapabilities = Array.from(
      new Set([
        ...state.learning.unlockedCapabilities,
        ...lesson.unlocks.capabilities,
      ])
    ) as UnlockedCapabilityId[];

    const nextTools = Array.from(
      new Set([...state.learning.unlockedTools, ...lesson.unlocks.tools])
    );

    const nextConcepts = Array.from(
      new Set([
        ...state.learning.masteredConcepts,
        ...lesson.concepts.map((c) => c.id),
      ])
    );

    const suspicionDelta = wasAlreadyCompleted ? 0 : resolution.suspicionDelta;
    const exposureDelta = wasAlreadyCompleted ? 0 : resolution.exposureDelta;
    const trustDelta = wasAlreadyCompleted ? 0 : resolution.trustNadiaDelta;

    const nextSuspicion = clampMetric(
      state.flags.corporate_suspicion + suspicionDelta
    );
    const nextExposure = clampMetric(
      state.flags.player_exposure + exposureDelta
    );
    const nextTrust = clampMetric(state.flags.trust_nadia + trustDelta);

    return {
      ...state,
      flags: {
        ...state.flags,
        corporate_suspicion: nextSuspicion,
        player_exposure: nextExposure,
        trust_nadia: nextTrust,
      },
      learning: {
        ...state.learning,
        completedLessonIds: nextCompleted,
        unlockedCapabilities: nextCapabilities,
        unlockedTools: nextTools,
        masteredConcepts: nextConcepts,
        labResolutionByLesson: {
          ...state.learning.labResolutionByLesson,
          [lesson.id]: 'analytical',
        },
      },
      terminalHistory: [
        ...state.terminalHistory,
        makeTermLine(
          `eli@greyos:[netlab]$ ${resolution.commandPreview}`,
          'command'
        ),
        makeTermLine(
          `[LAB VERIFIED — ${lesson.code}] ${resolution.outcomeSummary}\n[CAPABILITY UNLOCKED] ${lesson.unlocks.badgeLabel} (${lesson.unlocks.tools.join(', ')})`,
          'highlight'
        ),
      ],
      monologueBanner: `${lesson.code} Mastered: ${resolution.outcomeSummary}`,
      lastFeedbackBanner: `Unlocked Capability: ${lesson.unlocks.badgeLabel} — Ready for Field Application`,
    };
  }

  // Brute-force / reckless approach inside lab: records penalty on first reckless attempt and explains why it failed
  const bruteEventKey = `event:lab_bruteforce:${lesson.id}`;
  const isFirstBrute = !state.completedEvents.includes(bruteEventKey);

  const nextSuspicion = isFirstBrute
    ? clampMetric(state.flags.corporate_suspicion + resolution.suspicionDelta)
    : state.flags.corporate_suspicion;
  const nextExposure = isFirstBrute
    ? clampMetric(state.flags.player_exposure + resolution.exposureDelta)
    : state.flags.player_exposure;
  const nextTrust = isFirstBrute
    ? clampMetric(state.flags.trust_nadia + resolution.trustNadiaDelta)
    : state.flags.trust_nadia;

  return {
    ...state,
    completedEvents: isFirstBrute
      ? [...state.completedEvents, bruteEventKey]
      : state.completedEvents,
    flags: {
      ...state.flags,
      corporate_suspicion: nextSuspicion,
      player_exposure: nextExposure,
      trust_nadia: nextTrust,
    },
    learning: {
      ...state.learning,
      labResolutionByLesson: {
        ...state.learning.labResolutionByLesson,
        [lesson.id]:
          state.learning.labResolutionByLesson[lesson.id] === 'analytical'
            ? 'analytical'
            : 'brute_force',
      },
    },
    terminalHistory: [
      ...state.terminalHistory,
      makeTermLine(
        `eli@greyos:[netlab]$ ${resolution.commandPreview}`,
        'command'
      ),
      makeTermLine(
        `[OPSEC FAILURE — ${lesson.code}] ${resolution.outcomeSummary}`,
        'error'
      ),
    ],
    monologueBanner: resolution.outcomeSummary,
    lastFeedbackBanner: `Reckless Action Penalty: ${resolution.outcomeSummary}`,
  };
}

export function applyLessonCapabilityToStory(
  state: DeadAirState,
  lessonId: string,
  mode: 'analytical' | 'brute_force' = 'analytical'
): DeadAirState {
  const lesson = getLessonById(lessonId);
  if (!lesson) return state;

  const app = lesson.lab.storyApplication;

  if (mode === 'analytical') {
    const hasRequiredCapability = lesson.unlocks.capabilities.every((cap) =>
      hasUnlockedCapability(state.learning, cap)
    );
    if (!hasRequiredCapability && !state.debugMode) {
      const msg = `Capability Locked: Complete ${lesson.code} (${lesson.title}) in the Network Lab to unlock ${lesson.unlocks.badgeLabel} before applying it to the investigation.`;
      return {
        ...state,
        lastFeedbackBanner: msg,
      };
    }

    if (state.learning.appliedStoryLessons.includes(lesson.id)) {
      const msg = `${lesson.unlocks.badgeLabel} has already been applied to your active investigation.`;
      return {
        ...state,
        lastFeedbackBanner: msg,
      };
    }

    const nextSuspicion = clampMetric(
      state.flags.corporate_suspicion + app.analyticalSuspicionDelta
    );
    const nextExposure = clampMetric(
      state.flags.player_exposure + app.analyticalExposureDelta
    );
    const nextTrust = clampMetric(
      state.flags.trust_nadia + app.analyticalTrustDelta
    );

    const completedEventTag = `event:capability_applied:${lesson.id}`;

    return {
      ...state,
      completedEvents: state.completedEvents.includes(completedEventTag)
        ? state.completedEvents
        : [...state.completedEvents, completedEventTag],
      flags: {
        ...state.flags,
        corporate_suspicion: nextSuspicion,
        player_exposure: nextExposure,
        trust_nadia: nextTrust,
      },
      learning: {
        ...state.learning,
        appliedStoryLessons: [
          ...state.learning.appliedStoryLessons,
          lesson.id,
        ],
      },
      terminalHistory: [
        ...state.terminalHistory,
        makeTermLine(
          `eli@greyos:${state.currentDir}$ ${app.analyticalCommand}`,
          'command'
        ),
        makeTermLine(
          `[FIELD CAPABILITY APPLIED — ${lesson.unlocks.badgeLabel}]\n${app.analyticalOutcome}`,
          'highlight'
        ),
      ],
      monologueBanner: app.analyticalOutcome,
      lastFeedbackBanner: `Applied ${lesson.unlocks.badgeLabel}: ${app.analyticalOutcome}`,
    };
  }

  // Brute-force / unverified story action path:
  if (state.learning.bruteForceStoryLessons.includes(lesson.id)) {
    const msg = `Unverified operation for ${lesson.code} was already attempted; telemetry penalty already logged.`;
    return {
      ...state,
      lastFeedbackBanner: msg,
    };
  }

  const nextSuspicion = clampMetric(
    state.flags.corporate_suspicion + app.bruteForceSuspicionDelta
  );
  const nextExposure = clampMetric(
    state.flags.player_exposure + app.bruteForceExposureDelta
  );

  const bruteTag = `event:story_bruteforce:${lesson.id}`;

  return {
    ...state,
    completedEvents: state.completedEvents.includes(bruteTag)
      ? state.completedEvents
      : [...state.completedEvents, bruteTag],
    flags: {
      ...state.flags,
      corporate_suspicion: nextSuspicion,
      player_exposure: nextExposure,
    },
    learning: {
      ...state.learning,
      bruteForceStoryLessons: [
        ...state.learning.bruteForceStoryLessons,
        lesson.id,
      ],
    },
    terminalHistory: [
      ...state.terminalHistory,
      makeTermLine(
        `eli@greyos:${state.currentDir}$ ${app.bruteForceCommand}`,
        'command'
      ),
      makeTermLine(
        `[UNVERIFIED OPERATION WARNING — ${lesson.code}]\n${app.bruteForceOutcome}`,
        'error'
      ),
    ],
    monologueBanner: app.bruteForceOutcome,
    lastFeedbackBanner: `Unverified Action Penalty: ${app.bruteForceOutcome}`,
  };
}

export function applyCapabilityByCommandName(
  state: DeadAirState,
  cliToolName: string
): DeadAirState | null {
  const normalized = cliToolName.trim().toLowerCase();
  const capEntry = Object.values(CAPABILITY_DESCRIPTORS).find(
    (c) => c.cliCommand.toLowerCase() === normalized
  );
  if (!capEntry) return null;
  return applyLessonCapabilityToStory(
    state,
    capEntry.unlockedByLessonId,
    'analytical'
  );
}
