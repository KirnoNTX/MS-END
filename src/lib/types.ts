export interface NoteData {
  content: string;
  updatedAt: string | null;
}

export interface SettingsData {
  popupEnabled: boolean;
  popupMessage: string;
}

export interface WorkHours {
  start: number;
  end: number;
}

export interface PublicState {
  workingDays: string[];
  note: NoteData;
  settings: SettingsData;
  workHours: WorkHours;
}