export interface CanaryArtifactFixture {
  fixtureId: string;
  targetName: string;
  artifactType: 'document_beacon' | 'network_honeypot';
  embeddedTokenId: string;
  dnsBeaconDomain: string;
  httpWebhookPattern: string;
  syntheticServiceSignatures: string[];
  siemRuleId: string;
  deceptionAssessment: string;
  deceptionAssessmentZh: string;
}

export const CANARY_HONEYPOT_FIXTURES: Record<string, CanaryArtifactFixture> = {
  'incident_0427_brief.pdf': {
    fixtureId: 'fix-canary-doc-0427',
    targetName: 'incident_0427_brief.pdf (Appendix B Reference Link)',
    artifactType: 'document_beacon',
    embeddedTokenId: 'CNRY-VESPERA-DOC-9904',
    dnsBeaconDomain: '9904-e-ward.canary.vespera-sec.internal',
    httpWebhookPattern:
      'https://telemetry-sink.vespera.internal/pixel/v2/open?tok=CNRY-VESPERA-DOC-9904',
    syntheticServiceSignatures: [
      'PDF /OpenAction URI trigger pointing to unique per-recipient DNS subdomain',
      'Zero-width remote template fetch embedded in XMP stream',
    ],
    siemRuleId: 'SIEM-DECEPT-104 (Document Canary Tripwire)',
    deceptionAssessment:
      'Static analysis confirms a dormant Canary Token URI inside the template attachment header. Opening with external resource fetching enabled would resolve 9904-e-ward.canary.vespera-sec.internal.',
    deceptionAssessmentZh:
      '静态分析确认附件模板头中潜藏了 Canary Token 远程引用。若在允许联网渲染的阅读器中打开，将立即触发针对 9904-e-ward.canary.vespera-sec.internal 的告警解析。',
  },
  '10.88.14.9': {
    fixtureId: 'fix-honeypot-host-10-88-14-9',
    targetName: '10.88.14.9 (vespera-enclave-gw.corp)',
    artifactType: 'network_honeypot',
    embeddedTokenId: 'HNET-ENCLAVE-CANARY-9999',
    dnsBeaconDomain: 'enclave-trap.vespera.internal',
    httpWebhookPattern: 'tcp://10.88.14.9:9999 (soc-canary-ids)',
    syntheticServiceSignatures: [
      'Port 9999/tcp (soc-canary-ids) responds in 0.12ms with synthetic HSM banner while real HSM ports require mutual TLS',
      'TCP window size (65535) and static ISN generator match user-space honeypot daemon rather than Linux kernel TCP stack on 10.88.4.22',
      'SIEM Correlation Rule #SOC-HONEY-01 automatically adds +15% Corporate Suspicion and +15% Player Exposure on any active SYN probe to 10.88.14.9',
    ],
    siemRuleId: 'SIEM-HONEY-001 (Executive Enclave Active Intrusion Canary)',
    deceptionAssessment:
      '10.88.14.9 is an active Executive Enclave honey-trap monitored by Director Marcus Hale’s SOC. Passive telemetry comparison proves port 9999 is a synthetic decoy designed to log caller IPs and elevate suspicion (+15%) and exposure (+15%) if actively probed.',
    deceptionAssessmentZh:
      '10.88.14.9 是由安全总监 Marcus Hale 监控的主动高管飞地蜜罐。被动遥测对比证实 9999 端口为仿真诱捕服务：一旦对其执行主动探测（probe 10.88.14.9），将立即触发 +15% 企业怀疑度与 +15% 暴露度惩罚。',
  },
};
