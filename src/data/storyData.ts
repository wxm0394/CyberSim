import {
  ChapterEndingId,
  ChapterEndingReport,
  CharacterProfile,
  DeadAirState,
  EvidenceArtifact,
  GameShellState,
  InventoryItem,
  MailMessage,
  PhoneMessage,
  SceneHotspot,
  SceneId,
  VirtualFileEntry,
} from '../game/types';

export const CURRENT_SAVE_VERSION = 2;

export const CHAPTER_ONE_ENDINGS: Record<
  Exclude<ChapterEndingId, null>,
  ChapterEndingReport
> = {
  ENDING_A_SIGNAL_LEAKS: {
    id: 'ENDING_A_SIGNAL_LEAKS',
    code: 'ENDING A',
    title: 'THE SIGNAL LEAKS',
    titleZh: '信号破壁 · 真相曝光',
    subtitle:
      'Whistleblower Proof Transmitted to The Greyhaven Ledger Before Blackout',
    subtitleZh: '断网前一秒，完整加密证据链已通过记者死信通道公之于众',
    epilogue:
      'When Vespera Corporate Security severed your fiber line and flashed "WE KNOW WHO YOU ARE" across your monitor, their containment team was already thirty seconds too late. Because you correlated the 14-minute blackout timeline, kept exposure below critical thresholds, and established a trusted dead-drop with investigative journalist Rhea Solis and ally Nadia Park, the complete Project LANTERN audit dump mirrored straight to The Greyhaven Ledger’s air-gapped press server. By 06:00 AM, front-page headlines expose Vespera’s illegal municipal blacklisting matrix—and the fraudulent reactivation of your revoked ID e.ward_09.',
    epilogueZh:
      '当 Vespera 企业安全部切断你的光纤并在屏幕上打出“WE KNOW WHO YOU ARE.”时，他们的封锁小组已经晚了三十秒。由于你完整串联了 14 分钟日志黑箱时间线、将暴露值控制在安全阈值内，并与调查记者 Rhea Solis 及盟友 Nadia Park 建立了稳固信任，整套“灯塔计划”（Project LANTERN）底层审计库已通过自动死信开关同步至《灰港纪事报》的物理隔离服务器。清晨六点，头版头条引爆全城政治与企业危机，洗清了工号 e.ward_09 被栽赃的罪名。',
    characterFates: [
      {
        name: 'Eli Ward (e.ward_09)',
        status:
          'Underground in Port District with Daniel Cross; cleared by cryptographic timestamp proof.',
        statusZh: '在导师 Daniel Cross 协助下转入港区安全屋，时间戳铁证洗刷了替罪羊指控。',
      },
      {
        name: 'Nadia Park',
        status:
          'Entered protective custody with City Council oversight committee as key witness.',
        statusZh: '以关键污点证人身份进入市议会特别调查委员会保护程序。',
      },
      {
        name: 'Rhea Solis',
        status:
          'Published the Pulitzer-shortlisted "Project LANTERN" investigative series.',
        statusZh: '刊发《灰港纪事报》头版调查特稿，迫使市政厅冻结与 Vespera 的数据合约。',
      },
      {
        name: 'Marcus Hale',
        status:
          'Subpoenaed by federal regulators; mobilizing private contractors for retaliation.',
        statusZh: '遭到联邦监管机构传唤，正暗中调动私人安保力量准备反扑。',
      },
    ],
    chapterTwoHook:
      'CHAPTER II PREVIEW — "THE SUBPOENA WAR": With Vespera’s stock in freefall, Executive Enclave architects activate their off-grid backup cluster in Sector 09.',
    chapterTwoHookZh:
      '第二章伏笔 ——《传票战争》：Vespera 股价崩盘之际，高管飞地启动了位于九号扇区的离线备份集群，而你将作为技术证人直面核心幕后主使。',
  },
  ENDING_B_DIRTY_BARGAIN: {
    id: 'ENDING_B_DIRTY_BARGAIN',
    code: 'ENDING B',
    title: 'A DIRTY BARGAIN',
    titleZh: '暗影交易 · 灰色筹码',
    subtitle:
      'Truth Secured in Cold Storage, But Forced Into MOTH’s Underground Pact',
    subtitleZh: '你掌握了完整铁证却孤立无援，被迫接受神秘中间人 MOTH 的条件',
    epilogue:
      'Your screen goes black with the words "WE KNOW WHO YOU ARE." You hold the decrypted Project LANTERN ledger and proof that your revoked ID (e.ward_09) was framed—but without a verified media dead-drop or sufficient mutual trust with Nadia Park, publishing now would be crushed by Vespera’s legal and security apparatus. Seconds after the blackout, MOTH hijacks your handset’s baseband processor with a cold offer: an armored extraction route out of Apartment 4B in exchange for exclusive access to Vespera’s Executive Enclave keys.',
    epilogueZh:
      '屏幕在“WE KNOW WHO YOU ARE.”的警告中陷入黑暗。你手里握着“灯塔计划”的完整加密账本与 e.ward_09 被栽赃的铁证，但因为缺乏可靠的媒体发布通道或与 Nadia 的信任破裂，贸然公开只会被 Vespera 瞬间抹杀。断连数秒后，神秘中间人 MOTH 直接接管了你的手机基带，开出了一份冰冷的交易：用 Vespera 高管飞地的根密钥，换取你今夜安全撤离 4B 公寓的通道。',
    characterFates: [
      {
        name: 'Eli Ward (e.ward_09)',
        status:
          'Extracted via MOTH’s darknet relay network; holding the LANTERN vault as leverage.',
        statusZh: '经由 MOTH 的地下暗网通道撤离公寓，将“灯塔”账本作为保命筹码。',
      },
      {
        name: 'Nadia Park',
        status:
          'Vanished into transit hubs alone; distrustful of your next move.',
        statusZh: '独自消失在城际交通枢纽中，对你的立场充满戒备。',
      },
      {
        name: 'MOTH',
        status:
          'Gained leverage over your investigation; demands Enclave infiltration in Chapter 2.',
        statusZh: '掌握了你的把柄与撤离路线，要求你在第二章为其渗透高管飞地。',
      },
      {
        name: 'Marcus Hale',
        status:
          'Found Apartment 4B empty; classified you as a high-priority covert threat.',
        statusZh: '带队突袭 4B 公寓扑空，将你列为最高优先级地下威胁。',
      },
    ],
    chapterTwoHook:
      'CHAPTER II PREVIEW — "DEBT TO THE MOTH": To clear your name, you must first pay off MOTH’s price inside Vespera’s Port District data bunker.',
    chapterTwoHookZh:
      '第二章伏笔 ——《飞蛾之债》：为了洗清罪名，你必须先履行这笔危险的暗影交易，潜入港区数据地堡。',
  },
  ENDING_C_FALL_GUY: {
    id: 'ENDING_C_FALL_GUY',
    code: 'ENDING C',
    title: 'THE FALL GUY',
    titleZh: '替罪之羊 · 完美栽赃',
    subtitle:
      'High Exposure or Incomplete Forensics Allowed Vespera to Frame e.ward_09',
    subtitleZh: '过高的暴露风险或残缺的证据链，让你彻底沦为企业阴谋的替罪羊',
    epilogue:
      'As "WE KNOW WHO YOU ARE" burns into your monitor, heavy boots echo up the tenement stairwell outside Apartment 4B. Triggered by high cellular/network exposure or an uncorroborated forensic chain, Director Marcus Hale’s containment unit locks down your building before you can transmit a single verified packet. By morning commute, Greyhaven cable news broadcasts your old employee photo: former support engineer Eli Ward (e.ward_09) is officially indicted for the unauthorized October 29 data sabotage, while Project LANTERN continues operating in total secrecy.',
    epilogueZh:
      '当“WE KNOW WHO YOU ARE.”在屏幕上亮起时，4B 公寓门外的老旧楼梯间已响起密集的战术靴声。由于行动暴露度/企业怀疑值过高或未能建立完整的取证时间线，安全总监 Marcus Hale 的封锁小队在你发出任何有效证据前彻底接管了现场。次日早高峰，灰港市各大新闻频道循环播放着你的旧工牌照片：前支持工程师 Eli Ward（e.ward_09）被正式指控为数据破坏案的唯一黑客，而“灯塔计划”依旧在阴影中主宰着整座城市。',
    characterFates: [
      {
        name: 'Eli Ward (e.ward_09)',
        status:
          'Detained under corporate-espionage indictment; awaiting arraignment in Greyhaven Metro Detention.',
        statusZh: '因企业间谍与数据破坏指控被捕，关押于灰港市看守所等待提审。',
      },
      {
        name: 'Nadia Park',
        status:
          'Intercepted at 4th Ave transit station after Vespera traced your trail.',
        statusZh: '在第四大道轻轨站被 Vespera 安全部门截获并强制签署封口令。',
      },
      {
        name: 'Rhea Solis',
        status:
          'Left without cryptographic proof; her story spiked by legal injunction.',
        statusZh: '因缺乏密码学铁证，其调查报道被法院禁令强行压下。',
      },
      {
        name: 'Marcus Hale',
        status:
          'Commended by Vespera’s board for swift containment of the "Ward Incident."',
        statusZh: '因迅速平息“沃德泄密事件”获得 Vespera 董事会嘉奖。',
      },
    ],
    chapterTwoHook:
      'CHAPTER II PREVIEW — "PRISONER TRANSFER": On route to federal court, an unknown hacker overrides the transport van’s municipal traffic grid.',
    chapterTwoHookZh:
      '第二章伏笔 ——《囚车劫持》：在押送联邦法院途中，整条街区的市政交通信号灯突然被未知黑客接管。',
  },
};

export const INITIAL_HOTSPOTS: Record<SceneId, SceneHotspot[]> = {
  APARTMENT_NIGHT: [
    {
      id: 'hs_phone',
      label: 'Vibrating Smartphone',
      labelZh: '震动中的智能手机',
      x: 47,
      y: 59,
      detailText:
        '02:17 AM. One interrupted voicemail from Nadia Park and an anonymous SMS from an unindexed Port District relay: "Don\'t call her. You\'re being watched."',
      detailTextZh:
        '凌晨 02:17。来自前同事 Nadia Park 的一段被强行掐断的语音留言，以及一条匿名警告短信：“别回拨给她。你正被监视。”',
      inspected: false,
      triggersOverlay: 'PHONE',
    },
    {
      id: 'hs_workstation',
      label: 'Linux Workstation (GreyOS)',
      labelZh: '个人工作站电脑',
      x: 62,
      y: 43,
      detailText:
        'Your dual-monitor GreyOS box. Nadia pushed an encrypted archive (incident_0427.zip) to /home/eli/Downloads ten minutes before her line went dead.',
      detailTextZh:
        '运行 GreyOS 的本地 Linux 台式机。Nadia 在失联前将加密归档包 incident_0427.zip 传到了 /home/eli/Downloads 目录。',
      inspected: false,
      triggersOverlay: 'COMPUTER',
    },
    {
      id: 'hs_window',
      label: 'Rain-Streaked Window',
      labelZh: '窗外雨夜街景',
      x: 18,
      y: 34,
      detailText:
        'Sodium streetlamps bleed across wet asphalt on 4th Avenue. Six blocks north, the Vespera Data Solutions tower rises into the low cloud ceiling.',
      detailTextZh:
        '第四大道湿冷的柏油路面映着钠灯残影。六个街区外，Vespera 数据方案公司总部大楼隐没在雨雾深处。',
      inspected: false,
    },
    {
      id: 'hs_badge',
      label: 'Revoked Vespera ID Badge',
      labelZh: '已注销的旧员工工牌',
      x: 30,
      y: 69,
      detailText:
        'ELI WARD — SYSTEMS SUPPORT ENGINEER — ID: e.ward_09. Deactivated eight months ago after you flagged an undocumented municipal telemetry bridge.',
      detailTextZh:
        '伊莱·沃德 — 系统支持工程师 — 工号：e.ward_09。八个月前因你在内部举报未授权的市政遥测接口而被强制解雇并注销权限。',
      inspected: false,
      unlocksItemId: 'item_badge',
    },
    {
      id: 'hs_bills',
      label: 'Unopened Final Notices',
      labelZh: '未拆封的催缴账单',
      x: 58,
      y: 72,
      detailText:
        'Rent arrears ($1,420) and Greyhaven Grid electric notice. Every background check for full-time IT work in the city has silently bounced for eight months.',
      detailTextZh:
        '房租逾期与电网催缴通知单。过去八个月里，你在本市投递的所有全职 IT 岗位背调都莫名其妙地被自动驳回。',
      inspected: false,
    },
    {
      id: 'hs_workbench',
      label: 'Hardware Repair Bench',
      labelZh: '电子维修工作台',
      x: 28,
      y: 52,
      detailText:
        'A soldering station, logic analyzer, and a hardware write-blocked USB drive you use for freelance data recovery.',
      detailTextZh:
        '恒温烙铁、逻辑分析仪，以及一枚带有硬件写保护开关的取证 U 盘。',
      inspected: false,
      unlocksItemId: 'item_usb',
    },
    {
      id: 'hs_door_exit',
      label: 'Apartment Door (To 4th Ave)',
      labelZh: '公寓大门（前往第四大道）',
      x: 87,
      y: 52,
      detailText:
        'Step out into the 02:40 AM rain toward the 24-Hour Coin Laundry on 4th Avenue. Requires completing your phone response, inspecting at least 2 forensic files, and correlating the timeline first.',
      detailTextZh:
        '推门步入凌晨两点的冷雨，前往第四大道的 24 小时自助洗衣店与 Nadia 碰面（需先完成手机决策、调查至少 2 份取证文件并完成时间线关联）。',
      inspected: false,
      triggersScene: 'STREET_NIGHT',
    },
  ],
  STREET_NIGHT: [
    {
      id: 'hs_rhea',
      label: 'Rhea Solis (Journalist)',
      labelZh: '调查记者 Rhea Solis',
      x: 34,
      y: 62,
      detailText:
        'Investigative reporter for The Greyhaven Ledger standing beneath the bodega awning with a paper cup of black coffee.',
      detailTextZh:
        '《灰港纪事报》独立调查记者，正站在街角便利店遮雨棚下警惕地注视着街对面的巡逻车。',
      inspected: false,
      triggersOverlay: 'DIALOGUE',
      triggersCharacterId: 'rhea',
    },
    {
      id: 'hs_camera',
      label: 'Municipal Optical Pole #04',
      labelZh: '市政光学监控杆 #04',
      x: 52,
      y: 26,
      detailText:
        'A Vespera-contracted civic camera dome. Its infrared ring pulses every 3 seconds, uploading gait and license plate hashes to the central municipal cloud.',
      detailTextZh:
        '由 Vespera 承建的市政视觉监控球机。红外灯环每三秒闪烁一次，将行人步态与车牌哈希实时回传至云端。',
      inspected: false,
    },
    {
      id: 'hs_enter_laundromat',
      label: 'Enter 24-Hour Coin Laundry',
      labelZh: '进入 24 小时自助洗衣店',
      x: 76,
      y: 48,
      detailText:
        'Warm fluorescent light spills across the wet sidewalk. Nadia Park is waiting inside near the back row of dryers.',
      detailTextZh:
        '惨白的日光灯透过起雾的玻璃窗洒在湿漉漉的人行道上。Nadia 正站在最里侧的烘干机旁。',
      inspected: false,
      triggersScene: 'LAUNDROMAT',
    },
    {
      id: 'hs_back_apt',
      label: 'Return to Apartment 4B',
      labelZh: '返回 4B 公寓',
      x: 15,
      y: 55,
      detailText: 'Head back upstairs to your apartment.',
      detailTextZh: '转身沿楼梯返回你的 4B 公寓。',
      inspected: false,
      triggersScene: 'APARTMENT_NIGHT',
    },
  ],
  LAUNDROMAT: [
    {
      id: 'hs_nadia',
      label: 'Nadia Park (Dryer #04)',
      labelZh: '前同事 Nadia Park',
      x: 57,
      y: 51,
      detailText:
        'Senior Data Risk Analyst at Vespera. Her hands tremble as she clutches a micro-USB hardware key inside her raincoat pocket.',
      detailTextZh:
        'Vespera 高级数据风险分析师。她神色紧绷，手指在雨衣口袋里死死攥着一枚微型加密密钥。',
      inspected: false,
      triggersOverlay: 'DIALOGUE',
      triggersCharacterId: 'nadia',
    },
    {
      id: 'hs_dryer_drum',
      label: 'Industrial Dryer #04',
      labelZh: '四号工业烘干机',
      x: 38,
      y: 52,
      detailText:
        'Spinning at 60 RPM. The low mechanical rumble scrambles directional microphones from the street outside.',
      detailTextZh:
        '滚筒发出的低频机械轰鸣恰好能干扰门外街道上的定向拾音器。',
      inspected: false,
    },
    {
      id: 'hs_laundromat_exit',
      label: 'Slip Out Back Alley (Return to Apt 4B)',
      labelZh: '从后巷返回公寓（03:12 AM）',
      x: 84,
      y: 58,
      detailText:
        'Head back to your apartment with the archive key before Vespera Corporate Security sweeps the block. Requires completing your conversation with Nadia and obtaining moth_archive.key.',
      detailTextZh:
        '带着密钥从后巷撤离，赶在企业安全部封锁街区前返回公寓（需先完成与 Nadia 的三段对话并获取 moth_archive.key）。',
      inspected: false,
      triggersScene: 'APARTMENT_RETURN',
    },
  ],
  APARTMENT_RETURN: [
    {
      id: 'hs_return_pc',
      label: 'Awake Workstation (/home/eli/archive_vault)',
      labelZh: '被异常唤醒的终端（核查归档库）',
      x: 58,
      y: 46,
      detailText:
        'Your monitor was left in sleep mode when you walked out, yet a live root shell is open to /home/eli/archive_vault/lantern_auth_audit.db.',
      detailTextZh:
        '你出门前明明让电脑处于休眠状态，此刻屏幕却幽幽发亮，终端正停留在 /home/eli/archive_vault 目录。',
      inspected: false,
      triggersOverlay: 'COMPUTER',
    },
    {
      id: 'hs_return_phone',
      label: 'Smartphone (New Message from MOTH)',
      labelZh: '手机（来自 MOTH 的新信息）',
      x: 42,
      y: 64,
      detailText:
        'One new encrypted message from MOTH: "Check the archive. Nadia didn\'t tell you whose credentials signed the purge."',
      detailTextZh:
        '收到一条来自神秘人 MOTH 的新消息：“去查归档库。Nadia 没敢告诉你究竟是谁的工号签署了清洗指令。”',
      inspected: false,
      triggersOverlay: 'PHONE',
    },
    {
      id: 'hs_return_door',
      label: 'Deadbolted Entry Door',
      labelZh: '反锁的公寓门锁',
      x: 86,
      y: 50,
      detailText:
        'No physical forced entry on the deadbolt. Whoever woke your machine came through an upstream fiber maintenance tunnel.',
      detailTextZh:
        '门锁完好无损。唤醒你电脑的人并非破门而入，而是通过上游光纤维护隧道直接穿透了内网。',
      inspected: false,
    },
  ],
};

export const INITIAL_EVIDENCE: EvidenceArtifact[] = [
  {
    id: 'EV-01',
    title: 'NTP Daemon Clock Skew (-840s)',
    titleZh: 'NTP 时间守护进程人为回拨（-840 秒）',
    chronologicalOrder: 1,
    eventTimestamp: '01:41:58 AM (Real RTC)',
    source: '/home/eli/Downloads/incident_0427/ntp_override.conf',
    summary:
      'System time on Vespera Core Gateway was manually shifted backward by 14 minutes (-840s) two seconds before the intrusion began.',
    forensicNarrative:
      'Step 1 (01:41:58 AM): Attacker injected a -840s clock offset in ntp_override.conf so subsequent unauthorized actions would appear to occur prior to the maintenance freeze.',
    discovered: false,
    correlated: false,
  },
  {
    id: 'EV-02',
    title: '14-Minute Access Log Truncation',
    titleZh: '14 分钟核心网关日志被强行抹除',
    chronologicalOrder: 2,
    eventTimestamp: '01:42:00 AM – 01:56:00 AM',
    source: '/home/eli/Downloads/incident_0427/access_0427.log',
    summary:
      '788 lines of audit records between 01:42:00 and 01:56:00 were overwritten with null bytes, leaving an inode size mismatch of 142 KB.',
    forensicNarrative:
      'Step 2 (01:42:00 AM): During the 14-minute blind spot created by the clock rollback, /usr/bin/shred wiped 788 audit entries from access_0427.log.',
    discovered: false,
    correlated: false,
  },
  {
    id: 'EV-03',
    title: 'Shadow Account Privilege Escalation',
    titleZh: '幽灵维护账户越权提权导出',
    chronologicalOrder: 3,
    eventTimestamp: '01:47:19 AM',
    source: '/home/eli/Downloads/incident_0427/auth_shadow.dump',
    summary:
      'Unindexed service token svc_lantern_sync bypassed MFA from internal VLAN 10.88.14.9 and exfiltrated 14.2 GB of encrypted civic records.',
    forensicNarrative:
      'Step 3 (01:47:19 AM): Inside the wiped window, shadow token svc_lantern_sync escalated to UID 0 and merged 14.2 GB of Greyhaven citizen dossiers.',
    discovered: false,
    correlated: false,
  },
  {
    id: 'EV-04',
    title: 'Project LANTERN Civic Profiling Schema',
    titleZh: '“灯塔计划”（Project LANTERN）市民社会风险画像架构',
    chronologicalOrder: 4,
    eventTimestamp: '01:51:04 AM',
    source: '/home/eli/Downloads/incident_0427/lantern_schema_brief.txt',
    summary:
      'Reveals Vespera is secretly combining hospital claims, eviction filings, union lists, and utility telemetry into an automated citywide blacklist.',
    forensicNarrative:
      'Step 4 (01:51:04 AM): Schema manifest confirms the exfiltrated dataset belongs to Project LANTERN—an illegal algorithmic blacklisting engine.',
    discovered: false,
    correlated: false,
  },
  {
    id: 'EV-05',
    title: 'Nadia Park’s Omitted Schema Signature',
    titleZh: 'Nadia Park 被隐瞒的早期模型签署记录',
    chronologicalOrder: 5,
    eventTimestamp: '01:54:12 AM',
    source: 'Laundromat Interrogation & Archive Ledger #8821',
    summary:
      'Nadia Park was not merely a bystander—her analyst key (n.park_04) co-signed the Tier-2 correlation rules before she realized its true target.',
    forensicNarrative:
      'Step 5 (01:54:12 AM): Cross-checking Nadia’s testimony against Ledger #8821 shows she helped build LANTERN’s risk weights before panicking.',
    discovered: false,
    correlated: false,
  },
  {
    id: 'EV-06',
    title: 'Revoked ID e.ward_09 Used for Final Purge',
    titleZh: '已注销工号 e.ward_09（Eli Ward）被重新激活并签署清洗指令',
    chronologicalOrder: 6,
    eventTimestamp: '01:55:52 AM (48h Ago)',
    source: '/home/eli/archive_vault/lantern_auth_audit.db',
    summary:
      'Cryptographic audit trail proves Eli Ward’s own revoked employee account (e.ward_09) was re-enabled via root keyring to authorize the cover-up.',
    forensicNarrative:
      'Step 6 (01:55:52 AM): The perpetrator framed Eli Ward by re-activating his terminated employee ID (e.ward_09) to sign the final log purge.',
    discovered: false,
    correlated: false,
  },
];

export const INITIAL_FILES: VirtualFileEntry[] = [
  {
    name: 'ntp_override.conf',
    path: '/home/eli/Downloads/incident_0427/ntp_override.conf',
    parentDir: '/home/eli/Downloads/incident_0427',
    size: '2.4 KB',
    modifiedAt: '01:41:58 AM',
    unlocked: true,
    unlocksEvidenceId: 'EV-01',
    content: `# VESPERA CORE GATEWAY — NTP OVERRIDE CONFIGURATION
ntpd_daemon_sync = disabled
manual_clock_offset_seconds = -840
# FORENSIC WARNING [EV-01]:
# Hardware RTC timestamp: 01:41:58 AM
# Kernel wall-clock rolled backward by 14 minutes (-840s) prior to batch execution.`,
  },
  {
    name: 'access_0427.log',
    path: '/home/eli/Downloads/incident_0427/access_0427.log',
    parentDir: '/home/eli/Downloads/incident_0427',
    size: '18.6 KB',
    modifiedAt: '01:56:03 AM',
    unlocked: true,
    unlocksEvidenceId: 'EV-02',
    content: `2028-04-27 01:41:59 [INFO] edge-gw-02: TLS handshake verified (vlan-14)
2028-04-27 01:42:00 [WARN] audit-ctl: Journal buffer lock engaged
[0x00000000 ... 788 AUDIT RECORDS WIPED (14 MINUTE GAP: 01:42:00 - 01:56:00) ... 0x00000000]
# INODE ANOMALY [EV-02]:
# File truncated by 142,880 bytes via /usr/bin/shred; modification counter tampered.
2028-04-27 01:56:01 [INFO] edge-gw-02: Normal telemetry stream resumed`,
  },
  {
    name: 'auth_shadow.dump',
    path: '/home/eli/Downloads/incident_0427/auth_shadow.dump',
    parentDir: '/home/eli/Downloads/incident_0427',
    size: '4.8 KB',
    modifiedAt: '01:47:19 AM',
    unlocked: true,
    unlocksEvidenceId: 'EV-03',
    content: `SESSION_ID=0x9F4A2C
ACCOUNT=svc_lantern_sync (UNINDEXED SHADOW SERVICE TOKEN)
ORIGIN_SUBNET=10.88.14.9 (Vespera Executive Enclave VLAN)
MFA_STATUS=BYPASSED_ROOT_KEYRING
PRIVILEGE_ESCALATION=uid=0(root) gid=0(root)
PAYLOAD_EXFIL=14.2 GB -> /vault/lantern_civic_master.enc
# FORENSIC ARTIFACT [EV-03]: Shadow account escalated to root during the 14-minute blackout.`,
  },
  {
    name: 'lantern_schema_brief.txt',
    path: '/home/eli/Downloads/incident_0427/lantern_schema_brief.txt',
    parentDir: '/home/eli/Downloads/incident_0427',
    size: '3.1 KB',
    modifiedAt: '01:51:04 AM',
    unlocked: true,
    unlocksEvidenceId: 'EV-04',
    content: `CONFIDENTIAL — VESPERA DATA SOLUTIONS // PROJECT LANTERN
Scope: Automated Greyhaven Municipal Behavioral & Tenancy Risk Index
Ingested Feeds:
  1. Municipal Housing Court & Eviction Records
  2. Regional Hospital & Psychiatric Prescription Claims
  3. Labor Union & Whistleblower Watchlists (Tier-Red Auto-Block)
  4. Cellular Tower & Smart-Meter Nighttime Activity
# FORENSIC ARTIFACT [EV-04]: Explains why your job applications have bounced for 8 months.`,
  },
  {
    name: 'eli_october_budget.txt',
    path: '/home/eli/Documents/eli_october_budget.txt',
    parentDir: '/home/eli/Documents',
    size: '0.8 KB',
    modifiedAt: 'Yesterday',
    unlocked: true,
    content: `ELI WARD — OCTOBER SURVIVAL LEDGER
Checking Balance : $184.00
Rent Arrears     : -$1,420.00 (Final Notice on desk)
Utilities        : -$165.00
Note: Every full-time sysadmin application in Greyhaven gets rejected within 30 seconds by automated HR screening.`,
  },
  {
    name: 'lantern_auth_audit.db',
    path: '/home/eli/archive_vault/lantern_auth_audit.db',
    parentDir: '/home/eli/archive_vault',
    size: '12.4 KB',
    modifiedAt: '01:55:52 AM',
    unlocked: false,
    requiresKeyId: 'item_moth_usb',
    requiresScene: 'APARTMENT_RETURN',
    unlocksEvidenceId: 'EV-06',
    content: `=== VESPERA CRYPTOGRAPHIC AUDIT VAULT (DECRYPTED VIA moth_archive.key) ===

ENTRY #8821 — CORRELATION WEIGHTS SIGN-OFF:
  Principal: n.park_04 (Nadia Park — Senior Risk Analyst)
  Status: APPROVED [EV-05]

ENTRY #9904 — EMERGENCY LOG PURGE & ARCHIVE SEAL (48 HOURS AGO — 01:55:52 AM):
  Principal: e.ward_09 (Eli Ward — Systems Support Engineer)
  Employment Status: TERMINATED 8 MONTHS AGO
  Keyring Override: RE-ACTIVATED BY EXECUTIVE ENCLAVE ROOT
  Action: Authorized deletion of 788 gateway logs & sealed Project LANTERN transfer.

[CRITICAL TWIST — EV-06]:
Your own revoked employee ID (e.ward_09) was re-activated 48 hours ago to frame you as the operator of the purge!`,
  },
];

export const INITIAL_EMAILS: MailMessage[] = [
  {
    id: 'mail_1',
    sender: 'Vespera Legal Compliance <legal@vespera-data.com>',
    subject: 'Post-Termination NDA Reminder — Case #EW-09',
    subjectZh: '离职保密协议（NDA）法律合规提醒',
    timestamp: 'Oct 18, 2028',
    body: `Dear Mr. Ward,
This notice serves as a formal reminder that your termination from Vespera Data Solutions on February 19, 2028 remains subject to Section 9 (Non-Disclosure of Internal Telemetry & Risk Models).
Any contact with current Vespera analysts will be referred to Director of Corporate Security Marcus Hale.`,
  },
  {
    id: 'mail_2',
    sender: 'Rhea Solis <r.solis@greyhavenledger.org>',
    subject: 'Automated Blacklisting Across Greyhaven — Need Your Eyes',
    subjectZh: '灰港市自动化背调黑名单调查——需要你的技术协助',
    timestamp: 'Oct 29, 2028',
    body: `Eli,
Three more whistleblowers in South Greyhaven had their apartment leases and employment offers revoked simultaneously this week by the same risk-scoring API.
I know Vespera fired you when you asked about their municipal data bridge. I'm usually outside the 4th Ave bodega around 2:30 AM after print deadline. Talk to me when you're ready.
— Rhea`,
  },
  {
    id: 'mail_3',
    sender: 'Daniel Cross <dcross@null-sector.io>',
    subject: 'Forensic Timeline Verification Script Installed',
    subjectZh: '已为你配置日志时间线取证校验脚本',
    timestamp: 'Oct 30, 2028',
    body: `Hey Eli,
Heard you were investigating NTP clock rollbacks on Linux gateways. I added the 'verify' and 'timeline' correlation commands to your GreyOS shell.
Once you inspect at least two forensic files with 'cat <file>', run 'verify' in the terminal or click 'Correlate Evidence' in the Timeline tab to reconstruct the exact chronology.`,
  },
];

export const INITIAL_PHONE_MESSAGES: PhoneMessage[] = [
  {
    id: 'msg_nadia_voicemail',
    sender: 'Nadia Park',
    senderRole: 'Vespera Risk Analyst · Voicemail',
    timestamp: '02:14 AM',
    type: 'VOICEMAIL',
    body: '"Eli... I don\'t know who I can trust anymore. Remember the incident last year? It wasn\'t a system failure. They changed the logs. Someone is cleaning everything. I found something. We need to talk—meet me at the 24-hour laundromat on 4th—" [CALL ABRUPTLY TERMINATED]',
    bodyZh:
      '“Eli……我不知道还能相信谁。还记得去年的那起事故吗？那根本不是系统故障。他们篡改了日志，有人正在抹除一切痕迹。我发现了关键证据，我们必须谈谈——来第四大道的 24 小时自助洗衣店见——”【通话被强行掐断】',
    isUnread: true,
    unlocked: true,
  },
  {
    id: 'msg_unknown_warning',
    sender: 'UNKNOWN SENDER (Blocked ID)',
    senderRole: 'Disposable SIP Relay',
    timestamp: '02:16 AM',
    type: 'SMS',
    body: '"Don\'t call her. You\'re being watched."',
    bodyZh: '“别打给她。你正被监视。”',
    isUnread: true,
    unlocked: true,
  },
  {
    id: 'msg_moth_archive',
    sender: 'MOTH',
    senderRole: 'Encrypted Zero-Trace Channel',
    timestamp: '03:11 AM',
    type: 'SMS',
    body: '"Check the archive (/home/eli/archive_vault/lantern_auth_audit.db). Nadia didn\'t tell you whose employee ID signed the purge 48 hours ago."',
    bodyZh:
      '“去查你电脑上的归档库（/home/eli/archive_vault/lantern_auth_audit.db）。Nadia 没告诉你 48 小时前究竟是谁的工号签署了清洗指令。”',
    isUnread: true,
    unlocked: false,
  },
];

export const INITIAL_CHARACTERS: CharacterProfile[] = [
  {
    id: 'nadia',
    name: 'Nadia Park',
    role: 'Senior Data Risk Analyst at Vespera',
    roleZh: 'Vespera 高级数据风险分析师',
    location: '24-Hour Coin Laundry (4th Ave)',
    stance: 'Guarded Whistleblower',
    trust: 55,
    bio: 'Your former colleague at Vespera Data Solutions. She sent you incident_0427.zip before fleeing her apartment, but she is hiding her own early involvement in Project LANTERN.',
    currentNodeId: 'nadia_node_1',
    nodes: [
      {
        id: 'nadia_node_1',
        speaker: 'Nadia Park',
        body: 'Eli, thank god you came. Keep your voice down—the dryer hum masks us from the street. Did you inspect incident_0427.zip on your workstation? That 14-minute gap wasn’t a crash. It’s a cover-up for an internal program called Project LANTERN.',
        bodyZh:
          'Eli，谢天谢地你来了。压低声音——烘干机的噪音能帮我们掩盖谈话。你在工作站上核查 incident_0427.zip 了吗？那 14 分钟的空白根本不是死机，而是为了掩盖一个内部代号为“灯塔计划”（Project LANTERN）的系统。',
        choices: [
          {
            id: 'nadia_c1_share',
            label:
              '“I found the -840s NTP clock rollback and the shadow root escalation. Tell me what LANTERN really is.”',
            labelZh:
              '“我查到了 -840 秒的时钟回拨和幽灵账户提权。告诉我‘灯塔计划’到底是什么。”',
            nextNodeId: 'nadia_node_2',
            trustDelta: 10,
            unlocksEvidenceId: 'EV-04',
          },
          {
            id: 'nadia_c1_question',
            label:
              '“You’ve been in Risk Analytics all year, Nadia. Why did you wait until tonight to leak these logs?”',
            labelZh:
              '“你在风险分析部待了一整年，Nadia。为什么偏偏等到今晚才把这些日志发给我？”',
            nextNodeId: 'nadia_node_2',
            trustDelta: -10,
            suspicionDelta: 5,
            unlocksEvidenceId: 'EV-05',
          },
        ],
      },
      {
        id: 'nadia_node_2',
        speaker: 'Nadia Park',
        body: 'Vespera told us we were building an enterprise fraud model. Instead, they linked housing court records, hospital claims, labor union lists, and cellular tracking into a silent citywide score. One flag in LANTERN and you can’t rent an apartment or pass a job screening in Greyhaven—just like what happened to you.',
        bodyZh:
          'Vespera 骗我们说那只是企业反欺诈模型。可实际上，他们把租房法庭记录、医院处方、工会名单和基站轨迹全部并入了一套全城静默评分系统。只要被“灯塔”标记，你在灰港市就租不到房、通不过任何背调——就像过去八个月发生在你身上的一样。',
        choices: [
          {
            id: 'nadia_c2_expose',
            label:
              '[Trust Nadia] “We’ll decrypt the master audit ledger and expose Vespera together.”',
            labelZh: '【信任她】“我们会一起解密核心审计账本，把 Vespera 彻底曝光。”',
            nextNodeId: 'nadia_node_3',
            trustDelta: 15,
          },
          {
            id: 'nadia_c2_press',
            label:
              '[Press Her] “Your own analyst ID is on the early LANTERN schema, isn’t it?”',
            labelZh:
              '【质问她】“你自己的分析师工号也签在早期的‘灯塔’架构上，对吧？”',
            nextNodeId: 'nadia_node_3',
            trustDelta: -15,
            unlocksEvidenceId: 'EV-05',
          },
          {
            id: 'nadia_c2_withhold',
            label:
              '[Keep Distance] “Just give me the decryption key. I work alone from here.”',
            labelZh: '【保留底牌】“把解密密钥给我，接下来的事我独自处理。”',
            nextNodeId: 'nadia_node_3',
            trustDelta: -10,
          },
        ],
      },
      {
        id: 'nadia_node_3',
        speaker: 'Nadia Park',
        body: 'Take this micro-USB key (moth_archive.key). I mirrored the encrypted auth ledger to /home/eli/archive_vault on your computer before my line was cut. Wait—black sedan outside. That’s Marcus Hale’s security detail. Go back to your apartment and check the archive now!',
        bodyZh:
          '拿着这枚微型密钥（moth_archive.key）。断线前我把加密授权账本镜像到了你电脑的 /home/eli/archive_vault 目录。等等——街对面停了辆黑色轿车，是安全总监 Marcus Hale 的人。快回你的公寓核查归档库！',
        choices: [
          {
            id: 'nadia_c3_accept',
            label:
              'Take moth_archive.key and slip out the back alley toward Apartment 4B.',
            labelZh: '收下 moth_archive.key，立即从后巷赶回 4B 公寓。',
            trustDelta: 5,
            unlocksEvidenceId: 'EV-05',
          },
        ],
      },
    ],
  },
  {
    id: 'moth',
    name: 'MOTH',
    role: 'Anonymous Network Broker',
    roleZh: '神秘网络中间人',
    location: 'Encrypted Port District Relay',
    stance: 'Calculating Observer',
    trust: 35,
    bio: 'An unknown operator monitoring both Vespera’s internal fiber trunks and your apartment building. Warned you not to call Nadia and directed you to the audit vault.',
    currentNodeId: 'moth_node_1',
    nodes: [
      {
        id: 'moth_node_1',
        speaker: 'MOTH',
        body: 'Nadia Park gave you the key, but she left out the punchline. Run `cat /home/eli/archive_vault/lantern_auth_audit.db` on your terminal, Eli.',
        bodyZh:
          'Nadia 把密钥给了你，却隐瞒了最致命的真相。在你的终端运行 `cat /home/eli/archive_vault/lantern_auth_audit.db` 吧，Eli。',
        choices: [
          {
            id: 'moth_c1_close',
            label: 'Close encrypted relay and inspect the workstation.',
            labelZh: '关闭加密通道，立即核查工作站。',
          },
        ],
      },
    ],
  },
  {
    id: 'rhea',
    name: 'Rhea Solis',
    role: 'Investigative Journalist — The Greyhaven Ledger',
    roleZh: '《灰港纪事报》独立调查记者',
    location: '4th Avenue Bodega Awning',
    stance: 'Potential Media Ally',
    trust: 65,
    bio: 'Independent journalist investigating algorithmic blacklisting and sudden tenant evictions across Greyhaven.',
    currentNodeId: 'rhea_node_1',
    nodes: [
      {
        id: 'rhea_node_1',
        speaker: 'Rhea Solis',
        body: 'Eli? Out in the rain at 02:40 AM? Something broke inside Vespera tonight—my police scanner picked up private security sweeps along 4th Avenue.',
        bodyZh:
          'Eli？凌晨两点四十冒雨出来？今晚 Vespera 内部肯定出大事了——我的扫描仪监听到他们的私人安保车队正在第四大道巡逻。',
        choices: [
          {
            id: 'rhea_c1_share',
            label:
              '“I have forensic logs from a covert system called Project LANTERN. Open an encrypted dead-drop—if I go dark, publish everything.”',
            labelZh:
              '“我手里有‘灯塔计划’（Project LANTERN）的底层取证日志。开启加密死信通道——如果我失联，立即全城发稿。”',
            trustDelta: 20,
            exposureDelta: 5,
          },
          {
            id: 'rhea_c1_cautious',
            label:
              '“Just grabbing air, Rhea. Keep your head down tonight—I can’t share anything yet.”',
            labelZh: '“只是出来透透气，Rhea。今晚千万小心，我现在还不能透露任何事。”',
            trustDelta: -5,
          },
        ],
      },
    ],
  },
  {
    id: 'marcus',
    name: 'Marcus Hale',
    role: 'Director of Corporate Security — Vespera',
    roleZh: 'Vespera 企业安全部总监',
    location: 'Vespera Tower — 42nd Floor',
    stance: 'Primary Antagonist',
    trust: 10,
    bio: 'Former federal cyber-counterintelligence supervisor who now runs Vespera’s internal containment teams. Calm, methodical, and convinced algorithmic order is necessary.',
    currentNodeId: 'marcus_node_1',
    nodes: [
      {
        id: 'marcus_node_1',
        speaker: 'Marcus Hale',
        body: 'Every city requires an immune system, Mr. Ward.',
        bodyZh: '每一座现代城市都需要一套免疫系统，沃德先生。',
        choices: [
          {
            id: 'marcus_c1',
            label: 'Disconnect.',
            labelZh: '挂断。',
          },
        ],
      },
    ],
  },
  {
    id: 'daniel',
    name: 'Daniel Cross',
    role: 'Underground Linux & Forensics Mentor',
    roleZh: '地下硬件与取证专家（前技术导师）',
    location: 'Port District Repair Co-op',
    stance: 'Trusted Friend',
    trust: 80,
    bio: 'Veteran kernel developer who helped you set up your GreyOS workstation and wrote the `verify` timeline correlation script.',
    currentNodeId: 'daniel_node_1',
    nodes: [
      {
        id: 'daniel_node_1',
        speaker: 'Daniel Cross',
        body: 'Use `cat` on the files in `/home/eli/Downloads/incident_0427` and run `verify` to link the timeline.',
        bodyZh: '对 `/home/eli/Downloads/incident_0427` 下的文件运行 `cat`，然后用 `verify` 串联时间线。',
        choices: [
          {
            id: 'daniel_c1',
            label: 'Close.',
            labelZh: '关闭。',
          },
        ],
      },
    ],
  },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'item_phone',
    name: 'GrapheneOS Handset',
    nameZh: '改装加密智能手机',
    description: 'Hardened Android handset with SS7 header logging and cellular kill-switch.',
    acquired: true,
  },
  {
    id: 'item_badge',
    name: 'Revoked Vespera ID (e.ward_09)',
    nameZh: '已注销的旧员工证 (e.ward_09)',
    description: 'Former Vespera Systems Support badge deactivated 8 months ago.',
    acquired: false,
  },
  {
    id: 'item_usb',
    name: 'Write-Blocked Forensic USB',
    nameZh: '硬件写保护取证 U 盘',
    description: 'Used to mount suspect log archives without altering ext4 access timestamps.',
    acquired: false,
  },
  {
    id: 'item_moth_usb',
    name: 'Archive Decryption Key (moth_archive.key)',
    nameZh: '归档库解密密钥 (moth_archive.key)',
    description: 'Handed over by Nadia Park at the 24-Hour Coin Laundry to unlock /home/eli/archive_vault.',
    acquired: false,
  },
];

export function createInitialDeadAirState(
  initialShellState: GameShellState = 'title'
): DeadAirState {
  return {
    saveVersion: CURRENT_SAVE_VERSION,
    shellState: initialShellState,
    currentScene: 'APARTMENT_NIGHT',
    unlockedScenes: ['APARTMENT_NIGHT'],
    activeOverlay: 'NONE',
    activeComputerApp: 'FILES',
    activeDialogueCharacterId: 'nadia',
    selectedHotspotId: null,
    clockTime: '02:17 AM',
    monologueBanner:
      'Greyhaven, 02:17 AM. Rain lashes the glass outside Apartment 4B. Your smartphone is vibrating on the desk beside your Linux workstation.',
    lastFeedbackBanner: null,
    soundEnabled: true,
    debugMode: false,
    completedEvents: [],
    inspectedFiles: [],
    endingId: null,
    flags: {
      voicemail_played: false,
      first_choice: null,
      first_choice_locked: false,
      archive_inspected: false,
      timeline_correlated: false,
      laundromat_meeting_done: false,
      trust_nadia: 55,
      contacted_moth: false,
      evidence_count: 0,
      discovered_lantern: false,
      corporate_suspicion: 15,
      journalist_contact: false,
      rhea_allied: false,
      player_exposure: 10,
      discovered_eli_account_reuse: false,
      soc_warning_triggered: false,
      camera_tracked: false,
      current_objective:
        'Step 1: Open your vibrating smartphone [P] and make your first response choice.',
    },
    hotspots: JSON.parse(JSON.stringify(INITIAL_HOTSPOTS)),
    evidence: JSON.parse(JSON.stringify(INITIAL_EVIDENCE)),
    files: JSON.parse(JSON.stringify(INITIAL_FILES)),
    emails: JSON.parse(JSON.stringify(INITIAL_EMAILS)),
    phoneMessages: JSON.parse(JSON.stringify(INITIAL_PHONE_MESSAGES)),
    characters: JSON.parse(JSON.stringify(INITIAL_CHARACTERS)),
    inventory: JSON.parse(JSON.stringify(INITIAL_INVENTORY)),
    currentDir: '/home/eli/Downloads/incident_0427',
    terminalHistory: [
      {
        id: 'init-1',
        text: 'GreyOS 6.4 LTS (tty1) — Host: apt4b-workstation // User: eli (legacy ID: e.ward_09)',
        tone: 'system',
      },
      {
        id: 'init-2',
        text: 'Archive mounted: /home/eli/Downloads/incident_0427 (from Nadia Park — incident_0427.zip)',
        tone: 'highlight',
      },
      {
        id: 'init-3',
        text: "Type 'help' or click any Quick Shell command above to inspect logs and correlate the forensic timeline.",
        tone: 'output',
      },
    ],
  };
}
