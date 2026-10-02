"use client";

interface PopupBannerProps {
  message: string;
  enabled: boolean;
  onClose: () => void;
}

export default function PopupBanner({ message, enabled, onClose }: PopupBannerProps) {
  if (!enabled) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-6 backdrop-blur-sm">
      <div className="panel relative w-full max-w-md p-7 text-center shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer le message"
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          ✕
        </button>
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-sky-500/15 text-sky-400">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
            <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
          </svg>
        </div>
        <div className="text-sm font-semibold tracking-widest text-sky-400 uppercase">
          Flash info
        </div>
        <p
          className="mt-3 max-h-[50vh] overflow-y-auto text-base leading-relaxed text-slate-100"
          style={{ whiteSpace: "pre-wrap" }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}