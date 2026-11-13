import {
  ChapterEndingId,
  CharacterProfile,
  ComputerAppId,
  DeadAirState,
  EvidenceArtifact,
  FirstPhoneChoice,
  SceneId,
  SceneTransitionCheck,
  TerminalOutputLine,
  VirtualFileEntry,
} from './types';
import { applyCapabilityByCommandName } from '../learning/learningEngine';
import { ALL_LEARNING_LESSONS } from '../data/learningMissions';

function makeTermLine(
  text: string,
  tone: TerminalOutputLine['tone'] = 'output'
): TerminalOutputLine {
  return {
    id: `term-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    tone,
  };
}

function clampMetric(val: number): number {
  return Math.min(100, Math.max(0, Math.round(val)));
}

function unlockEvidenceById(
  evidenceList: EvidenceArtifact[],
  evidenceId: string
): { updated: EvidenceArtifact[]; newlyDiscovered: boolean } {
  let newlyDiscovered = false;
  const updated = evidenceList.map((ev) => {
    if (ev.id === evidenceId) {
      if (!ev.discovered) {
        newlyDiscovered = true;
      }
      return { ...ev, discovered: true };
    }
    return ev;
  });
  return { updated, newlyDiscovered };
}

function syncCharactersAndFlags(state: DeadAirState): DeadAirState {
  const discoveredCount = state.evidence.filter((e) => e.discovered).length;
  const nadiaTrust = clampMetric(state.flags.trust_nadia);
  const suspicion = clampMetric(state.flags.corporate_suspicion);
  const exposure = clampMetric(state.flags.player_exposure);

  const nadiaStance =
    nadiaTrust >= 65
      ? 'Allied Whistleblower (High Trust)'
      : nadiaTrust >= 50
      ? 'Guarded Whistleblower'
      : 'Defensive & Wary (Low Trust)';

  const updatedCharacters: CharacterProfile[] = state.characters.map((c) => {
    if (c.id === 'nadia') {
      return { ...c, trust: nadiaTrust, stance: nadiaStance };
    }
    if (c.id === 'rhea') {
      return {
        ...c,
        stance: state.flags.rhea_allied
          ? 'Encrypted Media Dead-Drop Active'
          : state.flags.journalist_contact
          ? 'Contacted (Uncommitted)'
          : 'Potential Media Ally',
      };
    }
    if (c.id === 'moth') {
      return {
        ...c,
        stance: state.flags.contacted_moth
          ? 'Active Backchannel Broker'
          : 'Calculating Observer',
      };
    }
    return c;
  });

  const socWarningTriggered =
    state.flags.soc_warning_triggered || suspicion >= 25;

  const ev1Or2Discovered = state.evidence.some(
    (e) => (e.id === 'EV-01' || e.id === 'EV-02') && e.discovered
  );
  const ev3Discovered = state.evidence.some(
    (e) => e.id === 'EV-03' && e.discovered
  );
  const enclaveProbed = state.completedEvents.includes(
    'event:active_probe:10.88.14.9'
  );

  const updatedNetworkHosts = (state.networkHosts || []).map((host) => {
    if (host.ip === '10.88.4.22' && (ev1Or2Discovered || ev3Discovered)) {
      return { ...host, discovered: true };
    }
    if (host.ip === '10.88.14.9' && (ev3Discovered || enclaveProbed)) {
      return { ...host, discovered: true };
    }
    return host;
  });

  const compromisedCount = updatedNetworkHosts.filter(
    (h) => h.compromised && h.ip !== '10.0.2.15'
  ).length;

  const cameraScrubbed = Boolean(state.flags.camera_scrubbed);
  const cameraTracked = cameraScrubbed
    ? false
    : Boolean(state.flags.camera_tracked);
  const cameraTrackingRisk = cameraScrubbed ? false : exposure >= 20;

  return {
    ...state,
    characters: updatedCharacters,
    networkHosts: updatedNetworkHosts,
    flags: {
      ...state.flags,
      trust_nadia: nadiaTrust,
      corporate_suspicion: suspicion,
      player_exposure: exposure,
      evidence_count: discoveredCount,
      soc_warning_triggered: socWarningTriggered,
      camera_tracking_risk: cameraTrackingRisk,
      camera_tracked: cameraTracked,
      camera_scrubbed: cameraScrubbed,
      compromised_hosts_count: compromisedCount,
    },
  };
}

export function getInitialIncidentEvidenceCount(state: DeadAirState): number {
  return state.evidence.filter(
    (e) =>
      ['EV-01', 'EV-02', 'EV-03', 'EV-04'].includes(e.id) && e.discovered
  ).length;
}

export function hasMothArchiveKey(state: DeadAirState): boolean {
  return Boolean(
    state.inventory.find((i) => i.id === 'item_moth_usb')?.acquired
  );
}

export function canAccessWorkstation(state: DeadAirState): boolean {
  return (
    state.currentScene === 'APARTMENT_NIGHT' ||
    state.currentScene === 'APARTMENT_RETURN'
  );
}

export function openWorkstationOverlay(
  state: DeadAirState,
  app?: ComputerAppId
): DeadAirState {
  if (!canAccessWorkstation(state)) {
    const msg =
      'Access restricted: Your GreyOS workstation is physically inside Apartment 4B. You cannot access it from the street or laundromat.';
    return {
      ...state,
      activeOverlay:
        state.activeOverlay === 'COMPUTER' ? 'NONE' : state.activeOverlay,
      monologueBanner: msg,
      lastFeedbackBanner:
        'Workstation Unavailable: Return to Apartment 4B to use your desktop.',
    };
  }

  return {
    ...state,
    activeOverlay: 'COMPUTER',
    activeComputerApp: app || state.activeComputerApp,
  };
}

export function toggleWorkstationOverlay(state: DeadAirState): DeadAirState {
  if (state.activeOverlay === 'COMPUTER') {
    return {
      ...state,
      activeOverlay: 'NONE',
    };
  }
  return openWorkstationOverlay(state);
}

export function selectNetworkHost(
  state: DeadAirState,
  ip: string
): DeadAirState {
  const exists = state.networkHosts.some((h) => h.ip === ip);
  if (!exists) return state;
  return {
    ...state,
    selectedNetworkHostIp: ip,
  };
}

export function canAccessVirtualFile(
  state: DeadAirState,
  file: VirtualFileEntry
): { allowed: boolean; error: string } {
  // 1. Always enforce requiresKeyId if present
  if (file.requiresKeyId) {
    const hasRequiredKey = Boolean(
      state.inventory.find((i) => i.id === file.requiresKeyId)?.acquired
    );
    if (!hasRequiredKey && !state.debugMode) {
      return {
        allowed: false,
        error:
          'Permission denied: Encrypted LUKS/SQLite volume. Missing hardware decryption key (moth_archive.key).',
      };
    }
  }

  // 2. Unconditionally enforce requiresScene regardless of file.unlocked
  if (
    file.requiresScene &&
    state.currentScene !== file.requiresScene &&
    !state.debugMode
  ) {
    return {
      allowed: false,
      error: `Access restricted: Remote archive vault mount (${file.path}) is offline. You must return to Apartment 4B (${file.requiresScene}) to access this volume.`,
    };
  }

  // 3. Enforce general unlocked flag
  if (!file.unlocked && !state.debugMode) {
    return {
      allowed: false,
      error: `Permission denied: ${file.name} is locked or unreadable.`,
    };
  }

  return { allowed: true, error: '' };
}

export function canTransitionToScene(
  state: DeadAirState,
  targetScene: SceneId
): SceneTransitionCheck {
  if (targetScene === 'APARTMENT_NIGHT') {
    if (state.currentScene === 'APARTMENT_RETURN') {
      return {
        allowed: false,
        reason:
          'Locked: It is already 03:12 AM. Vespera security patrols are outside—finish inspecting the archive vault here.',
        reasonZh:
          '无法折返：当前已是凌晨 03:12，企业安保正在封锁街区，请在当前工作站完成最终归档库调查。',
      };
    }
    return {
      allowed: true,
      reason: 'Apartment 4B accessible.',
      reasonZh: '可进入 4B 公寓。',
    };
  }

  const hasPhoneChoice =
    state.flags.first_choice_locked && state.flags.first_choice !== null;
  const initialForensicCount = getInitialIncidentEvidenceCount(state);
  const hasTwoForensicFiles = initialForensicCount >= 2;
  const hasCorrelatedTimeline = state.flags.timeline_correlated;

  if (targetScene === 'STREET_NIGHT') {
    if (!hasPhoneChoice) {
      return {
        allowed: false,
        reason:
          'Prerequisite Missing: Open your smartphone [P], listen to Nadia’s voicemail, and confirm your first response choice before leaving.',
        reasonZh:
          '前置条件未满足：请先打开手机 [P] 查看语音留言与警告短信，并做出第一个关键回应选择。',
      };
    }
    if (!hasTwoForensicFiles) {
      return {
        allowed: false,
        reason: `Prerequisite Missing: Inspect at least 2 forensic files from incident_0427.zip on your workstation [C] (currently ${initialForensicCount}/2).`,
        reasonZh: `前置条件未满足：请先在工作站电脑 [C] 中调查至少 2 份初始取证文件（当前已调查 ${initialForensicCount}/2）。`,
      };
    }
    if (!hasCorrelatedTimeline) {
      return {
        allowed: false,
        reason:
          'Prerequisite Missing: Run `verify` in the terminal or click "Correlate Evidence" in the Timeline view [J] before heading out into the rain.',
        reasonZh:
          '前置条件未满足：离开公寓前，请先在时间线界面 [J] 点击“串联时间线”或在终端运行 `verify` 完成证据关联。',
      };
    }
    return {
      allowed: true,
      reason: '4th Avenue unlocked.',
      reasonZh: '第四大道已解锁。',
    };
  }

  if (targetScene === 'LAUNDROMAT') {
    const streetCheck = canTransitionToScene(state, 'STREET_NIGHT');
    if (!streetCheck.allowed) {
      return streetCheck;
    }
    if (
      state.currentScene !== 'STREET_NIGHT' &&
      state.currentScene !== 'LAUNDROMAT' &&
      !state.unlockedScenes.includes('LAUNDROMAT')
    ) {
      return {
        allowed: false,
        reason:
          'Prerequisite Missing: You must walk out onto 4th Avenue first before entering the 24-Hour Coin Laundry.',
        reasonZh: '前置条件未满足：必须先经过第四大道街口，才能进入 24 小时自助洗衣房。',
      };
    }
    return {
      allowed: true,
      reason: '24-Hour Coin Laundry accessible.',
      reasonZh: '可进入 24 小时自助洗衣房。',
    };
  }

  if (targetScene === 'APARTMENT_RETURN') {
    if (!state.flags.laundromat_meeting_done || !hasMothArchiveKey(state)) {
      return {
        allowed: false,
        reason:
          'Prerequisite Missing: Speak with Nadia Park inside the 24-Hour Coin Laundry and obtain the decryption key (moth_archive.key) first.',
        reasonZh:
          '前置条件未满足：必须先在 24 小时洗衣房与 Nadia Park 完成三段对话并取得归档密钥 moth_archive.key。',
      };
    }
    return {
      allowed: true,
      reason: 'Apartment Return (03:12 AM) unlocked.',
      reasonZh: '深夜归来（03:12 AM）场景已解锁。',
    };
  }

  return {
    allowed: false,
    reason: 'Unknown scene transition.',
    reasonZh: '未知的场景切换请求。',
  };
}

export function resolveChapterOneEnding(
  state: DeadAirState
): Exclude<ChapterEndingId, null> {
  const {
    evidence_count,
    timeline_correlated,
    journalist_contact,
    rhea_allied,
    trust_nadia,
    corporate_suspicion,
    player_exposure,
  } = state.flags;

  // Ending C: High suspicion (>= 45) OR high exposure (>= 45) OR incomplete forensics
  if (
    corporate_suspicion >= 45 ||
    player_exposure >= 45 ||
    evidence_count < 4 ||
    !timeline_correlated
  ) {
    return 'ENDING_C_FALL_GUY';
  }

  // Ending A: Full evidence chain (>=5), timeline correlated, journalist dead-drop allied, and Nadia trust >= 55
  if (
    evidence_count >= 5 &&
    timeline_correlated &&
    journalist_contact &&
    rhea_allied &&
    trust_nadia >= 55
  ) {
    return 'ENDING_A_SIGNAL_LEAKS';
  }

  // Ending B: Strong evidence & low exposure, but missing media dead-drop or ally trust
  return 'ENDING_B_DIRTY_BARGAIN';
}

export function openPhoneOverlay(state: DeadAirState): DeadAirState {
  const isReturnScene = state.currentScene === 'APARTMENT_RETURN';
  const mothMsgUnlocked = state.phoneMessages.some(
    (m) => m.id === 'msg_moth_archive' && m.unlocked
  );
  const nowContactedMoth =
    state.flags.contacted_moth || (isReturnScene && mothMsgUnlocked);

  const nextState: DeadAirState = {
    ...state,
    activeOverlay: 'PHONE',
    phoneMessages: state.phoneMessages.map((m) =>
      m.unlocked ? { ...m, isUnread: false } : m
    ),
    flags: {
      ...state.flags,
      voicemail_played: true,
      contacted_moth: nowContactedMoth,
    },
  };

  return syncCharactersAndFlags(nextState);
}

export function inspectHotspot(
  state: DeadAirState,
  hotspotId: string
): DeadAirState {
  const currentHotspots = state.hotspots[state.currentScene] || [];
  const target = currentHotspots.find((h) => h.id === hotspotId);
  if (!target) return state;

  if (target.triggersScene) {
    const check = canTransitionToScene(state, target.triggersScene);
    if (!check.allowed && !state.debugMode) {
      return {
        ...state,
        selectedHotspotId: hotspotId,
        monologueBanner: `${check.reason} / ${check.reasonZh}`,
        lastFeedbackBanner: check.reason,
      };
    }
  }

  const eventKey = `hotspot:${state.currentScene}:${hotspotId}`;
  const isFirstInspection = !state.completedEvents.includes(eventKey);

  const updatedSceneHotspots = currentHotspots.map((h) =>
    h.id === hotspotId ? { ...h, inspected: true } : h
  );

  let nextState: DeadAirState = {
    ...state,
    selectedHotspotId: hotspotId,
    completedEvents: isFirstInspection
      ? [...state.completedEvents, eventKey]
      : state.completedEvents,
    hotspots: {
      ...state.hotspots,
      [state.currentScene]: updatedSceneHotspots,
    },
    monologueBanner: `${target.label} (${target.labelZh}): ${target.detailText}`,
    lastFeedbackBanner: null,
  };

  if (target.unlocksItemId) {
    nextState = {
      ...nextState,
      inventory: nextState.inventory.map((item) =>
        item.id === target.unlocksItemId ? { ...item, acquired: true } : item
      ),
    };
  }

  if (target.unlocksEvidenceId) {
    const { updated } = unlockEvidenceById(
      nextState.evidence,
      target.unlocksEvidenceId
    );
    nextState = {
      ...nextState,
      evidence: updated,
    };
  }

  // Street camera consequence: if player_exposure >= 20 (camera_tracking_risk) and camera buffer not scrubbed, inspecting camera triggers active optical lock!
  if (hotspotId === 'hs_camera' && isFirstInspection) {
    if (nextState.flags.camera_scrubbed) {
      nextState = {
        ...nextState,
        lastFeedbackBanner:
          'COUNTER-SURVEILLANCE ACTIVE: Optical Pole #04 NVRAM was scrubbed earlier—your gait & IMEI passed undetected.',
        monologueBanner:
          'Municipal Pole #04 sweeps the wet crosswalk, but its local NVRAM buffer was wiped by your earlier hack on 10.40.4.18. No telemetry alert triggered.',
      };
    } else if (nextState.flags.player_exposure >= 20) {
      nextState = {
        ...nextState,
        flags: {
          ...nextState.flags,
          corporate_suspicion: clampMetric(
            nextState.flags.corporate_suspicion + 10
          ),
          player_exposure: clampMetric(nextState.flags.player_exposure + 10),
          camera_tracked: true,
        },
        lastFeedbackBanner:
          'WARNING: High cellular exposure allowed Municipal Pole #04 to lock onto your gait & IMEI (+10% Corporate Suspicion, +10% Exposure).',
        monologueBanner:
          'Municipal Pole #04 locked onto your silhouette—your earlier cellular trace allowed Vespera’s street grid to flag your location (+10% Corporate Suspicion, +10% Exposure).',
      };
    }
  }

  if (target.triggersScene) {
    return transitionToScene(nextState, target.triggersScene);
  }

  if (target.triggersOverlay === 'PHONE') {
    return openPhoneOverlay(nextState);
  }

  if (target.triggersOverlay) {
    nextState = {
      ...nextState,
      activeOverlay: target.triggersOverlay,
      activeDialogueCharacterId:
        target.triggersCharacterId || nextState.activeDialogueCharacterId,
    };
  }

  if (hotspotId === 'hs_return_pc') {
    nextState = {
      ...nextState,
      activeComputerApp: 'TERMINAL',
      currentDir: '/home/eli/archive_vault',
    };
  }

  return syncCharactersAndFlags(nextState);
}

export function transitionToScene(
  state: DeadAirState,
  targetScene: SceneId,
  options?: { forceDebug?: boolean }
): DeadAirState {
  const isDebugJump = Boolean(options?.forceDebug || state.debugMode);
  if (!isDebugJump) {
    const check = canTransitionToScene(state, targetScene);
    if (!check.allowed) {
      return {
        ...state,
        monologueBanner: `${check.reason} / ${check.reasonZh}`,
        lastFeedbackBanner: check.reason,
      };
    }
  }

  let clockTime = state.clockTime;
  let banner = state.monologueBanner;
  let currentObjective = state.flags.current_objective;

  if (targetScene === 'STREET_NIGHT') {
    clockTime = '02:41 AM';
    banner =
      state.flags.corporate_suspicion >= 30
        ? '02:41 AM. An unmarked Vespera security sedan idles near the 4th Avenue intersection—your high suspicion score has drawn patrols.'
        : 'Cold drizzle coats 4th Avenue. Municipal optical cameras hum above the crosswalk while the 24-hour laundromat glows down the block.';
    currentObjective =
      'Optional: Speak with journalist Rhea Solis on 4th Ave, then enter the 24-Hour Coin Laundry.';
  } else if (targetScene === 'LAUNDROMAT') {
    clockTime = '02:48 AM';
    banner =
      'Warm detergent steam and the rhythmic thud of industrial dryers mask your footsteps. Nadia Park waits near Dryer #04.';
    currentObjective =
      'Speak with Nadia Park across all 3 dialogue stages to uncover Project LANTERN and obtain moth_archive.key.';
  } else if (targetScene === 'APARTMENT_RETURN') {
    clockTime = '03:12 AM';
    banner =
      'You lock the deadbolt behind you—and freeze. Your workstation monitor is awake in the dark, and your phone vibrates with an incoming message from MOTH.';
    currentObjective =
      'Check MOTH’s message on your phone [P], then inspect /home/eli/archive_vault/lantern_auth_audit.db on your workstation [C].';
  } else if (targetScene === 'APARTMENT_NIGHT') {
    clockTime = '02:17 AM';
    banner =
      'Greyhaven, 02:17 AM. Rain streaks the glass outside Apt 4B. Your phone is vibrating on the desk.';
  }

  const updatedMessages =
    targetScene === 'APARTMENT_RETURN'
      ? state.phoneMessages.map((m) =>
          m.id === 'msg_moth_archive' ? { ...m, unlocked: true, isUnread: true } : m
        )
      : state.phoneMessages;

  // Unlock lantern_auth_audit.db ONLY when entering APARTMENT_RETURN with moth_archive.key
  const canUnlockVault =
    targetScene === 'APARTMENT_RETURN' &&
    (hasMothArchiveKey(state) || isDebugJump);

  const updatedFiles = state.files.map((f) => {
    if (f.path === '/home/eli/archive_vault/lantern_auth_audit.db') {
      return { ...f, unlocked: canUnlockVault };
    }
    return f;
  });

  const nextUnlockedScenes = state.unlockedScenes.includes(targetScene)
    ? state.unlockedScenes
    : [...state.unlockedScenes, targetScene];

  const nextState: DeadAirState = {
    ...state,
    currentScene: targetScene,
    unlockedScenes: nextUnlockedScenes,
    activeOverlay: 'NONE',
    selectedHotspotId: null,
    clockTime,
    monologueBanner: banner,
    lastFeedbackBanner: `Scene Transition: ${targetScene} (${clockTime})`,
    phoneMessages: updatedMessages,
    files: updatedFiles,
    flags: {
      ...state.flags,
      current_objective: currentObjective,
    },
  };

  return syncCharactersAndFlags(nextState);
}

export function handleFirstPhoneChoice(
  state: DeadAirState,
  choice: FirstPhoneChoice
): DeadAirState {
  if (!choice) return state;

  if (
    state.flags.first_choice_locked ||
    state.flags.first_choice !== null ||
    state.completedEvents.includes('event:first_phone_choice')
  ) {
    return {
      ...state,
      lastFeedbackBanner:
        'Decision Locked: Your initial response has already been recorded and cannot be altered.',
    };
  }

  let suspicionDelta = 0;
  let exposureDelta = 0;
  let trustDelta = 0;
  let responseBody = '';
  let responseBodyZh = '';

  if (choice === 'CALL_NADIA') {
    suspicionDelta = 15;
    exposureDelta = 15;
    trustDelta = 10;
    responseBody =
      '[OUTBOUND CALL LOG — 02:19 AM] Dialed Nadia Park. Carrier routed directly to dead air after two rings. Cell tower handoff logged your IMEI near 4th Ave (+10% Nadia Trust, +15% Corporate Suspicion, +15% Exposure).';
    responseBodyZh =
      '【外拨记录 — 02:19 AM】已拨打 Nadia Park。响铃两声后转入死寂忙音。基站切换已记录你在第四大道附近的 IMEI（Nadia 信任 +10%，企业怀疑 +15%，暴露度 +15%）。';
  } else if (choice === 'TRACE_SMS') {
    suspicionDelta = 5;
    exposureDelta = 5;
    trustDelta = 0;
    responseBody =
      '[SS7 HEADER TRACE — 02:19 AM] Anonymous warning SMS bounced through a disposable SIP relay in Port District. Sender signature: "MOTH_RELAY_0" (+5% Corporate Suspicion, +5% Exposure).';
    responseBodyZh =
      '【SS7 信令追踪 — 02:19 AM】匿名警告短信经由港区一次性 SIP 中继转发。发送方特征码："MOTH_RELAY_0"（企业怀疑 +5%，暴露度 +5%）。';
  } else if (choice === 'WAIT_CHECK_PC') {
    suspicionDelta = -5;
    exposureDelta = 0;
    trustDelta = 0;
    responseBody =
      '[AIRGAP PROTOCOL — 02:19 AM] You enabled cellular silence and turned toward your Linux workstation to inspect incident_0427.zip locally (-5% Corporate Suspicion, +0% Exposure).';
    responseBodyZh =
      '【静默协议 — 02:19 AM】你开启了蜂窝静默，决定先在本地 Linux 工作站上核查 incident_0427.zip（企业怀疑 -5%，零暴露）。';
  } else if (choice === 'CONTACT_ALLY') {
    suspicionDelta = 5;
    exposureDelta = 5;
    trustDelta = 5;
    responseBody =
      '[ENCRYPTED PING — 02:19 AM] Pushed a zero-knowledge canary to Rhea Solis & Daniel Cross. Auto-reply from Daniel: "Stay off Vespera trunks tonight, Eli." (+5% Nadia Trust, +5% Suspicion, +5% Exposure).';
    responseBodyZh =
      '【加密探针 — 02:19 AM】已向记者 Rhea Solis 与前导师 Daniel Cross 发送零知识信标。Daniel 自动回复：“今晚别碰 Vespera 的主干网，Eli。”';
  }

  const newMsg = {
    id: `msg_choice_${choice.toLowerCase()}`,
    sender: 'GreyOS Cellular Log',
    senderRole: 'Action Record (Locked)',
    timestamp: '02:19 AM',
    type: 'SMS' as const,
    body: responseBody,
    bodyZh: responseBodyZh,
    isUnread: false,
    unlocked: true,
  };

  const filteredMessages = state.phoneMessages.filter(
    (m) => !m.id.startsWith('msg_choice_')
  );

  const nextState: DeadAirState = {
    ...state,
    completedEvents: [...state.completedEvents, 'event:first_phone_choice'],
    phoneMessages: [...filteredMessages, newMsg],
    flags: {
      ...state.flags,
      voicemail_played: true,
      first_choice: choice,
      first_choice_locked: true,
      corporate_suspicion: clampMetric(
        state.flags.corporate_suspicion + suspicionDelta
      ),
      player_exposure: clampMetric(state.flags.player_exposure + exposureDelta),
      trust_nadia: clampMetric(state.flags.trust_nadia + trustDelta),
      current_objective:
        'Step 2: Boot your Linux workstation [C], inspect at least 2 forensic files in incident_0427, and correlate the timeline.',
    },
    monologueBanner: responseBody,
    lastFeedbackBanner: `Decision Locked: ${choice}`,
  };

  return syncCharactersAndFlags(nextState);
}

export function inspectVirtualFile(
  state: DeadAirState,
  filePath: string
): DeadAirState {
  const file = state.files.find((f) => f.path === filePath);
  if (!file) {
    return {
      ...state,
      terminalHistory: [
        ...state.terminalHistory,
        makeTermLine(`cat: ${filePath}: File not found`, 'error'),
      ],
    };
  }

  const access = canAccessVirtualFile(state, file);
  if (!access.allowed) {
    // High-risk consequence: attempting to force-read the encrypted archive vault without moth_archive.key trips a LUKS tamper alert once
    const tamperKey = 'event:unauthorized_vault_attempt';
    const isVaultWithoutKey =
      file.path === '/home/eli/archive_vault/lantern_auth_audit.db' &&
      !hasMothArchiveKey(state);
    const shouldPenalizeTamper =
      isVaultWithoutKey && !state.completedEvents.includes(tamperKey);

    const tamperLines: TerminalOutputLine[] = [
      makeTermLine(`eli@greyos:${state.currentDir}$ cat ${file.path}`, 'command'),
      makeTermLine(access.error, 'error'),
    ];

    if (shouldPenalizeTamper) {
      tamperLines.push(
        makeTermLine(
          '[SECURITY ALERT] Unauthenticated LUKS header read triggered remote watchdog beacon (+10% Corporate Suspicion, +5% Exposure).',
          'error'
        )
      );
    }

    const penalizedState: DeadAirState = {
      ...state,
      completedEvents: shouldPenalizeTamper
        ? [...state.completedEvents, tamperKey]
        : state.completedEvents,
      flags: shouldPenalizeTamper
        ? {
            ...state.flags,
            corporate_suspicion: clampMetric(
              state.flags.corporate_suspicion + 10
            ),
            player_exposure: clampMetric(state.flags.player_exposure + 5),
          }
        : state.flags,
      terminalHistory: [...state.terminalHistory, ...tamperLines],
      lastFeedbackBanner: access.error,
      monologueBanner: access.error,
    };

    return syncCharactersAndFlags(penalizedState);
  }

  let nextEvidence = state.evidence;
  let newlyFoundId: string | null = null;

  if (file.unlocksEvidenceId) {
    const res = unlockEvidenceById(nextEvidence, file.unlocksEvidenceId);
    nextEvidence = res.updated;
    if (res.newlyDiscovered) {
      newlyFoundId = file.unlocksEvidenceId;
    }
  }

  let triggeredTwist = state.flags.discovered_eli_account_reuse;
  let nextShellState = state.shellState;
  let nextEndingId = state.endingId;

  if (file.path === '/home/eli/archive_vault/lantern_auth_audit.db') {
    const res5 = unlockEvidenceById(nextEvidence, 'EV-05');
    const res6 = unlockEvidenceById(res5.updated, 'EV-06');
    nextEvidence = res6.updated;
    if (res6.newlyDiscovered || !state.flags.discovered_eli_account_reuse) {
      newlyFoundId = 'EV-06';
    }
    triggeredTwist = true;
    nextShellState = 'gameover';
  }

  const discoveredCount = nextEvidence.filter((e) => e.discovered).length;
  const initialCount = nextEvidence.filter(
    (e) =>
      ['EV-01', 'EV-02', 'EV-03', 'EV-04'].includes(e.id) && e.discovered
  ).length;
  const inspectedCoreLogs = initialCount >= 2;

  const newTerminalLines: TerminalOutputLine[] = [
    makeTermLine(`eli@greyos:${state.currentDir}$ cat ${file.path}`, 'command'),
    makeTermLine(file.content, 'output'),
  ];

  if (newlyFoundId) {
    const evObj = nextEvidence.find((e) => e.id === newlyFoundId);
    if (evObj) {
      newTerminalLines.push(
        makeTermLine(
          `[EVIDENCE DISCOVERED] ${evObj.id}: ${evObj.title} (${evObj.eventTimestamp})`,
          'highlight'
        )
      );
    }
  } else if (file.unlocksEvidenceId) {
    newTerminalLines.push(
      makeTermLine(
        `[FORENSIC NOTE] Artifact ${file.unlocksEvidenceId} already logged in casebook.`,
        'system'
      )
    );
  }

  if (triggeredTwist) {
    newTerminalLines.push(
      makeTermLine(
        '[CRITICAL ALERT] Remote SSH carrier dropped. Display override packet received: "WE KNOW WHO YOU ARE."',
        'error'
      )
    );
  }

  const nextInspectedFiles = state.inspectedFiles.includes(file.path)
    ? state.inspectedFiles
    : [...state.inspectedFiles, file.path];

  const fileEventKey = `file:${file.path}`;
  const nextCompletedEvents = state.completedEvents.includes(fileEventKey)
    ? state.completedEvents
    : [...state.completedEvents, fileEventKey];

  let interimState: DeadAirState = {
    ...state,
    shellState: nextShellState,
    evidence: nextEvidence,
    inspectedFiles: nextInspectedFiles,
    completedEvents: nextCompletedEvents,
    terminalHistory: [...state.terminalHistory, ...newTerminalLines],
    flags: {
      ...state.flags,
      evidence_count: discoveredCount,
      archive_inspected: inspectedCoreLogs || state.flags.archive_inspected,
      discovered_lantern:
        file.unlocksEvidenceId === 'EV-04' || state.flags.discovered_lantern,
      discovered_eli_account_reuse: triggeredTwist,
      current_objective: triggeredTwist
        ? 'Chapter 1 Climax Reached — Review your Chapter 1 Ending & Forensic Settlement.'
        : inspectedCoreLogs && !state.flags.timeline_correlated
        ? 'Step 3: Correlate the discovered forensic artifacts in the Timeline tab or run `verify` in the terminal.'
        : inspectedCoreLogs &&
          state.flags.timeline_correlated &&
          !state.flags.laundromat_meeting_done
        ? 'Step 4: Leave the apartment and head to the 24-Hour Coin Laundry on 4th Ave.'
        : state.flags.current_objective,
    },
    monologueBanner: triggeredTwist
      ? 'Your own revoked employee ID — e.ward_09 — authorized the Project LANTERN cover-up 48 hours ago. Screen blackout imminent.'
      : `Inspected ${file.name}. (${discoveredCount}/6 forensic evidence artifacts logged)`,
    lastFeedbackBanner: newlyFoundId
      ? `Evidence Discovered: ${newlyFoundId} (${file.name})`
      : `Inspected File: ${file.name}`,
  };

  interimState = syncCharactersAndFlags(interimState);

  if (triggeredTwist) {
    nextEndingId = resolveChapterOneEnding(interimState);
    interimState = {
      ...interimState,
      endingId: nextEndingId,
    };
  }

  return interimState;
}

export function correlateEvidenceTimeline(state: DeadAirState): DeadAirState {
  const discoveredCount = state.evidence.filter((e) => e.discovered).length;

  if (discoveredCount < 2) {
    const mismatchMsg =
      'Timeline mismatch: Insufficient forensic artifacts discovered (minimum 2 required to correlate chronology).';
    return {
      ...state,
      terminalHistory: [
        ...state.terminalHistory,
        makeTermLine(`[TIMELINE ENGINE ERROR] ${mismatchMsg}`, 'error'),
      ],
      monologueBanner: mismatchMsg,
      lastFeedbackBanner: mismatchMsg,
    };
  }

  const updatedEvidence = state.evidence.map((ev) =>
    ev.discovered ? { ...ev, correlated: true } : ev
  );

  const eventKey = 'event:timeline_correlated';
  const nextCompleted = state.completedEvents.includes(eventKey)
    ? state.completedEvents
    : [...state.completedEvents, eventKey];

  const canLeaveNow =
    state.flags.first_choice_locked &&
    getInitialIncidentEvidenceCount(state) >= 2;

  const nextState: DeadAirState = {
    ...state,
    evidence: updatedEvidence,
    completedEvents: nextCompleted,
    flags: {
      ...state.flags,
      timeline_correlated: true,
      archive_inspected: true,
      current_objective: !state.flags.first_choice_locked
        ? 'Open your smartphone [P] and make your first response choice before leaving.'
        : canLeaveNow && !state.flags.laundromat_meeting_done
        ? 'Prerequisites complete! Leave Apartment 4B and head to the 24-Hour Coin Laundry on 4th Ave.'
        : state.flags.current_objective,
    },
    terminalHistory: [
      ...state.terminalHistory,
      makeTermLine(
        `[TIMELINE CORRELATION ENGINE] Correlated ${discoveredCount} chronological evidence nodes across the 14-minute Vespera blackout window.`,
        'highlight'
      ),
    ],
    monologueBanner: `Forensic timeline correlated (${discoveredCount} nodes linked in chronological sequence).`,
    lastFeedbackBanner: `Timeline Correlated (${discoveredCount}/6 artifacts linked)`,
  };

  return syncCharactersAndFlags(nextState);
}

export function selectCharacterDialogueChoice(
  state: DeadAirState,
  characterId: string,
  choiceId: string
): DeadAirState {
  const char = state.characters.find((c) => c.id === characterId);
  if (!char) return state;

  const currentNode =
    char.nodes.find((n) => n.id === char.currentNodeId) || char.nodes[0];
  if (!currentNode) return state;

  const choice = currentNode.choices.find((c) => c.id === choiceId);
  if (!choice) return state;

  // Enforce one-time decision per NPC dialogue node (`resolvedDialogueNodes`)
  const nodeKey = `${characterId}:${currentNode.id}`;
  const previouslyChosenId = state.resolvedDialogueNodes[nodeKey];
  if (previouslyChosenId && previouslyChosenId !== choiceId) {
    return {
      ...state,
      lastFeedbackBanner:
        'Decision Locked: You have already committed to a choice for this conversation stage.',
      monologueBanner:
        'Decision Locked: You cannot reverse your stance on this dialogue stage.',
    };
  }

  const choiceEventKey = `dialogue:${characterId}:${choiceId}`;
  const alreadyChosen =
    Boolean(previouslyChosenId) ||
    state.completedEvents.includes(choiceEventKey);

  const trustDelta = alreadyChosen ? 0 : choice.trustDelta || 0;
  const suspicionDelta = alreadyChosen ? 0 : choice.suspicionDelta || 0;
  const exposureDelta = alreadyChosen ? 0 : choice.exposureDelta || 0;

  const nextCharTrust = clampMetric(char.trust + trustDelta);
  const nextNadiaTrust =
    characterId === 'nadia'
      ? nextCharTrust
      : clampMetric(state.flags.trust_nadia);
  let nextSuspicion = clampMetric(
    state.flags.corporate_suspicion + suspicionDelta
  );
  let nextExposure = clampMetric(state.flags.player_exposure + exposureDelta);

  let nextEvidence = state.evidence;
  if (choice.unlocksEvidenceId) {
    const res = unlockEvidenceById(nextEvidence, choice.unlocksEvidenceId);
    nextEvidence = res.updated;
  }

  let nextInventory = state.inventory;
  let laundromatDone = state.flags.laundromat_meeting_done;
  let contactedMoth = state.flags.contacted_moth;
  let discoveredLantern = state.flags.discovered_lantern;
  let journalistContact = state.flags.journalist_contact;
  let rheaAllied = state.flags.rhea_allied;
  let feedbackBanner = `Dialogue recorded with ${char.name}.`;

  if (characterId === 'rhea' && currentNode.id === 'rhea_node_1' && !alreadyChosen) {
    journalistContact = true;
    if (choiceId === 'rhea_c1_share') {
      rheaAllied = true;
      feedbackBanner =
        'Media Dead-Drop Active: Rhea Solis configured an air-gapped upload channel for your final evidence dump.';
    } else {
      rheaAllied = false;
      feedbackBanner =
        'Rhea Solis noted your caution—no automatic media dead-drop configured for tonight.';
    }
  }

  if (characterId === 'moth') {
    contactedMoth = true;
  }

  if (characterId === 'nadia') {
    discoveredLantern = true;
    const ev4 = unlockEvidenceById(nextEvidence, 'EV-04');
    nextEvidence = ev4.updated;
  }

  const isNadiaEnd =
    characterId === 'nadia' &&
    (currentNode.id === 'nadia_node_3' || !choice.nextNodeId);

  const extraTerminalLines: TerminalOutputLine[] = [];

  if (isNadiaEnd) {
    laundromatDone = true;
    const ev5 = unlockEvidenceById(nextEvidence, 'EV-05');
    nextEvidence = ev5.updated;
    // IMPORTANT: Grant moth_archive.key, but do NOT unlock lantern_auth_audit.db while still in LAUNDROMAT!
    nextInventory = nextInventory.map((item) =>
      item.id === 'item_moth_usb' ? { ...item, acquired: true } : item
    );

    if (nextNadiaTrust >= 65 && !alreadyChosen) {
      nextExposure = clampMetric(nextExposure - 5);
      feedbackBanner =
        'High Trust Bonus (Nadia >= 65%): Nadia handed you moth_archive.key AND shared Vespera’s fiber tap filter (-5% Player Exposure).';
      extraTerminalLines.push(
        makeTermLine(
          '[ALLY INTEL — NADIA PARK] Applied Enclave MAC-spoof filter to local interface (-5% Exposure). Key moth_archive.key acquired.',
          'highlight'
        )
      );
    } else {
      feedbackBanner =
        'Acquired moth_archive.key from Nadia Park. Return to Apartment 4B (03:12 AM) to decrypt the archive vault.';
    }
  }

  const updatedCharacters = state.characters.map((c) => {
    if (c.id !== characterId) return c;
    return {
      ...c,
      trust: nextCharTrust,
      currentNodeId: choice.nextNodeId || c.currentNodeId,
    };
  });

  const nextCompletedEvents = alreadyChosen
    ? state.completedEvents
    : [...state.completedEvents, choiceEventKey];

  const nextResolvedNodes = {
    ...state.resolvedDialogueNodes,
    [nodeKey]: previouslyChosenId || choiceId,
  };

  const nextState: DeadAirState = {
    ...state,
    characters: updatedCharacters,
    evidence: nextEvidence,
    inventory: nextInventory,
    completedEvents: nextCompletedEvents,
    resolvedDialogueNodes: nextResolvedNodes,
    terminalHistory: [...state.terminalHistory, ...extraTerminalLines],
    activeOverlay: choice.nextNodeId ? 'DIALOGUE' : 'NONE',
    flags: {
      ...state.flags,
      trust_nadia: nextNadiaTrust,
      corporate_suspicion: nextSuspicion,
      player_exposure: nextExposure,
      discovered_lantern: discoveredLantern,
      journalist_contact: journalistContact,
      rhea_allied: rheaAllied,
      laundromat_meeting_done: laundromatDone,
      contacted_moth: contactedMoth,
      current_objective: isNadiaEnd
        ? 'Step 5: Return to Apartment 4B (03:12 AM) and decrypt /home/eli/archive_vault/lantern_auth_audit.db.'
        : state.flags.current_objective,
    },
    monologueBanner: isNadiaEnd
      ? 'Nadia slipped you a micro-USB key ("moth_archive.key") and vanished into the rain. You can now return to Apartment 4B.'
      : `${char.name}: "${currentNode.body.slice(0, 90)}..."`,
    lastFeedbackBanner: feedbackBanner,
  };

  return syncCharactersAndFlags(nextState);
}

export function executeDeadAirCommand(
  state: DeadAirState,
  rawCommand: string
): DeadAirState {
  const trimmed = rawCommand.trim();
  if (!trimmed) return state;

  const cmdLine = makeTermLine(
    `eli@greyos:${state.currentDir}$ ${trimmed}`,
    'command'
  );
  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const arg = parts.slice(1).join(' ');

  if (cmd === 'clear') {
    return {
      ...state,
      terminalHistory: [],
    };
  }

  if (cmd === 'help') {
    return {
      ...state,
      terminalHistory: [
        ...state.terminalHistory,
        cmdLine,
        makeTermLine(
          [
            'GreyOS 6.4 Forensics & Intrusion Shell — Supported Commands:',
            '  [FILE & TIMELINE FORENSICS]',
            '  ls                       List directory contents and forensic status',
            '  cd <dir>                 Change working directory (/home/eli/Downloads/incident_0427, /home/eli/archive_vault)',
            '  cat <file>               Display file contents and record forensic evidence',
            '  stat <file>              Inspect inode metadata, permissions & SHA-256 digest',
            '  grep <pattern> <file>    Search file lines matching pattern',
            '  unzip incident_0427.zip  Verify and unpack archive contents',
            '  verify / timeline        Correlate discovered evidence chronologically (requires >= 2 artifacts)',
            '',
            '  [VIRTUAL NETWORK & HOST INTRUSION (V0.3)]',
            '  netmap / hosts           Display discovered virtual network topology, IPs & privilege levels',
            '  nmap <ip_or_host>        Scan target host ports, service banners & vulnerability vectors',
            '  exploit <ip> / ssh <ip>  Authenticate or exploit service flaw using discovered forensic credentials',
            '  logs <ip>                Read remote /var/log/* telemetry on a compromised host',
            '  pivot 172.16.40.12       Route workstation traffic through Port District SIP relay (-10% Exposure)',
            '  scrub 10.40.4.18         Wipe gait & IMEI watchlist from Municipal Camera #04 (-10% Exposure, -5% Suspicion)',
            '  dump 10.88.4.22          Extract Marcus Hale keyring forgery proof from Vespera Edge Gateway (-5% Suspicion)',
            '  probe <target_ip>        Raw SYN probe (WARNING: probing 10.88.14.9 trips Vespera SOC honey-trap)',
            '',
            '  [FIELD MANUAL — TRACK I: NETWORK & INTERNET (hoochanlon/fq-book, Levels 01-07)]',
            '  manual / codex           List Field Manual tracks (Track I: 7, Track II: 5, Total: 12) & capabilities',
            '  dns-inspect              Apply Resolver Inspector to purge Vespera DNS sinkhole hook (Level 02)',
            '  cert-verify              Apply Certificate Analyzer to strip rogue Vespera MITM root CA (Level 03)',
            '  route-apply              Apply Proxy Route Editor for WireGuard + SOCKS5h tunnel (Level 04)',
            '  packet-inspect           Apply Packet & Port Inspector for quiet transport fingerprinting (Level 01)',
            '  topo-map                 Apply Topology Mapper for Host-Only VM sandbox & NAT mapping (Level 05)',
            '  ipfs-verify              Apply Archive Verifier to pin SHA-256 CID of audit ledger (Level 06)',
            '  archive-search           Apply Archive Search & OPSEC scrub to strip legacy headers (Level 07)',
            '',
            '  [FIELD MANUAL — TRACK II: TACTICAL SECURITY (Lauren-Bitten/CyberSecurity-Projects, Levels 08-12)]',
            '  persist-audit [opts]     Audit systemd timers & scrub PDF metadata (--inspect | --quarantine | --sanitize-copy) (Level 08)',
            '  ja4-inspect [pcap]       Verify canonical JA4 TLS fingerprint & passive TCP handshake telemetry (Level 09)',
            '  canary-check [target]    Detect PDF Canary Tokens & passive 10.88.14.9 honeypot indicators (Level 10)',
            '  hsm-verify [artifact]    Verify PKCS#11 ECDSA signature, Key ID (M_HALE_SEC_01) & soft-token flags (Level 11)',
            '  bin-audit [target/opts]  Audit ELF symbols, CIS Docker escape risks & eBPF syscall traces (Level 12)',
            '  status / whoami / clear  Show operator telemetry or clear terminal',
          ].join('\n'),
          'system'
        ),
      ],
    };
  }

  if (cmd === 'manual' || cmd === 'codex' || cmd === 'lab') {
    const track1Lessons = ALL_LEARNING_LESSONS.filter(
      (l) => l.sourceTrack === 'network_internet'
    );
    const track2Lessons = ALL_LEARNING_LESSONS.filter(
      (l) => l.sourceTrack === 'tactical_security'
    );
    const track1Done = track1Lessons.filter((l) =>
      state.learning.completedLessonIds.includes(l.id)
    ).length;
    const track2Done = track2Lessons.filter((l) =>
      state.learning.completedLessonIds.includes(l.id)
    ).length;

    const lines = [
      "ELI WARD'S FIELD MANUAL — GREYOS 6.4 · DUAL-SOURCE KNOWLEDGE & LAB DATABASE:",
      `  TRACK I  (Network & Internet — hoochanlon/fq-book)                   : ${track1Done} / ${track1Lessons.length}`,
      `  TRACK II (Tactical Security — Lauren-Bitten/CyberSecurity-Projects) : ${track2Done} / ${track2Lessons.length}`,
      `  TOTAL COMPLETED LABS                                                 : ${state.learning.completedLessonIds.length} / ${ALL_LEARNING_LESSONS.length}`,
      `  Unlocked Capabilities: ${
        state.learning.unlockedCapabilities.length > 0
          ? state.learning.unlockedCapabilities.join(', ')
          : 'None yet (Open Field Manual & NetLab tab to run diagnostics)'
      }`,
      `  Unlocked CLI Tools   : ${
        state.learning.unlockedTools.length > 0
          ? state.learning.unlockedTools.join(', ')
          : 'None yet'
      }`,
      '-----------------------------------------------------------------------------------------',
      ...ALL_LEARNING_LESSONS.map((l) => {
        const done = state.learning.completedLessonIds.includes(l.id)
          ? '[MASTERED]'
          : '[AVAILABLE]';
        const applied = state.learning.appliedStoryLessons.includes(l.id)
          ? ' · [FIELD APPLIED]'
          : '';
        const trackTag = l.sourceTrack === 'network_internet' ? '[T1]' : '[T2]';
        return `  ${trackTag} ${l.code.padEnd(24, ' ')} ${l.title} (${l.titleZh}) — ${done}${applied} -> CLI: ${l.unlocks.tools.join(', ')}`;
      }),
      '-----------------------------------------------------------------------------------------',
      "Tip: Click the 'Field Manual & NetLab' tab in GreyOS or press [M] to filter by Source Track and launch interactive Labs.",
    ];
    return {
      ...state,
      terminalHistory: [
        ...state.terminalHistory,
        cmdLine,
        makeTermLine(lines.join('\n'), 'highlight'),
      ],
      lastFeedbackBanner: 'Displayed Eli Ward’s Field Manual & Dual-Source Training Database',
    };
  }

  const capHandled = applyCapabilityByCommandName(state, cmd, arg);
  if (capHandled) {
    return syncCharactersAndFlags(capHandled);
  }

  const resolveHostByQuery = (
    hostQuery: string,
    hosts = state.networkHosts
  ) => {
    if (!hostQuery) return undefined;
    const cleaned = hostQuery
      .trim()
      .toLowerCase()
      .replace(/^.*@/, '');
    return hosts.find(
      (h) =>
        h.ip.toLowerCase() === cleaned ||
        h.hostname.toLowerCase() === cleaned ||
        h.hostname.toLowerCase().startsWith(cleaned + '.')
    );
  };

  if (cmd === 'netmap' || cmd === 'hosts' || cmd === 'ifconfig') {
    const updatedHosts = state.networkHosts.map((h) => {
      if (
        h.ip === '10.88.4.22' &&
        state.evidence.some((e) => e.discovered)
      ) {
        return { ...h, discovered: true };
      }
      return h;
    });

    const visibleHosts = updatedHosts.filter((h) => h.discovered);
    const lines = [
      'GREYHAVEN VIRTUAL NETWORK TOPOLOGY (GreyOS netmap v0.3):',
      `Active Interface : eth0 (10.0.2.15/24) · Proxy Tunnel: ${
        state.flags.relay_tunnel_active
          ? 'ACTIVE (via 172.16.40.12 MOTH_RELAY_0)'
          : 'DIRECT (Unmasked Home Fiber)'
      }`,
      '-----------------------------------------------------------------------------------------',
      'IP ADDRESS      HOSTNAME                   PRIVILEGE   STATUS         TACTICAL OP',
      ...visibleHosts.map((h) => {
        const ipPad = h.ip.padEnd(15, ' ');
        const hostPad = h.hostname.padEnd(26, ' ');
        const privPad = h.privilege.padEnd(11, ' ');
        const statusStr = h.actionCompleted
          ? 'OP COMPLETE'
          : h.compromised
          ? 'COMPROMISED'
          : h.scanned
          ? 'SCANNED'
          : 'DISCOVERED';
        return `${ipPad} ${hostPad} ${privPad} ${statusStr.padEnd(14, ' ')} ${h.actionCommand}`;
      }),
      '-----------------------------------------------------------------------------------------',
      "Tip: Run 'nmap <ip>' to fingerprint services, 'exploit <ip>' to escalate privilege, and 'logs <ip>' to inspect remote logs.",
    ];

    return syncCharactersAndFlags({
      ...state,
      networkHosts: updatedHosts,
      terminalHistory: [
        ...state.terminalHistory,
        cmdLine,
        makeTermLine(lines.join('\n'), 'highlight'),
      ],
      lastFeedbackBanner: `Network Topology Mapped (${visibleHosts.length} active nodes)`,
    });
  }

  if (cmd === 'nmap') {
    if (!arg) {
      const msg =
        'nmap: missing target IP or hostname. Usage: nmap <target_ip> (e.g., nmap 172.16.40.12)';
      return {
        ...state,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(msg, 'error'),
        ],
        lastFeedbackBanner: msg,
      };
    }

    const targetHost = resolveHostByQuery(arg.split(/\s+/)[0]);
    if (!targetHost) {
      const msg = `nmap: Failed to resolve "${arg}": Host unreachable or outside captured routes.`;
      return {
        ...state,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(msg, 'error'),
        ],
        lastFeedbackBanner: msg,
      };
    }

    const updatedHosts = state.networkHosts.map((h) =>
      h.ip === targetHost.ip ? { ...h, discovered: true, scanned: true } : h
    );

    const svcLines = targetHost.services.map((s) => {
      const portProto = `${s.port}/${s.protocol}`.padEnd(10, ' ');
      const st = s.state.toUpperCase().padEnd(10, ' ');
      const svc = s.service.padEnd(22, ' ');
      const vuln = s.vulnerabilityNote ? `\n    └─ [VECTOR] ${s.vulnerabilityNote}` : '';
      return `  ${portProto} ${st} ${svc} ${s.version}${vuln}`;
    });

    const scanOutput = [
      `Starting GreyOS Nmap 7.95 service scan against ${targetHost.hostname} (${targetHost.ip})...`,
      `Subnet: ${targetHost.subnet} · Current Access: ${targetHost.privilege}`,
      '  PORT       STATE      SERVICE                VERSION',
      ...svcLines,
      `[AUTH / EXPLOIT HINT] ${targetHost.requiredCredentialHint}`,
    ].join('\n');

    return syncCharactersAndFlags({
      ...state,
      selectedNetworkHostIp: targetHost.ip,
      networkHosts: updatedHosts,
      terminalHistory: [
        ...state.terminalHistory,
        cmdLine,
        makeTermLine(scanOutput, 'highlight'),
      ],
      monologueBanner: `Scanned ${targetHost.hostname} (${targetHost.ip}): ${targetHost.services.length} active services fingerprinted.`,
      lastFeedbackBanner: `Nmap Scan Complete: ${targetHost.ip} (${targetHost.hostname})`,
    });
  }

  if (cmd === 'exploit' || cmd === 'ssh') {
    if (!arg) {
      const msg = `${cmd}: missing target host. Usage: ${cmd} <target_ip> (e.g., ${cmd} 172.16.40.12)`;
      return {
        ...state,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(msg, 'error'),
        ],
        lastFeedbackBanner: msg,
      };
    }

    const targetHost = resolveHostByQuery(arg.split(/\s+/)[0]);
    if (!targetHost) {
      const msg = `${cmd}: connect to host ${arg}: Network unreachable.`;
      return {
        ...state,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(msg, 'error'),
        ],
        lastFeedbackBanner: msg,
      };
    }

    if (targetHost.ip === '10.0.2.15') {
      return {
        ...state,
        selectedNetworkHostIp: targetHost.ip,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(
            'Local operator session (eli@apt4b-workstation.local) is already active.',
            'system'
          ),
        ],
      };
    }

    if (targetHost.ip === '10.88.14.9') {
      const msg =
        'ssh/exploit 10.88.14.9: Connection refused by Executive Enclave Hardware HSM. Warning: Running raw `probe 10.88.14.9` will trip Marcus Hale’s SOC honey-trap.';
      return {
        ...state,
        selectedNetworkHostIp: targetHost.ip,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(msg, 'error'),
        ],
        lastFeedbackBanner: msg,
      };
    }

    // Host 172.16.40.12: Port District SIP Relay
    if (targetHost.ip === '172.16.40.12') {
      const hasSmsTrace =
        state.flags.first_choice === 'TRACE_SMS' ||
        targetHost.scanned ||
        arg.toUpperCase().includes('MOTH_RELAY_0');

      if (!hasSmsTrace) {
        const denyMsg =
          'Permission denied (sip-token): Missing relay token. Run `nmap 172.16.40.12` first to fingerprint the Asterisk SIP header token (MOTH_RELAY_0).';
        return {
          ...state,
          selectedNetworkHostIp: targetHost.ip,
          terminalHistory: [
            ...state.terminalHistory,
            cmdLine,
            makeTermLine(denyMsg, 'error'),
          ],
          lastFeedbackBanner: denyMsg,
        };
      }

      const updatedHosts = state.networkHosts.map((h) =>
        h.ip === '172.16.40.12'
          ? {
              ...h,
              discovered: true,
              scanned: true,
              privilege: 'OPERATOR' as const,
              compromised: true,
            }
          : h
      );

      const successMsg =
        '[EXPLOIT SUCCESS — 172.16.40.12] Replayed disposable SIP token MOTH_RELAY_0 -> Privilege escalated to OPERATOR on moth-sip-relay.port.\n  Next: Run `logs 172.16.40.12` to inspect intercepted calls or `pivot 172.16.40.12` to route your traffic through the dark-fiber proxy (-10% Exposure).';
      return syncCharactersAndFlags({
        ...state,
        selectedNetworkHostIp: targetHost.ip,
        networkHosts: updatedHosts,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(successMsg, 'highlight'),
        ],
        monologueBanner:
          'You gained OPERATOR access on the Port District SIP relay (172.16.40.12). You can now inspect its logs or activate an anonymizing proxy tunnel.',
        lastFeedbackBanner:
          'Host Compromised: 172.16.40.12 (OPERATOR Privilege)',
      });
    }

    // Host 10.40.4.18: Municipal Optical Pole #04
    if (targetHost.ip === '10.40.4.18') {
      const hasBadgeOrScan =
        state.inventory.some((i) => i.id === 'item_badge' && i.acquired) ||
        targetHost.scanned ||
        arg.toLowerCase().includes('e.ward_09');

      if (!hasBadgeOrScan) {
        const denyMsg =
          'Authentication failed (nvram-key): Legacy contractor key required. Inspect your Revoked Vespera ID Badge in Apartment 4B or run `nmap 10.40.4.18` first.';
        return {
          ...state,
          selectedNetworkHostIp: targetHost.ip,
          terminalHistory: [
            ...state.terminalHistory,
            cmdLine,
            makeTermLine(denyMsg, 'error'),
          ],
          lastFeedbackBanner: denyMsg,
        };
      }

      const updatedHosts = state.networkHosts.map((h) =>
        h.ip === '10.40.4.18'
          ? {
              ...h,
              discovered: true,
              scanned: true,
              privilege: 'ADMIN' as const,
              compromised: true,
            }
          : h
      );

      const successMsg =
        '[AUTH BYPASS — 10.40.4.18] Authenticated with cached municipal support key (e.ward_09) -> Privilege escalated to ADMIN on muni-cam-sector04.gov.\n  Next: Run `logs 10.40.4.18` to view 4th Ave surveillance feeds or `scrub 10.40.4.18` to wipe your gait/IMEI signature (-10% Exposure, -5% Suspicion).';
      return syncCharactersAndFlags({
        ...state,
        selectedNetworkHostIp: targetHost.ip,
        networkHosts: updatedHosts,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(successMsg, 'highlight'),
        ],
        monologueBanner:
          'Your revoked contractor key e.ward_09 was never purged from Municipal Camera #04’s local NVRAM! You now have ADMIN access to 10.40.4.18.',
        lastFeedbackBanner: 'Host Compromised: 10.40.4.18 (ADMIN Privilege)',
      });
    }

    // Host 10.88.4.22: Vespera Core Edge Gateway 02
    if (targetHost.ip === '10.88.4.22') {
      const hasShadowToken =
        state.evidence.some((e) => e.id === 'EV-03' && e.discovered) ||
        arg.toLowerCase().includes('svc_lantern_sync') ||
        arg.toLowerCase().includes('0x9f4a2c');

      if (!hasShadowToken) {
        const denyMsg =
          'Permission denied (publickey,keyring): Unrevoked shadow session token required. Inspect `/home/eli/Downloads/incident_0427/auth_shadow.dump` (`cat auth_shadow.dump`) first to extract token `svc_lantern_sync`.';
        return {
          ...state,
          selectedNetworkHostIp: targetHost.ip,
          terminalHistory: [
            ...state.terminalHistory,
            cmdLine,
            makeTermLine(denyMsg, 'error'),
          ],
          lastFeedbackBanner: denyMsg,
        };
      }

      const updatedHosts = state.networkHosts.map((h) =>
        h.ip === '10.88.4.22'
          ? {
              ...h,
              discovered: true,
              scanned: true,
              privilege: 'ROOT' as const,
              compromised: true,
            }
          : h
      );

      const successMsg =
        '[ROOT SHELL — 10.88.4.22] Injected shadow token svc_lantern_sync (0x9F4A2C) -> Escalated to ROOT (uid=0) on vespera-edge-gw02.corp.\n  Next: Run `logs 10.88.4.22` or `dump 10.88.4.22` to extract the hardware keyring log proving who reactivated e.ward_09.';
      return syncCharactersAndFlags({
        ...state,
        selectedNetworkHostIp: targetHost.ip,
        networkHosts: updatedHosts,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(successMsg, 'highlight'),
        ],
        monologueBanner:
          'Shadow token svc_lantern_sync granted you a live ROOT session on Vespera Edge Gateway 02 (10.88.4.22).',
        lastFeedbackBanner: 'Host Compromised: 10.88.4.22 (ROOT Privilege)',
      });
    }
  }

  if (cmd === 'logs') {
    const targetHost = resolveHostByQuery(arg.split(/\s+/)[0] || '10.0.2.15');
    if (!targetHost) {
      const msg = `logs: cannot open remote syslog on '${arg}': Host not found.`;
      return {
        ...state,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(msg, 'error'),
        ],
        lastFeedbackBanner: msg,
      };
    }

    if (!targetHost.compromised && !state.debugMode) {
      const denyMsg = `Permission denied: Host ${targetHost.ip} (${targetHost.hostname}) is locked [Privilege: ${targetHost.privilege}]. Run 'nmap ${targetHost.ip}' and 'exploit ${targetHost.ip}' first.`;
      return {
        ...state,
        selectedNetworkHostIp: targetHost.ip,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(denyMsg, 'error'),
        ],
        lastFeedbackBanner: denyMsg,
      };
    }

    const logLines = targetHost.logs.map(
      (l) => `[${l.timestamp}] (${l.source}) ${l.entry}\n  └─ ${l.entryZh}`
    );

    const logEventKey = `event:host_logs:${targetHost.ip}`;
    const isFirstRead = !state.completedEvents.includes(logEventKey);
    let nextTrust = state.flags.trust_nadia;
    let nextCounterProof = state.flags.counter_proof_secured;
    let extraNote = '';

    if (targetHost.ip === '172.16.40.12' && isFirstRead) {
      nextTrust = clampMetric(nextTrust + 5);
      extraNote =
        '\n[INTEL VERIFIED] SIP trunk logs confirm Vespera SOC tapped Nadia’s phone 67 seconds before your anonymous warning arrived (+5% Nadia Trust).';
    } else if (targetHost.ip === '10.88.4.22' && isFirstRead) {
      nextCounterProof = true;
      extraNote =
        '\n[COUNTER-PROOF DISCOVERED] Kernel keyring log proves Director Marcus Hale’s hardware key [M_HALE_SEC_01] forged your e.ward_09 signature!';
    }

    return syncCharactersAndFlags({
      ...state,
      selectedNetworkHostIp: targetHost.ip,
      completedEvents: isFirstRead
        ? [...state.completedEvents, logEventKey]
        : state.completedEvents,
      flags: {
        ...state.flags,
        trust_nadia: nextTrust,
        counter_proof_secured: nextCounterProof,
      },
      terminalHistory: [
        ...state.terminalHistory,
        cmdLine,
        makeTermLine(
          `=== REMOTE SYSLOG DUMP: ${targetHost.hostname} (${targetHost.ip}) ===\n` +
            logLines.join('\n') +
            extraNote,
          'highlight'
        ),
      ],
      lastFeedbackBanner: `Inspected Remote Logs: ${targetHost.hostname}`,
    });
  }

  if (cmd === 'pivot') {
    const targetHost = resolveHostByQuery(arg.split(/\s+/)[0] || '172.16.40.12');
    if (!targetHost || targetHost.ip !== '172.16.40.12') {
      const msg =
        'pivot: Only Port District SIP Relay (172.16.40.12) supports dark-fiber proxy tunneling. Usage: pivot 172.16.40.12';
      return {
        ...state,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(msg, 'error'),
        ],
        lastFeedbackBanner: msg,
      };
    }

    if (!targetHost.compromised && !state.debugMode) {
      const denyMsg =
        'Permission denied: You must gain OPERATOR privilege on 172.16.40.12 first (`nmap 172.16.40.12` then `exploit 172.16.40.12`).';
      return {
        ...state,
        selectedNetworkHostIp: '172.16.40.12',
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(denyMsg, 'error'),
        ],
        lastFeedbackBanner: denyMsg,
      };
    }

    const eventKey = 'event:pivot_172.16.40.12';
    const isFirst = !state.completedEvents.includes(eventKey);
    const nextExposure = isFirst
      ? clampMetric(state.flags.player_exposure - 10)
      : state.flags.player_exposure;

    const updatedHosts = state.networkHosts.map((h) =>
      h.ip === '172.16.40.12' ? { ...h, actionCompleted: true } : h
    );

    return syncCharactersAndFlags({
      ...state,
      selectedNetworkHostIp: '172.16.40.12',
      networkHosts: updatedHosts,
      completedEvents: isFirst
        ? [...state.completedEvents, eventKey]
        : state.completedEvents,
      flags: {
        ...state.flags,
        relay_tunnel_active: true,
        player_exposure: nextExposure,
      },
      terminalHistory: [
        ...state.terminalHistory,
        cmdLine,
        makeTermLine(
          isFirst
            ? '[PROXY TUNNEL ESTABLISHED] Routing Apt 4B traffic through Port District relay 172.16.40.12 (MOTH_RELAY_0) -> Player Exposure reduced by -10%.'
            : '[PROXY TUNNEL] Dark-fiber relay tunnel through 172.16.40.12 is already active.',
          'highlight'
        ),
      ],
      monologueBanner:
        'Your outbound traffic is now masked through the Port District SIP relay (172.16.40.12), cutting your cellular/network exposure by 10%.',
      lastFeedbackBanner: isFirst
        ? 'Proxy Tunnel Active: -10% Player Exposure'
        : 'Proxy Tunnel Already Active',
    });
  }

  if (cmd === 'scrub') {
    const targetHost = resolveHostByQuery(arg.split(/\s+/)[0] || '10.40.4.18');
    if (!targetHost || targetHost.ip !== '10.40.4.18') {
      const msg =
        'scrub: Target must be Municipal Optical Pole #04 Controller (10.40.4.18). Usage: scrub 10.40.4.18';
      return {
        ...state,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(msg, 'error'),
        ],
        lastFeedbackBanner: msg,
      };
    }

    if (!targetHost.compromised && !state.debugMode) {
      const denyMsg =
        'Permission denied: ADMIN privilege required on 10.40.4.18. Run `nmap 10.40.4.18` and `exploit 10.40.4.18` first.';
      return {
        ...state,
        selectedNetworkHostIp: '10.40.4.18',
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(denyMsg, 'error'),
        ],
        lastFeedbackBanner: denyMsg,
      };
    }

    const eventKey = 'event:scrub_10.40.4.18';
    const isFirst = !state.completedEvents.includes(eventKey);
    const nextExposure = isFirst
      ? clampMetric(state.flags.player_exposure - 10)
      : state.flags.player_exposure;
    const nextSuspicion = isFirst
      ? clampMetric(state.flags.corporate_suspicion - 5)
      : state.flags.corporate_suspicion;

    const updatedHosts = state.networkHosts.map((h) =>
      h.ip === '10.40.4.18' ? { ...h, actionCompleted: true } : h
    );

    return syncCharactersAndFlags({
      ...state,
      selectedNetworkHostIp: '10.40.4.18',
      networkHosts: updatedHosts,
      completedEvents: isFirst
        ? [...state.completedEvents, eventKey]
        : state.completedEvents,
      flags: {
        ...state.flags,
        camera_scrubbed: true,
        camera_tracked: false,
        player_exposure: nextExposure,
        corporate_suspicion: nextSuspicion,
      },
      terminalHistory: [
        ...state.terminalHistory,
        cmdLine,
        makeTermLine(
          isFirst
            ? '[NVRAM SCRUB COMPLETE] Purged watchlist #EW-09 & gait hash buffer on 10.40.4.18 (muni-cam-sector04.gov) -> Camera Lock disabled, -10% Exposure, -5% Corporate Suspicion.'
            : '[NVRAM SCRUB] Sector 04 optical buffer is already clean.',
          'highlight'
        ),
      ],
      monologueBanner:
        'You wiped your gait and IMEI hash from Municipal Optical Pole #04’s NVRAM buffer (-10% Exposure, -5% Corporate Suspicion).',
      lastFeedbackBanner: isFirst
        ? 'Camera Buffer Scrubbed: -10% Exposure, -5% Suspicion'
        : 'Camera Buffer Already Scrubbed',
    });
  }

  if (cmd === 'dump') {
    const targetHost = resolveHostByQuery(arg.split(/\s+/)[0] || '10.88.4.22');
    if (!targetHost || targetHost.ip !== '10.88.4.22') {
      const msg =
        'dump: Target must be Vespera Edge Gateway 02 (10.88.4.22). Usage: dump 10.88.4.22';
      return {
        ...state,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(msg, 'error'),
        ],
        lastFeedbackBanner: msg,
      };
    }

    if (!targetHost.compromised && !state.debugMode) {
      const denyMsg =
        'Permission denied: ROOT privilege required on 10.88.4.22. Inspect `auth_shadow.dump` (`cat auth_shadow.dump`) and run `exploit 10.88.4.22` first.';
      return {
        ...state,
        selectedNetworkHostIp: '10.88.4.22',
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(denyMsg, 'error'),
        ],
        lastFeedbackBanner: denyMsg,
      };
    }

    const eventKey = 'event:dump_10.88.4.22';
    const isFirst = !state.completedEvents.includes(eventKey);
    const nextSuspicion = isFirst
      ? clampMetric(state.flags.corporate_suspicion - 5)
      : state.flags.corporate_suspicion;

    const updatedHosts = state.networkHosts.map((h) =>
      h.ip === '10.88.4.22' ? { ...h, actionCompleted: true } : h
    );

    return syncCharactersAndFlags({
      ...state,
      selectedNetworkHostIp: '10.88.4.22',
      networkHosts: updatedHosts,
      completedEvents: isFirst
        ? [...state.completedEvents, eventKey]
        : state.completedEvents,
      flags: {
        ...state.flags,
        counter_proof_secured: true,
        corporate_suspicion: nextSuspicion,
      },
      terminalHistory: [
        ...state.terminalHistory,
        cmdLine,
        makeTermLine(
          isFirst
            ? '[KEYRING FORGERY DUMP SECURED] Extracted /var/log/kern_keyring.log from 10.88.4.22: Hardware YubiKey [M_HALE_SEC_01 — Director Marcus Hale] remotely re-activated e.ward_09 at 01:55:49 AM (-5% Corporate Suspicion).'
            : '[KEYRING DUMP] Hardware keyring forgery proof [M_HALE_SEC_01] is already archived.',
          'highlight'
        ),
      ],
      monologueBanner:
        'You extracted cryptographic proof from Vespera Edge Gateway 02 showing Marcus Hale’s own hardware key [M_HALE_SEC_01] re-activated your old employee ID!',
      lastFeedbackBanner: isFirst
        ? 'Counter-Proof Secured: Marcus Hale Keyring Forgery Logged (-5% Suspicion)'
        : 'Counter-Proof Already Secured',
    });
  }

  // High-risk active network probe command (strictly validates target IP; only 10.88.14.9 triggers the Vespera Enclave honey-trap once)
  if (cmd === 'probe' || cmd === 'ping' || cmd === 'scan') {
    if (!arg) {
      const usageMsg =
        'probe: missing target host or IPv4 address. Usage: probe <target_ip> (e.g., probe 10.88.14.9)';
      return {
        ...state,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(usageMsg, 'error'),
        ],
        lastFeedbackBanner: usageMsg,
      };
    }

    const targetHost = arg.split(/\s+/)[0].trim().toLowerCase();

    // Safe local loopback check
    if (
      targetHost === '127.0.0.1' ||
      targetHost === 'localhost' ||
      targetHost === '10.0.2.15'
    ) {
      return {
        ...state,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(
            `PROBING ${targetHost} (local GreyOS loopback)...\n  INTERFACE lo0 UP — 0ms latency, air-gap filter nominal (no external traffic generated).`,
            'output'
          ),
        ],
        lastFeedbackBanner: `Local interface ${targetHost} verified (0% risk).`,
      };
    }

    // Specific Vespera Executive Enclave gateway honey-trap (10.88.14.9)
    if (targetHost === '10.88.14.9' || targetHost === 'vespera-enclave-gw') {
      const probeKey = 'event:active_probe:10.88.14.9';
      const isFirstProbe = !state.completedEvents.includes(probeKey);
      const nextSuspicion = isFirstProbe
        ? clampMetric(state.flags.corporate_suspicion + 15)
        : state.flags.corporate_suspicion;
      const nextExposure = isFirstProbe
        ? clampMetric(state.flags.player_exposure + 15)
        : state.flags.player_exposure;

      const probedState: DeadAirState = {
        ...state,
        completedEvents: isFirstProbe
          ? [...state.completedEvents, probeKey]
          : state.completedEvents,
        flags: {
          ...state.flags,
          corporate_suspicion: nextSuspicion,
          player_exposure: nextExposure,
        },
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(
            [
              'PROBING 10.88.14.9 (Vespera Executive Enclave VLAN)...',
              '  PORT 443/tcp  OPEN   vespera-enclave-gw (TLS 1.3)',
              '  PORT 8443/tcp OPEN   lantern-sync-controller',
              isFirstProbe
                ? '[IDS HONEY-TRAP TRIGGERED] Unmasked SYN probe logged by Director Marcus Hale’s SOC (+15% Corporate Suspicion, +15% Player Exposure)!'
                : '[IDS WARNING] Subnet canary on 10.88.14.9 already tripped — no additional telemetry delta recorded.',
            ].join('\n'),
            'error'
          ),
        ],
        monologueBanner: isFirstProbe
          ? 'Your active probe against Vespera’s 10.88.14.9 Enclave subnet tripped a canary firewall (+15% Corporate Suspicion, +15% Exposure).'
          : '10.88.14.9 Enclave canary already tripped; repeating the probe did not change your suspicion or exposure.',
        lastFeedbackBanner: isFirstProbe
          ? 'IDS Honey-Trap Tripped: +15% Corporate Suspicion, +15% Player Exposure'
          : 'IDS Canary Already Active (No extra suspicion/exposure added)',
      };

      return syncCharactersAndFlags(probedState);
    }

    // Any other IP or host is unreachable / invalid and does NOT trigger the honey-trap
    const unreachableMsg = `probe: connect to ${targetHost}: Network unreachable or host not routed in local forensic capture.`;
    return {
      ...state,
      terminalHistory: [
        ...state.terminalHistory,
        cmdLine,
        makeTermLine(unreachableMsg, 'error'),
      ],
      lastFeedbackBanner: unreachableMsg,
    };
  }

  if (cmd === 'whoami') {
    return {
      ...state,
      terminalHistory: [
        ...state.terminalHistory,
        cmdLine,
        makeTermLine(
          'eli (uid=1000, former Vespera Data Solutions Support Engineer — revoked ID: e.ward_09)',
          'output'
        ),
      ],
    };
  }

  if (cmd === 'status') {
    const leaveCheck = canTransitionToScene(state, 'STREET_NIGHT');
    return {
      ...state,
      terminalHistory: [
        ...state.terminalHistory,
        cmdLine,
        makeTermLine(
          [
            `Scene               : ${state.currentScene} (${state.clockTime})`,
            `First Phone Choice  : ${state.flags.first_choice || 'PENDING (Required)'}`,
            `Nadia Trust         : ${state.flags.trust_nadia}%`,
            `Corporate Suspicion : ${state.flags.corporate_suspicion}% ${
              state.flags.corporate_suspicion >= 25 ? '[SOC ALERT ACTIVE]' : '[NOMINAL]'
            }`,
            `Player Exposure     : ${state.flags.player_exposure}% ${
              state.flags.camera_tracked
                ? '[CAMERA LOCKED]'
                : state.flags.camera_tracking_risk
                ? '[OPTICAL TRACKING RISK]'
                : '[LOW]'
            }`,
            `Evidence Logged     : ${state.flags.evidence_count} / 6`,
            `Timeline Correlated : ${state.flags.timeline_correlated ? 'YES' : 'NO (Run verify)'}`,
            `MOTH Archive Key    : ${hasMothArchiveKey(state) ? 'MOUNTED' : 'MISSING'}`,
            `4th Ave Exit Status : ${leaveCheck.allowed ? 'READY' : leaveCheck.reason}`,
          ].join('\n'),
          'highlight'
        ),
      ],
    };
  }

  if (cmd === 'ls') {
    const dirToQuery = arg
      ? arg.startsWith('/')
        ? arg.replace(/\/+$/, '')
        : `${state.currentDir}/${arg}`.replace(/\/+/g, '/').replace(/\/+$/, '')
      : state.currentDir;

    const validDirs = [
      '/home/eli',
      '/home/eli/Downloads',
      '/home/eli/Downloads/incident_0427',
      '/home/eli/Documents',
      '/home/eli/archive_vault',
    ];

    if (!validDirs.includes(dirToQuery)) {
      return {
        ...state,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(
            `ls: cannot access '${arg}': File or directory not found`,
            'error'
          ),
        ],
      };
    }

    const matching = state.files.filter((f) => f.parentDir === dirToQuery);
    const subdirs: string[] = [];
    if (dirToQuery === '/home/eli') {
      subdirs.push('Downloads/', 'Documents/', 'archive_vault/');
    } else if (dirToQuery === '/home/eli/Downloads') {
      subdirs.push('incident_0427/');
    }

    const lines = [
      ...subdirs.map((d) => `drwxr-xr-x  eli  eli   4096  ${d}`),
      ...matching.map((f) => {
        const access = canAccessVirtualFile(state, f);
        const isDiscovered = f.unlocksEvidenceId
          ? state.evidence.find((e) => e.id === f.unlocksEvidenceId)?.discovered
          : state.inspectedFiles.includes(f.path);
        const tag = !access.allowed
          ? '[LOCKED - KEY/SCENE REQUIRED]'
          : isDiscovered
          ? `[VERIFIED ${f.unlocksEvidenceId || ''}]`
          : '[UNINSPECTED]';
        return `-rw-r--r--  eli  eli  ${f.size.padStart(6, ' ')}  ${f.modifiedAt}  ${f.name}  ${tag}`;
      }),
    ];

    return {
      ...state,
      terminalHistory: [
        ...state.terminalHistory,
        cmdLine,
        makeTermLine(
          lines.length > 0 ? lines.join('\n') : '(directory empty)',
          'output'
        ),
      ],
    };
  }

  if (cmd === 'cd') {
    if (!arg || arg === '~') {
      return {
        ...state,
        currentDir: '/home/eli',
        terminalHistory: [...state.terminalHistory, cmdLine],
      };
    }
    if (arg === '..') {
      const segments = state.currentDir.split('/').filter(Boolean);
      segments.pop();
      const nextDir = '/' + segments.join('/');
      const resolved =
        nextDir === '/' || nextDir === '/home' ? '/home/eli' : nextDir;
      return {
        ...state,
        currentDir: resolved,
        terminalHistory: [...state.terminalHistory, cmdLine],
      };
    }
    const candidate = arg.startsWith('/')
      ? arg.replace(/\/+$/, '')
      : `${state.currentDir}/${arg}`.replace(/\/+/g, '/').replace(/\/+$/, '');
    const validDirs = [
      '/home/eli',
      '/home/eli/Downloads',
      '/home/eli/Downloads/incident_0427',
      '/home/eli/Documents',
      '/home/eli/archive_vault',
    ];
    if (validDirs.includes(candidate)) {
      return {
        ...state,
        currentDir: candidate,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(`Changed directory to ${candidate}`, 'system'),
        ],
      };
    }
    return {
      ...state,
      terminalHistory: [
        ...state.terminalHistory,
        cmdLine,
        makeTermLine(`cd: ${arg}: File or directory not found`, 'error'),
      ],
    };
  }

  if (cmd === 'unzip') {
    if (arg && !arg.includes('incident_0427')) {
      return {
        ...state,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(
            `unzip: cannot find or open ${arg}: Corrupted archive or file not found.`,
            'error'
          ),
        ],
      };
    }
    return {
      ...state,
      currentDir: '/home/eli/Downloads/incident_0427',
      terminalHistory: [
        ...state.terminalHistory,
        cmdLine,
        makeTermLine(
          [
            'Archive:  incident_0427.zip (SHA-256: 9f84c2a1...e04b)',
            '  inflating: /home/eli/Downloads/incident_0427/ntp_override.conf',
            '  inflating: /home/eli/Downloads/incident_0427/access_0427.log',
            '  inflating: /home/eli/Downloads/incident_0427/auth_shadow.dump',
            '  inflating: /home/eli/Downloads/incident_0427/lantern_schema_brief.txt',
            '[INFO] Working directory switched to /home/eli/Downloads/incident_0427',
          ].join('\n'),
          'highlight'
        ),
      ],
    };
  }

  if (cmd === 'verify' || cmd === 'timeline') {
    const withCmd = {
      ...state,
      terminalHistory: [...state.terminalHistory, cmdLine],
    };
    return correlateEvidenceTimeline(withCmd);
  }

  const resolveFileByArg = (fileQuery: string): VirtualFileEntry | undefined => {
    if (!fileQuery) return undefined;
    const normalized = fileQuery.trim().toLowerCase();
    return state.files.find(
      (f) =>
        f.name.toLowerCase() === normalized ||
        f.path.toLowerCase() === normalized ||
        `${state.currentDir}/${f.name}`.toLowerCase() === normalized
    );
  };

  if (cmd === 'stat') {
    const targetFile = resolveFileByArg(arg);
    if (!targetFile) {
      return {
        ...state,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(
            `stat: cannot stat '${arg || '(missing operand)'}': File not found`,
            'error'
          ),
        ],
      };
    }
    const access = canAccessVirtualFile(state, targetFile);
    if (!access.allowed) {
      return {
        ...state,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(access.error, 'error'),
        ],
      };
    }
    const isDiscovered = targetFile.unlocksEvidenceId
      ? state.evidence.find((e) => e.id === targetFile.unlocksEvidenceId)
          ?.discovered
      : false;
    return {
      ...state,
      terminalHistory: [
        ...state.terminalHistory,
        cmdLine,
        makeTermLine(
          [
            `  File: ${targetFile.path}`,
            `  Size: ${targetFile.size}   Modify: ${targetFile.modifiedAt}`,
            `  Inode: 409281   Access: (0640/-rw-r-----)  Uid: (1000/eli)`,
            `  Forensic Artifact: ${targetFile.unlocksEvidenceId || 'None'} (${
              isDiscovered ? 'DISCOVERED' : 'UNINSPECTED'
            })`,
          ].join('\n'),
          'output'
        ),
      ],
    };
  }

  if (cmd === 'grep') {
    const subParts = arg.split(/\s+/).filter(Boolean);
    if (subParts.length < 2) {
      return {
        ...state,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine('Usage: grep <pattern> <file>', 'error'),
        ],
      };
    }
    const pattern = subParts[0];
    const fileArg = subParts.slice(1).join(' ');
    const targetFile = resolveFileByArg(fileArg);
    if (!targetFile) {
      return {
        ...state,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(`grep: ${fileArg}: File not found`, 'error'),
        ],
      };
    }
    const access = canAccessVirtualFile(state, targetFile);
    if (!access.allowed) {
      return {
        ...state,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(access.error, 'error'),
        ],
      };
    }
    const matchedLines = targetFile.content
      .split('\n')
      .filter((line) => line.toLowerCase().includes(pattern.toLowerCase()));
    const nextWithInspect = inspectVirtualFile(state, targetFile.path);
    return {
      ...nextWithInspect,
      terminalHistory: [
        ...nextWithInspect.terminalHistory,
        makeTermLine(
          matchedLines.length > 0
            ? `[GREP MATCH '${pattern}']:\n` + matchedLines.join('\n')
            : `(no lines matched '${pattern}')`,
          'highlight'
        ),
      ],
    };
  }

  if (cmd === 'cat') {
    if (!arg) {
      return {
        ...state,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine('cat: missing file operand', 'error'),
        ],
      };
    }
    const targetFile = resolveFileByArg(arg);
    if (!targetFile) {
      return {
        ...state,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(`cat: ${arg}: File not found`, 'error'),
        ],
      };
    }
    return inspectVirtualFile(state, targetFile.path);
  }

  return {
    ...state,
    terminalHistory: [
      ...state.terminalHistory,
      cmdLine,
      makeTermLine(
        `greyos: command not found: ${cmd}. Type 'help' for forensic shell commands.`,
        'error'
      ),
    ],
  };
}
