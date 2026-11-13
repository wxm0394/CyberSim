import { LearningLesson } from '../../learning/lessonTypes';

export const HSM_FORENSICS_LESSON: LearningLesson = {
  id: 'lesson_11_hsm_forensics',
  levelNumber: 11,
  code: 'LEVEL 11 · CRYPTO FORENSICS',
  title: 'The Hardware Forgery',
  titleZh: '硬件伪证与密钥轮换审计',
  difficulty: 3,
  sourceTrack: 'tactical_security',
  category: 'crypto_forensics',
  prerequisites: ['lesson_10_counter_deception'],
  isMvpCoreLab: false,
  narrativeHook:
    'The forged directive in `access_0427.log` claims you authorized the `02:14:11 UTC` purge—yet the cryptographic signature block carries PKCS#11 Key ID `M_HALE_SEC_01` and an irregular token rotation record in `kern_keyring.log`. To prove the framing, you must separate mathematical signature validity from hardware attestation.',
  narrativeHookZh:
    '`access_0427.log` 中的伪造指令声称是你在 `02:14:11 UTC` 授权了日志清洗——但底层的密码学签名块却印着 PKCS#11 密钥标识 `M_HALE_SEC_01`，且 `kern_keyring.log` 中留下了异常的软令牌轮换记录。为了坐实栽赃，你必须厘清数学签名有效性与硬件证明之间的关键差异。',
  concepts: [
    {
      id: 'concept_pkcs11_hsm_vs_softtoken',
      title: 'PKCS#11 Hardware Security Modules (HSM) vs. Unbacked Soft-Token Emulation',
      titleZh: 'PKCS#11 硬件安全模块（HSM）与无硬件背书的软令牌模拟器',
      summary:
        'A genuine Hardware Security Module (HSM) generates and stores private keys inside tamper-resistant silicon, sets `CKF_HW_SLOT=true`, and emits a cryptographic hardware attestation certificate proving the key never left physical hardware. A software PKCS#11 emulator (`SoftHSM-Emulator`) can still produce a mathematically valid ECDSA-P256 signature, but its slot telemetry reveals `CKF_HW_SLOT=false` and `Attestation: NONE`.',
      summaryZh:
        '真正的硬件安全模块（HSM）在防篡改安全芯片内部生成并保存私钥，其 PKCS#11 槽位标记 `CKF_HW_SLOT=true`，并附带硬件防伪证明（Hardware Attestation）。而软件 PKCS#11 模拟器（Soft-Token）虽然同样能计算出在数学上通过公钥验签的 ECDSA-P256 签名，但其槽位遥测会暴露 `CKF_HW_SLOT=false` 且缺乏硬件出厂证明。',
      keyTerms: ['PKCS#11 Slot & Token', 'CKF_HW_SLOT', 'ECDSA-P256 Mathematical Validity', 'Hardware Attestation Certificate'],
      practicalRule:
        'A mathematically valid ECDSA signature only proves possession of the private key bytes—you must verify Key ID (`M_HALE_SEC_01`) and PKCS#11 hardware attestation to know who and what device signed it.',
      practicalRuleZh:
        'ECDSA 签名在数学上验签通过，仅证明签名者持有对应私钥数据；必须同时核查密钥标识（Key ID）与 PKCS#11 硬件证明，才能判定真实的签名主体与设备类型。',
      diagramLines: [
        '1. Signature Math       : VALID (ECDSA-P256 verifies against public key 04:a9:7c...)',
        '2. Key Identifier       : M_HALE_SEC_01 (Director Marcus Hale — NOT Eli Ward)',
        '3. Token Metadata       : SoftHSM-Emulator v2.6 (CKF_HW_SLOT=false)',
        '4. Hardware Attestation : MISSING (Forged via off-hours soft-token injection)',
      ],
    },
    {
      id: 'concept_secrets_rotation_audit',
      title: 'Credential Exposure & Anomalous Key Rotation Timelines',
      titleZh: '密钥暴露扫描与异常轮换时间线取证',
      summary:
        'Correlating `kern_keyring.log` with `access_0427.log` shows that `M_HALE_SEC_01` was exported into an ephemeral software slot at `02:13:58 UTC`, used 13 seconds later to sign the `02:14:11 UTC` batch while splicing `e.ward_09` into the plaintext header, and revoked at `02:15:04 UTC`.',
      summaryZh:
        '将 `kern_keyring.log` 与 `access_0427.log` 交叉比对可以发现：密钥 `M_HALE_SEC_01` 在 `02:13:58 UTC` 被挂载至临时软令牌槽位，13 秒后（`02:14:11 UTC`）即被用于签署伪造有 `e.ward_09` 明文头的批处理指令，随后在 `02:15:04 UTC` 被紧急卸载。',
      keyTerms: ['Key Rotation Timeline', 'Plaintext Actor Splice', 'Ephemeral Soft-Token Slot', 'Non-Repudiation Forensics'],
      practicalRule:
        'Always compare the plaintext actor field in an audit log against the cryptographic signer Key ID and keyring rotation timestamps.',
      practicalRuleZh:
        '审计关键操作日志时，务必将明文记录的操作员工号与底层密码学签名块的 Key ID 及密钥挂载时间线进行交叉核对。',
      diagramLines: [
        '02:13:58 UTC : Soft-token slot 0x02 mounts key M_HALE_SEC_01 (CKF_HW_SLOT=false)',
        '02:14:11 UTC : Signs batch_0427 with plaintext header "ACTOR=e.ward_09"',
        '02:15:04 UTC : Ephemeral soft-token destroyed to hide tracks',
      ],
    },
  ],
  lab: {
    id: 'lab_11_pkcs11_hsm_audit',
    code: 'SECLAB-11',
    title: 'PKCS#11 Signature Verification & Key Rotation Forensics Lab',
    titleZh: 'PKCS#11 签名验证、密钥标识与软令牌轮换取证实验',
    objective:
      'Inspect the PKCS#11 signature block on `access_0427.log` and correlate `kern_keyring.log` to distinguish mathematical signature validity, Key ID `M_HALE_SEC_01`, soft-token emulation metadata, and missing hardware attestation.',
    objectiveZh:
      '核查 `access_0427.log` 的 PKCS#11 签名块并关联 `kern_keyring.log`，严谨区分数学签名有效性、密钥标识 `M_HALE_SEC_01`、软令牌元数据与缺失的硬件证明。',
    environmentBanner: 'GREYOS SANDBOX // PKCS#11 HSM & KEYRING FORENSIC VERIFIER // PASSIVE AUDIT',
    initialSymptom:
      '`access_0427.log` lists `ACTOR=e.ward_09` in plaintext at `02:14:11 UTC`, but its detached PKCS#11 signature block references slot `0x02` (`M_HALE_SEC_01`).',
    initialSymptomZh:
      '`access_0427.log` 在 `02:14:11 UTC` 的明文行写着 `ACTOR=e.ward_09`，但其底层 PKCS#11 签名块却指向槽位 `0x02` (`M_HALE_SEC_01`)。',
    nodes: [
      {
        id: 'node_pkcs11_slot',
        label: 'PKCS#11 Slot 0x02 (access_0427.log.sig)',
        address: 'CKA_LABEL: M_HALE_SEC_01',
        role: 'Detached ECDSA-P256 Signature & Token Slot Telemetry',
        roleZh: '分离式 ECDSA-P256 签名块与 PKCS#11 槽位遥测记录',
        status: 'compromised',
      },
      {
        id: 'node_kern_keyring',
        label: '/var/log/kern_keyring.log',
        address: '02:13:58 UTC — 02:15:04 UTC',
        role: 'Kernel Keyring Mount & Rotation Audit Trail',
        roleZh: '内核密钥环挂载与紧急轮换审计日志',
        status: 'nominal',
      },
    ],
    diagnosticActions: [
      {
        id: 'diag_11_verify_ecdsa_slot',
        label: 'Verify ECDSA-P256 Signature Math & Inspect PKCS#11 Token Flags',
        labelZh: '验证 ECDSA-P256 签名数学有效性并检查 PKCS#11 令牌硬件标志位',
        commandPreview: 'hsm-verify --inspect-slot 0x02 --artifact access_0427.log',
        targetNode: 'PKCS#11 Slot 0x02 (access_0427.log.sig)',
        telemetryOutput: [
          '[1. CRYPTO SIGNATURE MATH] ECDSA-P256 Signature VALID (Matches PubKey 04:a9:7c:81:2e:f0:44:19:bb:02)',
          '[2. SIGNING KEY ID       ] CKA_LABEL = "M_HALE_SEC_01" (Custodian: Director Marcus Hale)',
          '[3. TOKEN METADATA       ] Model = "SoftHSM-Emulator v2.6" | CKF_HW_SLOT = false',
          '[4. HARDWARE ATTESTATION ] FAILED / MISSING (No physical FIPS 140-3 YubiHSM attestation chain)',
        ].join('\n'),
        telemetryOutputZh: [
          '【1. 密码学签名数学验算】ECDSA-P256 签名在数学上有效（匹配公钥 04:a9:7c:81:2e:f0:44:19:bb:02）',
          '【2. 签名密钥标识 (ID) 】CKA_LABEL = "M_HALE_SEC_01"（密钥持有人：安全总监 Marcus Hale）',
          '【3. 令牌槽位元数据    】设备型号 = "SoftHSM-Emulator v2.6" | 硬件标志 CKF_HW_SLOT = false',
          '【4. 物理硬件防伪证明  】缺失（无物理 YubiHSM 硬件芯片签名链，实为软件模拟器注入）',
        ].join('\n'),
        revealsClue:
          'Separated all four forensic dimensions: the ECDSA math is valid for `M_HALE_SEC_01`, proving Marcus Hale’s key signed the batch via a software PKCS#11 emulator (`CKF_HW_SLOT=false`) while forging `e.ward_09` in the plaintext log.',
        revealsClueZh:
          '完整厘清四层取证事实：签名在数学上对 `M_HALE_SEC_01` 有效，证实有人使用 Marcus Hale 的私钥通过软令牌模拟器 (`CKF_HW_SLOT=false`) 签署了指令，同时在明文日志中栽赃 `e.ward_09`。',
        isCriticalClue: true,
      },
      {
        id: 'diag_11_keyring_rotation',
        label: 'Audit `kern_keyring.log` for Off-Hours Key Export & Rotation Anomalies',
        labelZh: '审计 `kern_keyring.log` 中的凌晨密钥挂载与紧急轮换时间线',
        commandPreview: 'hsm-verify --keyring-timeline /var/log/kern_keyring.log',
        targetNode: '/var/log/kern_keyring.log',
        telemetryOutput: [
          '[02:13:58 UTC] PKCS11_SOFT_MOUNT: Key M_HALE_SEC_01 loaded into ephemeral slot 0x02',
          '[02:14:11 UTC]SIGN_OP: Signed access_0427.log batch (Plaintext header overridden: ACTOR=e.ward_09)',
          '[02:15:04 UTC] KEY_ROTATE: Ephemeral slot 0x02 purged; key serial 0x8841A90F rotated',
        ].join('\n'),
        telemetryOutputZh: [
          '[02:13:58 UTC] 软令牌挂载：密钥 M_HALE_SEC_01 被加载至临时软槽位 0x02',
          '[02:14:11 UTC] 签名操作：签署 access_0427.log 批处理（明文头被篡改为 ACTOR=e.ward_09）',
          '[02:15:04 UTC] 密钥轮换：临时软槽位 0x02 被销毁，序列号 0x8841A90F 完成轮换掩盖',
        ].join('\n'),
        revealsClue:
          '`kern_keyring.log` confirms `M_HALE_SEC_01` was mounted in an ephemeral soft-token slot 13 seconds before the `02:14:11 UTC` framing event and purged immediately afterward.',
        revealsClueZh:
          '`kern_keyring.log` 证实 `M_HALE_SEC_01` 在栽赃事件发生前 13 秒被挂载进临时软令牌槽位，并在签名完成后立即销毁轮换。',
        isCriticalClue: true,
      },
    ],
    resolutions: [
      {
        id: 'res_11_compile_hsm_proof',
        label: 'Compile PKCS#11 Cryptographic Non-Repudiation & Keyring Audit Proof',
        labelZh: '生成 PKCS#11 密码学抗抵赖与密钥环时间线取证报告',
        commandPreview: 'hsm-verify access_0427.log',
        approach: 'analytical',
        isOptimal: true,
        requiresDiagnosticIds: ['diag_11_verify_ecdsa_slot', 'diag_11_keyring_rotation'],
        outcomeSummary:
          'Mastered PKCS#11 cryptographic verification and unlocked `hsm-verify` for your workstation.',
        outcomeSummaryZh:
          '已完成 PKCS#11 签名、密钥标识与硬件证明区分实验，解锁终端工具 `hsm-verify`。将其应用到 `access_0427.log` 即可固定密码学铁证。',
        suspicionDelta: 0,
        exposureDelta: 0,
        trustNadiaDelta: 0,
      },
      {
        id: 'res_11_bruteforce_pkcs11_pin',
        label: 'Attempt Live PIN Brute-Force Against Remote Corporate HSM Appliance',
        labelZh: '直接对企业远端 HSM 硬件设备发起 PIN 码暴力破解',
        commandPreview: 'pkcs11-tool --login --pin-bruteforce 10.88.4.22',
        approach: 'brute_force',
        isOptimal: false,
        requiresDiagnosticIds: [],
        outcomeSummary:
          '3 failed PIN attempts triggered hardware slot zeroization Lockout Warning on Vespera’s live HSM (+15% Corporate Suspicion).',
        outcomeSummaryZh:
          '连续 3 次 PIN 码尝试失败触发了企业线上 HSM 的硬件防篡改锁定告警（企业怀疑度 +15%）。',
        suspicionDelta: 15,
        exposureDelta: 5,
        trustNadiaDelta: 0,
      },
    ],
    storyApplication: {
      id: 'app_11_verify_hsm_log',
      targetHostOrFile: 'access_0427.log',
      actionLabel: 'Run `hsm-verify access_0427.log` to Prove `M_HALE_SEC_01` Soft-Token Framing',
      actionLabelZh: '运行 `hsm-verify access_0427.log` 锁定 `M_HALE_SEC_01` 软令牌伪造签名铁证',
      analyticalCommand: 'hsm-verify access_0427.log',
      bruteForceCommand: 'pkcs11-tool --bruteforce',
      analyticalOutcome:
        'Verified that `access_0427.log` carries a mathematically valid ECDSA-P256 signature from `M_HALE_SEC_01` generated by an un-attested `SoftHSM-Emulator` slot (`hsm_signature_verified`, -5% Suspicion, +10% Nadia Trust).',
      analyticalOutcomeZh:
        '已核实 `access_0427.log` 由 `M_HALE_SEC_01` 私钥通过无硬件证明的软令牌模拟器签署（记录 `hsm_signature_verified`，怀疑度 -5%，Nadia 信任度 +10%）。',
      bruteForceOutcome:
        'Live PKCS#11 PIN guessing tripped Vespera’s HSM tamper alarm (+15% Suspicion).',
      bruteForceOutcomeZh:
        '盲目爆破线上 HSM PIN 码触发了防篡改警报（企业怀疑度 +15%）。',
      analyticalSuspicionDelta: -5,
      analyticalExposureDelta: 0,
      analyticalTrustDelta: 10,
      bruteForceSuspicionDelta: 15,
      bruteForceExposureDelta: 5,
    },
  },
  unlocks: {
    capabilities: ['hsm_verifier'],
    tools: ['hsm-verify'],
    badgeLabel: 'PKCS#11 HSM & Keyring Verifier',
    badgeLabelZh: 'PKCS#11 硬件签名与密钥审计器',
  },
  source: {
    repository: 'Lauren-Bitten/CyberSecurity-Projects',
    upstreamRepository: 'CarterPerez-dev/Cybersecurity-Projects',
    fork: 'Lauren-Bitten/CyberSecurity-Projects',
    license: 'AGPL-3.0',
    sectionPath: 'PROJECTS/advanced/hsm-emulator & PROJECTS/intermediate/secrets-scanner & PROJECTS/intermediate/credential-enumeration',
    sectionTitle: 'PKCS#11 HSM Emulator, Secrets Scanner & Credential Rotation Audit',
    adaptationNote:
      'Adapted from PKCS#11 HSM emulation and secrets auditing concepts to teach the distinction between mathematical signature validity, Key ID, token metadata, and hardware attestation.',
    adaptationNoteZh:
      '基于 PKCS#11 HSM 模拟器与密钥审计原理改编，重点区分数学签名有效性、密钥 ID、软令牌元数据与物理硬件防伪证明。',
  },
  reviewStatus: 'reviewed',
};
