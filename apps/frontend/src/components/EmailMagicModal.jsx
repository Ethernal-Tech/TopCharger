import { useEffect, useRef, useState } from "react";

export default function EmailMagicModal({
  open,
  onClose,
  onSubmit,          // (email: string) => Promise<void>
  busy = false,
  initialEmail = "",
}) {
  const [email, setEmail] = useState(initialEmail);
  const [err, setErr] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setEmail(initialEmail);
      setErr("");
    }
  }, [open, initialEmail]);

  const validate = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!validate(email)) {
      setErr("Please enter a valid email address.");
      return;
    }
    setErr("");
    await onSubmit(email.trim().toLowerCase());
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !busy && onClose()}
      />

      {/* Panel */}
      <form
        onSubmit={handleSubmit}
        className="relative w-[92%] max-w-md rounded-2xl bg-white/95 shadow-2xl p-6 sm:p-7
                   border border-white/40"
      >
        <h2 className="text-xl font-bold text-emerald-900">Login with Email</h2>
        <p className="mt-1 text-sm text-slate-600">
          We’ll send you a secure magic link to sign in.
        </p>

        <label className="block mt-4 text-sm font-medium text-slate-700">
          Email address
        </label>
        <input
          ref={inputRef}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2
                     focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                     bg-white text-slate-900"
          placeholder="you@example.com"
          disabled={busy}
        />

        {err ? (
          <p className="mt-2 text-sm text-red-600">{err}</p>
        ) : (
          <div className="h-5 mt-2" />
        )}

        <div className="mt-4 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 bg-white
                       hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white
                       hover:bg-emerald-500 disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send magic link"}
          </button>
        </div>
      </form>
    </div>
  );
}
