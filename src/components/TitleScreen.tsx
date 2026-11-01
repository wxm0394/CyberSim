import React, { useEffect, useRef } from 'react';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';

interface TitleScreenProps {
  hasSavedProgress: boolean;
  soundEnabled: boolean;
  onStartGame: () => void;
  onResetAndStart: () => void;
  onToggleSound: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  hasSavedProgress,
  soundEnabled,
  onStartGame,
  onResetAndStart,
  onToggleSound,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drops = Array.from({ length: 75 }, (_, i) => ({
      x: ((i * 37) % 100) / 100,
      y: ((i * 53) % 100) / 100,
      speed: 0.008 + (i % 5) * 0.0025,
      len: 16 + (i % 4) * 8,
      alpha: 0.12 + (i % 4) * 0.06,
    }));

    const render = () => {
      const w = (canvas.width = canvas.clientWidth || 1280);
      const h = (canvas.height = canvas.clientHeight || 720);

      // Deep rainy Greyhaven night sky gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#070A0D');
      bgGrad.addColorStop(0.55, '#0D1318');
      bgGrad.addColorStop(1, '#080B0E');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Distant Greyhaven skyline silhouettes
      const buildings = [
        { x: 0.04, w: 0.09, h: 0.52 },
        { x: 0.14, w: 0.07, h: 0.44 },
        { x: 0.22, w: 0.11, h: 0.64 }, // Vespera Tower
        { x: 0.35, w: 0.08, h: 0.48 },
        { x: 0.58, w: 0.1, h: 0.58 },
        { x: 0.7, w: 0.09, h: 0.46 },
        { x: 0.81, w: 0.12, h: 0.61 },
      ];

      buildings.forEach((b, idx) => {
        const bx = b.x * w;
        const bw = b.w * w;
        const bh = b.h * h;
        const by = h - bh;
        ctx.fillStyle = idx === 2 ? '#101820' : '#0B1015';
        ctx.fillRect(bx, by, bw, bh);

        // Subtle sodium/cyan window lights
        for (let wy = by + 18; wy < h - 40; wy += 22) {
          for (let wx = bx + 10; wx < bx + bw - 14; wx += 18) {
            if ((wx + wy + idx) % 5 === 0) {
              ctx.fillStyle =
                (wx + wy) % 3 === 0
                  ? 'rgba(79, 163, 184, 0.16)'
                  : 'rgba(216, 155, 60, 0.14)';
              ctx.fillRect(wx, wy, 6, 9);
            }
          }
        }
      });

      // Rain streaks
      ctx.lineWidth = 1;
      drops.forEach((d) => {
        d.y += d.speed;
        d.x -= d.speed * 0.12;
        if (d.y > 1) d.y = -0.05;
        if (d.x < 0) d.x = 1;

        const sx = d.x * w;
        const sy = d.y * h;
        ctx.strokeStyle = `rgba(148, 189, 206, ${d.alpha})`;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - 4, sy + d.len);
        ctx.stroke();
      });

      // Vignette
      const vig = ctx.createRadialGradient(
        w * 0.5,
        h * 0.45,
        w * 0.18,
        w * 0.5,
        h * 0.5,
        w * 0.7
      );
      vig.addColorStop(0, 'rgba(8, 11, 14, 0.1)');
      vig.addColorStop(1, 'rgba(5, 7, 9, 0.86)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);
    };

    render();
    const timerId = window.setInterval(render, 80);
    return () => window.clearInterval(timerId);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#080B0E] text-[#E3E7EB] select-none flex flex-col justify-between p-8 md:p-14">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* Top atmospheric cold open header */}
      <header className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-6 text-xs font-mono tracking-[0.22em] text-[#8E98A4] uppercase tabular-nums">
          <span className="text-[#4FA3B8]">GREYHAVEN / 2028</span>
          <span>02:17 AM / TUESDAY</span>
          <span className="hidden sm:inline">CHAPTER 01: THE GHOST IN THE MACHINE</span>
        </div>

        <button
          type="button"
          onClick={onToggleSound}
          className="flex items-center gap-2 px-3 py-1.5 rounded border border-white/15 bg-[#12171D]/80 hover:border-[#4FA3B8]/60 text-xs font-mono text-[#E3E7EB] transition"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-[#4FA3B8]" />
              <span>AUDIO: ON</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-[#8E98A4]" />
              <span>AUDIO: MUTED</span>
            </>
          )}
        </button>
      </header>

      {/* Center bespoke SVG Title Lockup & Primary CTA */}
      <main className="relative z-10 max-w-3xl my-auto">
        <div className="mb-3 text-xs font-mono uppercase tracking-[0.28em] text-[#D89B3C]">
          A NARRATIVE-DRIVEN PSYCHOLOGICAL THRILLER &amp; HACKER SIMULATION
        </div>

        <svg
          viewBox="0 0 780 128"
          className="w-full max-w-3xl h-auto mb-5"
          aria-label="DEAD AIR — 城市静默"
        >
          <defs>
            <linearGradient id="deadAirTitleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E3E7EB" />
              <stop offset="65%" stopColor="#B8C7D4" />
              <stop offset="100%" stopColor="#4FA3B8" />
            </linearGradient>
          </defs>
          <text
            x="0"
            y="78"
            fill="url(#deadAirTitleGrad)"
            fontFamily="Inter, system-ui, sans-serif"
            fontWeight="800"
            fontSize="82"
            letterSpacing="10"
          >
            DEAD AIR
          </text>
          <line
            x1="4"
            y1="94"
            x2="495"
            y2="94"
            stroke="#4FA3B8"
            strokeWidth="1.5"
            strokeOpacity="0.55"
          />
          <text
            x="4"
            y="120"
            fill="#8E98A4"
            fontFamily="JetBrains Mono, monospace"
            fontWeight="500"
            fontSize="18"
            letterSpacing="6"
          >
            城市静默 · CHAPTER I: THE GHOST IN THE MACHINE
          </text>
        </svg>

        <p className="text-base md:text-lg text-[#C2CAD3] leading-relaxed max-w-2xl mb-4 font-normal">
          Eight months after Vespera Data Solutions terminated you for reporting an
          illegal civic telemetry broker, your phone vibrates at{' '}
          <span className="text-[#E3E7EB] font-mono tabular-nums">02:17 AM</span>.
          Former colleague <span className="text-[#E3E7EB] font-medium">Nadia Park</span>{' '}
          leaves a cut-off voicemail—and a tampered log archive waiting on your desk.
        </p>

        <p className="text-sm text-[#8E98A4] leading-relaxed max-w-xl mb-8">
          你扮演前系统支持工程师 <span className="text-[#E3E7EB]">Eli Ward</span>。探索雨夜公寓与街头洗衣店、在本地 Linux 终端检验被篡改的审计日志、串联时间线证据，并揭开自己工号被盗用的真相。
        </p>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            data-start="true"
            onClick={onStartGame}
            className="px-7 py-3.5 rounded bg-[#4FA3B8] hover:bg-[#5eb3c8] text-[#080B0E] font-mono font-semibold text-sm tracking-[0.16em] uppercase transition shadow-lg shadow-[#4FA3B8]/15 cursor-pointer"
          >
            {hasSavedProgress ? 'CONTINUE CHAPTER 1 / 继续调查' : 'START GAME / 进入雨夜'}
          </button>

          {hasSavedProgress && (
            <button
              type="button"
              onClick={onResetAndStart}
              className="flex items-center gap-2 px-5 py-3.5 rounded border border-white/15 bg-[#12171D]/90 hover:border-[#C94B4B]/60 text-xs font-mono tracking-[0.14em] uppercase text-[#E3E7EB] transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#D89B3C]" />
              <span>NEW INVESTIGATION / 重新开始</span>
            </button>
          )}
        </div>
      </main>

      {/* Bottom flat control hint line */}
      <footer className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4 text-xs font-mono text-[#8E98A4]">
        <div>
          CONTROLS: CLICK SCENE HOTSPOTS TO INSPECT · [P] SMARTPHONE · [C] WORKSTATION OS · [J] FORENSIC TIMELINE · [ENTER] START
        </div>
        <div className="text-[#4FA3B8] tabular-nums">
          BUILD 2028.04 · GREYHAVEN NOIR ENGINE
        </div>
      </footer>
    </div>
  );
};
