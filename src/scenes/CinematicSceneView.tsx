import React from 'react';
import { DeadAirState, SceneHotspot, SceneId } from '../game/types';
import {
  canTransitionToScene,
  getInitialIncidentEvidenceCount,
  hasMothArchiveKey,
} from '../game/storyEngine';
import {
  Smartphone,
  Terminal,
  BookOpen,
  MapPin,
  Eye,
  Volume2,
  VolumeX,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  Lock,
  CheckCircle2,
  Wrench,
} from 'lucide-react';

interface CinematicSceneViewProps {
  state: DeadAirState;
  soundEnabled: boolean;
  onInspectHotspot: (hotspotId: string) => void;
  onOpenPhone: () => void;
  onOpenComputer: () => void;
  onOpenJournal: () => void;
  onOpenFieldManual: () => void;
  onTransitionScene: (scene: SceneId, forceDebug?: boolean) => void;
  onToggleSound: () => void;
  onToggleDebugMode: () => void;
  onResetGame: () => void;
}

const SCENE_META: Record<
  SceneId,
  {
    title: string;
    titleZh: string;
    location: string;
    weather: string;
  }
> = {
  APARTMENT_NIGHT: {
    title: 'Eli Ward’s Apartment — Apt 4B',
    titleZh: '伊莱·沃德的公寓（4B 室）',
    location: 'SOUTH GREYHAVEN · 4TH AVE TENEMENT',
    weather: 'HEAVY RAIN · 46°F',
  },
  STREET_NIGHT: {
    title: '4th Avenue Wet Asphalt',
    titleZh: '第四大道雨夜街口',
    location: 'SOUTH GREYHAVEN · MUNICIPAL CAMERA SECTOR 04',
    weather: 'COLD DRIZZLE · NEON REFLECTION',
  },
  LAUNDROMAT: {
    title: '24-Hour Coin Laundry',
    titleZh: '24 小时自助投币洗衣房',
    location: '418 FOURTH AVE · FLUORESCENT INTERIOR',
    weather: 'HUMID WARMTH · DRYER HUM',
  },
  APARTMENT_RETURN: {
    title: 'Apt 4B — Intrusion Detected',
    titleZh: '4B 室 — 深夜归来（异常唤醒）',
    location: 'SOUTH GREYHAVEN · REMOTE TUNNEL ACTIVE',
    weather: 'DEAD AIR · 03:12 AM',
  },
};

export const CinematicSceneView: React.FC<CinematicSceneViewProps> = ({
  state,
  soundEnabled,
  onInspectHotspot,
  onOpenPhone,
  onOpenComputer,
  onOpenJournal,
  onOpenFieldManual,
  onTransitionScene,
  onToggleSound,
  onToggleDebugMode,
  onResetGame,
}) => {
  const currentHotspots = state.hotspots[state.currentScene] || [];
  const selectedHotspot: SceneHotspot | undefined = currentHotspots.find(
    (h) => h.id === state.selectedHotspotId
  );
  const unreadSmsCount = state.phoneMessages.filter(
    (m) => m.unlocked && m.isUnread
  ).length;
  const meta = SCENE_META[state.currentScene];

  const streetCheck = canTransitionToScene(state, 'STREET_NIGHT');
  const laundromatCheck = canTransitionToScene(state, 'LAUNDROMAT');
  const returnCheck = canTransitionToScene(state, 'APARTMENT_RETURN');
  const initialForensicCount = getInitialIncidentEvidenceCount(state);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#080B0E] text-[#E3E7EB] flex flex-col justify-between select-none">
      {/* Top Diegetic Narrative Header */}
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-4 px-6 py-3.5 bg-[#080B0E]/90 border-b border-white/10 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="font-mono text-xs tracking-[0.18em] text-[#4FA3B8] uppercase tabular-nums">
            {state.clockTime}
          </div>
          <div className="h-3.5 w-[1px] bg-white/15" />
          <div>
            <div className="text-sm font-semibold text-[#E3E7EB] flex items-center gap-2">
              <span>{meta.title}</span>
              <span className="text-xs font-normal text-[#8E98A4]">
                / {meta.titleZh}
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#8E98A4] tracking-wider">
              {meta.location} · {meta.weather}
            </div>
          </div>
        </div>

        {/* Active Narrative Objective */}
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded border border-[#4FA3B8]/30 bg-[#12171D]/90 max-w-xl">
          <span className="w-2 h-2 rounded-full bg-[#D89B3C] shrink-0" />
          <div className="text-xs text-[#E3E7EB] truncate">
            <span className="font-mono text-[#8E98A4] mr-1.5">OBJECTIVE:</span>
            {state.flags.current_objective}
          </div>
        </div>

        {/* Subtle Utility Controls */}
        <div className="flex items-center gap-2">
          {import.meta.env.DEV && (
            <button
              type="button"
              data-testid="toggle-debug-btn"
              onClick={onToggleDebugMode}
              title="Toggle Developer Debug Mode (Dev Environment Only)"
              className={`px-2.5 py-1.5 rounded border text-[11px] font-mono flex items-center gap-1.5 transition cursor-pointer ${
                state.debugMode
                  ? 'border-[#D89B3C] bg-[#D89B3C]/20 text-[#D89B3C]'
                  : 'border-white/10 bg-[#12171D] text-[#8E98A4] hover:text-[#E3E7EB]'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>DEV</span>
            </button>
          )}
          <button
            type="button"
            onClick={onToggleSound}
            title="Toggle Rain & Audio"
            className="p-2 rounded border border-white/10 bg-[#12171D] hover:border-[#4FA3B8]/50 text-[#8E98A4] hover:text-[#E3E7EB] transition cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-[#4FA3B8]" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>
          <button
            type="button"
            data-testid="hud-reset-btn"
            onClick={onResetGame}
            title="Restart Investigation"
            className="p-2 rounded border border-white/10 bg-[#12171D] hover:border-[#C94B4B]/50 text-[#8E98A4] hover:text-[#E3E7EB] transition cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Isolated Developer Debug Sandbox Bar (Only visible when DEV mode is toggled on) */}
      {state.debugMode && (
        <div
          data-testid="dev-debug-bar"
          className="relative z-20 px-6 py-2 bg-[#1A1309] border-b border-[#D89B3C]/50 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#D89B3C]"
        >
          <div>
            [DEVELOPER DEBUG SANDBOX] Bypass scene prerequisites for testing:
          </div>
          <div className="flex items-center gap-2">
            {(
              [
                { id: 'APARTMENT_NIGHT', label: 'Force: Apt 4B' },
                { id: 'STREET_NIGHT', label: 'Force: 4th Ave' },
                { id: 'LAUNDROMAT', label: 'Force: Laundromat' },
                { id: 'APARTMENT_RETURN', label: 'Force: Apt Return' },
              ] as { id: SceneId; label: string }[]
            ).map((loc) => (
              <button
                key={loc.id}
                type="button"
                data-testid={`debug-jump-${loc.id}`}
                onClick={() => onTransitionScene(loc.id, true)}
                className="px-2.5 py-1 rounded border border-[#D89B3C]/60 bg-[#080B0E] hover:bg-[#D89B3C]/20 text-[#E3E7EB] text-[11px] cursor-pointer"
              >
                {loc.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main 16:9 Interactive Environmental Stage */}
      <main className="relative flex-1 w-full overflow-hidden flex items-center justify-center bg-[#070A0D]">
        {/* Top-Right Consequence & Prerequisites Status Card */}
        <div className="absolute top-4 right-6 z-20 rounded border border-white/10 bg-[#080B0E]/90 backdrop-blur-md p-3.5 text-xs font-mono space-y-1.5 max-w-xs">
          <div className="text-[10px] uppercase tracking-[0.18em] text-[#8E98A4] border-b border-white/10 pb-1">
            CHAPTER 1 PROGRESSION GATES
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#C2CAD3]">1. Phone Decision</span>
            <span
              className={
                state.flags.first_choice_locked
                  ? 'text-[#469A6C]'
                  : 'text-[#D89B3C]'
              }
            >
              {state.flags.first_choice_locked ? 'LOCKED' : 'REQUIRED'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#C2CAD3]">2. Initial Forensics</span>
            <span
              className={
                initialForensicCount >= 2 ? 'text-[#469A6C]' : 'text-[#D89B3C]'
              }
            >
              {initialForensicCount}/2 MIN
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#C2CAD3]">3. Timeline Linked</span>
            <span
              className={
                state.flags.timeline_correlated
                  ? 'text-[#469A6C]'
                  : 'text-[#D89B3C]'
              }
            >
              {state.flags.timeline_correlated ? 'VERIFIED' : 'REQUIRED'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[#C2CAD3]">4. Archive Key</span>
            <span
              className={
                hasMothArchiveKey(state) ? 'text-[#469A6C]' : 'text-[#8E98A4]'
              }
            >
              {hasMothArchiveKey(state) ? 'ACQUIRED' : 'LAUNDROMAT'}
            </span>
          </div>
          {(state.flags.corporate_suspicion >= 25 ||
            state.flags.camera_tracked ||
            state.flags.camera_tracking_risk) && (
            <div className="pt-1.5 border-t border-[#C94B4B]/40 text-[11px] text-[#C94B4B] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>
                {state.flags.camera_tracked
                  ? 'Optical Camera #04 Locked'
                  : state.flags.corporate_suspicion >= 25
                  ? 'SOC Threat Alert Active'
                  : 'Municipal Camera Tracking Risk'}
              </span>
            </div>
          )}
        </div>

        {/* Architectural Scene SVG Illustration */}
        <div className="relative w-full h-full">
          {state.currentScene === 'APARTMENT_NIGHT' && (
            <svg
              viewBox="0 0 1600 900"
              preserveAspectRatio="xMidYMid slice"
              className="w-full h-full object-cover"
            >
              <defs>
                <linearGradient id="aptWall" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#090D12" />
                  <stop offset="65%" stopColor="#101720" />
                  <stop offset="100%" stopColor="#070A0D" />
                </linearGradient>
                <radialGradient id="monitorGlow" cx="0.62" cy="0.46" r="0.28">
                  <stop offset="0%" stopColor="rgba(79, 163, 184, 0.28)" />
                  <stop offset="100%" stopColor="rgba(8, 11, 14, 0)" />
                </radialGradient>
                <radialGradient id="lampGlow" cx="0.33" cy="0.54" r="0.24">
                  <stop offset="0%" stopColor="rgba(216, 155, 60, 0.22)" />
                  <stop offset="100%" stopColor="rgba(8, 11, 14, 0)" />
                </radialGradient>
              </defs>

              <rect width="1600" height="900" fill="url(#aptWall)" />

              {/* Left Rain-Streaked Window */}
              <g>
                <rect
                  x="90"
                  y="90"
                  width="360"
                  height="460"
                  fill="#060A0F"
                  stroke="#1E2936"
                  strokeWidth="8"
                />
                <rect x="130" y="180" width="95" height="360" fill="#0B131C" />
                <rect x="255" y="140" width="120" height="400" fill="#0E1824" />
                <text
                  x="275"
                  y="185"
                  fill="#4FA3B8"
                  opacity="0.45"
                  fontFamily="monospace"
                  fontSize="15"
                  letterSpacing="3"
                >
                  VESPERA
                </text>
                <line
                  x1="270"
                  y1="90"
                  x2="270"
                  y2="550"
                  stroke="#1A2430"
                  strokeWidth="6"
                />
                <line
                  x1="90"
                  y1="320"
                  x2="450"
                  y2="320"
                  stroke="#1A2430"
                  strokeWidth="6"
                />
                <line
                  x1="160"
                  y1="120"
                  x2="145"
                  y2="260"
                  stroke="#4FA3B8"
                  strokeOpacity="0.25"
                  strokeWidth="1.5"
                />
                <line
                  x1="340"
                  y1="210"
                  x2="325"
                  y2="390"
                  stroke="#4FA3B8"
                  strokeOpacity="0.25"
                  strokeWidth="1.5"
                />
              </g>

              <rect width="1600" height="900" fill="url(#monitorGlow)" />
              <rect width="1600" height="900" fill="url(#lampGlow)" />

              {/* Center Desk & Dual Linux Monitors */}
              <g>
                <polygon
                  points="320,590 1180,590 1260,760 240,760"
                  fill="#131920"
                  stroke="#26313D"
                  strokeWidth="2"
                />
                <rect
                  x="830"
                  y="330"
                  width="270"
                  height="175"
                  rx="4"
                  fill="#0A1219"
                  stroke="#3A4B5C"
                  strokeWidth="4"
                />
                <rect
                  x="842"
                  y="342"
                  width="246"
                  height="151"
                  fill="#0D1B24"
                />
                <line
                  x1="858"
                  y1="368"
                  x2="980"
                  y2="368"
                  stroke="#4FA3B8"
                  strokeWidth="3"
                />
                <line
                  x1="858"
                  y1="388"
                  x2="1040"
                  y2="388"
                  stroke="#8E98A4"
                  strokeWidth="2"
                />
                <line
                  x1="858"
                  y1="408"
                  x2="1010"
                  y2="408"
                  stroke="#D89B3C"
                  strokeWidth="2"
                />
                <line
                  x1="858"
                  y1="428"
                  x2="950"
                  y2="428"
                  stroke="#469A6C"
                  strokeWidth="2"
                />
                <rect x="945" y="505" width="40" height="65" fill="#1E2730" />
                <rect x="900" y="565" width="130" height="12" fill="#2A3642" />

                <rect
                  x="700"
                  y="545"
                  width="64"
                  height="34"
                  rx="4"
                  fill="#111C26"
                  stroke="#D89B3C"
                  strokeWidth="2"
                />
                <circle cx="715" cy="562" r="4" fill="#D89B3C" />

                <rect
                  x="430"
                  y="475"
                  width="170"
                  height="95"
                  fill="#161D24"
                  stroke="#2C3947"
                  strokeWidth="2"
                />
                <circle
                  cx="480"
                  cy="520"
                  r="18"
                  fill="#D89B3C"
                  fillOpacity="0.2"
                />
              </g>

              <g>
                <rect
                  x="1330"
                  y="190"
                  width="170"
                  height="520"
                  fill="#0E1318"
                  stroke="#232D38"
                  strokeWidth="4"
                />
                <circle cx="1358" cy="465" r="7" fill="#D89B3C" />
              </g>
            </svg>
          )}

          {state.currentScene === 'STREET_NIGHT' && (
            <svg
              viewBox="0 0 1600 900"
              preserveAspectRatio="xMidYMid slice"
              className="w-full h-full object-cover"
            >
              <defs>
                <linearGradient id="streetSky" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06090C" />
                  <stop offset="60%" stopColor="#0E161F" />
                  <stop offset="100%" stopColor="#090D12" />
                </linearGradient>
              </defs>
              <rect width="1600" height="900" fill="url(#streetSky)" />
              <rect x="80" y="100" width="260" height="520" fill="#0B1117" />
              <rect x="380" y="160" width="240" height="460" fill="#0D141C" />
              <rect x="980" y="120" width="440" height="500" fill="#101822" />

              <rect
                x="1020"
                y="310"
                width="360"
                height="290"
                fill="#13222B"
                stroke="#4FA3B8"
                strokeWidth="3"
              />
              <rect
                x="1040"
                y="255"
                width="320"
                height="42"
                fill="#0D1820"
                stroke="#D89B3C"
                strokeWidth="2"
              />
              <text
                x="1065"
                y="282"
                fill="#D89B3C"
                fontFamily="monospace"
                fontSize="20"
                fontWeight="bold"
                letterSpacing="3"
              >
                24H COIN LAUNDRY
              </text>

              <polygon
                points="0,610 1600,610 1600,900 0,900"
                fill="#080C10"
              />
              <ellipse
                cx="1200"
                cy="710"
                rx="190"
                ry="32"
                fill="rgba(79, 163, 184, 0.16)"
              />
              <ellipse
                cx="520"
                cy="730"
                rx="140"
                ry="24"
                fill="rgba(216, 155, 60, 0.14)"
              />
            </svg>
          )}

          {state.currentScene === 'LAUNDROMAT' && (
            <svg
              viewBox="0 0 1600 900"
              preserveAspectRatio="xMidYMid slice"
              className="w-full h-full object-cover"
            >
              <rect width="1600" height="900" fill="#0D151B" />
              <rect
                x="280"
                y="60"
                width="420"
                height="12"
                fill="#E3E7EB"
                opacity="0.85"
              />
              <rect
                x="900"
                y="60"
                width="420"
                height="12"
                fill="#4FA3B8"
                opacity="0.7"
              />

              {[220, 440, 660, 880].map((xPos, idx) => (
                <g key={xPos}>
                  <rect
                    x={xPos}
                    y="250"
                    width="180"
                    height="330"
                    rx="8"
                    fill="#16212B"
                    stroke="#2E3F4F"
                    strokeWidth="4"
                  />
                  <circle
                    cx={xPos + 90}
                    cy="420"
                    r="62"
                    fill="#091015"
                    stroke={idx === 1 ? '#D89B3C' : '#4FA3B8'}
                    strokeWidth="5"
                  />
                </g>
              ))}

              <g>
                <circle cx="910" cy="365" r="34" fill="#1F2D3A" />
                <path
                  d="M855,580 C855,440 965,440 965,580 Z"
                  fill="#182430"
                  stroke="#4FA3B8"
                  strokeWidth="2"
                />
              </g>
            </svg>
          )}

          {state.currentScene === 'APARTMENT_RETURN' && (
            <svg
              viewBox="0 0 1600 900"
              preserveAspectRatio="xMidYMid slice"
              className="w-full h-full object-cover"
            >
              <rect width="1600" height="900" fill="#06080B" />
              <radialGradient id="intrusionGlow" cx="0.56" cy="0.48" r="0.35">
                <stop offset="0%" stopColor="rgba(201, 75, 75, 0.34)" />
                <stop offset="55%" stopColor="rgba(79, 163, 184, 0.14)" />
                <stop offset="100%" stopColor="rgba(6, 8, 11, 0)" />
              </radialGradient>
              <rect width="1600" height="900" fill="url(#intrusionGlow)" />
              <polygon
                points="320,590 1180,590 1260,760 240,760"
                fill="#0E1318"
                stroke="#C94B4B"
                strokeOpacity="0.4"
                strokeWidth="2"
              />
              <rect
                x="760"
                y="320"
                width="300"
                height="190"
                rx="4"
                fill="#090E14"
                stroke="#C94B4B"
                strokeWidth="4"
              />
              <text
                x="790"
                y="405"
                fill="#C94B4B"
                fontFamily="monospace"
                fontSize="16"
                fontWeight="bold"
              >
                REMOTE SHELL ACTIVE
              </text>
              <text
                x="790"
                y="435"
                fill="#4FA3B8"
                fontFamily="monospace"
                fontSize="13"
              >
                /home/eli/archive_vault
              </text>
            </svg>
          )}

          {/* Interactive Hotspot Nodes Placed Over the 16:9 Scene */}
          {currentHotspots.map((hotspot) => {
            const isSelected = state.selectedHotspotId === hotspot.id;
            const isActionTrigger =
              Boolean(hotspot.triggersOverlay) ||
              Boolean(hotspot.triggersScene);

            return (
              <button
                key={hotspot.id}
                type="button"
                data-testid={`hotspot-${hotspot.id}`}
                onClick={() => onInspectHotspot(hotspot.id)}
                style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                className={`group absolute -translate-x-1/2 -translate-y-1/2 z-10 flex items-center gap-2.5 px-3.5 py-2 rounded border backdrop-blur-md transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#4FA3B8]/25 border-[#4FA3B8] text-[#E3E7EB] shadow-lg shadow-[#4FA3B8]/20 scale-105'
                    : hotspot.inspected
                    ? 'bg-[#12171D]/85 border-white/20 text-[#C2CAD3] hover:border-[#4FA3B8]'
                    : isActionTrigger
                    ? 'bg-[#12171D]/95 border-[#D89B3C]/80 text-[#E3E7EB] hover:border-[#D89B3C] shadow-md shadow-[#D89B3C]/10'
                    : 'bg-[#12171D]/90 border-[#4FA3B8]/60 text-[#E3E7EB] hover:border-[#4FA3B8]'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    hotspot.inspected
                      ? 'bg-[#469A6C]'
                      : isActionTrigger
                      ? 'bg-[#D89B3C] ring-2 ring-[#D89B3C]/40'
                      : 'bg-[#4FA3B8]'
                  }`}
                />
                <div className="text-left">
                  <div className="text-xs font-medium leading-tight whitespace-nowrap">
                    {hotspot.label}
                  </div>
                  <div className="text-[10px] font-mono text-[#8E98A4] leading-tight whitespace-nowrap">
                    {hotspot.labelZh}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom-Left Narrative Inspection Monologue Card */}
        <div className="absolute bottom-5 left-6 right-6 md:right-auto md:max-w-xl z-20 rounded border border-white/15 bg-[#080B0E]/92 backdrop-blur-md p-4 shadow-2xl">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-[#4FA3B8] flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              {selectedHotspot
                ? `${selectedHotspot.label} · ${selectedHotspot.labelZh}`
                : 'INTERNAL OBSERVATION · 环境观察'}
            </span>
            <span className="text-[11px] font-mono text-[#8E98A4] tabular-nums">
              EVIDENCE: {state.flags.evidence_count}/6 · TRUST:{' '}
              {state.flags.trust_nadia}% · EXPOSURE: {state.flags.player_exposure}%
            </span>
          </div>
          <p className="text-xs md:text-sm text-[#E3E7EB] leading-relaxed">
            {selectedHotspot
              ? selectedHotspot.detailText
              : state.monologueBanner}
          </p>
          {selectedHotspot && (
            <p className="text-xs text-[#8E98A4] leading-relaxed mt-1">
              {selectedHotspot.detailTextZh}
            </p>
          )}
        </div>

        {/* Contextual Scene Travel CTA when Prerequisites Are Met */}
        {state.currentScene === 'APARTMENT_NIGHT' &&
          streetCheck.allowed &&
          !state.flags.laundromat_meeting_done && (
            <div className="absolute bottom-5 right-6 z-20">
              <button
                type="button"
                data-testid="quick-leave-apartment-btn"
                onClick={() => onTransitionScene('STREET_NIGHT')}
                className="flex items-center gap-2.5 px-4 py-3 rounded bg-[#D89B3C] hover:bg-[#e5a94a] text-[#080B0E] font-mono font-semibold text-xs uppercase tracking-wider shadow-xl cursor-pointer transition"
              >
                <MapPin className="w-4 h-4" />
                <span>STEP OUT TO 4TH AVE / 前往第四大道</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        {state.currentScene === 'LAUNDROMAT' && returnCheck.allowed && (
          <div className="absolute bottom-5 right-6 z-20">
            <button
              type="button"
              data-testid="quick-return-apartment-btn"
              onClick={() => onTransitionScene('APARTMENT_RETURN')}
              className="flex items-center gap-2.5 px-4 py-3 rounded bg-[#C94B4B] hover:bg-[#d85c5c] text-[#E3E7EB] font-mono font-semibold text-xs uppercase tracking-wider shadow-xl cursor-pointer transition"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>RETURN TO APT 4B (03:12 AM) / 返回公寓</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      {/* Bottom Diegetic Action Bar (No free scene skipping in normal mode) */}
      <footer className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-[#080B0E]/95 border-t border-white/10">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            data-testid="hud-phone-btn"
            onClick={onOpenPhone}
            className="relative flex items-center gap-2 px-4 py-2 rounded border border-white/15 bg-[#12171D] hover:border-[#4FA3B8] text-xs font-mono text-[#E3E7EB] transition cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-[#D89B3C]" />
            <span>SMARTPHONE [P]</span>
            {unreadSmsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded bg-[#D89B3C] text-[#080B0E] font-bold text-[10px] tabular-nums">
                {unreadSmsCount}
              </span>
            )}
          </button>

          {(state.currentScene === 'APARTMENT_NIGHT' ||
            state.currentScene === 'APARTMENT_RETURN') && (
            <button
              type="button"
              data-testid="hud-computer-btn"
              onClick={onOpenComputer}
              className="flex items-center gap-2 px-4 py-2 rounded border border-[#4FA3B8]/50 bg-[#12171D] hover:bg-[#4FA3B8]/15 text-xs font-mono text-[#E3E7EB] transition cursor-pointer"
            >
              <Terminal className="w-4 h-4 text-[#4FA3B8]" />
              <span>WORKSTATION OS (GreyOS) [C]</span>
            </button>
          )}

          <button
            type="button"
            data-testid="hud-journal-btn"
            onClick={onOpenJournal}
            className="flex items-center gap-2 px-4 py-2 rounded border border-white/15 bg-[#12171D] hover:border-[#4FA3B8] text-xs font-mono text-[#E3E7EB] transition cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#4FA3B8]" />
            <span>FORENSIC TIMELINE &amp; NOTES [J]</span>
            <span className="text-[#4FA3B8] tabular-nums">
              ({state.flags.evidence_count}/6)
            </span>
          </button>

          <button
            type="button"
            data-testid="hud-manual-btn"
            onClick={onOpenFieldManual}
            className="flex items-center gap-2 px-4 py-2 rounded border border-[#469A6C]/50 bg-[#12171D] hover:border-[#469A6C] text-xs font-mono text-[#E3E7EB] transition cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-[#469A6C]" />
            <span>FIELD MANUAL &amp; NETLAB [M]</span>
            <span className="text-[#469A6C] tabular-nums">
              ({state.learning.completedLessonIds.length}/12)
            </span>
          </button>
        </div>

        {/* Gated Story Progression Indicator (Validates State Machine on Click) */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-[#8E98A4] hidden sm:inline">STORY STAGE:</span>
          {(
            [
              {
                id: 'APARTMENT_NIGHT',
                label: '01. Apt 4B',
                allowed: canTransitionToScene(state, 'APARTMENT_NIGHT').allowed,
              },
              {
                id: 'STREET_NIGHT',
                label: '02. 4th Ave',
                allowed: streetCheck.allowed,
              },
              {
                id: 'LAUNDROMAT',
                label: '03. Laundromat',
                allowed: laundromatCheck.allowed,
              },
              {
                id: 'APARTMENT_RETURN',
                label: '04. Apt Return',
                allowed: returnCheck.allowed,
              },
            ] as { id: SceneId; label: string; allowed: boolean }[]
          ).map((loc) => {
            const isCurrent = state.currentScene === loc.id;
            return (
              <button
                key={loc.id}
                type="button"
                data-testid={`scene-nav-${loc.id}`}
                onClick={() => onTransitionScene(loc.id)}
                className={`px-2.5 py-1 rounded border text-[11px] flex items-center gap-1 transition ${
                  isCurrent
                    ? 'border-[#4FA3B8] bg-[#4FA3B8]/20 text-[#E3E7EB] cursor-default'
                    : loc.allowed
                    ? 'border-[#469A6C]/50 bg-[#12171D] text-[#E3E7EB] hover:border-[#4FA3B8] cursor-pointer'
                    : 'border-white/5 bg-[#0A0E12] text-[#8E98A4]/60 cursor-not-allowed'
                }`}
              >
                {!isCurrent &&
                  (loc.allowed ? (
                    <CheckCircle2 className="w-3 h-3 text-[#469A6C]" />
                  ) : (
                    <Lock className="w-3 h-3 text-[#8E98A4]/60" />
                  ))}
                <span>{loc.label}</span>
              </button>
            );
          })}
        </div>
      </footer>
    </div>
  );
};
