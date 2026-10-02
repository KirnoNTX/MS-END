"use client";

import { hoursMinutes, longDateLabel } from "@/lib/dates";

interface ClockProps {
  now: Date;
}

export default function Clock({ now }: ClockProps) {
  return (
    <div className="text-center">
      <div className="font-mono text-3xl leading-none font-semibold tracking-tight text-white sm:text-4xl">
        {hoursMinutes(now)}
        <span className="text-sky-400" suppressHydrationWarning>
          :{String(now.getSeconds()).padStart(2, "0")}
        </span>
      </div>
      <div className="mt-1.5 text-xs text-slate-400 first-letter:uppercase" suppressHydrationWarning>
        {longDateLabel(now)}
      </div>
    </div>
  );
}