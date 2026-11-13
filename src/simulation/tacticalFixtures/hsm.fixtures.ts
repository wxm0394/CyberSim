export interface Pkcs11SlotFixture {
  fixtureId: string;
  slotId: string;
  tokenLabel: string;
  keyIdLabel: string;
  algorithm: string;
  publicKeyFingerprint: string;
  signatureEnvelopeHex: string;
  signedPayloadDigest: string;
  signatureValid: boolean;
  timestampUtc: string;
  hardwareAttestationState: string;
  hardwareAttestationStateZh: string;
  credentialExposureFinding: string;
  credentialExposureFindingZh: string;
}

export const HSM_FORENSICS_FIXTURES: Record<string, Pkcs11SlotFixture> = {
  'access_0427.log': {
    fixtureId: 'fix-pkcs11-slot-0427',
    slotId: 'PKCS11_SLOT_0x02',
    tokenLabel: 'VESPERA_EXEC_KEYRING_TOKEN',
    keyIdLabel: 'M_HALE_SEC_01',
    algorithm: 'ECDSA-P256-SHA256 (CKM_ECDSA_SHA256)',
    publicKeyFingerprint: 'SHA256:9C:44:81:E2:0B:77:19:4A:CC:01:84:F2:11:90:E3:55',
    signatureEnvelopeHex: '3045022100d48b91e02f994a11...02206a1198c400e2b771',
    signedPayloadDigest:
      'SHA256(REACTIVATE_UID=e.ward_09|PURGE_JOB=9904|TS=2028-04-27T01:55:49Z)',
    signatureValid: true,
    timestampUtc: '2028-04-27T01:55:49Z (14 minutes after NTP clock rollback)',
    hardwareAttestationState:
      'DISTINCTION NOTE: A key label string ("M_HALE_SEC_01") in a software PKCS#11 token can be forged if examined alone. However, mathematical verification of the ECDSA-P256 signature against Vespera’s offline Corporate Directory Public Key (SHA256:9C:44:81...), combined with the X.509 hardware slot attestation chain in kern_keyring.log, confirms the private key assigned to Marcus Hale’s executive key slot signed the reactivation.',
    hardwareAttestationStateZh:
      '取证边界说明：单凭软件 PKCS#11 槽位的文本标签（"M_HALE_SEC_01"）不足以证明物理硬件身份。但通过将 ECDSA-P256 签名与离线企业公钥目录（SHA256:9C:44:81...）进行密码学验签，并结合 kern_keyring.log 中的密钥轮换与认证记录，可形成证明该操作由 Marcus Hale 授权密钥签署的完整证据链。',
    credentialExposureFinding:
      'Secrets Scan & Rotation Ledger: e.ward_09 interactive credentials were revoked 2027-08-14; unrotated service token svc_lantern_sync (0x9F4A2C) was left hardcoded in collector env while purge #9904 was signed by key SHA256:9C:44:81... at 01:55:49 AM.',
    credentialExposureFindingZh:
      '凭据扫描与轮换账本比对：e.ward_09 的交互式密码早于 8 个月前（2027-08-14）注销；而 01:55:49 AM 的 #9904 日志清洗与账号重激活指令，是由公钥指纹 SHA256:9C:44:81...（登记于安全总监名下）完成的数学签名。',
  },
};
