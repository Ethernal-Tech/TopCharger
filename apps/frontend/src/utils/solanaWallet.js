import bs58 from "bs58";

export function detectWallets() {
  const out = [];

  const s = window.solana;
  const phantom = window.phantom?.solana;
  const solflare = window.solflare;
  const okx = window.okxwallet?.solana;

  console.log("Detected wallet flags:", {
    phantom: phantom?.isPhantom,
    solana_isPhantom: s?.isPhantom,
    solana_isSolflare: s?.isSolflare,
    okx: okx?.isOKXWallet,
  });

  // ✅ Phantom detection
  if (phantom?.isPhantom === true) {
    out.push({ id: "phantom", name: "Phantom", provider: phantom });
  } else if (s?.isPhantom === true && !s.isSolflare && !okx?.isOKXWallet) {
    out.push({ id: "phantom", name: "Phantom", provider: s });
  }

  // ✅ Solflare detection
  if (solflare?.isSolflare === true) {
    out.push({ id: "solflare", name: "Solflare", provider: solflare });
  } else if (s?.isSolflare === true && !okx?.isOKXWallet) {
    out.push({ id: "solflare", name: "Solflare", provider: s });
  }

  // ✅ OKX (ignored visually for now)
  if (okx?.isOKXWallet === true) {
    console.log("⚠️ OKX wallet detected — ignoring for now");
  }

  return out;
}

export async function connectAndSignMessage({ provider, messageUtf8 }) {
  // Ensure connected
  if (!provider.publicKey) {
    await provider.connect?.();
  }
  const publicKey = provider.publicKey?.toString();
  if (!publicKey) throw new Error("Wallet connection failed");

  // signMessage support
  if (typeof provider.signMessage !== "function") {
    throw new Error("This wallet does not support message signing. Update the wallet app.");
  }
  const bytes = new TextEncoder().encode(messageUtf8);
  const signed = await provider.signMessage(bytes, "utf8");
  const signatureB58 = signed?.signature ? bs58.encode(signed.signature) : null;
  if (!signatureB58) throw new Error("Failed to sign message");

  return { publicKey, signatureB58 };
}
