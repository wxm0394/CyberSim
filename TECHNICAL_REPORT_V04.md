# DEAD AIR — 城市静默 V0.4 Technical Architecture & Verification Report

## 1. Executive Summary
**DEAD AIR V0.4 (Tactical Security Engineering Expansion)** incrementally upgrades the existing narrative hacker RPG (`Save Version 3`, `dead_air_save_v3`) with **Levels 08–12** adapted from **`Lauren-Bitten/CyberSecurity-Projects`** (upstream reference: **`CarterPerez-dev/Cybersecurity-Projects`**, license: `AGPL-3.0`). All new simulations are independently authored deterministic passive forensics modules inside `GreyOS 6.4`.

---

## 2. Dual-Source Curriculum & Source Curation Governance

### 2.1 Source Tracks (`src/learning/lessonTypes.ts`, `src/learning/sourceRegistry.ts`)
- **Track I (`network_internet`)**: 7 levels adapted from `hoochanlon/fq-book` (`wxm0394/fq-book`), covering Networking, DNS, TLS Certificates, Proxy/VPN Tunnels, NAT/VM Isolation, IPFS Content Addressing, and Passive OSINT/OPSEC.
- **Track II (`tactical_security`)**: 5 levels adapted from `Lauren-Bitten/CyberSecurity-Projects` (upstream: `CarterPerez-dev/Cybersecurity-Projects`, `AGPL-3.0`), covering Host Persistence & Metadata Sanitization, Passive JA3/JA4 TLS Attribution, Canary Tokens & Honeypot Deception, PKCS#11 HSM & Keyring Forensics, and Static ELF/Docker/eBPF Correlation.
- **Interactive Source-Track Selector (`src/ui/KnowledgeCodex.tsx`)**:
  - `All Sources (12)` (`'all'`)
  - `Track I: Network & Internet (7)` (`'network_internet'`)
  - `Track II: Tactical Security (5)` (`'tactical_security'`)
  - Co-filters seamlessly with the Category selector while preserving completed lessons, unlocked capabilities, and active selection.

### 2.2 Curation Classifications
Every curated entry in `CURATED_SOURCE_REGISTRY` carries an explicit `CurationClassification`:
- `adapted` — Core defensive/forensic engineering concept adapted into a playable GreyOS lab.
- `synthesized` — Combined as supporting telemetry inside a multi-artifact investigation lab.
- `excluded_out_of_scope` — Hardware/SDR/GUI topics outside Chapter 1's Linux narrative scope.
- `excluded_offensive_not_simulated` — Raw stateless packet floods, active TLS fingerprint spoofing, or offensive exploitation excluded per passive-forensics boundary.
- `excluded_unverified` — Unverified anecdotes or non-technical content excluded.

---

## 3. Deterministic Passive Forensics Engine & Unified Command Registry

### 3.1 Fixture Modules (`src/simulation/tacticalFixtures/*.ts`) & Analysis Engine (`src/simulation/tacticalEngine.ts`)
- **`persistence.fixtures.ts` & `metadata.fixtures.ts`**: Models `/home/eli/.config/systemd/user/vespera-Support-sync.timer` (`OnUnitActiveSec=15min` beacon to `198.51.100.204:8443`) and `/home/eli/Documents/incident_0427_brief.pdf` (`Author: e.ward_09`, `Host: apt4b-workstation`, `Watermark-ID: VSP-EMP-00492`).
- **`tls.fixtures.ts`**: Implements canonical JA4 sorting (`computeCanonicalJa4`) over captured `ClientHello` hex cipher suites and extensions (`t13d0406h2_55b375c5d22e_a19f04c8812b` vs. Firefox 124 `t13d1516h2_8daaf6152771_e5627efa2ab1`) and verifies single-port completed TCP 3-way handshake telemetry.
- **`canary.fixtures.ts`**: Models static PDF AST `/OpenAction` Canary Token `CANARY-VSP-0427-ELI` and `10.88.14.9` Honeypot indicators (contradictory SSH/kernel banners, epoch `1970-01-01` zero-byte files, `98/100` deception score).
- **`hsm.fixtures.ts`**: Explicitly separates four forensic layers on `access_0427.log`:
  1. **Cryptographic Signature Math**: `VALID` (ECDSA-P256 verified against public key)
  2. **Signing Key Identifier**: `M_HALE_SEC_01` (Director Marcus Hale)
  3. **Token Slot Metadata**: `SoftHSM-Emulator v2.6` (`CKF_HW_SLOT=false`)
  4. **Hardware Attestation**: `MISSING_HARDWARE_ATTESTATION` (forged off-hours at `02:13:58 UTC` while splicing `e.ward_09` into the plaintext audit line).
- **`binary.fixtures.ts`, `container.fixtures.ts` & `ebpf.fixtures.ts`**: Correlates ELF symbol `calc_citizen_threat_score` in `lantern-syncd`, CIS Docker failures (`Privileged: true`, `/var/run/docker.sock`, `/etc:/host_etc:ro`) in `lantern-collector.json`, and pre-recorded eBPF syscall `openat("/host_etc/shadow")` in `lantern-syncd.trace`.
- Every analysis output produces a structured `ForensicFindingReport` containing **Observed Fact**, **Technical Inference**, and **Narrative Hypothesis**.

### 3.2 Unified Command Registry (`src/simulation/commandRegistry.ts`)
Shared between the GreyOS Terminal (`executeDeadAirCommand`) and Field Manual GUI (`applyLessonCapabilityToStory`):
- `persist-audit [--inspect | --quarantine vespera-Support-sync.timer | --sanitize-copy incident_0427_brief.pdf]`
- `ja4-inspect [captured_tls_0427]`
- `canary-check [incident_0427_brief.pdf | 10.88.14.9]`
- `hsm-verify [access_0427.log | kern_keyring.log]`
- `bin-audit [lantern-syncd | --container lantern-collector.json | --trace lantern-syncd.trace]`

---

## 4. Narrative Integrity & Save Version 3 Migration (`src/persistence/storage.ts`)
- **Strict Isolation from `evidence_count`**: The 6 new boolean flags in `NarrativeFlags` (`persistence_audit_completed`, `metadata_protection_completed`, `tls_attribution_verified`, `canary_identified`, `hsm_signature_verified`, `lantern_binary_analyzed`) are displayed in `JournalModal.tsx` under **TACTICAL INVESTIGATION FINDINGS** and never modify Chapter 1's 6 core evidence artifacts (`EV-01`–`EV-06`).
- **Save Version 3 (`dead_air_save_v3`)**: Reads `dead_air_save_v3` → `dead_air_save_v2` → `dead_air_save_v1` → initial state, migrating legacy V1/V2 saves idempotently without deleting legacy backup keys or crashing on malformed JSON.
