# Technical Report — DEAD AIR V0.3 (Immersive Hacking Gameplay & Multi-Host Virtual Network)

## 1. Executive Summary of Changes

**DEAD AIR V0.3** upgrades the GreyOS 6.4 workstation from a preset file-reader terminal into a stateful, multi-host virtual network where every port scan, credential exploit, remote `/var/log` inspection, and tactical host operation directly impacts Chapter 1's narrative investigation, character trust, surveillance exposure, and ending resolution.

### Key Architectural Additions in V0.3
1. **Stateful Multi-Host Virtual Network (`src/game/types.ts` & `src/data/storyData.ts`)**:
   - Added 5 distinct virtual hosts (`VirtualHost`) with real port/service tables (`NetworkService`), OS fingerprints, privilege levels (`LOCKED`, `GUEST`, `USER`, `OPERATOR`, `ADMIN`, `ROOT`), and remote `/var/log` telemetry:
     - `10.0.2.15` (`apt4b-workstation.local`) — Eli's Local GreyOS Node (`USER`)
     - `172.16.40.12` (`moth-sip-relay.port`) — Port District Disposable SIP Relay (`GUEST` -> `OPERATOR`)
     - `10.40.4.18` (`muni-cam-sector04.gov`) — 4th Ave Municipal Optical Pole #04 (`LOCKED` -> `ADMIN`)
     - `10.88.4.22` (`vespera-edge-gw02.corp`) — Vespera Core Telemetry Gateway 02 (`LOCKED` -> `ROOT`)
     - `10.88.14.9` (`vespera-enclave-gw.corp`) — Vespera Executive Enclave & IDS Honey-Trap (`LOCKED`)
2. **Interactive Terminal & Network Ops Suite (`src/game/storyEngine.ts` & `src/computer/VirtualDesktopModal.tsx`)**:
   - Added terminal commands: `netmap` / `hosts` / `ifconfig`, `nmap <ip>`, `exploit <ip>` / `ssh <ip>`, `logs <ip>`, `pivot 172.16.40.12`, `scrub 10.40.4.18`, and `dump 10.88.4.22`.
   - Added the **Network & Host Ops (`NETWORK`)** application inside the GreyOS 6.4 desktop featuring a live subnet topology sidebar, tactical countermeasure status indicators, service/port table, 4-step intrusion action bar (`nmap`, `exploit`, `logs`, and tactical operation), and remote `/var/log` viewer.
3. **Narrative & Consequence Integration**:
   - **Dark-Fiber Proxy Tunnel (`pivot 172.16.40.12`)**: Compromising the MOTH relay and reading its SIP logs proves Vespera tapped Nadia's handset (`+5% Nadia Trust`), while pivoting through its dark-fiber tunnel sets `relay_tunnel_active = true` and reduces `player_exposure` by `-10%`.
   - **Counter-Surveillance Camera Scrub (`scrub 10.40.4.18`)**: Using Eli's legacy maintenance credential (`e.ward_09`) to compromise 4th Ave Optical Pole #04 and scrub its NVRAM sets `camera_scrubbed = true`, reduces `player_exposure` by `-10%` and `corporate_suspicion` by `-5%`, and prevents `hs_camera` on 4th Avenue from locking onto Eli's gait/IMEI.
   - **Cryptographic Keyring Counter-Proof (`dump 10.88.4.22`)**: Using the `svc_lantern_sync` shadow token (`0x9F4A2C`) discovered in `auth_shadow.dump` to root Vespera Edge Gateway 02 and dump `/var/log/kern_keyring.log` proves Director Marcus Hale (`[M_HALE_SEC_01]`) forged Eli's signature (`counter_proof_secured = true`, `-5% Corporate Suspicion`).

---

## 2. Verification & Automated Test Results

All three verification suites (`npm run lint`, `npm test`, `npm run build`) were executed directly in the workspace:

- `npm run lint` (`tsc --noEmit`): **0 errors**
- `npm test` (`tsx --test src/game/rules.test.ts`): **21 / 21 tests passed (0 failures)**
- `npm run build` (`vite build`): **Succeeded**
