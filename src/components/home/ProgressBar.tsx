"use client";

interface ProgressBarProps {
  label: string;
  sub: string;
  percent: number;
  barClassName: string;
  className?: string;
}

export default function ProgressBar({
  label,
  sub,
  percent,
  barClassName,
  className = "",
}: ProgressBarProps) {
  return (
    <div className={`panel flex min-w-0 flex-1 flex-col justify-center gap-2 p-4 sm:p-5 ${className}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs font-bold tracking-widest text-slate-300 uppercase sm:text-sm">
          {label}
        </span>
        <span className="font-mono text-xs tabular-nums text-slate-200 sm:text-sm">
          {sub}
        </span>
      </div>
      <div className="h-5 overflow-hidden rounded-full bg-slate-800/80 ring-1 ring-white/5 sm:h-6">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${barClassName}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}