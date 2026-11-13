export interface Pkcs11SlotFixture {
  fixtureId: string;
  slotId: string;
  tokenLabel: string;
  tokenModel: string;
  ckfHwSlot: boolean;
  keyIdLabel: string;
  keyOwner: string;
  algorithm: string;
  publicKeyUncompressedHex: string;
  publicKeyPem: string;
  publicKeyFingerprint: string;
  signedPayloadRaw: string;
  signatureEnvelopeHex: string;
  timestampUtc: string;
  plaintextAttributedActor: string;
  hardwareAttestationPresent: boolean;
  hardwareAttestationStatus: 'MISSING_HARDWARE_ATTESTATION' | 'VERIFIED_HARDWARE_ATTESTATION';
  hardwareAttestationState: string;
  hardwareAttestationStateZh: string;
  credentialExposureFinding: string;
  credentialExposureFindingZh: string;
}

/**
 * Fictional ECDSA-P256 (prime256v1 / secp256r1) key pair and real ASN.1 DER signature
 * over `signedPayloadRaw`.
 *
 * Signature validity is NEVER hardcoded on the fixture; it is cryptographically verified
 * at runtime by `verifyEcdsaP256Sha256(signedPayloadRaw, signatureEnvelopeHex, publicKeyUncompressedHex)`.
 *
 * Evidentiary Attribution Boundary:
 * - Cryptographic fact: The DER ECDSA-P256 signature mathematically validates against the
 *   supplied fixture public key (`04708f1a42...`, `SHA256:11:FA:C3:75...`).
 * - Fixture metadata: Key label is `M_HALE_SEC_01`, owner metadata says `Director Marcus Hale`,
 *   and token slot metadata is `SoftHSM-Emulator v2.6` with `CKF_HW_SLOT=false`.
 * - Hardware attestation: `MISSING_HARDWARE_ATTESTATION` (`hardwareAttestationPresent: false`).
 * - Real-world custody/ownership: Not independently established by mathematical signature
 *   verification alone (a valid signature proves possession of the private key corresponding to
 *   the fixture public key, not physical person or hardware custody).
 */
export const HSM_FORENSICS_FIXTURES: Record<string, Pkcs11SlotFixture> = {
  'access_0427.log': {
    fixtureId: 'fix-pkcs11-slot-0427',
    slotId: 'PKCS11_SLOT_0x02',
    tokenLabel: 'VESPERA_EXEC_KEYRING_TOKEN',
    tokenModel: 'SoftHSM-Emulator v2.6',
    ckfHwSlot: false,
    keyIdLabel: 'M_HALE_SEC_01',
    keyOwner: 'Director Marcus Hale',
    algorithm: 'ECDSA-P256-SHA256 (CKM_ECDSA_SHA256)',
    publicKeyUncompressedHex:
      '04708f1a42b82ab02951966d2a67b2f57fb9a96cbe0c7e337733ef58aa83088491332d7386712b3b53ff566f7f2bc0c2cfb8aba2ce346572d33b5802fc0d2d789d',
    publicKeyPem: [
      '-----BEGIN PUBLIC KEY-----',
      'MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEcI8aQrgqsClRlm0qZ7L1f7mpbL4M',
      'fjN3M+9YqoMIhJEzLXOGcSs7U/9Wb38rwMLPuKuizjRlctM7WAL8DS14nQ==',
      '-----END PUBLIC KEY-----',
    ].join('\n'),
    publicKeyFingerprint:
      'SHA256:11:FA:C3:75:FA:34:46:8E:8D:FF:3F:47:2E:D9:74:DE',
    signedPayloadRaw:
      'REACTIVATE_UID=e.ward_09|PURGE_JOB=9904|TS=2028-04-27T02:14:11Z|SLOT=0x02|KEY_ID=M_HALE_SEC_01',
    signatureEnvelopeHex:
      '3045022100f551afb0cec0965b9a428eb2dcbcf982cf4e3130944b1aad8bf403237b69e8ea022036148e217f1c2c109f6625feea996e64ad506ea8c2ffc70f1a798cf6c956908b',
    timestampUtc: '2028-04-27T02:14:11Z (during 14-minute NTP clock rollback window)',
    plaintextAttributedActor: 'e.ward_09',
    hardwareAttestationPresent: false,
    hardwareAttestationStatus: 'MISSING_HARDWARE_ATTESTATION',
    hardwareAttestationState:
      'EVIDENTIARY ATTRIBUTION BOUNDARY: (1) Cryptographic fact: signature validates against the fixture public key SHA256:11:FA:C3:75...; (2) Fixture metadata: key label is M_HALE_SEC_01, owner metadata says Director Marcus Hale, and slot metadata is SoftHSM-Emulator v2.6 (CKF_HW_SLOT=false); (3) Hardware attestation: MISSING_HARDWARE_ATTESTATION (missing); (4) Real-world custody/ownership: not independently established by cryptographic verification alone.',
    hardwareAttestationStateZh:
      '取证归因边界说明：(1) 密码学事实：签名在数学上通过样本公钥 SHA256:11:FA:C3:75... 验算；(2) 样本元数据：密钥标签为 M_HALE_SEC_01，持有人元数据标注为 Director Marcus Hale，槽位元数据为 SoftHSM-Emulator v2.6 (CKF_HW_SLOT=false)；(3) 硬件防伪证明：MISSING_HARDWARE_ATTESTATION（缺失）；(4) 物理世界保管与归属关系：不能仅凭签名数学验算独立证实。',
    credentialExposureFinding:
      'Secrets Scan & Rotation Ledger: e.ward_09 interactive credentials were revoked 2027-08-14; unrotated service token svc_lantern_sync (0x9F4A2C) remained in collector env while purge #9904 carries a signature matching fixture public key SHA256:11:FA:C3:75... (fixture label M_HALE_SEC_01, owner metadata Marcus Hale) on SoftHSM slot 0x02.',
    credentialExposureFindingZh:
      '凭据扫描与轮换账本比对：e.ward_09 的交互式凭据早于 2027-08-14 注销；而 #9904 清洗记录的签名匹配样本公钥 SHA256:11:FA:C3:75...（样本标签 M_HALE_SEC_01，持有人元数据标注为 Marcus Hale，槽位 0x02 软令牌）。',
  },
};
