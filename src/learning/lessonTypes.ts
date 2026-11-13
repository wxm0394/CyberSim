export type SourceTrackId = 'network_internet' | 'tactical_security';

export type SourceTrackFilter = 'all' | 'network_internet' | 'tactical_security';

export type KnowledgeCategoryId =
  | 'networking'
  | 'identity_trust'
  | 'routing_tunnels'
  | 'distributed_web'
  | 'investigation'
  | 'privacy_opsec'
  | 'host_forensics'
  | 'network_attribution'
  | 'counter_deception'
  | 'crypto_forensics'
  | 'container_appsec';

export type UnlockedCapabilityId =
  | 'packet_inspector'
  | 'resolver_inspector'
  | 'certificate_analyzer'
  | 'proxy_route_editor'
  | 'tunnel_monitor'
  | 'topology_mapper'
  | 'archive_verifier'
  | 'archive_search'
  | 'persistence_auditor'
  | 'tls_fingerprint_inspector'
  | 'canary_inspector'
  | 'hsm_verifier'
  | 'binary_container_analyzer';

export type ContentReviewStatus = 'reviewed' | 'historical' | 'needs-review';

export type CurationClassification =
  | 'core_gameplay_lab'
  | 'historical_context_only'
  | 'excluded_unverified'
  | 'pending_review';

export interface SourceAttribution {
  repository: string;
  upstreamRepository?: string;
  fork?: string;
  projectPaths?: string[];
  sectionPath: string;
  sectionTitle: string;
  license?: string;
  adaptationNote: string;
  adaptationNoteZh: string;
}

export interface ConceptSection {
  id: string;
  title: string;
  titleZh: string;
  summary: string;
  summaryZh: string;
  keyTerms: string[];
  practicalRule: string;
  practicalRuleZh: string;
  diagramLines: string[];
}

export interface LabDiagnosticAction {
  id: string;
  label: string;
  labelZh: string;
  commandPreview: string;
  targetNode: string;
  telemetryOutput: string;
  telemetryOutputZh: string;
  revealsClue: string;
  revealsClueZh: string;
  isCriticalClue: boolean;
}

export interface LabResolutionOption {
  id: string;
  label: string;
  labelZh: string;
  commandPreview: string;
  approach: 'analytical' | 'brute_force';
  isOptimal: boolean;
  requiresDiagnosticIds: string[];
  outcomeSummary: string;
  outcomeSummaryZh: string;
  suspicionDelta: number;
  exposureDelta: number;
  trustNadiaDelta: number;
}

export interface LabDefinition {
  id: string;
  code: string;
  title: string;
  titleZh: string;
  objective: string;
  objectiveZh: string;
  environmentBanner: string;
  initialSymptom: string;
  initialSymptomZh: string;
  nodes: {
    id: string;
    label: string;
    address: string;
    role: string;
    roleZh: string;
    status: 'nominal' | 'suspect' | 'compromised' | 'isolated';
  }[];
  diagnosticActions: LabDiagnosticAction[];
  resolutions: LabResolutionOption[];
  storyApplication: {
    id: string;
    targetHostOrFile: string;
    actionLabel: string;
    actionLabelZh: string;
    analyticalCommand: string;
    bruteForceCommand: string;
    analyticalOutcome: string;
    analyticalOutcomeZh: string;
    bruteForceOutcome: string;
    bruteForceOutcomeZh: string;
    analyticalSuspicionDelta: number;
    analyticalExposureDelta: number;
    analyticalTrustDelta: number;
    bruteForceSuspicionDelta: number;
    bruteForceExposureDelta: number;
  };
}

export interface LearningLesson {
  id: string;
  levelNumber: number;
  code: string;
  title: string;
  titleZh: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  sourceTrack: SourceTrackId;
  category: KnowledgeCategoryId;
  prerequisites: string[];
  isMvpCoreLab: boolean;
  narrativeHook: string;
  narrativeHookZh: string;
  concepts: ConceptSection[];
  lab: LabDefinition;
  unlocks: {
    capabilities: UnlockedCapabilityId[];
    tools: string[];
    badgeLabel: string;
    badgeLabelZh: string;
  };
  source: SourceAttribution;
  reviewStatus: ContentReviewStatus;
}

export interface CapabilityDescriptor {
  id: UnlockedCapabilityId;
  name: string;
  nameZh: string;
  sourceTrack: SourceTrackId;
  category: KnowledgeCategoryId;
  unlockedByLessonId: string;
  cliCommand: string;
  description: string;
  descriptionZh: string;
  investigationEffect: string;
  investigationEffectZh: string;
}

export interface LearningProgressState {
  completedLessonIds: string[];
  unlockedCapabilities: UnlockedCapabilityId[];
  unlockedTools: string[];
  masteredConcepts: string[];
  executedDiagnosticsByLesson: Record<string, string[]>;
  labResolutionByLesson: Record<string, 'analytical' | 'brute_force'>;
  appliedStoryLessons: string[];
  bruteForceStoryLessons: string[];
  activeSourceTrack: SourceTrackFilter;
  activeCategoryFilter: KnowledgeCategoryId | 'all';
  selectedLessonId: string;
  activeLabLessonId: string | null;
}
