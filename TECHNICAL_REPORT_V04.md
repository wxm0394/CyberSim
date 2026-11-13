# DEAD AIR — 城市静默 V0.4.3 Technical Architecture & Verification Report

## 1. Executive Summary
**DEAD AIR V0.4.3 (Tactical Security Engineering Expansion — Persistence Integrity Finalization)** incrementally hardens the narrative hacker RPG (`Save Version 3`, `dead_air_save_v3`) across **Levels 08–12** adapted from **`Lauren-Bitten/CyberSecurity-Projects`** (upstream reference: **`CarterPerez-dev/Cybersecurity-Projects`**, license: `AGPL-3.0`). All modules operate strictly within an offline, passive-forensics boundary inside `GreyOS 6.4`.

---

## 2. Epistemic & Implementation Boundary Classification

To maintain technical rigor, every output in the V0.4.3 engine is explicitly classified into one of four categories:

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

### 2.2 Cryptographically Verified Results & Strict ASN.1 DER Validation (`src/simulation/cryptoPrimitives.ts`, `src/simulation/tacticalFixtures/hsm.fixtures.ts`)
- **Real FIPS 186-4 ECDSA-P256 (`secp256r1` / `prime256v1`) Signature Verification (`verifyEcdsaP256Sha256`)**:
  - Uses a synthetic NIST P-256 public key (`04708f1a42...`, SPKI fingerprint `SHA256:11:FA:C3:75:FA:34:46:8E:8D:FF:3F:47:2E:D9:74:DE`), a complete 71-byte ASN.1 DER signature (`3045022100f551afb0...908b`), and the exact signed UTF-8 payload (`"REACTIVATE_UID=e.ward_09|PURGE_JOB=9904|TS=2028-04-27T02:14:11Z|SLOT=0x02|KEY_ID=M_HALE_SEC_01"`).
  - Performs genuine elliptic-curve point arithmetic over the NIST P-256 prime field ($p = 2^{256} - 2^{224} + 2^{192} + 2^{96} - 1$) and scalar order $n$ using `BigInt`: verifies the public key lies on the curve, parses the canonical ASN.1 DER $(r, s)$ integers, hashes the payload with SHA-256, computes $R = u_1 G + u_2 Q$, and checks $(R.x \bmod n) === r$.
- **Strict Canonical ASN.1 DER Validation (`parseDerEcdsaSignature`)**:
  - Validates the outer `SEQUENCE` (`0x30`) short-form length and rejects any mismatch between `seqLen + 2` and total byte length.
  - Validates each `INTEGER` (`0x02`) tag, length (`1..33`), and byte boundary.
  - Rejects negative `INTEGER` encodings (where the first byte has MSB `0x80` set without a leading `0x00` sign-protection byte, including missing sign-protection zero cases).
  - Rejects redundant leading zeros (`0x00` followed by a byte with MSB `0`, or single-byte `0x00`).
  - Rejects any trailing bytes after the second `INTEGER` $s$.
- **Command-Level Cryptographic Gating (`handleHsmVerify`)**:
  - `handleHsmVerify()` inspects `analysis.verificationBreakdown.signatureMathValid` before mutating any game state.
  - If verification fails (`signatureMathValid === false`), `hsm_signature_verified` remains `false`, `event:tactical:hsm_verified` and `lesson_11_hsm_forensics` are not added, no corporate suspicion or Nadia trust changes are awarded, and `observedFact`, `technicalInference`, `technicalInferenceZh`, and terminal output explicitly report verification failure without claiming a verified signature.

### 2.3 Fixed Deterministic Fixture Values & Evidentiary Attribution Boundary (`src/simulation/tacticalFixtures/*.ts`)
The following artifacts are static, deterministic simulation fixtures authored for offline inspection:
- **Host Persistence & Metadata (`persistence.fixtures.ts`, `metadata.fixtures.ts`)**: Synthetic systemd unit strings (`vespera-Support-sync.timer` / `vespera-Support-sync.service`) and static PDF/XMP metadata key-value pairs (`Author: e.ward_09`, `Host: apt4b-workstation`, `Watermark-ID: VSP-EMP-00492`).
- **TCP Flow State Summary (`tls.fixtures.ts`)**: Pre-recorded flow state telemetry describing a completed 3-way TCP handshake (`SYN -> SYN-ACK -> ACK`) on port `8443` over 42.8 seconds.
- **Canary Token & Honeypot Telemetry (`canary.fixtures.ts`)**: Static PDF `/OpenAction` URI token (`CANARY-VSP-0427-ELI`) and synthetic service banners / epoch `1970-01-01` decoy indicators for `10.88.14.9` (`98/100` deception confidence).
- **PKCS#11 Slot & Evidentiary Attribution Boundary (`hsm.fixtures.ts`, `tacticalEngine.ts`)**:
  1. **Cryptographic fact**: The signature mathematically validates against the supplied fixture public key (`SHA256:11:FA:C3:75:FA:34:46:8E:8D:FF:3F:47:2E:D9:74:DE`).
  2. **Fixture metadata**: Key label is `M_HALE_SEC_01`, owner metadata says `Director Marcus Hale`, and token slot metadata is `SoftHSM-Emulator v2.6 (CKF_HW_SLOT=false)`.
  3. **Hardware attestation**: `MISSING_HARDWARE_ATTESTATION` (`hardwareAttestationPresent: false`, missing).
  4. **Real-world custody/ownership**: Not independently established by mathematical signature verification alone.
- **Static ELF, Container & eBPF Fixtures (`binary.fixtures.ts`, `container.fixtures.ts`, `ebpf.fixtures.ts`)**: Pre-parsed ELF symbol descriptors (`calc_citizen_threat_score`, `mount_host_shadow_Copy`), CIS Docker manifest fields (`Privileged: true`, `/var/run/docker.sock`, `/etc:/host_etc:ro`), and pre-recorded eBPF syscall events (`openat("/host_etc/shadow")`).

### 2.4 Simulated Narrative Conclusions (`src/simulation/commandRegistry.ts`, `src/game/storyEngine.ts`)
- Narrative hypotheses (such as the fictional hypothesis that `e.ward_09` was spliced into `access_0427.log` while a soft-token slot loaded with the key labeled `M_HALE_SEC_01` signed the purge, or correlating `lantern-syncd` to Project LANTERN's tenant-scoring engine) and game-state effects (`corporate_suspicion`, `player_exposure`, `trust_nadia`, and the 6 boolean tactical flags in `NarrativeFlags`) are deterministic RPG state transitions triggered only after the corresponding verification checks pass.

---

## 3. Multi-Step `bin-audit` Correlation & Unified Command Registry (`src/simulation/commandRegistry.ts`)
- **`bin-audit` Substep Tracking**:
  - `bin-audit lantern-syncd`: Runs `analyzeContainerAndBinary('elf')` only and records `event:tactical:bin_audit_elf`. Does **not** set `lantern_binary_analyzed = true`.
  - `bin-audit --container lantern-collector.json`: Runs `analyzeContainerAndBinary('container')` only and records `event:tactical:bin_audit_container`. Does **not** set `lantern_binary_analyzed = true` until ELF and trace are also completed.
  - `bin-audit --trace lantern-syncd.trace`: Runs `analyzeContainerAndBinary('trace')` only and records `event:tactical:bin_audit_trace`.
  - `bin-audit --all` (and the GUI Apply-to-Story button via `applyTacticalLessonToStory`): Runs all three analyses, records all three substeps, and sets `lantern_binary_analyzed = true`.
  - Only when all three substeps (`event:tactical:bin_audit_elf`, `event:tactical:bin_audit_container`, `event:tactical:bin_audit_trace`) have been recorded does `lantern_binary_analyzed` become `true` and apply the `-5% Suspicion / +10% Nadia Trust` reward (strictly idempotent).

---

## 4. Deep Save Version 3 Validation & Fail-Safe Corrupted V3 Backup Preservation (`src/persistence/storage.ts`)
- **Element-Level & Nested Schema Validation (`isValidV3SaveShape` & `isValidLegacySaveShape`)**:
  - Validates top-level state properties (`saveVersion === 3`, numeric core risk/trust flags, all 6 boolean V0.4 tactical flags, `currentDir`) and every individual element inside `evidence`, `files`, `characters`, `inventory`, `networkHosts`, `completedEvents`, `inspectedFiles`, `terminalHistory`, `hotspots` (across all 4 scenes), and `learning`.
  - **Character Dialogue Nodes & Choices (`isValidDialogueNode`, `isValidDialogueChoice`)**: Validates every node's `id`, `speaker`, `body`, `bodyZh`, and non-empty `choices` array, every choice's `id`, `label`, `labelZh`, optional finite `trustDelta`/`suspicionDelta`/`exposureDelta`, optional `unlocksEvidenceId`, and ensures `currentNodeId` and every choice's `nextNodeId` resolve to valid node IDs in `characters[].nodes`.
  - **Network Host Services & Logs (`isValidNetworkServiceEntry`, `isValidHostLogEntry`)**: Validates every service's integer `port` (`1..65535`), `protocol` (`'tcp' | 'udp'`), non-empty `service` and `version`, `state` (`'open' | 'filtered' | 'canary'`), and optional `vulnerabilityNote`, as well as every host log entry (`id`, `timestamp`, `level`, `message`, optional boolean `scrubbed`).
  - **Authoritative Learning Registry Validation (`isValidLearningObject`)**: Validates `completedLessonIds`, `selectedLessonId`, `activeLabLessonId`, `appliedStoryLessons`, and `bruteForceStoryLessons` against `ALL_LEARNING_LESSONS`; `unlockedCapabilities` and `unlockedTools` against `CAPABILITY_DESCRIPTORS` and lesson tool unlocks; `masteredConcepts` against lesson concepts (plus legacy `'concept_dns_hierarchy'`); `executedDiagnosticsByLesson` keys and diagnostic action IDs against each lesson's `lab.diagnosticActions`; and `labResolutionByLesson` keys and resolution modes (`'analytical' | 'brute_force'`).
- **Fail-Safe Corrupted V3 Backup Preservation (`preserveMalformedV3BeforeOverwrite` & `loadDeadAirState`)**:
  - When `dead_air_save_v3` contains raw invalid JSON or fails `isValidV3SaveShape`, `loadDeadAirState()` records the exact raw malformed V3 string (`malformedRawV3`) and falls back to `dead_air_save_v2` (and then `dead_air_save_v1` if V2 is absent or invalid).
  - Before overwriting `dead_air_save_v3` with a migrated V2 or V1 state, `preserveMalformedV3BeforeOverwrite()` writes `malformedRawV3` to `dead_air_save_v3_corrupted_backup` (`CORRUPTED_STORAGE_KEY_V3_BACKUP`), reads `CORRUPTED_STORAGE_KEY_V3_BACKUP` back from `localStorage`, and verifies `readBack === malformedRawV3`.
  - Only when `preserveMalformedV3BeforeOverwrite()` returns `true` does `loadDeadAirState()` call `saveDeadAirState(migrated)`. If backup writing throws (e.g., storage quota exceeded) or read-back verification mismatches, `dead_air_save_v3` is **never** overwritten, while the migrated state is still returned in memory.
  - Original `dead_air_save_v2` and `dead_air_save_v1` keys are never modified or deleted during recovery.
- **Remaining Browser Storage Limitations**:
  - Persistence relies on synchronous browser `window.localStorage` (typically capped at ~5 MB per origin). Only the single most recent corrupted V3 payload is retained in `dead_air_save_v3_corrupted_backup` (not a multi-slot ring buffer), and if `localStorage` is completely disabled or full, recovered legacy state runs in memory for the active session without persisting to disk.

