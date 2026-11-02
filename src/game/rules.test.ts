import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CURRENT_SAVE_VERSION,
  createInitialDeadAirState,
} from '../data/storyData';
import {
  canTransitionToScene,
  correlateEvidenceTimeline,
  executeDeadAirCommand,
  handleFirstPhoneChoice,
  hasMothArchiveKey,
  inspectHotspot,
  inspectVirtualFile,
  openPhoneOverlay,
  resolveChapterOneEnding,
  selectCharacterDialogueChoice,
  transitionToScene,
} from './storyEngine';
import { clearDeadAirSave, migrateDeadAirSave } from '../persistence/storage';

describe('DEAD AIR V0.2 — Narrative Integrity & Consequence System', () => {
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

  it('6. blocks reading lantern_auth_audit.db when moth_archive.key is missing', () => {
    let state = createInitialDeadAirState('playing');
    state = inspectVirtualFile(
      state,
      '/home/eli/archive_vault/lantern_auth_audit.db'
    );
    assert.equal(state.flags.discovered_eli_account_reuse, false);
    assert.equal(state.shellState, 'playing');
    assert.match(state.monologueBanner, /Permission denied/);

    // Also via terminal command
    state = executeDeadAirCommand(
      state,
      'cat /home/eli/archive_vault/lantern_auth_audit.db'
    );
    assert.equal(state.flags.discovered_eli_account_reuse, false);
    const lastLine = state.terminalHistory[state.terminalHistory.length - 1];
    assert.equal(lastLine.tone, 'error');
    assert.match(lastLine.text, /Permission denied/);
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

  it('11. updates player_exposure accurately and triggers optical camera tracking on 4th Ave when >= 20%', () => {
    let state = createInitialDeadAirState('playing');
    state = handleFirstPhoneChoice(state, 'CALL_NADIA'); // exposure 10 + 15 = 25
    assert.equal(state.flags.player_exposure, 25);

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

    // Inspecting Municipal Optical Pole #04 with exposure >= 20 increases corporate suspicion by +5
    const beforeSuspicion = state.flags.corporate_suspicion;
    state = inspectHotspot(state, 'hs_camera');
    assert.equal(state.flags.corporate_suspicion, beforeSuspicion + 5);
    assert.equal(state.flags.camera_tracked, true);
  });

  it('12. produces distinct narrative states based on player choices with Rhea and Nadia', () => {
    const base = createInitialDeadAirState('playing');

    const pathAllied = selectCharacterDialogueChoice(
      base,
      'rhea',
      'rhea_c1_share'
    );
    assert.equal(pathAllied.flags.journalist_contact, true);
    assert.equal(pathAllied.flags.rhea_allied, true);

    const pathCautious = selectCharacterDialogueChoice(
      base,
      'rhea',
      'rhea_c1_cautious'
    );
    assert.equal(pathCautious.flags.journalist_contact, true);
    assert.equal(pathCautious.flags.rhea_allied, false);
  });

  it('13. reaches all 3 distinct Chapter 1 Endings (Ending A, Ending B, Ending C) deterministically', () => {
    // Path to ENDING A (THE SIGNAL LEAKS): full evidence, timeline correlated, Rhea allied, Nadia trust >= 55, low suspicion/exposure
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
    assert.equal(stateA.endingId, 'ENDING_A_SIGNAL_LEAKS');

    // Path to ENDING B (A DIRTY BARGAIN): full evidence & timeline correlated, low exposure, but did NOT ally with Rhea or alienated Nadia
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
    // Skip Rhea Solis -> journalist_contact remains false
    stateB = transitionToScene(stateB, 'LAUNDROMAT');
    stateB = selectCharacterDialogueChoice(stateB, 'nadia', 'nadia_c1_question');
    stateB = selectCharacterDialogueChoice(stateB, 'nadia', 'nadia_c2_withhold');
    stateB = selectCharacterDialogueChoice(stateB, 'nadia', 'nadia_c3_accept');
    stateB = transitionToScene(stateB, 'APARTMENT_RETURN');
    stateB = inspectVirtualFile(
      stateB,
      '/home/eli/archive_vault/lantern_auth_audit.db'
    );
    assert.equal(stateB.endingId, 'ENDING_B_DIRTY_BARGAIN');

    // Path to ENDING C (THE FALL GUY): high corporate suspicion (>= 45) or high exposure
    let stateC = createInitialDeadAirState('playing');
    stateC = {
      ...stateC,
      flags: {
        ...stateC.flags,
        corporate_suspicion: 55,
      },
    };
    assert.equal(resolveChapterOneEnding(stateC), 'ENDING_C_FALL_GUY');
  });

  it('14. migrates legacy v1 saves and safely falls back on corrupted save data', () => {
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
        player_exposure: 15,
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
    assert.equal(fresh.endingId, null);
  });

  it('16. does not duplicate evidence count or stat deltas when repeating file inspection or dialogue choices', () => {
    let state = createInitialDeadAirState('playing');
    state = inspectVirtualFile(
      state,
      '/home/eli/Downloads/incident_0427/ntp_override.conf'
    );
    assert.equal(state.flags.evidence_count, 1);

    // Inspecting the same file 3 more times keeps evidence_count at 1
    state = inspectVirtualFile(
      state,
      '/home/eli/Downloads/incident_0427/ntp_override.conf'
    );
    state = executeDeadAirCommand(state, 'cat ntp_override.conf');
    assert.equal(state.flags.evidence_count, 1);

    // Repeating the same dialogue choice does not stack trustDelta
    state = selectCharacterDialogueChoice(state, 'rhea', 'rhea_c1_share');
    const exposureAfterFirst = state.flags.player_exposure;
    state = selectCharacterDialogueChoice(state, 'rhea', 'rhea_c1_share');
    assert.equal(state.flags.player_exposure, exposureAfterFirst);
  });

  it('17. validates terminal commands against game state (ls, cd, stat, grep, verify)', () => {
    let state = createInitialDeadAirState('playing');

    // Running verify with 0 discovered evidence outputs Timeline mismatch
    state = executeDeadAirCommand(state, 'verify');
    assert.equal(state.flags.timeline_correlated, false);
    assert.match(
      state.terminalHistory[state.terminalHistory.length - 1].text,
      /Timeline mismatch/
    );

    // Invalid directory cd
    state = executeDeadAirCommand(state, 'cd /root/secret');
    assert.match(
      state.terminalHistory[state.terminalHistory.length - 1].text,
      /File or directory not found/
    );

    // Locked archive vault stat & grep
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
});
