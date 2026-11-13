import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
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
import {
  clearDeadAirSave,
  isValidLegacySaveShape,
  isValidV3SaveShape,
  LEGACY_STORAGE_KEY_V1,
  LEGACY_STORAGE_KEY_V2,
  loadDeadAirState,
  migrateDeadAirSave,
  saveDeadAirState,
  STORAGE_KEY_V3,
} from '../persistence/storage';
import {
  applyLessonCapabilityToStory,
  executeLabDiagnosticStep,
  openNetworkLabForLesson,
  selectLearningCategory,
  selectLearningSourceTrack,
  submitLabResolution,
} from '../learning/learningEngine';
import { filterLessonsByTrackAndCategory } from '../learning/learningProgress';
import {
  CURATED_SOURCE_REGISTRY,
  CYBERSEC_PROJECTS_ATTRIBUTION_HEADER,
  FQ_BOOK_ATTRIBUTION_HEADER,
} from '../learning/sourceRegistry';
import { ALL_LEARNING_LESSONS } from '../data/learningMissions';
import {
  analyzeCanaryAndHoneypot,
  analyzeContainerAndBinary,
  analyzeHsmAndKeyring,
  analyzePersistenceAndMetadata,
  analyzeTlsFingerprinting,
  computeCanonicalJa4,
  sha256Hex,
  verifyEcdsaP256Sha256,
} from '../simulation/tacticalEngine';
import { HSM_FORENSICS_FIXTURES } from '../simulation/tacticalFixtures/hsm.fixtures';
import { TLS_FINGERPRINT_FIXTURES } from '../simulation/tacticalFixtures/tls.fixtures';

describe('DEAD AIR V0.4.1 — Narrative Integrity, Workstation Access, Probe Integrity & Tactical Security Engineering', () => {
  it('1. initializes game state with saveVersion 3, APARTMENT_NIGHT at 02:17 AM, 0 discovered evidence, and 6 false tactical flags', () => {
    const state = createInitialDeadAirState('playing');
    assert.equal(state.saveVersion, 3);
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
    assert.equal(state.flags.persistence_audit_completed, false);
    assert.equal(state.flags.metadata_protection_completed, false);
    assert.equal(state.flags.tls_attribution_verified, false);
    assert.equal(state.flags.canary_identified, false);
    assert.equal(state.flags.hsm_signature_verified, false);
    assert.equal(state.flags.lantern_binary_analyzed, false);
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

  it('20. enforces V0.3 multi-host discovery, nmap port scanning, and credential-gated exploit/ssh intrusion across virtual hosts', () => {
    let state = createInitialDeadAirState('playing');
    assert.equal(state.networkHosts.length, 5);
    assert.equal(state.flags.compromised_hosts_count, 0);

    // 1. Before reading forensic files, Vespera Edge Gateway (10.88.4.22) is undiscovered
    const gwBefore = state.networkHosts.find((h) => h.ip === '10.88.4.22')!;
    assert.equal(gwBefore.discovered, false);

    // 2. Attempting exploit on 172.16.40.12 before nmap port scan is blocked
    state = executeDeadAirCommand(state, 'exploit 172.16.40.12');
    assert.equal(
      state.networkHosts.find((h) => h.ip === '172.16.40.12')?.compromised,
      false
    );
    assert.match(
      state.terminalHistory[state.terminalHistory.length - 1].text,
      /nmap 172\.16\.40\.12/
    );

    // 3. Scanning 172.16.40.12 with nmap marks it scanned and unlocks exploit after first phone choice
    state = handleFirstPhoneChoice(state, 'TRACE_SMS');
    state = executeDeadAirCommand(state, 'nmap 172.16.40.12');
    assert.equal(
      state.networkHosts.find((h) => h.ip === '172.16.40.12')?.scanned,
      true
    );

    state = executeDeadAirCommand(state, 'exploit 172.16.40.12');
    const relayAfter = state.networkHosts.find((h) => h.ip === '172.16.40.12')!;
    assert.equal(relayAfter.compromised, true);
    assert.equal(relayAfter.privilege, 'OPERATOR');
    assert.equal(state.flags.compromised_hosts_count, 1);

    // 4. Attempting to exploit Vespera Edge Gateway (10.88.4.22) before inspecting auth_shadow.dump is blocked
    state = inspectVirtualFile(
      state,
      '/home/eli/Downloads/incident_0427/access_0427.log'
    );
    assert.equal(
      state.networkHosts.find((h) => h.ip === '10.88.4.22')?.discovered,
      true
    );
    state = executeDeadAirCommand(state, 'nmap 10.88.4.22');
    state = executeDeadAirCommand(state, 'exploit 10.88.4.22');
    assert.equal(
      state.networkHosts.find((h) => h.ip === '10.88.4.22')?.compromised,
      false
    );
    assert.match(
      state.terminalHistory[state.terminalHistory.length - 1].text,
      /Unrevoked shadow session token required/
    );

    // 5. Inspecting auth_shadow.dump (EV-03) unlocks svc_lantern_sync shadow token -> exploit 10.88.4.22 grants ROOT
    state = inspectVirtualFile(
      state,
      '/home/eli/Downloads/incident_0427/auth_shadow.dump'
    );
    state = executeDeadAirCommand(state, 'exploit 10.88.4.22');
    const gwAfter = state.networkHosts.find((h) => h.ip === '10.88.4.22')!;
    assert.equal(gwAfter.compromised, true);
    assert.equal(gwAfter.privilege, 'ROOT');
    assert.equal(state.flags.compromised_hosts_count, 2);
  });

  it('21. executes V0.3 tactical host operations (pivot, scrub, dump) with persistent narrative consequences and camera protection', () => {
    let state = createInitialDeadAirState('playing');
    // Trigger high exposure first (+15 -> exposure 25, suspicion 30)
    state = handleFirstPhoneChoice(state, 'CALL_NADIA');
    assert.equal(state.flags.player_exposure, 25);
    assert.equal(state.flags.corporate_suspicion, 30);
    assert.equal(state.flags.camera_tracking_risk, true);

    // 1. Compromise and pivot through 172.16.40.12 -> activates dark-fiber proxy tunnel (-10 exposure) and logs grant +5 Nadia trust
    state = executeDeadAirCommand(state, 'nmap 172.16.40.12');
    state = executeDeadAirCommand(state, 'exploit 172.16.40.12');
    const trustBeforeLogs = state.flags.trust_nadia;
    state = executeDeadAirCommand(state, 'logs 172.16.40.12');
    assert.equal(state.flags.trust_nadia, trustBeforeLogs + 5);

    state = executeDeadAirCommand(state, 'pivot 172.16.40.12');
    assert.equal(state.flags.relay_tunnel_active, true);
    assert.equal(state.flags.player_exposure, 15);
    // Repeat pivot is idempotent
    state = executeDeadAirCommand(state, 'pivot 172.16.40.12');
    assert.equal(state.flags.player_exposure, 15);

    // 2. Compromise and scrub 4th Ave Municipal Camera Pole #04 (10.40.4.18) -> sets camera_scrubbed = true (-10 exposure, -5 suspicion)
    state = executeDeadAirCommand(state, 'nmap 10.40.4.18');
    state = executeDeadAirCommand(state, 'exploit 10.40.4.18');
    state = executeDeadAirCommand(state, 'scrub 10.40.4.18');
    assert.equal(state.flags.camera_scrubbed, true);
    assert.equal(state.flags.player_exposure, 5);
    assert.equal(state.flags.corporate_suspicion, 25);

    // Even if exposure is raised above 20 again, inspecting hs_camera on STREET_NIGHT will NOT lock onto Eli because NVRAM was scrubbed!
    state = executeDeadAirCommand(state, 'probe 10.88.14.9'); // +15 suspicion (40), +15 exposure (20)
    assert.equal(state.flags.player_exposure, 20);

    state = inspectVirtualFile(
      state,
      '/home/eli/Downloads/incident_0427/ntp_override.conf'
    );
    state = inspectVirtualFile(
      state,
      '/home/eli/Downloads/incident_0427/access_0427.log'
    );
    state = inspectVirtualFile(
      state,
      '/home/eli/Downloads/incident_0427/auth_shadow.dump'
    );
    state = correlateEvidenceTimeline(state);
    state = transitionToScene(state, 'STREET_NIGHT');

    const suspicionBeforeCam = state.flags.corporate_suspicion;
    state = inspectHotspot(state, 'hs_camera');
    assert.equal(state.flags.camera_tracked, false);
    assert.equal(state.flags.corporate_suspicion, suspicionBeforeCam);

    // 3. Compromise and dump Vespera Edge Gateway (10.88.4.22) -> secures cryptographic counter-proof against Marcus Hale (-5 suspicion)
    state = executeDeadAirCommand(state, 'nmap 10.88.4.22');
    state = executeDeadAirCommand(state, 'exploit 10.88.4.22');
    state = executeDeadAirCommand(state, 'dump 10.88.4.22');
    assert.equal(state.flags.counter_proof_secured, true);
    assert.equal(state.flags.corporate_suspicion, suspicionBeforeCam - 5);
  });

  it('22. enforces dual-source curriculum attribution (12 total: 7 Track I + 5 Track II), lesson prerequisites, and diagnostic gating before analytical resolution', () => {
    let state = createInitialDeadAirState('playing');
    assert.equal(ALL_LEARNING_LESSONS.length, 12);
    assert.equal(
      filterLessonsByTrackAndCategory('network_internet', 'all').length,
      7
    );
    assert.equal(
      filterLessonsByTrackAndCategory('tactical_security', 'all').length,
      5
    );
    assert.match(
      FQ_BOOK_ATTRIBUTION_HEADER.upstreamRepository,
      /hoochanlon\/fq-book/
    );
    assert.match(
      CYBERSEC_PROJECTS_ATTRIBUTION_HEADER.forkRepository,
      /Lauren-Bitten\/CyberSecurity-Projects/
    );
    assert.match(
      CYBERSEC_PROJECTS_ATTRIBUTION_HEADER.upstreamRepository,
      /CarterPerez-dev\/Cybersecurity-Projects/
    );
    assert.match(CYBERSEC_PROJECTS_ATTRIBUTION_HEADER.license, /AGPL-3\.0/);
    assert.ok(
      CURATED_SOURCE_REGISTRY.some(
        (s) => s.curationDecision === 'excluded_unverified'
      )
    );
    assert.ok(
      CURATED_SOURCE_REGISTRY.some(
        (s) =>
          s.sourceTrack === 'tactical_security' &&
          s.curationDecision === 'excluded_unverified' &&
          s.id === 'src-cybersec-excluded-offensive'
      )
    );

    // Level 03 (Certificates) requires Level 02 (DNS) first
    state = openNetworkLabForLesson(state, 'lesson_03_certificates');
    assert.equal(state.learning.activeLabLessonId, null);
    assert.match(state.lastFeedbackBanner || '', /Prerequisite required/);

    // Launching Level 02 (DNS Investigation MVP Lab 01) succeeds
    state = openNetworkLabForLesson(state, 'lesson_02_dns');
    assert.equal(state.learning.activeLabLessonId, 'lesson_02_dns');

    // Attempting analytical resolution before running the 2 critical diagnostics is blocked
    state = submitLabResolution(state, 'lesson_02_dns', 'res_02_sanitize_dns');
    assert.equal(
      state.learning.completedLessonIds.includes('lesson_02_dns'),
      false
    );
    assert.match(
      state.lastFeedbackBanner || '',
      /Run diagnostic evidence first/
    );
  });

  it('23. completes all 3 MVP Core Labs (DNS, Certificates, Proxy/Tunnel), unlocks capabilities, and applies CLI tools to the investigation', () => {
    let state = createInitialDeadAirState('playing');
    // Start with elevated suspicion/exposure from CALL_NADIA (suspicion 30, exposure 25)
    state = handleFirstPhoneChoice(state, 'CALL_NADIA');
    assert.equal(state.flags.corporate_suspicion, 30);
    assert.equal(state.flags.player_exposure, 25);

    // --- MVP Lab 01: DNS Investigation (lesson_02_dns) ---
    state = executeLabDiagnosticStep(state, 'lesson_02_dns', 'diag_dns_hosts');
    state = executeLabDiagnosticStep(
      state,
      'lesson_02_dns',
      'diag_dns_compare_resolvers'
    );
    state = submitLabResolution(state, 'lesson_02_dns', 'res_02_sanitize_dns');
    assert.ok(state.learning.completedLessonIds.includes('lesson_02_dns'));
    assert.ok(
      state.learning.unlockedCapabilities.includes('resolver_inspector')
    );

    // Apply via terminal CLI `dns-inspect`
    const suspBeforeDns = state.flags.corporate_suspicion;
    const expBeforeDns = state.flags.player_exposure;
    state = executeDeadAirCommand(state, 'dns-inspect');
    assert.ok(state.learning.appliedStoryLessons.includes('lesson_02_dns'));
    assert.equal(state.flags.corporate_suspicion, suspBeforeDns - 5);
    assert.equal(state.flags.player_exposure, expBeforeDns - 5);

    // --- MVP Lab 02: Certificate Forensics (lesson_03_certificates) ---
    // Prerequisite lesson_02_dns is now complete!
    state = openNetworkLabForLesson(state, 'lesson_03_certificates');
    assert.equal(state.learning.activeLabLessonId, 'lesson_03_certificates');
    state = executeLabDiagnosticStep(
      state,
      'lesson_03_certificates',
      'diag_cert_chain'
    );
    state = executeLabDiagnosticStep(
      state,
      'lesson_03_certificates',
      'diag_cert_pin_compare'
    );
    state = submitLabResolution(
      state,
      'lesson_03_certificates',
      'res_03_revoke_and_pin'
    );
    assert.ok(
      state.learning.unlockedCapabilities.includes('certificate_analyzer')
    );

    // Apply via terminal CLI `cert-verify`
    state = executeDeadAirCommand(state, 'cert-verify');
    assert.ok(
      state.learning.appliedStoryLessons.includes('lesson_03_certificates')
    );

    // --- MVP Lab 03: Proxy & Tunnel Route (lesson_04_proxy_vpn) ---
    state = executeLabDiagnosticStep(
      state,
      'lesson_04_proxy_vpn',
      'diag_route_trace'
    );
    state = executeLabDiagnosticStep(
      state,
      'lesson_04_proxy_vpn',
      'diag_dns_leak_test'
    );
    state = submitLabResolution(
      state,
      'lesson_04_proxy_vpn',
      'res_04_encrypted_multihop'
    );
    assert.ok(
      state.learning.unlockedCapabilities.includes('proxy_route_editor')
    );
    assert.ok(state.learning.unlockedCapabilities.includes('tunnel_monitor'));

    // Apply via UI action
    state = applyLessonCapabilityToStory(
      state,
      'lesson_04_proxy_vpn',
      'analytical'
    );
    assert.ok(
      state.learning.appliedStoryLessons.includes('lesson_04_proxy_vpn')
    );
    assert.equal(state.flags.player_exposure, 0);
  });

  it('24. contrasts analytical knowledge application against brute-force unverified shortcuts with persistent risk penalties', () => {
    let state = createInitialDeadAirState('playing');
    const baseSuspicion = state.flags.corporate_suspicion; // 15
    const baseExposure = state.flags.player_exposure; // 10

    // Attempting to apply analytical capability before unlocking it is rejected
    state = executeDeadAirCommand(state, 'dns-inspect');
    assert.equal(
      state.learning.appliedStoryLessons.includes('lesson_02_dns'),
      false
    );
    assert.match(state.lastFeedbackBanner || '', /Capability Locked/);

    // Choosing the brute-force unverified path in story investigation without learning DNS principles adds +15% suspicion and +10% exposure
    state = applyLessonCapabilityToStory(
      state,
      'lesson_02_dns',
      'brute_force'
    );
    assert.ok(
      state.learning.bruteForceStoryLessons.includes('lesson_02_dns')
    );
    assert.equal(state.flags.corporate_suspicion, baseSuspicion + 15);
    assert.equal(state.flags.player_exposure, baseExposure + 10);
  });

  it('25. enforces V0.4 Track I/Track II selector filtering, category co-filtering, and sequential prerequisite chain (Level 07 -> 08 -> 09 -> 10 -> 11 -> 12)', () => {
    let state = createInitialDeadAirState('playing');
    assert.equal(state.learning.activeSourceTrack, 'all');

    // Switch to Track II: Tactical Security (5 lessons)
    state = selectLearningSourceTrack(state, 'tactical_security');
    assert.equal(state.learning.activeSourceTrack, 'tactical_security');
    assert.equal(state.learning.selectedLessonId, 'lesson_08_persistence');

    // Filter by category within Track II
    state = selectLearningCategory(state, 'crypto_forensics');
    assert.equal(state.learning.activeCategoryFilter, 'crypto_forensics');
    assert.equal(state.learning.selectedLessonId, 'lesson_11_hsm_forensics');
    assert.equal(
      filterLessonsByTrackAndCategory('tactical_security', 'crypto_forensics')
        .length,
      1
    );

    // Level 08 is blocked until Level 07 (lesson_07_osint_opsec) is completed
    state = openNetworkLabForLesson(state, 'lesson_08_persistence');
    assert.equal(state.learning.activeLabLessonId, null);
    assert.match(state.lastFeedbackBanner || '', /LEVEL 07/);

    // Complete Level 07 -> unlocks Level 08
    state = executeLabDiagnosticStep(
      state,
      'lesson_07_osint_opsec',
      'diag_archive_query'
    );
    state = executeLabDiagnosticStep(
      state,
      'lesson_07_osint_opsec',
      'diag_opsec_headers'
    );
    state = submitLabResolution(
      state,
      'lesson_07_osint_opsec',
      'res_07_passive_osint_scrub'
    );
    assert.ok(
      state.learning.completedLessonIds.includes('lesson_07_osint_opsec')
    );

    // Switching back to Track I or All Sources preserves completedLessonIds and unlockedCapabilities
    state = selectLearningSourceTrack(state, 'network_internet');
    assert.ok(
      state.learning.completedLessonIds.includes('lesson_07_osint_opsec')
    );
    assert.ok(state.learning.unlockedCapabilities.includes('archive_search'));

    // Now Level 08 can be opened, while Level 09 is still blocked until Level 08 completes
    state = openNetworkLabForLesson(state, 'lesson_09_tls_fingerprinting');
    assert.equal(state.learning.activeLabLessonId, null);
    state = openNetworkLabForLesson(state, 'lesson_08_persistence');
    assert.equal(state.learning.activeLabLessonId, 'lesson_08_persistence');
  });

  it('26. computes JA4 dynamically from ClientHello inputs (with GREASE exclusion and known-answer vectors) and verifies ECDSA-P256 signatures cryptographically (with tampered payload and invalid signature negative tests)', () => {
    const p8 = analyzePersistenceAndMetadata();
    assert.equal(
      p8.suspiciousUnit.unitName,
      'vespera-Support-sync.timer'
    );
    assert.ok(p8.metadataFindings.includes('Author: e.ward_09'));
    assert.ok(p8.report.observedFact.length > 10);
    assert.ok(p8.report.technicalInference.length > 10);
    assert.ok(p8.report.narrativeHypothesis.length > 10);

    // --- JA4 Deterministic Computation & Known-Answer Vectors ---
    const p9 = analyzeTlsFingerprinting();
    // Independently verify SHA-256 12-char prefixes using node:crypto
    const expectedEliB = crypto
      .createHash('sha256')
      .update('1301,1302,1303,c02f')
      .digest('hex')
      .slice(0, 12);
    const expectedEliC = crypto
      .createHash('sha256')
      .update('000a,000d,002b,0033_0403,0804,0401')
      .digest('hex')
      .slice(0, 12);
    assert.equal(expectedEliB, '77f0cd3447db');
    assert.equal(expectedEliC, '5d4d534e3685');
    assert.equal(
      p9.computedJa4,
      `t13d0406h2_${expectedEliB}_${expectedEliC}`
    );
    // FoxIO official JA4 specification known-answer test vector
    assert.equal(
      p9.baselineBrowserJa4,
      't13d1516h2_8daaf6152771_e5627efa2ab1'
    );
    assert.notEqual(p9.computedJa4, p9.baselineBrowserJa4);
    assert.equal(p9.isStatelessScan, false);

    // Prove JA4 is computed from input fields, not read from a static string:
    const rawEli = TLS_FINGERPRINT_FIXTURES.captured_tls_0427_eli_tool;
    // 1. Adding/changing GREASE values or permuting cipher/extension wire order must NOT change JA4
    const reorderedWithExtraGrease = analyzeTlsFingerprinting(undefined, {
      cipherSuitesHex: ['fafa', 'c02f', '1303', '3a3a', '1301', '1302'],
      extensionsHex: ['baba', '0033', '000a', '002b', '0000', '000d', '0010'],
    });
    assert.equal(reorderedWithExtraGrease.computedJa4, p9.computedJa4);

    // 2. Adding a non-GREASE cipher ('009c') MUST change JA4_a cipher count (04 -> 05) and JA4_b hash
    const withFifthCipher = analyzeTlsFingerprinting(undefined, {
      cipherSuitesHex: [...rawEli.cipherSuitesHex, '009c'],
    });
    assert.match(withFifthCipher.computedJa4, /^t13d0506h2_/);
    assert.notEqual(
      withFifthCipher.computedDetails.ja4_b,
      p9.computedDetails.ja4_b
    );

    // 3. Reordering signatureAlgorithmsHex MUST change JA4_c (since JA4 preserves sig_alg wire order)
    const reorderedSigAlgs = analyzeTlsFingerprinting(undefined, {
      signatureAlgorithmsHex: ['0804', '0403', '0401'],
    });
    assert.equal(reorderedSigAlgs.computedDetails.ja4_a, p9.computedDetails.ja4_a);
    assert.equal(reorderedSigAlgs.computedDetails.ja4_b, p9.computedDetails.ja4_b);
    assert.notEqual(
      reorderedSigAlgs.computedDetails.ja4_c,
      p9.computedDetails.ja4_c
    );

    // 4. Changing SNI or ALPN MUST change JA4_a
    const withoutSni = computeCanonicalJa4({
      ...rawEli,
      sniPresent: false,
      sniHostname: '',
    });
    assert.equal(withoutSni.ja4_a, 't13i0406h2');
    const http11Alpn = computeCanonicalJa4({
      ...rawEli,
      alpn: 'http/1.1',
    });
    assert.equal(http11Alpn.ja4_a, 't13d0406h1');

    // --- Canary & Honeypot ---
    const p10 = analyzeCanaryAndHoneypot();
    assert.equal(p10.canaryTokenId, 'CANARY-VSP-0427-ELI');
    assert.equal(p10.honeypotHost, '10.88.14.9');
    assert.equal(p10.honeypotConfidence, 98);

    // --- Real ECDSA-P256 Cryptographic Verification & Negative Tests ---
    const hsmFix = HSM_FORENSICS_FIXTURES['access_0427.log'];
    assert.equal(hsmFix.signatureEnvelopeHex.includes('...'), false);
    // Cross-check with Node's built-in crypto.verify
    const nodePubKey = crypto.createPublicKey(hsmFix.publicKeyPem);
    const nodeVerified = crypto.verify(
      'sha256',
      Buffer.from(hsmFix.signedPayloadRaw, 'utf8'),
      nodePubKey,
      Buffer.from(hsmFix.signatureEnvelopeHex, 'hex')
    );
    assert.equal(nodeVerified, true);

    const p11 = analyzeHsmAndKeyring();
    assert.equal(p11.verificationBreakdown.signatureMathValid, true);
    assert.equal(
      p11.verificationBreakdown.payloadSha256Hex,
      sha256Hex(hsmFix.signedPayloadRaw)
    );
    assert.equal(p11.verificationBreakdown.signingKeyId, 'M_HALE_SEC_01');
    assert.match(
      p11.verificationBreakdown.tokenMetadata,
      /CKF_HW_SLOT=false/
    );
    assert.equal(
      p11.verificationBreakdown.hardwareAttestationPresent,
      false
    );
    assert.equal(
      p11.verificationBreakdown.hardwareAttestationStatus,
      'MISSING_HARDWARE_ATTESTATION'
    );
    assert.match(
      hsmFix.hardwareAttestationState,
      /MISSING_HARDWARE_ATTESTATION/
    );
    assert.equal(
      p11.verificationBreakdown.attributedActorInPlaintextLog,
      'e.ward_09'
    );

    // Negative Test 1: Tampered payload MUST fail ECDSA-P256 verification
    const tamperedPayloadResult = analyzeHsmAndKeyring({
      signedPayloadRaw:
        'REACTIVATE_UID=m.hale_01|PURGE_JOB=9904|TS=2028-04-27T02:14:11Z|SLOT=0x02|KEY_ID=M_HALE_SEC_01',
    });
    assert.equal(
      tamperedPayloadResult.verificationBreakdown.signatureMathValid,
      false
    );
    assert.equal(
      tamperedPayloadResult.report.verificationStatus,
      'PENDING_CORROBORATION'
    );

    // Negative Test 2: Invalid / corrupted DER signature MUST fail ECDSA-P256 verification
    const corruptedSigHex =
      hsmFix.signatureEnvelopeHex.slice(0, -4) +
      (hsmFix.signatureEnvelopeHex.endsWith('908b') ? '908c' : '908b');
    const invalidSigResult = analyzeHsmAndKeyring({
      signatureEnvelopeHex: corruptedSigHex,
    });
    assert.equal(
      invalidSigResult.verificationBreakdown.signatureMathValid,
      false
    );
    assert.equal(
      verifyEcdsaP256Sha256(
        hsmFix.signedPayloadRaw,
        '3045022100deadbeef',
        hsmFix.publicKeyUncompressedHex
      ),
      false
    );

    // Negative Test 3: Wrong/corrupted public key MUST fail ECDSA-P256 verification
    assert.equal(
      verifyEcdsaP256Sha256(
        hsmFix.signedPayloadRaw,
        hsmFix.signatureEnvelopeHex,
        '04' + '11'.repeat(64)
      ),
      false
    );

    // --- ELF / Docker / eBPF Partial vs All Analysis ---
    const p12ElfOnly = analyzeContainerAndBinary('elf');
    assert.ok(p12ElfOnly.suspiciousSymbols.includes('calc_citizen_threat_score'));
    assert.equal(p12ElfOnly.containerEscapeVectors.length, 0);
    assert.equal(p12ElfOnly.ebpfBoundaryViolations.length, 0);
    assert.equal(p12ElfOnly.report.verificationStatus, 'PENDING_CORROBORATION');

    const p12All = analyzeContainerAndBinary('all');
    assert.ok(
      p12All.suspiciousSymbols.includes('calc_citizen_threat_score')
    );
    assert.ok(
      p12All.containerEscapeVectors.some((v) => v.includes('docker.sock'))
    );
    assert.ok(
      p12All.ebpfBoundaryViolations.some((e) => e.includes('/host_etc/shadow'))
    );
    assert.equal(p12All.report.verificationStatus, 'VERIFIED');
  });

  it('27. completes Levels 08-12 sequentially, verifies lab completion does not award free suspicion/exposure bonuses, and strictly isolates the 6 tactical flags from evidence_count', () => {
    let state = createInitialDeadAirState('playing');
    state = handleFirstPhoneChoice(state, 'CALL_NADIA'); // suspicion 30, exposure 25

    // Complete prerequisite Level 07
    state = executeLabDiagnosticStep(
      state,
      'lesson_07_osint_opsec',
      'diag_archive_query'
    );
    state = executeLabDiagnosticStep(
      state,
      'lesson_07_osint_opsec',
      'diag_opsec_headers'
    );
    state = submitLabResolution(
      state,
      'lesson_07_osint_opsec',
      'res_07_passive_osint_scrub'
    );

    const suspicionBeforeTrack2 = state.flags.corporate_suspicion;
    const exposureBeforeTrack2 = state.flags.player_exposure;

    // Complete Levels 08, 09, 10, 11, 12 in order
    const track2Sequence = [
      {
        id: 'lesson_08_persistence',
        diags: ['diag_08_systemd_scan', 'diag_08_pdf_metadata'],
        res: 'res_08_quarantine_and_sanitize',
        cap: 'persistence_auditor' as const,
      },
      {
        id: 'lesson_09_tls_fingerprinting',
        diags: ['diag_09_compute_ja4', 'diag_09_flow_state'],
        res: 'res_09_verify_ja4_attribution',
        cap: 'tls_fingerprint_inspector' as const,
      },
      {
        id: 'lesson_10_counter_deception',
        diags: ['diag_10_pdf_canary', 'diag_10_honeypot_telemetry'],
        res: 'res_10_flag_canary_and_honeypot',
        cap: 'canary_inspector' as const,
      },
      {
        id: 'lesson_11_hsm_forensics',
        diags: ['diag_11_verify_ecdsa_slot', 'diag_11_keyring_rotation'],
        res: 'res_11_compile_hsm_proof',
        cap: 'hsm_verifier' as const,
      },
      {
        id: 'lesson_12_container_binary',
        diags: ['diag_12_elf_inspect', 'diag_12_container_ebpf_audit'],
        res: 'res_12_correlate_binary_container_ebpf',
        cap: 'binary_container_analyzer' as const,
      },
    ];

    for (const step of track2Sequence) {
      for (const d of step.diags) {
        state = executeLabDiagnosticStep(state, step.id, d);
      }
      state = submitLabResolution(state, step.id, step.res);
      assert.ok(state.learning.completedLessonIds.includes(step.id));
      assert.ok(state.learning.unlockedCapabilities.includes(step.cap));
    }

    // Completing the labs alone MUST NOT change suspicion, exposure, the 6 tactical flags, or evidence_count!
    assert.equal(state.flags.corporate_suspicion, suspicionBeforeTrack2);
    assert.equal(state.flags.player_exposure, exposureBeforeTrack2);
    assert.equal(state.flags.persistence_audit_completed, false);
    assert.equal(state.flags.metadata_protection_completed, false);
    assert.equal(state.flags.tls_attribution_verified, false);
    assert.equal(state.flags.canary_identified, false);
    assert.equal(state.flags.hsm_signature_verified, false);
    assert.equal(state.flags.lantern_binary_analyzed, false);
    assert.equal(state.flags.evidence_count, 0);

    // Check `manual` command output shows TRACK I, TRACK II: 5 / 5, and TOTAL
    state = executeDeadAirCommand(state, 'manual');
    const manualText =
      state.terminalHistory[state.terminalHistory.length - 1].text;
    assert.match(manualText, /TRACK I.*1 \/ 7/);
    assert.match(manualText, /TRACK II.*5 \/ 5/);
    assert.match(manualText, /TOTAL COMPLETED LABS.*6 \/ 12/);
  });

  it('28. validates all 5 new CLI commands (persist-audit, ja4-inspect, canary-check, hsm-verify, bin-audit): lock checks, partial bin-audit substeps (ELF/container/trace) vs full correlation, and idempotency', () => {
    let state = createInitialDeadAirState('playing');
    state = handleFirstPhoneChoice(state, 'CALL_NADIA'); // suspicion 30, exposure 25

    // 1. All 5 commands must be rejected when capabilities are locked
    for (const lockedCmd of [
      'persist-audit',
      'ja4-inspect',
      'canary-check',
      'hsm-verify',
      'bin-audit',
    ]) {
      state = executeDeadAirCommand(state, lockedCmd);
      assert.match(state.lastFeedbackBanner || '', /Capability Locked/);
    }

    // Unlock all Track II capabilities
    state = {
      ...state,
      learning: {
        ...state.learning,
        unlockedCapabilities: [
          'persistence_auditor',
          'tls_fingerprint_inspector',
          'canary_inspector',
          'hsm_verifier',
          'binary_container_analyzer',
        ],
        unlockedTools: [
          'persist-audit',
          'ja4-inspect',
          'canary-check',
          'hsm-verify',
          'bin-audit',
        ],
      },
    };

    // 2. Test `persist-audit`:
    state = executeDeadAirCommand(state, 'persist-audit --inspect');
    assert.equal(state.flags.persistence_audit_completed, false);
    assert.equal(state.flags.metadata_protection_completed, false);

    state = executeDeadAirCommand(
      state,
      'persist-audit --quarantine bogus.timer'
    );
    assert.equal(state.flags.persistence_audit_completed, false);
    assert.equal(
      state.terminalHistory[state.terminalHistory.length - 1].tone,
      'error'
    );

    const expBeforeQ = state.flags.player_exposure;
    state = executeDeadAirCommand(
      state,
      'persist-audit --quarantine vespera-Support-sync.timer'
    );
    assert.equal(state.flags.persistence_audit_completed, true);
    assert.equal(state.flags.metadata_protection_completed, false);
    assert.equal(state.flags.player_exposure, expBeforeQ - 5);
    state = executeDeadAirCommand(
      state,
      'persist-audit --quarantine vespera-Support-sync.timer'
    );
    assert.equal(state.flags.player_exposure, expBeforeQ - 5);

    state = executeDeadAirCommand(
      state,
      'persist-audit --sanitize-copy incident_0427_brief.pdf'
    );
    assert.equal(state.flags.metadata_protection_completed, true);
    assert.ok(
      state.files.some(
        (f) => f.path === '/home/eli/Documents/incident_0427_brief.pdf'
      )
    );
    assert.ok(
      state.files.some(
        (f) => f.path === '/home/eli/Documents/incident_0427_brief.clean.pdf'
      )
    );
    assert.ok(
      state.learning.appliedStoryLessons.includes('lesson_08_persistence')
    );

    // 3. Test `ja4-inspect`:
    state = executeDeadAirCommand(state, 'ja4-inspect nonexistent.pcap');
    assert.equal(state.flags.tls_attribution_verified, false);
    const suspBeforeJa4 = state.flags.corporate_suspicion;
    state = executeDeadAirCommand(state, 'ja4-inspect captured_tls_0427');
    assert.equal(state.flags.tls_attribution_verified, true);
    assert.equal(state.flags.corporate_suspicion, suspBeforeJa4 - 5);
    state = executeDeadAirCommand(state, 'ja4-inspect captured_tls_0427');
    assert.equal(state.flags.corporate_suspicion, suspBeforeJa4 - 5);

    // 4. Test `canary-check` AND verify `10.88.14.9` active honey-trap remains intact if probed
    state = executeDeadAirCommand(state, 'canary-check 192.0.2.99');
    assert.equal(state.flags.canary_identified, false);
    state = executeDeadAirCommand(state, 'canary-check 10.88.14.9');
    assert.equal(state.flags.canary_identified, true);

    const suspBeforeProbe = state.flags.corporate_suspicion;
    const expBeforeProbe = state.flags.player_exposure;
    state = executeDeadAirCommand(state, 'probe 10.88.14.9');
    assert.equal(state.flags.corporate_suspicion, suspBeforeProbe + 15);
    assert.equal(state.flags.player_exposure, expBeforeProbe + 15);

    // 5. Test `hsm-verify`:
    state = executeDeadAirCommand(state, 'hsm-verify invalid_file.txt');
    assert.equal(state.flags.hsm_signature_verified, false);
    const suspBeforeHsm = state.flags.corporate_suspicion;
    state = executeDeadAirCommand(state, 'hsm-verify access_0427.log');
    assert.equal(state.flags.hsm_signature_verified, true);
    assert.equal(state.flags.corporate_suspicion, suspBeforeHsm - 5);
    state = executeDeadAirCommand(state, 'hsm-verify access_0427.log');
    assert.equal(state.flags.corporate_suspicion, suspBeforeHsm - 5);

    // 6. Test `bin-audit` partial substeps vs. full 3-artifact correlation:
    // 6a. Bare `bin-audit` (no args) or invalid flag is rejected
    state = executeDeadAirCommand(state, 'bin-audit');
    assert.equal(state.flags.lantern_binary_analyzed, false);
    assert.equal(
      state.terminalHistory[state.terminalHistory.length - 1].tone,
      'error'
    );
    state = executeDeadAirCommand(state, 'bin-audit --badflag');
    assert.equal(state.flags.lantern_binary_analyzed, false);

    // 6b. Running only trace analysis on a branch state does NOT prematurely set lantern_binary_analyzed
    const traceOnlyBranch = executeDeadAirCommand(
      state,
      'bin-audit --trace lantern-syncd.trace'
    );
    assert.equal(traceOnlyBranch.flags.lantern_binary_analyzed, false);
    assert.ok(
      traceOnlyBranch.completedEvents.includes('event:tactical:bin_audit_trace')
    );

    const suspBeforeBin = state.flags.corporate_suspicion;
    const trustBeforeBin = state.flags.trust_nadia;

    // 6c. Substep 1/3: `bin-audit lantern-syncd` (ELF analysis only) -> does NOT complete LEVEL 12
    state = executeDeadAirCommand(state, 'bin-audit lantern-syncd');
    assert.equal(state.flags.lantern_binary_analyzed, false);
    assert.equal(state.flags.corporate_suspicion, suspBeforeBin);
    assert.equal(state.flags.trust_nadia, trustBeforeBin);
    assert.equal(
      state.learning.appliedStoryLessons.includes('lesson_12_container_binary'),
      false
    );
    assert.ok(state.completedEvents.includes('event:tactical:bin_audit_elf'));
    assert.match(state.lastFeedbackBanner || '', /PARTIAL \(1\/3/);

    // Repeating ELF substep still does not complete LEVEL 12
    state = executeDeadAirCommand(state, 'bin-audit lantern-syncd');
    assert.equal(state.flags.lantern_binary_analyzed, false);

    // 6d. Substep 2/3: `bin-audit --container lantern-collector.json` (container analysis only) -> STILL does NOT complete LEVEL 12
    state = executeDeadAirCommand(
      state,
      'bin-audit --container lantern-collector.json'
    );
    assert.equal(state.flags.lantern_binary_analyzed, false);
    assert.equal(state.flags.corporate_suspicion, suspBeforeBin);
    assert.equal(state.flags.trust_nadia, trustBeforeBin);
    assert.ok(
      state.completedEvents.includes('event:tactical:bin_audit_container')
    );
    assert.match(state.lastFeedbackBanner || '', /PARTIAL \(2\/3/);

    // 6e. Substep 3/3: `bin-audit --trace lantern-syncd.trace` -> all 3 artifacts examined -> completes correlation!
    state = executeDeadAirCommand(
      state,
      'bin-audit --trace lantern-syncd.trace'
    );
    assert.equal(state.flags.lantern_binary_analyzed, true);
    assert.equal(state.flags.corporate_suspicion, suspBeforeBin - 5);
    assert.equal(state.flags.trust_nadia, trustBeforeBin + 10);
    assert.ok(
      state.learning.appliedStoryLessons.includes('lesson_12_container_binary')
    );

    // 6f. Repeating `--trace` or `--all` after completion is strictly idempotent
    state = executeDeadAirCommand(state, 'bin-audit --all');
    assert.equal(state.flags.corporate_suspicion, suspBeforeBin - 5);
    assert.equal(state.flags.trust_nadia, trustBeforeBin + 10);

    // 7. Even with all 6 tactical flags true, core Chapter 1 `evidence_count` MUST still be 0!
    assert.equal(state.flags.evidence_count, 0);
  });

  it('29. guarantees GUI applyLessonCapabilityToStory and CLI executeDeadAirCommand (both --all and 3-step sequential) produce identical state & flags for Track II lessons', () => {
    const baseState = createInitialDeadAirState('playing');
    const unlockedState = {
      ...baseState,
      learning: {
        ...baseState.learning,
        unlockedCapabilities: [
          'tls_fingerprint_inspector' as const,
          'binary_container_analyzer' as const,
        ],
        unlockedTools: ['ja4-inspect', 'bin-audit'],
      },
    };

    const viaGui9 = applyLessonCapabilityToStory(
      unlockedState,
      'lesson_09_tls_fingerprinting',
      'analytical'
    );
    const viaCli9 = executeDeadAirCommand(
      unlockedState,
      'ja4-inspect captured_tls_0427'
    );

    assert.equal(viaGui9.flags.tls_attribution_verified, true);
    assert.equal(viaCli9.flags.tls_attribution_verified, true);
    assert.equal(
      viaGui9.flags.corporate_suspicion,
      viaCli9.flags.corporate_suspicion
    );
    assert.equal(viaGui9.flags.trust_nadia, viaCli9.flags.trust_nadia);
    assert.deepEqual(
      viaGui9.learning.appliedStoryLessons,
      viaCli9.learning.appliedStoryLessons
    );

    // Compare Level 12 GUI Apply-to-Story vs CLI `bin-audit --all` vs CLI 3-step sequential
    const viaGui12 = applyLessonCapabilityToStory(
      unlockedState,
      'lesson_12_container_binary',
      'analytical'
    );
    const viaCli12All = executeDeadAirCommand(
      unlockedState,
      'bin-audit --all'
    );
    let viaCli12Seq = executeDeadAirCommand(
      unlockedState,
      'bin-audit lantern-syncd'
    );
    assert.equal(viaCli12Seq.flags.lantern_binary_analyzed, false);
    viaCli12Seq = executeDeadAirCommand(
      viaCli12Seq,
      'bin-audit --container lantern-collector.json'
    );
    assert.equal(viaCli12Seq.flags.lantern_binary_analyzed, false);
    viaCli12Seq = executeDeadAirCommand(
      viaCli12Seq,
      'bin-audit --trace lantern-syncd.trace'
    );

    assert.equal(viaGui12.flags.lantern_binary_analyzed, true);
    assert.equal(viaCli12All.flags.lantern_binary_analyzed, true);
    assert.equal(viaCli12Seq.flags.lantern_binary_analyzed, true);
    assert.deepEqual(viaGui12.flags, viaCli12All.flags);
    assert.deepEqual(viaGui12.flags, viaCli12Seq.flags);
    assert.deepEqual(
      viaGui12.learning.appliedStoryLessons,
      viaCli12Seq.learning.appliedStoryLessons
    );
    assert.deepEqual(viaGui12.completedEvents, viaCli12Seq.completedEvents);
  });

  it('30. validates V1->V3 and V2->V3 save migrations, valid V3 round-trip, malformed V3/V2 fallback integrity, key precedence, clean PDF & 6 tactical flags preservation, track selector persistence, and idempotency', () => {
    const v1Save = {
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
      characters: [{ id: 'nadia', trust: 62, currentNodeId: 'nadia_node_1' }],
      inventory: [{ id: 'item_moth_usb', acquired: false }],
    };

    const v2Save = {
      saveVersion: 2,
      shellState: 'playing',
      currentScene: 'LAUNDROMAT',
      unlockedScenes: ['APARTMENT_NIGHT', 'STREET_NIGHT', 'LAUNDROMAT'],
      clockTime: '02:55 AM',
      currentDir: '/home/eli/Documents',
      terminalHistory: [
        { id: 't-1', text: 'eli@greyos:~$ ls', tone: 'command' },
      ],
      completedEvents: ['event:first_phone_choice'],
      resolvedDialogueNodes: { 'rhea:rhea_node_1': 'rhea_c1_share' },
      inspectedFiles: ['/home/eli/Downloads/incident_0427/ntp_override.conf'],
      flags: {
        voicemail_played: true,
        first_choice: 'WAIT_CHECK_PC',
        first_choice_locked: true,
        archive_inspected: true,
        timeline_correlated: true,
        laundromat_meeting_done: false,
        trust_nadia: 70,
        contacted_moth: false,
        evidence_count: 3,
        discovered_lantern: false,
        corporate_suspicion: 15,
        journalist_contact: true,
        rhea_allied: true,
        player_exposure: 10,
        discovered_eli_account_reuse: false,
        soc_warning_triggered: false,
        camera_tracking_risk: false,
        camera_tracked: false,
        relay_tunnel_active: true,
        camera_scrubbed: false,
        counter_proof_secured: false,
        compromised_hosts_count: 1,
        current_objective: 'Speak with Nadia Park',
      },
      evidence: [
        { id: 'EV-01', discovered: true, correlated: true },
        { id: 'EV-02', discovered: true, correlated: true },
        { id: 'EV-03', discovered: true, correlated: true },
      ],
      files: [],
      characters: [{ id: 'nadia', trust: 70, currentNodeId: 'nadia_node_1' }],
      inventory: [{ id: 'item_moth_usb', acquired: false }],
      networkHosts: [
        {
          ip: '172.16.40.12',
          discovered: true,
          scanned: true,
          privilege: 'OPERATOR',
          compromised: true,
          actionCompleted: true,
        },
      ],
      learning: {
        completedLessonIds: ['lesson_02_dns', 'lesson_07_osint_opsec'],
        unlockedCapabilities: ['resolver_inspector', 'archive_search'],
        unlockedTools: ['dns-inspect', 'archive-search'],
        masteredConcepts: ['concept_dns_hierarchy'],
        executedDiagnosticsByLesson: { lesson_02_dns: ['diag_dns_hosts'] },
        labResolutionByLesson: { lesson_02_dns: 'analytical' },
        appliedStoryLessons: ['lesson_02_dns'],
        bruteForceStoryLessons: [],
        activeCategoryFilter: 'investigation',
        selectedLessonId: 'lesson_02_dns',
        activeLabLessonId: null,
      },
    };

    // 1. Full V1 -> V3 migration with new flags defaulting false
    const migratedFromV1 = migrateDeadAirSave(v1Save, true);
    assert.equal(migratedFromV1.saveVersion, 3);
    assert.equal(isValidV3SaveShape(migratedFromV1), true);
    assert.equal(migratedFromV1.currentScene, 'STREET_NIGHT');
    assert.equal(migratedFromV1.flags.trust_nadia, 62);
    assert.equal(migratedFromV1.flags.persistence_audit_completed, false);
    assert.equal(migratedFromV1.flags.metadata_protection_completed, false);
    assert.equal(migratedFromV1.flags.tls_attribution_verified, false);
    assert.equal(migratedFromV1.flags.canary_identified, false);
    assert.equal(migratedFromV1.flags.hsm_signature_verified, false);
    assert.equal(migratedFromV1.flags.lantern_binary_analyzed, false);
    assert.equal(migratedFromV1.learning.activeSourceTrack, 'all');

    // 2. Full V2 -> V3 migration
    const migratedFromV2 = migrateDeadAirSave(v2Save, true);
    assert.equal(migratedFromV2.saveVersion, 3);
    assert.equal(isValidV3SaveShape(migratedFromV2), true);
    assert.equal(migratedFromV2.currentScene, 'LAUNDROMAT');
    assert.equal(migratedFromV2.currentDir, '/home/eli/Documents');
    assert.equal(migratedFromV2.terminalHistory.length, 1);
    assert.equal(migratedFromV2.flags.evidence_count, 3);
    assert.equal(migratedFromV2.flags.persistence_audit_completed, false);
    assert.equal(migratedFromV2.flags.metadata_protection_completed, false);
    assert.equal(migratedFromV2.flags.tls_attribution_verified, false);
    assert.equal(migratedFromV2.flags.canary_identified, false);
    assert.equal(migratedFromV2.flags.hsm_signature_verified, false);
    assert.equal(migratedFromV2.flags.lantern_binary_analyzed, false);
    assert.deepEqual(migratedFromV2.learning.completedLessonIds, [
      'lesson_02_dns',
      'lesson_07_osint_opsec',
    ]);

    // 3. Idempotent migration
    const migratedTwice = migrateDeadAirSave(
      JSON.parse(JSON.stringify(migratedFromV2)),
      true
    );
    assert.deepEqual(migratedTwice, migratedFromV2);

    // Set up a mock window.localStorage to test end-to-end storage precedence & fallback integrity
    const store = new Map<string, string>();
    const prevWindow = (globalThis as unknown as { window?: unknown }).window;
    (globalThis as unknown as { window: unknown }).window = {
      location: { search: '?autostart=1' },
      localStorage: {
        getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
        setItem: (k: string, v: string) => {
          store.set(k, String(v));
        },
        removeItem: (k: string) => {
          store.delete(k);
        },
      },
    };

    try {
      // 4. Existing valid V3 round-trip + Clean PDF dynamic file preservation + 6 tactical flags + Track selector persistence
      let v3State = createInitialDeadAirState('playing');
      v3State = selectLearningSourceTrack(v3State, 'tactical_security');
      v3State = {
        ...v3State,
        currentDir: '/home/eli/Documents',
        learning: {
          ...v3State.learning,
          unlockedCapabilities: ['persistence_auditor'],
          unlockedTools: ['persist-audit'],
        },
      };
      v3State = executeDeadAirCommand(v3State, 'persist-audit --all');
      v3State = {
        ...v3State,
        flags: {
          ...v3State.flags,
          persistence_audit_completed: true,
          metadata_protection_completed: true,
          tls_attribution_verified: true,
          canary_identified: true,
          hsm_signature_verified: true,
          lantern_binary_analyzed: true,
        },
      };
      saveDeadAirState(v3State);
      const loadedV3 = loadDeadAirState();
      assert.equal(loadedV3.saveVersion, 3);
      assert.equal(loadedV3.learning.activeSourceTrack, 'tactical_security');
      assert.equal(loadedV3.flags.persistence_audit_completed, true);
      assert.equal(loadedV3.flags.metadata_protection_completed, true);
      assert.equal(loadedV3.flags.tls_attribution_verified, true);
      assert.equal(loadedV3.flags.canary_identified, true);
      assert.equal(loadedV3.flags.hsm_signature_verified, true);
      assert.equal(loadedV3.flags.lantern_binary_analyzed, true);
      assert.ok(
        loadedV3.files.some(
          (f) => f.path === '/home/eli/Documents/incident_0427_brief.clean.pdf'
        )
      );

      // 5. LocalStorage key precedence: valid V3 takes precedence over V2 and V1
      store.set(LEGACY_STORAGE_KEY_V2, JSON.stringify(v2Save));
      store.set(LEGACY_STORAGE_KEY_V1, JSON.stringify(v1Save));
      const loadedPrecedence = loadDeadAirState();
      assert.equal(loadedPrecedence.flags.lantern_binary_analyzed, true);
      assert.equal(loadedPrecedence.currentScene, 'APARTMENT_NIGHT');

      // 6. Malformed/incomplete V3 (containing a `flags` property!) with valid V2 backup:
      // Must NOT return an empty initial state; must continue to V2, migrate V2 -> V3, and write valid V3!
      store.clear();
      const malformedV3WithFlags = JSON.stringify({
        saveVersion: 3,
        flags: { trust_nadia: 99 },
      });
      assert.equal(isValidV3SaveShape(JSON.parse(malformedV3WithFlags)), false);
      store.set(STORAGE_KEY_V3, malformedV3WithFlags);
      store.set(LEGACY_STORAGE_KEY_V2, JSON.stringify(v2Save));

      const recoveredFromV2 = loadDeadAirState();
      assert.equal(recoveredFromV2.currentScene, 'LAUNDROMAT');
      assert.equal(recoveredFromV2.flags.trust_nadia, 70);
      assert.equal(recoveredFromV2.flags.evidence_count, 3);
      // V2 backup is preserved and V3 is updated with the valid migrated V3 save
      assert.ok(store.get(LEGACY_STORAGE_KEY_V2));
      assert.equal(
        isValidV3SaveShape(JSON.parse(store.get(STORAGE_KEY_V3)!)),
        true
      );

      // 7. Malformed V3 AND malformed V2 (both containing `flags`!) with valid V1 backup:
      // Must continue past V3 and V2, migrate V1 -> V3, preserve V1 & V2, and write V3 after migration!
      store.clear();
      const malformedV2WithFlags = JSON.stringify({
        saveVersion: 2,
        flags: { trust_nadia: 10 },
      });
      assert.equal(
        isValidLegacySaveShape(JSON.parse(malformedV2WithFlags)),
        false
      );
      store.set(STORAGE_KEY_V3, malformedV3WithFlags);
      store.set(LEGACY_STORAGE_KEY_V2, malformedV2WithFlags);
      store.set(LEGACY_STORAGE_KEY_V1, JSON.stringify(v1Save));

      const recoveredFromV1 = loadDeadAirState();
      assert.equal(recoveredFromV1.currentScene, 'STREET_NIGHT');
      assert.equal(recoveredFromV1.flags.trust_nadia, 62);
      assert.equal(recoveredFromV1.flags.first_choice, 'TRACE_SMS');
      assert.equal(store.get(LEGACY_STORAGE_KEY_V2), malformedV2WithFlags);
      assert.ok(store.get(LEGACY_STORAGE_KEY_V1));
      assert.equal(
        isValidV3SaveShape(JSON.parse(store.get(STORAGE_KEY_V3)!)),
        true
      );

      // 8. When V3 is malformed and no valid legacy save exists, V3 is preserved in localStorage (not overwritten with empty state)
      store.clear();
      store.set(STORAGE_KEY_V3, malformedV3WithFlags);
      const fallbackInitial = loadDeadAirState();
      assert.equal(fallbackInitial.currentScene, 'APARTMENT_NIGHT');
      assert.equal(store.get(STORAGE_KEY_V3), malformedV3WithFlags);
    } finally {
      if (prevWindow === undefined) {
        delete (globalThis as unknown as { window?: unknown }).window;
      } else {
        (globalThis as unknown as { window: unknown }).window = prevWindow;
      }
    }
  });
});



