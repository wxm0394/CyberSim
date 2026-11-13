import { LearningLesson } from '../../learning/lessonTypes';

export const CONTAINER_BINARY_LESSON: LearningLesson = {
  id: 'lesson_12_container_binary',
  levelNumber: 12,
  code: 'LEVEL 12 · CONTAINER & BINARY',
  title: 'The Escaped Container',
  titleZh: '逃逸容器与二进制逆向取证',
  difficulty: 3,
  sourceTrack: 'tactical_security',
  category: 'container_appsec',
  prerequisites: ['lesson_11_hsm_forensics'],
  isMvpCoreLab: false,
  narrativeHook:
    'Inside `/home/eli/Downloads/incident_0427/` sit three artifacts recovered from Vespera’s collector node: the stripped daemon binary `lantern-syncd`, its Docker deployment manifest `lantern-collector.json`, and an eBPF syscall recording `lantern-syncd.trace`. Together they reveal what Project LANTERN actually does—and how it escaped its container boundary.',
  narrativeHookZh:
    '在 `/home/eli/Downloads/incident_0427/` 目录下存放着从采集节点提取的三份关键样本：二进制守护进程 `lantern-syncd`、容器部署清单 `lantern-collector.json` 以及 eBPF 系统调用追踪记录 `lantern-syncd.trace`。对它们进行联合静态审计，将彻底揭开“灯塔计划”的真实功能及其容器逃逸路径。',
  concepts: [
    {
      id: 'concept_elf_static_analysis',
      title: 'Static ELF Binary Analysis: Sections, Symbols, Mitigations & Embedded Strings',
      titleZh: 'ELF 二进制静态分析：节区、符号表、安全加固标志与特征字符串',
      summary:
        'Without ever executing an untrusted binary, inspecting its ELF header, symbol table, and `.rodata` strings reveals its internal purpose and security posture. `lantern-syncd` disables stack canaries (`Canary: false`) and PIE (`PIE: false`), exports internal functions `calc_citizen_threat_score` and `mount_host_shadow_Copy`, and embeds the target path `/host_etc/shadow`.',
      summaryZh:
        '无需冒险运行未知二进制程序，仅通过静态解析 ELF 头、符号表与 `.rodata` 常量字符串，就能还原其核心逻辑与编译安全姿态。`lantern-syncd` 不仅关闭了栈保护（`Canary: false`）与地址随机化（`PIE: false`），还暴露了 `calc_citizen_threat_score`（公民威胁评分计算）和 `mount_host_shadow_Copy` 符号，并硬编码了宿主机敏感路径 `/host_etc/shadow`。',
      keyTerms: ['ELF Symbol Table', 'NX / PIE / Stack Canary / RELRO', 'calc_citizen_threat_score', 'Static String Extraction'],
      practicalRule:
        'Never execute a recovered binary on your workstation—use static ELF symbol/string inspection (`bin-audit`) to extract its capabilities safely.',
      practicalRuleZh:
        '绝不要在调查工作站上直接运行取证获得的未知二进制程序，应始终使用静态 ELF 符号与字符串分析提取其功能特征。',
      diagramLines: [
        'ELF Symbols : calc_citizen_threat_score (0x402190) | mount_host_shadow_Copy (0x4024c0)',
        'Mitigations : NX=true | PIE=false | Canary=false | RELRO=partial',
        '.rodata     : "/host_etc/shadow", "/var/run/docker.sock", "M_HALE_SEC_01"',
      ],
    },
    {
      id: 'concept_docker_escape_ebpf',
      title: 'CIS Container Misconfigurations (`Privileged: true`, `docker.sock`) & eBPF Syscall Telemetry',
      titleZh: 'CIS 容器逃逸风险配置（特权模式、`docker.sock` 挂载）与 eBPF 系统调用佐证',
      summary:
        'Deploying a container with `Privileged: true`, `CAP_SYS_ADMIN`, `PidMode: "host"`, and bind-mounting `/var/run/docker.sock` + `/etc:/host_etc:ro` effectively hands full host root control to the container process. Correlating the pre-recorded eBPF trace (`lantern-syncd.trace`) proves `lantern-syncd` actually invoked `openat("/host_etc/shadow")` and connected to `/var/run/docker.sock`.',
      summaryZh:
        '在容器配置中开启 `Privileged: true`、赋予 `CAP_SYS_ADMIN`、共享宿主机 PID 命名空间（`PidMode: "host"`）并挂载 `/var/run/docker.sock` 与 `/etc:/host_etc:ro`，等同于向容器进程直接交出了宿主机最高控制权。结合离线 eBPF 追踪记录 (`lantern-syncd.trace`)，可实锤 `lantern-syncd` 在运行时确实调用了 `openat("/host_etc/shadow")` 并连接了宿主机 Docker 套接字。',
      keyTerms: ['Privileged Container & CAP_SYS_ADMIN', '/var/run/docker.sock Bind Mount', 'eBPF Syscall Telemetry (openat / connect)', 'Static + Runtime Correlation'],
      practicalRule:
        'Combine static ELF/container configuration auditing with eBPF syscall traces to prove both capability (what the code can do) and execution (what it actually did).',
      practicalRuleZh:
        '将 ELF/容器配置的静态审计与离线 eBPF 系统调用记录相结合，既能证明程序“具备逃逸与监控能力”，又能证实其在案发时“确实执行了越权操作”。',
      diagramLines: [
        'Container Config : Privileged=true + /var/run/docker.sock + /etc:/host_etc:ro',
        'eBPF Trace Proof : PID 4812 (lantern-syncd) -> openat("/host_etc/shadow") -> fd=7',
      ],
    },
  ],
  lab: {
    id: 'lab_12_container_binary_ebpf',
    code: 'SECLAB-12',
    title: 'Static ELF Analysis, CIS Container Audit & eBPF Trace Correlation Lab',
    titleZh: 'ELF 静态逆向、CIS 容器安全审计与 eBPF 追踪联合取证实验',
    objective:
      'Perform static ELF analysis on `lantern-syncd`, audit `lantern-collector.json` against CIS Docker benchmarks, and correlate the offline eBPF trace `lantern-syncd.trace` to prove Project LANTERN’s host-boundary breach and citizen-scoring engine.',
    objectiveZh:
      '对 `lantern-syncd` 执行静态 ELF 分析，依据 CIS 基线审计容器配置 `lantern-collector.json`，并关联 eBPF 追踪日志 `lantern-syncd.trace`，完整锁定灯塔计划的市民评分逻辑与容器逃逸证据。',
    environmentBanner: 'GREYOS SANDBOX // ELF BINARY, DOCKER CIS & EBPF TRACE AUDITOR // STATIC',
    initialSymptom:
      'Vespera claims `lantern-syncd` is an isolated, benign infrastructure metrics collector that cannot access host files or personal data.',
    initialSymptomZh:
      'Vespera 声称 `lantern-syncd` 只是一个严格隔离的基础设施性能采集器，绝不可能访问宿主机敏感文件或市民个人数据。',
    nodes: [
      {
        id: 'node_elf_binary',
        label: 'lantern-syncd (ELF 64-bit)',
        address: 'SHA256: 4e8c91b2...7a31',
        role: 'Recovered Project LANTERN Collector Daemon Binary',
        roleZh: '提取出的灯塔计划采集守护进程 ELF 二进制样本',
        status: 'compromised',
      },
      {
        id: 'node_docker_ebpf',
        label: 'lantern-collector.json + lantern-syncd.trace',
        address: 'Container c9f1a8042b1e // PID 4812',
        role: 'Docker Inspect Manifest & Pre-Recorded eBPF Syscall Telemetry',
        roleZh: '容器部署配置清单与预录制的 eBPF 内核系统调用追踪样本',
        status: 'compromised',
      },
    ],
    diagnosticActions: [
      {
        id: 'diag_12_elf_inspect',
        label: 'Inspect ELF Hardening Flags, Exported Symbols & `.rodata` Strings in `lantern-syncd`',
        labelZh: '静态解析 `lantern-syncd` 的 ELF 安全加固标志、函数符号与 `.rodata` 字符串',
        commandPreview: 'bin-audit lantern-syncd',
        targetNode: 'lantern-syncd (ELF 64-bit)',
        telemetryOutput: [
          '[ELF HARDENING] NX: true | PIE: false | Stack Canary: false | RELRO: partial',
          '[SYMBOL TABLE ] 0x00402190 func calc_citizen_threat_score (GLOBAL)',
          '[SYMBOL TABLE ] 0x004024c0 func mount_host_shadow_Copy (GLOBAL)',
          '[RODATA STRING] "LANTERN_COLLECTOR_V2 // TARGET_SUBNET=10.88.0.0/16"',
          '[RODATA STRING] "/host_etc/shadow" | "/var/run/docker.sock"',
        ].join('\n'),
        telemetryOutputZh: [
          '【ELF 安全加固】NX: 开启 | PIE: 关闭 | Stack Canary (栈保护): 关闭 | RELRO: 部分',
          '【导出函数符号】0x00402190 func calc_citizen_threat_score（市民威胁评分计算函数）',
          '【导出函数符号】0x004024c0 func mount_host_shadow_Copy（宿主机 shadow 挂载函数）',
          '【只读字符串  】"LANTERN_COLLECTOR_V2 // TARGET_SUBNET=10.88.0.0/16"',
          '【只读字符串  】"/host_etc/shadow" | "/var/run/docker.sock"',
        ].join('\n'),
        revealsClue:
          '`lantern-syncd` contains the function `calc_citizen_threat_score` and hardcoded paths to `/host_etc/shadow` and `/var/run/docker.sock`.',
        revealsClueZh:
          '`lantern-syncd` 内部包含 `calc_citizen_threat_score`（市民威胁评分函数）以及指向 `/host_etc/shadow` 与 `/var/run/docker.sock` 的硬编码路径。',
        isCriticalClue: true,
      },
      {
        id: 'diag_12_container_ebpf_audit',
        label: 'Audit `lantern-collector.json` CIS Posture & Correlate `lantern-syncd.trace` eBPF Events',
        labelZh: '审计 `lantern-collector.json` 容器配置并关联 `lantern-syncd.trace` eBPF 系统调用记录',
        commandPreview: 'bin-audit --container lantern-collector.json --trace lantern-syncd.trace',
        targetNode: 'lantern-collector.json + lantern-syncd.trace',
        telemetryOutput: [
          '[CIS DOCKER FAIL] Privileged: true | CapAdd: [CAP_SYS_ADMIN, CAP_NET_ADMIN, CAP_SYS_PTRACE]',
          '[CIS DOCKER FAIL]PidMode: "host" | Mounts: /var/run/docker.sock, /etc -> /host_etc:ro',
          '[EBPF SYSCALL 1 ] 02:14:09.118Z PID 4812 openat("/host_etc/shadow", O_RDONLY) = fd 7 [HOST_BOUNDARY_VIOLATION]',
          '[EBPF SYSCALL 2 ] 02:14:09.890Z PID 4812 connect("/var/run/docker.sock") = 0 [CONTAINER_SOCKET_ESCAPE_RISK]',
        ].join('\n'),
        telemetryOutputZh: [
          '【CIS 容器违规】Privileged: true（特权容器）| 附加能力: CAP_SYS_ADMIN, CAP_NET_ADMIN, CAP_SYS_PTRACE',
          '【CIS 容器违规】PidMode: "host" | 危险挂载: /var/run/docker.sock 与 /etc -> /host_etc:ro',
          '【eBPF 调用实锤 1】02:14:09.118Z PID 4812 调用 openat("/host_etc/shadow") 成功读取宿主机密码文件！',
          '【eBPF 调用实锤 2】02:14:09.890Z PID 4812 连接 "/var/run/docker.sock" 宿主机管理套接字！',
        ].join('\n'),
        revealsClue:
          'Correlated CIS container audit and eBPF syscall trace: `lantern-syncd` runs in a privileged container with `/var/run/docker.sock` mounted and actively reads `/host_etc/shadow`.',
        revealsClueZh:
          '完成容器配置与 eBPF 追踪交叉实锤：`lantern-syncd` 运行在挂载了 `docker.sock` 的特权容器中，并在案发时跨边界读取了宿主机 `/host_etc/shadow`。',
        isCriticalClue: true,
      },
    ],
    resolutions: [
      {
        id: 'res_12_correlate_binary_container_ebpf',
        label: 'Synthesize ELF Symbol, CIS Container Escape & eBPF Telemetry Forensic Dossier',
        labelZh: '整合 ELF 符号、CIS 容器逃逸配置与 eBPF 追踪证据卷宗',
        commandPreview: 'bin-audit lantern-syncd && bin-audit --container lantern-collector.json && bin-audit --trace lantern-syncd.trace',
        approach: 'analytical',
        isOptimal: true,
        requiresDiagnosticIds: ['diag_12_elf_inspect', 'diag_12_container_ebpf_audit'],
        outcomeSummary:
          'Completed the static binary, container CIS, and eBPF correlation lab. Unlocked `bin-audit` on your GreyOS workstation.',
        outcomeSummaryZh:
          '已完成 ELF 静态逆向、容器安全审计与 eBPF 追踪联合实验，解锁工作站工具 `bin-audit`。将其应用到样本文件即可生成完整技术铁证。',
        suspicionDelta: 0,
        exposureDelta: 0,
        trustNadiaDelta: 0,
      },
      {
        id: 'res_12_run_binary_unsandboxed',
        label: 'Execute `./lantern-syncd` Directly on Your GreyOS Workstation to Observe It Live',
        labelZh: '直接在你的 GreyOS 工作站上裸跑 `./lantern-syncd` 观察其行为',
        commandPreview: 'chmod +x ./lantern-syncd && sudo ./lantern-syncd',
        approach: 'brute_force',
        isOptimal: false,
        requiresDiagnosticIds: [],
        outcomeSummary:
          'Running an unknown privileged corporate binary directly on your host exposed `/etc/shadow` and emitted a live outbound beacon to `198.51.100.204:8443` (+10% Corporate Suspicion, +15% Exposure).',
        outcomeSummaryZh:
          '在宿主机上直接运行未知的企业特权二进制程序，导致本机敏感文件暴露并向远端发送了实时外联信标（怀疑度 +10%，暴露度 +15%）。',
        suspicionDelta: 10,
        exposureDelta: 15,
        trustNadiaDelta: 0,
      },
    ],
    storyApplication: {
      id: 'app_12_bin_audit_lantern',
      targetHostOrFile: 'lantern-syncd',
      actionLabel: 'Run `bin-audit` on `lantern-syncd`, `lantern-collector.json` & `lantern-syncd.trace`',
      actionLabelZh: '对 `lantern-syncd`、容器配置与 eBPF 追踪样本执行 `bin-audit` 联合取证',
      analyticalCommand: 'bin-audit lantern-syncd',
      bruteForceCommand: './lantern-syncd',
      analyticalOutcome:
        'Correlated ELF symbols (`calc_citizen_threat_score`), privileged Docker mounts (`/var/run/docker.sock`, `/host_etc`), and eBPF `openat("/host_etc/shadow")` syscalls (`lantern_binary_analyzed`, -5% Suspicion, +10% Nadia Trust).',
      analyticalOutcomeZh:
        '已联合固定 `lantern-syncd` 的威胁评分函数符号、特权容器配置与 eBPF 越权读取宿主机文件证据（记录 `lantern_binary_analyzed`，怀疑度 -5%，Nadia 信任度 +10%）。',
      bruteForceOutcome:
        'Executing the unverified binary triggered an outbound telemetry ping to Vespera SOC (+10% Suspicion, +15% Exposure).',
      bruteForceOutcomeZh:
        '直接运行未知二进制样本触发了向 Vespera 安全中心的外联告警（怀疑度 +10%，暴露度 +15%）。',
      analyticalSuspicionDelta: -5,
      analyticalExposureDelta: 0,
      analyticalTrustDelta: 10,
      bruteForceSuspicionDelta: 10,
      bruteForceExposureDelta: 15,
    },
  },
  unlocks: {
    capabilities: ['binary_container_analyzer'],
    tools: ['bin-audit'],
    badgeLabel: 'Binary, Container & eBPF Analyzer',
    badgeLabelZh: '二进制、容器配置与 eBPF 审计器',
  },
  source: {
    repository: 'Lauren-Bitten/CyberSecurity-Projects',
    upstreamRepository: 'CarterPerez-dev/Cybersecurity-Projects',
    fork: 'Lauren-Bitten/CyberSecurity-Projects',
    license: 'AGPL-3.0',
    sectionPath: 'PROJECTS/intermediate/docker-security-audit & PROJECTS/intermediate/binary-analysis-tool & PROJECTS/beginner/linux-ebpf-security-tracer',
    sectionTitle: 'Docker Security Audit, Binary Analysis Tool & Linux eBPF Security Tracer',
    adaptationNote:
      'Adapted from the ELF binary analysis, CIS Docker security audit, and Linux eBPF syscall tracing project specifications into a unified static forensic audit.',
    adaptationNoteZh:
      '融合二进制静态分析、Docker CIS 安全审计与 Linux eBPF 系统调用追踪三个项目的工程原理，构建的联合取证收官关卡。',
  },
  reviewStatus: 'reviewed',
};
