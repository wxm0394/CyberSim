import { LearningLesson } from '../../learning/lessonTypes';

export const PERSISTENCE_LESSON: LearningLesson = {
  id: 'lesson_08_persistence',
  levelNumber: 8,
  code: 'LEVEL 08 · HOST FORENSICS',
  title: 'The Persistent Shadow',
  titleZh: '宿主驻留之影与元数据清理',
  difficulty: 2,
  sourceTrack: 'tactical_security',
  category: 'host_forensics',
  prerequisites: ['lesson_07_osint_opsec'],
  isMvpCoreLab: false,
  narrativeHook:
    'Even after disconnecting from Vespera’s VPN, your GreyOS workstation emits periodic outbound heartbeats every 15 minutes. Meanwhile, the leaked PDF brief you intend to share with Rhea Solis carries hidden XMP/PDF producer tags linking straight back to your employee ID `e.ward_09` and apartment hostname `apt4b-workstation`.',
  narrativeHookZh:
    '即便断开了企业 VPN，你的 GreyOS 工作站依然每隔 15 分钟向外部发送一次隐蔽心跳包。与此同时，你准备交给记者 Rhea Solis 的事件简报 PDF 中，潜藏着直接指向你工号 `e.ward_09` 与公寓主机名 `apt4b-workstation` 的文档元数据。',
  concepts: [
    {
      id: 'concept_systemd_user_persistence',
      title: 'Systemd User-Level Timers, Services & Living-off-the-Land Persistence',
      titleZh: 'Systemd 用户级定时器（Timers）与无特权驻留机制',
      summary:
        'Attackers and corporate MDM agents rarely rely solely on root crontabs anymore. By placing a `.timer` and `.service` pair inside `~/.config/systemd/user/` and enabling `OnUnitActiveSec=15min`, a background beacon executes entirely under the unprivileged user account (`eli`), surviving reboots without requiring root permissions.',
      summaryZh:
        '现代对手与企业管控代理（MDM）很少只依赖需要 root 权限的系统级 crontab。通过在 `~/.config/systemd/user/` 目录下植入配对的 `.timer` 与 `.service` 单元并设置 `OnUnitActiveSec=15min`，驻留信标即可在普通用户权限下随登录自启并周期性回传遥测数据。',
      keyTerms: ['~/.config/systemd/user/', 'OnUnitActiveSec', 'ExecStart', 'CIS Host Hardening Baseline'],
      practicalRule:
        'Always audit user-level systemd timers (`~/.config/systemd/user/*.timer`) alongside `/etc/systemd/system/` when hunting unauthorized background telemetry.',
      practicalRuleZh:
        '排查异常后台外联时，除了检查系统级目录，必须重点审计用户目录 `~/.config/systemd/user/` 下的 `.timer` 与 `.service` 单元。',
      diagramLines: [
        '[User Login] ---> systemd --user ---> vespera-Support-sync.timer (Every 15m)',
        '                                            |',
        '                                            v',
        '                           ExecStart: /home/eli/.local/bin/vsp-telemetry-sync',
      ],
    },
    {
      id: 'concept_document_metadata_opsec',
      title: 'EXIF / XMP / PDF Document Metadata Attribution & Forensically Safe Sanitization',
      titleZh: 'EXIF / XMP / PDF 文档元数据溯源与取证级脱敏副本',
      summary:
        'PDFs and office documents embed hidden XMP streams, `/Author` fields, `/CreatorTool` hostnames, and MAC-derived UUIDs. Sharing an un-scrubbed file lets corporate investigators attribute the leak to your exact workstation. However, forensic integrity requires preserving the original evidence file intact and generating a sanitized copy (`.clean.pdf`) for external sharing.',
      summaryZh:
        'PDF 与办公文档内部嵌有隐藏的 XMP 数据流、作者工号（Author）、生成主机名（CreatorTool）及唯一文档 ID。直接外发原件会让企业安全团队瞬间锁定泄密源头；但在数字取证规范下，你必须保留原始证据文件不动，并生成剥离元数据的脱敏副本（`.clean.pdf`）用于对外传递。',
      keyTerms: ['XMP / PDF Info Dictionary', 'Author & Host Attribution', 'Forensic Integrity (Preserve Original)', 'Sanitized Copy'],
      practicalRule:
        'Never overwrite original forensic evidence when scrubbing metadata—always write a verified `.clean` copy for external transmission.',
      practicalRuleZh:
        '清理文档元数据时绝不能直接覆盖原始取证样本，必须保留原件哈希完整，并另存脱敏副本用于外发。',
      diagramLines: [
        'incident_0427_brief.pdf       --> Keep intact for forensic chain-of-custody (Author: e.ward_09)',
        'incident_0427_brief.clean.pdf --> Stripped XMP/Author/Host tags (Safe to share with Rhea)',
      ],
    },
  ],
  lab: {
    id: 'lab_08_persistence_metadata',
    code: 'SECLAB-08',
    title: 'Systemd Persistence Audit & Forensic Metadata Sanitization',
    titleZh: 'Systemd 驻留信标排查与文档元数据脱敏实验',
    objective:
      'Audit GreyOS user-level systemd units to isolate Vespera’s residual telemetry timer (`vespera-Support-sync.timer`), and inspect `incident_0427_brief.pdf` for identifying XMP/PDF tags before generating a clean copy.',
    objectiveZh:
      '审计 GreyOS 用户级 systemd 单元以隔离 Vespera 残留的遥测信标 (`vespera-Support-sync.timer`)，并检测 `incident_0427_brief.pdf` 中的身份元数据。',
    environmentBanner: 'GREYOS SANDBOX // HOST FORENSICS & METADATA AUDITOR // PASSIVE FIXTURE',
    initialSymptom:
      'Outbound UDP/TCP heartbeats fire every 900 seconds from user space, and `incident_0427_brief.pdf` contains unverified producer metadata.',
    initialSymptomZh:
      '用户空间每隔 900 秒产生一次可疑外联心跳，且待外发的 `incident_0427_brief.pdf` 带有未审查的生成者元数据。',
    nodes: [
      {
        id: 'node_systemd_user',
        label: '~/.config/systemd/user/',
        address: 'vespera-Support-sync.timer',
        role: 'User-Level Systemd Timer & Service Pair (Active 15m Beacon)',
        roleZh: '用户级 Systemd 定时器与服务单元（每 15 分钟激活一次信标）',
        status: 'compromised',
      },
      {
        id: 'node_pdf_metadata',
        label: '/home/eli/Documents/incident_0427_brief.pdf',
        address: 'SHA256: 9f86d081...0a08',
        role: 'Leaked Incident Brief (Contains Embedded XMP/PDF Info Stream)',
        roleZh: '事件简报原件（内含 XMP/PDF 属性字典与主机指纹）',
        status: 'compromised',
      },
    ],
    diagnosticActions: [
      {
        id: 'diag_08_systemd_scan',
        label: 'Scan User & System Systemd Units Against CIS Persistence Baseline',
        labelZh: '扫描用户级与系统级 Systemd 单元并比对 CIS 驻留基线',
        commandPreview: 'persist-audit --inspect-units ~/.config/systemd/user/',
        targetNode: '~/.config/systemd/user/',
        telemetryOutput: [
          '[SUSPICIOUS UNIT] /home/eli/.config/systemd/user/vespera-Support-sync.timer',
          '  Schedule  : OnBootSec=2min | OnUnitActiveSec=15min (Persistent=true)',
          '  Triggers  : vespera-Support-sync.service',
          '  ExecStart : /home/eli/.local/bin/vsp-telemetry-sync --beacon 198.51.100.204:8443 --host-id eli-apt4b',
          '[BENIGN UNIT] /etc/systemd/system/logrotate.timer (Verified Debian Package)',
        ].join('\n'),
        telemetryOutputZh: [
          '【发现可疑驻留单元】/home/eli/.config/systemd/user/vespera-Support-sync.timer',
          '  触发周期 : OnBootSec=2min | OnUnitActiveSec=15min (Persistent=true)',
          '  关联服务 : vespera-Support-sync.service',
          '  执行载荷 : /home/eli/.local/bin/vsp-telemetry-sync --beacon 198.51.100.204:8443 --host-id eli-apt4b',
          '【正常系统单元】/etc/systemd/system/logrotate.timer（已验证系统签名）',
        ].join('\n'),
        revealsClue:
          'Identified `vespera-Support-sync.timer` in `~/.config/systemd/user/` executing a hidden telemetry beacon (`vsp-telemetry-sync`) to `198.51.100.204:8443` every 15 minutes.',
        revealsClueZh:
          '在 `~/.config/systemd/user/` 中锁定伪装成技术支持的 `vespera-Support-sync.timer`，该单元每 15 分钟向 `198.51.100.204:8443` 发送主机遥测信标。',
        isCriticalClue: true,
      },
      {
        id: 'diag_08_pdf_metadata',
        label: 'Inspect Embedded PDF / XMP Attribution Fields in `incident_0427_brief.pdf`',
        labelZh: '解析 `incident_0427_brief.pdf` 内部的 PDF / XMP 身份溯源字段',
        commandPreview: 'persist-audit --inspect-metadata /home/eli/Documents/incident_0427_brief.pdf',
        targetNode: '/home/eli/Documents/incident_0427_brief.pdf',
        telemetryOutput: [
          '[METADATA LEAK] Author       : e.ward_09 (CRITICAL ATTRIBUTION)',
          '[METADATA LEAK] CreatorTool  : LibreOffice 7.6 (GreyOS 6.4 // Host: apt4b-workstation)',
          '[METADATA LEAK] Producer     : Vespera Internal DocEngine (Watermark-ID: VSP-EMP-00492)',
          '[METADATA LEAK] XMP:DocumentID: uuid:3b9d7a10-4f2c-4c88-9a11-e09ward4b001',
        ].join('\n'),
        telemetryOutputZh: [
          '【高危元数据泄露】Author        : e.ward_09（直接暴露员工工号）',
          '【高危元数据泄露】CreatorTool   : LibreOffice 7.6 (GreyOS 6.4 // Host: apt4b-workstation)',
          '【高危元数据泄露】Producer      : Vespera Internal DocEngine (Watermark-ID: VSP-EMP-00492)',
          '【高危元数据泄露】XMP:DocumentID: uuid:3b9d7a10-4f2c-4c88-9a11-e09ward4b001',
        ].join('\n'),
        revealsClue:
          '`incident_0427_brief.pdf` embeds `Author: e.ward_09`, `Host: apt4b-workstation`, and employee watermark `VSP-EMP-00492`.',
        revealsClueZh:
          '`incident_0427_brief.pdf` 内嵌有 `Author: e.ward_09`、`Host: apt4b-workstation` 以及员工专属水印编号 `VSP-EMP-00492`。',
        isCriticalClue: true,
      },
    ],
    resolutions: [
      {
        id: 'res_08_quarantine_and_sanitize',
        label: 'Verify Quarantine & Non-Destructive Metadata Sanitization Workflow',
        labelZh: '验证驻留定时器隔离方案与非破坏性文档脱敏流程',
        commandPreview: 'persist-audit --quarantine vespera-Support-sync.timer && persist-audit --sanitize-copy incident_0427_brief.pdf',
        approach: 'analytical',
        isOptimal: true,
        requiresDiagnosticIds: ['diag_08_systemd_scan', 'diag_08_pdf_metadata'],
        outcomeSummary:
          'Validated the host persistence audit and non-destructive metadata scrubber workflow. Unlocked the `persist-audit` capability for your GreyOS workstation.',
        outcomeSummaryZh:
          '成功验证宿主驻留排查与非破坏性元数据脱敏流程，已解锁 GreyOS 工作站工具 `persist-audit`。现在可将该能力应用到工作站目标以完成取证与加固。',
        suspicionDelta: 0,
        exposureDelta: 0,
        trustNadiaDelta: 0,
      },
      {
        id: 'res_08_blind_rm_system',
        label: 'Blindly Delete All Systemd Timers & Overwrite Original Evidence File In-Place',
        labelZh: '盲目强删所有 Systemd 定时器并直接覆盖原始证据文件',
        commandPreview: 'rm -rf ~/.config/systemd/* && truncate -s 0 incident_0427_brief.pdf',
        approach: 'brute_force',
        isOptimal: false,
        requiresDiagnosticIds: [],
        outcomeSummary:
          'Abruptly killing system services without isolating the beacon triggered an abnormal disconnect alert, and overwriting the original PDF risked corrupting forensic chain-of-custody (+10% Exposure).',
        outcomeSummaryZh:
          '粗暴删除服务触发了异常断连告警，且直接覆盖原件破坏了取证证据链完整性（玩家暴露度 +10%）。',
        suspicionDelta: 5,
        exposureDelta: 10,
        trustNadiaDelta: 0,
      },
    ],
    storyApplication: {
      id: 'app_08_host_persistence_scrub',
      targetHostOrFile: '10.0.2.15',
      actionLabel: 'Quarantine `vespera-Support-sync.timer` & Generate `incident_0427_brief.clean.pdf`',
      actionLabelZh: '隔离 `vespera-Support-sync.timer` 驻留信标并生成 `incident_0427_brief.clean.pdf` 脱敏副本',
      analyticalCommand: 'persist-audit --quarantine vespera-Support-sync.timer && persist-audit --sanitize-copy incident_0427_brief.pdf',
      bruteForceCommand: 'rm -f /home/eli/Documents/incident_0427_brief.pdf',
      analyticalOutcome:
        'Isolated `vespera-Support-sync.timer` (`persistence_audit_completed`) and created verified sanitized copy `/home/eli/Documents/incident_0427_brief.clean.pdf` while preserving the original file (`metadata_protection_completed`, -5% Suspicion, -10% Exposure).',
      analyticalOutcomeZh:
        '已隔离 `vespera-Support-sync.timer` 驻留信标（记录 `persistence_audit_completed`），并在保留原始证据文件的前提下生成脱敏副本 `incident_0427_brief.clean.pdf`（记录 `metadata_protection_completed`，企业怀疑度 -5%，暴露度 -10%）。',
      bruteForceOutcome:
        'Destroying the original PDF without isolating the background systemd timer left the 15-minute beacon active (+10% Exposure).',
      bruteForceOutcomeZh:
        '未隔离后台定时器便破坏原始文档，导致 15 分钟一次的遥测信标继续泄露主机状态（暴露度 +10%）。',
      analyticalSuspicionDelta: -5,
      analyticalExposureDelta: -10,
      analyticalTrustDelta: 5,
      bruteForceSuspicionDelta: 5,
      bruteForceExposureDelta: 10,
    },
  },
  unlocks: {
    capabilities: ['persistence_auditor'],
    tools: ['persist-audit'],
    badgeLabel: 'Persistence & Metadata Auditor',
    badgeLabelZh: '宿主驻留与元数据审计员',
  },
  source: {
    repository: 'Lauren-Bitten/CyberSecurity-Projects',
    upstreamRepository: 'CarterPerez-dev/Cybersecurity-Projects',
    fork: 'Lauren-Bitten/CyberSecurity-Projects',
    license: 'AGPL-3.0',
    sectionPath: 'PROJECTS/beginner/systemd-persistence-scanner & PROJECTS/beginner/metadata-scrubber-tool & PROJECTS/beginner/linux-cis-hardening-auditor',
    sectionTitle: 'Systemd Persistence Scanner, Metadata Scrubber Tool & Linux CIS Hardening Auditor',
    adaptationNote:
      'Independently authored deterministic GreyOS simulation adapted from the systemd persistence scanner, metadata scrubber, and Linux CIS hardening auditor project specifications.',
    adaptationNoteZh:
      '基于 Systemd 驻留扫描器、文档元数据清理工具与 Linux CIS 加固审计项目的安全工程原理，独立编写的 GreyOS 确定性取证仿真关卡。',
  },
  reviewStatus: 'reviewed',
};
