# Technical Report — DEAD AIR V0.2.2 (Gameplay Access & Probe Integrity)

## 1. Executive Summary of Changes

This V0.2.2 point release hardens **DEAD AIR — 城市静默 (Chapter 1)** across workstation scene access boundaries and active network probe validation, ensuring zero scene-gate bypasses and strict command idempotency.

### V0.2.2 Targeted Fixes
1. **Fixed Stale Scene Closure in `[C]` Key Listener & Centralized Workstation Access Gate**:
   - Added `canAccessWorkstation(state)`, `openWorkstationOverlay(state, app)`, and `toggleWorkstationOverlay(state)` in `src/game/storyEngine.ts`.
   - Added `state.currentScene` to the `keydown` `useEffect` dependency list in `src/App.tsx`, and delegated `[C]` key presses directly to `setState((prev) => toggleWorkstationOverlay(prev))` so the check always evaluates against the latest scene state.
   - Guarded `<VirtualDesktopModal />` rendering with `canAccessWorkstation(state)`.
2. **Closed Smartphone Overlay's Workstation Bypass Outside Apartment 4B**:
   - Updated `src/ui/PhoneOverlay.tsx` so `BOOT WORKSTATION (incident_0427.zip)` (`data-testid="phone-to-workstation-btn"`) is only rendered when `canAccessWorkstation(state)` is `true` (`APARTMENT_NIGHT` or `APARTMENT_RETURN`). In `STREET_NIGHT` and `LAUNDROMAT`, it is replaced by `PUT PHONE AWAY (WORKSTATION IN APT 4B)`.
   - Wired `onOpenWorkstation` in `src/App.tsx` through `openWorkstationOverlay(prev, 'FILES')` so programmatic calls outside Apartment 4B are rejected.
3. **Restricted `probe` Command to Specific Enclave Gateway (`10.88.14.9`) & Added Error/Idempotency Tests**:
   - Running `probe` without an IP returns a usage error (`probe: missing target host or IPv4 address`) with zero stat changes.
   - Running `probe` against unknown/unrelated IPs (e.g., `192.168.1.254`, `8.8.8.8`) returns `Network unreachable` with zero stat changes.
   - Running `probe 127.0.0.1` performs a safe local loopback check (`0%` risk).
   - Only `probe 10.88.14.9` (or `vespera-enclave-gw`) triggers the Vespera Executive Enclave IDS Honey-Trap (`+15% Corporate Suspicion`, `+15% Player Exposure`), locked under the canonical key `event:active_probe:10.88.14.9` so repeated probes never stack additional suspicion or exposure.

---

## 2. Verification & Automated Test Results

All three verification suites (`npm run lint`, `npm test`, `npm run build`) were executed directly in the workspace:

- `npm run lint` (`tsc --noEmit`): **0 errors**
- `npm test` (`tsx --test src/game/rules.test.ts`): **19 / 19 tests passed (0 failures)**
- `npm run build` (`vite build`): **Succeeded**
