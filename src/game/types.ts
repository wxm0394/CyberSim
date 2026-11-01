export type GameShellState = 'title' | 'playing' | 'paused' | 'gameover';

export type SceneId =
  | 'APARTMENT_NIGHT'
  | 'STREET_NIGHT'
  | 'LAUNDROMAT'
  | 'APARTMENT_RETURN';

export type ActiveOverlay =
  | 'NONE'
  | 'COMPUTER'
  | 'PHONE'
  | 'JOURNAL'
  | 'DIALOGUE';

export type ComputerAppId = 'FILES' | 'TERMINAL' | 'MAIL' | 'TIMELINE';

export type FirstPhoneChoice =
  | 'CALL_NADIA'
  | 'TRACE_SMS'
  | 'WAIT_CHECK_PC'
  | 'CONTACT_ALLY'
  | null;

export interface NarrativeFlags {
  voicemail_played: boolean;
  first_choice: FirstPhoneChoice;
  archive_inspected: boolean;
  timeline_correlated: boolean;
  laundromat_meeting_done: boolean;
  trust_nadia: number; // 0 to 100
  contacted_moth: boolean;
  evidence_count: number;
  discovered_lantern: boolean;
  corporate_suspicion: number; // 0 to 100
  journalist_contact: boolean;
  player_exposure: number; // 0 to 100
  discovered_eli_account_reuse: boolean;
  current_objective: string;
}

export interface SceneHotspot {
  id: string;
  label: string;
  labelZh: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  detailText: string;
  detailTextZh: string;
  inspected: boolean;
  triggersOverlay?: ActiveOverlay;
  triggersScene?: SceneId;
  triggersCharacterId?: string;
  unlocksItemId?: string;
  unlocksEvidenceId?: string;
}

export interface EvidenceArtifact {
  id: string;
  title: string;
  titleZh: string;
  chronologicalOrder: number;
  eventTimestamp: string;
  source: string;
  summary: string;
  forensicNarrative: string;
  discovered: boolean;
  correlated: boolean;
}

export interface VirtualFileEntry {
  name: string;
  path: string;
  parentDir: string;
  size: string;
  modifiedAt: string;
  unlocked: boolean;
  unlocksEvidenceId?: string;
  content: string;
}

export interface MailMessage {
  id: string;
  sender: string;
  subject: string;
  subjectZh: string;
  timestamp: string;
  body: string;
}

export interface PhoneMessage {
  id: string;
  sender: string;
  senderRole: string;
  timestamp: string;
  type: 'VOICEMAIL' | 'SMS';
  body: string;
  bodyZh: string;
  isUnread: boolean;
  unlocked: boolean;
}

export interface DialogueChoice {
  id: string;
  label: string;
  labelZh: string;
  nextNodeId?: string;
  trustDelta?: number;
  suspicionDelta?: number;
  exposureDelta?: number;
  unlocksEvidenceId?: string;
}

export interface DialogueNode {
  id: string;
  speaker: string;
  body: string;
  bodyZh: string;
  choices: DialogueChoice[];
}

export interface CharacterProfile {
  id: string;
  name: string;
  role: string;
  roleZh: string;
  location: string;
  stance: string;
  trust: number;
  bio: string;
  currentNodeId: string;
  nodes: DialogueNode[];
}

export interface InventoryItem {
  id: string;
  name: string;
  nameZh: string;
  description: string;
  acquired: boolean;
}

export interface TerminalOutputLine {
  id: string;
  text: string;
  tone: 'command' | 'output' | 'highlight' | 'error' | 'system';
}

export interface DeadAirState {
  shellState: GameShellState;
  currentScene: SceneId;
  activeOverlay: ActiveOverlay;
  activeComputerApp: ComputerAppId;
  activeDialogueCharacterId: string | null;
  selectedHotspotId: string | null;
  clockTime: string;
  monologueBanner: string;
  soundEnabled: boolean;
  flags: NarrativeFlags;
  hotspots: Record<SceneId, SceneHotspot[]>;
  evidence: EvidenceArtifact[];
  files: VirtualFileEntry[];
  emails: MailMessage[];
  phoneMessages: PhoneMessage[];
  characters: CharacterProfile[];
  inventory: InventoryItem[];
  currentDir: string;
  terminalHistory: TerminalOutputLine[];
}
