"use client";

import { useEffect, useRef } from "react";

interface ConfettiProps {
  enabled: boolean;
}

interface Piece {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  rot: number;
  vr: number;
  phase: number;
  spin: number;
  color: string;
}

const COLORS = [
  "#38bdf8",
  "#818cf8",
  "#a78bfa",
  "#f472b6",
  "#facc15",
  "#fbbf24",
  "#34d399",
  "#fb7185",
  "#f97316",
  "#e2e8f0",
];

const GRAVITY = 55;
const SWAY = 34;

function createPiece(width: number, height: number, randomY: boolean): Piece {
  const w = 6 + Math.random() * 9;
  return {
    x: Math.random() * width,
    y: randomY ? Math.random() * height : -20 - Math.random() * height * 0.6,
    w,
    h: w * (0.45 + Math.random() * 1.1),
    vx: (Math.random() - 0.5) * 45,
    vy: 55 + Math.random() * 130,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 5,
    phase: Math.random() * Math.PI * 2,
    spin: 2 + Math.random() * 5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
}

export default function Confetti({ enabled }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const count = Math.min(340, Math.max(90, Math.round((width * height) / 3200)));
    const pieces = Array.from({ length: count }, () => createPiece(width, height, true));

    let last = performance.now();
    let frame = requestAnimationFrame(function tick(t: number) {
      const dt = Math.min(0.05, Math.max(0, (t - last) / 1000));
      last = t;

      ctx.clearRect(0, 0, width, height);

      for (const p of pieces) {
        p.phase += p.spin * dt;
        p.rot += p.vr * dt;
        p.vy = Math.min(340, p.vy + GRAVITY * dt);
        p.x += (p.vx + Math.sin(p.phase) * SWAY) * dt;
        p.y += p.vy * dt;

        if (p.y > height + 40 || p.x < -80 || p.x > width + 80) {
          Object.assign(p, createPiece(width, height, false));
          continue;
        }

        const flip = Math.cos(p.phase);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.transform(flip, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 0.95;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      frame = requestAnimationFrame(tick);
    });

    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      ctx.clearRect(0, 0, width, height);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40"
    />
  );
}
