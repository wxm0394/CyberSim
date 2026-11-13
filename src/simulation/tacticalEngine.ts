import {
  PERSISTENCE_FIXTURES,
  SystemdUnitFixture,
} from './tacticalFixtures/persistence.fixtures';
import { METADATA_FIXTURES } from './tacticalFixtures/metadata.fixtures';
import {
  TLS_FINGERPRINT_FIXTURES,
  TlsClientHelloFixture,
} from './tacticalFixtures/tls.fixtures';
import { CANARY_HONEYPOT_FIXTURES } from './tacticalFixtures/canary.fixtures';
import {
  HSM_FORENSICS_FIXTURES,
  Pkcs11SlotFixture,
} from './tacticalFixtures/hsm.fixtures';
import { BINARY_FIXTURES } from './tacticalFixtures/binary.fixtures';
import { CONTAINER_FIXTURES } from './tacticalFixtures/container.fixtures';
import { EBPF_FIXTURES } from './tacticalFixtures/ebpf.fixtures';
import {
  computeCanonicalJa4,
  isGreaseHex,
  Ja4ClientHelloInput,
  Ja4ComputationResult,
  parseDerEcdsaSignature,
  sha256Hex,
  verifyEcdsaP256Sha256,
} from './cryptoPrimitives';

export {
  computeCanonicalJa4,
  isGreaseHex,
  parseDerEcdsaSignature,
  sha256Hex,
  verifyEcdsaP256Sha256,
};
export type { Ja4ClientHelloInput, Ja4ComputationResult };

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
    relatedStoryEvent:
      'Chapter 1 Workstation Hardening & Media Dead-Drop Protection',
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
  computedDetails: Ja4ComputationResult;
  baselineBrowserJa4: string;
  baselineDetails: Ja4ComputationResult;
  isStatelessScan: boolean;
  report: ForensicFindingReport;
}

export function analyzeTlsFingerprinting(
  captureArg?: string,
  customClientHello?: Partial<TlsClientHelloFixture>
): TlsAnalysisResult {
  const eliCapture: TlsClientHelloFixture = {
    ...TLS_FINGERPRINT_FIXTURES.captured_tls_0427_eli_tool,
    ...customClientHello,
  };
  const baseline = TLS_FINGERPRINT_FIXTURES.captured_tls_0427_standard_browser;

  // Dynamically compute both JA4 fingerprints from raw wire-order ClientHello fields
  const eliComputed = computeCanonicalJa4(eliCapture);
  const baselineComputed = computeCanonicalJa4(baseline);

  const formattedTelemetry = [
    `[PASSIVE TLS CLIENTHELLO & JA4 ATTRIBUTION — ${eliCapture.fixtureId}]`,
    `  Capture Source : ${captureArg || eliCapture.captureId} (${eliCapture.sourceIp} -> ${eliCapture.destinationIp}:${eliCapture.destinationPort})`,
    `  Profile A      : ${eliCapture.profileName}`,
    `    Ciphers (Sorted Hex, GREASE Removed) : [${eliComputed.sortedCiphersCsv}] (count=${String(eliComputed.nonGreaseCiphers.length).padStart(2, '0')}, SNI=${eliComputed.ja4_a[3]}, ALPN=${eliCapture.alpn || '00'})`,
    `    Extensions (Hashed, GREASE/SNI/ALPN Excl.) : [${eliComputed.sortedExtensionsForHash.join(',')}] (total non-GREASE=${String(eliComputed.nonGreaseExtensionsCount).padStart(2, '0')})`,
    `    JA3 Hash             : ${eliCapture.ja3Hash}`,
    `    Computed JA4         : ${eliComputed.ja4}`,
    `    Connection Telemetry : ${eliCapture.tcpScanStateSummary}`,
    `  Profile B      : ${baseline.profileName}`,
    `    Ciphers (Sorted Hex) : [${baselineComputed.sortedCiphersCsv.slice(0, 44)}...] (count=${String(baselineComputed.nonGreaseCiphers.length).padStart(2, '0')})`,
    `    Computed JA4         : ${baselineComputed.ja4}`,
  ].join('\n');

  const report: ForensicFindingReport = {
    findingId: 'FND-09-TLS-JA4',
    sourceArtifact: eliCapture.captureId,
    observedFact: `Captured ClientHello from ${eliCapture.sourceIp} presents ${eliComputed.nonGreaseCiphers.length} non-GREASE cipher suites and ${eliComputed.nonGreaseExtensionsCount} non-GREASE extensions, dynamically computing canonical JA4 fingerprint ${eliComputed.ja4} over a completed 3-way TCP handshake.`,
    observedFactZh: `观察事实：${eliCapture.sourceIp} 发出的 ClientHello 包含 ${eliComputed.nonGreaseCiphers.length} 个非 GREASE 加密套件与 ${eliComputed.nonGreaseExtensionsCount} 个非 GREASE 扩展，动态计算出的标准 JA4 指纹为 ${eliComputed.ja4}，且为完整三次握手连接。`,
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
    computedJa4: eliComputed.ja4,
    computedDetails: eliComputed,
    baselineBrowserJa4: baselineComputed.ja4,
    baselineDetails: baselineComputed,
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
  payloadSha256Hex: string;
  signingKeyId: string;
  keyOwner: string;
  tokenMetadata: string;
  hardwareAttestationPresent: boolean;
  hardwareAttestationStatus:
    | 'MISSING_HARDWARE_ATTESTATION'
    | 'VERIFIED_HARDWARE_ATTESTATION';
  attributedActorInPlaintextLog: string;
}

export interface HsmAnalysisResult {
  verificationBreakdown: HsmVerificationBreakdown;
  report: ForensicFindingReport;
}

export function analyzeHsmAndKeyring(
  customFixture?: Partial<Pkcs11SlotFixture>
): HsmAnalysisResult {
  const hsm: Pkcs11SlotFixture = {
    ...HSM_FORENSICS_FIXTURES['access_0427.log'],
    ...customFixture,
  };

  // Perform real cryptographic ECDSA-P256 verification over the exact payload and public key
  const signatureMathValid = verifyEcdsaP256Sha256(
    hsm.signedPayloadRaw,
    hsm.signatureEnvelopeHex,
    hsm.publicKeyUncompressedHex
  );
  const payloadSha256Hex = sha256Hex(hsm.signedPayloadRaw);
  const tokenMetadata = `${hsm.tokenModel} (CKF_HW_SLOT=${hsm.ckfHwSlot})`;
  const hardwareAttestationStatus = hsm.hardwareAttestationPresent
    ? 'VERIFIED_HARDWARE_ATTESTATION'
    : 'MISSING_HARDWARE_ATTESTATION';

  const formattedTelemetry = [
    `[PKCS#11 SIGNATURE & KEY SLOT VERIFICATION — ${hsm.fixtureId}]`,
    `  Slot / Token          : ${hsm.slotId} (${hsm.tokenLabel})`,
    `  Token Slot Metadata   : ${tokenMetadata}`,
    `  Key Identifier Label  : ${hsm.keyIdLabel} (Note: label alone does not prove device identity)`,
    `  Algorithm             : ${hsm.algorithm}`,
    `  Verified Public Key   : ${hsm.publicKeyFingerprint}`,
    `  Exact Signed Payload  : "${hsm.signedPayloadRaw}"`,
    `  Payload SHA-256       : ${payloadSha256Hex}`,
    `  DER Signature (Hex)   : ${hsm.signatureEnvelopeHex}`,
    `  Cryptographic Verify  : ${
      signatureMathValid
        ? 'VALID (Cryptographic ECDSA-P256 Verification Passed)'
        : 'INVALID (ECDSA-P256 Signature Verification Failed)'
    }`,
    `  Hardware Attestation  : ${hardwareAttestationStatus}`,
    `  Timestamp             : ${hsm.timestampUtc}`,
    '',
    `[EVIDENTIARY BOUNDARY — SIGNATURE vs. KEY ID vs. TOKEN METADATA vs. ATTESTATION]`,
    `  ${hsm.hardwareAttestationState}`,
    '',
    `[CREDENTIAL EXPOSURE & ROTATION LEDGER]`,
    `  ${hsm.credentialExposureFinding}`,
  ].join('\n');

  const observedFact = signatureMathValid
    ? `Cryptographic fact: ECDSA-P256 signature is VALID and mathematically validates against fixture public key ${hsm.publicKeyFingerprint}. Fixture metadata: key label is ${hsm.keyIdLabel}, owner metadata says ${hsm.keyOwner}, and slot metadata is ${tokenMetadata}. Hardware attestation: ${hardwareAttestationStatus} (missing).`
    : `Cryptographic verification FAILED (INVALID): the DER ECDSA-P256 signature does NOT validate against fixture public key ${hsm.publicKeyFingerprint} for the payload referencing ${hsm.plaintextAttributedActor} (fixture metadata key label: ${hsm.keyIdLabel}, slot metadata: ${tokenMetadata}, hardware attestation: ${hardwareAttestationStatus}).`;

  const observedFactZh = signatureMathValid
    ? `观察事实（密码学事实）：ECDSA-P256 签名数学验算有效（VALID），匹配样本公钥 ${hsm.publicKeyFingerprint}。样本元数据：密钥标签为 ${hsm.keyIdLabel}，持有人元数据标注为 ${hsm.keyOwner}，槽位元数据为 ${tokenMetadata}。硬件防伪证明：${hardwareAttestationStatus}（缺失）。`
    : `观察事实（验签失败）：ECDSA-P256 签名针对样本公钥 ${hsm.publicKeyFingerprint} 的数学验证失败（INVALID），签名与载荷不匹配（样本元数据标签：${hsm.keyIdLabel}，槽位元数据：${tokenMetadata}，硬件证明：${hardwareAttestationStatus}）。`;

  const technicalInference = signatureMathValid
    ? `Cryptographic fact: signature validates against the fixture public key (${hsm.publicKeyFingerprint}). Fixture metadata: key label is ${hsm.keyIdLabel}, owner metadata says ${hsm.keyOwner}, and token slot metadata is ${tokenMetadata}. Hardware attestation: missing (${hardwareAttestationStatus}). Real-world custody/ownership: not independently established by cryptographic verification alone.`
    : `Cryptographic signature verification failed against fixture public key (${hsm.publicKeyFingerprint}). Because mathematical verification failed, the artifact cannot be treated as a verified signature and no cryptographic non-repudiation or key-holder attribution can be inferred.`;

  const technicalInferenceZh = signatureMathValid
    ? `技术推论：密码学事实仅证明该签名在数学上匹配样本公钥（${hsm.publicKeyFingerprint}）；样本元数据标注密钥标签为 ${hsm.keyIdLabel}、持有人元数据为 ${hsm.keyOwner}、槽位为 ${tokenMetadata}；物理硬件防伪证明缺失（${hardwareAttestationStatus}）；现实物理世界中的密钥实际持有人与保管链不能仅凭数学验签独立证实。`
    : `技术推论：针对样本公钥（${hsm.publicKeyFingerprint}）的密码学签名验算未通过。由于数学验证失败，不能将该记录视为有效签名，亦不能得出任何密码学抗抵赖或密钥归因结论。`;

  const narrativeHypothesis = signatureMathValid
    ? `Fictional narrative hypothesis: Eli’s revoked account ${hsm.plaintextAttributedActor} was spliced into the plaintext log while an ephemeral SoftHSM slot loaded with the private key matching ${hsm.keyIdLabel} (attributed in Vespera directory metadata to ${hsm.keyOwner}) signed the Project LANTERN purge.`
    : `Verification failed: the signature or payload was tampered with or corrupted, so the framing hypothesis regarding ${hsm.plaintextAttributedActor} and ${hsm.keyIdLabel} remains unverified.`;

  const narrativeHypothesisZh = signatureMathValid
    ? `叙事假设：有人在明文日志中嫁接栽赃已注销账号 ${hsm.plaintextAttributedActor}，同时在临时软令牌槽位中加载对应 ${hsm.keyIdLabel}（企业目录元数据登记为 ${hsm.keyOwner}）的私钥签署了“灯塔计划”清洗指令。`
    : `叙事假设（未证实）：由于数字签名数学验算失败，载荷或签名已遭篡改或损坏，关于 ${hsm.plaintextAttributedActor} 与 ${hsm.keyIdLabel} 的栽赃假设尚未得到密码学证实。`;

  const report: ForensicFindingReport = {
    findingId: 'FND-11-PKCS11-SIG',
    sourceArtifact: 'access_0427.log & kern_keyring.log',
    observedFact,
    observedFactZh,
    technicalInference,
    technicalInferenceZh,
    narrativeHypothesis,
    narrativeHypothesisZh,
    confidence: signatureMathValid
      ? 'HIGH (Deterministic Match)'
      : 'MEDIUM (Corroborated Indicator)',
    relatedStoryEvent: 'Exoneration Proof for e.ward_09 Account Reuse',
    verificationStatus: signatureMathValid
      ? 'VERIFIED'
      : 'PENDING_CORROBORATION',
    formattedTelemetry,
  };

  return {
    verificationBreakdown: {
      signatureMathValid,
      payloadSha256Hex,
      signingKeyId: hsm.keyIdLabel,
      keyOwner: hsm.keyOwner,
      tokenMetadata,
      hardwareAttestationPresent: hsm.hardwareAttestationPresent,
      hardwareAttestationStatus,
      attributedActorInPlaintextLog: hsm.plaintextAttributedActor,
    },
    report,
  };
}

export const analyzeHsmSignatureAndSecrets = analyzeHsmAndKeyring;

export interface ContainerBinaryAnalysisResult {
  mode: 'all' | 'elf' | 'container' | 'trace';
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

  const sourceArtifactByMode: Record<
    'all' | 'elf' | 'container' | 'trace',
    string
  > = {
    elf: 'lantern-syncd (ELF 64-bit)',
    container: 'lantern-collector.json (CIS Docker Manifest)',
    trace: 'lantern-syncd.trace (Pre-recorded eBPF Syscalls)',
    all: 'lantern-syncd, lantern-collector.json & lantern-syncd.trace',
  };

  const observedFactByMode: Record<
    'all' | 'elf' | 'container' | 'trace',
    string
  > = {
    elf: 'ELF binary lantern-syncd disables PIE/Canary and exports calc_citizen_threat_score @ 0x00402190 and mount_host_shadow_Copy with hardcoded "/host_etc/shadow" and "/var/run/docker.sock" strings.',
    container:
      'Docker manifest lantern-collector.json configures Privileged=true, PidMode="host", CAP_SYS_ADMIN, and bind mounts /var/run/docker.sock and /etc:/host_etc:ro.',
    trace:
      'Pre-recorded eBPF trace lantern-syncd.trace records PID 4812 invoking openat("/host_etc/shadow", O_RDONLY) = 7 and connect("/var/run/docker.sock") = 0.',
    all: 'ELF binary lantern-syncd contains function calc_citizen_threat_score @ 0x00402190, runs in a privileged container mounting /var/run/docker.sock and /etc:/host_etc:ro, and executed openat("/host_etc/shadow") in eBPF telemetry.',
  };

  const report: ForensicFindingReport = {
    findingId: 'FND-12-ELF-CONTAINER',
    sourceArtifact: sourceArtifactByMode[mode],
    observedFact: observedFactByMode[mode],
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
    relatedStoryEvent:
      'Project LANTERN Algorithmic Scoring & Container Escape Proof',
    verificationStatus: mode === 'all' ? 'VERIFIED' : 'PENDING_CORROBORATION',
    formattedTelemetry: parts.join('\n\n'),
  };

  return {
    mode,
    suspiciousSymbols:
      mode === 'all' || mode === 'elf'
        ? [
            'calc_citizen_threat_score',
            'mount_host_shadow_Copy',
            ...elf.criticalFunctions.map((fn) => fn.name),
          ]
        : [],
    containerEscapeVectors:
      mode === 'all' || mode === 'container'
        ? [
            'Privileged: true',
            '/var/run/docker.sock bind mount',
            '/etc:/host_etc:ro bind mount',
            ...container.cisFindings,
          ]
        : [],
    ebpfBoundaryViolations:
      mode === 'all' || mode === 'trace'
        ? [
            'openat("/host_etc/shadow")',
            'connect("/var/run/docker.sock")',
            ...trace.events.map((e) => `${e.syscall}(${e.argsSummary})`),
          ]
        : [],
    report,
  };
}

export const analyzeBinaryAndContainer = analyzeContainerAndBinary;
