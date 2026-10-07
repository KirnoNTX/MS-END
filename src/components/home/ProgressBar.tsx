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
    <div className={`panel flex min-w-0 flex-1 flex-col justify-center gap-2 p-4 sm:p-5 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-xs font-bold tracking-widest text-slate-300 uppercase sm:text-sm">
          {label}
        </span>
        {sub && (
          <span className="font-mono text-xs tabular-nums text-slate-400 sm:text-sm">
            {sub}
          </span>
        )}
      </div>
      <div className="text-right font-mono text-3xl font-bold leading-none tabular-nums text-white sm:text-4xl lg:text-5xl">
        {percentLabel ?? `${percent.toFixed(4)}%`}
      </div>
      <div className="h-6 overflow-hidden rounded-full bg-slate-800/80 ring-1 ring-white/5 sm:h-7">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ease-out ${barClassName}`}
          style={{ width: `${Math.min(100, Math.max(0, percent)).toFixed(4)}%` }}
        />
      </div>
    </div>
  );
}
