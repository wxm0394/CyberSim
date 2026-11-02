import { DeadAirState, SceneId } from '../game/types';
import {
  CURRENT_SAVE_VERSION,
  createInitialDeadAirState,
} from '../data/storyData';

const STORAGE_KEY_V2 = 'dead_air_save_v2';
const LEGACY_STORAGE_KEY_V1 = 'dead_air_save_v1';

export function migrateDeadAirSave(
  rawParsed: unknown,
  autostart = false
): DeadAirState {
  const base = createInitialDeadAirState(autostart ? 'playing' : 'title');
  if (!rawParsed || typeof rawParsed !== 'object') {
    return base;
  }

  const candidate = rawParsed as Partial<DeadAirState>;
  if (
    !candidate.flags ||
    typeof candidate.flags !== 'object' ||
    !Array.isArray(candidate.evidence) ||
    !Array.isArray(candidate.files) ||
    !Array.isArray(candidate.characters)
  ) {
    return base;
  }

  const validScenes: SceneId[] = [
    'APARTMENT_NIGHT',
    'STREET_NIGHT',
    'LAUNDROMAT',
    'APARTMENT_RETURN',
  ];
  const currentScene: SceneId = validScenes.includes(
    candidate.currentScene as SceneId
  )
    ? (candidate.currentScene as SceneId)
    : 'APARTMENT_NIGHT';

  // Merge evidence discovery state by ID
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
    ? (candidate.unlockedScenes.filter((s) =>
        validScenes.includes(s)
      ) as SceneId[])
    : ['APARTMENT_NIGHT'];
  if (!unlockedScenes.includes(currentScene)) {
    unlockedScenes.push(currentScene);
  }

  const completedEvents = Array.isArray(candidate.completedEvents)
    ? [...candidate.completedEvents]
    : [];
  if (firstChoiceLocked && !completedEvents.includes('event:first_phone_choice')) {
    completedEvents.push('event:first_phone_choice');
  }

  const inspectedFiles = Array.isArray(candidate.inspectedFiles)
    ? [...candidate.inspectedFiles]
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

  // Merge files unlock state
  const migratedFiles = base.files.map((baseFile) => {
    const savedFile = candidate.files?.find((f) => f.path === baseFile.path);
    if (baseFile.path === '/home/eli/archive_vault/lantern_auth_audit.db') {
      return {
        ...baseFile,
        unlocked: Boolean(savedFile?.unlocked || (hasMothKey && currentScene === 'APARTMENT_RETURN')),
      };
    }
    return savedFile
      ? { ...baseFile, unlocked: Boolean(savedFile.unlocked) }
      : baseFile;
  });

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
    clockTime: candidate.clockTime || base.clockTime,
    monologueBanner: candidate.monologueBanner || base.monologueBanner,
    lastFeedbackBanner: null,
    soundEnabled:
      typeof candidate.soundEnabled === 'boolean'
        ? candidate.soundEnabled
        : true,
    debugMode: false,
    completedEvents,
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
      camera_tracked: Boolean(
        candidate.flags.camera_tracked ||
          (candidate.flags.player_exposure ?? 0) >= 20
      ),
    },
    evidence: migratedEvidence,
    files: migratedFiles,
    inventory: migratedInventory,
    characters: migratedCharacters,
    phoneMessages: Array.isArray(candidate.phoneMessages)
      ? candidate.phoneMessages
      : base.phoneMessages,
  };
}

export function loadDeadAirState(): DeadAirState {
  if (typeof window === 'undefined') {
    return createInitialDeadAirState('title');
  }
  const params = new URLSearchParams(window.location.search);
  const autostart = params.get('autostart') === '1';

  try {
    const rawV2 = window.localStorage.getItem(STORAGE_KEY_V2);
    if (rawV2) {
      const parsed = JSON.parse(rawV2);
      return migrateDeadAirSave(parsed, autostart);
    }

    // Legacy v1 migration path
    const rawV1 = window.localStorage.getItem(LEGACY_STORAGE_KEY_V1);
    if (rawV1) {
      const parsedV1 = JSON.parse(rawV1);
      const migrated = migrateDeadAirSave(parsedV1, autostart);
      saveDeadAirState(migrated);
      return migrated;
    }
  } catch {
    // Corrupted JSON falls back cleanly
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
    window.localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors
  }
}

export function clearDeadAirSave(): DeadAirState {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(STORAGE_KEY_V2);
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
