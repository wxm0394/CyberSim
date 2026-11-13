import { CapabilityDescriptor, LearningLesson, UnlockedCapabilityId } from '../learning/lessonTypes';
import { NETWORKING_LESSON } from './lessons/networking';
import { DNS_LESSON } from './lessons/dns';
import { CERTIFICATES_LESSON } from './lessons/certificates';
import { PROXY_VPN_LESSON } from './lessons/proxy-vpn';
import { NAT_LESSON } from './lessons/nat';
import { IPFS_LESSON } from './lessons/ipfs';
import { OSINT_LESSON } from './lessons/osint';
import { PERSISTENCE_LESSON } from './lessons/persistence';
import { TLS_FINGERPRINTING_LESSON } from './lessons/tls-fingerprinting';
import { COUNTER_DECEPTION_LESSON } from './lessons/counter-deception';
import { HSM_FORENSICS_LESSON } from './lessons/hsm-forensics';
import { CONTAINER_BINARY_LESSON } from './lessons/container-binary';

export const ALL_LEARNING_LESSONS: LearningLesson[] = [
  DNS_LESSON,
  CERTIFICATES_LESSON,
  PROXY_VPN_LESSON,
  NETWORKING_LESSON,
  NAT_LESSON,
  IPFS_LESSON,
  OSINT_LESSON,
  PERSISTENCE_LESSON,
  TLS_FINGERPRINTING_LESSON,
  COUNTER_DECEPTION_LESSON,
  HSM_FORENSICS_LESSON,
  CONTAINER_BINARY_LESSON,
];

export const CAPABILITY_DESCRIPTORS: Record<UnlockedCapabilityId, CapabilityDescriptor> = {
  resolver_inspector: {
    id: 'resolver_inspector',
    name: 'Resolver Inspector',
    nameZh: 'DNS 解析检查器',
    sourceTrack: 'network_internet',
    category: 'investigation',
    unlockedByLessonId: 'lesson_02_dns',
    cliCommand: 'dns-inspect',
    description:
      'Compares /etc/hosts, local DNS cache, and encrypted authoritative resolvers to purge sinkhole hijacks.',
    descriptionZh:
      '交叉比对本地 /etc/hosts、DNS 缓存与可信加密解析器，清除指向企业蜜罐的域名投毒。',
    investigationEffect: '-5% Corporate Suspicion, -5% Exposure, +5% Nadia Trust',
    investigationEffectZh: '企业怀疑度 -5%，玩家暴露度 -5%，Nadia 信任度 +5%',
  },
  certificate_analyzer: {
    id: 'certificate_analyzer',
    name: 'Certificate Analyzer',
    nameZh: '证书与信任链分析器',
    sourceTrack: 'network_internet',
    category: 'identity_trust',
    unlockedByLessonId: 'lesson_03_certificates',
    cliCommand: 'cert-verify',
    description:
      'Audits X.509 issuer chains, SNI interception, and SHA-256 fingerprints to strip rogue corporate MITM root CAs.',
    descriptionZh:
      '核查 X.509 颁发机构链、SNI 嗅探与 SHA-256 指纹，吊销企业植入的伪造监控根证书。',
    investigationEffect: '-10% Corporate Suspicion, -5% Exposure, +5% Nadia Trust',
    investigationEffectZh: '企业怀疑度 -10%，玩家暴露度 -5%，Nadia 信任度 +5%',
  },
  proxy_route_editor: {
    id: 'proxy_route_editor',
    name: 'Proxy Route Editor',
    nameZh: '代理路由编辑器',
    sourceTrack: 'network_internet',
    category: 'routing_tunnels',
    unlockedByLessonId: 'lesson_04_proxy_vpn',
    cliCommand: 'route-apply',
    description:
      'Encapsulates workstation sockets and remote DNS (socks5h + WireGuard tun0) through trusted multi-hop relays.',
    descriptionZh:
      '将本机套接字与 DNS 解析统一封装进多跳加密隧道（WireGuard tun0 + socks5h），绕过网关透明代理嗅探。',
    investigationEffect: '-10% Corporate Suspicion, -10% Exposure, +5% Nadia Trust',
    investigationEffectZh: '企业怀疑度 -10%，玩家暴露度 -10%，Nadia 信任度 +5%',
  },
  tunnel_monitor: {
    id: 'tunnel_monitor',
    name: 'Tunnel Monitor',
    nameZh: '加密隧道监控器',
    sourceTrack: 'network_internet',
    category: 'routing_tunnels',
    unlockedByLessonId: 'lesson_04_proxy_vpn',
    cliCommand: 'tunnel-stat',
    description:
      'Monitors split-tunnel UDP/53 leaks and verifies end-to-end ciphertext encapsulation across relay hops.',
    descriptionZh:
      '实时监测分流隧道的 UDP/53 DNS 泄露风险，验证跨跳板端到端密文封装完整性。',
    investigationEffect: 'Prevents origin IP leakage during remote host pivoting',
    investigationEffectZh: '防止远程内网横向移动时泄露公寓源 IP',
  },
  packet_inspector: {
    id: 'packet_inspector',
    name: 'Packet & Port Inspector',
    nameZh: '传输层与端口诊断器',
    sourceTrack: 'network_internet',
    category: 'networking',
    unlockedByLessonId: 'lesson_01_networking',
    cliCommand: 'packet-inspect',
    description:
      'Distinguishes inline firewall TCP RST injection from genuine host downtime and UDP datagram streams.',
    descriptionZh:
      '通过三次握手状态与 TTL 差异区分防火墙伪造的 TCP RST 阻断与真实主机状态。',
    investigationEffect: '-5% Corporate Suspicion, +5% Nadia Trust',
    investigationEffectZh: '企业怀疑度 -5%，Nadia 信任度 +5%',
  },
  topology_mapper: {
    id: 'topology_mapper',
    name: 'Topology Mapper',
    nameZh: 'NAT 与虚拟网络拓扑测绘仪',
    sourceTrack: 'network_internet',
    category: 'routing_tunnels',
    unlockedByLessonId: 'lesson_05_nat_vm',
    cliCommand: 'topo-map',
    description:
      'Enforces Host-Only VM sandbox isolation and maps DNAT port-forwarding rules across private subnets.',
    descriptionZh:
      '强制执行虚拟机 Host-Only 仅主机沙箱隔离，并测绘跨网段 DNAT 端口转发规则。',
    investigationEffect: '-5% Corporate Suspicion, -5% Exposure, +5% Nadia Trust',
    investigationEffectZh: '企业怀疑度 -5%，玩家暴露度 -5%，Nadia 信任度 +5%',
  },
  archive_verifier: {
    id: 'archive_verifier',
    name: 'Archive Verifier',
    nameZh: 'IPFS 内容寻址校验器',
    sourceTrack: 'network_internet',
    category: 'distributed_web',
    unlockedByLessonId: 'lesson_06_ipfs',
    cliCommand: 'ipfs-verify',
    description:
      'Verifies SHA-256 Content Identifiers (CIDs) and Ed25519 IPNS pointers to reject doctored corporate bait files.',
    descriptionZh:
      '校验 IPFS 内容哈希（CID）与 IPNS 签名指针，识别并剔除企业投放的篡改假账本。',
    investigationEffect: '-5% Corporate Suspicion, -5% Exposure, +10% Nadia Trust',
    investigationEffectZh: '企业怀疑度 -5%，玩家暴露度 -5%，Nadia 信任度 +10%',
  },
  archive_search: {
    id: 'archive_search',
    name: 'Archive Search & OPSEC',
    nameZh: '被动档案检索与 OPSEC 清理',
    sourceTrack: 'network_internet',
    category: 'privacy_opsec',
    unlockedByLessonId: 'lesson_07_osint_opsec',
    cliCommand: 'archive-search',
    description:
      'Retrieves deleted records from passive web archive snapshots and scrubs identifying client headers.',
    descriptionZh:
      '从第三方历史快照中零接触提取被删招标文件，并清理客户端残留的工号元数据指纹。',
    investigationEffect: '-5% Corporate Suspicion, -10% Exposure, +5% Nadia Trust',
    investigationEffectZh: '企业怀疑度 -5%，玩家暴露度 -10%，Nadia 信任度 +5%',
  },
  persistence_auditor: {
    id: 'persistence_auditor',
    name: 'Persistence & Metadata Auditor',
    nameZh: '宿主驻留与元数据审计员',
    sourceTrack: 'tactical_security',
    category: 'host_forensics',
    unlockedByLessonId: 'lesson_08_persistence',
    cliCommand: 'persist-audit',
    description:
      'Isolates user-level systemd persistence timers (`vespera-Support-sync.timer`) and writes metadata-scrubbed PDF copies while preserving original forensic files.',
    descriptionZh:
      '隔离用户级 Systemd 驻留定时器 (`vespera-Support-sync.timer`)，并在保留原始证据文件的基础上生成剥离 XMP/PDF 身份元数据的脱敏副本。',
    investigationEffect: 'Sets persistence_audit_completed & metadata_protection_completed (-5% Suspicion, -10% Exposure)',
    investigationEffectZh: '记录宿主驻留与文档脱敏标记（怀疑度 -5%，暴露度 -10%）',
  },
  tls_fingerprint_inspector: {
    id: 'tls_fingerprint_inspector',
    name: 'JA3/JA4 TLS Attribution Inspector',
    nameZh: 'JA3/JA4 握手指纹与流状态分析器',
    sourceTrack: 'tactical_security',
    category: 'network_attribution',
    unlockedByLessonId: 'lesson_09_tls_fingerprinting',
    cliCommand: 'ja4-inspect',
    description:
      'Computes canonical sorted JA4 ClientHello fingerprints and audits TCP 3-way handshake state telemetry on captured PCAPs.',
    descriptionZh:
      '对离线抓包样本计算规范化排序 JA4 握手指纹，并核查 TCP 三次握手连接状态遥测以证伪扫描栽赃。',
    investigationEffect: 'Sets tls_attribution_verified (-5% Suspicion, +5% Nadia Trust)',
    investigationEffectZh: '记录 TLS 握手归因核验标记（怀疑度 -5%，Nadia 信任度 +5%）',
  },
  canary_inspector: {
    id: 'canary_inspector',
    name: 'Canary & Honeypot Inspector',
    nameZh: '金丝雀令牌与蜜罐识别器',
    sourceTrack: 'tactical_security',
    category: 'counter_deception',
    unlockedByLessonId: 'lesson_10_counter_deception',
    cliCommand: 'canary-check',
    description:
      'Statically detects embedded PDF Canary Token callbacks and identifies high-interaction honeypot telemetry on `10.88.14.9` without firing traps.',
    descriptionZh:
      '静态检出 PDF 内嵌金丝雀回调令牌，并在不触发警报的前提下识别 `10.88.14.9` 蜜罐节点的欺骗遥测特征。',
    investigationEffect: 'Sets canary_identified (-5% Suspicion, -5% Exposure, +5% Nadia Trust)',
    investigationEffectZh: '记录金丝雀与蜜罐识别标记（怀疑度 -5%，暴露度 -5%，Nadia 信任度 +5%）',
  },
  hsm_verifier: {
    id: 'hsm_verifier',
    name: 'PKCS#11 HSM & Keyring Verifier',
    nameZh: 'PKCS#11 硬件签名与密钥审计器',
    sourceTrack: 'tactical_security',
    category: 'crypto_forensics',
    unlockedByLessonId: 'lesson_11_hsm_forensics',
    cliCommand: 'hsm-verify',
    description:
      'Separates ECDSA-P256 mathematical signature validity, Key ID (`M_HALE_SEC_01`), soft-token slot metadata, and missing hardware attestation.',
    descriptionZh:
      '严格区分 ECDSA-P256 签名数学有效性、密钥 ID (`M_HALE_SEC_01`)、软令牌元数据与缺失的硬件证明，坐实伪造签名铁证。',
    investigationEffect: 'Sets hsm_signature_verified (-5% Suspicion, +10% Nadia Trust)',
    investigationEffectZh: '记录 PKCS#11 签名核验标记（怀疑度 -5%，Nadia 信任度 +10%）',
  },
  binary_container_analyzer: {
    id: 'binary_container_analyzer',
    name: 'Binary, Container & eBPF Analyzer',
    nameZh: '二进制、容器配置与 eBPF 审计器',
    sourceTrack: 'tactical_security',
    category: 'container_appsec',
    unlockedByLessonId: 'lesson_12_container_binary',
    cliCommand: 'bin-audit',
    description:
      'Correlates static ELF symbols (`calc_citizen_threat_score`), CIS Docker escape misconfigurations (`Privileged: true`, `docker.sock`), and eBPF syscall traces.',
    descriptionZh:
      '联合审计 ELF 二进制符号 (`calc_citizen_threat_score`)、特权容器逃逸配置与 eBPF 越权读取宿主机文件记录。',
    investigationEffect: 'Sets lantern_binary_analyzed (-5% Suspicion, +10% Nadia Trust)',
    investigationEffectZh: '记录容器与二进制联合分析标记（怀疑度 -5%，Nadia 信任度 +10%）',
  },
};

export function getLessonById(lessonId: string): LearningLesson | undefined {
  return ALL_LEARNING_LESSONS.find((l) => l.id === lessonId);
}
