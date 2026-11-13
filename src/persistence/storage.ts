import {
  DeadAirState,
  HostPrivilegeLevel,
  SceneId,
  TerminalOutputLine,
  VirtualFileEntry,
} from '../game/types';
import {
  CURRENT_SAVE_VERSION,
  createInitialDeadAirState,
} from '../data/storyData';
import { migrateLearningState } from '../learning/learningProgress';
import {
  KnowledgeCategoryId,
  SourceTrackFilter,
  UnlockedCapabilityId,
} from '../learning/lessonTypes';

export const STORAGE_KEY_V3 = 'dead_air_save_v3';
export const CORRUPTED_STORAGE_KEY_V3_BACKUP =
  'dead_air_save_v3_corrupted_backup';
export const LEGACY_STORAGE_KEY_V2 = 'dead_air_save_v2';
export const LEGACY_STORAGE_KEY_V1 = 'dead_air_save_v1';

const VALID_SCENES: SceneId[] = [
  'APARTMENT_NIGHT',
  'STREET_NIGHT',
  'LAUNDROMAT',
  'APARTMENT_RETURN',
];

const VALID_PRIVILEGES: HostPrivilegeLevel[] = [
  'LOCKED',
  'GUEST',
  'USER',
  'OPERATOR',
  'ADMIN',
  'ROOT',
];

const VALID_TERMINAL_TONES: TerminalOutputLine['tone'][] = [
  'command',
  'output',
  'highlight',
  'error',
  'system',
];

const VALID_SOURCE_TRACKS: SourceTrackFilter[] = [
  'all',
  'network_internet',
  'tactical_security',
];

const VALID_CATEGORIES: (KnowledgeCategoryId | 'all')[] = [
  'all',
  'networking',
  'identity_trust',
  'routing_tunnels',
  'distributed_web',
  'investigation',
  'privacy_opsec',
  'host_forensics',
  'network_attribution',
  'counter_deception',
  'crypto_forensics',
  'container_appsec',
];

const VALID_CAPABILITIES: UnlockedCapabilityId[] = [
  'packet_inspector',
  'resolver_inspector',
  'certificate_analyzer',
  'proxy_route_editor',
  'tunnel_monitor',
  'topology_mapper',
  'archive_verifier',
  'archive_search',
  'persistence_auditor',
  'tls_fingerprint_inspector',
  'canary_inspector',
  'hsm_verifier',
  'binary_container_analyzer',
];

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return Boolean(val) && typeof val === 'object' && !Array.isArray(val);
}

function isNonEmptyString(val: unknown): val is string {
  return typeof val === 'string' && val.trim().length > 0;
}

function isValidEvidenceEntry(entry: unknown, strictV3 = false): boolean {
  if (!isPlainObject(entry)) return false;
  if (!isNonEmptyString(entry.id)) return false;
  if (typeof entry.discovered !== 'boolean') return false;
  if (entry.correlated === undefined) {
    if (strictV3) return false;
  } else if (typeof entry.correlated !== 'boolean') {
    return false;
  }
  if (strictV3) {
    if (
      !isNonEmptyString(entry.title) ||
      typeof entry.chronologicalOrder !== 'number' ||
      !Number.isFinite(entry.chronologicalOrder) ||
      !isNonEmptyString(entry.source)
    ) {
      return false;
    }
  }
  return true;
}

function isValidFileEntry(
  entry: unknown,
  strictV3 = false
): entry is VirtualFileEntry {
  if (!isPlainObject(entry)) return false;
  if (!isNonEmptyString(entry.path) || !entry.path.trim().startsWith('/')) {
    return false;
  }
  if (typeof entry.unlocked !== 'boolean') return false;
  if (strictV3) {
    if (
      !isNonEmptyString(entry.name) ||
      !isNonEmptyString(entry.parentDir) ||
      !entry.parentDir.trim().startsWith('/') ||
      typeof entry.content !== 'string'
    ) {
      return false;
    }
  } else {
    if (entry.name !== undefined && !isNonEmptyString(entry.name)) return false;
    if (
      entry.parentDir !== undefined &&
      (!isNonEmptyString(entry.parentDir) ||
        !entry.parentDir.trim().startsWith('/'))
    ) {
      return false;
    }
    if (entry.content !== undefined && typeof entry.content !== 'string') {
      return false;
    }
  }
  return true;
}

function isValidCharacterEntry(entry: unknown, strictV3 = false): boolean {
  if (!isPlainObject(entry)) return false;
  if (!isNonEmptyString(entry.id)) return false;
  if (typeof entry.trust !== 'number' || !Number.isFinite(entry.trust)) {
    return false;
  }
  if (!isNonEmptyString(entry.currentNodeId)) return false;
  if (strictV3) {
    if (
      !isNonEmptyString(entry.name) ||
      !Array.isArray(entry.nodes) ||
      entry.nodes.length === 0
    ) {
      return false;
    }
  }
  return true;
}

function isValidInventoryEntry(entry: unknown, strictV3 = false): boolean {
  if (!isPlainObject(entry)) return false;
  if (!isNonEmptyString(entry.id)) return false;
  if (typeof entry.acquired !== 'boolean') return false;
  if (strictV3 && !isNonEmptyString(entry.name)) return false;
  return true;
}

function isValidNetworkHostEntry(entry: unknown, strictV3 = false): boolean {
  if (!isPlainObject(entry)) return false;
  if (!isNonEmptyString(entry.ip)) return false;
  if (
    typeof entry.discovered !== 'boolean' ||
    typeof entry.scanned !== 'boolean' ||
    typeof entry.privilege !== 'string' ||
    !VALID_PRIVILEGES.includes(entry.privilege as HostPrivilegeLevel) ||
    typeof entry.compromised !== 'boolean' ||
    typeof entry.actionCompleted !== 'boolean'
  ) {
    return false;
  }
  if (strictV3) {
    if (!isNonEmptyString(entry.hostname) || !Array.isArray(entry.services)) {
      return false;
    }
  }
  return true;
}

function isValidCompletedEvents(arr: unknown): boolean {
  return Array.isArray(arr) && arr.every((ev) => isNonEmptyString(ev));
}

function isValidInspectedFiles(arr: unknown): boolean {
  return (
    Array.isArray(arr) &&
    arr.every((fp) => isNonEmptyString(fp) && fp.trim().startsWith('/'))
  );
}

function isValidTerminalHistoryEntry(entry: unknown): boolean {
  if (!isPlainObject(entry)) return false;
  return (
    isNonEmptyString(entry.id) &&
    typeof entry.text === 'string' &&
    typeof entry.tone === 'string' &&
    VALID_TERMINAL_TONES.includes(entry.tone as TerminalOutputLine['tone'])
  );
}

function isValidHotspotEntry(entry: unknown, strictV3 = false): boolean {
  if (!isPlainObject(entry)) return false;
  if (!isNonEmptyString(entry.id) || typeof entry.inspected !== 'boolean') {
    return false;
  }
  if (strictV3) {
    if (
      !isNonEmptyString(entry.label) ||
      typeof entry.x !== 'number' ||
      !Number.isFinite(entry.x) ||
      typeof entry.y !== 'number' ||
      !Number.isFinite(entry.y)
    ) {
      return false;
    }
  }
  return true;
}

function isValidHotspotsMap(hotspots: unknown, strictV3 = false): boolean {
  if (!isPlainObject(hotspots)) return false;
  if (strictV3) {
    for (const sceneId of VALID_SCENES) {
      const list = hotspots[sceneId];
      if (
        !Array.isArray(list) ||
        list.length === 0 ||
        !list.every((h) => isValidHotspotEntry(h, true))
      ) {
        return false;
      }
    }
    return true;
  }

  for (const [sceneKey, list] of Object.entries(hotspots)) {
    if (
      !VALID_SCENES.includes(sceneKey as SceneId) ||
      !Array.isArray(list) ||
      !list.every((h) => isValidHotspotEntry(h, false))
    ) {
      return false;
    }
  }
  return true;
}

function isValidLearningObject(learning: unknown, strictV3 = false): boolean {
  if (!isPlainObject(learning)) return false;

  const checkStringArray = (val: unknown, required: boolean): boolean => {
    if (val === undefined) return !required;
    return Array.isArray(val) && val.every((item) => isNonEmptyString(item));
  };

  if (
    !checkStringArray(learning.completedLessonIds, strictV3) ||
    !checkStringArray(learning.unlockedTools, strictV3) ||
    !checkStringArray(learning.masteredConcepts, strictV3) ||
    !checkStringArray(learning.appliedStoryLessons, strictV3) ||
    !checkStringArray(learning.bruteForceStoryLessons, strictV3)
  ) {
    return false;
  }

  if (learning.unlockedCapabilities === undefined) {
    if (strictV3) return false;
  } else if (
    !Array.isArray(learning.unlockedCapabilities) ||
    !learning.unlockedCapabilities.every(
      (cap) =>
        typeof cap === 'string' &&
        VALID_CAPABILITIES.includes(cap as UnlockedCapabilityId)
    )
  ) {
    return false;
  }

  if (learning.executedDiagnosticsByLesson === undefined) {
    if (strictV3) return false;
  } else if (
    !isPlainObject(learning.executedDiagnosticsByLesson) ||
    !Object.entries(learning.executedDiagnosticsByLesson).every(
      ([k, v]) =>
        isNonEmptyString(k) &&
        Array.isArray(v) &&
        v.every((d) => isNonEmptyString(d))
    )
  ) {
    return false;
  }

  if (learning.labResolutionByLesson === undefined) {
    if (strictV3) return false;
  } else if (
    !isPlainObject(learning.labResolutionByLesson) ||
    !Object.entries(learning.labResolutionByLesson).every(
      ([k, v]) =>
        isNonEmptyString(k) && (v === 'analytical' || v === 'brute_force')
    )
  ) {
    return false;
  }

  if (strictV3) {
    if (
      typeof learning.activeSourceTrack !== 'string' ||
      !VALID_SOURCE_TRACKS.includes(
        learning.activeSourceTrack as SourceTrackFilter
      ) ||
      typeof learning.activeCategoryFilter !== 'string' ||
      !VALID_CATEGORIES.includes(
        learning.activeCategoryFilter as KnowledgeCategoryId | 'all'
      ) ||
      !isNonEmptyString(learning.selectedLessonId) ||
      (learning.activeLabLessonId !== null &&
        !isNonEmptyString(learning.activeLabLessonId))
    ) {
      return false;
    }
  }

  return true;
}

export type ValidLegacySaveCandidate = Partial<DeadAirState> & {
  flags: Partial<DeadAirState['flags']>;
  evidence: DeadAirState['evidence'];
  files: DeadAirState['files'];
  characters: DeadAirState['characters'];
};

export function isValidLegacySaveShape(
  raw: unknown
): raw is ValidLegacySaveCandidate {
  if (!isPlainObject(raw)) {
    return false;
  }
  const c = raw as Partial<DeadAirState>;
  if (
    !isPlainObject(c.flags) ||
    typeof c.flags.trust_nadia !== 'number' ||
    !Number.isFinite(c.flags.trust_nadia) ||
    typeof c.flags.corporate_suspicion !== 'number' ||
    !Number.isFinite(c.flags.corporate_suspicion) ||
    typeof c.flags.player_exposure !== 'number' ||
    !Number.isFinite(c.flags.player_exposure)
  ) {
    return false;
  }
  if (
    !Array.isArray(c.evidence) ||
    !c.evidence.every((e) => isValidEvidenceEntry(e, false)) ||
    !Array.isArray(c.files) ||
    !c.files.every((f) => isValidFileEntry(f, false)) ||
    !Array.isArray(c.characters) ||
    !c.characters.every((ch) => isValidCharacterEntry(ch, false))
  ) {
    return false;
  }
  if (
    typeof c.currentScene !== 'string' ||
    !VALID_SCENES.includes(c.currentScene as SceneId)
  ) {
    return false;
  }
  if (
    c.inventory !== undefined &&
    (!Array.isArray(c.inventory) ||
      !c.inventory.every((i) => isValidInventoryEntry(i, false)))
  ) {
    return false;
  }
  if (
    c.networkHosts !== undefined &&
    (!Array.isArray(c.networkHosts) ||
      !c.networkHosts.every((h) => isValidNetworkHostEntry(h, false)))
  ) {
    return false;
  }
  if (
    c.completedEvents !== undefined &&
    !isValidCompletedEvents(c.completedEvents)
  ) {
    return false;
  }
  if (
    c.inspectedFiles !== undefined &&
    !isValidInspectedFiles(c.inspectedFiles)
  ) {
    return false;
  }
  if (
    c.terminalHistory !== undefined &&
    (!Array.isArray(c.terminalHistory) ||
      !c.terminalHistory.every(isValidTerminalHistoryEntry))
  ) {
    return false;
  }
  if (c.hotspots !== undefined && !isValidHotspotsMap(c.hotspots, false)) {
    return false;
  }
  if (c.learning !== undefined && !isValidLearningObject(c.learning, false)) {
    return false;
  }
  return true;
}

export function isValidV3SaveShape(raw: unknown): raw is DeadAirState {
  if (!isValidLegacySaveShape(raw)) {
    return false;
  }
  const c = raw as Partial<DeadAirState>;
  if (c.saveVersion !== CURRENT_SAVE_VERSION) {
    return false;
  }
  if (
    !Array.isArray(c.unlockedScenes) ||
    c.unlockedScenes.length === 0 ||
    !c.unlockedScenes.every((s) => VALID_SCENES.includes(s as SceneId)) ||
    !Array.isArray(c.evidence) ||
    c.evidence.length === 0 ||
    !c.evidence.every((e) => isValidEvidenceEntry(e, true)) ||
    !Array.isArray(c.files) ||
    c.files.length === 0 ||
    !c.files.every((f) => isValidFileEntry(f, true)) ||
    !Array.isArray(c.characters) ||
    c.characters.length === 0 ||
    !c.characters.every((ch) => isValidCharacterEntry(ch, true)) ||
    !Array.isArray(c.inventory) ||
    c.inventory.length === 0 ||
    !c.inventory.every((i) => isValidInventoryEntry(i, true)) ||
    !Array.isArray(c.networkHosts) ||
    c.networkHosts.length === 0 ||
    !c.networkHosts.every((h) => isValidNetworkHostEntry(h, true)) ||
    !isValidCompletedEvents(c.completedEvents) ||
    !isValidInspectedFiles(c.inspectedFiles) ||
    !Array.isArray(c.terminalHistory) ||
    !c.terminalHistory.every(isValidTerminalHistoryEntry) ||
    !isNonEmptyString(c.currentDir) ||
    !c.currentDir.trim().startsWith('/')
  ) {
    return false;
  }
  if (!isValidHotspotsMap(c.hotspots, true)) {
    return false;
  }
  if (!isValidLearningObject(c.learning, true)) {
    return false;
  }
  const f = c.flags!;
  if (
    typeof f.persistence_audit_completed !== 'boolean' ||
    typeof f.metadata_protection_completed !== 'boolean' ||
    typeof f.tls_attribution_verified !== 'boolean' ||
    typeof f.canary_identified !== 'boolean' ||
    typeof f.hsm_signature_verified !== 'boolean' ||
    typeof f.lantern_binary_analyzed !== 'boolean'
  ) {
    return false;
  }
  return true;
}

export function migrateDeadAirSave(
  rawParsed: unknown,
  autostart = false
): DeadAirState {
  const base = createInitialDeadAirState(autostart ? 'playing' : 'title');
  if (!isValidLegacySaveShape(rawParsed)) {
    return base;
  }

  const candidate = rawParsed;
  const validScenes = VALID_SCENES;
  const currentScene: SceneId = validScenes.includes(
    candidate.currentScene as SceneId
  )
    ? (candidate.currentScene as SceneId)
    : 'APARTMENT_NIGHT';

  // Merge evidence discovery state by ID (strictly the 6 core Chapter 1 artifacts EV-01..EV-06)
  const migratedEvidence = base.evidence.map((baseEv) => {
    const savedEv = candidate.evidence?.find((e) => e.id === baseEv.id);
    if (!savedEv) return baseEv;
    return {
      ...baseEv,
      discovered: Boolean(savedEv.discovered),
      correlated: Boolean(savedEv.correlated),
    };
  });

  const discoveredCount = migratedEvidence.filter((e) => e.discovered).length;
  const firstChoice = candidate.flags.first_choice || null;
  const firstChoiceLocked =
    typeof candidate.flags.first_choice_locked === 'boolean'
      ? candidate.flags.first_choice_locked
      : firstChoice !== null;

  const unlockedScenes: SceneId[] = Array.isArray(candidate.unlockedScenes)
    ? (Array.from(
        new Set(
          candidate.unlockedScenes.filter((s) => validScenes.includes(s))
        )
      ) as SceneId[])
    : ['APARTMENT_NIGHT'];
  if (!unlockedScenes.includes(currentScene)) {
    unlockedScenes.push(currentScene);
  }

  const completedEvents = Array.isArray(candidate.completedEvents)
    ? Array.from(new Set(candidate.completedEvents.filter(isNonEmptyString)))
    : [];
  if (
    firstChoiceLocked &&
    !completedEvents.includes('event:first_phone_choice')
  ) {
    completedEvents.push('event:first_phone_choice');
  }

  const inspectedFiles = Array.isArray(candidate.inspectedFiles)
    ? Array.from(
        new Set(
          candidate.inspectedFiles.filter(
            (fp) => isNonEmptyString(fp) && fp.trim().startsWith('/')
          )
        )
      )
    : [];

  // Merge inventory acquired state
  const migratedInventory = base.inventory.map((baseItem) => {
    const savedItem = candidate.inventory?.find((i) => i.id === baseItem.id);
    return savedItem
      ? { ...baseItem, acquired: Boolean(savedItem.acquired) }
      : baseItem;
  });

  const hasMothKey = Boolean(
    migratedInventory.find((i) => i.id === 'item_moth_usb')?.acquired
  );

  // Merge files unlock state + preserve dynamically generated files (e.g. incident_0427_brief.clean.pdf)
  const migratedFiles = base.files.map((baseFile) => {
    const savedFile = candidate.files?.find((f) => f.path === baseFile.path);
    if (baseFile.path === '/home/eli/archive_vault/lantern_auth_audit.db') {
      return {
        ...baseFile,
        unlocked: Boolean(
          savedFile?.unlocked ||
            (hasMothKey && currentScene === 'APARTMENT_RETURN')
        ),
      };
    }
    return savedFile
      ? { ...baseFile, unlocked: Boolean(savedFile.unlocked) }
      : baseFile;
  });

  if (Array.isArray(candidate.files)) {
    for (const extraFile of candidate.files) {
      if (
        isValidFileEntry(extraFile, true) &&
        !migratedFiles.some((f) => f.path === extraFile.path)
      ) {
        migratedFiles.push({ ...extraFile });
      }
    }
  }

  const trustNadia =
    typeof candidate.flags.trust_nadia === 'number'
      ? Math.min(100, Math.max(0, candidate.flags.trust_nadia))
      : base.flags.trust_nadia;

  const migratedCharacters = base.characters.map((baseChar) => {
    const savedChar = candidate.characters?.find((c) => c.id === baseChar.id);
    if (!savedChar) return baseChar;
    return {
      ...baseChar,
      trust:
        baseChar.id === 'nadia'
          ? trustNadia
          : typeof savedChar.trust === 'number'
          ? savedChar.trust
          : baseChar.trust,
      currentNodeId: savedChar.currentNodeId || baseChar.currentNodeId,
    };
  });

  // Merge hotspots inspection state per scene
  const migratedHotspots: DeadAirState['hotspots'] = {
    APARTMENT_NIGHT: base.hotspots.APARTMENT_NIGHT.map((baseHs) => {
      const savedHs = candidate.hotspots?.APARTMENT_NIGHT?.find(
        (h) => h.id === baseHs.id
      );
      return savedHs
        ? { ...baseHs, inspected: Boolean(savedHs.inspected) }
        : baseHs;
    }),
    STREET_NIGHT: base.hotspots.STREET_NIGHT.map((baseHs) => {
      const savedHs = candidate.hotspots?.STREET_NIGHT?.find(
        (h) => h.id === baseHs.id
      );
      return savedHs
        ? { ...baseHs, inspected: Boolean(savedHs.inspected) }
        : baseHs;
    }),
    LAUNDROMAT: base.hotspots.LAUNDROMAT.map((baseHs) => {
      const savedHs = candidate.hotspots?.LAUNDROMAT?.find(
        (h) => h.id === baseHs.id
      );
      return savedHs
        ? { ...baseHs, inspected: Boolean(savedHs.inspected) }
        : baseHs;
    }),
    APARTMENT_RETURN: base.hotspots.APARTMENT_RETURN.map((baseHs) => {
      const savedHs = candidate.hotspots?.APARTMENT_RETURN?.find(
        (h) => h.id === baseHs.id
      );
      return savedHs
        ? { ...baseHs, inspected: Boolean(savedHs.inspected) }
        : baseHs;
    }),
  };

  const resolvedDialogueNodes: Record<string, string> =
    candidate.resolvedDialogueNodes &&
    typeof candidate.resolvedDialogueNodes === 'object'
      ? { ...candidate.resolvedDialogueNodes }
      : {};

  // Merge virtual network hosts state
  const migratedNetworkHosts = base.networkHosts.map((baseHost) => {
    const savedHost = candidate.networkHosts?.find((h) => h.ip === baseHost.ip);
    if (!savedHost) return baseHost;
    return {
      ...baseHost,
      discovered: Boolean(savedHost.discovered || baseHost.discovered),
      scanned: Boolean(savedHost.scanned),
      privilege: savedHost.privilege || baseHost.privilege,
      compromised: Boolean(savedHost.compromised),
      actionCompleted: Boolean(savedHost.actionCompleted),
    };
  });

  const compromisedHostsCount = migratedNetworkHosts.filter(
    (h) => h.compromised && h.ip !== '10.0.2.15'
  ).length;
  const cameraScrubbed = Boolean(candidate.flags.camera_scrubbed);

  const migratedCurrentDir =
    typeof candidate.currentDir === 'string' &&
    candidate.currentDir.trim().startsWith('/')
      ? candidate.currentDir
      : base.currentDir;

  const migratedTerminalHistory =
    Array.isArray(candidate.terminalHistory) &&
    candidate.terminalHistory.length > 0 &&
    candidate.terminalHistory.every(isValidTerminalHistoryEntry)
      ? candidate.terminalHistory.map((line) => ({ ...line }))
      : base.terminalHistory;

  return {
    ...base,
    saveVersion: CURRENT_SAVE_VERSION,
    shellState: autostart
      ? 'playing'
      : candidate.shellState === 'gameover'
      ? 'gameover'
      : 'title',
    currentScene,
    unlockedScenes,
    activeOverlay: 'NONE',
    activeComputerApp: candidate.activeComputerApp || 'FILES',
    selectedNetworkHostIp:
      candidate.selectedNetworkHostIp || base.selectedNetworkHostIp,
    clockTime: candidate.clockTime || base.clockTime,
    monologueBanner: candidate.monologueBanner || base.monologueBanner,
    lastFeedbackBanner: null,
    soundEnabled:
      typeof candidate.soundEnabled === 'boolean'
        ? candidate.soundEnabled
        : true,
    debugMode: false,
    completedEvents,
    resolvedDialogueNodes,
    inspectedFiles,
    endingId: candidate.endingId || null,
    flags: {
      ...base.flags,
      ...candidate.flags,
      first_choice: firstChoice,
      first_choice_locked: firstChoiceLocked,
      trust_nadia: trustNadia,
      evidence_count: discoveredCount,
      rhea_allied: Boolean(candidate.flags.rhea_allied),
      soc_warning_triggered: Boolean(
        candidate.flags.soc_warning_triggered ||
          (candidate.flags.corporate_suspicion ?? 0) >= 25
      ),
      camera_tracking_risk: cameraScrubbed
        ? false
        : Boolean(
            candidate.flags.camera_tracking_risk ||
              (candidate.flags.player_exposure ?? 0) >= 20
          ),
      camera_tracked: cameraScrubbed
        ? false
        : Boolean(candidate.flags.camera_tracked),
      relay_tunnel_active: Boolean(candidate.flags.relay_tunnel_active),
      camera_scrubbed: cameraScrubbed,
      counter_proof_secured: Boolean(candidate.flags.counter_proof_secured),
      compromised_hosts_count: compromisedHostsCount,
      persistence_audit_completed: Boolean(
        candidate.flags.persistence_audit_completed
      ),
      metadata_protection_completed: Boolean(
        candidate.flags.metadata_protection_completed
      ),
      tls_attribution_verified: Boolean(
        candidate.flags.tls_attribution_verified
      ),
      canary_identified: Boolean(candidate.flags.canary_identified),
      hsm_signature_verified: Boolean(candidate.flags.hsm_signature_verified),
      lantern_binary_analyzed: Boolean(
        candidate.flags.lantern_binary_analyzed
      ),
    },
    hotspots: migratedHotspots,
    evidence: migratedEvidence,
    files: migratedFiles,
    networkHosts: migratedNetworkHosts,
    inventory: migratedInventory,
    characters: migratedCharacters,
    phoneMessages: Array.isArray(candidate.phoneMessages)
      ? candidate.phoneMessages
      : base.phoneMessages,
    currentDir: migratedCurrentDir,
    terminalHistory: migratedTerminalHistory,
    learning: migrateLearningState(candidate.learning),
  };
}

export function loadDeadAirState(): DeadAirState {
  if (typeof window === 'undefined') {
    return createInitialDeadAirState('title');
  }
  const params = new URLSearchParams(window.location.search);
  const autostart = params.get('autostart') === '1';

  let malformedRawV3: string | null = null;

  // 1. Try V3 primary storage key (requires full valid V3 shape including element-level validation)
  try {
    const rawV3 = window.localStorage.getItem(STORAGE_KEY_V3);
    if (rawV3 !== null) {
      const parsedV3 = JSON.parse(rawV3);
      if (isValidV3SaveShape(parsedV3)) {
        return migrateDeadAirSave(parsedV3, autostart);
      }
      malformedRawV3 = rawV3;
    }
  } catch {
    // Corrupted V3 JSON: record raw string and fall through to V2/V1
    try {
      malformedRawV3 = window.localStorage.getItem(STORAGE_KEY_V3);
    } catch {
      malformedRawV3 = null;
    }
  }

  const preserveMalformedV3BeforeOverwrite = () => {
    if (malformedRawV3 !== null) {
      try {
        window.localStorage.setItem(
          CORRUPTED_STORAGE_KEY_V3_BACKUP,
          malformedRawV3
        );
      } catch {
        // Ignore storage quota errors
      }
    }
  };

  // 2. Try V2 legacy storage key -> migrate to V3 and write V3 only after successful migration
  try {
    const rawV2 = window.localStorage.getItem(LEGACY_STORAGE_KEY_V2);
    if (rawV2) {
      const parsedV2 = JSON.parse(rawV2);
      if (isValidLegacySaveShape(parsedV2)) {
        const migrated = migrateDeadAirSave(parsedV2, autostart);
        if (isValidV3SaveShape(migrated)) {
          preserveMalformedV3BeforeOverwrite();
          saveDeadAirState(migrated);
          return migrated;
        }
      }
    }
  } catch {
    // Corrupted or incomplete V2 JSON: preserve it and fall through to V1
  }

  // 3. Try V1 legacy storage key -> migrate to V3 and write V3 only after successful migration
  try {
    const rawV1 = window.localStorage.getItem(LEGACY_STORAGE_KEY_V1);
    if (rawV1) {
      const parsedV1 = JSON.parse(rawV1);
      if (isValidLegacySaveShape(parsedV1)) {
        const migrated = migrateDeadAirSave(parsedV1, autostart);
        if (isValidV3SaveShape(migrated)) {
          preserveMalformedV3BeforeOverwrite();
          saveDeadAirState(migrated);
          return migrated;
        }
      }
    }
  } catch {
    // Corrupted or incomplete V1 JSON: fall back cleanly to initial state without clobbering existing keys
  }

  return createInitialDeadAirState(autostart ? 'playing' : 'title');
}

export function saveDeadAirState(state: DeadAirState): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: DeadAirState = {
      ...state,
      saveVersion: CURRENT_SAVE_VERSION,
    };
    window.localStorage.setItem(STORAGE_KEY_V3, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearDeadAirSave(): DeadAirState {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY_V3);
      window.localStorage.removeItem(CORRUPTED_STORAGE_KEY_V3_BACKUP);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY_V2);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY_V1);
    } catch {
      // ignore
    }
  }
  return createInitialDeadAirState('playing');
}

class SoundController {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  playTone(
    type:
      | 'click'
      | 'terminal'
      | 'evidence'
      | 'phone'
      | 'warning'
      | 'blackout',
    enabled = true
  ) {
    if (!enabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(340, now + 0.045);
        gain.gain.setValueAtTime(0.035, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.055);
      } else if (type === 'terminal') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(680, now);
        osc.frequency.setValueAtTime(840, now + 0.03);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'evidence') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554.37, now + 0.09);
        osc.frequency.setValueAtTime(659.25, now + 0.18);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
        osc.start(now);
        osc.stop(now + 0.38);
      } else if (type === 'phone') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.setValueAtTime(190, now + 0.08);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'warning') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(140, now + 0.25);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'blackout') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, now);
        osc.frequency.exponentialRampToValueAtTime(42, now + 0.65);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.start(now);
        osc.stop(now + 0.72);
      }
    } catch {
      // Ignore audio errors in headless mode
    }
  }
}

export const soundFX = new SoundController();
