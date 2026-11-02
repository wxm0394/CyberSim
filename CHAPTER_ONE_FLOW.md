# DEAD AIR V0.2 — Chapter One Flow & State Machine Guide

## 1. Scene Progression State Machine

All scene transitions are validated inside `src/game/storyEngine.ts` via `canTransitionToScene(state, targetScene)` and enforced inside `transitionToScene(state, targetScene)` and `inspectHotspot(state, hotspotId)`.

```
[Scene 01: APARTMENT_NIGHT (02:17 AM)]
   │
   ├─ Gate 1: First Phone Choice confirmed & locked (`first_choice_locked === true`)
   ├─ Gate 2: At least 2 forensic files from `incident_0427.zip` inspected (`EV-01`..`EV-04` >= 2)
   ├─ Gate 3: Forensic Timeline Correlated (`timeline_correlated === true` via `verify` or UI)
   ├─ High-Risk Option: Running `probe 10.88.14.9` in terminal trips Vespera IDS honey-trap (+15% Suspicion, +15% Exposure)
   │
   ▼
[Scene 02: STREET_NIGHT (02:41 AM — 4th Avenue)]
   │
   ├─ Optional: Inspect Municipal Optical Pole #04 (`hs_camera` — if `camera_tracking_risk` is true (`player_exposure >= 20%`), locks `camera_tracked = true` and adds +10% Suspicion, +10% Exposure)
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

## 2. State Variables & Single Source of Truth

| Variable | Source / Trigger | Gameplay Consequence |
| :--- | :--- | :--- |
| `trust_nadia` (0–100) | Initial: `55`. Modified by `CALL_NADIA` (`+10`), `CONTACT_ALLY` (`+5`), and Nadia dialogue nodes. Synced with `characters['nadia'].trust`. | Determines Nadia's stance (`Allied`, `Guarded`, `Defensive`). At `>= 65%`, grants `-5%` exposure filter; required (`>= 55%`) for **Ending A**. |
| `corporate_suspicion` (0–100) | Initial: `15`. Modified by `CALL_NADIA` (`+15`), `TRACE_SMS` (`+5`), `WAIT_CHECK_PC` (`-5`), unauthorized LUKS read attempt (`+10`), `probe 10.88.14.9` (`+15`), `hs_camera` when exposed (`+10`), questioning Nadia (`+5`), and aggressively pressing Nadia (`+10`). | At `>= 25%`, triggers `soc_warning_triggered` alert. At `>= 45%`, triggers **Ending C (`THE FALL GUY`)**. |
| `player_exposure` (0–100) | Initial: `10`. Modified by `CALL_NADIA` (`+15`), `TRACE_SMS` (`+5`), unauthorized LUKS read attempt (`+5`), `probe 10.88.14.9` (`+15`), `hs_camera` when exposed (`+10`), `rhea_c1_share` (`+5`), pressing Nadia (`+5`), and Nadia high-trust filter (`-5`). | At `>= 20%`, sets `camera_tracking_risk = true`. Inspecting `hs_camera` with risk active sets `camera_tracked = true`. At `>= 45%`, triggers **Ending C**. |
| `camera_tracking_risk` & `camera_tracked` | `camera_tracking_risk` is `true` when `player_exposure >= 20%`. `camera_tracked` only becomes `true` when the player actually inspects `hs_camera` on 4th Avenue while `player_exposure >= 20%`. | Prevents premature `camera_tracked` attribution before entering 4th Avenue. |
| `resolvedDialogueNodes` | Maps `characterId:nodeId -> choiceId` (e.g., `rhea:rhea_node_1`). | Enforces mutually exclusive dialogue choices per node so players cannot pick `rhea_c1_cautious` and then re-open dialogue to pick `rhea_c1_share`. |
| `journalist_contact` & `rhea_allied` | Set when speaking with Rhea Solis on 4th Avenue (`rhea_c1_share` sets `rhea_allied = true`). | `rhea_allied = true` establishes the encrypted media dead-drop required for **Ending A**. |
| `contacted_moth` | Remains `false` upon entering `APARTMENT_RETURN`; set to `true` only when Eli opens the Smartphone to read MOTH's message or dialogues with MOTH. | Accurately tracks whether the player engaged with MOTH's backchannel. |
| `evidence_count` (0–6) | Derived directly from `evidence.filter(e => e.discovered).length`. | `>= 2` initial artifacts required to correlate timeline; `>= 5` required for **Ending A**. |
| `timeline_correlated` | Set via `verify` / `timeline` terminal command or clicking `Correlate Evidence` (requires `>= 2` discovered artifacts). | Required to exit `APARTMENT_NIGHT` and required to avoid **Ending C**. |
