import { Ja4ClientHelloInput } from '../cryptoPrimitives';

export interface TlsClientHelloFixture extends Ja4ClientHelloInput {
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
  signatureAlgorithmsHex: string[];
  alpn: string;
  ja3String: string;
  ja3Hash: string;
  tcpScanStateSummary: string;
  siemCorrelationNote: string;
  siemCorrelationNoteZh: string;
}

/**
 * Raw ClientHello fixtures in wire order (including RFC 8701 GREASE values).
 * Canonical JA4 strings are NOT trusted from static strings; they are computed dynamically
 * by `computeCanonicalJa4()` in `src/simulation/cryptoPrimitives.ts`.
 *
 * Known-Answer Reference Vectors:
 * - `captured_tls_0427_eli_tool`:
 *   4 non-GREASE ciphers ('1301,1302,1303,c02f') -> sha256[:12] = '77f0cd3447db'
 *   6 non-GREASE extensions (4 hashed: '000a,000d,002b,0033' + sig_algs '0403,0804,0401') -> sha256[:12] = '5d4d534e3685'
 *   Computed JA4: 't13d0406h2_77f0cd3447db_5d4d534e3685'
 *
 * - `captured_tls_0427_standard_browser` (FoxIO official JA4 specification test vector):
 *   15 non-GREASE ciphers -> sha256[:12] = '8daaf6152771'
 *   16 non-GREASE extensions (14 hashed + 8 sig_algs) -> sha256[:12] = 'e5627efa2ab1'
 *   Computed JA4: 't13d1516h2_8daaf6152771_e5627efa2ab1'
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
    // Wire-order cipher suites including GREASE value '0a0a' and unsorted 1302 before 1301
    cipherSuitesHex: ['0a0a', '1302', '1301', '1303', 'c02f'],
    // Wire-order extensions including GREASE value 'dada', SNI '0000', ALPN '0010', and unsorted extensions
    extensionsHex: ['dada', '0000', '0010', '0033', '002b', '000d', '000a'],
    // Wire-order signature algorithms
    signatureAlgorithmsHex: ['0403', '0804', '0401'],
    alpn: 'h2',
    ja3String: '771,4866-4865-4867-49199,0-16-51-43-13-10,29-23-24,0',
    ja3Hash: 'a7d91c4408b2e551908c112a99f04b12',
    tcpScanStateSummary:
      'Complete 3-way TCP handshake (SYN -> SYN-ACK -> ACK) on single port :8443 (18 packets over 42.8s)',
    siemCorrelationNote:
      'Vespera SIEM Rule #SOC-JA4-09 matched the 4-cipher/6-extension ClientHello (t13d0406h2_77f0cd3447db_5d4d534e3685) previously cataloged on Eli Ward’s support workstation.',
    siemCorrelationNoteZh:
      'Vespera SIEM 规则 #SOC-JA4-09 命中了 4 加密套件/6 扩展的 ClientHello 指纹 (t13d0406h2_77f0cd3447db_5d4d534e3685)，该指纹与 Eli 在职期间登记的诊断脚本一致。',
  },
  captured_tls_0427_standard_browser: {
    fixtureId: 'fix-tls-clienthello-firefox-baseline',
    captureId: 'captured_tls_0427_baseline',
    profileName: 'Standard Desktop Browser Baseline (FoxIO JA4 Spec Vector)',
    sourceIp: '10.0.2.15',
    destinationIp: '10.88.4.22',
    destinationPort: 443,
    tlsVersion: '1.3',
    transport: 't',
    sniPresent: true,
    sniHostname: 'lantern-db.vespera.internal',
    // Wire-order cipher suites including GREASE '1a1a' + 15 standard suites
    cipherSuitesHex: [
      '1a1a',
      '1301',
      '1302',
      '1303',
      'c02b',
      'c02f',
      'c02c',
      'c030',
      'cca9',
      'cca8',
      'c013',
      'c014',
      '009c',
      '009d',
      '002f',
      '0035',
    ],
    // Wire-order extensions including GREASE '2a2a' + 16 standard extensions (including 0000 SNI and 0010 ALPN)
    extensionsHex: [
      '2a2a',
      '0000',
      '0017',
      'ff01',
      '000a',
      '000b',
      '0023',
      '0010',
      '0005',
      '0012',
      '0033',
      '002b',
      '002d',
      '000d',
      '001b',
      '0015',
      '4469',
    ],
    // Wire-order signature algorithms including GREASE 'eaea' + 8 signature schemes
    signatureAlgorithmsHex: [
      'eaea',
      '0403',
      '0804',
      '0401',
      '0503',
      '0805',
      '0501',
      '0806',
      '0601',
    ],
    alpn: 'h2',
    ja3String:
      '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-18-51-43-45-13-27-21-17513,29-23-24,0',
    ja3Hash: 'e921b0048a7712f319c08812d44e1190',
    tcpScanStateSummary: 'Single HTTPS :443 session (ESTAB -> FIN_WAIT_2)',
    siemCorrelationNote:
      'Baseline browser profile uses 15 non-GREASE cipher suites and 16 non-GREASE extensions; canonically computed JA4 is t13d1516h2_8daaf6152771_e5627efa2ab1.',
    siemCorrelationNoteZh:
      '标准浏览器具有 15 个非 GREASE 加密套件与 16 个非 GREASE 扩展，按 JA4 规范排序计算后为 t13d1516h2_8daaf6152771_e5627efa2ab1，与 Eli 工具链截然不同。',
  },
};
