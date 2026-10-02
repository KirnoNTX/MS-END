"use client";

import { useEffect, useRef, useState } from "react";

interface NotePanelProps {
  serverContent: string;
  saveContent: (content: string) => Promise<boolean>;
}

const SAVE_DEBOUNCE_MS = 700;

export default function NotePanel({ serverContent, saveContent }: NotePanelProps) {
  const [draft, setDraft] = useState(serverContent);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastSaveRef = useRef<string>(serverContent);
  const isFocusedRef = useRef(false);
  const ignoreNextServerRef = useRef(false);

  useEffect(() => {
    if (document.activeElement === textareaRef.current) return;
    if (ignoreNextServerRef.current) {
      ignoreNextServerRef.current = false;
      return;
    }
    setDraft(serverContent);
    lastSaveRef.current = serverContent;
  }, [serverContent]);

  useEffect(() => {
    if (draft === lastSaveRef.current) return;
    const t = setTimeout(async () => {
      setStatus("saving");
      const ok = await saveContent(draft);
      if (ok) {
        lastSaveRef.current = draft;
        setStatus("saved");
        ignoreNextServerRef.current = true;
      } else {
        setStatus("error");
      }
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [draft, saveContent]);

  return (
    <div className="panel flex h-full flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2">
        <span className="live-dot inline-block h-2 w-2 rounded-full bg-emerald-400" />
        <span className="text-xs font-semibold tracking-wider text-slate-200 uppercase">
          Bloc notes — en direct
        </span>
        <span className="ml-auto text-[11px] text-slate-500">
          {status === "saving" && "Enregistrement…"}
          {status === "saved" && "Enregistré"}
          {status === "error" && "Échec de l'enregistrement"}
        </span>
      </div>
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setStatus("idle");
        }}
        onFocus={() => {
          isFocusedRef.current = true;
        }}
        onBlur={() => {
          isFocusedRef.current = false;
        }}
        placeholder="Écrivez ici un message partagé avec toute l'équipe…"
        spellCheck={false}
        className="scroll-area min-h-0 flex-1 resize-none bg-transparent px-4 py-3 text-sm leading-relaxed text-slate-200 outline-none placeholder:text-slate-600"
      />
    </div>
  );
}