// apps/frontend/src/utils/solanaWallet.js
import bs58 from "bs58";

/**
 * Detect installed wallets.
 * We intentionally trust ONLY the dedicated namespaces:
 *  - Phantom: window.phantom.solana
 *  - Solflare: window.solflare
 * to avoid OKX (or others) masquerading as Phantom via window.solana.
 */
export function detectWallets() {
  const out = [];

  const phantom = window?.phantom?.solana;
  if (phantom?.isPhantom) {
    out.push({ id: "phantom", name: "Phantom", provider: phantom });
  }

  const solflare = window?.solflare;
  if (solflare?.isSolflare) {
    out.push({ id: "solflare", name: "Solflare", provider: solflare });
  }

  return out;
}

/** Utility: wrap a promise with a timeout so UI won't hang forever */
function withTimeout(promise, ms, msg) {
  let t;
  const timeout = new Promise((_, rej) => {
    t = setTimeout(() => rej(new Error(msg || "Timed out")), ms);
  });
  return Promise.race([
    Promise.resolve(promise).finally(() => clearTimeout(t)),
    timeout,
  ]);
}

/**
 * Connect to the given provider and sign an arbitrary UTF-8 message.
 * Adds timeouts so the modal can recover if user closes the popup.
 */
export async function connectAndSignMessage({ provider, messageUtf8 }) {
  // Ensure connected (12s timeout)
  if (!provider.publicKey) {
    await withTimeout(provider.connect?.(), 12000, "Wallet did not respond");
  }

  const publicKey = provider.publicKey?.toString();
  if (!publicKey) throw new Error("Wallet connection failed");

  if (typeof provider.signMessage !== "function") {
    throw new Error(
      "This wallet does not support message signing. Update the wallet."
    );
  }

  const bytes = new TextEncoder().encode(messageUtf8);

  // Sign (60s timeout)
  const signed = await withTimeout(
    provider.signMessage(bytes, "utf8"),
    60000,
    "Signing request timed out"
  );

  const signatureB58 = signed?.signature ? bs58.encode(signed.signature) : null;

  if (!signatureB58) throw new Error("Failed to sign message");

  return { publicKey, signatureB58 };
}
