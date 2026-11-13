import { DeadAirState, TerminalOutputLine, VirtualFileEntry } from '../game/types';
import { UnlockedCapabilityId } from '../learning/lessonTypes';
import { getLessonById } from '../data/learningMissions';
import { hasUnlockedCapability } from '../learning/learningProgress';
import {
  analyzeCanaryAndHoneypot,
  analyzeContainerAndBinary,
  analyzeHsmAndKeyring,
  analyzePersistenceAndMetadata,
  analyzeTlsFingerprinting,
  formatForensicReportForTerminal,
} from './tacticalEngine';

export interface TacticalCommandDescriptor {
  command: 'persist-audit' | 'ja4-inspect' | 'canary-check' | 'hsm-verify' | 'bin-audit';
  lessonId: string;
  requiredCapability: UnlockedCapabilityId;
  usage: string;
  summary: string;
}

export const TACTICAL_COMMAND_REGISTRY: Record<
  TacticalCommandDescriptor['command'],
  TacticalCommandDescriptor
> = {
  'persist-audit': {
    command: 'persist-audit',
    lessonId: 'lesson_08_persistence',
    requiredCapability: 'persistence_auditor',
    usage:
      'persist-audit [--inspect | --quarantine vespera-Support-sync.timer | --sanitize-copy incident_0427_brief.pdf]',
    summary:
      'Audits user-level systemd timers and scrubs identifying PDF/XMP metadata into a .clean.pdf copy.',
  },
  'ja4-inspect': {
    command: 'ja4-inspect',
    lessonId: 'lesson_09_tls_fingerprinting',
    requiredCapability: 'tls_fingerprint_inspector',
    usage: 'ja4-inspect [captured_tls_0427]',
    summary:
      'Computes canonical sorted JA4 ClientHello fingerprints and verifies passive TCP handshake state.',
  },
  'canary-check': {
    command: 'canary-check',
    lessonId: 'lesson_10_counter_deception',
    requiredCapability: 'canary_inspector',
    usage: 'canary-check [incident_0427_brief.pdf | 10.88.14.9]',
    summary:
      'Statically detects embedded document Canary Tokens and evaluates passive honeypot telemetry.',
  },
  'hsm-verify': {
    command: 'hsm-verify',
    lessonId: 'lesson_11_hsm_forensics',
    requiredCapability: 'hsm_verifier',
    usage: 'hsm-verify [access_0427.log | kern_keyring.log]',
    summary:
      'Verifies PKCS#11 ECDSA-P256 signatures, Key ID (M_HALE_SEC_01), soft-token flags, and hardware attestation.',
  },
  'bin-audit': {
    command: 'bin-audit',
    lessonId: 'lesson_12_container_binary',
    requiredCapability: 'binary_container_analyzer',
    usage:
      'bin-audit [lantern-syncd | --container lantern-collector.json | --trace lantern-syncd.trace | --all]',
    summary:
      'Audits ELF binary symbols/mitigations, CIS Docker escape risks, and pre-recorded eBPF syscall traces.',
  },
};

function makeLine(
  text: string,
  tone: TerminalOutputLine['tone'] = 'output'
): TerminalOutputLine {
  return {
    id: `tactical-cmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    tone,
  };
}

function clamp(val: number): number {
  return Math.min(100, Math.max(0, Math.round(val)));
}

function syncNadiaCharacterTrust(
  state: DeadAirState,
  nextTrust: number
): DeadAirState['characters'] {
  return state.characters.map((c) =>
    c.id === 'nadia' ? { ...c, trust: nextTrust } : c
  );
}

function appendError(
  state: DeadAirState,
  rawCmdLine: string,
  errorText: string
): DeadAirState {
  return {
    ...state,
    terminalHistory: [
      ...state.terminalHistory,
      makeLine(`eli@greyos:${state.currentDir}$ ${rawCmdLine}`, 'command'),
      makeLine(errorText, 'error'),
    ],
    lastFeedbackBanner: errorText,
  };
}

function ensureSanitizedBriefCopy(files: VirtualFileEntry[]): VirtualFileEntry[] {
  const cleanPath = '/home/eli/Documents/incident_0427_brief.clean.pdf';
  if (files.some((f) => f.path === cleanPath)) {
    return files;
  }
  const cleanEntry: VirtualFileEntry = {
    name: 'incident_0427_brief.clean.pdf',
    path: cleanPath,
    parentDir: '/home/eli/Documents',
    size: '398.4 KB',
    modifiedAt: 'Just now (Sanitized Copy)',
    unlocked: true,
    content: `%PDF-1.7 [SANITIZED FORENSIC COPY — METADATA & CANARY SCRUBBED]
Title: Gateway Audit Summary (Incident 0427)
/Author (REDACTED)
/Creator (GreyOS Metadata Scrubber // Clean Export)
/Producer (Standard PDF Library)
/OpenAction (REMOVED_CANARY_URI)
# VERIFIED CLEAN COPY: Safe for external transmission to journalist Rhea Solis. Original file /home/eli/Documents/incident_0427_brief.pdf preserved intact.`,
  };
  return [...files, cleanEntry];
}

function handlePersistAudit(
  state: DeadAirState,
  rawArgs: string,
  rawCmdLine: string
): DeadAirState {
  const trimmed = rawArgs.trim();
  const analysis = analyzePersistenceAndMetadata();

  // 1. Inspect-only mode: outputs findings without setting completion flags
  if (
    trimmed === '--inspect' ||
    trimmed.startsWith('--inspect-units') ||
    trimmed.startsWith('--inspect-metadata')
  ) {
    const reportText = formatForensicReportForTerminal(analysis.report);
    return {
      ...state,
      terminalHistory: [
        ...state.terminalHistory,
        makeLine(`eli@greyos:${state.currentDir}$ ${rawCmdLine}`, 'command'),
        makeLine(reportText, 'output'),
        makeLine(
          'Next step: run `persist-audit --quarantine vespera-Support-sync.timer` and `persist-audit --sanitize-copy incident_0427_brief.pdf` to isolate the beacon and generate a clean PDF copy.',
          'highlight'
        ),
      ],
      lastFeedbackBanner:
        'Persistence & Metadata inspection complete. Quarantine timer and sanitize PDF copy to secure workstation.',
    };
  }

  // 2. Quarantine systemd timer only
  if (trimmed.startsWith('--quarantine')) {
    const target = trimmed.replace(/^--quarantine\s*/, '').trim();
    if (
      target !== 'vespera-Support-sync.timer' &&
      target !== 'vespera-Support-sync.service' &&
      target !== '/home/eli/.config/systemd/user/vespera-Support-sync.timer'
    ) {
      return appendError(
        state,
        rawCmdLine,
        `persist-audit: unknown or non-malicious systemd unit '${target || '(missing unit)'}'. Expected: vespera-Support-sync.timer`
      );
    }

    const eventKey = 'event:tactical:persist_quarantine';
    const alreadyQuarantined =
      state.flags.persistence_audit_completed ||
      state.completedEvents.includes(eventKey);
    const nextExposure = alreadyQuarantined
      ? state.flags.player_exposure
      : clamp(state.flags.player_exposure - 5);
    const bothDone =
      true && state.flags.metadata_protection_completed;
    const nextApplied =
      bothDone &&
      !state.learning.appliedStoryLessons.includes('lesson_08_persistence')
        ? [...state.learning.appliedStoryLessons, 'lesson_08_persistence']
        : state.learning.appliedStoryLessons;

    const msg = alreadyQuarantined
      ? '[PERSIST-AUDIT] vespera-Support-sync.timer is already isolated in quarantine (idempotent).'
      : `[PERSIST-AUDIT — QUARANTINED] Disabled & masked /home/eli/.config/systemd/user/vespera-Support-sync.timer (Beacon 198.51.100.204:8443 severed | Player Exposure -5%).`;

    return {
      ...state,
      completedEvents: state.completedEvents.includes(eventKey)
        ? state.completedEvents
        : [...state.completedEvents, eventKey],
      flags: {
        ...state.flags,
        persistence_audit_completed: true,
        player_exposure: nextExposure,
      },
      learning: {
        ...state.learning,
        appliedStoryLessons: nextApplied,
      },
      terminalHistory: [
        ...state.terminalHistory,
        makeLine(`eli@greyos:${state.currentDir}$ ${rawCmdLine}`, 'command'),
        makeLine(msg, 'highlight'),
      ],
      monologueBanner: msg,
      lastFeedbackBanner: msg,
    };
  }

  // 3. Sanitize PDF metadata copy only (preserving original file)
  if (trimmed.startsWith('--sanitize-copy')) {
    const target = trimmed.replace(/^--sanitize-copy\s*/, '').trim();
    if (
      target !== 'incident_0427_brief.pdf' &&
      target !== '/home/eli/Documents/incident_0427_brief.pdf'
    ) {
      return appendError(
        state,
        rawCmdLine,
        `persist-audit: target file '${target || '(missing file)'}' not found or unsupported. Expected: incident_0427_brief.pdf`
      );
    }

    const eventKey = 'event:tactical:metadata_sanitize';
    const alreadySanitized =
      state.flags.metadata_protection_completed ||
      state.completedEvents.includes(eventKey);
    const nextSuspicion = alreadySanitized
      ? state.flags.corporate_suspicion
      : clamp(state.flags.corporate_suspicion - 5);
    const nextExposure = alreadySanitized
      ? state.flags.player_exposure
      : clamp(state.flags.player_exposure - 5);
    const nextTrust = alreadySanitized
      ? state.flags.trust_nadia
      : clamp(state.flags.trust_nadia + 5);

    const nextFiles = ensureSanitizedBriefCopy(state.files);
    const bothDone =
      state.flags.persistence_audit_completed && true;
    const nextApplied =
      bothDone &&
      !state.learning.appliedStoryLessons.includes('lesson_08_persistence')
        ? [...state.learning.appliedStoryLessons, 'lesson_08_persistence']
        : state.learning.appliedStoryLessons;

    const msg = alreadySanitized
      ? '[PERSIST-AUDIT] Sanitized copy /home/eli/Documents/incident_0427_brief.clean.pdf already verified; original file preserved.'
      : `[PERSIST-AUDIT — SANITIZED COPY CREATED] Stripped e.ward_09, apt4b-workstation, and VSP-EMP-00492 tags -> wrote /home/eli/Documents/incident_0427_brief.clean.pdf (Original PDF preserved intact | Suspicion -5%, Exposure -5%, Nadia Trust +5%).`;

    return {
      ...state,
      files: nextFiles,
      characters: syncNadiaCharacterTrust(state, nextTrust),
      completedEvents: state.completedEvents.includes(eventKey)
        ? state.completedEvents
        : [...state.completedEvents, eventKey],
      flags: {
        ...state.flags,
        metadata_protection_completed: true,
        corporate_suspicion: nextSuspicion,
        player_exposure: nextExposure,
        trust_nadia: nextTrust,
      },
      learning: {
        ...state.learning,
        appliedStoryLessons: nextApplied,
      },
      terminalHistory: [
        ...state.terminalHistory,
        makeLine(`eli@greyos:${state.currentDir}$ ${rawCmdLine}`, 'command'),
        makeLine(msg, 'highlight'),
      ],
      monologueBanner: msg,
      lastFeedbackBanner: msg,
    };
  }

  // 4. Composite execution (bare `persist-audit` or `--all`)
  if (trimmed === '' || trimmed === '--all') {
    const qEventKey = 'event:tactical:persist_quarantine';
    const mEventKey = 'event:tactical:metadata_sanitize';
    const wasQuarantined =
      state.flags.persistence_audit_completed ||
      state.completedEvents.includes(qEventKey);
    const wasSanitized =
      state.flags.metadata_protection_completed ||
      state.completedEvents.includes(mEventKey);

    const exposureDelta = (wasQuarantined ? 0 : -5) + (wasSanitized ? 0 : -5);
    const suspicionDelta = wasSanitized ? 0 : -5;
    const trustDelta = wasSanitized ? 0 : 5;

    const nextSuspicion = clamp(
      state.flags.corporate_suspicion + suspicionDelta
    );
    const nextExposure = clamp(state.flags.player_exposure + exposureDelta);
    const nextTrust = clamp(state.flags.trust_nadia + trustDelta);
    const nextFiles = ensureSanitizedBriefCopy(state.files);

    const nextCompletedEvents = Array.from(
      new Set([
        ...state.completedEvents,
        qEventKey,
        mEventKey,
        'event:capability_applied:lesson_08_persistence',
      ])
    );
    const nextApplied = state.learning.appliedStoryLessons.includes(
      'lesson_08_persistence'
    )
      ? state.learning.appliedStoryLessons
      : [...state.learning.appliedStoryLessons, 'lesson_08_persistence'];

    const reportText = formatForensicReportForTerminal(analysis.report);
    const summaryMsg =
      wasQuarantined && wasSanitized
        ? '[PERSIST-AUDIT] Both systemd timer quarantine and incident_0427_brief.clean.pdf sanitization are already active.'
        : '[PERSIST-AUDIT COMPLETE] Isolated vespera-Support-sync.timer AND created sanitized copy /home/eli/Documents/incident_0427_brief.clean.pdf (Original PDF preserved).';

    return {
      ...state,
      files: nextFiles,
      characters: syncNadiaCharacterTrust(state, nextTrust),
      completedEvents: nextCompletedEvents,
      flags: {
        ...state.flags,
        persistence_audit_completed: true,
        metadata_protection_completed: true,
        corporate_suspicion: nextSuspicion,
        player_exposure: nextExposure,
        trust_nadia: nextTrust,
      },
      learning: {
        ...state.learning,
        appliedStoryLessons: nextApplied,
      },
      terminalHistory: [
        ...state.terminalHistory,
        makeLine(`eli@greyos:${state.currentDir}$ ${rawCmdLine}`, 'command'),
        makeLine(reportText, 'output'),
        makeLine(summaryMsg, 'highlight'),
      ],
      monologueBanner: summaryMsg,
      lastFeedbackBanner: summaryMsg,
    };
  }

  return appendError(
    state,
    rawCmdLine,
    `persist-audit: invalid option '${trimmed}'. Usage: ${TACTICAL_COMMAND_REGISTRY['persist-audit'].usage}`
  );
}

function handleJa4Inspect(
  state: DeadAirState,
  rawArgs: string,
  rawCmdLine: string
): DeadAirState {
  const trimmed = rawArgs.trim();
  const normalizedTarget = trimmed
    .replace(/^--pcap\s+/, '')
    .replace(/^--flow-telemetry\s+/, '')
    .replace(/\s+--canonical-sort$/, '')
    .trim();

  if (
    normalizedTarget !== '' &&
    normalizedTarget !== 'captured_tls_0427' &&
    normalizedTarget !== 'captured_tls_0427.pcap' &&
    normalizedTarget !== '10.88.10.5'
  ) {
    return appendError(
      state,
      rawCmdLine,
      `ja4-inspect: capture artifact '${trimmed}' not found in passive PCAP store. Expected: captured_tls_0427`
    );
  }

  const analysis = analyzeTlsFingerprinting();
  const reportText = formatForensicReportForTerminal(analysis.report);
  const eventKey = 'event:tactical:tls_attribution';
  const alreadyVerified =
    state.flags.tls_attribution_verified ||
    state.completedEvents.includes(eventKey);

  const nextSuspicion = alreadyVerified
    ? state.flags.corporate_suspicion
    : clamp(state.flags.corporate_suspicion - 5);
  const nextTrust = alreadyVerified
    ? state.flags.trust_nadia
    : clamp(state.flags.trust_nadia + 5);

  const nextCompletedEvents = Array.from(
    new Set([
      ...state.completedEvents,
      eventKey,
      'event:capability_applied:lesson_09_tls_fingerprinting',
    ])
  );
  const nextApplied = state.learning.appliedStoryLessons.includes(
    'lesson_09_tls_fingerprinting'
  )
    ? state.learning.appliedStoryLessons
    : [...state.learning.appliedStoryLessons, 'lesson_09_tls_fingerprinting'];

  const summaryMsg = alreadyVerified
    ? `[JA4-INSPECT] TLS ClientHello attribution (${analysis.computedJa4}) is already verified in your investigation log.`
    : `[JA4-INSPECT VERIFIED] Canonical JA4 (${analysis.computedJa4}) & single-port TCP 3-way handshake confirmed on captured_tls_0427 — refuting Vespera SOC scanner fabrication (Suspicion -5%, Nadia Trust +5%).`;

  return {
    ...state,
    characters: syncNadiaCharacterTrust(state, nextTrust),
    completedEvents: nextCompletedEvents,
    flags: {
      ...state.flags,
      tls_attribution_verified: true,
      corporate_suspicion: nextSuspicion,
      trust_nadia: nextTrust,
    },
    learning: {
      ...state.learning,
      appliedStoryLessons: nextApplied,
    },
    terminalHistory: [
      ...state.terminalHistory,
      makeLine(`eli@greyos:${state.currentDir}$ ${rawCmdLine}`, 'command'),
      makeLine(reportText, 'output'),
      makeLine(summaryMsg, 'highlight'),
    ],
    monologueBanner: summaryMsg,
    lastFeedbackBanner: summaryMsg,
  };
}

function handleCanaryCheck(
  state: DeadAirState,
  rawArgs: string,
  rawCmdLine: string
): DeadAirState {
  const trimmed = rawArgs
    .trim()
    .replace(/^--file\s+/, '')
    .replace(/^--host\s+/, '')
    .replace(/\s+--passive-profile$/, '')
    .trim();

  if (
    trimmed !== '' &&
    trimmed !== 'incident_0427_brief.pdf' &&
    trimmed !== '/home/eli/Documents/incident_0427_brief.pdf' &&
    trimmed !== '10.88.14.9' &&
    trimmed !== 'vespera-enclave-gw'
  ) {
    return appendError(
      state,
      rawCmdLine,
      `canary-check: invalid target '${trimmed}'. Expected: incident_0427_brief.pdf or 10.88.14.9`
    );
  }

  const analysis = analyzeCanaryAndHoneypot();
  const reportText = formatForensicReportForTerminal(analysis.report);
  const eventKey = 'event:tactical:canary_identified';
  const alreadyIdentified =
    state.flags.canary_identified || state.completedEvents.includes(eventKey);

  const nextSuspicion = alreadyIdentified
    ? state.flags.corporate_suspicion
    : clamp(state.flags.corporate_suspicion - 5);
  const nextExposure = alreadyIdentified
    ? state.flags.player_exposure
    : clamp(state.flags.player_exposure - 5);
  const nextTrust = alreadyIdentified
    ? state.flags.trust_nadia
    : clamp(state.flags.trust_nadia + 5);

  const nextCompletedEvents = Array.from(
    new Set([
      ...state.completedEvents,
      eventKey,
      'event:capability_applied:lesson_10_counter_deception',
    ])
  );
  const nextApplied = state.learning.appliedStoryLessons.includes(
    'lesson_10_counter_deception'
  )
    ? state.learning.appliedStoryLessons
    : [...state.learning.appliedStoryLessons, 'lesson_10_counter_deception'];

  const summaryMsg = alreadyIdentified
    ? '[CANARY-CHECK] Canary token CANARY-VSP-0427-ELI and Honeypot 10.88.14.9 are already flagged in your tactical log.'
    : '[CANARY-CHECK VERIFIED] Flagged embedded PDF Canary Token (CANARY-VSP-0427-ELI) and confirmed 10.88.14.9 is a live Vespera SOC Honeypot (98/100 deception score | Suspicion -5%, Exposure -5%, Nadia Trust +5%). WARNING: Do NOT actively run `probe 10.88.14.9`!';

  return {
    ...state,
    characters: syncNadiaCharacterTrust(state, nextTrust),
    completedEvents: nextCompletedEvents,
    flags: {
      ...state.flags,
      canary_identified: true,
      corporate_suspicion: nextSuspicion,
      player_exposure: nextExposure,
      trust_nadia: nextTrust,
    },
    learning: {
      ...state.learning,
      appliedStoryLessons: nextApplied,
    },
    terminalHistory: [
      ...state.terminalHistory,
      makeLine(`eli@greyos:${state.currentDir}$ ${rawCmdLine}`, 'command'),
      makeLine(reportText, 'output'),
      makeLine(summaryMsg, 'highlight'),
    ],
    monologueBanner: summaryMsg,
    lastFeedbackBanner: summaryMsg,
  };
}

function handleHsmVerify(
  state: DeadAirState,
  rawArgs: string,
  rawCmdLine: string
): DeadAirState {
  const trimmed = rawArgs
    .trim()
    .replace(/^--inspect-slot\s+0x02\s+--artifact\s+/, '')
    .replace(/^--keyring-timeline\s+/, '')
    .trim();

  if (
    trimmed !== '' &&
    trimmed !== 'access_0427.log' &&
    trimmed !== '/home/eli/Downloads/incident_0427/access_0427.log' &&
    trimmed !== 'kern_keyring.log' &&
    trimmed !== '/var/log/kern_keyring.log' &&
    trimmed !== 'auth_shadow.dump'
  ) {
    return appendError(
      state,
      rawCmdLine,
      `hsm-verify: target '${trimmed}' does not contain a detached PKCS#11 signature block. Expected: access_0427.log or kern_keyring.log`
    );
  }

  const analysis = analyzeHsmAndKeyring();
  const reportText = formatForensicReportForTerminal(analysis.report);
  const breakdownLines = [
    '--- PKCS#11 FOUR-LAYER CRYPTOGRAPHIC BREAKDOWN ---',
    `  1. Signature Math       : ${analysis.verificationBreakdown.signatureMathValid ? 'VALID (ECDSA-P256 verified against public key)' : 'INVALID'}`,
    `  2. Signing Key ID       : ${analysis.verificationBreakdown.signingKeyId} (${analysis.verificationBreakdown.keyOwner})`,
    `  3. Token Slot Metadata  : ${analysis.verificationBreakdown.tokenMetadata}`,
    `  4. Hardware Attestation : ${analysis.verificationBreakdown.hardwareAttestationStatus}`,
    `  5. Plaintext Log Splice : ${analysis.verificationBreakdown.attributedActorInPlaintextLog} (Framing Mismatch Confirmed)`,
  ].join('\n');

  const eventKey = 'event:tactical:hsm_verified';
  const alreadyVerified =
    state.flags.hsm_signature_verified ||
    state.completedEvents.includes(eventKey);

  const nextSuspicion = alreadyVerified
    ? state.flags.corporate_suspicion
    : clamp(state.flags.corporate_suspicion - 5);
  const nextTrust = alreadyVerified
    ? state.flags.trust_nadia
    : clamp(state.flags.trust_nadia + 10);

  const nextCompletedEvents = Array.from(
    new Set([
      ...state.completedEvents,
      eventKey,
      'event:capability_applied:lesson_11_hsm_forensics',
    ])
  );
  const nextApplied = state.learning.appliedStoryLessons.includes(
    'lesson_11_hsm_forensics'
  )
    ? state.learning.appliedStoryLessons
    : [...state.learning.appliedStoryLessons, 'lesson_11_hsm_forensics'];

  const summaryMsg = alreadyVerified
    ? '[HSM-VERIFY] PKCS#11 signature & soft-token rotation audit for M_HALE_SEC_01 is already recorded.'
    : '[HSM-VERIFY COMPLETE] Verified ECDSA-P256 signature belongs to Key ID M_HALE_SEC_01 (Marcus Hale) injected via SoftHSM-Emulator (CKF_HW_SLOT=false, Attestation: MISSING) while splicing e.ward_09 into access_0427.log (Suspicion -5%, Nadia Trust +10%).';

  return {
    ...state,
    characters: syncNadiaCharacterTrust(state, nextTrust),
    completedEvents: nextCompletedEvents,
    flags: {
      ...state.flags,
      hsm_signature_verified: true,
      corporate_suspicion: nextSuspicion,
      trust_nadia: nextTrust,
    },
    learning: {
      ...state.learning,
      appliedStoryLessons: nextApplied,
    },
    terminalHistory: [
      ...state.terminalHistory,
      makeLine(`eli@greyos:${state.currentDir}$ ${rawCmdLine}`, 'command'),
      makeLine(`${reportText}\n\n${breakdownLines}`, 'output'),
      makeLine(summaryMsg, 'highlight'),
    ],
    monologueBanner: summaryMsg,
    lastFeedbackBanner: summaryMsg,
  };
}

function handleBinAudit(
  state: DeadAirState,
  rawArgs: string,
  rawCmdLine: string
): DeadAirState {
  const trimmed = rawArgs.trim();

  const elfTargets = new Set([
    'lantern-syncd',
    '--elf lantern-syncd',
    '/home/eli/Downloads/incident_0427/lantern-syncd',
    '--elf /home/eli/Downloads/incident_0427/lantern-syncd',
  ]);
  const containerTargets = new Set([
    '--container lantern-collector.json',
    '--container /home/eli/Downloads/incident_0427/lantern-collector.json',
  ]);
  const traceTargets = new Set([
    '--trace lantern-syncd.trace',
    '--trace /home/eli/Downloads/incident_0427/lantern-syncd.trace',
  ]);
  const containerAndTraceTargets = new Set([
    '--container lantern-collector.json --trace lantern-syncd.trace',
  ]);
  const explicitAllTargets = new Set([
    '--all',
    '--correlate-all',
    'lantern-syncd --container lantern-collector.json --trace lantern-syncd.trace',
  ]);

  let mode: 'elf' | 'container' | 'trace' | 'all' | 'container_and_trace' | null =
    null;
  if (elfTargets.has(trimmed)) {
    mode = 'elf';
  } else if (containerTargets.has(trimmed)) {
    mode = 'container';
  } else if (traceTargets.has(trimmed)) {
    mode = 'trace';
  } else if (containerAndTraceTargets.has(trimmed)) {
    mode = 'container_and_trace';
  } else if (explicitAllTargets.has(trimmed)) {
    mode = 'all';
  }

  if (!mode) {
    return appendError(
      state,
      rawCmdLine,
      `bin-audit: unsupported or missing target '${trimmed || '(empty)'}'. Usage: ${TACTICAL_COMMAND_REGISTRY['bin-audit'].usage}`
    );
  }

  const elfEvent = 'event:tactical:bin_audit_elf';
  const containerEvent = 'event:tactical:bin_audit_container';
  const traceEvent = 'event:tactical:bin_audit_trace';
  const masterEvent = 'event:tactical:lantern_binary_analyzed';

  const addedSubEvents: string[] = [];
  if (mode === 'elf' || mode === 'all') {
    addedSubEvents.push(elfEvent);
  }
  if (
    mode === 'container' ||
    mode === 'container_and_trace' ||
    mode === 'all'
  ) {
    addedSubEvents.push(containerEvent);
  }
  if (mode === 'trace' || mode === 'container_and_trace' || mode === 'all') {
    addedSubEvents.push(traceEvent);
  }

  const combinedEvents = Array.from(
    new Set([...state.completedEvents, ...addedSubEvents])
  );

  const hasElf = combinedEvents.includes(elfEvent);
  const hasContainer = combinedEvents.includes(containerEvent);
  const hasTrace = combinedEvents.includes(traceEvent);
  const allThreeCorrelated = hasElf && hasContainer && hasTrace;

  let reportText = '';
  if (mode === 'container_and_trace') {
    const cAnalysis = analyzeContainerAndBinary('container');
    const tAnalysis = analyzeContainerAndBinary('trace');
    reportText = `${cAnalysis.report.formattedTelemetry}\n\n${formatForensicReportForTerminal(tAnalysis.report)}`;
  } else {
    const analysis = analyzeContainerAndBinary(mode);
    reportText = formatForensicReportForTerminal(analysis.report);
  }

  // Partial analysis: not all three artifacts have been examined yet
  if (!allThreeCorrelated) {
    const completedStepsCount =
      (hasElf ? 1 : 0) + (hasContainer ? 1 : 0) + (hasTrace ? 1 : 0);
    const missingParts: string[] = [];
    if (!hasElf) missingParts.push('`bin-audit lantern-syncd`');
    if (!hasContainer)
      missingParts.push('`bin-audit --container lantern-collector.json`');
    if (!hasTrace)
      missingParts.push('`bin-audit --trace lantern-syncd.trace`');

    const partialMsg = `[BIN-AUDIT PARTIAL (${completedStepsCount}/3 ARTIFACTS EXAMINED)] Recorded ${mode.toUpperCase()} findings. To complete correlation and set lantern_binary_analyzed, also run: ${missingParts.join(' and ')} (or \`bin-audit --all\`).`;

    return {
      ...state,
      completedEvents: combinedEvents,
      terminalHistory: [
        ...state.terminalHistory,
        makeLine(`eli@greyos:${state.currentDir}$ ${rawCmdLine}`, 'command'),
        makeLine(reportText, 'output'),
        makeLine(partialMsg, 'highlight'),
      ],
      monologueBanner: partialMsg,
      lastFeedbackBanner: partialMsg,
    };
  }

  // Full correlation achieved: all 3 substeps (ELF, Container, eBPF Trace) have been examined!
  const alreadyAnalyzed =
    state.flags.lantern_binary_analyzed ||
    state.completedEvents.includes(masterEvent);

  const nextSuspicion = alreadyAnalyzed
    ? state.flags.corporate_suspicion
    : clamp(state.flags.corporate_suspicion - 5);
  const nextTrust = alreadyAnalyzed
    ? state.flags.trust_nadia
    : clamp(state.flags.trust_nadia + 10);

  const nextCompletedEvents = Array.from(
    new Set([
      ...combinedEvents,
      masterEvent,
      'event:capability_applied:lesson_12_container_binary',
    ])
  );
  const nextApplied = state.learning.appliedStoryLessons.includes(
    'lesson_12_container_binary'
  )
    ? state.learning.appliedStoryLessons
    : [...state.learning.appliedStoryLessons, 'lesson_12_container_binary'];

  const summaryMsg = alreadyAnalyzed
    ? '[BIN-AUDIT] Static ELF, CIS Docker escape, and eBPF syscall correlation for lantern-syncd is already recorded.'
    : '[BIN-AUDIT COMPLETE (3/3 CORRELATED)] Correlated ELF symbol `calc_citizen_threat_score`, Privileged Docker mounts (`/var/run/docker.sock`, `/host_etc`), and eBPF `openat("/host_etc/shadow")` syscalls (`lantern_binary_analyzed` | Suspicion -5%, Nadia Trust +10%).';

  return {
    ...state,
    characters: syncNadiaCharacterTrust(state, nextTrust),
    completedEvents: nextCompletedEvents,
    flags: {
      ...state.flags,
      lantern_binary_analyzed: true,
      corporate_suspicion: nextSuspicion,
      trust_nadia: nextTrust,
    },
    learning: {
      ...state.learning,
      appliedStoryLessons: nextApplied,
    },
    terminalHistory: [
      ...state.terminalHistory,
      makeLine(`eli@greyos:${state.currentDir}$ ${rawCmdLine}`, 'command'),
      makeLine(reportText, 'output'),
      makeLine(summaryMsg, 'highlight'),
    ],
    monologueBanner: summaryMsg,
    lastFeedbackBanner: summaryMsg,
  };
}

export function executeRegisteredTacticalCommand(
  state: DeadAirState,
  cmd: string,
  rawArgs: string
): DeadAirState | null {
  const normalized = cmd.trim().toLowerCase() as TacticalCommandDescriptor['command'];
  const descriptor = TACTICAL_COMMAND_REGISTRY[normalized];
  if (!descriptor) {
    return null;
  }

  const rawCmdLine = rawArgs.trim()
    ? `${descriptor.command} ${rawArgs.trim()}`
    : descriptor.command;

  const isUnlocked =
    hasUnlockedCapability(state.learning, descriptor.requiredCapability) ||
    state.debugMode;

  if (!isUnlocked) {
    const lesson = getLessonById(descriptor.lessonId);
    const lockMsg = lesson
      ? `Capability Locked: Complete ${lesson.code} (${lesson.title}) in the Field Manual Lab to unlock '${descriptor.command}'.`
      : `Capability Locked: Unlock '${descriptor.requiredCapability}' before running '${descriptor.command}'.`;
    return appendError(state, rawCmdLine, lockMsg);
  }

  switch (descriptor.command) {
    case 'persist-audit':
      return handlePersistAudit(state, rawArgs, rawCmdLine);
    case 'ja4-inspect':
      return handleJa4Inspect(state, rawArgs, rawCmdLine);
    case 'canary-check':
      return handleCanaryCheck(state, rawArgs, rawCmdLine);
    case 'hsm-verify':
      return handleHsmVerify(state, rawArgs, rawCmdLine);
    case 'bin-audit':
      return handleBinAudit(state, rawArgs, rawCmdLine);
  }
}

export function applyTacticalLessonToStory(
  state: DeadAirState,
  lessonId: string
): DeadAirState | null {
  const entry = Object.values(TACTICAL_COMMAND_REGISTRY).find(
    (d) => d.lessonId === lessonId
  );
  if (!entry) return null;

  switch (entry.command) {
    case 'persist-audit':
      return executeRegisteredTacticalCommand(state, 'persist-audit', '--all');
    case 'ja4-inspect':
      return executeRegisteredTacticalCommand(
        state,
        'ja4-inspect',
        'captured_tls_0427'
      );
    case 'canary-check':
      return executeRegisteredTacticalCommand(
        state,
        'canary-check',
        '10.88.14.9'
      );
    case 'hsm-verify':
      return executeRegisteredTacticalCommand(
        state,
        'hsm-verify',
        'access_0427.log'
      );
    case 'bin-audit':
      return executeRegisteredTacticalCommand(
        state,
        'bin-audit',
        '--all'
      );
  }
}
