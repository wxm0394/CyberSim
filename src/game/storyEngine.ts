import {
  DeadAirState,
  EvidenceArtifact,
  FirstPhoneChoice,
  SceneId,
  TerminalOutputLine,
} from './types';

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

export function inspectHotspot(
  state: DeadAirState,
  hotspotId: string
): DeadAirState {
  const currentHotspots = state.hotspots[state.currentScene] || [];
  const target = currentHotspots.find((h) => h.id === hotspotId);
  if (!target) return state;

  const updatedSceneHotspots = currentHotspots.map((h) =>
    h.id === hotspotId ? { ...h, inspected: true } : h
  );

  let nextState: DeadAirState = {
    ...state,
    selectedHotspotId: hotspotId,
    hotspots: {
      ...state.hotspots,
      [state.currentScene]: updatedSceneHotspots,
    },
    monologueBanner: `${target.label} (${target.labelZh}): ${target.detailText}`,
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
    const count = updated.filter((e) => e.discovered).length;
    nextState = {
      ...nextState,
      evidence: updated,
      flags: {
        ...nextState.flags,
        evidence_count: count,
      },
    };
  }

  if (target.triggersScene) {
    return transitionToScene(nextState, target.triggersScene);
  }

  if (target.triggersOverlay) {
    nextState = {
      ...nextState,
      activeOverlay: target.triggersOverlay,
      activeDialogueCharacterId:
        target.triggersCharacterId || nextState.activeDialogueCharacterId,
    };
  }

  if (hotspotId === 'hs_phone') {
    nextState = {
      ...nextState,
      phoneMessages: nextState.phoneMessages.map((m) =>
        m.id === 'msg_nadia_voicemail' || m.id === 'msg_unknown_warning'
          ? { ...m, isUnread: false }
          : m
      ),
      flags: {
        ...nextState.flags,
        voicemail_played: true,
        current_objective: nextState.flags.first_choice
          ? nextState.flags.current_objective
          : 'Listen to Nadia Park’s interrupted voicemail and decide how to respond.',
      },
    };
  }

  if (hotspotId === 'hs_return_pc') {
    nextState = {
      ...nextState,
      activeComputerApp: 'TERMINAL',
      currentDir: '/home/eli/archive_vault',
    };
  }

  return nextState;
}

export function transitionToScene(
  state: DeadAirState,
  targetScene: SceneId
): DeadAirState {
  let clockTime = state.clockTime;
  let banner = state.monologueBanner;
  let currentObjective = state.flags.current_objective;

  if (targetScene === 'STREET_NIGHT') {
    clockTime = '02:41 AM';
    banner =
      'Cold drizzle coats 4th Avenue. Municipal optical cameras hum above the crosswalk while the 24-hour laundromat glows down the block.';
    currentObjective =
      'Cross 4th Avenue and enter the 24-Hour Coin Laundry to meet Nadia Park.';
  } else if (targetScene === 'LAUNDROMAT') {
    clockTime = '02:48 AM';
    banner =
      'Warm detergent steam and the rhythmic thud of industrial dryers mask your footsteps. Nadia Park waits near Dryer #04.';
    currentObjective =
      'Speak with Nadia Park about the missing 14 minutes in incident_0427.zip.';
  } else if (targetScene === 'APARTMENT_RETURN') {
    clockTime = '03:12 AM';
    banner =
      'You lock the deadbolt behind you—and freeze. Your workstation monitor is awake in the dark. Someone opened a remote tunnel.';
    currentObjective =
      'Inspect the active terminal on your workstation and examine /home/eli/archive_vault.';
  } else if (targetScene === 'APARTMENT_NIGHT') {
    clockTime = '02:17 AM';
    banner =
      'Greyhaven, 02:17 AM. Rain streaks the glass outside Apt 4B. Your phone is vibrating on the desk.';
  }

  // Ensure MOTH message is unlocked if entering APARTMENT_RETURN
  const updatedMessages =
    targetScene === 'APARTMENT_RETURN'
      ? state.phoneMessages.map((m) =>
          m.id === 'msg_moth_archive' ? { ...m, unlocked: true, isUnread: true } : m
        )
      : state.phoneMessages;

  // Ensure lantern_auth_audit.db is unlocked in APARTMENT_RETURN
  const updatedFiles =
    targetScene === 'APARTMENT_RETURN'
      ? state.files.map((f) =>
          f.path === '/home/eli/archive_vault/lantern_auth_audit.db'
            ? { ...f, unlocked: true }
            : f
        )
      : state.files;

  return {
    ...state,
    currentScene: targetScene,
    activeOverlay: 'NONE',
    selectedHotspotId: null,
    clockTime,
    monologueBanner: banner,
    phoneMessages: updatedMessages,
    files: updatedFiles,
    flags: {
      ...state.flags,
      current_objective: currentObjective,
      contacted_moth:
        targetScene === 'APARTMENT_RETURN' ? true : state.flags.contacted_moth,
    },
  };
}

export function handleFirstPhoneChoice(
  state: DeadAirState,
  choice: FirstPhoneChoice
): DeadAirState {
  if (!choice) return state;

  let suspicionDelta = 0;
  let exposureDelta = 0;
  let trustDelta = 0;
  let responseBody = '';
  let responseBodyZh = '';

  if (choice === 'CALL_NADIA') {
    suspicionDelta = 15;
    exposureDelta = 12;
    trustDelta = 10;
    responseBody =
      '[OUTBOUND CALL LOG — 02:19 AM] Dialed Nadia Park. Carrier routed directly to dead air after two rings. Cell tower handoff logged your IMEI near 4th Ave.';
    responseBodyZh =
      '【外拨记录 — 02:19 AM】已拨打 Nadia Park。响铃两声后转入死寂忙音。基站切换已记录你在第四大道附近的 IMEI。';
  } else if (choice === 'TRACE_SMS') {
    suspicionDelta = 5;
    exposureDelta = 5;
    responseBody =
      '[SS7 HEADER TRACE — 02:19 AM] Anonymous warning SMS bounced through a disposable SIP relay in Port District. Sender signature: "MOTH_RELAY_0".';
    responseBodyZh =
      '【SS7 信令追踪 — 02:19 AM】匿名警告短信经由港区一次性 SIP 中继转发。发送方特征码："MOTH_RELAY_0"。';
  } else if (choice === 'WAIT_CHECK_PC') {
    suspicionDelta = 0;
    exposureDelta = 0;
    responseBody =
      '[AIRGAP PROTOCOL — 02:19 AM] You enabled cellular silence and turned toward your Linux workstation to inspect incident_0427.zip locally.';
    responseBodyZh =
      '【静默协议 — 02:19 AM】你开启了蜂窝静默，决定先在本地 Linux 工作站上核查 incident_0427.zip。';
  } else if (choice === 'CONTACT_ALLY') {
    suspicionDelta = 5;
    exposureDelta = 4;
    responseBody =
      '[ENCRYPTED PING — 02:19 AM] Pushed a zero-knowledge canary to Rhea Solis & Daniel Cross. Auto-reply from Daniel: "Stay off Vespera trunks tonight, Eli."';
    responseBodyZh =
      '【加密探针 — 02:19 AM】已向记者 Rhea Solis 与前导师 Daniel Cross 发送零知识信标。Daniel 自动回复：“今晚别碰 Vespera 的主干网，Eli。”';
  }

  const newMsg = {
    id: `msg_choice_${choice.toLowerCase()}`,
    sender: 'GreyOS Cellular Log',
    senderRole: 'Action Record',
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

  return {
    ...state,
    phoneMessages: [...filteredMessages, newMsg],
    characters: state.characters.map((c) =>
      c.id === 'nadia'
        ? { ...c, trust: Math.min(100, Math.max(0, c.trust + trustDelta)) }
        : c
    ),
    flags: {
      ...state.flags,
      voicemail_played: true,
      first_choice: choice,
      corporate_suspicion: Math.min(
        100,
        state.flags.corporate_suspicion + suspicionDelta
      ),
      player_exposure: Math.min(100, state.flags.player_exposure + exposureDelta),
      trust_nadia: Math.min(100, state.flags.trust_nadia + trustDelta),
      current_objective:
        'Boot your Linux workstation (GreyOS) and inspect /home/eli/Downloads/incident_0427.',
    },
    monologueBanner: responseBody,
  };
}

export function inspectVirtualFile(
  state: DeadAirState,
  filePath: string
): DeadAirState {
  const file = state.files.find((f) => f.path === filePath && f.unlocked);
  if (!file) return state;

  let nextEvidence = state.evidence;
  let newlyFoundId: string | null = null;

  if (file.unlocksEvidenceId) {
    const res = unlockEvidenceById(nextEvidence, file.unlocksEvidenceId);
    nextEvidence = res.updated;
    if (res.newlyDiscovered) {
      newlyFoundId = file.unlocksEvidenceId;
    }
  }

  // If inspecting lantern_auth_audit.db in Scene 5, also unlock EV-05 & EV-06
  let triggeredTwist = state.flags.discovered_eli_account_reuse;
  let nextShellState = state.shellState;

  if (file.path === '/home/eli/archive_vault/lantern_auth_audit.db') {
    const res5 = unlockEvidenceById(nextEvidence, 'EV-05');
    const res6 = unlockEvidenceById(res5.updated, 'EV-06');
    nextEvidence = res6.updated;
    triggeredTwist = true;
    nextShellState = 'gameover';
  }

  const discoveredCount = nextEvidence.filter((e) => e.discovered).length;
  const inspectedCoreLogs =
    nextEvidence.filter(
      (e) =>
        ['EV-01', 'EV-02', 'EV-03', 'EV-04'].includes(e.id) && e.discovered
    ).length >= 2;

  const newTerminalLines: TerminalOutputLine[] = [
    makeTermLine(`eli@greyos:~$ cat ${file.path}`, 'command'),
    makeTermLine(file.content, 'output'),
  ];

  if (newlyFoundId) {
    const evObj = nextEvidence.find((e) => e.id === newlyFoundId);
    if (evObj) {
      newTerminalLines.push(
        makeTermLine(
          `[FORENSIC ARTIFACT LOGGED] ${evObj.id}: ${evObj.title} (${evObj.eventTimestamp})`,
          'highlight'
        )
      );
    }
  }

  if (triggeredTwist && !state.flags.discovered_eli_account_reuse) {
    newTerminalLines.push(
      makeTermLine(
        '[CRITICAL ALERT] Remote SSH carrier dropped. Display override packet received: "WE KNOW WHO YOU ARE."',
        'error'
      )
    );
  }

  return {
    ...state,
    shellState: nextShellState,
    evidence: nextEvidence,
    terminalHistory: [...state.terminalHistory, ...newTerminalLines],
    flags: {
      ...state.flags,
      evidence_count: discoveredCount,
      archive_inspected: inspectedCoreLogs || state.flags.archive_inspected,
      discovered_lantern:
        file.unlocksEvidenceId === 'EV-04' || state.flags.discovered_lantern,
      discovered_eli_account_reuse: triggeredTwist,
      current_objective: triggeredTwist
        ? 'Chapter 1 Complete — Review the complete forensic timeline.'
        : inspectedCoreLogs && !state.flags.laundromat_meeting_done
        ? 'Leave the apartment and meet Nadia Park at the 24-Hour Coin Laundry on 4th Ave.'
        : state.flags.current_objective,
    },
    monologueBanner: triggeredTwist
      ? 'Your own revoked employee ID — e.ward_09 — authorized the Project LANTERN cover-up 48 hours ago. Screen blackout imminent.'
      : `Inspected ${file.name}. (${discoveredCount}/6 forensic evidence artifacts logged)`,
  };
}

export function correlateEvidenceTimeline(state: DeadAirState): DeadAirState {
  const discoveredCount = state.evidence.filter((e) => e.discovered).length;
  const updatedEvidence = state.evidence.map((ev) =>
    ev.discovered ? { ...ev, correlated: true } : ev
  );

  return {
    ...state,
    evidence: updatedEvidence,
    flags: {
      ...state.flags,
      timeline_correlated: discoveredCount >= 2,
      archive_inspected:
        discoveredCount >= 2 ? true : state.flags.archive_inspected,
      current_objective:
        discoveredCount >= 2 && !state.flags.laundromat_meeting_done
          ? 'Forensic timeline correlated. Head out to the 24-Hour Coin Laundry to confront Nadia Park.'
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
  };
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

  const nextTrust = Math.min(
    100,
    Math.max(0, char.trust + (choice.trustDelta || 0))
  );
  const nextSuspicion = Math.min(
    100,
    Math.max(0, state.flags.corporate_suspicion + (choice.suspicionDelta || 0))
  );
  const nextExposure = Math.min(
    100,
    Math.max(0, state.flags.player_exposure + (choice.exposureDelta || 0))
  );

  let nextEvidence = state.evidence;
  if (choice.unlocksEvidenceId) {
    const res = unlockEvidenceById(nextEvidence, choice.unlocksEvidenceId);
    nextEvidence = res.updated;
  }

  let nextFiles = state.files;
  let nextInventory = state.inventory;
  let laundromatDone = state.flags.laundromat_meeting_done;
  let contactedMoth = state.flags.contacted_moth;
  let discoveredLantern = state.flags.discovered_lantern;
  let journalistContact = state.flags.journalist_contact;

  if (characterId === 'rhea') {
    journalistContact = true;
  }

  if (characterId === 'nadia') {
    discoveredLantern = true;
    const ev4 = unlockEvidenceById(nextEvidence, 'EV-04');
    nextEvidence = ev4.updated;
  }

  // If Nadia conversation reaches final node or completes
  const isNadiaEnd =
    characterId === 'nadia' &&
    (currentNode.id === 'nadia_node_3' || !choice.nextNodeId);

  if (isNadiaEnd) {
    laundromatDone = true;
    contactedMoth = true;
    const ev5 = unlockEvidenceById(nextEvidence, 'EV-05');
    nextEvidence = ev5.updated;
    nextInventory = nextInventory.map((item) =>
      item.id === 'item_moth_usb' ? { ...item, acquired: true } : item
    );
    nextFiles = nextFiles.map((f) =>
      f.path === '/home/eli/archive_vault/lantern_auth_audit.db'
        ? { ...f, unlocked: true }
        : f
    );
  }

  const updatedCharacters = state.characters.map((c) => {
    if (c.id !== characterId) return c;
    return {
      ...c,
      trust: nextTrust,
      currentNodeId: choice.nextNodeId || c.currentNodeId,
    };
  });

  const discoveredCount = nextEvidence.filter((e) => e.discovered).length;

  let nextState: DeadAirState = {
    ...state,
    characters: updatedCharacters,
    evidence: nextEvidence,
    files: nextFiles,
    inventory: nextInventory,
    activeOverlay: choice.nextNodeId ? 'DIALOGUE' : 'NONE',
    flags: {
      ...state.flags,
      trust_nadia:
        characterId === 'nadia' ? nextTrust : state.flags.trust_nadia,
      corporate_suspicion: nextSuspicion,
      player_exposure: nextExposure,
      evidence_count: discoveredCount,
      discovered_lantern: discoveredLantern,
      journalist_contact: journalistContact,
      laundromat_meeting_done: laundromatDone,
      contacted_moth: contactedMoth,
      current_objective: isNadiaEnd
        ? 'Return to your apartment (Apt 4B) and decrypt /home/eli/archive_vault with MOTH’s key.'
        : state.flags.current_objective,
    },
    monologueBanner: isNadiaEnd
      ? 'Nadia slipped you a micro-USB key ("moth_archive.key") and vanished into the rain. Return to your apartment.'
      : `${char.name}: "${currentNode.body.slice(0, 90)}..."`,
  };

  if (isNadiaEnd) {
    nextState = {
      ...nextState,
      phoneMessages: nextState.phoneMessages.map((m) =>
        m.id === 'msg_moth_archive'
          ? { ...m, unlocked: true, isUnread: true }
          : m
      ),
    };
  }

  return nextState;
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
            'GreyOS Forensics Shell — Supported Commands:',
            '  ls                       List files in current directory',
            '  cd <dir>                 Change working directory (/home/eli/Downloads/incident_0427, /home/eli/archive_vault)',
            '  cat <file>               Display file contents and log forensic evidence',
            '  stat <file>              Inspect inode metadata & modification timestamps',
            '  grep <pattern> <file>    Filter file lines matching pattern',
            '  unzip incident_0427.zip  Verify and unpack archive contents',
            '  verify / timeline        Correlate discovered evidence chronologically',
            '  status                   Show Eli Ward exposure, suspicion & chapter flags',
            '  clear                    Clear terminal output',
          ].join('\n'),
          'system'
        ),
      ],
    };
  }

  if (cmd === 'whoami') {
    return {
      ...state,
      terminalHistory: [
        ...state.terminalHistory,
        cmdLine,
        makeTermLine(
          'eli (uid=1000, former Vespera Data Solutions Support Engineer — legacy ID: e.ward_09)',
          'output'
        ),
      ],
    };
  }

  if (cmd === 'status') {
    return {
      ...state,
      terminalHistory: [
        ...state.terminalHistory,
        cmdLine,
        makeTermLine(
          [
            `Scene               : ${state.currentScene} (${state.clockTime})`,
            `Nadia Trust         : ${state.flags.trust_nadia}%`,
            `Corporate Suspicion : ${state.flags.corporate_suspicion}%`,
            `Player Exposure     : ${state.flags.player_exposure}%`,
            `Evidence Logged     : ${state.flags.evidence_count} / 6`,
            `Project LANTERN     : ${state.flags.discovered_lantern ? 'CONFIRMED' : 'UNKNOWN'}`,
            `MOTH Contacted      : ${state.flags.contacted_moth ? 'ACTIVE' : 'PENDING'}`,
          ].join('\n'),
          'highlight'
        ),
      ],
    };
  }

  if (cmd === 'ls') {
    const dirToQuery = arg
      ? arg.startsWith('/')
        ? arg
        : `${state.currentDir}/${arg}`.replace(/\/+/g, '/')
      : state.currentDir;
    const matching = state.files.filter(
      (f) => f.unlocked && f.parentDir === dirToQuery
    );
    const subdirs: string[] = [];
    if (dirToQuery === '/home/eli') {
      subdirs.push('Downloads/', 'Documents/', 'archive_vault/');
    } else if (dirToQuery === '/home/eli/Downloads') {
      subdirs.push('incident_0427/');
    }

    const lines = [
      ...subdirs.map((d) => `drwxr-xr-x  eli  eli   4096  ${d}`),
      ...matching.map(
        (f) => `-rw-r--r--  eli  eli  ${f.size.padStart(6, ' ')}  ${f.modifiedAt}  ${f.name}`
      ),
    ];

    return {
      ...state,
      terminalHistory: [
        ...state.terminalHistory,
        cmdLine,
        makeTermLine(
          lines.length > 0 ? lines.join('\n') : '(directory empty or locked)',
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
      return {
        ...state,
        currentDir: nextDir === '/' ? '/home/eli' : nextDir,
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
        makeTermLine(`cd: no such directory: ${arg}`, 'error'),
      ],
    };
  }

  if (cmd === 'unzip') {
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

  if (cmd === 'stat') {
    const targetFile = state.files.find(
      (f) =>
        f.unlocked &&
        (f.name.toLowerCase() === arg.toLowerCase() ||
          f.path.toLowerCase() === arg.toLowerCase())
    );
    if (!targetFile) {
      return {
        ...state,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(`stat: cannot stat '${arg}': No such file`, 'error'),
        ],
      };
    }
    return {
      ...state,
      terminalHistory: [
        ...state.terminalHistory,
        cmdLine,
        makeTermLine(
          [
            `  File: ${targetFile.path}`,
            `  Size: ${targetFile.size}   Modify: ${targetFile.modifiedAt}`,
            `  Inode: 409281   Access: (0644/-rw-r--r--)  Uid: (1000/eli)`,
            `  Forensic Link: ${targetFile.unlocksEvidenceId || 'None'}`,
          ].join('\n'),
          'output'
        ),
      ],
    };
  }

  if (cmd === 'grep') {
    const subParts = arg.split(/\s+/);
    const pattern = subParts[0] || '';
    const fileArg = subParts.slice(1).join(' ');
    const targetFile = state.files.find(
      (f) =>
        f.unlocked &&
        (f.name.toLowerCase() === fileArg.toLowerCase() ||
          f.path.toLowerCase() === fileArg.toLowerCase())
    );
    if (!targetFile) {
      return {
        ...state,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(`grep: ${fileArg || '(missing file)'}: No such file`, 'error'),
        ],
      };
    }
    const matchedLines = targetFile.content
      .split('\n')
      .filter((line) => line.toLowerCase().includes(pattern.toLowerCase()));
    const nextWithCmd = inspectVirtualFile(state, targetFile.path);
    return {
      ...nextWithCmd,
      terminalHistory: [
        ...state.terminalHistory,
        cmdLine,
        makeTermLine(
          matchedLines.length > 0
            ? matchedLines.join('\n')
            : `(no lines matched '${pattern}')`,
          'highlight'
        ),
      ],
    };
  }

  if (cmd === 'cat') {
    const targetFile = state.files.find(
      (f) =>
        f.unlocked &&
        (f.name.toLowerCase() === arg.toLowerCase() ||
          f.path.toLowerCase() === arg.toLowerCase())
    );
    if (!targetFile) {
      return {
        ...state,
        terminalHistory: [
          ...state.terminalHistory,
          cmdLine,
          makeTermLine(`cat: ${arg || '(missing operand)'}: No such file`, 'error'),
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
