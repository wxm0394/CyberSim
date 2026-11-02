# Technical Report — DEAD AIR V0.2 (Narrative Integrity & Consequence System)

## 1. Executive Summary of Changes

This V0.2 update upgrades **DEAD AIR — 城市静默 (Chapter 1)** from an open-navigation prototype into a rule-enforced narrative hacker RPG with strict scene prerequisites, one-time locked decisions, consequence-driven metrics, three genuinely reachable endings, versioned LocalStorage migration, and a 17-point automated test suite.

### Key Fixes & Architecture Improvements
1. **Strict `requiresScene` Enforcement on Final Database (`P0 #1`)**:
   - `canAccessVirtualFile(state, file)` unconditionally checks both `file.requiresKeyId` and `file.requiresScene` (`APARTMENT_RETURN`) regardless of `file.unlocked`.
   - Completing Nadia's 3rd dialogue node in `LAUNDROMAT` grants `moth_archive.key` (`item_moth_usb`) without prematurely marking `lantern_auth_audit.db` as unlocked while still in `LAUNDROMAT`.
   - Attempting to read `/home/eli/archive_vault/lantern_auth_audit.db` while in `LAUNDROMAT` is rejected (`Access restricted: This local workstation volume can only be mounted inside Apartment 4B (APARTMENT_RETURN)`).
2. **Authentic Gameplay Paths to Ending C (`P0 #2`)**:
   - Added high-risk hacker/investigative actions so `corporate_suspicion >= 45` and `player_exposure >= 45` are naturally reachable during a complete playthrough:
     - Active Enclave gateway probing in the terminal (`probe 10.88.14.9`) trips Vespera SOC's IDS honey-trap (`+15% Corporate Suspicion`, `+15% Exposure`).
     - Unauthorized LUKS volume read attempts without `moth_archive.key` trigger a LUKS watchdog alert (`+10% Corporate Suspicion`, `+5% Exposure`).
     - Inspecting Municipal Optical Pole `#04` (`hs_camera`) on 4th Avenue when `player_exposure >= 20%` locks optical gait tracking (`+10% Corporate Suspicion`, `+10% Exposure`).
     - Pressing Nadia aggressively (`nadia_c2_press`) increases suspicion (`+10%`) and exposure (`+5%`).
   - Verified in Test #13 with a complete start-to-finish gameplay sequence reaching `ENDING_C_FALL_GUY` without manual flag overrides.
3. **Mutually Exclusive Dialogue Node Locking (`resolvedDialogueNodes`)**:
   - Added `resolvedDialogueNodes: Record<string, string>` to `DeadAirState`. Once a choice is selected on `characterId:nodeId` (such as Rhea's `rhea_node_1`), alternative options on that node are permanently locked out and the NPC advances to a follow-up node (`rhea_node_2_allied` / `rhea_node_2_cautious`).
4. **Separated `camera_tracking_risk` from `camera_tracked`**:
   - Reaching `player_exposure >= 20%` sets `camera_tracking_risk = true`, while `camera_tracked` remains `false` until the player actually inspects `hs_camera` on 4th Avenue (`STREET_NIGHT`).
5. **Hotspot & Dialogue Node Persistence in `migrateDeadAirSave()`**:
   - `migrateDeadAirSave()` now merges `candidate.hotspots` inspection states per scene and restores `candidate.resolvedDialogueNodes`.
6. **Production Environment Gate on `DEV` Debug Mode (`import.meta.env.DEV`)**:
   - The `DEV` toggle button in `CinematicSceneView.tsx` is gated behind `import.meta.env.DEV` so normal production builds cannot toggle debug bypasses in the UI.

---

## 2. Verification & Automated Test Results

All three verification suites (`npm run lint`, `npm test`, `npm run build`) were executed directly in the workspace:

- `npm run lint` (`tsc --noEmit`): **0 errors**
- `npm test` (`tsx --test src/game/rules.test.ts`): **17 / 17 tests passed (0 failures)**
- `npm run build` (`vite build`): **Succeeded**
