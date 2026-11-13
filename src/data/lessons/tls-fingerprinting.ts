import { LearningLesson } from '../../learning/lessonTypes';

export const TLS_FINGERPRINTING_LESSON: LearningLesson = {
  id: 'lesson_09_tls_fingerprinting',
  levelNumber: 9,
  code: 'LEVEL 09 · NETWORK ATTRIBUTION',
  title: 'The TLS Fingerprint',
  titleZh: 'TLS 握手画像与连接状态归因',
  difficulty: 3,
  sourceTrack: 'tactical_security',
  category: 'network_attribution',
  prerequisites: ['lesson_08_persistence'],
  isMvpCoreLab: false,
  narrativeHook:
    'Vespera’s incident report accuses you of launching an automated credential-stuffing script from your workstation (`10.0.2.15`) at `02:14:11 UTC`. Even when TLS payload is encrypted, the plaintext `ClientHello` handshake reveals the exact cryptographic stack—and connection state telemetry reveals whether a session was an automated scanner or an interactive terminal.',
  narrativeHookZh:
    'Vespera 的内部通报指控你在 `02:14:11 UTC` 从工作站 (`10.0.2.15`) 运行了自动化撞库脚本。即便 TLS 传输内容已加密，明文阶段的 `ClientHello` 握手参数依然会暴露客户端密码学栈特征（JA3/JA4 指纹），而连接状态遥测则能还原当时的真实连接性质。',
  concepts: [
    {
      id: 'concept_ja3_ja4_clienthello',
      title: 'TLS ClientHello Fingerprinting (JA3 & Canonical Sorted JA4)',
      titleZh: 'TLS ClientHello 握手画像（JA3 与规范化排序 JA4 指纹）',
      summary:
        'Before encryption begins, a TLS client sends a plaintext `ClientHello` listing its TLS version, cipher suites, extensions, elliptic curves, and ALPN protocols. JA3 hashes these fields in wire order, while JA4 sorts hex cipher suites and extensions canonically (ignoring GREASE values) into a readable `a_b_c` string (`t13d0406h2_...`), distinguishing a custom Go/Python CLI client from a standard Firefox browser.',
      summaryZh:
        '在加密通道建立前，客户端发送的明文 `ClientHello` 报文包含了 TLS 版本、密码套件列表、扩展项与 ALPN 协议。JA3 按原始顺序哈希这些字段，而 JA4 将密码套件与扩展项进行规范化排序（剔除 GREASE 噪点）并生成三段式可读指纹（如 `t13d0406h2_...`），从而精准区分精简 CLI 工具与标准桌面浏览器。',
      keyTerms: ['TLS ClientHello', 'JA3 Hash', 'JA4 Canonical Sorting (a_b_c)', 'ALPN & Cipher Suite Profile'],
      practicalRule:
        'Encrypting the payload does not hide the client implementation: a 4-cipher Go CLI binary produces a drastically different JA4 signature than a 15-cipher browser.',
      practicalRuleZh:
        '加密载荷无法隐藏客户端实现特征：仅携带 4 个密码套件的定制 CLI 维护工具，其 JA4 指纹与携带 15 个密码套件的标准浏览器截然不同。',
      diagramLines: [
        'Plaintext ClientHello : [TLS 1.3 | 04 Ciphers | 06 Extensions | ALPN: h2]',
        'JA4 Canonical Format  : [a: t13d0406h2] _ [b: 55b375c5d22e] _ [c: a19f04c8812b]',
        'Firefox 124 Baseline  : [a: t13d1516h2] _ [b: 8daaf6152771] _ [c: e5627efa2ab1]',
      ],
    },
    {
      id: 'concept_connection_state_telemetry',
      title: 'Passive Connection State Telemetry vs. Stateless SYN Scanning',
      titleZh: '连接状态遥测分析：交互式握手与无状态半开扫描的取证区分',
      summary:
        'A stateless SYN scanner blasts thousands of `SYN` packets per second across sequential ports without completing `SYN -> SYN-ACK -> ACK`. By contrast, analyzing captured flow telemetry for `captured_tls_0427` reveals a single completed TCP 3-way handshake on port `8443` with a 42.8-second duration—proving it was one authenticated diagnostic session, not a port scan.',
      summaryZh:
        '无状态扫描器会在短时间内向大量端口发送半开 `SYN` 包且不完成三次握手。相反，对离线抓包 `captured_tls_0427` 的连接状态遥测分析表明：该会话仅在 `8443` 端口完成了单次完整 TCP 三次握手，持续时间 42.8 秒——从密码学与传输层双重证伪了“大规模撞库扫描”的指控。',
      keyTerms: ['Complete 3-Way Handshake', 'Stateless Half-Open SYN', 'Flow Cadence & Ephemeral Port Reuse', 'Passive PCAP Attribution'],
      practicalRule:
        'Combine JA4 client stack identification with TCP flow state telemetry to prove whether traffic originated from a single maintenance tool or a stateless scanner.',
      practicalRuleZh:
        '将 JA4 客户端栈指纹与 TCP 连接状态遥测相结合，即可在被动取证中客观还原流量的真实工具属性。',
      diagramLines: [
        'captured_tls_0427 : 10.0.2.15:51944 --> 10.88.10.5:8443 [SYN -> SYN-ACK -> ACK] (1 Port, 42.8s)',
        'Scanner Profile   : 1000+ Ports/sec [SYN only, RST teardown, 0 completed TLS sessions]',
      ],
    },
  ],
  lab: {
    id: 'lab_09_tls_ja4_forensics',
    code: 'SECLAB-09',
    title: 'Passive JA3/JA4 ClientHello Attribution & Flow Telemetry Lab',
    titleZh: '被动 JA3/JA4 握手画像计算与连接状态归因实验',
    objective:
      'Analyze the offline packet capture `captured_tls_0427` to compute its canonical JA4 fingerprint, compare it against known client baselines, and verify whether the session was a stateless scan or a single maintenance handshake.',
    objectiveZh:
      '解析离线抓包样本 `captured_tls_0427`，计算其规范化 JA4 握手指纹并与基线比对，核实该流量究竟是自动化扫描还是单次维护握手。',
    environmentBanner: 'GREYOS SANDBOX // JA3/JA4 TLS FINGERPRINT & FLOW INSPECTOR // PASSIVE PCAP',
    initialSymptom:
      'Vespera SOC claims `captured_tls_0427` proves Eli ran a mass port/credential scanner against `10.88.10.5:8443`.',
    initialSymptomZh:
      'Vespera 安全中心声称抓包记录 `captured_tls_0427` 证明 Eli 对 `10.88.10.5:8443` 发起了自动化扫描。',
    nodes: [
      {
        id: 'node_pcap_0427',
        label: 'captured_tls_0427.pcap',
        address: '10.0.2.15:51944 -> 10.88.10.5:8443',
        role: 'Disputed TLS 1.3 Session Capture (02:14:11 UTC)',
        roleZh: '存在争议的 TLS 1.3 握手抓包样本（02:14:11 UTC）',
        status: 'compromised',
      },
      {
        id: 'node_ja4_db',
        label: 'GreyOS JA4 Baseline Database',
        address: 'Offline Signature Index',
        role: 'Reference Profiles (greyos-diag-cli vs. Firefox 124 vs. Stateless Scanner)',
        roleZh: '本地已知客户端指纹基线库（含 greyos-diag-cli、Firefox 与扫描器特征）',
        status: 'nominal',
      },
    ],
    diagnosticActions: [
      {
        id: 'diag_09_compute_ja4',
        label: 'Parse `ClientHello` Ciphers/Extensions & Compute Canonical JA4 Fingerprint',
        labelZh: '解析 `ClientHello` 密码套件与扩展项并计算规范化 JA4 指纹',
        commandPreview: 'ja4-inspect --pcap captured_tls_0427 --canonical-sort',
        targetNode: 'captured_tls_0427.pcap',
        telemetryOutput: [
          '[PCAP TARGET] 10.0.2.15:51944 -> 10.88.10.5:8443 (SNI: gateway.vespera.internal)',
          '  Ciphers (04)   : 1301, 1302, 1303, c02b',
          '  Extensions (06): 0000, 000a, 000b, 000d, 0010, 002b',
          '  Computed JA4   : t13d0406h2_77f0cd3447db_5d4d534e3685',
          '  Baseline Match : greyos-diag-cli/1.4 (Go crypto/tls minimal diagnostic client)',
          '  Browser Diff   : Does NOT match Firefox 124 (t13d1516h2_8daaf6152771_e5627efa2ab1)',
        ].join('\n'),
        telemetryOutputZh: [
          '【抓包解析】10.0.2.15:51944 -> 10.88.10.5:8443 (SNI: gateway.vespera.internal)',
          '  密码套件 (04) : 1301, 1302, 1303, c02b',
          '  扩展字段 (06) : 0000, 000a, 000b, 000d, 0010, 002b',
          '  规范化 JA4    : t13d0406h2_77f0cd3447db_5d4d534e3685',
          '  基线匹配结果  : greyos-diag-cli/1.4（Go crypto/tls 极简诊断客户端）',
          '  浏览器对比    : 与标准 Firefox 124 (t13d1516h2_...) 特征明显不同',
        ].join('\n'),
        revealsClue:
          'Computed canonical JA4 `t13d0406h2_77f0cd3447db_5d4d534e3685`, matching `greyos-diag-cli/1.4` (4 ciphers, 6 extensions).',
        revealsClueZh:
          '计算出规范化 JA4 指纹 `t13d0406h2_77f0cd3447db_5d4d534e3685`，精确匹配 `greyos-diag-cli/1.4` 诊断工具特征。',
        isCriticalClue: true,
      },
      {
        id: 'diag_09_flow_state',
        label: 'Inspect TCP Handshake Completeness & Port Cadence Telemetry',
        labelZh: '核查 TCP 握手完整性、端口序列与会话持续时间遥测',
        commandPreview: 'ja4-inspect --flow-telemetry captured_tls_0427',
        targetNode: 'captured_tls_0427.pcap',
        telemetryOutput: [
          '[TCP STATE] SYN -> SYN-ACK -> ACK (Complete 3-way handshake, NOT half-open SYN)',
          '  Ports Contacted  : 1 (8443/tcp only)',
          '  Packets Exchanged: 18 packets over 42.8 seconds (Interactive diagnostic cadence)',
          '  Scanner Verdict  : NEGATIVE (Zero stateless SYN scan anomalies detected)',
        ].join('\n'),
        telemetryOutputZh: [
          '【TCP 状态】SYN -> SYN-ACK -> ACK（完整三次握手，绝非半开 SYN 扫描）',
          '  访问端口数 : 仅 1 个端口 (8443/tcp)',
          '  报文交互量 : 42.8 秒内交互 18 个报文（典型的单次交互式诊断节奏）',
          '  扫描器判定 : 否（未发现任何无状态高频端口扫描特征）',
        ].join('\n'),
        revealsClue:
          'Telemetry proves `captured_tls_0427` was a single 42.8-second completed TCP/TLS diagnostic session on port 8443—refuting Vespera’s mass-scanner fabrication.',
        revealsClueZh:
          '连接状态遥测证实 `captured_tls_0427` 只是 8443 端口上一段持续 42.8 秒的单次完整握手，彻底驳斥了“大规模扫描”的栽赃指控。',
        isCriticalClue: true,
      },
    ],
    resolutions: [
      {
        id: 'res_09_verify_ja4_attribution',
        label: 'Correlate Canonical JA4 Fingerprint & Stateful TCP Telemetry Report',
        labelZh: '生成 JA4 规范化指纹与连接状态遥测交叉归因报告',
        commandPreview: 'ja4-inspect captured_tls_0427',
        approach: 'analytical',
        isOptimal: true,
        requiresDiagnosticIds: ['diag_09_compute_ja4', 'diag_09_flow_state'],
        outcomeSummary:
          'Validated passive JA3/JA4 attribution and TCP flow state verification. Unlocked `ja4-inspect` for your workstation.',
        outcomeSummaryZh:
          '成功掌握被动 JA3/JA4 指纹归因与 TCP 状态遥测核验方法，已解锁终端命令 `ja4-inspect`。将其应用到 `captured_tls_0427` 即可记录取证结论。',
        suspicionDelta: 0,
        exposureDelta: 0,
        trustNadiaDelta: 0,
      },
      {
        id: 'res_09_active_replay',
        label: 'Replay Raw SYN Packets Against `10.88.10.5` to Test Firewall Reaction',
        labelZh: '直接向 `10.88.10.5` 重放原始 SYN 数据包以测试防火墙反应',
        commandPreview: 'hping3 -S -p 8443 --flood 10.88.10.5',
        approach: 'brute_force',
        isOptimal: false,
        requiresDiagnosticIds: [],
        outcomeSummary:
          'Sending live flood packets to Vespera’s relay generated the exact anomalous traffic pattern their SOC was hoping to pin on you (+10% Corporate Suspicion, +10% Exposure).',
        outcomeSummaryZh:
          '向企业中继节点主动发送探测洪流，反而制造了对方安全中心原本想要栽赃给你的攻击告警（企业怀疑度 +10%，暴露度 +10%）。',
        suspicionDelta: 10,
        exposureDelta: 10,
        trustNadiaDelta: 0,
      },
    ],
    storyApplication: {
      id: 'app_09_verify_tls_capture',
      targetHostOrFile: '10.88.10.5',
      actionLabel: 'Run `ja4-inspect captured_tls_0427` to Verify Handshake Attribution',
      actionLabelZh: '对 `captured_tls_0427` 运行 `ja4-inspect` 锁定 TLS 握手归因证据',
      analyticalCommand: 'ja4-inspect captured_tls_0427',
      bruteForceCommand: 'probe 10.88.10.5 --flood',
      analyticalOutcome:
        'Verified JA4 fingerprint (`t13d0406h2_77f0cd3447db_5d4d534e3685`) and single-port stateful flow telemetry on `captured_tls_0427` (`tls_attribution_verified`, -5% Suspicion, +5% Nadia Trust).',
      analyticalOutcomeZh:
        '已完成 `captured_tls_0427` 的 JA4 指纹 (`t13d0406h2_77f0cd3447db_5d4d534e3685`) 与连接状态归因核验（记录 `tls_attribution_verified`，企业怀疑度 -5%，Nadia 信任度 +5%）。',
      bruteForceOutcome:
        'Active packet replay triggered Vespera IDS rate-limiting alerts (+10% Suspicion, +10% Exposure).',
      bruteForceOutcomeZh:
        '主动重放探测报文触发了 Vespera 入侵检测系统的速率告警（怀疑度 +10%，暴露度 +10%）。',
      analyticalSuspicionDelta: -5,
      analyticalExposureDelta: 0,
      analyticalTrustDelta: 5,
      bruteForceSuspicionDelta: 10,
      bruteForceExposureDelta: 10,
    },
  },
  unlocks: {
    capabilities: ['tls_fingerprint_inspector'],
    tools: ['ja4-inspect'],
    badgeLabel: 'JA3/JA4 TLS Attribution Inspector',
    badgeLabelZh: 'TLS 握手画像与流状态分析器',
  },
  source: {
    repository: 'Lauren-Bitten/CyberSecurity-Projects',
    upstreamRepository: 'CarterPerez-dev/Cybersecurity-Projects',
    fork: 'Lauren-Bitten/CyberSecurity-Projects',
    license: 'AGPL-3.0',
    sectionPath: 'PROJECTS/intermediate/ja3-ja4-tls-fingerprinting & PROJECTS/advanced/zig-stateless-scanner & PROJECTS/beginner/simple-port-scanner',
    sectionTitle: 'JA3/JA4 TLS Fingerprinting & Connection State Telemetry Concepts',
    adaptationNote:
      'Adapted strictly as a passive ClientHello JA3/JA4 attribution and TCP flow-state analysis lab; active scanning and fingerprint spoofing are excluded.',
    adaptationNoteZh:
      '基于 JA3/JA4 TLS 指纹识别与连接状态遥测原理改编的纯被动取证实验（不包含主动扫描器或指纹伪造）。',
  },
  reviewStatus: 'reviewed',
};
