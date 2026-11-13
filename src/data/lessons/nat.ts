import { LearningLesson } from '../../learning/lessonTypes';

export const NAT_LESSON: LearningLesson = {
  id: 'lesson_05_nat_vm',
  levelNumber: 5,
  code: 'LEVEL 05',
  title: 'The Network Maze',
  titleZh: '网络迷宫',
  difficulty: 4,
  category: 'routing_tunnels',
  prerequisites: ['lesson_01_networking'],
  isMvpCoreLab: false,
  narrativeHook:
    'In the 4th Avenue laundromat, Nadia’s air-gapped recovery VM sits behind a nested subnet (`192.168.56.102`), while the street-level municipal CCTV controller (`192.168.42.18`) is behind a Carrier-Grade NAT router. Why can’t external packets reach a Host-Only VM directly, and how does NAT port forwarding bridge private subnets?',
  narrativeHookZh:
    '在第四大道洗衣房后间，Nadia 的取证沙箱运行在虚拟网卡网段 (`192.168.56.102`)，而街角的市政监控控制器 (`192.168.42.18`) 则隐藏在局域网 NAT 网关之后。为什么外部网络无法直接连入 Host-Only 虚拟机？NAT 端口映射又是如何打通内网隔离的？',
  concepts: [
    {
      id: 'concept_nat_private_ip',
      title: 'RFC 1918 Private Subnets & Network Address Translation (NAT)',
      titleZh: '私有内网网段（RFC 1918）与 NAT 网络地址转换',
      summary:
        'Private IPv4 ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) are not routable on the public internet. A NAT router rewrites the source IP:Port of outbound packets to its public IP and tracks the session in a state table so return traffic finds the right internal host.',
      summaryZh:
        '私有内网地址（`10.x`、`172.16-31.x`、`192.168.x`）无法在公网直接路由。NAT 网关在数据包出站时将源 IP:端口改写为网关公网地址并记录映射表，从而让多台内网设备共享出口，同时天然阻挡未映射的外部主动连接。',
      keyTerms: ['RFC 1918 Private IP', 'SNAT / Masquerade', 'DNAT Port Forwarding', 'NAT State Table'],
      practicalRule:
        'Inbound connections from outside a NAT boundary fail unless an explicit DNAT Port Forwarding rule or an outbound reverse tunnel exists.',
      practicalRuleZh:
        '除非网关配置了明确的 DNAT 端口转发规则，或由内网主机主动向外建立反弹隧道，否则外部主机无法直接主动连入 NAT 内部设备。',
      diagramLines: [
        '[Internal CCTV 192.168.42.18:554] <== DNAT :8554 == [Municipal NAT GW] <== [Investigator]',
      ],
    },
    {
      id: 'concept_vm_network_modes',
      title: 'Virtual Machine Network Modes: Bridged vs. NAT vs. Host-Only',
      titleZh: '虚拟机三大网络模式：桥接（Bridged）、NAT 与仅主机（Host-Only）',
      summary:
        'In Bridged mode, a VM appears as a peer physical machine on the LAN (risking exposure to LAN scanners). In NAT mode, the VM can reach the internet through the host but is hidden from LAN peers. In Host-Only mode (`vboxnet0`), the VM can communicate ONLY with the host OS—completely isolated from external networks.',
      summaryZh:
        '桥接模式（Bridged）下虚拟机如同局域网内的独立实体机，易被同网段扫描发现；NAT 模式下虚拟机可借宿主机上网但对局域网隐身；仅主机模式（Host-Only）则彻底切断外网路由，仅允许宿主机与虚拟机内部通信，是分析高危样本的最佳沙箱模式。',
      keyTerms: ['Bridged (LAN Peer)', 'NAT Mode (Outbound Only)', 'Host-Only (Air-Gapped Sandbox)', 'Virtual NIC'],
      practicalRule:
        'Always inspect suspicious forensic dumps inside a Host-Only virtual network so embedded beacon scripts cannot phone home to corporate SOC servers.',
      practicalRuleZh:
        '分析可疑取证镜像或未知脚本时，务必将虚拟机设为 Host-Only（仅主机）模式，防止样本中暗藏的信标脚本向企业安全部回传定位信息。',
      diagramLines: [
        'Bridged  : [VM] <---> [Physical LAN Router] (Exposed to LAN scans!)',
        'NAT Mode : [VM] ---> [Host NAT Engine] ---> [Internet] (Can phone home!)',
        'Host-Only: [VM 192.168.56.102] <---> [Host GreyOS ONLY] (Zero external leak)',
      ],
    },
  ],
  lab: {
    id: 'lab_05_topology_maze',
    code: 'NETLAB-05',
    title: 'NAT Port Forwarding & VM Sandbox Isolation Lab',
    titleZh: 'NAT 映射表分析与虚拟机隔离边界实验',
    objective:
      'Audit the GreyOS virtual hypervisor network mode for the `incident_0427` sandbox and inspect the 4th Avenue municipal NAT table to locate the CCTV maintenance port.',
    objectiveZh:
      '审计 GreyOS 上运行取证沙箱的虚拟机网络模式，并检查第四大道市政网关的 NAT 转换表以定位监控节点维护通路。',
    environmentBanner: 'GREYOS SANDBOX // HYPERVISOR & NAT TOPOLOGY MAPPER // SUBNET AUDIT',
    initialSymptom:
      'The forensic VM (`192.168.56.102`) is accidentally set to Bridged mode—allowing Vespera canary scripts to ping out—while municipal camera `192.168.42.18` appears unreachable from outside.',
    initialSymptomZh:
      '取证虚拟机 (`192.168.56.102`) 处于危险的桥接（Bridged）模式，随时可能触发样本外联；同时市政监控节点 `192.168.42.18` 隐藏在 NAT 网关后无法直接访问。',
    nodes: [
      {
        id: 'node_vm_sandbox',
        label: 'forensic-sandbox-vm',
        address: '192.168.56.102 (vnet0)',
        role: 'Analysis VM (Currently misconfigured in Bridged mode!)',
        roleZh: '取证沙箱虚拟机（当前误设为危险的桥接模式！）',
        status: 'compromised',
      },
      {
        id: 'node_cctv_nat',
        label: 'greyhaven-muni-cam04',
        address: '192.168.42.18:554',
        role: 'Municipal CCTV Node behind 4th Ave NAT Gateway',
        roleZh: '位于第四大道 NAT 网关后的市政监控节点',
        status: 'suspect',
      },
    ],
    diagnosticActions: [
      {
        id: 'diag_vm_ifaces',
        label: 'Inspect Virtual Machine Hypervisor NIC Modes (virsh / ip addr)',
        labelZh: '检查虚拟机网卡工作模式与外联风险 (virsh / ip addr)',
        commandPreview: 'virsh domiflist forensic-sandbox-vm && ip route show',
        targetNode: '192.168.56.102',
        telemetryOutput: [
          'Interface   Type      Source    Model   Status',
          'vnet0       bridge    br0-eth0  virtio  [WARNING: Bridged to physical WAN! Canary can phone home!]',
          'vboxnet0    hostonly  isolated  virtio  [AVAILABLE: Air-gapped Host-Only interface 192.168.56.0/24]',
        ].join('\n'),
        telemetryOutputZh: [
          '虚拟网卡    模式      绑定源    驱动    安全状态诊断',
          'vnet0       bridge    br0-eth0  virtio  【高危：已桥接至物理外网！样本信标可随时向企业回传 IP】',
          'vboxnet0    hostonly  isolated  virtio  【安全：仅主机隔离网段 192.168.56.0/24，零外联泄漏】',
        ].join('\n'),
        revealsClue:
          'CRITICAL: The sandbox VM is bridged directly to `eth0`. Switching it to `Host-Only (vboxnet0)` isolates any embedded Vespera canary scripts.',
        revealsClueZh:
          '关键发现：取证虚拟机被桥接到了物理网卡 `eth0`。将其切换为 `Host-Only (vboxnet0)` 仅主机模式即可彻底阻断样本外联。',
        isCriticalClue: true,
      },
      {
        id: 'diag_nat_table',
        label: 'Inspect Municipal Gateway DNAT Port Forwarding Table',
        labelZh: '查询市政网关的 DNAT 端口转发映射表',
        commandPreview: 'iptables -t nat -L PREROUTING -n -v',
        targetNode: '192.168.42.18',
        telemetryOutput: [
          'Chain PREROUTING (policy ACCEPT)',
          'target  prot  in      source       destination    mapping',
          'DNAT    tcp   wlan0   10.0.2.0/24  192.168.42.1   tcp dpt:8554 -> to:192.168.42.18:554',
          'DNAT    tcp   wlan0   10.0.2.0/24  192.168.42.1   tcp dpt:2323 -> to:192.168.42.18:23 (Maint Shell)',
        ].join('\n'),
        telemetryOutputZh: [
          'PREROUTING 端口转发链 (NAT 映射表)：',
          '动作    协议  入口    允许源网段   网关地址       内部转发目标',
          'DNAT    tcp   wlan0   10.0.2.0/24  192.168.42.1   端口 8554 -> 映射至内网 192.168.42.18:554 (RTSP)',
          'DNAT    tcp   wlan0   10.0.2.0/24  192.168.42.1   端口 2323 -> 映射至内网 192.168.42.18:23  (维护接口)',
        ].join('\n'),
        revealsClue:
          'The municipal NAT gateway forwards port 2323/8554 directly to internal CCTV host `192.168.42.18`.',
        revealsClueZh:
          '市政 NAT 网关通过 DNAT 规则将端口 2323 与 8554 映射到了内网监控节点 `192.168.42.18`。',
        isCriticalClue: true,
      },
    ],
    resolutions: [
      {
        id: 'res_05_isolate_vm_and_map_nat',
        label: 'Switch Sandbox VM to Host-Only Mode & Map Municipal DNAT Route',
        labelZh: '将取证虚拟机切换为 Host-Only 隔离模式并写入市政 DNAT 映射表',
        commandPreview: 'topo-map --set-vm-mode host-only --map-dnat 192.168.42.18',
        approach: 'analytical',
        isOptimal: true,
        requiresDiagnosticIds: ['diag_vm_ifaces', 'diag_nat_table'],
        outcomeSummary:
          'Locked the forensic VM into Host-Only isolation (preventing canary callbacks) and mapped the NAT forwarding route to `192.168.42.18`. Unlocked Topology Mapper.',
        outcomeSummaryZh:
          '已将取证沙箱锁定为 Host-Only 仅主机隔离模式（阻断信标回传），并完成对 `192.168.42.18` 的 NAT 拓扑测绘。成功解锁【网络拓扑测绘仪】。',
        suspicionDelta: -5,
        exposureDelta: -5,
        trustNadiaDelta: 5,
      },
      {
        id: 'res_05_keep_bridged',
        label: 'Leave VM in Bridged Mode and Broadcast ARP Sweeps Across Public Interface',
        labelZh: '保持桥接模式并在外网接口盲目广播 ARP 扫描',
        commandPreview: 'arp-scan --interface br0-eth0 192.168.0.0/16',
        approach: 'brute_force',
        isOptimal: false,
        requiresDiagnosticIds: [],
        outcomeSummary:
          'Running the sandbox in Bridged mode allowed an embedded Vespera script to beacon your MAC and subnet to SOC (+10% Suspicion, +10% Exposure).',
        outcomeSummaryZh:
          '在桥接模式下运行取证沙箱导致内嵌信标向安全部回传了网卡特征（怀疑度 +10%，暴露度 +10%）。',
        suspicionDelta: 10,
        exposureDelta: 10,
        trustNadiaDelta: 0,
      },
    ],
    storyApplication: {
      id: 'app_05_sandbox_and_cctv_nat',
      targetHostOrFile: '192.168.42.18',
      actionLabel: 'Apply Topology Mapper to Isolate Sandbox VM & Pinpoint CCTV NAT Forward',
      actionLabelZh: '应用【拓扑测绘仪】隔离本地取证沙箱并精准穿透市政监控 NAT',
      analyticalCommand: 'topo-map 192.168.42.18 --host-only-guard',
      bruteForceCommand: 'probe 192.168.42.18 --bridged-broadcast',
      analyticalOutcome:
        'Isolated local analysis sandbox in Host-Only mode and mapped clean NAT traversal to `192.168.42.18` (-5% Corporate Suspicion, -5% Exposure).',
      analyticalOutcomeZh:
        '已启用 Host-Only 沙箱隔离并精准映射 `192.168.42.18` 的 NAT 转发端口，大幅降低行动暴露风险（怀疑度 -5%，暴露度 -5%）。',
      bruteForceOutcome:
        'Unisolated Bridged VM leaked MAC telemetry during subnet scan (+10% Suspicion, +10% Exposure).',
      bruteForceOutcomeZh:
        '未隔离的桥接网卡在跨网段扫描时泄漏了本机特征（怀疑度 +10%，暴露度 +10%）。',
      analyticalSuspicionDelta: -5,
      analyticalExposureDelta: -5,
      analyticalTrustDelta: 5,
      bruteForceSuspicionDelta: 10,
      bruteForceExposureDelta: 10,
    },
  },
  unlocks: {
    capabilities: ['topology_mapper'],
    tools: ['topo-map'],
    badgeLabel: 'Topology Mapper',
    badgeLabelZh: 'NAT 与虚拟网络拓扑测绘仪',
  },
  source: {
    repository: 'hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    sectionPath: 'docs/abc/4nat.md & docs/abc/3vm.md',
    sectionTitle: 'NAT 网络地址转换与虚拟机网络模式（桥接/NAT/Host-Only）',
    adaptationNote:
      'Adapted from fq-book chapters on NAT private/public translation and virtual machine networking modes.',
    adaptationNoteZh:
      '改编自《这本书能让你连接互联网》中关于 NAT 内外网地址转换及虚拟机三种网络模式的章节。',
  },
  reviewStatus: 'reviewed',
};
