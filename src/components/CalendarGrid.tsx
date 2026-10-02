"use client";

import { WEEKDAYS, addMonths, buildMonthCells, monthLabel, toISODate } from "@/lib/dates";

interface CalendarGridProps {
  month: Date;
  selected: ReadonlySet<string>;
  today: string;
  onMonthChange: (month: Date) => void;
  onSelectDate?: (iso: string) => void;
}

const DAY_MS = 86400000;

function cellClasses(opts: {
  isSelected: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isOutside: boolean;
  dayDiff: number;
}): string {
  const { isSelected, isToday, isWeekend, isOutside, dayDiff } = opts;

  if (isSelected) {
    let fill: string;
    if (isToday) {
      fill = "bg-yellow-400 text-yellow-950 shadow-[0_0_18px_rgba(250,204,21,0.4)]";
    } else if (dayDiff < 0) {
      fill = "bg-sky-300 text-sky-950";
    } else {
      fill = "bg-sky-800 text-sky-100";
    }
    return `${fill} font-semibold ${isOutside && !isToday ? "opacity-60" : ""}`;
  }

  if (isToday) return "ring-2 ring-yellow-400/90 text-yellow-300 font-semibold";
  if (isOutside) return "text-slate-700";
  if (isWeekend) return "text-slate-500";
  return "text-slate-300";
}

export default function CalendarGrid({
  month,
  selected,
  today,
  onMonthChange,
  onSelectDate,
}: CalendarGridProps) {
  const cells = buildMonthCells(month);
  const todayDate = parseISOFast(today);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-label="Mois précédent"
          onClick={() => onMonthChange(addMonths(month, -1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          ‹
        </button>
        <div className="text-sm font-semibold tracking-wide text-slate-200">
          {monthLabel(month)}
        </div>
        <button
          type="button"
          aria-label="Mois suivant"
          onClick={() => onMonthChange(addMonths(month, 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="py-1 text-[10px] font-medium tracking-widest text-slate-500 uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-7 gap-1">
        {cells.map((date) => {
          const iso = toISODate(date);
          const isSelected = selected.has(iso);
          const isToday = iso === today;
          const isOutside = date.getMonth() !== month.getMonth();
          const isWeekend = date.getDay() === 0 || date.getDay() === 6;
          const dayDiff = Math.round((date.getTime() - todayDate.getTime()) / DAY_MS);

          const className = cellClasses({
            isSelected,
            isToday,
            isWeekend,
            isOutside,
            dayDiff,
          });

          const content = (
            <span className="flex h-full w-full items-center justify-center text-[13px] leading-none">
              {date.getDate()}
            </span>
          );

          if (!onSelectDate) {
            return (
              <div
                key={iso}
                className={`flex items-center justify-center rounded-lg transition ${className}`}
                title={isSelected ? "Jour de travail sélectionné" : undefined}
              >
                {content}
              </div>
            );
          }

          return (
            <button
              key={iso}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelectDate(iso)}
              className={`flex cursor-pointer items-center justify-center rounded-lg transition hover:scale-105 hover:ring-1 hover:ring-sky-400/60 active:scale-95 ${className}`}
            >
              {content}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function parseISOFast(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}