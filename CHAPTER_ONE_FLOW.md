# DEAD AIR V0.3 — Chapter One Flow, Virtual Network & State Machine Guide

## 1. Scene Progression State Machine

All scene transitions are validated inside `src/game/storyEngine.ts` via `canTransitionToScene(state, targetScene)` and enforced inside `transitionToScene(state, targetScene)` and `inspectHotspot(state, hotspotId)`.

```
[Scene 01: APARTMENT_NIGHT (02:17 AM)]
   │
   ├─ Gate 1: First Phone Choice confirmed & locked (`first_choice_locked === true`)
   ├─ Gate 2: At least 2 forensic files from `incident_0427.zip` inspected (`EV-01`..`EV-04` >= 2)
   ├─ Gate 3: Forensic Timeline Correlated (`timeline_correlated === true` via `verify` or UI)
   ├─ V0.3 Network Intrusion (Workstation):
   │     • `172.16.40.12` (MOTH Disposable SIP Relay): `nmap` -> `exploit` -> `logs` (+5% Nadia Trust) -> `pivot 172.16.40.12` (-10% Exposure)
   │     • `10.40.4.18` (4th Ave Optical Pole #04): `nmap` -> `exploit` (`e.ward_09`) -> `scrub 10.40.4.18` (wipes gait/IMEI NVRAM, -10% Exposure, -5% Suspicion)
   │     • `10.88.4.22` (Vespera Core Telemetry Gateway 02): Discovered via `access_0427.log` -> `nmap` -> `exploit` (requires `svc_lantern_sync` token from `auth_shadow.dump`) -> `dump 10.88.4.22` (extracts Marcus Hale's YubiKey forgery counter-proof, -5% Suspicion)
   │     • `10.88.14.9` (Vespera Executive Enclave): Running `probe 10.88.14.9` trips IDS honey-trap (+15% Suspicion, +15% Exposure)
   │
   ▼
[Scene 02: STREET_NIGHT (02:41 AM — 4th Avenue)]
   │
   ├─ Optional: Inspect Municipal Optical Pole #04 (`hs_camera` — if `camera_scrubbed` is `true`, camera fails to lock onto Eli; otherwise if `camera_tracking_risk` is true (`player_exposure >= 20%`), locks `camera_tracked = true` and adds +10% Suspicion, +10% Exposure)
   ├─ Optional: Speak with Journalist Rhea Solis (`hs_rhea` — mutually exclusive node lock via `resolvedDialogueNodes['rhea:rhea_node_1']`)
   └─ Gate 4: Must be on 4th Avenue before entering 24-Hour Coin Laundry
   │
   ▼
[Scene 03: LAUNDROMAT (02:48 AM — 24-Hour Coin Laundry)]
   │
   ├─ Mandatory: Complete 3-stage dialogue with Nadia Park (`nadia_node_1` -> `nadia_node_2` -> `nadia_node_3`)
   ├─ Consequence: If `trust_nadia >= 65%`, Nadia provides Enclave fiber-tap filter (-5% Exposure)
   ├─ Gate 5: Receive `moth_archive.key` (`item_moth_usb`) and set `laundromat_meeting_done === true`
   └─ Security Rule: Even with `moth_archive.key` acquired, `lantern_auth_audit.db` strictly enforces `requiresScene: 'APARTMENT_RETURN'` and cannot be read while still in `LAUNDROMAT`.
   │
   ▼
[Scene 04: APARTMENT_RETURN (03:12 AM — Intrusion Detected)]
   │
   ├─ Event: MOTH message arrives on Smartphone (`contacted_moth` becomes `true` only when read)
   └─ Gate 6: Inspect `/home/eli/archive_vault/lantern_auth_audit.db` using `moth_archive.key` in `APARTMENT_RETURN`
   │
   ▼
[CHAPTER 1 CLIMAX: "WE KNOW WHO YOU ARE." -> Dynamic Ending Resolution]
   ├─ ENDING A: THE SIGNAL LEAKS (Full evidence + Timeline correlated + Rhea Allied + Nadia Trust >= 55% + Low Risk)
   ├─ ENDING B: A DIRTY BARGAIN (Strong evidence + Timeline correlated + Low Risk, but missing Media/Ally support)
   └─ ENDING C: THE FALL GUY (Suspicion >= 45% OR Exposure >= 45% via reckless cellular calls, active `probe 10.88.14.9`, optical camera lock, or aggressive interrogation)
```

---

## 2. Virtual Network Hosts & Tactical Intrusion Matrix (V0.3)

| IPv4 / Hostname | Role & Subplot Connection | Prerequisite / Credential | Tactical Operation & Narrative Effect |
| :--- | :--- | :--- | :--- |
| `10.0.2.15` (`apt4b-workstation.local`) | Eli Ward's air-gapped GreyOS 6.4 node (`USER`). | Discovered & Scanned by default. | Local staging node for `incident_0427.zip` and `lantern_auth_audit.db`. |
| `172.16.40.12` (`moth-sip-relay.port`) | Port District Disposable SIP & SMS Relay (`MOTH_RELAY_0`). | `nmap 172.16.40.12` + First Phone Response completed. | `logs 172.16.40.12` proves Vespera tapped Nadia's handset (`+5% Nadia Trust`). `pivot 172.16.40.12` routes traffic through dark-fiber proxy (`relay_tunnel_active = true`, `-10% Player Exposure`). |
| `10.40.4.18` (`muni-cam-sector04.gov`) | 4th Ave Municipal Optical Pole #04 Controller. | `nmap 10.40.4.18` or `e.ward_09` credential from `access_0427.log`. | `scrub 10.40.4.18` wipes NVRAM gait/IMEI cache (`camera_scrubbed = true`, clears/prevents `camera_tracked`, `-10% Exposure`, `-5% Suspicion`). |
| `10.88.4.22` (`vespera-edge-gw02.corp`) | Vespera Core Telemetry & Audit Gateway 02. | Discovered via `access_0427.log`. Requires `nmap 10.88.4.22` + `svc_lantern_sync` shadow token (`0x9F4A2C`) from `auth_shadow.dump`. | `dump 10.88.4.22` (or `logs 10.88.4.22`) extracts `/var/log/kern_keyring.log` proving Director Marcus Hale (`[M_HALE_SEC_01]`) forged Eli's signature (`counter_proof_secured = true`, `-5% Suspicion`). |
| `10.88.14.9` (`vespera-enclave-gw.corp`) | Vespera Executive Enclave VLAN & IDS Canary. | Discovered via `ntp_override.conf` / `lan_topology.map`. | Protected by active IDS canary; running `probe 10.88.14.9` triggers honey-trap (`+15% Suspicion`, `+15% Exposure`). |
