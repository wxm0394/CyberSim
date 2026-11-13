import { LearningLesson } from '../../learning/lessonTypes';

export const DNS_LESSON: LearningLesson = {
  id: 'lesson_02_dns',
  levelNumber: 2,
  code: 'LEVEL 02 · MVP LAB 01',
  title: 'The False Address',
  titleZh: '错误的地址',
  difficulty: 2,
  sourceTrack: 'network_internet',
  category: 'investigation',
  prerequisites: [],
  isMvpCoreLab: true,
  narrativeHook:
    'Nadia’s notes reference the internal hostname `lantern-db.vespera.internal`. Yet whenever your workstation resolves that domain, traffic is silently steered to `10.88.99.66`—a deceptive SOC sinkhole—instead of the real gateway `10.88.4.22`. Someone poisoned your name resolution path.',
  narrativeHookZh:
    'Nadia 的调查笔记指向内网域名 `lantern-db.vespera.internal`。然而每当你的工作站解析该域名时，流量却被导向了 `10.88.99.66`（企业安全部的蜜罐陷阱），而非真实的日志网关 `10.88.4.22`。你的域名解析链路遭到了投毒。',
  concepts: [
    {
      id: 'concept_dns_lookup_order',
      title: 'Resolution Precedence: Local Hosts & Cache Before Recursive DNS',
      titleZh: '域名解析优先级：本地 Hosts 与缓存优先于递归 DNS 服务器',
      summary:
        'Before sending a UDP/53 query to an external DNS resolver, an operating system checks its local `/etc/hosts` static table and local DNS stub cache. If an attacker or malware injects a forged mapping into `/etc/hosts` or poisons the default ISP/corporate recursive resolver, the application connects to the wrong IP before any TLS or HTTP request even begins.',
      summaryZh:
        '操作系统在向远程 DNS 服务器发起查询前，会优先读取本地 `/etc/hosts` 静态映射表与本地解析缓存。一旦 `/etc/hosts` 被篡改，或默认递归 DNS 返回了伪造记录（DNS 劫持/污染），程序在建立连接的第一步就会走向错误的 IP 地址。',
      keyTerms: ['/etc/hosts Priority', 'Recursive Resolver', 'Authoritative Name Server', 'DNS Cache Poisoning'],
      practicalRule:
        'When a domain points to a suspicious IP, compare `/etc/hosts`, the default recursive resolver response, and an encrypted/trusted authoritative DNS server.',
      practicalRuleZh:
        '当怀疑域名解析异常时，应依次比对：1. 本地 `/etc/hosts` 文件；2. 默认递归 DNS 响应；3. 可信权威/加密 DNS 的解析结果。',
      diagramLines: [
        'Query: lantern-db.vespera.internal',
        '  1. /etc/hosts           --> [POISONED] 10.88.99.66 (SOC Sinkhole!)',
        '  2. Default ISP/Corp DNS --> [HIJACKED] 10.88.99.66 (Forged UDP/53 reply)',
        '  3. Authoritative / DoH  --> [AUTHENTIC] 10.88.4.22 (vespera-log-gw01)',
      ],
    },
    {
      id: 'concept_dns_hijack_vs_pollution',
      title: 'DNS Hijacking vs. Cache Poisoning & Sanitization',
      titleZh: 'DNS 劫持/污染机制与干净解析恢复',
      summary:
        'Plaintext UDP/53 queries carry no cryptographic signature, making them trivial to intercept or spoof on untrusted networks. Sanitizing `/etc/hosts`, flushing the poisoned resolver cache, and pinning verified authoritative records prevents silent redirection into honeypots.',
      summaryZh:
        '传统明文 UDP 53 端口的 DNS 查询缺乏签名校验，极易在局域网或运营商链路中被抢答伪造。清理被篡改的 `/etc/hosts` 条目、刷新本地 DNS 缓存并锁定经过交叉验证的真实 IP，是避免踏入蜜罐的关键。',
      keyTerms: ['UDP/53 Spoofing', 'Sinkhole / Honeypot IP', 'DNS Cache Flush', 'Verified Host Pinning'],
      practicalRule:
        'Never blindly connect to a resolved hostname during an incident investigation without verifying the underlying IP against independent forensic logs.',
      practicalRuleZh:
        '在取证调查中，切勿盲目信任默认域名解析结果；必须将解析出的 IP 与底层访问日志交叉核验后再发起连接。',
      diagramLines: [
        'Sanitization Workflow:',
        '  [Inspect /etc/hosts] -> [Compare dig @10.88.0.1 vs @9.9.9.9] -> [Purge Poison & Flush Cache]',
      ],
    },
  ],
  lab: {
    id: 'lab_02_dns_investigation',
    code: 'NETLAB-02 · MVP-01',
    title: 'DNS Poisoning & Hosts Hijack Investigation',
    titleZh: 'DNS 污染与 Hosts 劫持排查实验',
    objective:
      'Compare local `/etc/hosts`, the untrusted corporate recursive DNS (`10.88.0.1`), and the verified Daniel Cross forensic resolver (`10.0.2.53`) to uncover the fake sinkhole IP (`10.88.99.66`) and restore clean resolution to `10.88.4.22`.',
    objectiveZh:
      '比对本地 `/etc/hosts`、受污染的企业递归 DNS (`10.88.0.1`) 与 Daniel Cross 搭建的可信取证解析器 (`10.0.2.53`)，揪出伪造的蜜罐地址 (`10.88.99.66`) 并将域名恢复至真实网关 `10.88.4.22`。',
    environmentBanner: 'GREYOS SANDBOX // DOMAIN: lantern-db.vespera.internal // RESOLVER AUDIT',
    initialSymptom:
      'Running `ping lantern-db.vespera.internal` resolves to `10.88.99.66` (Vespera SOC Decoy Collector) instead of the real log gateway `10.88.4.22`.',
    initialSymptomZh:
      '执行 `ping lantern-db.vespera.internal` 时，系统将其解析到了 `10.88.99.66`（Vespera 安全部诱捕节点），而非真实网关 `10.88.4.22`。',
    nodes: [
      {
        id: 'node_hosts',
        label: '/etc/hosts (Local Override)',
        address: '127.0.0.1 / local',
        role: 'Static Hostname Table (Injected by legacy corporate script)',
        roleZh: '本地静态域名映射表（残留企业脚本篡改）',
        status: 'compromised',
      },
      {
        id: 'node_corp_dns',
        label: 'vespera-corp-dns01',
        address: '10.88.0.1:53',
        role: 'Untrusted Recursive Resolver (Sinkhole Redirect Active)',
        roleZh: '不可信的默认递归 DNS（已启用蜜罐重定向）',
        status: 'suspect',
      },
      {
        id: 'node_auth_dns',
        label: 'underground-doh-ns',
        address: '10.0.2.53:853',
        role: 'Verified Encrypted Forensic Resolver',
        roleZh: '可信加密取证 DNS 解析器',
        status: 'nominal',
      },
    ],
    diagnosticActions: [
      {
        id: 'diag_dns_hosts',
        label: 'Inspect Local /etc/hosts File',
        labelZh: '检查本地 /etc/hosts 静态映射文件',
        commandPreview: 'cat /etc/hosts',
        targetNode: '/etc/hosts',
        telemetryOutput: [
          '127.0.0.1       localhost',
          '10.0.2.15       apt4b-workstation.local',
          '# [VESPERA TELEMETRY HOOK - DO NOT EDIT]',
          '10.88.99.66     lantern-db.vespera.internal vespera-log-gw01.corp',
        ].join('\n'),
        telemetryOutputZh: [
          '127.0.0.1       localhost',
          '10.0.2.15       apt4b-workstation.local',
          '# [VESPERA 遗留遥测钩子 - 篡改项]',
          '10.88.99.66     lantern-db.vespera.internal vespera-log-gw01.corp  <-- 强制劫持到蜜罐 IP！',
        ].join('\n'),
        revealsClue:
          'CRITICAL: A lingering Vespera telemetry hook in `/etc/hosts` hardcodes `lantern-db.vespera.internal` to the `10.88.99.66` SOC sinkhole!',
        revealsClueZh:
          '关键发现：本地 `/etc/hosts` 中残留的 Vespera 遥测钩子将 `lantern-db.vespera.internal` 强行指向了 `10.88.99.66` 蜜罐地址！',
        isCriticalClue: true,
      },
      {
        id: 'diag_dns_compare_resolvers',
        label: 'Compare Default UDP/53 Resolver vs. Encrypted Forensic Resolver',
        labelZh: '对比默认递归 DNS 与加密取证解析器的响应',
        commandPreview: 'dig @10.88.0.1 lantern-db.vespera.internal +short && dig @10.0.2.53 lantern-db.vespera.internal +short',
        targetNode: '10.88.0.1 vs 10.0.2.53',
        telemetryOutput: [
          ';; Querying 10.88.0.1 (UDP/53 Plaintext Recursive):',
          'lantern-db.vespera.internal.  60  IN  A  10.88.99.66   [SPOOFED SINKHOLE]',
          '',
          ';; Querying 10.0.2.53 (Signed DNSSEC / DoT Snapshot):',
          'lantern-db.vespera.internal.  300 IN  A  10.88.4.22    [AUTHENTIC LOG GATEWAY]',
        ].join('\n'),
        telemetryOutputZh: [
          ';; 查询默认递归服务器 10.88.0.1 (明文 UDP/53)：',
          'lantern-db.vespera.internal.  60  IN  A  10.88.99.66   [伪造的蜜罐抢答]',
          '',
          ';; 查询可信加密解析器 10.0.2.53 (签名快照校验)：',
          'lantern-db.vespera.internal.  300 IN  A  10.88.4.22    [真实日志网关地址]',
        ].join('\n'),
        revealsClue:
          'CRITICAL: Both `/etc/hosts` and the plaintext recursive resolver return `10.88.99.66`, while the signed authoritative record proves the real IP is `10.88.4.22`.',
        revealsClueZh:
          '关键发现：明文递归 DNS 同样遭到污染返回 `10.88.99.66`，而加密签名记录证实真实网关 IP 为 `10.88.4.22`。',
        isCriticalClue: true,
      },
    ],
    resolutions: [
      {
        id: 'res_02_sanitize_dns',
        label: 'Purge Poisoned /etc/hosts Entry, Flush Cache & Pin Verified 10.88.4.22',
        labelZh: '清除 /etc/hosts 投毒条目、刷新缓存并锁定真实 IP 10.88.4.22',
        commandPreview: 'dns-inspect --purge-hosts --flush-cache --pin lantern-db.vespera.internal=10.88.4.22',
        approach: 'analytical',
        isOptimal: true,
        requiresDiagnosticIds: ['diag_dns_hosts', 'diag_dns_compare_resolvers'],
        outcomeSummary:
          'Removed the sinkhole redirect (`10.88.99.66`), pinned `lantern-db.vespera.internal` to `10.88.4.22`, and unlocked the Resolver Inspector capability.',
        outcomeSummaryZh:
          '成功清除指向 `10.88.99.66` 的劫持规则，将域名安全绑定至真实网关 `10.88.4.22`，并解锁【DNS 解析检查器】能力。',
        suspicionDelta: -5,
        exposureDelta: -5,
        trustNadiaDelta: 5,
      },
      {
        id: 'res_02_blind_connect',
        label: 'Skip DNS Verification and Connect Directly to Resolved 10.88.99.66',
        labelZh: '跳过解析核查，直接连接默认解析出的 10.88.99.66',
        commandPreview: 'curl https://lantern-db.vespera.internal (resolves to 10.88.99.66)',
        approach: 'brute_force',
        isOptimal: false,
        requiresDiagnosticIds: [],
        outcomeSummary:
          'Your unverified request hit Vespera’s `10.88.99.66` DNS sinkhole collector, immediately flagging your workstation IP (+15% Corporate Suspicion, +10% Exposure).',
        outcomeSummaryZh:
          '未做 DNS 核查便直接连接，流量落入 `10.88.99.66` 蜜罐收集器，导致工作站 IP 被安全部标记（企业怀疑度 +15%，暴露度 +10%）。',
        suspicionDelta: 15,
        exposureDelta: 10,
        trustNadiaDelta: 0,
      },
    ],
    storyApplication: {
      id: 'app_02_dns_sanitization',
      targetHostOrFile: '10.88.4.22',
      actionLabel: 'Run Resolver Inspector to Purge Vespera Sinkhole DNS Hook on Workstation',
      actionLabelZh: '运行【DNS 解析检查器】清除工作站上的企业蜜罐域名劫持',
      analyticalCommand: 'dns-inspect --sanitize',
      bruteForceCommand: 'probe lantern-db.vespera.internal --unverified',
      analyticalOutcome:
        'Sanitized local `/etc/hosts` and DNS cache on GreyOS, neutralizing Vespera’s sinkhole beacon (-5% Corporate Suspicion, -5% Exposure).',
      analyticalOutcomeZh:
        '已净化 GreyOS 本地的 `/etc/hosts` 与 DNS 缓存，彻底切断发往企业蜜罐的后台解析信标（怀疑度 -5%，暴露度 -5%）。',
      bruteForceOutcome:
        'Connecting via poisoned DNS leaked connection attempts to Vespera SOC sinkhole `10.88.99.66` (+15% Corporate Suspicion, +10% Exposure).',
      bruteForceOutcomeZh:
        '使用受污染的默认 DNS 发起连接，导致请求直达企业蜜罐 `10.88.99.66`（怀疑度 +15%，暴露度 +10%）。',
      analyticalSuspicionDelta: -5,
      analyticalExposureDelta: -5,
      analyticalTrustDelta: 5,
      bruteForceSuspicionDelta: 15,
      bruteForceExposureDelta: 10,
    },
  },
  unlocks: {
    capabilities: ['resolver_inspector'],
    tools: ['dns-inspect'],
    badgeLabel: 'Resolver Inspector',
    badgeLabelZh: 'DNS 解析与防劫持检查器',
  },
  source: {
    repository: 'hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    sectionPath: 'docs/abc/4dns.md & docs/dns&hosts/',
    sectionTitle: 'DNS 解析原理、Hosts 文件与 DNS 污染/劫持',
    adaptationNote:
      'Adapted from fq-book chapters on DNS resolution hierarchy, /etc/hosts overrides, and DNS hijacking/poisoning.',
    adaptationNoteZh:
      '改编自《这本书能让你连接互联网》中关于 DNS 寻址原理、Hosts 映射优先级及 DNS 劫持与污染防治的章节。',
  },
  reviewStatus: 'reviewed',
};
