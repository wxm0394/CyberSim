import { LearningLesson } from '../../learning/lessonTypes';

export const OSINT_LESSON: LearningLesson = {
  id: 'lesson_07_osint_opsec',
  levelNumber: 7,
  code: 'LEVEL 07 · OPSEC',
  title: 'Shadow Footprints',
  titleZh: '数字足迹与暗网边界',
  difficulty: 2,
  sourceTrack: 'network_internet',
  category: 'privacy_opsec',
  prerequisites: [],
  isMvpCoreLab: false,
  narrativeHook:
    'Rumors online claim Project LANTERN is a mythical “Dark Web AI”, while Vespera’s PR team deleted their 2026 municipal contract pages from the public web. To separate reality from myth, you must distinguish Surface Web, Deep Web, and Dark Web—and recover deleted public records without leaking your identity.',
  narrativeHookZh:
    '网络流言将“灯塔计划”渲染成某种神秘的“暗网幽灵系统”，与此同时 Vespera 公关部悄然删除了官网上 2026 年的市政外包中标公告。为了厘清事实，你需要认清表层网、深网与暗网的真实技术边界，并通过历史快照安全取回被删档案。',
  concepts: [
    {
      id: 'concept_surface_deep_dark_web',
      title: 'Surface Web vs. Deep Web vs. Dark Web: Demystifying the Iceberg',
      titleZh: '表层网、深网（Deep Web）与暗网（Dark Web）的真实技术边界',
      summary:
        'The Surface Web is anything indexed by search engines. The Deep Web simply means pages not indexed by search engines—such as private databases, internal corporate intranets (`10.88.4.22`), medical portals, and login-gated webmail. The Dark Web is a small subset that requires specific overlay routing protocols (like Tor `.onion` or I2P) to access.',
      summaryZh:
        '表层网（Surface Web）是指能被搜索引擎抓取的公开网页；深网（Deep Web）其实就在我们身边——任何未被搜索引擎索引的页面（如你的个人邮箱后台、企业内网数据库 `10.88.4.22`、网银账单）都属于深网；而暗网（Dark Web）仅指必须通过特定匿名覆盖网络协议（如 Tor `.onion` 或 I2P）才能访问的加密站点。',
      keyTerms: ['Surface Web (Indexed)', 'Deep Web (Unindexed Intranet / DB)', 'Dark Web (Overlay Network)', 'Web Archive Snapshot'],
      practicalRule:
        'Most corporate cover-ups live in unindexed Deep Web databases or deleted Surface Web pages cached in web archives—not on sensationalized darknet markets.',
      practicalRuleZh:
        '绝大多数企业阴谋的证据都藏在未公开索引的“深网”内网数据库或已被删除但仍留存于网页时光机（Web Archive）的公开快照中，而非猎奇的暗网传闻里。',
      diagramLines: [
        'Surface Web : Public news & company websites (Indexed by crawlers)',
        'Deep Web    : Vespera internal DB (10.88.4.22), authenticated portals (90%+ of normal web)',
        'Dark Web    : Overlay networks requiring special routing (Tor / I2P dead-drops)',
      ],
    },
    {
      id: 'concept_opsec_fingerprint',
      title: 'OSINT Search Operators, Web Archives & Operational Exposure (OPSEC)',
      titleZh: '精准检索语法、历史网页快照与操作安全（OPSEC）',
      summary:
        'Querying a target corporation’s live web server directly for deleted files (`404`) logs your IP and user-agent in their access logs. Querying an independent Web Archive snapshot or using precise search operators (`site:`, `filetype:pdf`) retrieves the document passively with zero target touch.',
      summaryZh:
        '直接向目标企业的线上服务器高频扫描已被删除的敏感文件，会在对方日志中留下你的 IP 与浏览器指纹。相反，通过第三方网页历史存档（Web Archive）或精确检索语法提取缓存快照，能实现“零接触”被动取证。',
      keyTerms: ['Passive OSINT', 'Web Archive Snapshot', 'Metadata & User-Agent Hygiene', 'Threat Modeling'],
      practicalRule:
        'Prefer passive archive snapshots over active probing of corporate web servers whenever historical documents are needed.',
      practicalRuleZh:
        '凡是能通过离线日志或第三方历史快照获取的情报，绝不直接向目标生产服务器发起高噪探测。',
      diagramLines: [
        'Active Probe (Noisy) : [You] ---> GET /contracts/2026_lantern.pdf ---> [Vespera WAF Alert!]',
        'Passive OSINT (Clean): [You] ---> Query Cached Snapshot 2026-11-14 ---> [Retrieved at 0% Risk]',
      ],
    },
  ],
  lab: {
    id: 'lab_07_osint_archive',
    code: 'NETLAB-07',
    title: 'Passive Web Archive Recovery & OPSEC Threat Audit',
    titleZh: '被动网页快照取证与行动安全（OPSEC）审计实验',
    objective:
      'Recover Vespera’s deleted 2026 municipal contract specification (`lantern_municipal_rfp.pdf`) using passive archive snapshots and classify the network layers without alerting Vespera’s live WAF.',
    objectiveZh:
      '利用被动历史快照找回 Vespera 已从官网删除的 2026 年市政采购招标书 (`lantern_municipal_rfp.pdf`)，并清理本地元数据指纹，避免触发企业 WAF 告警。',
    environmentBanner: 'GREYOS SANDBOX // OSINT ARCHIVE & OPSEC AUDITOR // PASSIVE RECON',
    initialSymptom:
      'Vespera deleted `vespera.corp/public/2026/lantern_municipal_rfp.pdf` from its live server and set a WAF canary trap on that URL path.',
    initialSymptomZh:
      'Vespera 已将官网上的 `lantern_municipal_rfp.pdf` 删除，并在原 URL 路径上部署了 WAF 访问告警陷阱。',
    nodes: [
      {
        id: 'node_vespera_waf',
        label: 'vespera.corp (Live Surface Web WAF)',
        address: '198.51.100.44:443',
        role: 'Live Corporate Server (Triggers alert if /2026/lantern_municipal_rfp.pdf is requested)',
        roleZh: '企业线上官网（直接请求被删路径会触发 WAF 蜜罐告警）',
        status: 'compromised',
      },
      {
        id: 'node_web_archive',
        label: 'archive-mirror.greyhaven.lib',
        address: 'Offline / Passive Snapshot Index',
        role: 'Civic Web Archive (Holds 2026-11-14 crawl snapshot)',
        roleZh: '公共数字图书馆网页快照库（保存有 2026-11-14 历史抓取副本）',
        status: 'nominal',
      },
    ],
    diagnosticActions: [
      {
        id: 'diag_archive_query',
        label: 'Query Passive Web Archive Index by URL & Filetype Operator',
        labelZh: '使用被动检索语法查询公共网页快照库',
        commandPreview: 'archive-search --query "site:vespera.corp filetype:pdf lantern_municipal_rfp"',
        targetNode: 'archive-mirror.greyhaven.lib',
        telemetryOutput: [
          '[SNAPSHOT FOUND] Crawl Date: 2026-11-14 09:12 UTC',
          '  Original URL : https://vespera.corp/public/2026/lantern_municipal_rfp.pdf',
          '  Excerpt      : "Project LANTERN Phase II: Automated Behavioral Risk Scoring for Municipal Sublets (Sponsor: Director Marcus Hale)."',
          '  Target Server Contacted: NO (100% Passive Retrieval)',
        ].join('\n'),
        telemetryOutputZh: [
          '【命中历史快照】抓取时间：2026-11-14 09:12 UTC',
          '  原始路径 : https://vespera.corp/public/2026/lantern_municipal_rfp.pdf',
          '  关键摘要 : “灯塔计划二期：面向市政租户的自动化行为风险评分系统（项目负责人：Marcus Hale）。”',
          '  是否惊动目标服务器 : 否（100% 被动归档检索）',
        ].join('\n'),
        revealsClue:
          'Recovered the deleted 2026 contract confirming Marcus Hale sponsored Project LANTERN—without sending a single packet to Vespera’s live WAF.',
        revealsClueZh:
          '在不向 Vespera 线上服务器发送任何数据包的情况下，成功从历史快照中提取出证实 Marcus Hale 主导灯塔计划的招标文件。',
        isCriticalClue: true,
      },
      {
        id: 'diag_opsec_headers',
        label: 'Audit Local Client Metadata & Strip Identifying User-Agent / Referer',
        labelZh: '审计本地客户端请求头并剥离可识别的员工指纹元数据',
        commandPreview: 'opsec-check --inspect-headers /home/eli/.config/curlrc',
        targetNode: 'Local Client Config',
        telemetryOutput: [
          '[WARNING] Legacy ~/.config/curlrc contains header: "X-Vespera-Dev-ID: e.ward_09"',
          '[CLASSIFICATION] 10.88.4.22 is an unindexed Deep Web intranet host (NOT a Dark Web .onion node).',
        ].join('\n'),
        telemetryOutputZh: [
          '【高危发现】本地旧配置文件 ~/.config/curlrc 仍残留自定义请求头："X-Vespera-Dev-ID: e.ward_09"！',
          '【边界确认】10.88.4.22 属于未公开索引的企业深网（Deep Web）内网节点，而非暗网节点。',
        ].join('\n'),
        revealsClue:
          'Found a lingering `X-Vespera-Dev-ID: e.ward_09` header in Eli’s local config that would immediately identify him if not scrubbed.',
        revealsClueZh:
          '发现本地旧配置中残留了 `X-Vespera-Dev-ID: e.ward_09` 标识头，若不清除将直接暴露 Eli 的身份。',
        isCriticalClue: true,
      },
    ],
    resolutions: [
      {
        id: 'res_07_passive_osint_scrub',
        label: 'Extract Passive Snapshot & Scrub Legacy `e.ward_09` Client Metadata',
        labelZh: '从被动快照提取证据并清除本地残留的 `e.ward_09` 指纹头',
        commandPreview: 'archive-search --extract-snapshot 20261114 --scrub-client-headers',
        approach: 'analytical',
        isOptimal: true,
        requiresDiagnosticIds: ['diag_archive_query', 'diag_opsec_headers'],
        outcomeSummary:
          'Recovered the 2026 contract via passive archive search and scrubbed the legacy employee ID header from GreyOS. Unlocked Archive Search capability.',
        outcomeSummaryZh:
          '通过被动历史快照安全取回 2026 年招标档案，并清除了 GreyOS 客户端残留的旧工号请求头。成功解锁【数字档案检索器】。',
        suspicionDelta: -5,
        exposureDelta: -10,
        trustNadiaDelta: 5,
      },
      {
        id: 'res_07_scrape_live_waf',
        label: 'Run Aggressive Directory Brute-Force Against Live `vespera.corp` Server',
        labelZh: '直接对 `vespera.corp` 线上服务器发起目录爆破爬虫',
        commandPreview: 'dirb https://vespera.corp/public/2026/ (with X-Vespera-Dev-ID header)',
        approach: 'brute_force',
        isOptimal: false,
        requiresDiagnosticIds: [],
        outcomeSummary:
          'Hammering Vespera’s live website with your legacy `e.ward_09` header tripped their WAF canary (+10% Corporate Suspicion, +15% Player Exposure).',
        outcomeSummaryZh:
          '带着残留的 `e.ward_09` 请求头直接爆破企业官网，触发了线上 WAF 蜜罐告警（企业怀疑度 +10%，暴露度 +15%）。',
        suspicionDelta: 10,
        exposureDelta: 15,
        trustNadiaDelta: 0,
      },
    ],
    storyApplication: {
      id: 'app_07_opsec_header_scrub',
      targetHostOrFile: '10.0.2.15',
      actionLabel: 'Run Archive Search & OPSEC Scrub to Erase Legacy e.ward_09 Telemetry Headers',
      actionLabelZh: '运行【档案检索与 OPSEC 清理】抹除本机残留工号指纹并挂载历史快照',
      analyticalCommand: 'archive-search --scrub-opsec',
      bruteForceCommand: 'curl https://vespera.corp/public/2026/lantern_municipal_rfp.pdf',
      analyticalOutcome:
        'Scrubbed legacy `e.ward_09` client headers and attached passive 2026 contract snapshot (-5% Suspicion, -10% Player Exposure).',
      analyticalOutcomeZh:
        '已彻底抹除本机残留的 `e.ward_09` 客户端指纹并附上 2026 历史招标快照（怀疑度 -5%，暴露度 -10%）。',
      bruteForceOutcome:
        'Live server request leaked your legacy employee header to Vespera WAF (+10% Suspicion, +15% Exposure).',
      bruteForceOutcomeZh:
        '直接请求企业线上服务器导致旧工号指纹被 WAF 捕获（怀疑度 +10%，暴露度 +15%）。',
      analyticalSuspicionDelta: -5,
      analyticalExposureDelta: -10,
      analyticalTrustDelta: 5,
      bruteForceSuspicionDelta: 10,
      bruteForceExposureDelta: 15,
    },
  },
  unlocks: {
    capabilities: ['archive_search'],
    tools: ['archive-search'],
    badgeLabel: 'Archive Search & OPSEC Hygiene',
    badgeLabelZh: '被动档案检索与行动安全',
  },
  source: {
    repository: 'hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    sectionPath: 'docs/abc/darkweb.md & docs/web/',
    sectionTitle: '表层网、深网与暗网辨析及信息检索技巧',
    adaptationNote:
      'Adapted from fq-book chapters clarifying Surface/Deep/Dark Web concepts and search/archive retrieval strategies.',
    adaptationNoteZh:
      '改编自《这本书能让你连接互联网》中关于表层网/深网/暗网概念祛魅与数字档案检索技巧的章节。',
  },
  reviewStatus: 'reviewed',
};
