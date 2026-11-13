import {
  ContentReviewStatus,
  CurationClassification,
  KnowledgeCategoryId,
  SourceAttribution,
  SourceTrackFilter,
  SourceTrackId,
} from './lessonTypes';

export interface CuratedSourceEntry extends SourceAttribution {
  id: string;
  sourceTrack: SourceTrackId;
  category: KnowledgeCategoryId;
  reviewStatus: ContentReviewStatus;
  curationDecision: CurationClassification;
}

export const SOURCE_TRACK_DESCRIPTORS: {
  id: SourceTrackFilter;
  label: string;
  labelZh: string;
  count: number;
  repositoryLabel: string;
}[] = [
  {
    id: 'all',
    label: 'All Sources (12)',
    labelZh: '全部课程轨道 (12)',
    count: 12,
    repositoryLabel: 'fq-book + CyberSecurity-Projects',
  },
  {
    id: 'network_internet',
    label: 'Track I: Network & Internet (7)',
    labelZh: '轨道 I：网络与互联网架构 (7)',
    count: 7,
    repositoryLabel: 'hoochanlon/fq-book (wxm0394/fq-book)',
  },
  {
    id: 'tactical_security',
    label: 'Track II: Tactical Security (5)',
    labelZh: '轨道 II：战术安全工程 (5)',
    count: 5,
    repositoryLabel: 'Lauren-Bitten/CyberSecurity-Projects',
  },
];

export const FQ_BOOK_ATTRIBUTION_HEADER = {
  title: 'TRACK I — 《这本书能让你连接互联网》 (hoochanlon/fq-book)',
  upstreamRepository: 'https://github.com/hoochanlon/fq-book',
  forkRepository: 'https://github.com/wxm0394/fq-book',
  license: 'CC-BY-NC / Open Educational Documentation',
  creditNotice:
    'Track I (Levels 01–07) networking and internet literacy modules in Dead Air (CyberSim) are adapted from the open educational project hoochanlon/fq-book (forked at wxm0394/fq-book), reorganized into interactive investigative missions and virtual labs for non-commercial educational gameplay.',
  creditNoticeZh:
    '轨道 I（第 01–07 关）计算机网络与寻址取证模块改编自开源科普项目 hoochanlon/fq-book（Fork: wxm0394/fq-book，《这本书能让你连接互联网》），经筛选与重构转化为交互式调查实验，仅用于非商业科普与教学演示。',
};

export const CYBERSEC_PROJECTS_ATTRIBUTION_HEADER = {
  title: 'TRACK II — Tactical Security Engineering (Lauren-Bitten/CyberSecurity-Projects)',
  repository: 'https://github.com/Lauren-Bitten/CyberSecurity-Projects',
  forkRepository: 'https://github.com/Lauren-Bitten/CyberSecurity-Projects',
  upstreamRepository: 'https://github.com/CarterPerez-dev/Cybersecurity-Projects',
  license:
    'AGPL-3.0 (Subject to component-by-component verification; all CyberSim labs use independently written deterministic simulation fixtures)',
  creditNotice:
    'Track II (Levels 08–12) tactical security engineering modules are conceptually adapted from Lauren-Bitten/CyberSecurity-Projects (upstream reference: CarterPerez-dev/Cybersecurity-Projects, licensed under AGPL-3.0 subject to individual project/dependency verification). No raw third-party exploit code is copied; all diagnostics run on independently authored, deterministic in-memory game fixtures.',
  creditNoticeZh:
    '轨道 II（第 08–12 关）战术安全工程模块概念改编自 Lauren-Bitten/CyberSecurity-Projects（上游参考：CarterPerez-dev/Cybersecurity-Projects，默认登记许可证为 AGPL-3.0，实际采用前须逐项核验子项目与依赖义务）。本游戏未直接复制第三方攻击源码，所有实验均基于独立编写的纯内存确定性模拟 Fixture 运行。',
};

export const KNOWLEDGE_CATEGORIES: {
  id: KnowledgeCategoryId;
  sourceTrack: SourceTrackId;
  label: string;
  labelZh: string;
  summary: string;
  summaryZh: string;
  sourceChapters: string[];
}[] = [
  {
    id: 'networking',
    sourceTrack: 'network_internet',
    label: 'Networking',
    labelZh: '网络通信基础',
    summary: 'TCP/UDP transport semantics, port states, client-server handshakes, and packet telemetry.',
    summaryZh: 'TCP/UDP 传输层语义、端口状态机、客户端/服务器握手与数据包取证。',
    sourceChapters: ['docs/abc/connection.md'],
  },
  {
    id: 'investigation',
    sourceTrack: 'network_internet',
    label: 'Investigation',
    labelZh: '信息调查与寻址取证',
    summary: 'DNS resolution hierarchy, /etc/hosts precedence, cache poisoning, hijacking, and archive OSINT.',
    summaryZh: 'DNS 递归解析层级、Hosts 本地优先权、DNS 污染与劫持排查及数字档案检索。',
    sourceChapters: ['docs/abc/4dns.md', 'docs/dns&hosts/', 'docs/web/'],
  },
  {
    id: 'identity_trust',
    sourceTrack: 'network_internet',
    label: 'Identity & Trust',
    labelZh: '身份与证书信任链',
    summary: 'X.509 digital certificates, Certificate Authorities (CA), TLS handshakes, SNI, and MITM detection.',
    summaryZh: 'X.509 数字证书、CA 根信任链、TLS 握手、SNI 扩展与中间人劫持（MITM）识别。',
    sourceChapters: ['docs/abc/dc_zhenshu.md'],
  },
  {
    id: 'routing_tunnels',
    sourceTrack: 'network_internet',
    label: 'Routing & Tunnels',
    labelZh: '代理、隧道与网络拓扑',
    summary: 'Forward/reverse/transparent proxies, SOCKS5, SSH port forwarding, VPN tunnels, NAT, and VM isolation.',
    summaryZh: '正向/反向/透明代理、SOCKS5、SSH 隧道、VPN 加密路由、NAT 转换与虚拟网卡隔离。',
    sourceChapters: ['docs/abc/proxy-s-x.md', 'docs/abc/4vpn.md', 'docs/abc/4nat.md', 'docs/abc/3vm.md'],
  },
  {
    id: 'distributed_web',
    sourceTrack: 'network_internet',
    label: 'Distributed Web',
    labelZh: '分布式与内容寻址网络',
    summary: 'IPFS content identifiers (CID), SHA-256 hash verification, IPNS mutable pointers, and P2P resilience.',
    summaryZh: 'IPFS 内容寻址（CID）、SHA-256 哈希校验、IPNS 可变指针与去中心化抗审查归档。',
    sourceChapters: ['docs/ipfs/', 'docs/append/4zeronet.md'],
  },
  {
    id: 'privacy_opsec',
    sourceTrack: 'network_internet',
    label: 'Privacy & OPSEC',
    labelZh: '隐私边界与行动安全',
    summary: 'Surface/Deep/Dark Web boundaries, metadata correlation, threat modeling, and operational exposure control.',
    summaryZh: '表层网/深网/暗网真实边界、元数据关联分析、威胁建模与行动暴露度控制。',
    sourceChapters: ['docs/abc/darkweb.md', 'docs/look/'],
  },
  {
    id: 'host_forensics',
    sourceTrack: 'tactical_security',
    label: 'Host Forensics',
    labelZh: '主机持久化与元数据取证',
    summary: 'Systemd user service/timer persistence auditing, Linux CIS permission hardening, and PDF/EXIF metadata sanitization.',
    summaryZh: 'Systemd 用户级服务/定时器驻留排查、Linux CIS 权限加固与 PDF/EXIF 敏感元数据脱敏。',
    sourceChapters: [
      'PROJECTS/beginner/systemd-persistence-scanner',
      'PROJECTS/beginner/metadata-scrubber-tool',
      'PROJECTS/beginner/linux-cis-hardening-auditor',
    ],
  },
  {
    id: 'network_attribution',
    sourceTrack: 'tactical_security',
    label: 'Network Attribution',
    labelZh: '握手指纹与连接遥测归因',
    summary: 'Passive TLS ClientHello analysis, canonical JA3/JA4 fingerprint calculation, and TCP scan-state attribution.',
    summaryZh: '被动 TLS ClientHello 特征解析、确定性 JA3/JA4 指纹比对与连接日志状态归因。',
    sourceChapters: [
      'PROJECTS/intermediate/ja3-ja4-tls-fingerprinting',
      'PROJECTS/advanced/zig-stateless-scanner',
      'PROJECTS/beginner/simple-port-scanner',
    ],
  },
  {
    id: 'counter_deception',
    sourceTrack: 'tactical_security',
    label: 'Counter-Deception',
    labelZh: '欺骗防御与蜜罐识别',
    summary: 'Canary token document/DNS beacon detection, synthetic honeypot service comparison, and SIEM alert correlation.',
    summaryZh: '文档与 DNS 金丝雀标记（Canary Token）识别、蜜罐仿真服务特征比对及 SIEM 告警关联分析。',
    sourceChapters: [
      'PROJECTS/beginner/canary-token-generator',
      'PROJECTS/advanced/honeypot-network',
      'PROJECTS/intermediate/siem-dashboard',
    ],
  },
  {
    id: 'crypto_forensics',
    sourceTrack: 'tactical_security',
    label: 'Crypto & HSM Forensics',
    labelZh: '硬件密钥与签名取证',
    summary: 'PKCS#11 token slot inspection, public-key signature verification, hardware attestation boundaries, and secret exposure.',
    summaryZh: 'PKCS#11 密钥槽位核查、公钥数字签名校验、软件仿真与硬件证明边界辨析及凭据泄露审计。',
    sourceChapters: [
      'PROJECTS/advanced/hsm-emulator',
      'PROJECTS/intermediate/secrets-scanner',
      'PROJECTS/intermediate/credential-enumeration',
    ],
  },
  {
    id: 'container_appsec',
    sourceTrack: 'tactical_security',
    label: 'Container & Binary',
    labelZh: '容器审计与二进制逆向',
    summary: 'Static ELF header/symbol extraction, CIS Docker configuration auditing, and pre-recorded eBPF syscall telemetry.',
    summaryZh: 'ELF 二进制静态符号/字符串逆向、CIS Docker 容器安全配置审计与预录制 eBPF 系统调用分析。',
    sourceChapters: [
      'PROJECTS/intermediate/docker-security-audit',
      'PROJECTS/intermediate/binary-analysis-tool',
      'PROJECTS/beginner/linux-ebpf-security-tracer',
    ],
  },
];

export const CURATED_SOURCE_REGISTRY: CuratedSourceEntry[] = [
  // TRACK I: hoochanlon/fq-book (Levels 01–07)
  {
    id: 'src-connection',
    sourceTrack: 'network_internet',
    repository: 'hoochanlon/fq-book',
    upstreamRepository: 'https://github.com/hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    projectPaths: ['docs/abc/connection.md'],
    sectionPath: 'docs/abc/connection.md',
    sectionTitle: '两台主机之间的连接（TCP/IP、端口与客户端/服务端）',
    license: 'CC-BY-NC / Open Educational',
    category: 'networking',
    reviewStatus: 'reviewed',
    curationDecision: 'core_gameplay_lab',
    adaptationNote:
      'Universal TCP/UDP handshake and port-state principles adapted into Level 01 packet anomaly diagnostics.',
    adaptationNoteZh:
      '提炼通用 TCP/UDP 握手与端口状态原理，转化为第一关“消失的数据包”传输层异常诊断实验。',
  },
  {
    id: 'src-dns',
    sourceTrack: 'network_internet',
    repository: 'hoochanlon/fq-book',
    upstreamRepository: 'https://github.com/hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    projectPaths: ['docs/abc/4dns.md', 'docs/dns&hosts/'],
    sectionPath: 'docs/abc/4dns.md',
    sectionTitle: 'DNS 解析、Hosts 映射与 DNS 劫持/污染',
    license: 'CC-BY-NC / Open Educational',
    category: 'investigation',
    reviewStatus: 'reviewed',
    curationDecision: 'core_gameplay_lab',
    adaptationNote:
      'Adapted into MVP Core Lab 01 (Level 02: The False Address), contrasting local /etc/hosts poisoning against authoritative DNS queries.',
    adaptationNoteZh:
      '转化为核心实验 01（第二关：错误的地址），通过比对本地 /etc/hosts、缓存与权威解析排查内网蜜罐投毒。',
  },
  {
    id: 'src-cert',
    sourceTrack: 'network_internet',
    repository: 'hoochanlon/fq-book',
    upstreamRepository: 'https://github.com/hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    projectPaths: ['docs/abc/dc_zhenshu.md'],
    sectionPath: 'docs/abc/dc_zhenshu.md',
    sectionTitle: '数字证书、CA 信任机构与 TLS 加密通信',
    license: 'CC-BY-NC / Open Educational',
    category: 'identity_trust',
    reviewStatus: 'reviewed',
    curationDecision: 'core_gameplay_lab',
    adaptationNote:
      'Adapted into MVP Core Lab 02 (Level 03: The Broken Trust), where players inspect X.509 issuer chains, SNI, and SHA-256 fingerprints to spot a rogue corporate CA.',
    adaptationNoteZh:
      '转化为核心实验 02（第三关：被伪造的信任），玩家通过核查 X.509 颁发机构链、SNI 与 SHA-256 指纹揪出企业伪造根证书中间人。',
  },
  {
    id: 'src-proxy-vpn',
    sourceTrack: 'network_internet',
    repository: 'hoochanlon/fq-book',
    upstreamRepository: 'https://github.com/hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    projectPaths: ['docs/abc/proxy-s-x.md', 'docs/abc/4vpn.md'],
    sectionPath: 'docs/abc/proxy-s-x.md & docs/abc/4vpn.md',
    sectionTitle: '正向代理、反向代理、透明代理与 VPN 隧道协议',
    license: 'CC-BY-NC / Open Educational',
    category: 'routing_tunnels',
    reviewStatus: 'reviewed',
    curationDecision: 'core_gameplay_lab',
    adaptationNote:
      'Adapted into MVP Core Lab 03 (Level 04: The Route), requiring players to distinguish proxy types and build an encrypted multi-hop tunnel.',
    adaptationNoteZh:
      '转化为核心实验 03（第四关：看不见的通道），玩家需要区分正向/反向/透明代理与 VPN 隧道并构建多跳加密链路。',
  },
  {
    id: 'src-nat-vm',
    sourceTrack: 'network_internet',
    repository: 'hoochanlon/fq-book',
    upstreamRepository: 'https://github.com/hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    projectPaths: ['docs/abc/4nat.md', 'docs/abc/3vm.md'],
    sectionPath: 'docs/abc/4nat.md & docs/abc/3vm.md',
    sectionTitle: 'NAT 网络地址转换与虚拟机网络模式（桥接/NAT/仅主机）',
    license: 'CC-BY-NC / Open Educational',
    category: 'routing_tunnels',
    reviewStatus: 'reviewed',
    curationDecision: 'core_gameplay_lab',
    adaptationNote:
      'Adapted into Level 05 (The Network Maze), focusing on RFC1918 private subnets, NAT translation tables, and Host-Only vs. NAT VM isolation.',
    adaptationNoteZh:
      '转化为第五关“网络迷宫”，围绕内网网段、NAT 映射表以及虚拟机桥接/NAT/Host-Only 隔离边界展开。',
  },
  {
    id: 'src-ipfs',
    sourceTrack: 'network_internet',
    repository: 'hoochanlon/fq-book',
    upstreamRepository: 'https://github.com/hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    projectPaths: ['docs/ipfs/', 'docs/append/4zeronet.md'],
    sectionPath: 'docs/ipfs/ & docs/append/4zeronet.md',
    sectionTitle: 'IPFS 星际文件系统、内容寻址与分布式网络归档',
    license: 'CC-BY-NC / Open Educational',
    category: 'distributed_web',
    reviewStatus: 'reviewed',
    curationDecision: 'core_gameplay_lab',
    adaptationNote:
      'Adapted into Level 06 (The Dead Letter Network), contrasting location-based HTTP URLs (404 takedowns) with content-addressed SHA-256 CIDs.',
    adaptationNoteZh:
      '转化为第六关“永不消失的档案”，对比传统位置寻址（易被删除）与 IPFS 内容哈希寻址（CID 完整性校验）。',
  },
  {
    id: 'src-darkweb-osint',
    sourceTrack: 'network_internet',
    repository: 'hoochanlon/fq-book',
    upstreamRepository: 'https://github.com/hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    projectPaths: ['docs/abc/darkweb.md', 'docs/web/'],
    sectionPath: 'docs/abc/darkweb.md & docs/web/',
    sectionTitle: '表层网、深网与暗网概念辨析及信息检索方法',
    license: 'CC-BY-NC / Open Educational',
    category: 'privacy_opsec',
    reviewStatus: 'reviewed',
    curationDecision: 'core_gameplay_lab',
    adaptationNote:
      'Adapted into Level 07 (Shadow Footprints): demystifies Deep Web vs. Dark Web and teaches operational metadata hygiene and archive cross-verification.',
    adaptationNoteZh:
      '转化为第七关“数字足迹与暗网边界”：祛魅“深网”与“暗网”概念，训练通过公开历史档案快照与 OPSEC 清理降低暴露度。',
  },
  {
    id: 'src-legacy-protocols',
    sourceTrack: 'network_internet',
    repository: 'hoochanlon/fq-book',
    upstreamRepository: 'https://github.com/hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    projectPaths: ['docs/history/'],
    sectionPath: 'docs/history/ (Legacy PPTP / Early Obfs Case Studies)',
    sectionTitle: '早期隧道协议与历史演进背景',
    license: 'CC-BY-NC / Open Educational',
    category: 'routing_tunnels',
    reviewStatus: 'historical',
    curationDecision: 'historical_context_only',
    adaptationNote:
      'Retained purely as historical protocol evolution background in lore archives; never taught as recommended security practice.',
    adaptationNoteZh:
      '仅作为协议演进史背景收录于设定档案中，明确标注历史局限，不作为现代安全配置推荐。',
  },
  {
    id: 'src-excluded-providers',
    sourceTrack: 'network_internet',
    repository: 'hoochanlon/fq-book',
    upstreamRepository: 'https://github.com/hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    projectPaths: ['docs/featured/'],
    sectionPath: 'docs/featured/ (Third-Party Provider Lists & Client Installers)',
    sectionTitle: '过时的第三方客户端下载与服务商列表',
    license: 'CC-BY-NC / Open Educational',
    category: 'privacy_opsec',
    reviewStatus: 'needs-review',
    curationDecision: 'excluded_unverified',
    adaptationNote:
      'Excluded from gameplay per engineering curation policy: time-sensitive third-party vendor lists and unverified scripts are omitted.',
    adaptationNoteZh:
      '根据内容分级策略予以剔除：不引入过时的第三方工具下载链接、商业服务商清单或未经审计的外部脚本。',
  },

  // TRACK II: Lauren-Bitten/CyberSecurity-Projects (Levels 08–12)
  {
    id: 'src-cybersec-persistence-meta',
    sourceTrack: 'tactical_security',
    repository: 'Lauren-Bitten/CyberSecurity-Projects',
    upstreamRepository: 'https://github.com/CarterPerez-dev/Cybersecurity-Projects',
    projectPaths: [
      'PROJECTS/beginner/systemd-persistence-scanner',
      'PROJECTS/beginner/metadata-scrubber-tool',
      'PROJECTS/beginner/linux-cis-hardening-auditor',
    ],
    sectionPath: 'PROJECTS/beginner/{systemd-persistence-scanner, metadata-scrubber-tool, linux-cis-hardening-auditor}',
    sectionTitle: 'Systemd Persistence Scanner, Metadata Scrubber & Linux CIS Hardening Auditor',
    license: 'AGPL-3.0 (Independently written deterministic simulation fixtures)',
    category: 'host_forensics',
    reviewStatus: 'reviewed',
    curationDecision: 'core_gameplay_lab',
    adaptationNote:
      'Adapted into Level 08 (The Persistent Shadow): uses synthetic systemd user timer fixtures (vespera-Support-sync.timer) and PDF XMP metadata fixtures (incident_0427_brief.pdf).',
    adaptationNoteZh:
      '转化为第八关“幽灵驻留与元数据擦除”：使用独立编写的虚拟 systemd 定时任务与 PDF 元数据 Fixture 进行持久化隔离与脱敏验证。',
  },
  {
    id: 'src-cybersec-ja4-telemetry',
    sourceTrack: 'tactical_security',
    repository: 'Lauren-Bitten/CyberSecurity-Projects',
    upstreamRepository: 'https://github.com/CarterPerez-dev/Cybersecurity-Projects',
    projectPaths: [
      'PROJECTS/intermediate/ja3-ja4-tls-fingerprinting',
      'PROJECTS/advanced/zig-stateless-scanner',
      'PROJECTS/beginner/simple-port-scanner',
    ],
    sectionPath: 'PROJECTS/intermediate/ja3-ja4-tls-fingerprinting & PROJECTS/advanced/zig-stateless-scanner',
    sectionTitle: 'JA3/JA4 TLS Client Fingerprinting & Port Scan State Telemetry',
    license: 'AGPL-3.0 (Independently written deterministic simulation fixtures)',
    category: 'network_attribution',
    reviewStatus: 'reviewed',
    curationDecision: 'core_gameplay_lab',
    adaptationNote:
      'Adapted into Level 09 (The TLS Fingerprint) as a purely passive forensic attribution exercise using deterministic ClientHello PCAP fixtures and canonical JA4 sorting rules.',
    adaptationNoteZh:
      '转化为第九关“握手指纹与网络监测”：严格遵循被动取证边界与 JA4 排序规范，对预置模拟抓包与连接状态日志进行归因分析，不执行真实网络扫描。',
  },
  {
    id: 'src-cybersec-canary-honeypot',
    sourceTrack: 'tactical_security',
    repository: 'Lauren-Bitten/CyberSecurity-Projects',
    upstreamRepository: 'https://github.com/CarterPerez-dev/Cybersecurity-Projects',
    projectPaths: [
      'PROJECTS/beginner/canary-token-generator',
      'PROJECTS/advanced/honeypot-network',
      'PROJECTS/intermediate/siem-dashboard',
    ],
    sectionPath: 'PROJECTS/beginner/canary-token-generator & PROJECTS/advanced/honeypot-network',
    sectionTitle: 'Canary Token Detection, Honeypot Fingerprinting & SIEM Correlation',
    license: 'AGPL-3.0 (Independently written deterministic simulation fixtures)',
    category: 'counter_deception',
    reviewStatus: 'reviewed',
    curationDecision: 'core_gameplay_lab',
    adaptationNote:
      'Adapted into Level 10 (The Canary’s Song): analyzes static honey-document beacons and synthetic service responses on 10.88.14.9 without firing external webhooks or removing the underlying trap risk.',
    adaptationNoteZh:
      '转化为第十关“金丝雀陷阱与蜜罐识别”：离线分析静态文档信标与 10.88.14.9 诱饵服务特征，辅助玩家做出知情决策，不发送真实外部请求。',
  },
  {
    id: 'src-cybersec-hsm-secrets',
    sourceTrack: 'tactical_security',
    repository: 'Lauren-Bitten/CyberSecurity-Projects',
    upstreamRepository: 'https://github.com/CarterPerez-dev/Cybersecurity-Projects',
    projectPaths: [
      'PROJECTS/advanced/hsm-emulator',
      'PROJECTS/intermediate/secrets-scanner',
      'PROJECTS/intermediate/credential-enumeration',
    ],
    sectionPath: 'PROJECTS/advanced/hsm-emulator & PROJECTS/intermediate/{secrets-scanner, credential-enumeration}',
    sectionTitle: 'PKCS#11 Software HSM Emulation, Digital Signatures & Secret Exposure Auditing',
    license: 'AGPL-3.0 (Independently written deterministic simulation fixtures)',
    category: 'crypto_forensics',
    reviewStatus: 'reviewed',
    curationDecision: 'core_gameplay_lab',
    adaptationNote:
      'Adapted into Level 11 (The Hardware Forgery): distinguishes cryptographic signature validity, PKCS#11 key slot identifiers, and hardware attestation on synthetic audit logs.',
    adaptationNoteZh:
      '转化为第十一关“硬件密钥与签名取证”：在纯虚拟日志与密钥槽位上验证数字签名与凭据暴露时间线，严格区分签名有效性与物理硬件身份。',
  },
  {
    id: 'src-cybersec-container-binary',
    sourceTrack: 'tactical_security',
    repository: 'Lauren-Bitten/CyberSecurity-Projects',
    upstreamRepository: 'https://github.com/CarterPerez-dev/Cybersecurity-Projects',
    projectPaths: [
      'PROJECTS/intermediate/docker-security-audit',
      'PROJECTS/intermediate/binary-analysis-tool',
      'PROJECTS/beginner/linux-ebpf-security-tracer',
    ],
    sectionPath: 'PROJECTS/intermediate/{docker-security-audit, binary-analysis-tool} & beginner/linux-ebpf-security-tracer',
    sectionTitle: 'Static ELF Binary Analysis, CIS Docker Security Audit & eBPF Syscall Telemetry',
    license: 'AGPL-3.0 (Independently written deterministic simulation fixtures)',
    category: 'container_appsec',
    reviewStatus: 'reviewed',
    curationDecision: 'core_gameplay_lab',
    adaptationNote:
      'Adapted into Level 12 (The Escaped Container): inspects synthetic ELF headers/symbols (lantern-syncd), Docker config JSON (lantern-collector.json), and pre-recorded eBPF syscall logs.',
    adaptationNoteZh:
      '转化为第十二关“容器审计与二进制逆向”：对合成 ELF 样本、容器配置清单与预录制 eBPF 系统调用记录执行纯静态关联分析。',
  },
  {
    id: 'src-cybersec-excluded-offensive',
    sourceTrack: 'tactical_security',
    repository: 'Lauren-Bitten/CyberSecurity-Projects',
    upstreamRepository: 'https://github.com/CarterPerez-dev/Cybersecurity-Projects',
    projectPaths: [
      'PROJECTS/beginner/keylogger',
      'PROJECTS/beginner/c2-beacon',
      'PROJECTS/intermediate/credential-enumeration (host browser extraction)',
    ],
    sectionPath: 'PROJECTS/beginner/{keylogger, c2-beacon}',
    sectionTitle: 'Active Keylogging, Live C2 Beaconing & Host Credential Store Extraction',
    license: 'AGPL-3.0',
    category: 'privacy_opsec',
    reviewStatus: 'needs-review',
    curationDecision: 'excluded_unverified',
    adaptationNote:
      'Excluded per Passive Forensics Boundary: Dead Air never implements live keyloggers, outbound C2 beacons, or real host browser credential extraction.',
    adaptationNoteZh:
      '根据被动取证安全边界予以剔除：本游戏绝不实现真实键盘记录、外部 C2 通信或读取宿主机真实浏览器凭据库。',
  },
];
