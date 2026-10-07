"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { toISODate } from "@/lib/dates";
import CalendarGrid from "@/components/CalendarGrid";

interface WorkingDaysResponse {
  added?: boolean;
  workingDays: string[];
}

type Screen = "checking" | "login" | "panel";
type Toast = { kind: "ok" | "error"; text: string } | null;

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = (await res.json().catch(() => null)) as T & { error?: string };
  if (!res.ok) {
    throw new ApiError(body?.error ?? `Requête échouée (${res.status})`, res.status);
  }
  return body;
}

const UNAUTHORIZED = 401;

function ToastBar({ toast }: { toast: Toast }) {
  if (!toast) return null;
  return (
    <div
      className={`rounded-lg px-3 py-2 text-sm ring-1 ${
        toast.kind === "ok"
          ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30"
          : "bg-red-500/10 text-red-300 ring-red-500/30"
      }`}
    >
      {toast.text}
    </div>
  );
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
      {children}
    </div>
  );
}

function LoginScreen({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await apiJson("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex h-[100dvh] items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="panel w-full max-w-sm p-7">
        <div className="mb-1 text-lg font-semibold text-white">Espace admin</div>
        <label className="mb-1.5 block text-xs tracking-widest text-slate-500 uppercase">
          Mot de passe
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
          placeholder="••••••••"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none ring-sky-400/60 transition placeholder:text-slate-600 focus:border-sky-400/50 focus:ring-2"
        />
        {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
        <button
          type="submit"
          disabled={busy}
          className="mt-4 w-full rounded-lg bg-sky-500 px-3 py-2.5 text-sm font-semibold text-sky-950 transition hover:bg-sky-400 disabled:opacity-50"
        >
          {busy ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}

function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const now = new Date();
  const [today] = useState(() => toISODate(now));
  const [month, setMonth] = useState(() => new Date());
  const [workingDays, setWorkingDays] = useState<string[]>([]);
  const [toast, setToast] = useState<Toast>(null);
  const [popupEnabled, setPopupEnabled] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    apiJson<{ workingDays: string[] }>("/api/admin/working-days")
      .then((d) => setWorkingDays(d.workingDays))
      .catch((err) =>
        setToast({ kind: "error", text: err.message === "Non autorisé" ? "Session expirée" : err.message })
      );
    apiJson<{ popupEnabled: boolean; popupMessage: string }>("/api/admin/settings")
      .then((d) => {
        setPopupEnabled(d.popupEnabled);
        setPopupMessage(d.popupMessage);
      })
      .catch((err) =>
        setToast({ kind: "error", text: err.message === "Non autorisé" ? "Session expirée" : "Impossible de charger les réglages" })
      );
  }, []);

  function showError(err: unknown) {
    setToast({
      kind: "error",
      text: err instanceof Error ? err.message : "Erreur inconnue",
    });
  }

  async function handleToggle(iso: string) {
    const next = new Set(workingDays);
    if (next.has(iso)) next.delete(iso);
    else next.add(iso);
    setWorkingDays([...next].sort());

    try {
      const data = await apiJson<WorkingDaysResponse>("/api/admin/working-days", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: iso }),
      });
      setWorkingDays(data.workingDays);
      setToast({ kind: "ok", text: data.added ? "Jour ajouté" : "Jour retiré" });
    } catch (err) {
      setWorkingDays([...workingDays].sort());
      if (err instanceof ApiError && err.status === UNAUTHORIZED) {
        onLogout();
        return;
      }
      showError(err);
    }
  }

  async function handleClearAll() {
    if (!window.confirm("Effacer TOUTE la sélection des jours de travail ?")) return;
    try {
      await apiJson<{ workingDays: string[] }>("/api/admin/working-days", {
        method: "DELETE",
      });
      setWorkingDays([]);
      setToast({ kind: "ok", text: "Sélection effacée" });
    } catch (err) {
      showError(err);
    }
  }

  async function handleSaveSettings() {
    if (savingSettings) return;
    setSavingSettings(true);
    try {
      await apiJson("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ popupEnabled, popupMessage }),
      });
      setSettingsDirty(false);
      setToast({ kind: "ok", text: "Pop-up enregistré" });
    } catch (err) {
      showError(err);
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleLogout() {
    try {
      await apiJson("/api/auth/logout", { method: "POST" });
    } finally {
      onLogout();
    }
  }

  const selected = new Set(workingDays);

  return (
    <main className="scroll-area h-[100dvh] p-4 sm:p-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-white">Espace admin</div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/"
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              Retour au site
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300 transition hover:bg-red-500/20 hover:text-red-300"
            >
              Déconnexion
            </button>
          </div>
        </header>

        <ToastBar toast={toast} />

        <section className="panel p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <PanelTitle>Calendrier des jours de travail</PanelTitle>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-sky-500/10 px-2.5 py-1 text-xs text-sky-300 ring-1 ring-sky-400/30">
                {workingDays.length} sélectionnés
              </span>
              <button
                type="button"
                onClick={handleClearAll}
                className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-300 ring-1 ring-red-500/30 transition hover:bg-red-500/20"
              >
                Tout effacer
              </button>
            </div>
          </div>
          <div className="h-[380px]">
            <CalendarGrid
              month={month}
              selected={selected}
              today={today}
              onMonthChange={setMonth}
              onSelectDate={handleToggle}
            />
          </div>
<div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/10 pt-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-sky-300" /> Passé
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-sky-800" /> À venir
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-yellow-400" /> Aujourd&apos;hui
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-500" /> Passé
            </span>
          </div>
        </section>

        <section className="panel p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <PanelTitle>Message pop-up sur le site</PanelTitle>
            <button
              type="button"
              role="switch"
              aria-checked={popupEnabled}
              onClick={() => {
                setPopupEnabled((v) => !v);
                setSettingsDirty(true);
              }}
              className={`relative h-6 w-11 rounded-full transition ${
                popupEnabled ? "bg-emerald-500" : "bg-slate-700"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  popupEnabled ? "translate-x-5" : ""
                }`}
              />
            </button>
          </div>
          <label className="mb-1.5 block text-xs text-slate-500">
            Message affiché en pop-up sur la page principale (modifiable à tout moment).
          </label>
          <textarea
            value={popupMessage}
            onChange={(e) => {
              setPopupMessage(e.target.value);
              setSettingsDirty(true);
            }}
            rows={3}
            maxLength={1000}
            placeholder="Ex : Pensez à remplir votre fiche de frais avant vendredi !"
            className="scroll-area w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none ring-sky-400/60 transition placeholder:text-slate-600 focus:border-sky-400/50 focus:ring-2"
          />
          <div className="mt-3 flex items-center justify-end gap-3">
            <span className="text-[11px] text-slate-500">{popupMessage.length}/1000</span>
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={!settingsDirty || savingSettings}
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-sky-950 transition hover:bg-sky-400 disabled:opacity-40"
            >
              {savingSettings ? "Enregistrement…" : "Enregistrer le message"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function AdminApp() {
  const [screen, setScreen] = useState<Screen>("checking");

  useEffect(() => {
    let cancelled = false;
    apiJson<{ authenticated: boolean }>("/api/auth/session")
      .then((d) => {
        if (!cancelled) setScreen(d.authenticated ? "panel" : "login");
      })
      .catch(() => {
        if (!cancelled) setScreen("login");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (screen === "checking") {
    return (
      <main className="flex h-[100dvh] items-center justify-center text-sm text-slate-500">
        Vérification…
      </main>
    );
  }

  if (screen === "login") {
    return <LoginScreen onSuccess={() => setScreen("panel")} />;
  }

  return <AdminPanel onLogout={() => setScreen("login")} />;
}