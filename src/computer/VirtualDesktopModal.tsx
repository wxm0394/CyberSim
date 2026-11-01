import React, { useState } from 'react';
import { ComputerAppId, DeadAirState } from '../game/types';
import { ForensicTimelineView } from '../components/ForensicTimelineView';
import {
  FolderOpen,
  Terminal as TerminalIcon,
  Mail,
  Clock,
  X,
  FileCode,
  Send,
  ShieldAlert,
} from 'lucide-react';

interface VirtualDesktopModalProps {
  state: DeadAirState;
  onSelectApp: (app: ComputerAppId) => void;
  onInspectFile: (filePath: string) => void;
  onExecuteCommand: (cmd: string) => void;
  onCorrelateTimeline: () => void;
  onClose: () => void;
}

export const VirtualDesktopModal: React.FC<VirtualDesktopModalProps> = ({
  state,
  onSelectApp,
  onInspectFile,
  onExecuteCommand,
  onCorrelateTimeline,
  onClose,
}) => {
  const [cmdInput, setCmdInput] = useState('');
  const unlockedFiles = state.files.filter((f) => f.unlocked);
  const [selectedFilePath, setSelectedFilePath] = useState<string>(
    unlockedFiles[0]?.path || '/home/eli/Downloads/incident_0427/ntp_override.conf'
  );
  const [selectedEmailId, setSelectedEmailId] = useState<string>(
    state.emails[0]?.id || 'mail_1'
  );

  const activeFile =
    unlockedFiles.find((f) => f.path === selectedFilePath) || unlockedFiles[0];
  const activeEmail =
    state.emails.find((e) => e.id === selectedEmailId) || state.emails[0];

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdInput.trim()) return;
    onExecuteCommand(cmdInput);
    setCmdInput('');
  };

  const quickCommands = [
    { label: 'ls', cmd: 'ls' },
    { label: 'cat ntp_override.conf', cmd: 'cat ntp_override.conf' },
    { label: 'cat access_0427.log', cmd: 'cat access_0427.log' },
    { label: 'cat auth_shadow.dump', cmd: 'cat auth_shadow.dump' },
    { label: 'cat lantern_schema_brief.txt', cmd: 'cat lantern_schema_brief.txt' },
    { label: 'verify (Correlate Timeline)', cmd: 'verify' },
    ...(state.currentScene === 'APARTMENT_RETURN' ||
    state.files.some(
      (f) => f.path.includes('lantern_auth_audit.db') && f.unlocked
    )
      ? [
          {
            label: 'cat lantern_auth_audit.db (MOTH Vault)',
            cmd: 'cat /home/eli/archive_vault/lantern_auth_audit.db',
          },
        ]
      : []),
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

          {/* 4 Desktop Application Switcher Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="desktop-app-FILES"
              onClick={() => onSelectApp('FILES')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition cursor-pointer ${
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition cursor-pointer ${
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
              data-testid="desktop-app-TIMELINE"
              onClick={() => onSelectApp('TIMELINE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition cursor-pointer ${
                state.activeComputerApp === 'TIMELINE'
                  ? 'bg-[#4FA3B8] text-[#080B0E] font-semibold'
                  : 'bg-[#080B0E] text-[#8E98A4] hover:text-[#E3E7EB]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Timeline Correlation ({state.flags.evidence_count}/6)</span>
            </button>

            <button
              type="button"
              data-testid="desktop-app-MAIL"
              onClick={() => onSelectApp('MAIL')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition cursor-pointer ${
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
              data-testid="close-desktop-btn"
              onClick={onClose}
              className="ml-2 px-2.5 py-1.5 rounded border border-white/15 hover:border-[#C94B4B] text-xs font-mono text-[#8E98A4] hover:text-[#E3E7EB] flex items-center gap-1 transition cursor-pointer"
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
                {unlockedFiles.map((file) => {
                  const isSelected = activeFile?.path === file.path;
                  const isMothVault = file.path.includes('lantern_auth_audit.db');
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
                          : isMothVault
                          ? 'border-[#C94B4B]/60 bg-[#C94B4B]/10 text-[#E3E7EB]'
                          : 'border-white/10 bg-[#12171D] hover:border-[#4FA3B8]/50 text-[#C2CAD3]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <FileCode
                          className={`w-4 h-4 mt-0.5 shrink-0 ${
                            isMothVault ? 'text-[#C94B4B]' : 'text-[#4FA3B8]'
                          }`}
                        />
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
                        {file.unlocksEvidenceId && (
                          <div className="text-[#469A6C]">
                            {file.unlocksEvidenceId}
                          </div>
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
                          MODIFIED: {activeFile.modifiedAt} · SIZE: {activeFile.size}
                        </div>
                      </div>
                      <button
                        type="button"
                        data-testid="analyze-selected-file-btn"
                        onClick={() => onInspectFile(activeFile.path)}
                        className="px-3.5 py-1.5 rounded bg-[#4FA3B8] hover:bg-[#5eb3c8] text-[#080B0E] font-mono font-semibold text-xs uppercase cursor-pointer"
                      >
                        LOG FORENSIC ARTIFACT
                      </button>
                    </div>
                    <pre className="p-4 rounded border border-white/10 bg-[#0D131A] text-xs font-mono text-[#E3E7EB] whitespace-pre-wrap leading-relaxed">
                      {activeFile.content}
                    </pre>
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
                  placeholder="Type ls, cat ntp_override.conf, cat access_0427.log, verify, or help..."
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

          {/* APP 3: VISUAL FORENSIC TIMELINE */}
          {state.activeComputerApp === 'TIMELINE' && (
            <div className="flex-1 p-6 overflow-y-auto bg-[#080B0E]">
              <ForensicTimelineView
                evidence={state.evidence}
                timelineCorrelated={state.flags.timeline_correlated}
                onCorrelateTimeline={onCorrelateTimeline}
              />
            </div>
          )}

          {/* APP 4: LOCAL MAIL CLIENT */}
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
        </div>

        {/* Bottom Status Bar */}
        <div className="px-5 py-2.5 bg-[#12171D] border-t border-white/10 flex flex-wrap items-center justify-between text-xs font-mono text-[#8E98A4] tabular-nums">
          <div className="flex items-center gap-4">
            <span>WORKING DIR: {state.currentDir}</span>
            <span>EVIDENCE LOGGED: {state.flags.evidence_count}/6</span>
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
