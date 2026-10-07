"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublicState } from "@/lib/types";
import { dayProgress, hoursMinutes, parseISO, toISODate } from "@/lib/dates";
import CalendarGrid from "@/components/CalendarGrid";
import Clock from "./Clock";
import Confetti from "./Confetti";
import NotePanel from "./NotePanel";
import PopupBanner from "./PopupBanner";
import ProgressBar from "./ProgressBar";

const POLL_INTERVAL_MS = 3000;

const EMPTY_STATE: PublicState = {
  workingDays: [],
  note: { content: "", updatedAt: null },
  settings: { popupEnabled: false, popupMessage: "" },
  workHours: { start: 9, end: 19 },
};

async function saveNote(content: string): Promise<boolean> {
  try {
    const res = await fetch("/api/note", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

interface Countdown {
  d: string;
  h: string;
  m: string;
  s: string;
  finished: boolean;
}

function countdownToEnd(workingDays: string[], workEnd: number, now: Date): Countdown {
  const last = workingDays[workingDays.length - 1];
  if (!last) return { d: "00", h: "00", m: "00", s: "00", finished: false };
  const end = parseISO(last);
  end.setHours(Math.min(23, workEnd), 0, 0, 0);
  const total = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return { d: pad(d), h: pad(h), m: pad(m), s: pad(s), finished: total === 0 };
}

function formatPercent(value: number): string {
  return `${Math.min(100, Math.max(0, value)).toFixed(4)}%`;
}

export default function HomeClient() {
  const [now, setNow] = useState(() => new Date());
  const [state, setState] = useState<PublicState>(EMPTY_STATE);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [month, setMonth] = useState(() => new Date());
  const [dismissedKey, setDismissedKey] = useState("");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;

    const poll = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const res = await fetch("/api/state", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as PublicState;
          if (!cancelled) {
            setState(data);
            setOffline(false);
          }
        } else if (!cancelled) {
          setOffline(true);
        }
      } catch {
        if (!cancelled) setOffline(true);
      } finally {
        inFlight = false;
        if (!cancelled) setLoading(false);
      }
    };

    poll();
    const timer = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const today = toISODate(now);
  const selected = useMemo(() => new Set(state.workingDays), [state.workingDays]);

  const todayProgress = dayProgress(now, state.workHours.start, state.workHours.end);

  const stats = useMemo(() => {
    let passed = 0;
    let remaining = 0;
    let todayWorking = false;
    for (const day of state.workingDays) {
      if (day < today) passed++;
      else if (day === today) todayWorking = true;
      else remaining++;
    }
    const total = state.workingDays.length;
    const done = passed + (todayWorking ? todayProgress : 0);
    return {
      total,
      passed,
      remaining,
      percent: total > 0 ? (done / total) * 100 : 0,
    };
  }, [state.workingDays, today, todayProgress]);

  const countdown = useMemo(
    () => countdownToEnd(state.workingDays, state.workHours.end, now),
    [state.workingDays, state.workHours.end, now]
  );

  const globalPercentLabel = formatPercent(stats.percent);
  const todayPercentLabel = formatPercent(todayProgress * 100);

  const popupActive =
    state.settings.popupEnabled && state.settings.popupMessage.trim().length > 0;
  const popupKey = `${state.settings.popupEnabled}|${state.settings.popupMessage}`;
  const showPopup = popupActive && dismissedKey !== popupKey;

  const segments = [
    { value: countdown.d, unit: "Jours" },
    { value: countdown.h, unit: "Heures" },
    { value: countdown.m, unit: "Min" },
    { value: countdown.s, unit: "Sec" },
  ];

  return (
    <main className="flex min-h-[100dvh] flex-col gap-3 p-3 sm:gap-4 sm:p-5 lg:h-[100dvh]">
      {offline && (
        <div className="shrink-0 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-center text-xs text-red-300">
          Connexion au serveur perdue
        </div>
      )}

      <section className="grid shrink-0 grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
        <div className="panel flex min-w-0 flex-col justify-center gap-2 p-4 sm:p-5 lg:col-span-2">
          <span className="text-center text-xs font-bold tracking-widest text-slate-300 uppercase sm:text-sm">
            {loading ? "Chargement…" : "Fin dans"}
          </span>
          <div className="flex items-start justify-center gap-2 font-mono font-bold text-white tabular-nums sm:gap-3">
            {segments.map((seg, i) => (
              <div key={seg.unit} className="flex items-start gap-2 sm:gap-3">
                {i > 0 && (
                  <span className="text-[clamp(1.5rem,3.2vw,5.5rem)] font-normal leading-none text-sky-500/60">
                    :
                  </span>
                )}
                <div className="flex flex-col items-center">
                  <span className="bg-gradient-to-b from-white to-sky-400 bg-clip-text text-[clamp(2rem,13vw,2.5rem)] font-bold leading-none text-transparent sm:text-[clamp(2.25rem,5.2vw,9rem)]">
                    {loading ? "| " : seg.value}
                  </span>
                  <span className="mt-1.5 text-[9px] font-sans font-medium tracking-widest text-slate-500 uppercase sm:text-[11px]">
                    {seg.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-3 sm:gap-4 lg:col-span-1">
          <ProgressBar
            label="Progression du jour"
            sub={`${hoursMinutes(now)} / ${pad(state.workHours.end)}:00`}
            percentLabel={todayPercentLabel}
            percent={todayProgress * 100}
            barClassName="bg-gradient-to-r from-sky-500 via-sky-400 to-amber-300"
          />
          <div className="panel flex min-w-0 flex-1 items-center justify-center p-4 text-center">
            <Clock now={now} />
          </div>
        </div>
      </section>

      <section className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
        <div className="flex min-h-0 flex-col gap-3 sm:gap-4 lg:col-span-2">
          <div className="panel flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-4 text-center sm:p-6">
            <span className="text-xs font-bold tracking-widest text-slate-300 uppercase sm:text-sm">
              Avancement global
            </span>
            <div className="bg-gradient-to-b from-white via-violet-200 to-sky-400 bg-clip-text font-mono text-5xl font-bold leading-none tabular-nums text-transparent sm:text-7xl lg:text-8xl">
              {globalPercentLabel}
            </div>
            <div className="h-5 w-full max-w-2xl overflow-hidden rounded-full bg-slate-800/80 ring-1 ring-white/5 sm:h-6">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400 transition-[width] duration-700 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, stats.percent)).toFixed(4)}%` }}
              />
            </div>
            <div className="grid w-full max-w-xl grid-cols-3 gap-2">
              {[
                { label: "Total", value: stats.total, cls: "text-slate-300" },
                { label: "Passés", value: stats.passed, cls: "text-slate-400" },
                { label: "Restants", value: stats.remaining, cls: "text-sky-300" },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl bg-white/[0.04] px-2 py-2.5 text-center ring-1 ring-white/5"
                >
                  <div className={`font-mono text-2xl font-semibold tabular-nums sm:text-3xl ${s.cls}`}>
                    {s.value}
                  </div>
                  <div className="mt-0.5 text-[9px] tracking-widest text-slate-500 uppercase sm:text-[10px]">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel h-[400px] min-h-0 flex-col p-4 sm:p-5 lg:h-auto lg:col-span-1">
          <CalendarGrid
            month={month}
            selected={selected}
            today={today}
            onMonthChange={setMonth}
          />
        </div>
      </section>

      <footer className="h-36 shrink-0">
        <NotePanel serverContent={state.note.content} saveContent={saveNote} />
      </footer>

      <Confetti enabled={countdown.finished} />

      <PopupBanner
        message={state.settings.popupMessage}
        enabled={showPopup}
        onClose={() => setDismissedKey(popupKey)}
      />
    </main>
  );
}