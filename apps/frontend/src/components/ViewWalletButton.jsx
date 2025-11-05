import { useState, useCallback } from "react";
import { getMagic } from "@/lib/magic";

export default function ViewWalletButton() {
  const [busy, setBusy] = useState(false);

  const onClick = useCallback(async () => {
    const magic = getMagic();
    if (!magic) {
      console.error("[ViewWallet] Magic not configured (check VITE_MAGIC_PUBLISHABLE_KEY).");
      return;
    }

    try {
      setBusy(true);

      const loggedIn = await magic.user.isLoggedIn().catch(() => false);
      if (!loggedIn) {
        // This shows Magic’s Login UI (Email OTP by default) and returns AFTER the user finishes.
        console.log("[ViewWallet] No session → opening Magic Login UI…");
        await magic.wallet.connectWithUI();
        console.log("[ViewWallet] Login UI flow done (user should now be logged in).");
        // Let Magic settle its session state before opening the wallet widget.
        await new Promise(r => setTimeout(r, 200));
      }

      // Now open the wallet widget
      console.log("[ViewWallet] Opening wallet UI…");
      await magic.wallet.showUI();
    } catch (err) {
      // Most frequent cause: non-Embedded Wallets key, or blocked by extensions.
      console.error("[ViewWallet] Could not open wallet UI:", err);
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`
        inline-flex items-center justify-center
        px-4 py-2 rounded-lg text-sm font-semibold
        border border-emerald-700 text-emerald-800
        bg-white/0 hover:bg-emerald-50 active:bg-emerald-100
        disabled:opacity-50 disabled:cursor-not-allowed transition
      `}
    >
      {busy ? "Opening…" : "View Wallet"}
    </button>
  );
}
