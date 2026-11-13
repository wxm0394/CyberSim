import { LearningLesson } from '../../learning/lessonTypes';

export const PROXY_VPN_LESSON: LearningLesson = {
  id: 'lesson_04_proxy_vpn',
  levelNumber: 4,
  code: 'LEVEL 04 · MVP LAB 03',
  title: 'The Route',
  titleZh: '看不见的通道',
  difficulty: 3,
  category: 'routing_tunnels',
  prerequisites: ['lesson_02_dns'],
  isMvpCoreLab: true,
  narrativeHook:
    'Vespera’s SOC is actively correlating residential ISP source IPs against internal log queries, and their gateway router runs a transparent proxy that logs plaintext headers. To extract the counter-proof from `10.88.4.22` without burning Apartment 4B’s physical IP, you must construct the right proxy and tunnel chain.',
  narrativeHookZh:
    'Vespera 安全部正在将家庭宽带源 IP 与内网日志访问记录进行实时比对，且街区出口网关部署了透明代理（Transparent Proxy）用于抓取流量特征。想要在不暴露 4B 公寓真实 IP 的前提下提取反证，你必须构建一条正确的加密代理与隧道链路。',
  concepts: [
    {
      id: 'concept_proxy_types',
      title: 'Forward Proxy vs. Reverse Proxy vs. Transparent Proxy',
      titleZh: '正向代理、反向代理与透明代理的本质区别',
      summary:
        'A Forward Proxy acts on behalf of the client (hiding the client’s IP from the destination server). A Reverse Proxy sits in front of backend servers (protecting server IPs and load-balancing). A Transparent Proxy intercepts traffic at the network gateway without client configuration—often used by corporate firewalls or ISPs for monitoring and filtering.',
      summaryZh:
        '正向代理（Forward Proxy）代表客户端发请求，向目标服务器隐藏客户端真实身份；反向代理（Reverse Proxy）代表服务端收请求，隐藏后端内网服务器结构；透明代理（Transparent Proxy）则在网关层静默劫持流量（客户端往往毫无察觉），常用于企业审计或网络监控。',
      keyTerms: ['Forward Proxy (Client-Side)', 'Reverse Proxy (Server-Side)', 'Transparent Proxy (Gateway Intercept)', 'SOCKS5 / SSH Dynamic Forwarding'],
      practicalRule:
        'A transparent proxy cannot read your payload if traffic is encapsulated inside an end-to-end encrypted tunnel (SSH Tunnel, WireGuard VPN, or TLS-wrapped SOCKS5) before leaving your host.',
      practicalRuleZh:
        '透明代理依赖对明文协议头或未加密元数据的嗅探；只要在流量离开本机前先封装进端到端加密隧道（SSH 隧道或 VPN），透明代理就只能看到发往跳板机的乱码流。',
      diagramLines: [
        'Forward Proxy    : [Client] ---> [Proxy (Hides Client)] ---> [Target Server]',
        'Reverse Proxy    : [Client] ---> [Reverse Proxy (Hides Backend)] ---> [Internal DB]',
        'Transparent Proxy: [Client] --(Intercepted at ISP GW)--> [DPI Logger] ---> [Target]',
      ],
    },
    {
      id: 'concept_vpn_vs_socks_dns_leak',
      title: 'SOCKS5 Application Proxy vs. VPN Network Tunnel & DNS Leak Prevention',
      titleZh: 'SOCKS5 应用层代理 vs VPN 网络层隧道与 DNS 泄露防护',
      summary:
        'SOCKS5 proxies individual TCP/UDP application sockets (Layer 5), whereas a VPN creates a virtual network interface (`tun0`, Layer 3) that encapsulates all IP packets. Crucially, if a proxy is configured without tunneling DNS (`socks5://` instead of `socks5h://` or split-tunnel leak), local UDP/53 queries still leak out of your physical ISP interface.',
      summaryZh:
        'SOCKS5 工作在会话层，仅代理指定应用程序的套接字；VPN 则创建虚拟网卡（如 `tun0`），在网络层封装整机 IP 数据包。最常见的致命失误是“DNS 泄露”：虽然应用流量走了代理，但域名解析仍通过本地物理网卡明文发出，瞬间暴露行踪。',
      keyTerms: ['tun0 Virtual Interface', 'SOCKS5 Remote DNS (socks5h)', 'Split-Tunnel DNS Leak', 'Multi-Hop Relay'],
      practicalRule:
        'When anonymity and deep subnet access are both required, encapsulate traffic through an encrypted tunnel to a trusted relay (`172.16.40.12`) and force remote DNS resolution inside the tunnel.',
      practicalRuleZh:
        '当同时需要隐匿源 IP 与跨网段访问时，应先建立通往可信跳板（`172.16.40.12`）的加密隧道，并强制将 DNS 查询一并封入隧道内（杜绝本地 DNS 泄露）。',
      diagramLines: [
        'Leaky Route : [eth0 10.0.2.15] --(Local UDP/53 Leak!)--> [ISP Transparent Proxy]',
        'Secure Route: [tun0 Encrypted] ===> [Relay 172.16.40.12 (SOCKS5h + WireGuard)] ===> [10.88.4.22]',
      ],
    },
  ],
  lab: {
    id: 'lab_04_proxy_tunnel_route',
    code: 'NETLAB-04 · MVP-03',
    title: 'Proxy Classification & Encrypted Multi-Hop Route Lab',
    titleZh: '代理角色辨析与多跳加密隧道构建实验',
    objective:
      'Analyze the 4th Avenue gateway topology, identify the ISP transparent proxy and DNS leak vector, and configure a leak-free encrypted route through MOTH’s Port District relay (`172.16.40.12`).',
    objectiveZh:
      '分析第四大道出口网关拓扑，识别运营商透明代理与本地 DNS 泄露隐患，并通过 MOTH 的港区中继节点 (`172.16.40.12`) 构建零泄露的多跳加密隧道。',
    environmentBanner: 'GREYOS SANDBOX // ROUTE BUILDER // ORIGIN: 10.0.2.15 -> RELAY: 172.16.40.12 -> TARGET: 10.88.4.22',
    initialSymptom:
      'Direct connections from `10.0.2.15` pass through `greyhaven-isp-tproxy01` (Transparent Proxy), logging your residential subscriber ID and leaking UDP/53 queries.',
    initialSymptomZh:
      '从 `10.0.2.15` 直接发出的流量会经过街区网关 `greyhaven-isp-tproxy01`（透明代理），你的家庭宽带订户 ID 与本地 UDP/53 查询正在被完整记录。',
    nodes: [
      {
        id: 'node_isp_tproxy',
        label: 'greyhaven-isp-tproxy01',
        address: '100.64.0.1 (Gateway)',
        role: 'ISP Transparent Intercept Proxy (Logs unencrypted headers & UDP/53)',
        roleZh: '街区网关透明代理（记录明文连接头与本地 DNS 泄露）',
        status: 'compromised',
      },
      {
        id: 'node_moth_relay',
        label: 'moth-relay-04',
        address: '172.16.40.12:1080',
        role: 'Port District Encrypted Relay (Supports SSH/WireGuard + SOCKS5h)',
        roleZh: '港区加密中继跳板（支持 WireGuard 隧道与远程 DNS 代理）',
        status: 'nominal',
      },
      {
        id: 'node_vespera_revproxy',
        label: 'vespera-edge-rev01',
        address: '10.88.4.22',
        role: 'Target Internal Gateway (Logs incoming source IP)',
        roleZh: '目标内部日志网关（记录来访源 IP）',
        status: 'suspect',
      },
    ],
    diagnosticActions: [
      {
        id: 'diag_route_trace',
        label: 'Trace Direct Path & Inspect Gateway Proxy Role',
        labelZh: '追踪直连路由并识别网关代理类型',
        commandPreview: 'traceroute -n 10.88.4.22 && route-audit --check-interception',
        targetNode: '100.64.0.1',
        telemetryOutput: [
          'Hop 1: 100.64.0.1 (greyhaven-isp-tproxy01) — Role: TRANSPARENT PROXY (Gateway DPI)',
          '  -> Observation: Client did not configure a proxy, yet HTTP/TLS SNI and source IP 10.0.2.15 are mirrored to Vespera SOC.',
          'Hop 2: 172.16.40.12 (moth-relay-04)        — Role: FORWARD PROXY / ENCRYPTED TUNNEL RELAY',
          'Hop 3: 10.88.4.22 (vespera-log-gw01)       — Role: TARGET SERVER behind Corporate Reverse Proxy',
        ].join('\n'),
        telemetryOutputZh: [
          '第 1 跳: 100.64.0.1 (greyhaven-isp-tproxy01) — 角色：透明代理（网关层静默嗅探）',
          '  -> 诊断：客户端虽未设置代理，但直连流量的源 IP 10.0.2.15 与明文元数据正被镜像至 Vespera 安全部。',
          '第 2 跳: 172.16.40.12 (moth-relay-04)        — 角色：正向代理 / 加密中继隧道节点',
          '第 3 跳: 10.88.4.22 (vespera-log-gw01)       — 角色：目标内网服务器（记录最后一跳来访 IP）',
        ].join('\n'),
        revealsClue:
          'Hop 1 (`100.64.0.1`) is a Transparent Proxy logging your residential IP. You need an encrypted tunnel to Hop 2 (`172.16.40.12`) so Hop 1 only sees opaque ciphertext and Hop 3 only sees `172.16.40.12`.',
        revealsClueZh:
          '第 1 跳 (`100.64.0.1`) 是网关透明代理。必须先建立通往第 2 跳 (`172.16.40.12`) 的加密隧道，使第 1 跳只能看到密文，且第 3 跳只记录中继 IP。',
        isCriticalClue: true,
      },
      {
        id: 'diag_dns_leak_test',
        label: 'Test Plain SOCKS5 vs. Full Encrypted Tunnel + Remote DNS (socks5h / tun0)',
        labelZh: '测试普通代理与“全加密隧道 + 隧道内 DNS”的泄露差异',
        commandPreview: 'tunnel-sim --test-leak 172.16.40.12:1080',
        targetNode: '172.16.40.12:1080',
        telemetryOutput: [
          '[Mode A: Plain HTTP/SOCKS5 without Tunnel Encryption]',
          '  - eth0 UDP/53 DNS query leaked to 100.64.0.1! ISP Transparent Proxy logged target hostname.',
          '[Mode B: WireGuard tun0 + SOCKS5h Remote Resolution via 172.16.40.12]',
          '  - Outer packet on eth0: UDP 51820 (ChaCha20-Poly1305 encrypted) -> 172.16.40.12',
          '  - DNS & TCP payload encapsulated inside tun0. Origin IP & hostname Exposure: 0%.',
        ].join('\n'),
        telemetryOutputZh: [
          '【模式 A：未加密的普通代理（本地解析 DNS）】',
          '  - 警告：UDP/53 域名查询仍从本地 eth0 流出！网关透明代理成功截获目标主机名。',
          '【模式 B：WireGuard 虚拟网卡 tun0 + SOCKS5h 远端解析（经由 172.16.40.12）】',
          '  - 物理网卡仅见发往 172.16.40.12:51820 的 ChaCha20 密文流；目标网关仅见中继 IP。泄露率：0%。',
        ].join('\n'),
        revealsClue:
          'CRITICAL: Mode B (WireGuard `tun0` + `socks5h` via `172.16.40.12`) eliminates both transparent proxy inspection and split-tunnel DNS leaks.',
        revealsClueZh:
          '关键发现：采用模式 B（WireGuard `tun0` 加密隧道 + `socks5h` 远端解析）可同时阻断网关透明代理嗅探与本地 DNS 泄露。',
        isCriticalClue: true,
      },
    ],
    resolutions: [
      {
        id: 'res_04_encrypted_multihop',
        label: 'Deploy WireGuard tun0 + SOCKS5h Multi-Hop Route via 172.16.40.12',
        labelZh: '部署经由 172.16.40.12 的 WireGuard tun0 + SOCKS5h 零泄露加密路由',
        commandPreview: 'route-apply --tunnel wg-moth0 --proxy socks5h://172.16.40.12:1080',
        approach: 'analytical',
        isOptimal: true,
        requiresDiagnosticIds: ['diag_route_trace', 'diag_dns_leak_test'],
        outcomeSummary:
          'Encapsulated all workstation traffic and DNS inside `tun0` through `172.16.40.12`. Unlocked Proxy Route Editor and Tunnel Monitor capabilities.',
        outcomeSummaryZh:
          '已将整机流量与 DNS 查询封装入 `tun0` 加密隧道并经由 `172.16.40.12` 中继转发。成功解锁【代理路由编辑器】与【隧道监控器】。',
        suspicionDelta: -10,
        exposureDelta: -10,
        trustNadiaDelta: 5,
      },
      {
        id: 'res_04_direct_exposed',
        label: 'Connect Directly Over Residential eth0 Without Encrypted Tunnel',
        labelZh: '不配置加密隧道，直接使用家庭宽带 eth0 裸连目标内网',
        commandPreview: 'connect 10.88.4.22 --interface eth0 --no-tunnel',
        approach: 'brute_force',
        isOptimal: false,
        requiresDiagnosticIds: [],
        outcomeSummary:
          'The ISP transparent proxy logged your residential IP `10.0.2.15` accessing Vespera’s internal subnet (+10% Corporate Suspicion, +15% Player Exposure).',
        outcomeSummaryZh:
          '街区透明代理完整记录了你的家庭宽带 IP `10.0.2.15` 访问企业内网的行为（企业怀疑度 +10%，玩家暴露度 +15%）。',
        suspicionDelta: 10,
        exposureDelta: 15,
        trustNadiaDelta: 0,
      },
    ],
    storyApplication: {
      id: 'app_04_multi_hop_shield',
      targetHostOrFile: '172.16.40.12',
      actionLabel: 'Apply Proxy Route Editor to Tunnel All GreyOS Traffic Through 172.16.40.12',
      actionLabelZh: '应用【代理路由编辑器】将工作站全流量与 DNS 封入 172.16.40.12 加密隧道',
      analyticalCommand: 'route-apply 172.16.40.12 --socks5h-wg',
      bruteForceCommand: 'connect 10.88.4.22 --direct-eth0',
      analyticalOutcome:
        'Activated leak-free WireGuard + SOCKS5h routing through MOTH relay `172.16.40.12` (-10% Corporate Suspicion, -10% Player Exposure).',
      analyticalOutcomeZh:
        '已启用经由 `172.16.40.12` 的 WireGuard + SOCKS5h 零泄露加密隧道，彻底隐藏公寓真实源 IP（怀疑度 -10%，暴露度 -10%）。',
      bruteForceOutcome:
        'Direct unproxied connection leaked Apartment 4B’s origin IP through the ISP transparent proxy (+10% Suspicion, +15% Exposure).',
      bruteForceOutcomeZh:
        '裸连操作导致 4B 公寓的真实源 IP 被网关透明代理捕获（怀疑度 +10%，暴露度 +15%）。',
      analyticalSuspicionDelta: -10,
      analyticalExposureDelta: -10,
      analyticalTrustDelta: 5,
      bruteForceSuspicionDelta: 10,
      bruteForceExposureDelta: 15,
    },
  },
  unlocks: {
    capabilities: ['proxy_route_editor', 'tunnel_monitor'],
    tools: ['route-apply', 'tunnel-stat'],
    badgeLabel: 'Proxy Route Editor & Tunnel Monitor',
    badgeLabelZh: '代理路由编辑器与隧道监控器',
  },
  source: {
    repository: 'hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    sectionPath: 'docs/abc/proxy-s-x.md & docs/abc/4vpn.md',
    sectionTitle: '正向代理、反向代理、透明代理与 VPN 隧道技术',
    adaptationNote:
      'Adapted from fq-book chapters explaining Forward/Reverse/Transparent proxies, SOCKS, and VPN tunnel encapsulation.',
    adaptationNoteZh:
      '改编自《这本书能让你连接互联网》中关于正向/反向/透明代理辨析及 VPN 虚拟网卡隧道封装的章节。',
  },
  reviewStatus: 'reviewed',
};
