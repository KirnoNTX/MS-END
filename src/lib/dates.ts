export const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const;

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isValidISODate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const d = parseISO(iso);
  return !Number.isNaN(d.getTime()) && toISODate(d) === iso;
}

export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

/** Monday of the week containing `d`. Weeks start on Monday. */
export function mondayOfWeek(d: Date): Date {
  const day = (d.getDay() + 6) % 7;
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day);
  return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate());
}

/** 42 cells (6 weeks) covering the month, starting on its first Monday. */
export function buildMonthCells(month: Date): Date[] {
  const anchor = mondayOfWeek(new Date(month.getFullYear(), month.getMonth(), 1));
  return Array.from({ length: 42 }, (_, i) => {
    const cell = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + i);
    return new Date(cell.getFullYear(), cell.getMonth(), cell.getDate());
  });
}

export function monthLabel(d: Date): string {
  const s = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function longDateLabel(d: Date): string {
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function hoursMinutes(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Percentage (0-1) of the current time inside the [start; end] hours window. */
export function dayProgress(now: Date, start: number, end: number): number {
  const minutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const total = Math.max(1, end - start) * 60;
  return Math.min(1, Math.max(0, (minutes - start * 60) / total));
}