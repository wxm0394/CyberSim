import React, { useState } from 'react';
import { ComputerAppId, DeadAirState, VirtualHost } from '../game/types';
import {
  canAccessVirtualFile,
  hasMothArchiveKey,
} from '../game/storyEngine';
import { KnowledgeCategoryId } from '../learning/lessonTypes';
import { ALL_LEARNING_LESSONS } from '../data/learningMissions';
import { KnowledgeCodex } from '../ui/KnowledgeCodex';
import { ForensicTimelineView } from '../components/ForensicTimelineView';
import {
  FolderOpen,
  Terminal as TerminalIcon,
  Network,
  Mail,
  Clock,
  BookOpen,
  X,
  FileCode,
  Send,
  ShieldAlert,
  Lock,
  CheckCircle2,
  Server,
  KeyRound,
  Activity,
  FileText,
} from 'lucide-react';

interface VirtualDesktopModalProps {
  state: DeadAirState;
  onSelectApp: (app: ComputerAppId) => void;
  onSelectNetworkHost: (ip: string) => void;
  onInspectFile: (filePath: string) => void;
  onExecuteCommand: (cmd: string) => void;
  onCorrelateTimeline: () => void;
  onSelectLearningCategory: (category: KnowledgeCategoryId | 'all') => void;
  onSelectLearningLesson: (lessonId: string) => void;
  onOpenNetworkLab: (lessonId: string) => void;
  onCloseNetworkLab: () => void;
  onExecuteLabDiagnostic: (lessonId: string, diagnosticId: string) => void;
  onSubmitLabResolution: (lessonId: string, resolutionId: string) => void;
  onApplyLessonToStory: (
    lessonId: string,
    mode: 'analytical' | 'brute_force'
  ) => void;
  onClose: () => void;
}

export const VirtualDesktopModal: React.FC<VirtualDesktopModalProps> = ({
  state,
  onSelectApp,
  onSelectNetworkHost,
  onInspectFile,
  onExecuteCommand,
  onCorrelateTimeline,
  onSelectLearningCategory,
  onSelectLearningLesson,
  onOpenNetworkLab,
  onCloseNetworkLab,
  onExecuteLabDiagnostic,
  onSubmitLabResolution,
  onApplyLessonToStory,
  onClose,
}) => {
  const [cmdInput, setCmdInput] = useState('');
  const [selectedFilePath, setSelectedFilePath] = useState<string>(
    state.files[0]?.path ||
      '/home/eli/Downloads/incident_0427/ntp_override.conf'
  );
  const [selectedEmailId, setSelectedEmailId] = useState<string>(
    state.emails[0]?.id || 'mail_1'
  );

  const activeFile =
    state.files.find((f) => f.path === selectedFilePath) || state.files[0];
  const activeFileAccess = activeFile
    ? canAccessVirtualFile(state, activeFile)
    : { allowed: false, error: 'File not found' };
  const activeEmail =
    state.emails.find((e) => e.id === selectedEmailId) || state.emails[0];

  const activeHost: VirtualHost =
    state.networkHosts.find((h) => h.ip === state.selectedNetworkHostIp) ||
    state.networkHosts[0];

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdInput.trim()) return;
    onExecuteCommand(cmdInput);
    setCmdInput('');
  };

  const quickCommands = [
    { label: 'ls', cmd: 'ls' },
    { label: 'netmap (Network Hosts)', cmd: 'netmap' },
    { label: 'manual (Field Manual CLI)', cmd: 'manual' },
    { label: 'cat ntp_override.conf', cmd: 'cat ntp_override.conf' },
    { label: 'cat access_0427.log', cmd: 'cat access_0427.log' },
    { label: 'cat auth_shadow.dump', cmd: 'cat auth_shadow.dump' },
    {
      label: 'cat lantern_schema_brief.txt',
      cmd: 'cat lantern_schema_brief.txt',
    },
    { label: 'verify (Correlate Timeline)', cmd: 'verify' },
    {
      label: 'probe 10.88.14.9 (Enclave Probe)',
      cmd: 'probe 10.88.14.9',
    },
    {
      label: 'cat lantern_auth_audit.db (MOTH Vault)',
      cmd: 'cat /home/eli/archive_vault/lantern_auth_audit.db',
    },
  ];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 md:p-6">
      <div
        data-testid="virtual-desktop-modal"
        className="relative w-full max-w-6xl h-[88vh] rounded-lg border border-[#4FA3B8]/40 bg-[#090D12] text-[#E3E7EB] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Top GreyOS Window Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-[#12171D] border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#4FA3B8]" />
            <span className="font-mono text-xs tracking-[0.18em] text-[#E3E7EB] uppercase">
              GreyOS 6.4 LTS · ELI WARD WORKSTATION (eli@apt4b-node)
            </span>
          </div>

          {/* 5 Desktop Application Switcher Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="desktop-app-FILES"
              onClick={() => onSelectApp('FILES')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition cursor-pointer whitespace-nowrap shrink-0 ${
                state.activeComputerApp === 'FILES'
                  ? 'bg-[#4FA3B8] text-[#080B0E] font-semibold'
                  : 'bg-[#080B0E] text-[#8E98A4] hover:text-[#E3E7EB]'
              }`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>File Manager</span>
            </button>

            <button
              type="button"
              data-testid="desktop-app-TERMINAL"
              onClick={() => onSelectApp('TERMINAL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition cursor-pointer whitespace-nowrap shrink-0 ${
                state.activeComputerApp === 'TERMINAL'
                  ? 'bg-[#4FA3B8] text-[#080B0E] font-semibold'
                  : 'bg-[#080B0E] text-[#8E98A4] hover:text-[#E3E7EB]'
              }`}
            >
              <TerminalIcon className="w-3.5 h-3.5" />
              <span>Forensic Terminal</span>
            </button>

            <button
              type="button"
              data-testid="desktop-app-NETWORK"
              onClick={() => onSelectApp('NETWORK')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition cursor-pointer whitespace-nowrap shrink-0 ${
                state.activeComputerApp === 'NETWORK'
                  ? 'bg-[#4FA3B8] text-[#080B0E] font-semibold'
                  : 'bg-[#080B0E] text-[#8E98A4] hover:text-[#E3E7EB]'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>
                Network &amp; Host Ops ({state.flags.compromised_hosts_count}/3)
              </span>
            </button>

            <button
              type="button"
              data-testid="desktop-app-TIMELINE"
              onClick={() => onSelectApp('TIMELINE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition cursor-pointer whitespace-nowrap shrink-0 ${
                state.activeComputerApp === 'TIMELINE'
                  ? 'bg-[#4FA3B8] text-[#080B0E] font-semibold'
                  : 'bg-[#080B0E] text-[#8E98A4] hover:text-[#E3E7EB]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                Timeline Correlation ({state.flags.evidence_count}/6)
              </span>
            </button>

            <button
              type="button"
              data-testid="desktop-app-MAIL"
              onClick={() => onSelectApp('MAIL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition cursor-pointer whitespace-nowrap shrink-0 ${
                state.activeComputerApp === 'MAIL'
                  ? 'bg-[#4FA3B8] text-[#080B0E] font-semibold'
                  : 'bg-[#080B0E] text-[#8E98A4] hover:text-[#E3E7EB]'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Mail Client</span>
            </button>

            <button
              type="button"
              data-testid="desktop-app-MANUAL"
              onClick={() => onSelectApp('MANUAL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition cursor-pointer whitespace-nowrap shrink-0 ${
                state.activeComputerApp === 'MANUAL'
                  ? 'bg-[#4FA3B8] text-[#080B0E] font-semibold'
                  : 'bg-[#080B0E] text-[#8E98A4] hover:text-[#E3E7EB]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>
                Field Manual &amp; NetLab (
                {state.learning.completedLessonIds.length}/
                {ALL_LEARNING_LESSONS.length})
              </span>
            </button>

            <button
              type="button"
              data-testid="close-desktop-btn"
              onClick={onClose}
              className="ml-1 px-2.5 py-1.5 rounded border border-white/15 hover:border-[#C94B4B] text-xs font-mono text-[#8E98A4] hover:text-[#E3E7EB] flex items-center gap-1 transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>STEP BACK FROM DESK</span>
            </button>
          </div>
        </div>

        {/* Main Workspace Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* APP 1: FILE MANAGER */}
          {state.activeComputerApp === 'FILES' && (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
              <div className="md:col-span-5 border-r border-white/10 bg-[#0C1117] p-4 overflow-y-auto space-y-2">
                <div className="text-xs font-mono uppercase tracking-wider text-[#4FA3B8] mb-2">
                  LOCAL FILESYSTEM · 点击文件立即执行取证分析
                </div>
                {state.files.map((file) => {
                  const isSelected = activeFile?.path === file.path;
                  const access = canAccessVirtualFile(state, file);
                  const isMothVault = file.path.includes(
                    'lantern_auth_audit.db'
                  );
                  const isDiscovered =
                    (file.unlocksEvidenceId &&
                      state.evidence.find(
                        (e) => e.id === file.unlocksEvidenceId
                      )?.discovered) ||
                    state.inspectedFiles.includes(file.path);

                  return (
                    <button
                      key={file.path}
                      type="button"
                      data-testid={`file-item-${file.name}`}
                      onClick={() => {
                        setSelectedFilePath(file.path);
                        onInspectFile(file.path);
                      }}
                      className={`w-full text-left p-3 rounded border transition flex items-start justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-[#4FA3B8] bg-[#4FA3B8]/15 text-[#E3E7EB]'
                          : !access.allowed
                          ? 'border-white/5 bg-[#080B0E]/60 text-[#8E98A4]'
                          : isMothVault
                          ? 'border-[#C94B4B]/60 bg-[#C94B4B]/10 text-[#E3E7EB]'
                          : 'border-white/10 bg-[#12171D] hover:border-[#4FA3B8]/50 text-[#C2CAD3]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        {!access.allowed ? (
                          <Lock className="w-4 h-4 mt-0.5 shrink-0 text-[#D89B3C]" />
                        ) : (
                          <FileCode
                            className={`w-4 h-4 mt-0.5 shrink-0 ${
                              isMothVault
                                ? 'text-[#C94B4B]'
                                : isDiscovered
                                ? 'text-[#469A6C]'
                                : 'text-[#4FA3B8]'
                            }`}
                          />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-mono font-semibold truncate">
                            {file.name}
                          </div>
                          <div className="text-[11px] font-mono text-[#8E98A4] truncate">
                            {file.parentDir}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-mono text-[11px] text-[#8E98A4] shrink-0 tabular-nums">
                        <div>{file.size}</div>
                        {!access.allowed ? (
                          <div className="text-[#D89B3C]">LOCKED</div>
                        ) : isDiscovered ? (
                          <div className="text-[#469A6C] flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{file.unlocksEvidenceId || 'VERIFIED'}</span>
                          </div>
                        ) : (
                          <div className="text-[#4FA3B8]">UNINSPECTED</div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="md:col-span-7 p-5 overflow-y-auto bg-[#080B0E] flex flex-col justify-between">
                {activeFile ? (
                  <div>
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                      <div>
                        <div className="text-xs font-mono text-[#4FA3B8]">
                          {activeFile.path}
                        </div>
                        <div className="text-xs font-mono text-[#8E98A4] mt-0.5 tabular-nums">
                          MODIFIED: {activeFile.modifiedAt} · SIZE:{' '}
                          {activeFile.size}
                        </div>
                      </div>
                      <button
                        type="button"
                        data-testid="analyze-selected-file-btn"
                        onClick={() => onInspectFile(activeFile.path)}
                        className="px-3.5 py-1.5 rounded bg-[#4FA3B8] hover:bg-[#5eb3c8] text-[#080B0E] font-mono font-semibold text-xs uppercase cursor-pointer"
                      >
                        {activeFileAccess.allowed
                          ? 'LOG FORENSIC ARTIFACT'
                          : 'VERIFY ACCESS PERMISSIONS'}
                      </button>
                    </div>

                    {activeFileAccess.allowed ? (
                      <pre className="p-4 rounded border border-white/10 bg-[#0D131A] text-xs font-mono text-[#E3E7EB] whitespace-pre-wrap leading-relaxed">
                        {activeFile.content}
                      </pre>
                    ) : (
                      <div className="p-5 rounded border border-[#C94B4B]/50 bg-[#C94B4B]/10 text-xs font-mono text-[#E3E7EB] space-y-2">
                        <div className="text-[#C94B4B] font-semibold uppercase flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          <span>ENCRYPTED VOLUME / ACCESS RESTRICTED</span>
                        </div>
                        <p className="text-[#C2CAD3]">
                          {activeFileAccess.error}
                        </p>
                        <p className="text-[#8E98A4]">
                          访问受限：必须先在 24 小时自助洗衣房与 Nadia Park 完成交谈并获取归档解密密钥（moth_archive.key），随后在深夜归来场景（03:12 AM）解锁此数据库。
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {/* APP 2: LINUX FORENSIC TERMINAL */}
          {state.activeComputerApp === 'TERMINAL' && (
            <div className="flex-1 flex flex-col overflow-hidden bg-[#06090D]">
              {/* Quick Forensic Command Strip */}
              <div className="px-4 py-2.5 bg-[#0E141B] border-b border-white/10 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono text-[#8E98A4] mr-1">
                  QUICK SHELL:
                </span>
                {quickCommands.map((qc) => (
                  <button
                    key={qc.cmd}
                    type="button"
                    data-testid={`quick-cmd-${qc.label.split(' ')[0]}`}
                    onClick={() => onExecuteCommand(qc.cmd)}
                    className="px-2.5 py-1 rounded border border-[#4FA3B8]/40 bg-[#12171D] hover:bg-[#4FA3B8]/20 text-[11px] font-mono text-[#E3E7EB] transition cursor-pointer"
                  >
                    {qc.label}
                  </button>
                ))}
              </div>

              {/* Terminal Scrollback */}
              <div
                data-testid="terminal-output-area"
                className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-2"
              >
                {state.terminalHistory.map((line) => (
                  <div
                    key={line.id}
                    className={`whitespace-pre-wrap leading-relaxed ${
                      line.tone === 'command'
                        ? 'text-[#4FA3B8] font-semibold'
                        : line.tone === 'highlight'
                        ? 'text-[#469A6C]'
                        : line.tone === 'error'
                        ? 'text-[#C94B4B]'
                        : line.tone === 'system'
                        ? 'text-[#D89B3C]'
                        : 'text-[#D0D7DE]'
                    }`}
                  >
                    {line.text}
                  </div>
                ))}
              </div>

              {/* Command Input Form */}
              <form
                onSubmit={handleTerminalSubmit}
                className="flex items-center gap-2 px-4 py-3 bg-[#10161E] border-t border-white/10"
              >
                <span className="font-mono text-xs text-[#4FA3B8] shrink-0">
                  eli@greyos:{state.currentDir}$
                </span>
                <input
                  type="text"
                  data-testid="terminal-input"
                  value={cmdInput}
                  onChange={(e) => setCmdInput(e.target.value)}
                  placeholder="Type netmap, nmap <ip>, exploit <ip>, logs <ip>, pivot, scrub, dump, cat <file>, verify, or help..."
                  className="flex-1 bg-transparent text-xs font-mono text-[#E3E7EB] focus:outline-none"
                />
                <button
                  type="submit"
                  data-testid="terminal-submit-btn"
                  className="px-3 py-1 rounded bg-[#4FA3B8] text-[#080B0E] font-mono font-semibold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                  <span>RUN</span>
                </button>
              </form>
            </div>
          )}

          {/* APP 3: VIRTUAL NETWORK & HOST INTRUSION OPS (V0.3) */}
          {state.activeComputerApp === 'NETWORK' && (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
              {/* Left Column: Discovered Subnet Topology & Host Nodes */}
              <div className="md:col-span-5 border-r border-white/10 bg-[#0C1117] p-4 overflow-y-auto space-y-2.5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-mono uppercase tracking-wider text-[#4FA3B8]">
                    GREYHAVEN VIRTUAL SUBNET TOPOLOGY · 虚拟网络节点
                  </div>
                  <button
                    type="button"
                    data-testid="network-refresh-netmap-btn"
                    onClick={() => onExecuteCommand('netmap')}
                    className="px-2 py-1 rounded border border-[#4FA3B8]/40 bg-[#12171D] hover:bg-[#4FA3B8]/20 text-[10px] font-mono text-[#E3E7EB] cursor-pointer"
                  >
                    RUN NETMAP
                  </button>
                </div>

                {/* Tactical Counter-Surveillance Status Banner */}
                <div className="p-3 rounded border border-white/10 bg-[#080B0E] text-[11px] font-mono space-y-1 tabular-nums">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E98A4]">PROXY TUNNEL (172.16.40.12)</span>
                    <span
                      className={
                        state.flags.relay_tunnel_active
                          ? 'text-[#469A6C]'
                          : 'text-[#D89B3C]'
                      }
                    >
                      {state.flags.relay_tunnel_active
                        ? 'MASKED (-10% EXP)'
                        : 'UNMASKED FIBER'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E98A4]">CAMERA #04 NVRAM (10.40.4.18)</span>
                    <span
                      className={
                        state.flags.camera_scrubbed
                          ? 'text-[#469A6C]'
                          : 'text-[#D89B3C]'
                      }
                    >
                      {state.flags.camera_scrubbed
                        ? 'SCRUBBED (SAFE)'
                        : 'WATCHLIST ACTIVE'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#8E98A4]">KEYRING FORGERY (10.88.4.22)</span>
                    <span
                      className={
                        state.flags.counter_proof_secured
                          ? 'text-[#469A6C]'
                          : 'text-[#8E98A4]'
                      }
                    >
                      {state.flags.counter_proof_secured
                        ? 'M_HALE_SEC_01 LOGGED'
                        : 'UNDISCOVERED'}
                    </span>
                  </div>
                </div>

                {state.networkHosts.map((host) => {
                  const isSelected = activeHost.ip === host.ip;
                  const isEnclave = host.ip === '10.88.14.9';

                  return (
                    <button
                      key={host.ip}
                      type="button"
                      data-testid={`network-host-${host.ip}`}
                      onClick={() => onSelectNetworkHost(host.ip)}
                      className={`w-full text-left p-3 rounded border transition cursor-pointer ${
                        isSelected
                          ? 'border-[#4FA3B8] bg-[#4FA3B8]/15 text-[#E3E7EB]'
                          : isEnclave
                          ? 'border-[#C94B4B]/40 bg-[#C94B4B]/5 hover:border-[#C94B4B] text-[#E3E7EB]'
                          : 'border-white/10 bg-[#12171D] hover:border-[#4FA3B8]/50 text-[#C2CAD3]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <Server
                            className={`w-4 h-4 mt-0.5 shrink-0 ${
                              isEnclave
                                ? 'text-[#C94B4B]'
                                : host.compromised
                                ? 'text-[#469A6C]'
                                : 'text-[#4FA3B8]'
                            }`}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-mono font-semibold truncate">
                              {host.ip} · {host.hostname}
                            </div>
                            <div className="text-[11px] text-[#8E98A4] truncate">
                              {host.role} / {host.roleZh}
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-mono text-[10px] shrink-0 tabular-nums">
                          <div
                            className={
                              host.compromised
                                ? 'text-[#469A6C]'
                                : isEnclave
                                ? 'text-[#C94B4B]'
                                : 'text-[#D89B3C]'
                            }
                          >
                            {host.privilege}
                          </div>
                          <div className="text-[#8E98A4]">
                            {host.actionCompleted
                              ? 'OP DONE'
                              : host.scanned
                              ? 'SCANNED'
                              : 'UNSCANNED'}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right Column: Selected Host Services, Intrusion Tools & Remote Logs */}
              <div className="md:col-span-7 p-5 overflow-y-auto bg-[#080B0E] space-y-5">
                {/* Host Header */}
                <div className="border-b border-white/10 pb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-mono text-[#4FA3B8]">
                      TARGET NODE: {activeHost.ip} ({activeHost.hostname})
                    </div>
                    <h3 className="text-base font-semibold text-[#E3E7EB] mt-0.5">
                      {activeHost.role}{' '}
                      <span className="text-xs font-normal text-[#8E98A4]">
                        / {activeHost.roleZh}
                      </span>
                    </h3>
                    <div className="text-[11px] font-mono text-[#8E98A4] mt-0.5">
                      SUBNET: {activeHost.subnet} · PRIVILEGE:{' '}
                      <span
                        className={
                          activeHost.compromised
                            ? 'text-[#469A6C]'
                            : 'text-[#D89B3C]'
                        }
                      >
                        {activeHost.privilege}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tactical Intrusion Action Buttons */}
                <div className="space-y-2">
                  <div className="text-xs font-mono uppercase tracking-wider text-[#8E98A4] flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#4FA3B8]" />
                    <span>HOST INTRUSION &amp; COUNTER-SURVEILLANCE TOOLS:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      data-testid={`host-scan-btn-${activeHost.ip}`}
                      onClick={() => onExecuteCommand(`nmap ${activeHost.ip}`)}
                      className="px-3 py-1.5 rounded border border-[#4FA3B8]/50 bg-[#12171D] hover:bg-[#4FA3B8]/20 text-xs font-mono text-[#E3E7EB] cursor-pointer transition"
                    >
                      1. Scan Ports (nmap {activeHost.ip})
                    </button>

                    {activeHost.ip !== '10.0.2.15' &&
                      activeHost.ip !== '10.88.14.9' && (
                        <button
                          type="button"
                          data-testid={`host-exploit-btn-${activeHost.ip}`}
                          onClick={() =>
                            onExecuteCommand(`exploit ${activeHost.ip}`)
                          }
                          className="px-3 py-1.5 rounded border border-[#D89B3C]/60 bg-[#12171D] hover:bg-[#D89B3C]/20 text-xs font-mono text-[#E3E7EB] cursor-pointer transition"
                        >
                          2. Escalate Privilege (exploit {activeHost.ip})
                        </button>
                      )}

                    <button
                      type="button"
                      data-testid={`host-logs-btn-${activeHost.ip}`}
                      onClick={() => onExecuteCommand(`logs ${activeHost.ip}`)}
                      className="px-3 py-1.5 rounded border border-white/15 bg-[#12171D] hover:border-[#4FA3B8] text-xs font-mono text-[#E3E7EB] cursor-pointer transition"
                    >
                      3. Read Syslog (logs {activeHost.ip})
                    </button>

                    <button
                      type="button"
                      data-testid={`host-action-btn-${activeHost.ip}`}
                      onClick={() => onExecuteCommand(activeHost.actionCommand)}
                      className={`px-3.5 py-1.5 rounded font-mono font-semibold text-xs cursor-pointer transition ${
                        activeHost.ip === '10.88.14.9'
                          ? 'bg-[#C94B4B] hover:bg-[#d85c5c] text-[#E3E7EB]'
                          : activeHost.actionCompleted
                          ? 'border border-[#469A6C] bg-[#469A6C]/20 text-[#469A6C]'
                          : 'bg-[#4FA3B8] hover:bg-[#5eb3c8] text-[#080B0E]'
                      }`}
                    >
                      {activeHost.actionCompleted
                        ? `✓ ${activeHost.actionLabel}`
                        : `4. ${activeHost.actionLabel}`}
                    </button>
                  </div>
                </div>

                {/* Live Shell Telemetry Readout for Network Actions */}
                {state.terminalHistory.length > 0 && (
                  <div
                    data-testid="network-shell-readout"
                    className="p-3 rounded border border-[#4FA3B8]/30 bg-[#05080B] text-xs font-mono space-y-1"
                  >
                    <div className="text-[10px] uppercase tracking-wider text-[#4FA3B8]">
                      LATEST SHELL TELEMETRY · 终端实时回显
                    </div>
                    <pre
                      className={`whitespace-pre-wrap leading-relaxed text-[11px] max-h-32 overflow-y-auto ${
                        state.terminalHistory[state.terminalHistory.length - 1]
                          .tone === 'error'
                          ? 'text-[#C94B4B]'
                          : state.terminalHistory[
                              state.terminalHistory.length - 1
                            ].tone === 'highlight'
                          ? 'text-[#469A6C]'
                          : 'text-[#C2CAD3]'
                      }`}
                    >
                      {
                        state.terminalHistory[state.terminalHistory.length - 1]
                          .text
                      }
                    </pre>
                  </div>
                )}

                {/* Auth / Exploit Vector Hint Box */}
                <div className="p-3.5 rounded border border-white/10 bg-[#0D131A] text-xs font-mono space-y-1">
                  <div className="text-[#4FA3B8]">
                    AUTHENTICATION &amp; EXPLOIT VECTOR:
                  </div>
                  <div className="text-[#C2CAD3] leading-relaxed">
                    {activeHost.requiredCredentialHint}
                  </div>
                  <div className="text-[#8E98A4] leading-relaxed">
                    {activeHost.requiredCredentialHintZh}
                  </div>
                </div>

                {/* Services & Ports Table */}
                <div className="space-y-2">
                  <div className="text-xs font-mono uppercase tracking-wider text-[#8E98A4] flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#4FA3B8]" />
                    <span>FINGERPRINTED SERVICES &amp; PORTS:</span>
                  </div>
                  <div className="rounded border border-white/10 bg-[#0C1117] overflow-hidden">
                    <table className="w-full text-left font-mono text-xs tabular-nums">
                      <thead className="bg-[#12171D] text-[#8E98A4] border-b border-white/10">
                        <tr>
                          <th className="py-2 px-3">PORT</th>
                          <th className="py-2 px-3">STATE</th>
                          <th className="py-2 px-3">SERVICE</th>
                          <th className="py-2 px-3">BANNER / VECTOR</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {activeHost.services.map((svc) => (
                          <tr key={svc.port}>
                            <td className="py-2 px-3 text-[#4FA3B8]">
                              {svc.port}/{svc.protocol}
                            </td>
                            <td
                              className={`py-2 px-3 ${
                                svc.state === 'canary'
                                  ? 'text-[#C94B4B]'
                                  : svc.state === 'open'
                                  ? 'text-[#469A6C]'
                                  : 'text-[#D89B3C]'
                              }`}
                            >
                              {svc.state.toUpperCase()}
                            </td>
                            <td className="py-2 px-3 text-[#E3E7EB]">
                              {svc.service}
                            </td>
                            <td className="py-2 px-3 text-[#8E98A4]">
                              <div>{svc.version}</div>
                              {svc.vulnerabilityNote && (
                                <div className="text-[#D89B3C] text-[11px] mt-0.5">
                                  {svc.vulnerabilityNote}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Remote Host Syslog Viewer */}
                <div className="space-y-2">
                  <div className="text-xs font-mono uppercase tracking-wider text-[#8E98A4] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#4FA3B8]" />
                    <span>REMOTE /VAR/LOG TELEMETRY:</span>
                  </div>
                  {activeHost.compromised ? (
                    <div
                      data-testid={`host-logs-panel-${activeHost.ip}`}
                      className="p-3.5 rounded border border-[#469A6C]/40 bg-[#0D131A] font-mono text-xs space-y-2.5"
                    >
                      {activeHost.logs.map((log) => (
                        <div
                          key={log.id}
                          className="border-b border-white/5 pb-2 last:border-0 last:pb-0"
                        >
                          <div className="text-[#4FA3B8] tabular-nums">
                            [{log.timestamp}] ({log.source})
                          </div>
                          <div className="text-[#E3E7EB] mt-0.5">
                            {log.entry}
                          </div>
                          <div className="text-[#8E98A4] text-[11px] mt-0.5">
                            {log.entryZh}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded border border-white/10 bg-[#0C1117] font-mono text-xs text-[#8E98A4] flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#D89B3C] shrink-0" />
                      <span>
                        Remote `/var/log` stream locked (Current Privilege:{' '}
                        {activeHost.privilege}). Scan and escalate privilege to
                        inspect host telemetry.
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* APP 4: VISUAL FORENSIC TIMELINE */}
          {state.activeComputerApp === 'TIMELINE' && (
            <div className="flex-1 p-6 overflow-y-auto bg-[#080B0E]">
              <ForensicTimelineView
                evidence={state.evidence}
                timelineCorrelated={state.flags.timeline_correlated}
                onCorrelateTimeline={onCorrelateTimeline}
              />
            </div>
          )}

          {/* APP 5: LOCAL MAIL CLIENT */}
          {state.activeComputerApp === 'MAIL' && (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
              <div className="md:col-span-5 border-r border-white/10 bg-[#0C1117] p-4 overflow-y-auto space-y-2">
                {state.emails.map((email) => (
                  <button
                    key={email.id}
                    type="button"
                    onClick={() => setSelectedEmailId(email.id)}
                    className={`w-full text-left p-3 rounded border transition cursor-pointer ${
                      activeEmail?.id === email.id
                        ? 'border-[#4FA3B8] bg-[#4FA3B8]/15'
                        : 'border-white/10 bg-[#12171D]'
                    }`}
                  >
                    <div className="text-xs font-semibold text-[#E3E7EB] truncate">
                      {email.subject}
                    </div>
                    <div className="text-[11px] font-mono text-[#8E98A4] mt-0.5">
                      {email.sender} · {email.timestamp}
                    </div>
                  </button>
                ))}
              </div>
              <div className="md:col-span-7 p-6 overflow-y-auto bg-[#080B0E]">
                {activeEmail && (
                  <div className="space-y-4">
                    <div className="border-b border-white/10 pb-3">
                      <h3 className="text-base font-semibold text-[#E3E7EB]">
                        {activeEmail.subject}
                      </h3>
                      <div className="text-xs text-[#8E98A4]">
                        {activeEmail.subjectZh}
                      </div>
                      <div className="text-xs font-mono text-[#4FA3B8] mt-1">
                        FROM: {activeEmail.sender} ({activeEmail.timestamp})
                      </div>
                    </div>
                    <pre className="text-xs font-mono text-[#D2D8DF] whitespace-pre-wrap leading-relaxed">
                      {activeEmail.body}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* APP 6: ELI WARD'S FIELD MANUAL & NETLAB (fq-book Curriculum) */}
          {state.activeComputerApp === 'MANUAL' && (
            <div className="flex-1 overflow-hidden">
              <KnowledgeCodex
                state={state}
                onSelectCategory={onSelectLearningCategory}
                onSelectLesson={onSelectLearningLesson}
                onOpenLab={onOpenNetworkLab}
                onCloseLab={onCloseNetworkLab}
                onExecuteDiagnostic={onExecuteLabDiagnostic}
                onSubmitResolution={onSubmitLabResolution}
                onApplyToStory={onApplyLessonToStory}
              />
            </div>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="px-5 py-2.5 bg-[#12171D] border-t border-white/10 flex flex-wrap items-center justify-between text-xs font-mono text-[#8E98A4] tabular-nums">
          <div className="flex items-center gap-4">
            <span>WORKING DIR: {state.currentDir}</span>
            <span>EVIDENCE: {state.flags.evidence_count}/6</span>
            <span>
              HOSTS: {state.flags.compromised_hosts_count}/3
            </span>
            <span>
              ARCHIVE KEY:{' '}
              {hasMothArchiveKey(state) ? 'MOUNTED' : 'MISSING'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[#D89B3C]">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>
              VESPERA SUSPICION: {state.flags.corporate_suspicion}% · EXPOSURE:{' '}
              {state.flags.player_exposure}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
