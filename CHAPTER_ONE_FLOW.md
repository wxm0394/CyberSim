# DEAD AIR V0.2 — Chapter One Flow & State Machine Guide

## 1. Scene Progression State Machine

All scene transitions are validated inside `src/game/storyEngine.ts` via `canTransitionToScene(state, targetScene)` and enforced inside `transitionToScene(state, targetScene)` and `inspectHotspot(state, hotspotId)`.

```
[Scene 01: APARTMENT_NIGHT (02:17 AM)]
   │
   ├─ Gate 1: First Phone Choice confirmed & locked (`first_choice_locked === true`)
   ├─ Gate 2: At least 2 forensic files from `incident_0427.zip` inspected (`EV-01`..`EV-04` >= 2)
   └─ Gate 3: Forensic Timeline Correlated (`timeline_correlated === true` via `verify` or UI)
   │
   ▼
[Scene 02: STREET_NIGHT (02:41 AM — 4th Avenue)]
   │
   ├─ Optional: Inspect Municipal Optical Pole #04 (`hs_camera` — triggers +5% Suspicion if Exposure >= 20%)
   ├─ Optional: Speak with Journalist Rhea Solis (`hs_rhea` — `rhea_c1_share` activates Media Dead-Drop)
   └─ Gate 4: Must be on 4th Avenue before entering 24-Hour Coin Laundry
   │
   ▼
[Scene 03: LAUNDROMAT (02:48 AM — 24-Hour Coin Laundry)]
   │
   ├─ Mandatory: Complete 3-stage dialogue with Nadia Park (`nadia_node_1` -> `nadia_node_2` -> `nadia_node_3`)
   ├─ Consequence: If `trust_nadia >= 65%`, Nadia provides Enclave fiber-tap filter (-5% Exposure)
   └─ Gate 5: Receive `moth_archive.key` (`item_moth_usb`) and set `laundromat_meeting_done === true`
   │
   ▼
[Scene 04: APARTMENT_RETURN (03:12 AM — Intrusion Detected)]
   │
   ├─ Event: MOTH message arrives on Smartphone (`contacted_moth` becomes `true` only when read)
   └─ Gate 6: Inspect `/home/eli/archive_vault/lantern_auth_audit.db` using `moth_archive.key`
   │
   ▼
[CHAPTER 1 CLIMAX: "WE KNOW WHO YOU ARE." -> Dynamic Ending Resolution]
   ├─ ENDING A: THE SIGNAL LEAKS (Full evidence + Timeline correlated + Rhea Allied + Nadia Trust >= 55% + Low Risk)
   ├─ ENDING B: A DIRTY BARGAIN (Strong evidence + Timeline correlated + Low Risk, but missing Media/Ally support)
   └─ ENDING C: THE FALL GUY (Suspicion >= 45% OR Exposure >= 45% OR Incomplete Evidence/Timeline)
```

---

## 2. State Variables & Single Source of Truth

| Variable | Source / Trigger | Gameplay Consequence |
| :--- | :--- | :--- |
| `trust_nadia` (0–100) | Initial: `55`. Modified by `CALL_NADIA` (`+10`), `CONTACT_ALLY` (`+5`), and Nadia dialogue nodes. Synced with `characters['nadia'].trust`. | Determines Nadia's stance (`Allied`, `Guarded`, `Defensive`). At `>= 65%`, grants `-5%` exposure filter; required (`>= 55%`) for **Ending A**. |
| `corporate_suspicion` (0–100) | Initial: `15`. Modified by `CALL_NADIA` (`+15`), `TRACE_SMS` (`+5`), `WAIT_CHECK_PC` (`-5`), `hs_camera` when exposed (`+5`), and pressing Nadia (`+5`). | At `>= 25%`, triggers `soc_warning_triggered` alert. At `>= 45%`, triggers **Ending C (`THE FALL GUY`)**. |
| `player_exposure` (0–100) | Initial: `10`. Modified by `CALL_NADIA` (`+15`), `TRACE_SMS` (`+5`), `rhea_c1_share` (`+5`), and Nadia high-trust bonus (`-5`). | At `>= 20%`, causes Municipal Optical Pole `#04` to track Eli's gait (`+5%` suspicion). At `>= 45%`, triggers **Ending C**. |
| `journalist_contact` & `rhea_allied` | Set when speaking with Rhea Solis on 4th Avenue (`rhea_c1_share` sets `rhea_allied = true`). | `rhea_allied = true` establishes the encrypted media dead-drop required for **Ending A**. |
| `contacted_moth` | Remains `false` upon entering `APARTMENT_RETURN`; set to `true` only when Eli opens the Smartphone to read MOTH's message or dialogues with MOTH. | Accurately tracks whether the player engaged with MOTH's backchannel. |
| `evidence_count` (0–6) | Derived directly from `evidence.filter(e => e.discovered).length`. | `>= 2` initial artifacts required to correlate timeline; `>= 5` required for **Ending A**. |
| `timeline_correlated` | Set via `verify` / `timeline` terminal command or clicking `Correlate Evidence` (requires `>= 2` discovered artifacts). | Required to exit `APARTMENT_NIGHT` and required to avoid **Ending C**. |
