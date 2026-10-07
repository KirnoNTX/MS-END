"use client";

interface ProgressBarProps {
  label: string;
  sub?: string;
  percentLabel?: string;
  percent: number;
  barClassName: string;
  className?: string;
}

export default function ProgressBar({
  label,
  sub,
  percentLabel,
  percent,
  barClassName,
  className = "",
}: ProgressBarProps) {
  return (
    <div className={`panel flex min-w-0 flex-1 flex-col justify-center gap-1 p-4 text-center ${className}`}>
      <span className="text-xs font-bold tracking-widest text-slate-300 uppercase">
        {label}
      </span>
      <div className="font-mono text-2xl font-bold leading-none tabular-nums text-white sm:text-3xl">
        {percentLabel ?? `${percent.toFixed(4)}%`}
      </div>
      {sub && (
        <div className="font-mono text-xs tabular-nums text-slate-400">{sub}</div>
      )}
      <div className="h-5 overflow-hidden rounded-full bg-slate-800/80 ring-1 ring-white/5">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${barClassName}`}
          style={{ width: `${Math.min(100, Math.max(0, percent)).toFixed(4)}%` }}
        />
      </div>
    </div>
  );
}
