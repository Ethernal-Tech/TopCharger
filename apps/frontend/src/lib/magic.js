// apps/frontend/src/lib/magic.js
import { Magic } from "magic-sdk";

let magic = null;

/**
 * Singleton Magic instance for Solana embedded wallet
 * Requires: VITE_MAGIC_PUBLISHABLE_KEY
 */
export function getMagic() {
  if (typeof window === "undefined") return null;
  if (magic) return magic;

  const key = import.meta.env.VITE_MAGIC_PUBLISHABLE_KEY;
  if (!key) {
    console.error("[Magic] Missing VITE_MAGIC_PUBLISHABLE_KEY");
    return null;
  }

  // ✅ Embedded Solana Wallet Configuration
  magic = new Magic(key, {
    network: {
      rpcUrl: "https://api.devnet.solana.com",
      chainId: 101, // Solana Devnet
    },
  });

  return magic;
}

/**
 * Get Magic embedded wallet Solana public address
 */
export async function getSolanaPublicAddress() {
  const m = getMagic();
  if (!m) return null;

  try {
    const info = await m.user.getInfo();
    return info.publicAddress ?? null;
  } catch (err) {
    console.warn("[Magic] No pubkey", err);
    return null;
  }
}
