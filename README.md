# DEAD AIR — 城市静默 (V0.4 — Tactical Security Engineering & Dual-Source Field Manual Expansion)

**DEAD AIR — 城市静默** is a single-player, narrative-driven psychological thriller and immersive hacker RPG set in 2028 Greyhaven. Players step into the shoes of former corporate systems engineer **Eli Ward (`e.ward_09`)**, investigating tampered server logs on a diegetic Linux workstation (`GreyOS 6.4`), exploring a multi-host virtual network, mastering a 12-level dual-source technical curriculum inside **Eli Ward's Field Manual**, and uncovering Vespera Data Solutions' covert **Project LANTERN** conspiracy.

---

## 1. Installation & Running the Game

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Run TypeScript typecheck / lint
npm run lint

# Run production build
npm run build

# Run the automated 30-point Node.js test suite
npm test
```

---

## 2. Core Gameplay & Chapter 1 Flow (`THE GHOST IN THE MACHINE`)

### Scene 01 — Apartment Night (`02:17 AM · Apartment 4B`)
1. **Smartphone Decision (`[P]`)**: Listen to former colleague **Nadia Park**'s cut-off voicemail and read the anonymous warning SMS (`"Don't call her. You're being watched."`). Confirm your **one-time** initial response (`CALL_NADIA`, `TRACE_SMS`, `WAIT_CHECK_PC`, or `CONTACT_ALLY`).
2. **Workstation Forensics (`[C]`)**: Open your GreyOS 6.4 Linux desktop and inspect at least **2** forensic files inside `/home/eli/Downloads/incident_0427` via the File Manager or Forensic Terminal (`cat ntp_override.conf`, `cat access_0427.log`, `cat auth_shadow.dump`, `cat lantern_schema_brief.txt`).
3. **Timeline Correlation (`[J]` or `verify`)**: Correlate the discovered artifacts chronologically to reconstruct the 14-minute Vespera blackout window.
4. **Exit Gate**: Only after completing all three steps above does the Apartment 4B exit unlock for **4th Avenue**.

### Scene 02 — 4th Avenue (`02:41 AM`)
- Inspect **Municipal Optical Pole #04** (if your `player_exposure >= 20%` and NVRAM has not been scrubbed via `scrub 10.40.4.18`, Vespera's street camera cross-matches your gait and increases `corporate_suspicion` by `+10%` and `player_exposure` by `+10%`).
- Optional Branch: Speak with investigative journalist **Rhea Solis** (*The Greyhaven Ledger*). Choosing to share your LANTERN logs establishes an encrypted media dead-drop (`rhea_allied = true`), a key requirement for **Ending A**.
- Enter the **24-Hour Coin Laundry**.

### Scene 03 — 24-Hour Coin Laundry (`02:48 AM`)
- Converse with **Nadia Park** across three sequential dialogue stages (`nadia_node_1` → `nadia_node_2` → `nadia_node_3`).
- Your choices shift `trust_nadia` and `corporate_suspicion`. If `trust_nadia >= 65%` upon completion, Nadia shares Vespera's Enclave fiber-tap filter (`-5% Player Exposure`).
- Completing all three stages grants the hardware decryption key **`moth_archive.key`** (`item_moth_usb`) and unlocks **Apartment Return (`03:12 AM`)**.

### Scene 04 — Apartment Return & Climax (`03:12 AM`)
- Return to Apartment 4B to find your workstation monitor unexpectedly awake and a new encrypted message from **MOTH** waiting on your smartphone (`[P]`).
- Open the Workstation (`[C]`) and inspect `/home/eli/archive_vault/lantern_auth_audit.db` (unlocked via `moth_archive.key` strictly in `APARTMENT_RETURN`) to uncover `EV-06`: your own revoked employee ID (`e.ward_09`) was re-activated 48 hours ago to sign off on the log purge.
- The display is hijacked with **`"WE KNOW WHO YOU ARE."`**, transitioning into one of **three dynamic Chapter 1 Endings**.

---

## 3. Dual-Source Curriculum: `ELI WARD'S FIELD MANUAL` (12 Levels)

Press **`[M]`** or open the **Field Manual & NetLab** tab in GreyOS 6.4 to filter between **All Sources (12)**, **Track I: Network & Internet (7)**, and **Track II: Tactical Security (5)**:

### Track I: Network & Internet (`hoochanlon/fq-book`, Levels 01–07)
- **LEVEL 01 (`lesson_01_networking`)**: *The Silent Handshake* — TCP/UDP, Ports & Firewall RST (`packet-inspect`)
- **LEVEL 02 (`lesson_02_dns`)**: *Poisoned Names* — DNS Hierarchy, `/etc/hosts` & Sinkholes (`dns-inspect`)
- **LEVEL 03 (`lesson_03_certificates`)**: *The Forged Seal* — TLS, CA Trust Chains & MITM (`cert-verify`)
- **LEVEL 04 (`lesson_04_proxy_vpn`)**: *Shadow Tunnels* — SOCKS5h, WireGuard Routing & DNS Leaks (`route-apply`, `tunnel-stat`)
- **LEVEL 05 (`lesson_05_nat_vm`)**: *Behind the Mask* — NAT, Port Forwarding & VM Isolation (`topo-map`)
- **LEVEL 06 (`lesson_06_ipfs`)**: *Immutable Proof* — IPFS CIDs, Hashing & IPNS Verification (`ipfs-verify`)
- **LEVEL 07 (`lesson_07_osint_opsec`)**: *Shadow Footprints* — Surface/Deep/Dark Web & OPSEC (`archive-search`)

### Track II: Tactical Security Engineering (`Lauren-Bitten/CyberSecurity-Projects`, Upstream: `CarterPerez-dev/Cybersecurity-Projects`, License: `AGPL-3.0`, Levels 08–12)
- **LEVEL 08 (`lesson_08_persistence`)**: *The Persistent Shadow* — Systemd User Timers & Forensic PDF Metadata Sanitization (`persist-audit`)
  - Sets `persistence_audit_completed` (when `vespera-Support-sync.timer` is quarantined) and `metadata_protection_completed` (when `/home/eli/Documents/incident_0427_brief.clean.pdf` is created while preserving the original PDF).
- **LEVEL 09 (`lesson_09_tls_fingerprinting`)**: *The TLS Fingerprint* — Passive JA3/JA4 ClientHello Attribution & TCP State Telemetry (`ja4-inspect`)
  - Computes canonical sorted JA4 (`t13d0406h2_55b375c5d22e_a19f04c8812b`), differentiates from Firefox 124 baseline, and sets `tls_attribution_verified`.
- **LEVEL 10 (`lesson_10_counter_deception`)**: *The Canary's Song* — Document Canary Tokens & Honeypot Telemetry (`canary-check`)
  - Statically identifies `CANARY-VSP-0427-ELI` in `incident_0427_brief.pdf` and flags `10.88.14.9` as a Vespera SOC Honeypot (`canary_identified`) without disarming the live `probe 10.88.14.9` trap.
- **LEVEL 11 (`lesson_11_hsm_forensics`)**: *The Hardware Forgery* — PKCS#11 HSM Signatures, Soft-Token Metadata & Keyring Rotation (`hsm-verify`)
  - Separates ECDSA-P256 mathematical signature validity, Key ID (`M_HALE_SEC_01`), `SoftHSM-Emulator` metadata (`CKF_HW_SLOT=false`), and missing hardware attestation (`hsm_signature_verified`).
- **LEVEL 12 (`lesson_12_container_binary`)**: *The Escaped Container* — Static ELF Binary Analysis, CIS Docker Audit & eBPF Syscalls (`bin-audit`)
  - Correlates `calc_citizen_threat_score` in `lantern-syncd`, privileged container mounts (`/var/run/docker.sock`, `/etc:/host_etc:ro`) in `lantern-collector.json`, and `openat("/host_etc/shadow")` in `lantern-syncd.trace` (`lantern_binary_analyzed`).

> **Note on Evidence Isolation**: All 6 V0.4 tactical flags (`persistence_audit_completed`, `metadata_protection_completed`, `tls_attribution_verified`, `canary_identified`, `hsm_signature_verified`, `lantern_binary_analyzed`) are tracked in `JournalModal.tsx` under **TACTICAL INVESTIGATION FINDINGS** and never inflate Chapter 1's core `evidence_count` (`EV-01`–`EV-06`).

---

## 4. Three Dynamic Chapter 1 Endings

| Ending | Code & Title | Trigger Conditions | Narrative Outcome |
| :--- | :--- | :--- | :--- |
| **Ending A** | **THE SIGNAL LEAKS / 信号破壁** | `evidence_count >= 5`, `timeline_correlated == true`, `journalist_contact == true` (`rhea_allied`), `trust_nadia >= 55%`, `corporate_suspicion < 45%`, `player_exposure < 45%` | Your automated dead-man switch transmits the correlated LANTERN dump to Rhea Solis before Vespera cuts your fiber. Morning headlines ignite a citywide crisis. |
| **Ending B** | **A DIRTY BARGAIN / 暗影交易** | `evidence_count >= 4`, `timeline_correlated == true`, `corporate_suspicion < 45%`, `player_exposure < 45%`, but lacking either `rhea_allied` or `trust_nadia >= 55%` | You hold the decrypted truth, but without a trusted media channel or ally network, you are forced to accept MOTH's extraction bargain. |
| **Ending C** | **THE FALL GUY / 替罪之羊** | `corporate_suspicion >= 45%` OR `player_exposure >= 45%` OR `evidence_count < 4` OR `!timeline_correlated` | High exposure/suspicion or incomplete forensics allows Director Marcus Hale's containment unit to frame `e.ward_09` on morning news. |

---

## 5. Documentation Deliverables

- [Chapter 1 Flow, Virtual Network & Tactical Security Guide (`CHAPTER_ONE_FLOW.md`)](./CHAPTER_ONE_FLOW.md)
- [V0.4 Technical Architecture & Verification Report (`TECHNICAL_REPORT_V04.md`)](./TECHNICAL_REPORT_V04.md)
- [V0.2 Legacy Technical Report (`TECHNICAL_REPORT_V02.md`)](./TECHNICAL_REPORT_V02.md)
