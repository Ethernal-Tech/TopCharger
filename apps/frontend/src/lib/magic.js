import { Magic } from "magic-sdk";
import { SolanaExtension } from "@magic-ext/solana";

let magic = null;

export function getMagic() {
  if (typeof window === "undefined") return null;
  if (!magic) {
    magic = new Magic(import.meta.env.VITE_MAGIC_PUBLISHABLE_KEY, {
      extensions: [new SolanaExtension({ rpcUrl: "https://api.devnet.solana.com" })],
    });
  }
  return magic;
}
