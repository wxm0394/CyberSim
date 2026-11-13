import { LearningLesson } from '../../learning/lessonTypes';

export const IPFS_LESSON: LearningLesson = {
  id: 'lesson_06_ipfs',
  levelNumber: 6,
  code: 'LEVEL 06',
  title: 'The Dead Letter Network',
  titleZh: '永不消失的档案',
  difficulty: 4,
  sourceTrack: 'network_internet',
  category: 'distributed_web',
  prerequisites: ['lesson_03_certificates'],
  isMvpCoreLab: false,
  narrativeHook:
    'Vespera’s legal and security teams wiped every HTTP mirror of the civic whistleblowing report (`https://greyhaven-ledger.org/lantern-leak.pdf` returns HTTP 404). Yet Nadia and Rhea backed up the final audit ledger onto an IPFS distributed mesh—and someone also seeded a tampered fake version. How do you retrieve and cryptographically verify the authentic archive?',
  narrativeHookZh:
    'Vespera 的法务与安全团队已经清空了所有中心化 HTTP 镜像站（常规网址全部返回 404）。但 Nadia 与调查记者 Rhea 提前将《灯塔计划》审计证据同步到了 IPFS 分布式网络中——与此同时，企业水军也在网络中投放了一份篡改过的伪造账本。你该如何定位并校验真正的证据？',
  concepts: [
    {
      id: 'concept_location_vs_content_addressing',
      title: 'Location Addressing (HTTP URL) vs. Content Addressing (IPFS CID)',
      titleZh: '位置寻址（HTTP URL） vs 内容寻址（IPFS CID）',
      summary:
        'Traditional HTTP URLs use location addressing (`http://server/path`): if the central server is shut down or the file at that path is replaced, the link breaks or serves altered content. IPFS uses Content Addressing: every file is identified by a cryptographic hash of its exact bytes (Content Identifier / CID). If even a single bit changes, the CID changes completely.',
      summaryZh:
        '传统 HTTP 网页采用“位置寻址”（去哪台服务器的哪个目录找文件）：一旦中心服务器被关停或文件被替换，链接就会 404 或返回被篡改的内容。IPFS 则采用“内容寻址”：文件的唯一标识（CID）直接由文件内容的加密哈希（如 SHA-256）生成。只要文件内容被改动一个字节，CID 就会彻底改变。',
      keyTerms: ['Location Addressing (URL)', 'Content Identifier (CIDv1)', 'Cryptographic SHA-256 Digest', 'P2P Pinning'],
      practicalRule:
        'To verify an untrusted mirror or distributed archive, never trust the filename—always compute the SHA-256 / CID digest and match it against the signed manifest.',
      practicalRuleZh:
        '在取证与分布式归档中，绝不能仅凭“文件名相同”就采信证据，必须校验其内容哈希（CID / SHA-256）是否与可信签名清单完全一致。',
      diagramLines: [
        'HTTP URL : https://mirror.org/audit.db  --> [Server Seized: HTTP 451 / 404 Dead Link]',
        'IPFS CID : bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi',
        '           └── Verified by SHA-256 content hash across 14 independent P2P nodes',
      ],
    },
    {
      id: 'concept_ipns_and_tamper_detection',
      title: 'Immutable CIDs, IPNS Pointers & Tamper Resistance',
      titleZh: '不可篡改的 CID、IPNS 命名指针与防伪校验',
      summary:
        'Because a CID changes whenever a file is updated, IPNS (InterPlanetary Name System) uses a public-key pointer to reference the latest signed CID. If an attacker tries to inject a doctored file that absolves Director Marcus Hale, its computed CID will fail verification against Nadia’s signed key.',
      summaryZh:
        '由于文件一旦修改 CID 就会改变，IPNS 允许用公钥签名指针指向最新版本的合法 CID。如果企业安全部企图用一份“洗白 Marcus Hale、嫁祸 Eli Ward”的伪造账本混淆视听，其计算出的哈希值必然无法通过签名比对。',
      keyTerms: ['Immutable Merkle DAG', 'IPNS Signed Pointer', 'Tamper Detection', 'Multi-Node Redundancy'],
      practicalRule:
        'Before publishing or decrypting the final Chapter 1 evidence, verify its content hash so forged corporate bait is rejected.',
      practicalRuleZh:
        '在解密或向媒体同步最终审计库前，先通过哈希校验剔除企业投放的伪造诱饵包，确保证据链无懈可击。',
      diagramLines: [
        'Candidate A (Seeded by 10.88.14.9): CID bafybeifake99... [HASH MISMATCH - TAMPERED BAIT]',
        'Candidate B (Signed by moth_key)  : CID bafybeiauth77... [SHA-256 MATCH - AUTHENTIC LEDGER]',
      ],
    },
  ],
  lab: {
    id: 'lab_06_ipfs_cid_verify',
    code: 'NETLAB-06',
    title: 'IPFS Content Hash Verification & Dead-Drop Recovery Lab',
    titleZh: 'IPFS 内容寻址校验与抗审查死信恢复实验',
    objective:
      'Inspect the two competing P2P archive mirrors of `lantern_auth_audit.db`, verify their SHA-256 Content Identifiers (CIDs) against Nadia’s hardware signature, and pin the authentic ledger.',
    objectiveZh:
      '检查分布式网络中两份同名的 `lantern_auth_audit.db` 镜像包，比对其 SHA-256 内容标识符（CID）与 Nadia 的硬件签名，剔除伪造诱饵并固化真实证据。',
    environmentBanner: 'GREYOS SANDBOX // IPFS & SHA-256 CONTENT VERIFIER // ARCHIVE INTEGRITY',
    initialSymptom:
      'Central HTTP mirrors of the LANTERN audit report are offline (404), and two different P2P nodes offer files named `lantern_auth_audit.db` with different CIDs.',
    initialSymptomZh:
      '中心化网页镜像均已被封禁（HTTP 404），而点对点网络中出现了两份同名但 CID 截然不同的 `lantern_auth_audit.db` 档案。',
    nodes: [
      {
        id: 'node_http_dead',
        label: 'https://greyhaven-ledger.org/leak',
        address: 'HTTP 404 / Takedown',
        role: 'Centralized Web Server (Seized by Vespera injunction)',
        roleZh: '中心化 Web 服务器（已遭企业禁令关停）',
        status: 'isolated',
      },
      {
        id: 'node_ipfs_poison',
        label: 'Peer 10.88.14.99 (Corp Poison Node)',
        address: 'ipfs://bafybeifake9904hale',
        role: 'Doctored Ledger (Deletes Marcus Hale’s YubiKey signature)',
        roleZh: '被篡改的伪造账本（抹除了 Marcus Hale 的硬件签名）',
        status: 'compromised',
      },
      {
        id: 'node_ipfs_authentic',
        label: 'Peer 172.16.40.12 (Rhea / Nadia Pin)',
        address: 'ipfs://bafybeiauth0427ward',
        role: 'Authentic Content-Addressed Audit Ledger',
        roleZh: '真实内容寻址审计账本（哈希与硬件密钥完全吻合）',
        status: 'nominal',
      },
    ],
    diagnosticActions: [
      {
        id: 'diag_ipfs_cid_compare',
        label: 'Compute & Compare SHA-256 CIDs of Both Candidate Archives',
        labelZh: '计算并比对两份同名候选档案的 SHA-256 与 CID 哈希值',
        commandPreview: 'ipfs-verify --compare-cids lantern_auth_audit.db',
        targetNode: 'ipfs:// mesh',
        telemetryOutput: [
          'Candidate 1 (from peer 10.88.14.99):',
          '  Filename : lantern_auth_audit.db',
          '  CIDv1    : bafybeifake9904halesocbait771200',
          '  SHA-256  : 00deadbeef9904... [MISMATCH against moth_archive.key manifest!]',
          '',
          'Candidate 2 (from peer 172.16.40.12 / local /home/eli/archive_vault):',
          '  Filename : lantern_auth_audit.db',
          '  CIDv1    : bafybeiauth0427wardlantern9904ok',
          '  SHA-256  : 7f83b1657ff1fc... [EXACT MATCH with Nadia Park hardware manifest]',
        ].join('\n'),
        telemetryOutputZh: [
          '候选档案 1（来自节点 10.88.14.99）：',
          '  文件名  : lantern_auth_audit.db',
          '  CIDv1   : bafybeifake9904halesocbait771200',
          '  SHA-256 : 00deadbeef9904... 【警告：与 moth_archive.key 清单哈希不符，系篡改诱饵！】',
          '',
          '候选档案 2（来自可信节点 172.16.40.12 及本地 /home/eli/archive_vault）：',
          '  文件名  : lantern_auth_audit.db',
          '  CIDv1   : bafybeiauth0427wardlantern9904ok',
          '  SHA-256 : 7f83b1657ff1fc... 【验证通过：与 Nadia 硬件签名摘要 100% 吻合】',
        ].join('\n'),
        revealsClue:
          'CRITICAL: Candidate 1 (`bafybeifake9904...`) is a poisoned file seeded by Vespera SOC. Candidate 2 (`bafybeiauth0427...`) matches the authentic SHA-256 digest.',
        revealsClueZh:
          '关键发现：候选档案 1 是企业安全部投放的篡改假文件；候选档案 2 (`bafybeiauth0427...`) 通过了严格的 SHA-256 内容寻址校验。',
        isCriticalClue: true,
      },
      {
        id: 'diag_ipns_signature',
        label: 'Verify Ed25519 Signature on IPNS Dead-Drop Pointer',
        labelZh: '验证 IPNS 死信指针的 Ed25519 公钥签名',
        commandPreview: 'ipfs name resolve /ipns/k51qzi5uqu5dlvj2baxnqndepeb86cbk3ng7n3i46uzyx0',
        targetNode: 'IPNS Pointer',
        telemetryOutput: [
          'Resolved IPNS pointer: /ipfs/bafybeiauth0427wardlantern9904ok',
          'Signed by Public Key : ED25519:NADIA_PARK_SEC_OPS_KEY (Verified)',
          'Replication Status   : Pinned across 7 independent journalist dead-drop nodes.',
        ].join('\n'),
        telemetryOutputZh: [
          'IPNS 指针解析结果: /ipfs/bafybeiauth0427wardlantern9904ok',
          '签名公钥校验     : ED25519:NADIA_PARK_SEC_OPS_KEY (签名有效，不可抵赖)',
          '分布式冗余状态   : 已在 7 个独立媒体死信节点完成多副本 Pin 固化。',
        ].join('\n'),
        revealsClue:
          'The IPNS cryptographic pointer confirms `bafybeiauth0427wardlantern9904ok` is authentic and replicated across 7 censorship-resistant nodes.',
        revealsClueZh:
          'IPNS 加密签名指针确认 `bafybeiauth0427wardlantern9904ok` 为真实证据，且已在 7 个分布式节点完成抗审查备份。',
        isCriticalClue: true,
      },
    ],
    resolutions: [
      {
        id: 'res_06_pin_verified_cid',
        label: 'Verify SHA-256 CID (`bafybeiauth0427...`), Reject Poisoned Mirror & Pin to Dead-Drop',
        labelZh: '校验 SHA-256 CID (`bafybeiauth0427...`)，剔除伪造样本并固化至分布式死信网',
        commandPreview: 'ipfs-verify --pin bafybeiauth0427wardlantern9904ok --reject-unverified',
        approach: 'analytical',
        isOptimal: true,
        requiresDiagnosticIds: ['diag_ipfs_cid_compare', 'diag_ipns_signature'],
        outcomeSummary:
          'Verified the authentic audit ledger by content hash, rejected Vespera’s doctored bait file, and unlocked the Archive Verifier capability.',
        outcomeSummaryZh:
          '通过内容哈希锁定真实审计账本，成功识别并剔除企业伪造样本，解锁【分布式档案校验器】能力。',
        suspicionDelta: -5,
        exposureDelta: -5,
        trustNadiaDelta: 10,
      },
      {
        id: 'res_06_trust_filename_blindly',
        label: 'Download First Matching Filename Without Checking Content Hash',
        labelZh: '不校验内容哈希，直接拉取第一个同名文件',
        commandPreview: 'wget http://10.88.14.99/lantern_auth_audit.db --no-hash-check',
        approach: 'brute_force',
        isOptimal: false,
        requiresDiagnosticIds: [],
        outcomeSummary:
          'Pulling the unverified file triggered Vespera’s watermarked bait tracker and nearly contaminated your evidence chain (+10% Suspicion, +10% Exposure).',
        outcomeSummaryZh:
          '未校验内容哈希便直接拉取同名文件，触发了企业伪造样本中的水印追踪信标（怀疑度 +10%，暴露度 +10%）。',
        suspicionDelta: 10,
        exposureDelta: 10,
        trustNadiaDelta: -5,
      },
    ],
    storyApplication: {
      id: 'app_06_verify_vault_cid',
      targetHostOrFile: '/home/eli/archive_vault/lantern_auth_audit.db',
      actionLabel: 'Run Archive Verifier to Cryptographically Pin CID of Final LANTERN Ledger',
      actionLabelZh: '运行【分布式档案校验器】对最终审计账本执行 CID 内容寻址固化',
      analyticalCommand: 'ipfs-verify /home/eli/archive_vault/lantern_auth_audit.db',
      bruteForceCommand: 'sync-unverified /home/eli/archive_vault/lantern_auth_audit.db',
      analyticalOutcome:
        'Verified `lantern_auth_audit.db` CID (`bafybeiauth0427...`) and pinned immutable proof to Rhea’s distributed mesh (+10% Nadia Trust, -5% Exposure).',
      analyticalOutcomeZh:
        '已完成 `lantern_auth_audit.db` 的 CID 哈希校验与分布式抗审查固化，确保企业无法销毁或污名化该证据（Nadia 信任度 +10%，暴露度 -5%）。',
      bruteForceOutcome:
        'Unverified mirror broadcast triggered corporate takedown scanners (+10% Suspicion, +10% Exposure).',
      bruteForceOutcomeZh:
        '未经哈希校验的广播操作触发了企业舆情监测扫描器（怀疑度 +10%，暴露度 +10%）。',
      analyticalSuspicionDelta: -5,
      analyticalExposureDelta: -5,
      analyticalTrustDelta: 10,
      bruteForceSuspicionDelta: 10,
      bruteForceExposureDelta: 10,
    },
  },
  unlocks: {
    capabilities: ['archive_verifier'],
    tools: ['ipfs-verify'],
    badgeLabel: 'Archive Verifier (IPFS CID)',
    badgeLabelZh: '内容寻址与分布式档案校验器',
  },
  source: {
    repository: 'hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    sectionPath: 'docs/ipfs/ & docs/append/4zeronet.md',
    sectionTitle: 'IPFS 星际文件系统、内容寻址与去中心化存储',
    adaptationNote:
      'Adapted from fq-book chapters on IPFS, content addressing (CID), and resilient distributed storage.',
    adaptationNoteZh:
      '改编自《这本书能让你连接互联网》中关于 IPFS 星际文件系统、哈希内容寻址与去中心化归档的章节。',
  },
  reviewStatus: 'reviewed',
};
