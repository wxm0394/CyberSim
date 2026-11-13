import { LearningLesson } from '../../learning/lessonTypes';

export const NETWORKING_LESSON: LearningLesson = {
  id: 'lesson_01_networking',
  levelNumber: 1,
  code: 'LEVEL 01',
  title: 'The Ghost in the Wire',
  titleZh: '消失的数据包',
  difficulty: 1,
  sourceTrack: 'network_internet',
  category: 'networking',
  prerequisites: [],
  isMvpCoreLab: false,
  narrativeHook:
    'Nadia’s leaked archive arrived over an interrupted socket. Meanwhile, your workstation keeps emitting an unexplained outbound connection attempt toward port 8443 while UDP port 514 silently drops telemetry frames. Is it a hardware fault, a firewall drop, or a deliberate reset?',
  narrativeHookZh:
    'Nadia 传来的取证压缩包在断线前险些损毁。与此同时，你的工作站后台持续向 8443 端口发起异常外联，而 UDP 514 日志流却在悄无声息地丢包。这究竟是普通断网，还是某种精准的协议阻断？',
  concepts: [
    {
      id: 'concept_tcp_vs_udp',
      title: 'TCP vs. UDP: Reliable Handshake vs. Fire-and-Forget',
      titleZh: 'TCP 与 UDP：面向连接的三次握手 vs 无状态数据报',
      summary:
        'TCP establishes a stateful session via a 3-way handshake (SYN -> SYN-ACK -> ACK) and retransmits lost segments. UDP sends datagrams immediately without handshake or delivery confirmation—ideal for low-latency DNS queries or unidirectional syslog streams.',
      summaryZh:
        'TCP 在传输数据前必须通过三次握手（SYN -> SYN-ACK -> ACK）建立可靠会话，具备重传与顺序保证；UDP 则无需握手直接发包，延迟极低但可能静默丢包，常用于 DNS 查询或单向 Syslog 审计流。',
      keyTerms: ['TCP 3-Way Handshake', 'SYN / SYN-ACK / RST', 'UDP Datagram', 'Stateful vs Stateless'],
      practicalRule:
        'If a TCP connection immediately returns RST (Reset), a firewall or host actively rejected the session; if it stays in SYN_SENT, packets are being silently dropped.',
      practicalRuleZh:
        '若 TCP 连接立即收到 RST（重置），说明目标主机或中间设备主动拒绝或注入了阻断包；若一直停留在 SYN_SENT，则说明数据包被防火墙静默丢弃（DROP）。',
      diagramLines: [
        '[Client 10.0.2.15] --- SYN (seq=0) ---> [Server 10.88.4.22:8443]',
        '[Client 10.0.2.15] <-- RST (injected) - [Middlebox / Firewall]',
        '[Client 10.0.2.15] === UDP :514 (no ACK, stateless stream) ===> [Collector]',
      ],
    },
    {
      id: 'concept_ports_client_server',
      title: 'IP Addresses Locate Hosts; Ports Locate Processes',
      titleZh: 'IP 地址定位主机，端口号（Port）定位具体服务进程',
      summary:
        'An IP address routes packets to a network interface, while a 16-bit port number (1–65535) identifies which listening daemon (e.g., 22/SSH, 53/DNS, 443/HTTPS) receives the payload.',
      summaryZh:
        'IP 地址负责把数据包送到哪台机器，而 16 位端口号（1–65535）决定将数据交给机器上的哪一个守护进程（如 22/SSH、53/DNS、443/HTTPS）。',
      keyTerms: ['Socket (IP:Port)', 'Ephemeral Port', 'Listening Daemon', 'OPEN / CLOSED / FILTERED'],
      practicalRule:
        'Always inspect both the transport protocol (TCP/UDP) and the specific port state before assuming an entire server is offline.',
      practicalRuleZh:
        '排查连接故障时，切勿因为单个端口不通就判定整台服务器宕机，必须结合协议类型（TCP/UDP）与端口状态（OPEN/FILTERED/CLOSED）逐层定位。',
      diagramLines: [
        'Host 10.88.4.22',
        '  ├─ TCP :22   [OPEN]     -> sshd (Remote Admin)',
        '  ├─ UDP :123  [OPEN]     -> ntpd (Clock Sync)',
        '  └─ TCP :8443 [FILTERED] -> lantern-sync (RST injected on plain SYN)',
      ],
    },
  ],
  lab: {
    id: 'lab_01_packet_trace',
    code: 'NETLAB-01',
    title: 'Socket & Transport Anomaly Triage',
    titleZh: '套接字与传输层异常诊断实验',
    objective:
      'Inspect the socket state table and packet capture on GreyOS eth0 to determine why port 8443 fails while port 22 and UDP 123 remain reachable.',
    objectiveZh:
      '检查 GreyOS eth0 网卡的套接字状态表与抓包记录，查明为何 8443 端口连接失败，而 22 端口与 UDP 123 依然可达。',
    environmentBanner: 'GREYOS SANDBOX // IFACE: eth0 (10.0.2.15) <-> TARGET: 10.88.4.22',
    initialSymptom:
      'Connection to 10.88.4.22:8443 fails with "Connection reset by peer", causing junior operators to assume the entire Vespera gateway is offline.',
    initialSymptomZh:
      '访问 10.88.4.22:8443 报错“Connection reset by peer”，表面上看似乎整台 Vespera 日志网关已经下线。',
    nodes: [
      {
        id: 'node_client',
        label: 'apt4b-workstation',
        address: '10.0.2.15',
        role: 'Local Investigator Host',
        roleZh: '本地取证工作站',
        status: 'nominal',
      },
      {
        id: 'node_gateway',
        label: 'vespera-log-gw01',
        address: '10.88.4.22',
        role: 'Target Log Gateway (:22, :123, :8443)',
        roleZh: '目标日志网关 (:22, :123, :8443)',
        status: 'suspect',
      },
    ],
    diagnosticActions: [
      {
        id: 'diag_ss_table',
        label: 'Inspect Active Socket Table (ss -tulnp)',
        labelZh: '检查本地活动套接字表 (ss -tulnp)',
        commandPreview: 'ss -tulnp | grep 10.88.4.22',
        targetNode: '10.0.2.15',
        telemetryOutput: [
          'Netid  State      Recv-Q Send-Q  Local Address:Port   Peer Address:Port',
          'tcp    SYN-SENT   0      1       10.0.2.15:51922      10.88.4.22:8443',
          'tcp    ESTAB      0      0       10.0.2.15:48210      10.88.4.22:22',
          'udp    UNCONN     0      0       10.0.2.15:55102      10.88.4.22:123',
        ].join('\n'),
        telemetryOutputZh: [
          '协议   状态       接收   发送    本地套接字           远端套接字',
          'tcp    SYN-SENT   0      1       10.0.2.15:51922      10.88.4.22:8443  (握手未完成)',
          'tcp    ESTAB      0      0       10.0.2.15:48210      10.88.4.22:22    (SSH 会话正常)',
          'udp    UNCONN     0      0       10.0.2.15:55102      10.88.4.22:123   (NTP 无状态数据报)',
        ].join('\n'),
        revealsClue:
          'Host 10.88.4.22 is NOT offline: TCP port 22 is ESTABLISHED. Only TCP port 8443 is failing its 3-way handshake.',
        revealsClueZh:
          '目标主机 10.88.4.22 并未宕机：TCP 22 端口已正常建立连接，唯有 TCP 8443 端口的三次握手被阻断。',
        isCriticalClue: true,
      },
      {
        id: 'diag_pcap_rst',
        label: 'Capture TCP Handshake Packets on Port 8443',
        labelZh: '抓取 8443 端口的 TCP 握手数据包',
        commandPreview: 'tcpdump -nn -i eth0 host 10.88.4.22 and port 8443 -c 3',
        targetNode: '10.88.4.22',
        telemetryOutput: [
          '02:18:01.004 IP 10.0.2.15.51922 > 10.88.4.22.8443: Flags [S], seq 291044, win 64240',
          '02:18:01.006 IP 10.88.4.22.8443 > 10.0.2.15.51922: Flags [R.], ack 291045, win 0, TTL 128 (ACL Reset)',
          '02:18:01.019 IP 10.88.4.22.22   > 10.0.2.15.48210: Flags [P.], ttl 64 (Linux Kernel SSH)',
        ].join('\n'),
        telemetryOutputZh: [
          '02:18:01.004 IP 10.0.2.15.51922 > 10.88.4.22.8443: Flags [S] (发起 SYN 握手)',
          '02:18:01.006 IP 10.88.4.22.8443 > 10.0.2.15.51922: Flags [R.] TTL=128 (策略防火墙注入 RST 重置包)',
          '02:18:01.019 IP 10.88.4.22.22   > 10.0.2.15.48210: Flags [P.] TTL=64  (真实 Linux 主机 SSH 响应)',
        ].join('\n'),
        revealsClue:
          'Port 8443 returns a forged TCP RST with TTL 128 from an inline policy filter, while genuine host packets have TTL 64 on port 22.',
        revealsClueZh:
          '8443 端口返回的 TCP RST 带有异常的 TTL=128（中间策略设备伪造重置），而真实 Linux 主机在 22 端口的响应 TTL=64。',
        isCriticalClue: true,
      },
    ],
    resolutions: [
      {
        id: 'res_01_analytical_pinpoint',
        label: 'Isolate Port-Level Policy Reset & Pivot to TCP :22 / UDP :123',
        labelZh: '精准识别 8443 端口级 RST 策略阻断，改由 TCP :22 与 UDP :123 取证',
        commandPreview: 'net-analyzer --pinpoint-port-acl 10.88.4.22 --pivot 22,123',
        approach: 'analytical',
        isOptimal: true,
        requiresDiagnosticIds: ['diag_ss_table', 'diag_pcap_rst'],
        outcomeSummary:
          'Verified that 10.88.4.22 is alive and only port 8443 is filtered by an inline RST rule. Unlocked Packet & Port Inspector without tripping SOC flood alerts.',
        outcomeSummaryZh:
          '确认 10.88.4.22 在线且仅 8443 端口受内联 RST 规则拦截。成功解锁【数据包与端口分析器】，全程零告警。',
        suspicionDelta: -5,
        exposureDelta: 0,
        trustNadiaDelta: 5,
      },
      {
        id: 'res_01_brute_flood',
        label: 'Brute-Force Full 65535 Port SYN Flood to Force Response',
        labelZh: '暴力发起全端口 SYN 洪泛重连（不分析协议状态）',
        commandPreview: 'probe --aggressive --all-ports 10.88.4.22',
        approach: 'brute_force',
        isOptimal: false,
        requiresDiagnosticIds: [],
        outcomeSummary:
          'Hammering all 65,535 TCP ports triggered Vespera’s port-scan rate limiter (+10% Corporate Suspicion).',
        outcomeSummaryZh:
          '盲目对全部 65535 个端口发起高频 SYN 扫描，触发了 Vespera 边界防火墙的扫描告警（企业怀疑度 +10%）。',
        suspicionDelta: 10,
        exposureDelta: 5,
        trustNadiaDelta: 0,
      },
    ],
    storyApplication: {
      id: 'app_01_quiet_port_triage',
      targetHostOrFile: '10.88.4.22',
      actionLabel: 'Apply Packet Inspector to Quietly Fingerprint 10.88.4.22 Services',
      actionLabelZh: '运用【数据包分析器】对 10.88.4.22 执行静默传输层指纹校准',
      analyticalCommand: 'packet-inspect 10.88.4.22 --quiet-syn',
      bruteForceCommand: 'probe 10.88.4.22 --noisy',
      analyticalOutcome:
        'Passive TTL and socket state analysis fingerprinted 10.88.4.22 services cleanly (-5% Corporate Suspicion).',
      analyticalOutcomeZh:
        '通过被动 TTL 与套接字状态校准完成了 10.88.4.22 服务指纹识别，消除了异常重连特征（企业怀疑度 -5%）。',
      bruteForceOutcome:
        'Noisy aggressive port sweep logged by Vespera SIEM (+10% Corporate Suspicion).',
      bruteForceOutcomeZh:
        '高噪全端口暴力探测被 Vespera 安全中心记录（企业怀疑度 +10%）。',
      analyticalSuspicionDelta: -5,
      analyticalExposureDelta: 0,
      analyticalTrustDelta: 5,
      bruteForceSuspicionDelta: 10,
      bruteForceExposureDelta: 5,
    },
  },
  unlocks: {
    capabilities: ['packet_inspector'],
    tools: ['packet-inspect'],
    badgeLabel: 'Packet & Port Inspector',
    badgeLabelZh: '传输层与端口诊断器',
  },
  source: {
    repository: 'hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    sectionPath: 'docs/abc/connection.md',
    sectionTitle: '两台主机之间的连接（TCP/UDP、端口与连接状态）',
    adaptationNote:
      'Adapted from fq-book chapter on host-to-host connections, ports, and TCP/UDP transport behavior.',
    adaptationNoteZh:
      '改编自《这本书能让你连接互联网》中关于主机通信、端口分工与 TCP/UDP 传输机制的章节。',
  },
  reviewStatus: 'reviewed',
};
