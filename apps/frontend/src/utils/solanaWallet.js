import bs58 from "bs58";

export function detectWallets() {
  const out = [];
  // Phantom
  if (window?.phantom?.solana && window.phantom.solana.isPhantom) {
    out.push({ id: "phantom", name: "Phantom", provider: window.phantom.solana });
  } else if (window?.solana?.isPhantom) {
    out.push({ id: "phantom", name: "Phantom", provider: window.solana });
  }
  // Solflare
  if (window?.solflare?.isSolflare) {
    out.push({ id: "solflare", name: "Solflare", provider: window.solflare });
  } else if (window?.solana?.isSolflare) {
    out.push({ id: "solflare", name: "Solflare", provider: window.solana });
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
