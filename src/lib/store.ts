import "server-only";
import { query, execute } from "./db";
import type {
  NoteData,
  PublicState,
  SettingsData,
  WorkHours,
} from "./types";

interface NoteRow {
  content: string;
  updated_at: string;
}

interface SettingsRow {
  popup_enabled: number;
  popup_message: string;
}

function clampHour(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(23, Math.max(0, Math.round(n))) : fallback;
}

export function getWorkHours(): WorkHours {
  return {
    start: clampHour(process.env.WORK_DAY_START, 9),
    end: clampHour(process.env.WORK_DAY_END, 19),
  };
}

export async function getWorkingDays(): Promise<string[]> {
  const rows = await query<Array<{ work_date: string }>>(
    "SELECT work_date FROM working_days ORDER BY work_date ASC"
  );
  return rows.map((r) => r.work_date);
}

export async function toggleWorkingDay(date: string): Promise<{ added: boolean }> {
  const existing = await query<Array<{ work_date: string }>>(
    "SELECT work_date FROM working_days WHERE work_date = ? LIMIT 1",
    [date]
  );
  if (existing.length > 0) {
    await execute("DELETE FROM working_days WHERE work_date = ?", [date]);
    return { added: false };
  }
  await execute("INSERT INTO working_days (work_date) VALUES (?)", [date]);
  return { added: true };
}

export async function clearWorkingDays(): Promise<void> {
  await execute("DELETE FROM working_days");
}

export async function getNote(): Promise<NoteData> {
  const rows = await query<NoteRow[]>(
    "SELECT content, updated_at FROM app_note WHERE id = 1 LIMIT 1"
  );
  const row = rows[0];
  if (!row) return { content: "", updatedAt: null };
  return { content: row.content, updatedAt: row.updated_at || null };
}

export async function setNote(content: string): Promise<NoteData> {
  await execute("UPDATE app_note SET content = ? WHERE id = 1", [content]);
  return getNote();
}

export async function getSettings(): Promise<SettingsData> {
  const rows = await query<SettingsRow[]>(
    "SELECT popup_enabled, popup_message FROM app_settings WHERE id = 1 LIMIT 1"
  );
  const row = rows[0];
  if (!row) return { popupEnabled: false, popupMessage: "" };
  return {
    popupEnabled: row.popup_enabled === 1,
    popupMessage: row.popup_message,
  };
}

export async function setSettings(settings: SettingsData): Promise<SettingsData> {
  await execute(
    "UPDATE app_settings SET popup_enabled = ?, popup_message = ? WHERE id = 1",
    [settings.popupEnabled ? 1 : 0, settings.popupMessage]
  );
  return getSettings();
}

export async function getPublicState(): Promise<PublicState> {
  const [workingDays, note, settings] = await Promise.all([
    getWorkingDays(),
    getNote(),
    getSettings(),
  ]);
  return {
    workingDays,
    note,
    settings,
    workHours: getWorkHours(),
  };
}