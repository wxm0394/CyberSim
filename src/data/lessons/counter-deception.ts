import { LearningLesson } from '../../learning/lessonTypes';

export const COUNTER_DECEPTION_LESSON: LearningLesson = {
  id: 'lesson_10_counter_deception',
  levelNumber: 10,
  code: 'LEVEL 10 · COUNTER-DECEPTION',
  title: 'The Canary’s Song',
  titleZh: '金丝雀之歌与反蜜罐欺骗',
  difficulty: 3,
  sourceTrack: 'tactical_security',
  category: 'counter_deception',
  prerequisites: ['lesson_09_tls_fingerprinting'],
  isMvpCoreLab: false,
  narrativeHook:
    'Vespera’s counter-intelligence unit doesn’t just build walls—they plant traps. Hidden tracking beacons inside leaked files (`incident_0427_brief.pdf`) and a curiously inviting gateway (`10.88.14.9`) on the Enclave subnet are designed to unmask anyone investigating Project LANTERN.',
  narrativeHookZh:
    'Vespera 的反情报部门不仅构筑防火墙，更擅长布设诱捕陷阱。隐藏在泄密文档 (`incident_0427_brief.pdf`) 内部的远程追踪信标，以及飞地网段上那个看似门户大开的网关 (`10.88.14.9`)，都是专门为调查“灯塔计划”的人准备的捕兽夹。',
  concepts: [
    {
      id: 'concept_canary_tokens',
      title: 'Document Canary Tokens & Out-of-Band Webhook / DNS Triggers',
      titleZh: '文档金丝雀令牌（Canary Tokens）与带外 Webhook / DNS 触发机制',
      summary:
        'A Canary Token embeds a unique URL (`https://telemetry-canary.vespera.internal/pixel/c94a8f12e0/open.png`) or unique DNS subdomain inside a PDF `/OpenAction` or external stylesheet. The moment an un-sandboxed reader renders the file, it fetches that unique token, immediately alerting the defender’s SIEM with the reader’s IP, timestamp, and User-Agent.',
      summaryZh:
        '金丝雀令牌（Canary Token）通过在 PDF 的 `/OpenAction` 字典或外部资源引用中嵌入唯一追踪 URL（如 `.../pixel/c94a8f12e0/open.png`）或专属子域名。一旦调查者在联网阅读器中直接打开该文档，阅读器便会自动请求该地址，瞬间向企业 SIEM 告警暴露阅读者的真实 IP 与时间戳。',
      keyTerms: ['Canary Token', 'PDF /OpenAction & /URI', 'Out-of-Band DNS / HTTP Beacon', 'Offline Static Inspection'],
      practicalRule:
        'Inspect untrusted documents statically for `/URI` and `/OpenAction` streams in an offline sandbox before ever rendering them in a live viewer.',
      practicalRuleZh:
        '在打开任何来历不明的内部文档前，务必先在离线沙箱中静态扫描 `/URI` 与 `/OpenAction` 对象，排查内嵌追踪信标。',
      diagramLines: [
        'Unsafe Open  : [PDF Viewer] ---> GET /pixel/c94a8f12e0/open.png ---> [Vespera SIEM Alert!]',
        'Static Check : [canary-check] -> Parses PDF AST offline -> Detects & blocks beacon URL',
      ],
    },
    {
      id: 'concept_honeypot_fingerprinting',
      title: 'High-Interaction Honeypot Indicators & Synthetic Service Banners',
      titleZh: '蜜罐节点（Honeypot）识别：诱导性凭据、矛盾指纹与伪造文件系统',
      summary:
        'Honeypots lure intruders by advertising overly tempting targets—like `10.88.14.9` exposing `LANTERN-CORE-VAULT-UNLOCKED` with a plaintext hint (`Default debug login: admin / admin2028`), contradicted OS/SSH banners, and zero-byte synthetic filesystem mtimes (`1970-01-01`). Recognizing these indicators lets you avoid actively probing the trap.',
      summaryZh:
        '蜜罐节点通常通过极其诱人的暴露面来吸引入侵者——例如 `10.88.14.9` 故意广播 `LANTERN-CORE-VAULT-UNLOCKED`、提示默认密码 `admin / admin2028`，但同时存在互相矛盾的内核版本声明与修改时间全为 `1970-01-01` 的零字节假文件。通过被动遥测识别蜜罐特征，能避免盲目执行 `probe 10.88.14.9` 踩响警报。',
      keyTerms: ['Decoy Service Banner', 'Synthetic Filesystem (Epoch 1970)', 'SIEM Correlation Rule', 'Passive Trap Identification'],
      practicalRule:
        'Identifying a honeypot does not disarm it—if you still run `probe 10.88.14.9` directly, Vespera’s SIEM trap will still fire!',
      practicalRuleZh:
        '识别出蜜罐并不等于拆除了远端陷阱——如果你明知 `10.88.14.9` 是蜜罐却仍然对其强行执行 `probe 10.88.14.9`，依然会触发企业 SIEM 最高级别警报！',
      diagramLines: [
        '10.88.14.9 Telemetry : Banner "LANTERN-CORE-VAULT-UNLOCKED" + Epoch 1970 0-byte files',
        'SIEM Rule            : Any active `probe 10.88.14.9` -> +15% Suspicion & +15% Exposure',
      ],
    },
  ],
  lab: {
    id: 'lab_10_canary_honeypot',
    code: 'SECLAB-10',
    title: 'Canary Token Detection & Honeypot Telemetry Verification Lab',
    titleZh: '文档金丝雀令牌检测与内网蜜罐遥测甄别实验',
    objective:
      'Statically inspect `incident_0427_brief.pdf` for embedded Canary Token callbacks, and analyze passive service telemetry from `10.88.14.9` to confirm it is a Vespera SOC deception node.',
    objectiveZh:
      '对 `incident_0427_brief.pdf` 进行静态扫描以检出隐藏的金丝雀回调令牌，并分析 `10.88.14.9` 的被动遥测特征以确认其蜜罐属性。',
    environmentBanner: 'GREYOS SANDBOX // COUNTER-DECEPTION & CANARY AUDITOR // ZERO-TOUCH',
    initialSymptom:
      '`incident_0427_brief.pdf` contains an unverified `/OpenAction` stream, and host `10.88.14.9` advertises an unauthenticated vault port.',
    initialSymptomZh:
      '`incident_0427_brief.pdf` 含有可疑的 `/OpenAction` 自动触发对象，且内网节点 `10.88.14.9` 暴露了看似未设防的核心金库端口。',
    nodes: [
      {
        id: 'node_canary_pdf',
        label: 'incident_0427_brief.pdf (/OpenAction AST)',
        address: 'Token ID: CANARY-VSP-0427-ELI',
        role: 'Embedded HTTP Tracking Pixel & DNS Canary Callback',
        roleZh: '内嵌 HTTP 追踪像素与 DNS 金丝雀回调信标',
        status: 'compromised',
      },
      {
        id: 'node_honeypot_14_9',
        label: '10.88.14.9 (vespera-enclave-gw)',
        address: '10.88.14.9:2222 / 9443',
        role: 'Suspected Vespera SOC Deception Node (Honeypot)',
        roleZh: '疑似 Vespera 安全中心部署的欺骗诱捕节点（蜜罐）',
        status: 'compromised',
      },
    ],
    diagnosticActions: [
      {
        id: 'diag_10_pdf_canary',
        label: 'Statically Parse PDF Object Tree for `/OpenAction` & External Callback URIs',
        labelZh: '静态解析 PDF 对象树中的 `/OpenAction` 与外部回调 URI',
        commandPreview: 'canary-check --file /home/eli/Documents/incident_0427_brief.pdf',
        targetNode: 'incident_0427_brief.pdf (/OpenAction AST)',
        telemetryOutput: [
          '[CANARY DETECTED] Object 19 0 R -> /Type /Action /S /URI',
          '  Token ID    : CANARY-VSP-0427-ELI',
          '  Callback URL: https://telemetry-canary.vespera.internal/pixel/c94a8f12e0/open.png',
          '  SIEM Rule   : VSP-SOC-DECEPTION-019 (Fires instant alert on HTTP GET or DNS lookup)',
          '  Status      : NOT TRIGGERED (Static AST inspection only)',
        ].join('\n'),
        telemetryOutputZh: [
          '【检出金丝雀令牌】PDF 对象 19 0 R -> /Type /Action /S /URI',
          '  令牌编号 : CANARY-VSP-0427-ELI',
          '  回调地址 : https://telemetry-canary.vespera.internal/pixel/c94a8f12e0/open.png',
          '  告警规则 : VSP-SOC-DECEPTION-019（一旦发起 DNS 解析或 HTTP 请求即刻向 SOC 报警）',
          '  当前状态 : 未触发（纯静态语法树分析）',
        ].join('\n'),
        revealsClue:
          'Discovered Canary Token `CANARY-VSP-0427-ELI` hidden in `incident_0427_brief.pdf` before it could phone home to `telemetry-canary.vespera.internal`.',
        revealsClueZh:
          '在未触发任何外联请求的前提下，成功检出隐藏在 `incident_0427_brief.pdf` 中的追踪令牌 `CANARY-VSP-0427-ELI`。',
        isCriticalClue: true,
      },
      {
        id: 'diag_10_honeypot_telemetry',
        label: 'Evaluate Passive Banner & Synthetic Filesystem Anomalies on `10.88.14.9`',
        labelZh: '评估 `10.88.14.9` 的被动服务横幅矛盾与伪造文件系统特征',
        commandPreview: 'canary-check --host 10.88.14.9 --passive-profile',
        targetNode: '10.88.14.9 (vespera-enclave-gw)',
        telemetryOutput: [
          '[DECEPTION INDICATOR 1] Banner advertises "LANTERN-CORE-VAULT-UNLOCKED // admin:admin2028"',
          '[DECEPTION INDICATOR 2] Contradictory TCP/SSH fingerprint (OpenSSH 7.2p2 on Linux 6.8 synthetic kernel)',
          '[DECEPTION INDICATOR 3] Decoy directory listing shows 0-byte files dated 1970-01-01 00:00:00 UTC',
          '[VERDICT] HIGH-CONFIDENCE HONEYPOT (98/100). DO NOT run active `probe 10.88.14.9`!',
        ].join('\n'),
        telemetryOutputZh: [
          '【欺骗特征 1】服务横幅故意广播 "LANTERN-CORE-VAULT-UNLOCKED // 默认密码 admin:admin2028"',
          '【欺骗特征 2】协议栈版本自相矛盾（旧版 OpenSSH 7.2p2 运行在伪造的 Linux 6.8 内核模拟器上）',
          '【欺骗特征 3】诱饵目录中的所有文件大小均为 0 字节，且时间戳统一为 1970-01-01 00:00:00 UTC',
          '【综合判定】高置信度蜜罐（98/100）！切勿对其执行主动探测命令 `probe 10.88.14.9`！',
        ].join('\n'),
        revealsClue:
          'Confirmed `10.88.14.9` is a high-interaction Vespera SOC honeypot (`98/100` deception score).',
        revealsClueZh:
          '确认 `10.88.14.9` 是 Vespera 安全中心布设的高交互蜜罐（欺骗指数 `98/100`）。',
        isCriticalClue: true,
      },
    ],
    resolutions: [
      {
        id: 'res_10_flag_canary_and_honeypot',
        label: 'Catalog Canary Token & Mark `10.88.14.9` as Active Deception Node',
        labelZh: '登记文档金丝雀特征并将 `10.88.14.9` 标记为高危欺骗蜜罐',
        commandPreview: 'canary-check incident_0427_brief.pdf && canary-check 10.88.14.9',
        approach: 'analytical',
        isOptimal: true,
        requiresDiagnosticIds: ['diag_10_pdf_canary', 'diag_10_honeypot_telemetry'],
        outcomeSummary:
          'Completed counter-deception verification and unlocked `canary-check` for your GreyOS workstation.',
        outcomeSummaryZh:
          '完成反欺骗与蜜罐特征核验，已解锁工作站命令 `canary-check`。将其应用到文档或可疑节点即可记录反欺骗取证发现。',
        suspicionDelta: 0,
        exposureDelta: 0,
        trustNadiaDelta: 0,
      },
      {
        id: 'res_10_trigger_beacon_and_probe',
        label: 'Fetch the Canary URL & Actively Probe `10.88.14.9` to See What Happens',
        labelZh: '直接请求金丝雀 URL 并强行探测 `10.88.14.9` 蜜罐网关',
        commandPreview: 'curl https://telemetry-canary.vespera.internal/pixel/c94a8f12e0/open.png',
        approach: 'brute_force',
        isOptimal: false,
        requiresDiagnosticIds: [],
        outcomeSummary:
          'Fetching the Canary Token URL fired SIEM rule `VSP-SOC-DECEPTION-019`, alerting Vespera’s counter-intelligence desk (+10% Corporate Suspicion, +15% Exposure).',
        outcomeSummaryZh:
          '直接触发金丝雀回调 URL 激活了企业 SIEM 规则 `VSP-SOC-DECEPTION-019`，向反情报部门暴露了你的调查行为（怀疑度 +10%，暴露度 +15%）。',
        suspicionDelta: 10,
        exposureDelta: 15,
        trustNadiaDelta: 0,
      },
    ],
    storyApplication: {
      id: 'app_10_canary_check_story',
      targetHostOrFile: '10.88.14.9',
      actionLabel: 'Run `canary-check` on `incident_0427_brief.pdf` & `10.88.14.9` to Neutralize Deception Traps',
      actionLabelZh: '对 `incident_0427_brief.pdf` 与 `10.88.14.9` 运行 `canary-check` 标记金丝雀与蜜罐陷阱',
      analyticalCommand: 'canary-check 10.88.14.9',
      bruteForceCommand: 'probe 10.88.14.9',
      analyticalOutcome:
        'Identified the embedded PDF Canary Token and flagged `10.88.14.9` as an active Vespera SOC honey-trap without tripping any alarm (`canary_identified`, -5% Suspicion, -5% Exposure). Note: `10.88.14.9` remains a live trap if you actively `probe` it.',
      analyticalOutcomeZh:
        '已在零触发前提下识别出 PDF 金丝雀令牌并将 `10.88.14.9` 标记为高危蜜罐（记录 `canary_identified`，企业怀疑度 -5%，暴露度 -5%）。注意：远端蜜罐依然处于激活状态，请勿对其执行 `probe 10.88.14.9`。',
      bruteForceOutcome:
        'Probing the honeypot gateway directly triggered Vespera’s Enclave deception alarm (+15% Suspicion, +15% Exposure).',
      bruteForceOutcomeZh:
        '直接探测蜜罐网关触发了飞地反侵入警报（企业怀疑度 +15%，暴露度 +15%）。',
      analyticalSuspicionDelta: -5,
      analyticalExposureDelta: -5,
      analyticalTrustDelta: 5,
      bruteForceSuspicionDelta: 15,
      bruteForceExposureDelta: 15,
    },
  },
  unlocks: {
    capabilities: ['canary_inspector'],
    tools: ['canary-check'],
    badgeLabel: 'Canary & Honeypot Inspector',
    badgeLabelZh: '金丝雀令牌与蜜罐识别器',
  },
  source: {
    repository: 'Lauren-Bitten/CyberSecurity-Projects',
    upstreamRepository: 'CarterPerez-dev/Cybersecurity-Projects',
    fork: 'Lauren-Bitten/CyberSecurity-Projects',
    license: 'AGPL-3.0',
    sectionPath: 'PROJECTS/beginner/canary-token-generator & PROJECTS/advanced/honeypot-network & PROJECTS/intermediate/siem-dashboard',
    sectionTitle: 'Canary Token Generator, Honeypot Network & SIEM Deception Rules',
    adaptationNote:
      'Adapted from the defensive perspective: detecting embedded Canary Tokens and identifying honeypot telemetry anomalies before triggering SIEM alerts.',
    adaptationNoteZh:
      '从调查者反欺骗视角改编自金丝雀令牌生成器、蜜罐网络与 SIEM 告警规则项目。',
  },
  reviewStatus: 'reviewed',
};
