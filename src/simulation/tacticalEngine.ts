import {
  PERSISTENCE_FIXTURES,
  SystemdUnitFixture,
} from './tacticalFixtures/persistence.fixtures';
import { METADATA_FIXTURES } from './tacticalFixtures/metadata.fixtures';
import { TLS_FINGERPRINT_FIXTURES } from './tacticalFixtures/tls.fixtures';
import { CANARY_HONEYPOT_FIXTURES } from './tacticalFixtures/canary.fixtures';
import { HSM_FORENSICS_FIXTURES } from './tacticalFixtures/hsm.fixtures';
import { BINARY_FIXTURES } from './tacticalFixtures/binary.fixtures';
import { CONTAINER_FIXTURES } from './tacticalFixtures/container.fixtures';
import { EBPF_FIXTURES } from './tacticalFixtures/ebpf.fixtures';

export interface ForensicFindingReport {
  findingId: string;
  sourceArtifact: string;
  observedFact: string;
  observedFactZh: string;
  technicalInference: string;
  technicalInferenceZh: string;
  narrativeHypothesis: string;
  narrativeHypothesisZh: string;
  confidence: 'HIGH (Deterministic Match)' | 'MEDIUM (Corroborated Indicator)';
  relatedStoryEvent: string;
  verificationStatus: 'VERIFIED' | 'PENDING_CORROBORATION';
  formattedTelemetry: string;
}

export function formatForensicReportForTerminal(
  report: ForensicFindingReport
): string {
  return [
    report.formattedTelemetry,
    '--------------------------------------------------------------------------------',
    `[OBSERVED FACT]        ${report.observedFact}`,
    `[TECHNICAL INFERENCE]  ${report.technicalInference}`,
    `[NARRATIVE HYPOTHESIS] ${report.narrativeHypothesis}`,
    `[CONFIDENCE & STATUS]  ${report.confidence} · ${report.verificationStatus}`,
  ].join('\n');
}

export interface PersistenceAnalysisResult {
  suspiciousUnit: SystemdUnitFixture;
  metadataFindings: string[];
  report: ForensicFindingReport;
}

export function analyzePersistenceAndMetadata(): PersistenceAnalysisResult {
  const timer = PERSISTENCE_FIXTURES[0];
  const service = PERSISTENCE_FIXTURES[1];
  const pdf = METADATA_FIXTURES['incident_0427_brief.pdf'];

  const metadataFindings = [
    'Author: e.ward_09',
    'Host: apt4b-workstation',
    ...pdf.embeddedFields.map((f) => `${f.key}: ${f.originalValue}`),
  ];

  const formattedTelemetry = [
    `[SYSTEMD USER UNIT AUDIT — ${timer.fixtureId}]`,
    `  Unit     : ${timer.unitPath} (${timer.permissions})`,
    `  Schedule : ${timer.scheduleOrExec} -> ${service.unitName}`,
    `  Exec     : ${service.scheduleOrExec}`,
    `  CIS Note : ${timer.cisFinding}`,
    '',
    `[DOCUMENT METADATA AUDIT — ${pdf.fixtureId}]`,
    `  File     : ${pdf.filePath} (SHA256: ${pdf.sha256Original.slice(0, 16)}...)`,
    ...pdf.embeddedFields.map(
      (f) =>
        `  - ${f.key.padEnd(18, ' ')}: "${f.originalValue}" ${
          f.isIdentityLeak ? '[IDENTITY LEAK!]' : '[TIMESTAMP]'
        }`
    ),
  ].join('\n');

  const report: ForensicFindingReport = {
    findingId: 'FND-08-PERSIST-META',
    sourceArtifact: `${timer.unitName} & ${pdf.fileName}`,
    observedFact:
      'User timer vespera-Support-sync.timer executes /usr/local/lib/vespera-support/tele-beacon periodically, and incident_0427_brief.pdf contains XMP:Author="e.ward_09" and PDF:ProducerHost="apt4b-workstation".',
    observedFactZh:
      '观察事实：vespera-Support-sync.timer 周期性拉起 tele-beacon 进程；同时 incident_0427_brief.pdf 内嵌了 XMP:Author="e.ward_09" 与主机名 "apt4b-workstation"。',
    technicalInference:
      'The lingering timer beacons workstation status externally, and exporting the PDF without scrubbing metadata will expose Eli Ward’s workstation identity.',
    technicalInferenceZh:
      '技术推论：残留定时任务正在向外发送本机心跳，且未脱敏的 PDF 一旦外发将直接暴露 Eli 的设备与身份。',
    narrativeHypothesis:
      'Vespera’s legacy support image left a dormant persistence hook on Eli’s machine that must be quarantined before sharing files with journalist Rhea Solis.',
    narrativeHypothesisZh:
      '叙事假设：Vespera 旧运维镜像在 Eli 电脑中留有后门钩子，向记者 Rhea 传递材料前必须隔离该服务并生成脱敏副本。',
    confidence: 'HIGH (Deterministic Match)',
    relatedStoryEvent: 'Chapter 1 Workstation Hardening & Media Dead-Drop Protection',
    verificationStatus: 'VERIFIED',
    formattedTelemetry,
  };

  return {
    suspiciousUnit: timer,
    metadataFindings,
    report,
  };
}

export interface TlsAnalysisResult {
  computedJa4: string;
  baselineBrowserJa4: string;
  isStatelessScan: boolean;
  report: ForensicFindingReport;
}

export function analyzeTlsFingerprinting(captureArg?: string): TlsAnalysisResult {
  const eliCapture = TLS_FINGERPRINT_FIXTURES.captured_tls_0427_eli_tool;
  const baseline = TLS_FINGERPRINT_FIXTURES.captured_tls_0427_standard_browser;

  const sortedEliCiphers = [...eliCapture.cipherSuitesHex].sort().join(',');
  const sortedBaselineCiphers = [...baseline.cipherSuitesHex].sort().join(',');

  const formattedTelemetry = [
    `[PASSIVE TLS CLIENTHELLO & JA4 ATTRIBUTION — ${eliCapture.fixtureId}]`,
    `  Capture Source : ${captureArg || eliCapture.captureId} (${eliCapture.sourceIp} -> ${eliCapture.destinationIp}:${eliCapture.destinationPort})`,
    `  Profile A      : ${eliCapture.profileName}`,
    `    Ciphers (Sorted Hex) : [${sortedEliCiphers}] (count=04, SNI=d, ALPN=${eliCapture.alpn})`,
    `    JA3 Hash             : ${eliCapture.ja3Hash}`,
    `    JA4 Fingerprint      : ${eliCapture.ja4Fingerprint}`,
    `    Connection Telemetry : ${eliCapture.tcpScanStateSummary}`,
    `  Profile B      : ${baseline.profileName}`,
    `    Ciphers (Sorted Hex) : [${sortedBaselineCiphers.slice(0, 44)}...] (count=15)`,
    `    JA4 Fingerprint      : ${baseline.ja4Fingerprint}`,
  ].join('\n');

  const report: ForensicFindingReport = {
    findingId: 'FND-09-TLS-JA4',
    sourceArtifact: eliCapture.captureId,
    observedFact: `Captured ClientHello from 10.0.2.15 presents 4 cipher suites and 6 extensions, producing canonical JA4 fingerprint ${eliCapture.ja4Fingerprint} over a completed 3-way TCP handshake.`,
    observedFactZh: `观察事实：10.0.2.15 发出的 ClientHello 包含 4 个加密套件与 6 个扩展，计算出的标准 JA4 指纹为 ${eliCapture.ja4Fingerprint}，且为完整三次握手连接。`,
    technicalInference:
      'Even over encrypted TLS 1.3, the unencrypted ClientHello structure uniquely matches a single diagnostic CLI session rather than a browser or stateless SYN scanner.',
    technicalInferenceZh:
      '技术推论：即便 TLS 1.3 载荷加密，明文握手阶段的扩展与套件组合及 TCP 状态仍唯一证明这是一次单端口诊断连接，而非大规模无状态扫描。',
    narrativeHypothesis:
      'Vespera’s SOC fabricated the mass-scanner accusation while tracking Eli’s legacy diagnostic CLI fingerprint via SIEM Rule #SOC-JA4-09.',
    narrativeHypothesisZh:
      '叙事假设：Vespera 安全部通过 SIEM 规则 #SOC-JA4-09 识别了旧版诊断脚本特征，并借机捏造了自动化扫描指控。',
    confidence: 'HIGH (Deterministic Match)',
    relatedStoryEvent: 'Vespera SOC Automated Toolkit Attribution',
    verificationStatus: 'VERIFIED',
    formattedTelemetry,
  };

  return {
    computedJa4: eliCapture.ja4Fingerprint,
    baselineBrowserJa4: baseline.ja4Fingerprint,
    isStatelessScan: false,
    report,
  };
}

export const analyzeTlsAttribution = analyzeTlsFingerprinting;

export interface CanaryAnalysisResult {
  canaryTokenId: string;
  honeypotHost: string;
  honeypotConfidence: number;
  report: ForensicFindingReport;
}

export function analyzeCanaryAndHoneypot(
  targetArg?: string
): CanaryAnalysisResult {
  const docCanary = CANARY_HONEYPOT_FIXTURES['incident_0427_brief.pdf'];
  const netHoney = CANARY_HONEYPOT_FIXTURES['10.88.14.9'];

  const focusDoc = targetArg && targetArg.includes('incident_0427_brief.pdf');
  const focusIp = targetArg && targetArg.includes('10.88.14.9');

  const sections: string[] = [];
  if (!focusIp) {
    sections.push(
      `[DOCUMENT CANARY INSPECTION — ${docCanary.fixtureId}]`,
      `  Artifact      : ${docCanary.targetName}`,
      `  Canary Token  : CANARY-VSP-0427-ELI (${docCanary.embeddedTokenId})`,
      `  DNS Tripwire  : ${docCanary.dnsBeaconDomain}`,
      `  HTTP Webhook  : ${docCanary.httpWebhookPattern}`,
      `  SIEM Rule     : ${docCanary.siemRuleId}`
    );
  }
  if (!focusDoc) {
    sections.push(
      `[NETWORK HONEYPOT TELEMETRY — ${netHoney.fixtureId}]`,
      `  Target Node   : ${netHoney.targetName}`,
      `  Decoy Service : ${netHoney.httpWebhookPattern}`,
      ...netHoney.syntheticServiceSignatures.map((s) => `  - ${s}`),
      `  Assessment    : ${netHoney.deceptionAssessment}`
    );
  }

  const report: ForensicFindingReport = {
    findingId: 'FND-10-CANARY-DECEPT',
    sourceArtifact: targetArg || 'incident_0427_brief.pdf & 10.88.14.9',
    observedFact:
      'Port 9999/tcp on 10.88.14.9 responds in 0.12ms with a user-space synthetic banner, and incident_0427_brief.pdf contains embedded Canary Token CANARY-VSP-0427-ELI.',
    observedFactZh:
      '观察事实：10.88.14.9 的 9999 端口以 0.12ms 返回用户态仿真横幅，且文档模板头包含追踪标记 CANARY-VSP-0427-ELI。',
    technicalInference:
      '10.88.14.9 is a high-interaction deception honey-trap (98/100 confidence) monitored by SIEM Rule #SIEM-HONEY-001; actively probing it will trigger +15% Corporate Suspicion and +15% Player Exposure.',
    technicalInferenceZh:
      '技术推论：10.88.14.9 是受 SIEM 规则 #SIEM-HONEY-001 监控的主动诱捕蜜罐（置信度 98/100）；直接对其发起 probe 将触发 +15% 企业怀疑度与 +15% 暴露度惩罚。',
    narrativeHypothesis:
      'Director Marcus Hale deployed an executive enclave decoy to trap and log anyone investigating the LANTERN audit trail.',
    narrativeHypothesisZh:
      '叙事假设：安全总监 Marcus Hale 布置了高管飞地蜜罐，企图诱导调查者主动探测以收集定罪遥测。',
    confidence: 'HIGH (Deterministic Match)',
    relatedStoryEvent: 'Executive Enclave 10.88.14.9 Honey-Trap Warning',
    verificationStatus: 'VERIFIED',
    formattedTelemetry: sections.join('\n'),
  };

  return {
    canaryTokenId: 'CANARY-VSP-0427-ELI',
    honeypotHost: '10.88.14.9',
    honeypotConfidence: 98,
    report,
  };
}

export interface HsmVerificationBreakdown {
  signatureMathValid: boolean;
  signingKeyId: string;
  keyOwner: string;
  tokenMetadata: string;
  hardwareAttestationStatus: string;
  attributedActorInPlaintextLog: string;
}

export interface HsmAnalysisResult {
  verificationBreakdown: HsmVerificationBreakdown;
  report: ForensicFindingReport;
}

export function analyzeHsmAndKeyring(): HsmAnalysisResult {
  const hsm = HSM_FORENSICS_FIXTURES['access_0427.log'];

  const formattedTelemetry = [
    `[PKCS#11 SIGNATURE & KEY SLOT VERIFICATION — ${hsm.fixtureId}]`,
    `  Slot / Token          : ${hsm.slotId} (${hsm.tokenLabel})`,
    `  Key Identifier Label  : ${hsm.keyIdLabel}`,
    `  Algorithm             : ${hsm.algorithm}`,
    `  Verified Public Key   : ${hsm.publicKeyFingerprint}`,
    `  Signed Audit Payload  : ${hsm.signedPayloadDigest}`,
    `  Cryptographic Verify  : ${
      hsm.signatureValid ? 'VALID (Mathematical ECDSA-P256 Match)' : 'INVALID'
    }`,
    `  Timestamp             : ${hsm.timestampUtc}`,
    '',
    `[EVIDENTIARY BOUNDARY — SIGNATURE vs. KEY ID vs. HARDWARE ATTESTATION]`,
    `  ${hsm.hardwareAttestationState}`,
    '',
    `[CREDENTIAL EXPOSURE & ROTATION LEDGER]`,
    `  ${hsm.credentialExposureFinding}`,
  ].join('\n');

  const report: ForensicFindingReport = {
    findingId: 'FND-11-PKCS11-SIG',
    sourceArtifact: 'access_0427.log & kern_keyring.log',
    observedFact: `Log purge #9904 and the reactivation of e.ward_09 carry a mathematically valid ECDSA-P256 signature verifiable under public key ${hsm.publicKeyFingerprint} (Key ID: ${hsm.keyIdLabel}).`,
    observedFactZh: `观察事实：#9904 日志清洗与 e.ward_09 重激活记录带有有效的 ECDSA-P256 数字签名，可通过公钥 ${hsm.publicKeyFingerprint}（密钥标识 ${hsm.keyIdLabel}）验签。`,
    technicalInference:
      'Separating mathematical signature validity, Key ID (M_HALE_SEC_01), soft-token slot metadata (CKF_HW_SLOT=false), and hardware attestation confirms Marcus Hale’s key signed the batch via an un-attested software emulator while splicing e.ward_09 into the plaintext log.',
    technicalInferenceZh:
      '技术推论：区分签名数学有效性、密钥 ID (M_HALE_SEC_01)、软令牌元数据 (CKF_HW_SLOT=false) 与缺失的硬件证明后，证实有人使用 Marcus Hale 的密钥通过软模拟器签署指令并在明文日志中栽赃 e.ward_09。',
    narrativeHypothesis:
      'Eli’s revoked account e.ward_09 was framed using Marcus Hale’s executive signing key to cover up the Project LANTERN purge.',
    narrativeHypothesisZh:
      '叙事假设：有人动用归属 Marcus Hale 安全槽位的签名密钥伪造了 e.ward_09 的清洗授权。',
    confidence: 'HIGH (Deterministic Match)',
    relatedStoryEvent: 'Exoneration Proof for e.ward_09 Account Reuse',
    verificationStatus: 'VERIFIED',
    formattedTelemetry,
  };

  return {
    verificationBreakdown: {
      signatureMathValid: true,
      signingKeyId: hsm.keyIdLabel,
      keyOwner: 'Director Marcus Hale',
      tokenMetadata: 'SoftHSM-Emulator v2.6 (CKF_HW_SLOT=false)',
      hardwareAttestationStatus: 'MISSING_HARDWARE_ATTESTATION',
      attributedActorInPlaintextLog: 'e.ward_09',
    },
    report,
  };
}

export const analyzeHsmSignatureAndSecrets = analyzeHsmAndKeyring;

export interface ContainerBinaryAnalysisResult {
  suspiciousSymbols: string[];
  containerEscapeVectors: string[];
  ebpfBoundaryViolations: string[];
  report: ForensicFindingReport;
}

export function analyzeContainerAndBinary(
  mode: 'all' | 'elf' | 'container' | 'trace' = 'all'
): ContainerBinaryAnalysisResult {
  const elf = BINARY_FIXTURES['lantern-syncd'];
  const container = CONTAINER_FIXTURES['lantern-collector.json'];
  const trace = EBPF_FIXTURES['lantern-syncd.trace'];

  const parts: string[] = [];
  if (mode === 'all' || mode === 'elf') {
    parts.push(
      `[STATIC ELF BINARY ANALYSIS — ${elf.fixtureId}]`,
      `  Binary    : ${elf.binaryPath}`,
      `  ELF Header: ${elf.elfMagicAndClass} · ${elf.architecture}`,
      `  Build ID  : ${elf.buildIdSha1}`,
      `  Symbols   : ${elf.importedSymbols.join(', ')}`,
      `  Function  : ${elf.criticalFunctions[0].name} @ ${elf.criticalFunctions[0].offset}`,
      `    -> ${elf.criticalFunctions[0].decompiledSummary}`
    );
  }
  if (mode === 'all' || mode === 'container') {
    parts.push(
      `[CIS DOCKER CONTAINER AUDIT — ${container.fixtureId}]`,
      `  Manifest  : ${container.manifestName} (User=${container.containerUser}, Privileged=${container.privileged}, PidMode=${container.pidMode})`,
      ...container.cisFindings.map((f) => `  - ${f}`)
    );
  }
  if (mode === 'all' || mode === 'trace') {
    parts.push(
      `[PRE-RECORDED EBPF SYSCALL TELEMETRY — ${trace.fixtureId}]`,
      ...trace.events.map(
        (ev) =>
          `  [${ev.timestamp}] pid=${ev.pid} (${ev.comm}) ${ev.syscall}(${ev.argsSummary}) = ${ev.returnCode}\n    -> ${ev.significance}`
      )
    );
  }

  const report: ForensicFindingReport = {
    findingId: 'FND-12-ELF-CONTAINER',
    sourceArtifact: 'lantern-syncd, lantern-collector.json & lantern-syncd.trace',
    observedFact:
      'ELF binary lantern-syncd contains function calc_citizen_threat_score @ 0x00402190, runs in a privileged container mounting /var/run/docker.sock and /etc:/host_etc:ro, and executed openat("/host_etc/shadow") in eBPF telemetry.',
    observedFactZh:
      '观察事实：ELF 样本 lantern-syncd 含有函数 calc_citizen_threat_score @ 0x00402190，其容器以 Privileged=true 挂载了 /var/run/docker.sock，并在 eBPF 记录中跨边界读取宿主机敏感文件。',
    technicalInference:
      'The binary computes weighted citizen risk scores and uses the mounted host Docker socket and host filesystem mounts to breach container isolation.',
    technicalInferenceZh:
      '技术推论：该程序计算市民风险分，并利用挂载的宿主机 Docker 套接字与目录跨越容器隔离边界。',
    narrativeHypothesis:
      'Project LANTERN is an automated algorithmic blacklisting and tenant-eviction engine operating with root-equivalent host privileges.',
    narrativeHypothesisZh:
      '叙事假设：“灯塔计划”是一套具备宿主机特权逃逸能力的自动化公民风险评分与租户清退系统。',
    confidence: 'HIGH (Deterministic Match)',
    relatedStoryEvent: 'Project LANTERN Algorithmic Scoring & Container Escape Proof',
    verificationStatus: 'VERIFIED',
    formattedTelemetry: parts.join('\n\n'),
  };

  return {
    suspiciousSymbols: [
      'calc_citizen_threat_score',
      'mount_host_shadow_Copy',
      ...elf.criticalFunctions.map((fn) => fn.name),
    ],
    containerEscapeVectors: [
      'Privileged: true',
      '/var/run/docker.sock bind mount',
      '/etc:/host_etc:ro bind mount',
      ...container.cisFindings,
    ],
    ebpfBoundaryViolations: [
      'openat("/host_etc/shadow")',
      'connect("/var/run/docker.sock")',
      ...trace.events.map((e) => `${e.syscall}(${e.argsSummary})`),
    ],
    report,
  };
}

export const analyzeBinaryAndContainer = analyzeContainerAndBinary;
