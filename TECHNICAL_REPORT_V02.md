# Technical Report — DEAD AIR V0.2 (Narrative Integrity & Consequence System)

## 1. Executive Summary of Changes

This V0.2 update upgrades **DEAD AIR — 城市静默 (Chapter 1)** from an open-navigation prototype into a rule-enforced narrative hacker RPG with strict scene prerequisites, one-time locked decisions, consequence-driven metrics, three reachable endings, versioned LocalStorage migration, and a 17-point automated test suite.

### Modified & Added Files
- `src/game/types.ts`: Added `ChapterEndingId`, `ChapterEndingReport`, `SceneTransitionCheck`, `saveVersion`, `unlockedScenes`, `completedEvents`, `inspectedFiles`, `endingId`, `first_choice_locked`, `rhea_allied`, `soc_warning_triggered`, and `camera_tracked`.
- `src/data/storyData.ts`: Added `CURRENT_SAVE_VERSION = 2` and `CHAPTER_ONE_ENDINGS` (`ENDING_A_SIGNAL_LEAKS`, `ENDING_B_DIRTY_BARGAIN`, `ENDING_C_FALL_GUY`), plus explicit `requiresKeyId` and `requiresScene` metadata on `/home/eli/archive_vault/lantern_auth_audit.db`.
- `src/game/storyEngine.ts`:
  - Implemented `canTransitionToScene` and enforced it inside `transitionToScene` and `inspectHotspot`.
  - Fixed `APARTMENT_RETURN` entry so `contacted_moth` is only set when the player reads MOTH's message or interacts with MOTH.
  - Enforced one-time execution on `handleFirstPhoneChoice` and tracked event uniqueness via `completedEvents`.
  - Implemented `canAccessVirtualFile` and enhanced terminal commands (`ls`, `cd`, `cat`, `stat`, `grep`, `unzip`, `verify`, `timeline`, `status`, `whoami`, `clear`) to reject locked or missing files and require `>= 2` discovered artifacts before correlating the timeline.
  - Implemented deterministic multi-ending resolution via `resolveChapterOneEnding(state)`.
- `src/persistence/storage.ts`: Added `dead_air_save_v2` storage with automatic migration from legacy `dead_air_save_v1` (`migrateDeadAirSave`), safe fallback on corrupted JSON, and complete state wipe on `clearDeadAirSave()`.
- `src/scenes/CinematicSceneView.tsx`, `src/ui/PhoneOverlay.tsx`, `src/ui/DialogueOverlay.tsx`, `src/computer/VirtualDesktopModal.tsx`, `src/App.tsx`: Updated UI to lock confirmed phone choices, display file verification/lock badges, replace free scene skipping with gated progression + isolated `DEV` sandbox mode, and render the complete Ending A / B / C settlement report.
- `src/game/rules.test.ts` & `package.json`: Added `"test": "tsx --test src/game/rules.test.ts"` covering all 17 required verification cases.

---

## 2. Verification & Automated Test Results

All three verification suites (`npm run lint`, `npm run build`, `npm test`) were executed directly in the workspace:

- `npm run lint` (`tsc --noEmit`): **0 errors**
- `npm run build` (`vite build`): **Succeeded**
- `npm test` (`tsx --test src/game/rules.test.ts`): **17 / 17 tests passed (0 failures)**
