import React from 'react';
import { EvidenceArtifact } from '../game/types';
import { CheckCircle2, Clock, Link2, Lock, FileText } from 'lucide-react';

interface ForensicTimelineViewProps {
  evidence: EvidenceArtifact[];
  timelineCorrelated: boolean;
  onCorrelateTimeline: () => void;
}

export const ForensicTimelineView: React.FC<ForensicTimelineViewProps> = ({
  evidence,
  timelineCorrelated,
  onCorrelateTimeline,
}) => {
  const sorted = [...evidence].sort(
    (a, b) => a.chronologicalOrder - b.chronologicalOrder
  );
  const discoveredCount = sorted.filter((e) => e.discovered).length;

  return (
    <div className="flex flex-col gap-5 text-[#E3E7EB]">
      {/* Header & Correlation Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-[#4FA3B8] mb-1">
            MISSING DATA RECONSTRUCTION · INCIDENT_0427 CHRONOLOGY
          </div>
          <h3 className="text-lg font-semibold text-[#E3E7EB]">
            Chronological Forensic Narrative / 缺失数据取证时间线
          </h3>
          <p className="text-xs text-[#8E98A4] mt-0.5">
            Correlate discovered logs, clock skew configs, and shadow escalation artifacts in strict chronological sequence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-[#8E98A4] tabular-nums">
            DISCOVERED: <span className="text-[#E3E7EB] font-semibold">{discoveredCount}</span> / {sorted.length}
          </div>
          <button
            type="button"
            data-testid="correlate-timeline-btn"
            onClick={onCorrelateTimeline}
            disabled={discoveredCount < 2}
            className={`flex items-center gap-2 px-4 py-2 rounded text-xs font-mono uppercase tracking-wider transition cursor-pointer ${
              timelineCorrelated
                ? 'bg-[#469A6C]/20 border border-[#469A6C]/60 text-[#469A6C]'
                : discoveredCount >= 2
                ? 'bg-[#4FA3B8] hover:bg-[#5eb3c8] text-[#080B0E] font-semibold'
                : 'bg-white/5 border border-white/10 text-[#8E98A4] opacity-50 cursor-not-allowed'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>
              {timelineCorrelated
                ? 'TIMELINE CORRELATED / 已完成取证串联'
                : 'CORRELATE EVIDENCE / 串联时间线'}
            </span>
          </button>
        </div>
      </div>

      {/* Cohesive Narrative Synthesis Banner when correlated */}
      {timelineCorrelated && (
        <div
          data-testid="forensic-narrative-synthesis"
          className="p-4 rounded border border-[#4FA3B8]/40 bg-[#4FA3B8]/10 text-xs leading-relaxed text-[#E3E7EB]"
        >
          <div className="font-mono uppercase tracking-wider text-[#4FA3B8] mb-1.5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#469A6C]" />
            <span>COHESIVE FORENSIC RECONSTRUCTION — THE 14-MINUTE BLACKOUT</span>
          </div>
          <p className="text-[#D2D8DF] mb-1">
            At <span className="font-mono text-[#E3E7EB]">01:41:58 AM</span>, an attacker injected a{' '}
            <span className="font-mono text-[#D89B3C]">-840s NTP clock offset</span> to mask real-time intrusion telemetry. Two seconds later (<span className="font-mono text-[#E3E7EB]">01:42:00 AM</span>), <span className="font-mono">access_0427.log</span> was truncated across a 14-minute blackout window while shadow maintenance token <span className="font-mono text-[#E3E7EB]">svc_lantern_sync</span> exfiltrated 14.2 GB of Greyhaven civic behavioral records.
          </p>
          <p className="text-[#8E98A4]">
            综合取证叙事：入侵者先通过 NTP 偏移掩盖真实时间戳，随后在 01:42 至 01:56 之间抹除了 14 分钟的核心网关日志，利用影子服务账户导出“灯塔计划”（Project LANTERN）市民行为预测数据，并最终冒用已离职员工 Eli Ward 的工号（e.ward_09）签署了掩盖授权。
          </p>
        </div>
      )}

      {/* Horizontal / Vertical Chronological Chain */}
      <div className="relative pl-6 border-l-2 border-[#4FA3B8]/30 space-y-4">
        {sorted.map((item, idx) => {
          const isDiscovered = item.discovered;
          const isLinked = item.correlated && isDiscovered;

          return (
            <div
              key={item.id}
              data-testid={`timeline-node-${item.id}`}
              className={`relative rounded border p-4 transition ${
                isDiscovered
                  ? isLinked
                    ? 'border-[#4FA3B8]/50 bg-[#12171D]'
                    : 'border-white/15 bg-[#12171D]/90'
                  : 'border-white/5 bg-[#0D1116]/60 opacity-60'
              }`}
            >
              {/* Timeline node dot */}
              <div
                className={`absolute -left-[31px] top-5 w-3.5 h-3.5 rounded-full border-2 ${
                  isDiscovered
                    ? isLinked
                      ? 'bg-[#469A6C] border-[#469A6C]'
                      : 'bg-[#4FA3B8] border-[#080B0E]'
                    : 'bg-[#12171D] border-white/20'
                }`}
              />

              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2.5 font-mono text-xs tabular-nums">
                  <span className="text-[#4FA3B8] font-semibold">
                    #{idx + 1} · {item.id}
                  </span>
                  <span className="text-[#8E98A4]">|</span>
                  <span className="flex items-center gap-1 text-[#D89B3C]">
                    <Clock className="w-3 h-3" />
                    {isDiscovered ? item.eventTimestamp : 'TIMESTAMP REDACTED'}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-[#8E98A4] flex items-center gap-1.5">
                  <FileText className="w-3 h-3 text-[#4FA3B8]" />
                  <span>{isDiscovered ? item.source : 'Undiscovered Source'}</span>
                </div>
              </div>

              {isDiscovered ? (
                <>
                  <h4 className="text-sm font-semibold text-[#E3E7EB] mb-1">
                    {item.title}{' '}
                    <span className="text-xs font-normal text-[#8E98A4] ml-1">
                      / {item.titleZh}
                    </span>
                  </h4>
                  <p className="text-xs text-[#C2CAD3] leading-relaxed mb-2">
                    {item.summary}
                  </p>
                  <div className="text-xs text-[#8E98A4] border-t border-white/10 pt-2 font-mono">
                    <span className="text-[#4FA3B8]">FORENSIC LINK: </span>
                    {item.forensicNarrative}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2 text-xs text-[#8E98A4] py-2 font-mono">
                  <Lock className="w-3.5 h-3.5 text-[#8E98A4]" />
                  <span>
                    EVIDENCE LOCKED — Inspect workstation files or meet your contact to uncover this chronological event.
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
