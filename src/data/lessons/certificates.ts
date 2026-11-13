import { LearningLesson } from '../../learning/lessonTypes';

export const CERTIFICATES_LESSON: LearningLesson = {
  id: 'lesson_03_certificates',
  levelNumber: 3,
  code: 'LEVEL 03 · MVP LAB 02',
  title: 'The Broken Trust',
  titleZh: '被伪造的信任',
  difficulty: 3,
  sourceTrack: 'network_internet',
  category: 'identity_trust',
  prerequisites: ['lesson_02_dns'],
  isMvpCoreLab: true,
  narrativeHook:
    'Even after fixing DNS so `lantern-db.vespera.internal` resolves to `10.88.4.22`, your browser and TLS client present a certificate that looks valid at first glance—complete with a green lock icon on corporate-managed machines. Why? Because Vespera pre-installed a rogue root CA on employee systems to silently decrypt TLS sessions.',
  narrativeHookZh:
    '即便修复了 DNS 使域名正确指向 `10.88.4.22`，TLS 握手返回的证书表面上依然显示“域名匹配且未过期”。为什么？因为安全总监 Marcus Hale 在旧办公系统中预置了企业自签根证书，正在对加密流量实施透明中间人解密（MITM）。',
  concepts: [
    {
      id: 'concept_pki_ca_chain',
      title: 'Digital Certificates & Certificate Authority (CA) Chain of Trust',
      titleZh: '数字证书与 CA（证书颁发机构）信任链',
      summary:
        'TLS encryption alone only guarantees that traffic is encrypted between you and whoever holds the private key—it does not guarantee WHO holds that key. A digital certificate binds a domain’s public key to a verified identity via a cryptographic signature from a trusted Root Certificate Authority (CA).',
      summaryZh:
        '单纯的加密通道只能保证“传输过程不被旁人看懂”，却无法保证“对端真的就是你想访问的服务器”。数字证书通过受信任根证书颁发机构（Root CA）的数字签名，将域名与服务器公钥绑定，从而解决身份伪造问题。',
      keyTerms: ['X.509 Certificate', 'Root CA / Intermediate CA', 'Public Key Infrastructure (PKI)', 'SHA-256 Fingerprint'],
      practicalRule:
        'A green lock only means your OS trusts the issuing Root CA. If an adversary or corporation installs a rogue Root CA into your trust store, they can forge certificates for any domain.',
      practicalRuleZh:
        '“证书通过校验”仅代表你的系统信任签发它的根 CA。如果电脑被植入了企业监控根证书或恶意根 CA，攻击者就能为任意域名签发伪造证书并解密全部 HTTPS 流量。',
      diagramLines: [
        'Authentic Chain : [ISRG Root X1] ---> [Let’s Encrypt R3] ---> [lantern-db (SHA256: 8A:4F...)]',
        'MITM Forged Chain: [Vespera-Shadow-Root-G2] -> [Hale-Inspect-Proxy] -> [lantern-db (SHA256: DE:AD...)]',
      ],
    },
    {
      id: 'concept_tls_sni_mitm',
      title: 'TLS Handshake, SNI Exposure & MITM Detection',
      titleZh: 'TLS 握手、SNI 明文暴露与中间人（MITM）取证',
      summary:
        'During a TLS ClientHello, the Server Name Indication (SNI) extension transmits the target hostname in plaintext so the server knows which certificate to present. Inline inspection appliances read the SNI and dynamically mint a forged leaf certificate signed by their own interception CA.',
      summaryZh:
        '在 TLS 握手的 ClientHello 阶段，SNI（服务器名称指示）字段通常以明文发送目标域名。内网深度包检测（DPI）设备读取 SNI 后，会动态生成一张同名伪造证书并用私有根 CA 签名，实施中间人劫持。',
      keyTerms: ['ClientHello & SNI', 'MITM (Man-in-the-Middle)', 'Certificate Pinning', 'Trust Store Audit'],
      practicalRule:
        'Always compare the certificate’s Issuer CA and SHA-256 fingerprint against an out-of-band reference (such as Nadia’s offline manifest) before transmitting credentials or decryption keys.',
      practicalRuleZh:
        '在传输敏感凭据或密钥前，必须核对服务端证书的颁发机构（Issuer CA）及 SHA-256 指纹是否与离线可信清单一致。',
      diagramLines: [
        'ClientHello (SNI: lantern-db.vespera.internal)',
        '   └──> [Inline DPI Box] intercepts & presents Issuer: CN=Vespera-Shadow-Root-G2',
        '   └──> Fingerprint mismatch vs. Nadia’s offline manifest -> MITM DETECTED!',
      ],
    },
  ],
  lab: {
    id: 'lab_03_cert_forensics',
    code: 'NETLAB-03 · MVP-02',
    title: 'TLS Certificate Chain & MITM Forensics Lab',
    titleZh: 'TLS 证书信任链与中间人伪造取证实验',
    objective:
      'Inspect the TLS handshake presented by `lantern-db.vespera.internal:443`, cross-check its Issuer CA and SHA-256 fingerprint against Nadia’s offline hardware manifest, and revoke the rogue corporate root CA (`Vespera-Shadow-Root-G2`).',
    objectiveZh:
      '抓取 `lantern-db.vespera.internal:443` 返回的 TLS 证书链，将其颁发机构（Issuer CA）和 SHA-256 指纹与 Nadia 的离线硬件清单比对，吊销伪造的企业监控根证书（`Vespera-Shadow-Root-G2`）。',
    environmentBanner: 'GREYOS SANDBOX // TLS X.509 INSPECTOR // TARGET: lantern-db.vespera.internal:443',
    initialSymptom:
      'TLS handshake to `lantern-db.vespera.internal:443` succeeds without a browser warning, but packet timing suggests an inline proxy is terminating and re-encrypting your session.',
    initialSymptomZh:
      '连接 `lantern-db.vespera.internal:443` 时未弹出常规过期警告，但握手时延与套件特征显示流量正在被某台内联设备解密重签。',
    nodes: [
      {
        id: 'node_tls_proxy',
        label: 'Hale-DPI-Interceptor',
        address: '10.88.4.1 (Inline MITM)',
        role: 'Transparent TLS Inspection Appliance (Forges Leaf Certs)',
        roleZh: '透明 TLS 流量解密设备（动态伪造终端证书）',
        status: 'compromised',
      },
      {
        id: 'node_trust_store',
        label: '/etc/ssl/certs/ca-certificates.crt',
        address: 'Local Trust Store',
        role: 'Contains dormantly injected Vespera-Shadow-Root-G2 CA',
        roleZh: '本地根证书库（残留 Vespera-Shadow-Root-G2 监控根证书）',
        status: 'suspect',
      },
    ],
    diagnosticActions: [
      {
        id: 'diag_cert_chain',
        label: 'Inspect Live Server X.509 Certificate Chain (openssl s_client)',
        labelZh: '抓取服务端实时返回的 X.509 证书链 (openssl s_client)',
        commandPreview: 'openssl s_client -connect 10.88.4.22:443 -servername lantern-db.vespera.internal',
        targetNode: '10.88.4.22:443',
        telemetryOutput: [
          'Certificate chain:',
          ' 0 s:CN = lantern-db.vespera.internal',
          '   i:C = US, O = Vespera Data Solutions, OU = SOC Intercept, CN = Vespera-Shadow-Root-G2',
          '   Validity: Not Before: Apr 27 01:40:00 2028 GMT (Minted 38 minutes ago!)',
          '   SHA256 Fingerprint: DE:AD:99:04:1B:7C:88:E2:41:00:FA:CE:19:84:00:11',
        ].join('\n'),
        telemetryOutputZh: [
          '服务端证书链详情：',
          ' 0 主题 (Subject): CN = lantern-db.vespera.internal',
          '   颁发者 (Issuer): O = Vespera Data Solutions, OU = SOC Intercept, CN = Vespera-Shadow-Root-G2',
          '   签发时间: Apr 27 01:40:00 2028 GMT（仅在 38 分钟前由内网动态签发！）',
          '   SHA256 指纹: DE:AD:99:04:1B:7C:88:E2:41:00:FA:CE:19:84:00:11',
        ].join('\n'),
        revealsClue:
          'CRITICAL: The certificate was dynamically minted 38 minutes ago by `OU=SOC Intercept, CN=Vespera-Shadow-Root-G2`!',
        revealsClueZh:
          '关键发现：该证书是在 38 分钟前由企业安全部拦截网桥 `OU=SOC Intercept, CN=Vespera-Shadow-Root-G2` 动态伪造签发的！',
        isCriticalClue: true,
      },
      {
        id: 'diag_cert_pin_compare',
        label: 'Compare Against Nadia’s Offline Hardware Pin & Local Trust Store',
        labelZh: '比对 Nadia 的离线硬件指纹清单与本地受信任根证书库',
        commandPreview: 'cert-verify --compare-pin /home/eli/Downloads/incident_0427/lantern_schema_brief.txt',
        targetNode: 'Local Trust Store',
        telemetryOutput: [
          '[OFFLINE HARDWARE PIN] Authentic Gateway SHA256: 8A:4F:22:C9:10:7B:EE:01:93:4A:55:D1:77:12:09:C4',
          '[LIVE INTERCEPTED PIN] Presented Gateway SHA256: DE:AD:99:04:1B:7C:88:E2:41:00:FA:CE:19:84:00:11',
          '[TRUST STORE AUDIT] Found rogue root CA in /usr/local/share/ca-certificates/vespera_shadow_root_g2.crt',
        ].join('\n'),
        telemetryOutputZh: [
          '【离线可信硬件指纹】真实网关 SHA256: 8A:4F:22:C9:10:7B:EE:01:93:4A:55:D1:77:12:09:C4',
          '【当前连接返回指纹】实时握手 SHA256: DE:AD:99:04:1B:7C:88:E2:41:00:FA:CE:19:84:00:11  [指纹严重不符！]',
          '【本地证书库审计】在 /usr/local/share/ca-certificates/ 发现被植入的监控根证书 vespera_shadow_root_g2.crt',
        ].join('\n'),
        revealsClue:
          'CRITICAL: SHA-256 fingerprint mismatch confirmed (`DE:AD:99...` vs authentic `8A:4F:22...`). A pre-installed Vespera root certificate is masking an active MITM proxy.',
        revealsClueZh:
          '关键发现：SHA-256 指纹完全不匹配（伪造 `DE:AD:99...` vs 真实 `8A:4F:22...`），旧系统残留的企业根证书掩盖了中间人劫持。',
        isCriticalClue: true,
      },
    ],
    resolutions: [
      {
        id: 'res_03_revoke_and_pin',
        label: 'Revoke Rogue Vespera-Shadow-Root-G2 CA & Enforce SHA-256 Certificate Pinning',
        labelZh: '吊销伪造的 Vespera-Shadow-Root-G2 根证书并强制锁定真实 SHA-256 指纹',
        commandPreview: 'cert-verify --revoke Vespera-Shadow-Root-G2 --pin-sha256 8A:4F:22:C9',
        approach: 'analytical',
        isOptimal: true,
        requiresDiagnosticIds: ['diag_cert_chain', 'diag_cert_pin_compare'],
        outcomeSummary:
          'Purged the rogue corporate root CA, enforced strict public-key pinning (`8A:4F:22...`), bypassed the DPI MITM proxy, and unlocked the Certificate Analyzer capability.',
        outcomeSummaryZh:
          '成功从系统信任库中剔除企业监控根证书，强制绑定真实公钥指纹 (`8A:4F:22...`) 绕过中间人解密，并解锁【证书与信任链分析器】。',
        suspicionDelta: -10,
        exposureDelta: -5,
        trustNadiaDelta: 5,
      },
      {
        id: 'res_03_ignore_tls_warn',
        label: 'Bypass Verification (`--insecure` / `NODE_TLS_REJECT_UNAUTHORIZED=0`)',
        labelZh: '忽略证书异常，使用 `--insecure` 强行传输明文会话密钥',
        commandPreview: 'curl --insecure https://lantern-db.vespera.internal/auth',
        approach: 'brute_force',
        isOptimal: false,
        requiresDiagnosticIds: [],
        outcomeSummary:
          'Disabling TLS certificate validation allowed Marcus Hale’s inline DPI proxy to decrypt your session headers in real time (+15% Corporate Suspicion, +15% Exposure).',
        outcomeSummaryZh:
          '使用 `--insecure` 跳过证书校验，导致 Marcus Hale 的内联解密网桥直接截获了你的会话载荷（企业怀疑度 +15%，暴露度 +15%）。',
        suspicionDelta: 15,
        exposureDelta: 15,
        trustNadiaDelta: -5,
      },
    ],
    storyApplication: {
      id: 'app_03_tls_mitm_shield',
      targetHostOrFile: '10.88.4.22',
      actionLabel: 'Run Certificate Analyzer to Strip Vespera MITM Root CA & Pin Authentic Key',
      actionLabelZh: '运行【证书分析器】吊销企业监控根证书并锁定真实网关公钥',
      analyticalCommand: 'cert-verify 10.88.4.22 --revoke-rogue-ca',
      bruteForceCommand: 'connect 10.88.4.22 --insecure',
      analyticalOutcome:
        'Revoked Vespera-Shadow-Root-G2 and pinned authentic gateway key, blinding Marcus Hale’s TLS inspection proxy (-10% Corporate Suspicion, -5% Exposure).',
      analyticalOutcomeZh:
        '已吊销 Vespera-Shadow-Root-G2 监控根证书并锁定真实网关公钥，使安全部的 TLS 流量审计设备彻底失明（怀疑度 -10%，暴露度 -5%）。',
      bruteForceOutcome:
        'Connecting with `--insecure` exposed your session headers to Vespera’s MITM appliance (+15% Corporate Suspicion, +15% Exposure).',
      bruteForceOutcomeZh:
        '盲目忽略证书校验导致通信内容被企业中间人网桥实时解密（怀疑度 +15%，暴露度 +15%）。',
      analyticalSuspicionDelta: -10,
      analyticalExposureDelta: -5,
      analyticalTrustDelta: 5,
      bruteForceSuspicionDelta: 15,
      bruteForceExposureDelta: 15,
    },
  },
  unlocks: {
    capabilities: ['certificate_analyzer'],
    tools: ['cert-verify'],
    badgeLabel: 'Certificate Analyzer',
    badgeLabelZh: 'X.509 证书与中间人分析器',
  },
  source: {
    repository: 'hoochanlon/fq-book',
    fork: 'wxm0394/fq-book',
    sectionPath: 'docs/abc/dc_zhenshu.md',
    sectionTitle: '数字证书、CA 信任机构与 HTTPS/TLS 安全原理',
    adaptationNote:
      'Adapted from fq-book chapter on digital certificates, Certificate Authorities (CA), and how rogue root certificates enable MITM interception.',
    adaptationNoteZh:
      '改编自《这本书能让你连接互联网》中关于数字证书、CA 签名验证机制以及伪造根证书中间人劫持的章节。',
  },
  reviewStatus: 'reviewed',
};
