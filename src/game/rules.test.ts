import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CURRENT_SAVE_VERSION,
  createInitialDeadAirState,
} from '../data/storyData';
import {
  canAccessVirtualFile,
  canAccessWorkstation,
  canTransitionToScene,
  correlateEvidenceTimeline,
  executeDeadAirCommand,
  handleFirstPhoneChoice,
  hasMothArchiveKey,
  inspectHotspot,
  inspectVirtualFile,
  openPhoneOverlay,
  openWorkstationOverlay,
  selectCharacterDialogueChoice,
  toggleWorkstationOverlay,
  transitionToScene,
} from './storyEngine';
import { clearDeadAirSave, migrateDeadAirSave } from '../persistence/storage';

describe('DEAD AIR V0.2.2 — Narrative Integrity, Workstation Access & Probe Integrity', () => {
  it('1. initializes game state with saveVersion 2, APARTMENT_NIGHT at 02:17 AM, and 0 discovered evidence', () => {
    const state = createInitialDeadAirState('playing');
    assert.equal(state.saveVersion, CURRENT_SAVE_VERSION);
    assert.equal(state.currentScene, 'APARTMENT_NIGHT');
    assert.equal(state.clockTime, '02:17 AM');
    assert.equal(state.evidence.length, 6);
    assert.equal(state.flags.evidence_count, 0);
    assert.equal(state.flags.first_choice, null);
    assert.equal(state.flags.first_choice_locked, false);
    assert.equal(state.flags.contacted_moth, false);
    assert.equal(state.flags.camera_tracking_risk, false);
    assert.equal(state.flags.camera_tracked, false);
  });

  it('2. enforces one-time first phone choice and prevents repeated stat accumulation', () => {
    let state = createInitialDeadAirState('playing');
    state = handleFirstPhoneChoice(state, 'CALL_NADIA');
    assert.equal(state.flags.first_choice, 'CALL_NADIA');
    assert.equal(state.flags.first_choice_locked, true);
    assert.equal(state.flags.trust_nadia, 65);
    assert.equal(state.flags.corporate_suspicion, 30);
    assert.equal(state.flags.player_exposure, 25);

    // Attempting to click again or switch choice must be ignored
    const afterRepeat = handleFirstPhoneChoice(state, 'CALL_NADIA');
    assert.equal(afterRepeat.flags.trust_nadia, 65);
    assert.equal(afterRepeat.flags.corporate_suspicion, 30);

    const afterSwitchAttempt = handleFirstPhoneChoice(state, 'WAIT_CHECK_PC');
    assert.equal(afterSwitchAttempt.flags.first_choice, 'CALL_NADIA');
    assert.equal(afterSwitchAttempt.flags.corporate_suspicion, 30);
  });

  it('3. blocks leaving APARTMENT_NIGHT if fewer than 2 forensic files are inspected', () => {
    let state = createInitialDeadAirState('playing');
    state = handleFirstPhoneChoice(state, 'WAIT_CHECK_PC');
    state = inspectVirtualFile(
      state,
      '/home/eli/Downloads/incident_0427/ntp_override.conf'
    );
    assert.equal(state.flags.evidence_count, 1);

    const check = canTransitionToScene(state, 'STREET_NIGHT');
    assert.equal(check.allowed, false);
    assert.match(check.reason, /Inspect at least 2 forensic files/);

    const attempted = transitionToScene(state, 'STREET_NIGHT');
    assert.equal(attempted.currentScene, 'APARTMENT_NIGHT');
  });

  it('4. blocks leaving APARTMENT_NIGHT until timeline correlation is completed', () => {
    let state = createInitialDeadAirState('playing');
    state = handleFirstPhoneChoice(state, 'WAIT_CHECK_PC');
    state = inspectVirtualFile(
      state,
      '/home/eli/Downloads/incident_0427/ntp_override.conf'
    );
    state = inspectVirtualFile(
      state,
      '/home/eli/Downloads/incident_0427/access_0427.log'
    );
    assert.equal(state.flags.evidence_count, 2);
    assert.equal(state.flags.timeline_correlated, false);

    // Still blocked before correlating timeline
    assert.equal(canTransitionToScene(state, 'STREET_NIGHT').allowed, false);
    const blocked = inspectHotspot(state, 'hs_door_exit');
    assert.equal(blocked.currentScene, 'APARTMENT_NIGHT');

    // Now correlate timeline -> unlocks STREET_NIGHT
    state = correlateEvidenceTimeline(state);
    assert.equal(state.flags.timeline_correlated, true);
    assert.equal(canTransitionToScene(state, 'STREET_NIGHT').allowed, true);
  });

  it('5. requires completing Nadia Park 3-node dialogue to obtain moth_archive.key', () => {
    let state = createInitialDeadAirState('playing');
    state = handleFirstPhoneChoice(state, 'WAIT_CHECK_PC');
    state = inspectVirtualFile(
      state,
      '/home/eli/Downloads/incident_0427/ntp_override.conf'
    );
    state = inspectVirtualFile(
      state,
      '/home/eli/Downloads/incident_0427/access_0427.log'
    );
    state = correlateEvidenceTimeline(state);
    state = transitionToScene(state, 'STREET_NIGHT');
    state = transitionToScene(state, 'LAUNDROMAT');

    // Before finishing Nadia dialogue, player cannot get key or enter APARTMENT_RETURN
    assert.equal(hasMothArchiveKey(state), false);
    assert.equal(canTransitionToScene(state, 'APARTMENT_RETURN').allowed, false);

    // Node 1 -> Node 2 (still incomplete)
    state = selectCharacterDialogueChoice(state, 'nadia', 'nadia_c1_share');
    assert.equal(hasMothArchiveKey(state), false);
    state = selectCharacterDialogueChoice(state, 'nadia', 'nadia_c2_expose');
    assert.equal(hasMothArchiveKey(state), false);

    // Node 3 completion grants moth_archive.key and unlocks APARTMENT_RETURN
    state = selectCharacterDialogueChoice(state, 'nadia', 'nadia_c3_accept');
    assert.equal(hasMothArchiveKey(state), true);
    assert.equal(state.flags.laundromat_meeting_done, true);
    assert.equal(canTransitionToScene(state, 'APARTMENT_RETURN').allowed, true);
  });

  it('6. blocks reading lantern_auth_audit.db when moth_archive.key is missing OR when still in LAUNDROMAT before returning to APARTMENT_RETURN', () => {
    let state = createInitialDeadAirState('playing');
    state = inspectVirtualFile(
      state,
      '/home/eli/archive_vault/lantern_auth_audit.db'
    );
    assert.equal(state.flags.discovered_eli_account_reuse, false);
    assert.equal(state.shellState, 'playing');
    assert.match(state.monologueBanner, /Permission denied/);

    // Progress to LAUNDROMAT and obtain moth_archive.key from Nadia
    state = handleFirstPhoneChoice(state, 'WAIT_CHECK_PC');
    state = inspectVirtualFile(
      state,
      '/home/eli/Downloads/incident_0427/ntp_override.conf'
    );
    state = inspectVirtualFile(
      state,
      '/home/eli/Downloads/incident_0427/access_0427.log'
    );
    state = correlateEvidenceTimeline(state);
    state = transitionToScene(state, 'STREET_NIGHT');
    state = transitionToScene(state, 'LAUNDROMAT');
    state = selectCharacterDialogueChoice(state, 'nadia', 'nadia_c1_share');
    state = selectCharacterDialogueChoice(state, 'nadia', 'nadia_c2_expose');
    state = selectCharacterDialogueChoice(state, 'nadia', 'nadia_c3_accept');

    assert.equal(hasMothArchiveKey(state), true);
    assert.equal(state.currentScene, 'LAUNDROMAT');

    // Even with moth_archive.key acquired, reading lantern_auth_audit.db while still in LAUNDROMAT MUST fail!
    const dbFileInLaundromat = state.files.find(
      (f) => f.path === '/home/eli/archive_vault/lantern_auth_audit.db'
    )!;
    assert.equal(dbFileInLaundromat.unlocked, false);
    assert.equal(
      canAccessVirtualFile(state, dbFileInLaundromat).allowed,
      false
    );

    state = executeDeadAirCommand(
      state,
      'cat /home/eli/archive_vault/lantern_auth_audit.db'
    );
    assert.equal(state.flags.discovered_eli_account_reuse, false);
    assert.equal(state.shellState, 'playing');
    const lastLineInLaundromat =
      state.terminalHistory[state.terminalHistory.length - 1];
    assert.equal(lastLineInLaundromat.tone, 'error');
    assert.match(lastLineInLaundromat.text, /Access restricted/);

    // Only after returning to APARTMENT_RETURN can the final database be read
    state = transitionToScene(state, 'APARTMENT_RETURN');
    assert.equal(state.currentScene, 'APARTMENT_RETURN');
    const dbFileInReturn = state.files.find(
      (f) => f.path === '/home/eli/archive_vault/lantern_auth_audit.db'
    )!;
    assert.equal(canAccessVirtualFile(state, dbFileInReturn).allowed, true);

    state = executeDeadAirCommand(
      state,
      'cat /home/eli/archive_vault/lantern_auth_audit.db'
    );
    assert.equal(state.flags.discovered_eli_account_reuse, true);
    assert.equal(state.shellState, 'gameover');
  });

  it('7. rejects illegal scene jumps in normal mode and does not auto-set contacted_moth on room entry', () => {
    let state = createInitialDeadAirState('playing');

    // Attempt direct jump from start to LAUNDROMAT or APARTMENT_RETURN
    const tryLaundromat = transitionToScene(state, 'LAUNDROMAT');
    assert.equal(tryLaundromat.currentScene, 'APARTMENT_NIGHT');

    const tryReturn = transitionToScene(state, 'APARTMENT_RETURN');
    assert.equal(tryReturn.currentScene, 'APARTMENT_NIGHT');

    // Progress legally to APARTMENT_RETURN and verify contacted_moth is false until phone is checked
    state = handleFirstPhoneChoice(state, 'WAIT_CHECK_PC');
    state = inspectVirtualFile(
      state,
      '/home/eli/Downloads/incident_0427/ntp_override.conf'
    );
    state = inspectVirtualFile(
      state,
      '/home/eli/Downloads/incident_0427/access_0427.log'
    );
    state = correlateEvidenceTimeline(state);
    state = transitionToScene(state, 'STREET_NIGHT');
    state = transitionToScene(state, 'LAUNDROMAT');
    state = selectCharacterDialogueChoice(state, 'nadia', 'nadia_c1_share');
    state = selectCharacterDialogueChoice(state, 'nadia', 'nadia_c2_expose');
    state = selectCharacterDialogueChoice(state, 'nadia', 'nadia_c3_accept');
    state = transitionToScene(state, 'APARTMENT_RETURN');

    assert.equal(state.currentScene, 'APARTMENT_RETURN');
    assert.equal(state.flags.contacted_moth, false);

    // Opening phone in APARTMENT_RETURN reads MOTH's message and sets contacted_moth = true
    state = openPhoneOverlay(state);
    assert.equal(state.flags.contacted_moth, true);
  });

  it('8. executes a full legal story path from Apartment Night to Chapter 1 Finale', () => {
    let state = createInitialDeadAirState('playing');
    state = handleFirstPhoneChoice(state, 'TRACE_SMS');
    state = executeDeadAirCommand(state, 'cat ntp_override.conf');
    state = executeDeadAirCommand(state, 'cat access_0427.log');
    state = executeDeadAirCommand(state, 'cat auth_shadow.dump');
    state = executeDeadAirCommand(state, 'verify');

    state = inspectHotspot(state, 'hs_door_exit');
    assert.equal(state.currentScene, 'STREET_NIGHT');

    state = selectCharacterDialogueChoice(state, 'rhea', 'rhea_c1_share');
    state = inspectHotspot(state, 'hs_enter_laundromat');
    assert.equal(state.currentScene, 'LAUNDROMAT');

    state = selectCharacterDialogueChoice(state, 'nadia', 'nadia_c1_share');
    state = selectCharacterDialogueChoice(state, 'nadia', 'nadia_c2_expose');
    state = selectCharacterDialogueChoice(state, 'nadia', 'nadia_c3_accept');

    state = inspectHotspot(state, 'hs_laundromat_exit');
    assert.equal(state.currentScene, 'APARTMENT_RETURN');

    state = executeDeadAirCommand(
      state,
      'cat /home/eli/archive_vault/lantern_auth_audit.db'
    );
    assert.equal(state.flags.discovered_eli_account_reuse, true);
    assert.equal(state.shellState, 'gameover');
    assert.ok(state.endingId !== null);
  });

  it('9. updates trust_nadia accurately and keeps character profile trust synchronized', () => {
    let state = createInitialDeadAirState('playing');
    assert.equal(state.flags.trust_nadia, 55);

    state = selectCharacterDialogueChoice(state, 'nadia', 'nadia_c1_share'); // +10 -> 65
    assert.equal(state.flags.trust_nadia, 65);
    assert.equal(
      state.characters.find((c) => c.id === 'nadia')?.trust,
      65
    );

    state = selectCharacterDialogueChoice(state, 'nadia', 'nadia_c2_press'); // -15 -> 50
    assert.equal(state.flags.trust_nadia, 50);
    assert.equal(
      state.characters.find((c) => c.id === 'nadia')?.trust,
      50
    );
  });

  it('10. updates corporate_suspicion accurately and triggers SOC alert at >= 25%', () => {
    let state = createInitialDeadAirState('playing');
    assert.equal(state.flags.corporate_suspicion, 15);
    assert.equal(state.flags.soc_warning_triggered, false);

    state = handleFirstPhoneChoice(state, 'CALL_NADIA'); // +15 -> 30
    assert.equal(state.flags.corporate_suspicion, 30);
    assert.equal(state.flags.soc_warning_triggered, true);
  });

  it('11. separates camera_tracking_risk from camera_tracked until hs_camera is actually inspected on 4th Ave', () => {
    let state = createInitialDeadAirState('playing');
    state = handleFirstPhoneChoice(state, 'CALL_NADIA'); // exposure 10 + 15 = 25
    assert.equal(state.flags.player_exposure, 25);

    // exposure >= 20 sets camera_tracking_risk = true, but camera_tracked MUST remain false before inspecting hs_camera
    assert.equal(state.flags.camera_tracking_risk, true);
    assert.equal(state.flags.camera_tracked, false);

    state = inspectVirtualFile(
      state,
      '/home/eli/Downloads/incident_0427/ntp_override.conf'
    );
    state = inspectVirtualFile(
      state,
      '/home/eli/Downloads/incident_0427/access_0427.log'
    );
    state = correlateEvidenceTimeline(state);
    state = transitionToScene(state, 'STREET_NIGHT');

    // Still false upon entering STREET_NIGHT prior to inspecting hs_camera
    assert.equal(state.flags.camera_tracked, false);

    // Inspecting Municipal Optical Pole #04 with exposure >= 20 locks camera_tracked = true and increases suspicion (+10) & exposure (+10)
    const beforeSuspicion = state.flags.corporate_suspicion;
    const beforeExposure = state.flags.player_exposure;
    state = inspectHotspot(state, 'hs_camera');
    assert.equal(state.flags.camera_tracked, true);
    assert.equal(state.flags.corporate_suspicion, beforeSuspicion + 10);
    assert.equal(state.flags.player_exposure, beforeExposure + 10);
  });

  it('12. enforces mutually exclusive dialogue choices per node (Rhea cannot be switched from cautious to share)', () => {
    const base = createInitialDeadAirState('playing');

    const pathAllied = selectCharacterDialogueChoice(
      base,
      'rhea',
      'rhea_c1_share'
    );
    assert.equal(pathAllied.flags.journalist_contact, true);
    assert.equal(pathAllied.flags.rhea_allied, true);
    assert.equal(
      pathAllied.resolvedDialogueNodes['rhea:rhea_node_1'],
      'rhea_c1_share'
    );

    // Choosing rhea_c1_cautious locks rhea_node_1 and advances to rhea_node_2_cautious; trying to pick rhea_c1_share afterwards is rejected
    const pathCautious = selectCharacterDialogueChoice(
      base,
      'rhea',
      'rhea_c1_cautious'
    );
    assert.equal(pathCautious.flags.journalist_contact, true);
    assert.equal(pathCautious.flags.rhea_allied, false);
    assert.equal(
      pathCautious.resolvedDialogueNodes['rhea:rhea_node_1'],
      'rhea_c1_cautious'
    );

    const attemptedFlipToShare = selectCharacterDialogueChoice(
      pathCautious,
      'rhea',
      'rhea_c1_share'
    );
    assert.equal(attemptedFlipToShare.flags.rhea_allied, false);
    assert.equal(
      attemptedFlipToShare.flags.player_exposure,
      pathCautious.flags.player_exposure
    );
  });

  it('13. reaches all 3 distinct Chapter 1 Endings (Ending A, Ending B, Ending C) via authentic, complete gameplay paths', () => {
    // 13A: Authentic gameplay path to ENDING A (THE SIGNAL LEAKS)
    let stateA = createInitialDeadAirState('playing');
    stateA = handleFirstPhoneChoice(stateA, 'WAIT_CHECK_PC');
    stateA = inspectVirtualFile(
      stateA,
      '/home/eli/Downloads/incident_0427/ntp_override.conf'
    );
    stateA = inspectVirtualFile(
      stateA,
      '/home/eli/Downloads/incident_0427/access_0427.log'
    );
    stateA = inspectVirtualFile(
      stateA,
      '/home/eli/Downloads/incident_0427/auth_shadow.dump'
    );
    stateA = correlateEvidenceTimeline(stateA);
    stateA = transitionToScene(stateA, 'STREET_NIGHT');
    stateA = selectCharacterDialogueChoice(stateA, 'rhea', 'rhea_c1_share');
    stateA = transitionToScene(stateA, 'LAUNDROMAT');
    stateA = selectCharacterDialogueChoice(stateA, 'nadia', 'nadia_c1_share');
    stateA = selectCharacterDialogueChoice(stateA, 'nadia', 'nadia_c2_expose');
    stateA = selectCharacterDialogueChoice(stateA, 'nadia', 'nadia_c3_accept');
    stateA = transitionToScene(stateA, 'APARTMENT_RETURN');
    stateA = inspectVirtualFile(
      stateA,
      '/home/eli/archive_vault/lantern_auth_audit.db'
    );
    assert.equal(stateA.shellState, 'gameover');
    assert.equal(stateA.endingId, 'ENDING_A_SIGNAL_LEAKS');

    // 13B: Authentic gameplay path to ENDING B (A DIRTY BARGAIN)
    let stateB = createInitialDeadAirState('playing');
    stateB = handleFirstPhoneChoice(stateB, 'WAIT_CHECK_PC');
    stateB = inspectVirtualFile(
      stateB,
      '/home/eli/Downloads/incident_0427/ntp_override.conf'
    );
    stateB = inspectVirtualFile(
      stateB,
      '/home/eli/Downloads/incident_0427/access_0427.log'
    );
    stateB = correlateEvidenceTimeline(stateB);
    stateB = transitionToScene(stateB, 'STREET_NIGHT');
    stateB = selectCharacterDialogueChoice(stateB, 'rhea', 'rhea_c1_cautious');
    stateB = transitionToScene(stateB, 'LAUNDROMAT');
    stateB = selectCharacterDialogueChoice(stateB, 'nadia', 'nadia_c1_question');
    stateB = selectCharacterDialogueChoice(stateB, 'nadia', 'nadia_c2_withhold');
    stateB = selectCharacterDialogueChoice(stateB, 'nadia', 'nadia_c3_accept');
    stateB = transitionToScene(stateB, 'APARTMENT_RETURN');
    stateB = inspectVirtualFile(
      stateB,
      '/home/eli/archive_vault/lantern_auth_audit.db'
    );
    assert.equal(stateB.shellState, 'gameover');
    assert.equal(stateB.endingId, 'ENDING_B_DIRTY_BARGAIN');

    // 13C: Authentic, complete gameplay path to ENDING C (THE FALL GUY) without any manual flag mutation
    let stateC = createInitialDeadAirState('playing');
    stateC = handleFirstPhoneChoice(stateC, 'CALL_NADIA');
    assert.equal(stateC.flags.corporate_suspicion, 30);
    assert.equal(stateC.flags.player_exposure, 25);

    stateC = executeDeadAirCommand(stateC, 'cat ntp_override.conf');
    stateC = executeDeadAirCommand(stateC, 'cat access_0427.log');
    stateC = executeDeadAirCommand(stateC, 'probe 10.88.14.9');
    assert.equal(stateC.flags.corporate_suspicion, 45);
    assert.equal(stateC.flags.player_exposure, 40);
    stateC = executeDeadAirCommand(stateC, 'verify');

    stateC = transitionToScene(stateC, 'STREET_NIGHT');
    stateC = inspectHotspot(stateC, 'hs_camera');
    assert.equal(stateC.flags.camera_tracked, true);
    assert.equal(stateC.flags.corporate_suspicion, 55);
    assert.equal(stateC.flags.player_exposure, 50);

    stateC = transitionToScene(stateC, 'LAUNDROMAT');
    stateC = selectCharacterDialogueChoice(stateC, 'nadia', 'nadia_c1_question');
    stateC = selectCharacterDialogueChoice(stateC, 'nadia', 'nadia_c2_press');
    stateC = selectCharacterDialogueChoice(stateC, 'nadia', 'nadia_c3_accept');

    stateC = transitionToScene(stateC, 'APARTMENT_RETURN');
    stateC = executeDeadAirCommand(
      stateC,
      'cat /home/eli/archive_vault/lantern_auth_audit.db'
    );
    assert.equal(stateC.shellState, 'gameover');
    assert.equal(stateC.endingId, 'ENDING_C_FALL_GUY');
  });

  it('14. migrates legacy v1 saves, preserves inspected hotspots and resolvedDialogueNodes, and safely falls back on corrupted save data', () => {
    let activeState = createInitialDeadAirState('playing');
    activeState = inspectHotspot(activeState, 'hs_window');
    activeState = selectCharacterDialogueChoice(
      activeState,
      'rhea',
      'rhea_c1_cautious'
    );
    assert.equal(
      activeState.hotspots.APARTMENT_NIGHT.find((h) => h.id === 'hs_window')
        ?.inspected,
      true
    );

    const roundTripped = migrateDeadAirSave(
      JSON.parse(JSON.stringify(activeState)),
      true
    );
    assert.equal(
      roundTripped.hotspots.APARTMENT_NIGHT.find((h) => h.id === 'hs_window')
        ?.inspected,
      true
    );
    assert.equal(
      roundTripped.resolvedDialogueNodes['rhea:rhea_node_1'],
      'rhea_c1_cautious'
    );

    const legacyV1Save = {
      shellState: 'playing',
      currentScene: 'STREET_NIGHT',
      clockTime: '02:41 AM',
      flags: {
        voicemail_played: true,
        first_choice: 'TRACE_SMS',
        archive_inspected: true,
        timeline_correlated: true,
        laundromat_meeting_done: false,
        trust_nadia: 62,
        contacted_moth: false,
        evidence_count: 2,
        discovered_lantern: true,
        corporate_suspicion: 20,
        journalist_contact: true,
        player_exposure: 22,
        discovered_eli_account_reuse: false,
        current_objective: 'Cross 4th Ave',
      },
      evidence: [
        { id: 'EV-01', discovered: true, correlated: true },
        { id: 'EV-02', discovered: true, correlated: true },
      ],
      files: [],
      characters: [],
      inventory: [],
    };

    const migrated = migrateDeadAirSave(legacyV1Save, true);
    assert.equal(migrated.saveVersion, CURRENT_SAVE_VERSION);
    assert.equal(migrated.currentScene, 'STREET_NIGHT');
    assert.equal(migrated.flags.first_choice, 'TRACE_SMS');
    assert.equal(migrated.flags.first_choice_locked, true);
    assert.equal(migrated.flags.trust_nadia, 62);
    assert.equal(migrated.flags.evidence_count, 2);
    assert.equal(migrated.flags.camera_tracking_risk, true);
    assert.equal(migrated.flags.camera_tracked, false);

    // Corrupted input falls back cleanly
    const fallback = migrateDeadAirSave('invalid-json-object', false);
    assert.equal(fallback.currentScene, 'APARTMENT_NIGHT');
    assert.equal(fallback.flags.evidence_count, 0);
  });

  it('15. resets cleanly without residual trust, evidence, or flags via clearDeadAirSave', () => {
    const fresh = clearDeadAirSave();
    assert.equal(fresh.currentScene, 'APARTMENT_NIGHT');
    assert.equal(fresh.flags.trust_nadia, 55);
    assert.equal(fresh.flags.corporate_suspicion, 15);
    assert.equal(fresh.flags.evidence_count, 0);
    assert.equal(fresh.flags.first_choice, null);
    assert.equal(fresh.flags.first_choice_locked, false);
    assert.equal(fresh.completedEvents.length, 0);
    assert.equal(Object.keys(fresh.resolvedDialogueNodes).length, 0);
    assert.equal(fresh.endingId, null);
  });

  it('16. does not duplicate evidence count or stat deltas when repeating file inspection or dialogue choices', () => {
    let state = createInitialDeadAirState('playing');
    state = inspectVirtualFile(
      state,
      '/home/eli/Downloads/incident_0427/ntp_override.conf'
    );
    assert.equal(state.flags.evidence_count, 1);

    state = inspectVirtualFile(
      state,
      '/home/eli/Downloads/incident_0427/ntp_override.conf'
    );
    state = executeDeadAirCommand(state, 'cat ntp_override.conf');
    assert.equal(state.flags.evidence_count, 1);

    state = selectCharacterDialogueChoice(state, 'rhea', 'rhea_c1_share');
    const exposureAfterFirst = state.flags.player_exposure;
    state = selectCharacterDialogueChoice(state, 'rhea', 'rhea_c1_share');
    assert.equal(state.flags.player_exposure, exposureAfterFirst);
  });

  it('17. validates terminal commands against game state (ls, cd, stat, grep, verify)', () => {
    let state = createInitialDeadAirState('playing');

    state = executeDeadAirCommand(state, 'verify');
    assert.equal(state.flags.timeline_correlated, false);
    assert.match(
      state.terminalHistory[state.terminalHistory.length - 1].text,
      /Timeline mismatch/
    );

    state = executeDeadAirCommand(state, 'cd /root/secret');
    assert.match(
      state.terminalHistory[state.terminalHistory.length - 1].text,
      /File or directory not found/
    );

    state = executeDeadAirCommand(
      state,
      'stat /home/eli/archive_vault/lantern_auth_audit.db'
    );
    assert.match(
      state.terminalHistory[state.terminalHistory.length - 1].text,
      /Permission denied/
    );

    state = executeDeadAirCommand(
      state,
      'grep e.ward_09 /home/eli/archive_vault/lantern_auth_audit.db'
    );
    assert.match(
      state.terminalHistory[state.terminalHistory.length - 1].text,
      /Permission denied/
    );
  });

  it('18. blocks opening the workstation overlay (via [C] toggle or Phone CTA) when in STREET_NIGHT or LAUNDROMAT', () => {
    let state = createInitialDeadAirState('playing');
    assert.equal(canAccessWorkstation(state), true);

    // In APARTMENT_NIGHT, toggleWorkstationOverlay opens COMPUTER
    state = toggleWorkstationOverlay(state);
    assert.equal(state.activeOverlay, 'COMPUTER');
    state = toggleWorkstationOverlay(state);
    assert.equal(state.activeOverlay, 'NONE');

    // Progress to STREET_NIGHT
    state = handleFirstPhoneChoice(state, 'WAIT_CHECK_PC');
    state = inspectVirtualFile(
      state,
      '/home/eli/Downloads/incident_0427/ntp_override.conf'
    );
    state = inspectVirtualFile(
      state,
      '/home/eli/Downloads/incident_0427/access_0427.log'
    );
    state = correlateEvidenceTimeline(state);
    state = transitionToScene(state, 'STREET_NIGHT');
    assert.equal(canAccessWorkstation(state), false);

    // Attempting to open workstation via [C] shortcut or Phone CTA in STREET_NIGHT must be rejected
    state = toggleWorkstationOverlay(state);
    assert.equal(state.activeOverlay, 'NONE');
    assert.match(state.monologueBanner, /Access restricted/);

    state = openPhoneOverlay(state);
    assert.equal(state.activeOverlay, 'PHONE');
    state = openWorkstationOverlay(state, 'FILES');
    assert.notEqual(state.activeOverlay, 'COMPUTER');
    assert.equal(state.activeOverlay, 'PHONE');

    // Progress to LAUNDROMAT and verify workstation remains blocked
    state = transitionToScene(state, 'LAUNDROMAT');
    assert.equal(canAccessWorkstation(state), false);
    state = toggleWorkstationOverlay(state);
    assert.equal(state.activeOverlay, 'NONE');

    // Complete Nadia dialogue and return to APARTMENT_RETURN -> workstation is accessible again
    state = selectCharacterDialogueChoice(state, 'nadia', 'nadia_c1_share');
    state = selectCharacterDialogueChoice(state, 'nadia', 'nadia_c2_expose');
    state = selectCharacterDialogueChoice(state, 'nadia', 'nadia_c3_accept');
    state = transitionToScene(state, 'APARTMENT_RETURN');
    assert.equal(canAccessWorkstation(state), true);
    state = toggleWorkstationOverlay(state);
    assert.equal(state.activeOverlay, 'COMPUTER');
  });

  it('19. restricts probe honey-trap strictly to 10.88.14.9 and rejects missing, wrong, or duplicate probes without stacking stats', () => {
    let state = createInitialDeadAirState('playing');
    const initialSuspicion = state.flags.corporate_suspicion; // 15
    const initialExposure = state.flags.player_exposure; // 10

    // 1. Bare `probe` without target IP -> error, 0 stat change
    state = executeDeadAirCommand(state, 'probe');
    assert.equal(state.flags.corporate_suspicion, initialSuspicion);
    assert.equal(state.flags.player_exposure, initialExposure);
    assert.match(
      state.terminalHistory[state.terminalHistory.length - 1].text,
      /missing target host/
    );

    // 2. Wrong / unrelated IPs -> Network unreachable error, 0 stat change
    state = executeDeadAirCommand(state, 'probe 192.168.1.254');
    assert.equal(state.flags.corporate_suspicion, initialSuspicion);
    assert.equal(state.flags.player_exposure, initialExposure);
    assert.match(
      state.terminalHistory[state.terminalHistory.length - 1].text,
      /Network unreachable/
    );

    state = executeDeadAirCommand(state, 'probe 8.8.8.8');
    assert.equal(state.flags.corporate_suspicion, initialSuspicion);
    assert.equal(state.flags.player_exposure, initialExposure);

    // 3. Local loopback -> nominal output, 0 stat change
    state = executeDeadAirCommand(state, 'probe 127.0.0.1');
    assert.equal(state.flags.corporate_suspicion, initialSuspicion);
    assert.equal(state.flags.player_exposure, initialExposure);
    assert.match(
      state.terminalHistory[state.terminalHistory.length - 1].text,
      /INTERFACE lo0 UP/
    );

    // 4. First probe of Enclave gateway 10.88.14.9 -> triggers honey-trap (+15 suspicion, +15 exposure)
    state = executeDeadAirCommand(state, 'probe 10.88.14.9');
    assert.equal(state.flags.corporate_suspicion, initialSuspicion + 15);
    assert.equal(state.flags.player_exposure, initialExposure + 15);
    assert.match(
      state.terminalHistory[state.terminalHistory.length - 1].text,
      /IDS HONEY-TRAP TRIGGERED/
    );

    // 5. Duplicate probes of 10.88.14.9 or alias vespera-enclave-gw -> does NOT stack suspicion or exposure
    state = executeDeadAirCommand(state, 'probe 10.88.14.9');
    assert.equal(state.flags.corporate_suspicion, initialSuspicion + 15);
    assert.equal(state.flags.player_exposure, initialExposure + 15);
    assert.match(
      state.terminalHistory[state.terminalHistory.length - 1].text,
      /already tripped/
    );

    state = executeDeadAirCommand(state, 'probe vespera-enclave-gw');
    assert.equal(state.flags.corporate_suspicion, initialSuspicion + 15);
    assert.equal(state.flags.player_exposure, initialExposure + 15);
  });
});
