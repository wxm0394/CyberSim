import { ContentReviewStatus, KnowledgeCategoryId, SourceAttribution } from './lessonTypes';

export interface CuratedSourceEntry extends SourceAttribution {
  id: string;
  category: KnowledgeCategoryId;
  reviewStatus: ContentReviewStatus;
  curationDecision: 'core_gameplay_lab' | 'historical_context_only' | 'excluded_unverified';
}

export const FQ_BOOK_ATTRIBUTION_HEADER = {
  title: '《这本书能让你连接互联网》 (fq-book)',
  upstreamRepository: 'https://github.com/hoochanlon/fq-book',
  forkRepository: 'https://github.com/wxm0394/fq-book',
  creditNotice:
    'Some networking and internet literacy modules in Dead Air (CyberSim) are adapted from the open educational project hoochanlon/fq-book (forked at wxm0394/fq-book), reorganized into interactive investigative missions and virtual labs for non-commercial educational gameplay.',
  creditNoticeZh:
    '《DEAD AIR — 城市静默》中的计算机网络与数字取证训练模块改编自开源科普项目 hoochanlon/fq-book（Fork: wxm0394/fq-book，《这本书能让你连接互联网》），经筛选与重构转化为交互式调查实验，仅用于非商业科普与教学演示。',
};

export const KNOWLEDGE_CATEGORIES: {
  id: KnowledgeCategoryId;
  label: string;
  labelZh: string;
  summary: string;
  summaryZh: string;
  sourceChapters: string[];
}[] = [
  {
    id: 'networking',
    label: 'Networking',
    labelZh: '网络通信基础',
    summary: 'TCP/UDP transport semantics, port states, client-server handshakes, and packet telemetry.',
    summaryZh: 'TCP/UDP 传输层语义、端口状态机、客户端/服务器握手与数据包取证。',
    sourceChapters: ['docs/abc/connection.md'],
  },
  {
    id: 'investigation',
    label: 'Investigation',
    labelZh: '信息调查与寻址取证',
    summary: 'DNS resolution hierarchy, /etc/hosts precedence, cache poisoning, hijacking, and archive OSINT.',
    summaryZh: 'DNS 递归解析层级、Hosts 本地优先权、DNS 污染与劫持排查及数字档案检索。',
    sourceChapters: ['docs/abc/4dns.md', 'docs/dns&hosts/', 'docs/web/'],
  },
  {
    id: 'identity_trust',
    label: 'Identity & Trust',
    labelZh: '身份与证书信任链',
    summary: 'X.509 digital certificates, Certificate Authorities (CA), TLS handshakes, SNI, and MITM detection.',
    summaryZh: 'X.509 数字证书、CA 根信任链、TLS 握手、SNI 扩展与中间人劫持（MITM）识别。',
    sourceChapters: ['docs/abc/dc_zhenshu.md'],
  },
  {
    id: 'routing_tunnels',
    label: 'Routing & Tunnels',
    labelZh: '代理、隧道与网络拓扑',
    summary: 'Forward/reverse/transparent proxies, SOCKS5, SSH port forwarding, VPN tunnels, NAT, and VM isolation.',
    summaryZh: '正向/反向/透明代理、SOCKS5、SSH 隧道、VPN 加密路由、NAT 转换与虚拟网卡隔离。',
    sourceChapters: ['docs/abc/proxy-s-x.md', 'docs/abc/4vpn.md', 'docs/abc/4nat.md', 'docs/abc/3vm.md'],
  },
  {
    id: 'distributed_web',
    label: 'Distributed Web',
    labelZh: '分布式与内容寻址网络',
    summary: 'IPFS content identifiers (CID), SHA-256 hash verification, IPNS mutable pointers, and P2P resilience.',
    summaryZh: 'IPFS 内容寻址（CID）、SHA-256 哈希校验、IPNS 可变指针与去中心化抗审查归档。',
    sourceChapters: ['docs/ipfs/', 'docs/append/4zeronet.md'],
  },
  {
    id: 'privacy_opsec',
    label: 'Privacy & OPSEC',
    labelZh: '隐私边界与行动安全',
    summary: 'Surface/Deep/Dark Web boundaries, metadata correlation, threat modeling, and operational exposure control.',
    summaryZh: '表层网/深网/暗网真实边界、元数据关联分析、威胁建模与行动暴露度控制。',
    sourceChapters: ['docs/abc/darkweb.md', 'docs/look/'],
  },
];

export const CURATED_SOURCE_REGISTRY: CuratedSourceEntry[] = [
  {
    id: 'src-connection',
    repository: 'hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    sectionPath: 'docs/abc/connection.md',
    sectionTitle: '两台主机之间的连接（TCP/IP、端口与客户端/服务端）',
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
    repository: 'hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    sectionPath: 'docs/abc/4dns.md',
    sectionTitle: 'DNS 解析、Hosts 映射与 DNS 劫持/污染',
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
    repository: 'hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    sectionPath: 'docs/abc/dc_zhenshu.md',
    sectionTitle: '数字证书、CA 信任机构与 TLS 加密通信',
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
    repository: 'hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    sectionPath: 'docs/abc/proxy-s-x.md & docs/abc/4vpn.md',
    sectionTitle: '正向代理、反向代理、透明代理与 VPN 隧道协议',
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
    repository: 'hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    sectionPath: 'docs/abc/4nat.md & docs/abc/3vm.md',
    sectionTitle: 'NAT 网络地址转换与虚拟机网络模式（桥接/NAT/仅主机）',
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
    repository: 'hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    sectionPath: 'docs/ipfs/ & docs/append/4zeronet.md',
    sectionTitle: 'IPFS 星际文件系统、内容寻址与分布式网络归档',
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
    repository: 'hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    sectionPath: 'docs/abc/darkweb.md & docs/web/',
    sectionTitle: '表层网、深网与暗网概念辨析及信息检索方法',
    category: 'privacy_opsec',
    reviewStatus: 'reviewed',
    curationDecision: 'core_gameplay_lab',
    adaptationNote:
      'Demystifies Deep Web vs. Dark Web and teaches operational metadata hygiene and archive cross-verification.',
    adaptationNoteZh:
      '祛魅“深网”与“暗网”概念，训练调查员通过公开档案快照与 OPSEC 威胁建模降低暴露度。',
  },
  {
    id: 'src-legacy-protocols',
    repository: 'hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    sectionPath: 'docs/history/ (Legacy PPTP / Early Obfs Case Studies)',
    sectionTitle: '早期隧道协议与历史演进背景',
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
    repository: 'hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    sectionPath: 'docs/featured/ (Third-Party Provider Lists & Client Installers)',
    sectionTitle: '过时的第三方客户端下载与服务商列表',
    category: 'privacy_opsec',
    reviewStatus: 'needs-review',
    curationDecision: 'excluded_unverified',
    adaptationNote:
      'Excluded from gameplay per engineering curation policy: time-sensitive third-party vendor lists and unverified scripts are omitted.',
    adaptationNoteZh:
      '根据内容分级策略予以剔除：不引入过时的第三方工具下载链接、商业服务商清单或未经审计的外部脚本。',
  },
];
