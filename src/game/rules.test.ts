import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialDeadAirState } from '../data/storyData';
import {
  inspectHotspot,
  handleFirstPhoneChoice,
  inspectVirtualFile,
  correlateEvidenceTimeline,
  selectCharacterDialogueChoice,
  executeDeadAirCommand,
  transitionToScene,
} from './storyEngine';

describe('DEAD AIR — Chapter 1 Story & Forensic Engine', () => {
  it('initializes in APARTMENT_NIGHT at 02:17 AM with 6 chronological evidence items', () => {
    const state = createInitialDeadAirState('playing');
    assert.equal(state.currentScene, 'APARTMENT_NIGHT');
    assert.equal(state.clockTime, '02:17 AM');
    assert.equal(state.evidence.length, 6);
    assert.equal(state.flags.evidence_count, 0);
  });

  it('inspects apartment hotspots and opens smartphone on hs_phone', () => {
    let state = createInitialDeadAirState('playing');
    state = inspectHotspot(state, 'hs_badge');
    assert.equal(
      state.hotspots.APARTMENT_NIGHT.find((h) => h.id === 'hs_badge')?.inspected,
      true
    );

    state = inspectHotspot(state, 'hs_phone');
    assert.equal(state.activeOverlay, 'PHONE');
    assert.equal(state.flags.voicemail_played, true);
  });

  it('records Scene 2 first choice and updates suspicion/trust', () => {
    let state = createInitialDeadAirState('playing');
    state = handleFirstPhoneChoice(state, 'TRACE_SMS');
    assert.equal(state.flags.first_choice, 'TRACE_SMS');
    assert.equal(state.flags.corporate_suspicion, 20);
    assert.ok(
      state.phoneMessages.some((m) => m.id === 'msg_choice_trace_sms')
    );
  });

  it('logs forensic evidence when inspecting incident_0427 files and correlates timeline', () => {
    let state = createInitialDeadAirState('playing');
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

    assert.equal(state.flags.evidence_count, 3);
    assert.equal(state.flags.archive_inspected, true);

    state = correlateEvidenceTimeline(state);
    assert.equal(state.flags.timeline_correlated, true);
    const ev1 = state.evidence.find((e) => e.id === 'EV-01');
    assert.equal(ev1?.discovered, true);
    assert.equal(ev1?.correlated, true);
  });

  it('handles Laundromat dialogue with Nadia Park and unlocks moth_archive.key', () => {
    let state = createInitialDeadAirState('playing');
    state = transitionToScene(state, 'LAUNDROMAT');
    assert.equal(state.currentScene, 'LAUNDROMAT');

    // Node 1 -> Node 2 -> Node 3 -> Finish
    state = selectCharacterDialogueChoice(state, 'nadia', 'nadia_c1_share');
    state = selectCharacterDialogueChoice(state, 'nadia', 'nadia_c2_expose');
    state = selectCharacterDialogueChoice(state, 'nadia', 'nadia_c3_accept');

    assert.equal(state.flags.laundromat_meeting_done, true);
    assert.equal(state.flags.contacted_moth, true);
    assert.equal(
      state.inventory.find((i) => i.id === 'item_moth_usb')?.acquired,
      true
    );
  });

  it('triggers the e.ward_09 twist and Chapter 1 finale when inspecting lantern_auth_audit.db via terminal', () => {
    let state = createInitialDeadAirState('playing');
    state = transitionToScene(state, 'APARTMENT_RETURN');
    state = executeDeadAirCommand(
      state,
      'cat /home/eli/archive_vault/lantern_auth_audit.db'
    );

    assert.equal(state.flags.discovered_eli_account_reuse, true);
    assert.equal(state.shellState, 'gameover');
    const ev6 = state.evidence.find((e) => e.id === 'EV-06');
    assert.equal(ev6?.discovered, true);
  });
});
