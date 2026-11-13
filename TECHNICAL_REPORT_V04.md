# DEAD AIR — 城市静默 V0.4.1 Technical Architecture & Verification Report

## 1. Executive Summary
**DEAD AIR V0.4.1 (Tactical Security Engineering Expansion — Technical Integrity & Regression Patch)** incrementally extends the narrative hacker RPG (`Save Version 3`, `dead_air_save_v3`) with **Levels 08–12** adapted from **`Lauren-Bitten/CyberSecurity-Projects`** (upstream reference: **`CarterPerez-dev/Cybersecurity-Projects`**, license: `AGPL-3.0`). All modules operate strictly within an offline, passive-forensics boundary inside `GreyOS 6.4`.

---

## 2. Epistemic & Implementation Boundary Classification

To maintain technical rigor, every output in the V0.4.1 engine is explicitly classified into one of four categories:

### 2.1 Actually Calculated Results (`src/simulation/cryptoPrimitives.ts`, `src/simulation/tacticalEngine.ts`)
- **FIPS 180-4 SHA-256 Digest Calculation (`sha256Hex`)**:
  - Computes real 256-bit SHA-256 hex digests synchronously in pure TypeScript/JavaScript over UTF-8 strings or `Uint8Array` buffers, cross-verified in `src/game/rules.test.ts` against Node's `node:crypto.createHash('sha256')`.
- **Dynamic JA4 TLS ClientHello Fingerprint Computation (`computeCanonicalJa4`)**:
  - Dynamically computes `JA4_a`, `JA4_b`, and `JA4_c` from raw wire-order `ClientHello` fixture fields (`transport`, `tlsVersion`, `sniPresent`, `sniHostname`, `alpn`, `cipherSuitesHex`, `extensionsHex`, `signatureAlgorithmsHex`). Never trusts or returns a precomputed string.
  - **GREASE Exclusion (`isGreaseHex`)**: Strips RFC 8701 GREASE values (`0a0a`, `1a1a`, `2a2a`, ..., `fafa`) prior to counting or sorting cipher suites, extensions, and signature algorithms.
  - **`JA4_a` Derivation**: Constructs the 10-character prefix (`t13d0406h2` for Eli's diagnostic CLI; `t13d1516h2` for the browser baseline), counting SNI (`0000`) and ALPN (`0010`) in the 2-digit extension count while excluding GREASE.
  - **`JA4_b` Derivation**: Canonically sorts non-GREASE hex cipher suites and takes the first 12 lowercase hex characters of their SHA-256 digest:
    - Eli CLI (`1301,1302,1303,c02f`) $\to$ `77f0cd3447db`
    - FoxIO Spec Baseline (`002f,0035,009c,009d,1301,1302,1303,c013,c014,c02b,c02c,c02f,c030,cca8,cca9`) $\to$ `8daaf6152771`
  - **`JA4_c` Derivation**: Removes SNI (`0000`) and ALPN (`0010`), canonically sorts remaining non-GREASE extensions, appends wire-order non-GREASE signature algorithms after `_`, and takes the first 12 lowercase hex characters of the SHA-256 digest:
    - Eli CLI (`000a,000d,002b,0033_0403,0804,0401`) $\to$ `5d4d534e3685` (full JA4: `t13d0406h2_77f0cd3447db_5d4d534e3685`)
    - FoxIO Spec Baseline (`0005,000a,000b,000d,0012,0015,0017,001b,0023,002b,002d,0033,4469,ff01_0403,0804,0401,0503,0805,0501,0806,0601`) $\to$ `e5627efa2ab1` (full JA4: `t13d1516h2_8daaf6152771_e5627efa2ab1`).

### 2.2 Cryptographically Verified Results (`src/simulation/cryptoPrimitives.ts`, `src/simulation/tacticalFixtures/hsm.fixtures.ts`)
- **Real FIPS 186-4 ECDSA-P256 (`secp256r1` / `prime256v1`) Signature Verification (`verifyEcdsaP256Sha256`)**:
  - Uses a fictional NIST P-256 public key (`04708f1a42...`, SPKI fingerprint `SHA256:11:FA:C3:75:FA:34:46:8E:8D:FF:3F:47:2E:D9:74:DE`), a complete 71-byte ASN.1 DER signature (`3045022100f551afb0...908b`), and the exact signed UTF-8 payload (`"REACTIVATE_UID=e.ward_09|PURGE_JOB=9904|TS=2028-04-27T02:14:11Z|SLOT=0x02|KEY_ID=M_HALE_SEC_01"`).
  - Performs genuine elliptic-curve point arithmetic over the NIST P-256 prime field ($p = 2^{256} - 2^{224} + 2^{192} + 2^{96} - 1$) and scalar order $n$ using `BigInt`: verifies the public key lies on the curve, parses the ASN.1 DER $(r, s)$ integers, hashes the payload with SHA-256, computes $R = u_1 G + u_2 Q$, and checks $(R.x \bmod n) === r$.
  - Cross-checked against Node's `node:crypto.verify('sha256', ...)` and verified with negative unit tests for tampered payloads, corrupted DER signatures, and invalid public keys.
  - Accesses zero physical or host PKCS#11 hardware devices.

### 2.3 Fixed Deterministic Fixture Values (`src/simulation/tacticalFixtures/*.ts`)
The following artifacts are static, deterministic simulation fixtures authored for offline inspection:
- **Host Persistence & Metadata (`persistence.fixtures.ts`, `metadata.fixtures.ts`)**: Synthetic systemd unit strings (`vespera-Support-sync.timer` / `vespera-Support-sync.service`) and static PDF/XMP metadata key-value pairs (`Author: e.ward_09`, `Host: apt4b-workstation`, `Watermark-ID: VSP-EMP-00492`).
- **TCP Flow State Summary (`tls.fixtures.ts`)**: Pre-recorded flow state telemetry describing a completed 3-way TCP handshake (`SYN -> SYN-ACK -> ACK`) on port `8443` over 42.8 seconds.
- **Canary Token & Honeypot Telemetry (`canary.fixtures.ts`)**: Static PDF `/OpenAction` URI token (`CANARY-VSP-0427-ELI`) and synthetic service banners / epoch `1970-01-01` decoy indicators for `10.88.14.9` (`98/100` deception confidence).
- **PKCS#11 Slot & Keyring Metadata (`hsm.fixtures.ts`)**: Internally consistent four-layer forensic fixture where:
  1. **Signature Validity**: Cryptographically verified (`true`) via `verifyEcdsaP256Sha256`.
  2. **Key Identifier**: Fixed fixture label `M_HALE_SEC_01` (explicitly noting that a `CKA_LABEL` string alone cannot prove device or key identity without public-key signature verification).
  3. **Software Token Metadata**: Fixed fixture metadata `SoftHSM-Emulator v2.6 (CKF_HW_SLOT=false)`.
  4. **Hardware Attestation**: Fixed fixture status `MISSING_HARDWARE_ATTESTATION` (`hardwareAttestationPresent: false`), consistent across both `hsm.fixtures.ts` and `tacticalEngine.ts`.
- **Static ELF, Container & eBPF Fixtures (`binary.fixtures.ts`, `container.fixtures.ts`, `ebpf.fixtures.ts`)**: Pre-parsed ELF symbol descriptors (`calc_citizen_threat_score`, `mount_host_shadow_Copy`), CIS Docker manifest fields (`Privileged: true`, `/var/run/docker.sock`, `/etc:/host_etc:ro`), and pre-recorded eBPF syscall events (`openat("/host_etc/shadow")`).

### 2.4 Simulated Narrative Conclusions (`src/simulation/commandRegistry.ts`, `src/game/storyEngine.ts`)
- Narrative hypotheses (linking `M_HALE_SEC_01` to Director Marcus Hale's framing of `e.ward_09`, or correlating `lantern-syncd` to Project LANTERN's tenant-scoring engine) and game-state effects (`corporate_suspicion`, `player_exposure`, `trust_nadia`, and the 6 boolean tactical flags in `NarrativeFlags`) are deterministic RPG state transitions triggered when the player applies unlocked capabilities to the investigation.

---

## 3. Multi-Step `bin-audit` Correlation & Unified Command Registry (`src/simulation/commandRegistry.ts`)
- **`bin-audit` Substep Tracking**:
  - `bin-audit lantern-syncd`: Runs `analyzeContainerAndBinary('elf')` only and records `event:tactical:bin_audit_elf`. Does **not** set `lantern_binary_analyzed = true`.
  - `bin-audit --container lantern-collector.json`: Runs `analyzeContainerAndBinary('container')` only and records `event:tactical:bin_audit_container`. Does **not** set `lantern_binary_analyzed = true` until ELF and trace are also completed.
  - `bin-audit --trace lantern-syncd.trace`: Runs `analyzeContainerAndBinary('trace')` only and records `event:tactical:bin_audit_trace`.
  - `bin-audit --all` (and the GUI Apply-to-Story button via `applyTacticalLessonToStory`): Runs all three analyses, records all three substeps, and sets `lantern_binary_analyzed = true`.
  - Only when all three substeps (`event:tactical:bin_audit_elf`, `event:tactical:bin_audit_container`, `event:tactical:bin_audit_trace`) have been recorded does `lantern_binary_analyzed` become `true` and apply the `-5% Suspicion / +10% Nadia Trust` reward (strictly idempotent).

---

## 4. Save Version 3 Validation & Fallback Integrity (`src/persistence/storage.ts`)
- **`isValidV3SaveShape` & `isValidLegacySaveShape`**:
  - Validates the complete structural schema of a V3 save (`saveVersion === 3`, numeric core risk/trust flags, all 6 boolean V0.4 tactical flags, `evidence`, `files`, `characters`, `inventory`, `networkHosts`, `hotspots`, `learning`, `terminalHistory`, and `currentDir`) before accepting `dead_air_save_v3`.
  - When `dead_air_save_v3` is malformed or incomplete (including partial objects that contain a `flags` property), `loadDeadAirState()` preserves it, falls back to `dead_air_save_v2` (and then `dead_air_save_v1` if V2 is unusable), migrates the first valid legacy save, and writes `dead_air_save_v3` only after `isValidV3SaveShape(migrated)` succeeds.
