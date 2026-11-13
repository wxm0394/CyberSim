export interface TlsClientHelloFixture {
  fixtureId: string;
  captureId: string;
  profileName: string;
  sourceIp: string;
  destinationIp: string;
  destinationPort: number;
  tlsVersion: '1.3' | '1.2';
  transport: 't' | 'q';
  sniPresent: boolean;
  sniHostname: string;
  cipherSuitesHex: string[];
  extensionsHex: string[];
  alpn: string;
  ja3String: string;
  ja3Hash: string;
  ja4Fingerprint: string;
  tcpScanStateSummary: string;
  siemCorrelationNote: string;
  siemCorrelationNoteZh: string;
}

/**
 * Deterministic JA4 format:
 *   Part A: [t|q][version][d|i][cipher_count_2d][ext_count_2d][alpn_2c]
 *   Part B: first 12 hex chars of SHA-256 of canonically sorted cipher hex list
 *   Part C: first 12 hex chars of SHA-256 of canonically sorted extensions (excluding SNI 0000 and ALPN 0010)
 */
export const TLS_FINGERPRINT_FIXTURES: Record<string, TlsClientHelloFixture> = {
  captured_tls_0427_eli_tool: {
    fixtureId: 'fix-tls-clienthello-eli-0427',
    captureId: 'captured_tls_0427',
    profileName: 'Eli Legacy Diagnostics CLI (tele-diag-curl/7.88-custom)',
    sourceIp: '10.0.2.15',
    destinationIp: '10.88.4.22',
    destinationPort: 8443,
    tlsVersion: '1.3',
    transport: 't',
    sniPresent: true,
    sniHostname: 'lantern-db.vespera.internal',
    cipherSuitesHex: ['1301', '1302', '1303', 'c02f'],
    extensionsHex: ['0000', '000a', '000b', '000d', '002b', '0033'],
    alpn: 'h2',
    ja3String: '771,4865-4866-4867-49199,0-10-11-13-43-51,29-23-24,0',
    ja3Hash: 'a7d91c4408b2e551908c112a99f04b12',
    ja4Fingerprint: 't13d0406h2_55b375c5d22e_a19f04c8812b',
    tcpScanStateSummary:
      'Full 3-way TCP connect() on :22/:443 (ESTAB) followed by inline RST (TTL=128) on :8443',
    siemCorrelationNote:
      'Vespera SIEM Rule #SOC-JA4-09 matched static 4-cipher/6-extension ClientHello (t13d0406h2_55b375c5d22e_a19f04c8812b) previously cataloged on Eli Ward’s support workstation.',
    siemCorrelationNoteZh:
      'Vespera SIEM 规则 #SOC-JA4-09 命中了固定的 4 加密套件/6 扩展 ClientHello 指纹 (t13d0406h2_55b375c5d22e_a19f04c8812b)，该指纹与 Eli 在职期间登记的诊断脚本完全一致。',
  },
  captured_tls_0427_standard_browser: {
    fixtureId: 'fix-tls-clienthello-firefox-baseline',
    captureId: 'captured_tls_0427_baseline',
    profileName: 'Standard GreyOS Firefox ESR 128 Baseline',
    sourceIp: '10.0.2.15',
    destinationIp: '10.88.4.22',
    destinationPort: 443,
    tlsVersion: '1.3',
    transport: 't',
    sniPresent: true,
    sniHostname: 'lantern-db.vespera.internal',
    cipherSuitesHex: [
      '1301',
      '1303',
      '1302',
      'c02b',
      'c02f',
      'cca9',
      'cca8',
      'c02c',
      'c030',
      'c00a',
      'c009',
      'c013',
      'c014',
      '009c',
      '009d',
    ],
    extensionsHex: [
      '0000',
      '0017',
      'ff01',
      '000a',
      '000b',
      '0023',
      '0010',
      '0005',
      '0022',
      '0033',
      '002b',
      '000d',
      '001c',
      '0015',
      '0029',
      '002d',
    ],
    alpn: 'h2',
    ja3String:
      '771,4865-4867-4866-49195-49199-52393-52392-49196-49200-49162-49161-49171-49172-156-157,0-23-65281-10-11-35-16-5-34-51-43-13-28-21-41-45,29-23-24-25,0',
    ja3Hash: 'e921b0048a7712f319c08812d44e1190',
    ja4Fingerprint: 't13d1516h2_8daaf6152771_e5627efa2ab1',
    tcpScanStateSummary: 'Single HTTPS :443 session (ESTAB -> FIN_WAIT_2)',
    siemCorrelationNote:
      'Baseline browser profile uses 15 cipher suites and 16 extensions; canonically sorted JA4 is t13d1516h2_8daaf6152771_e5627efa2ab1.',
    siemCorrelationNoteZh:
      '标准浏览器具有 15 个加密套件与 16 个扩展，按 JA4 规范排序哈希后为 t13d1516h2_8daaf6152771_e5627efa2ab1，与 Eli 工具链截然不同。',
  },
};
