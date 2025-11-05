// apps/frontend/src/lib/magic.js
import { Magic } from "magic-sdk";

let magic = null;

export function getMagic() {
  if (typeof window === "undefined") return null;
  if (magic) return magic;

  const key = import.meta.env.VITE_MAGIC_PUBLISHABLE_KEY;
  if (!key) {
    console.error("[Magic] Missing VITE_MAGIC_PUBLISHABLE_KEY");
    return null;
  }

  console.log(`[Magic] init key=${String(key).slice(0, 6)}…`);

  magic = new Magic(key); 
  return magic;
}
