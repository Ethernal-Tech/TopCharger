// frontend: sendSignedTx.js (call from your UI when user clicks "Send 0.01 SOL")
import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";

const RPC_URL = import.meta.env.VITE_SOLANA_RPC || "https://api.devnet.solana.com";
const BACKEND = import.meta.env.VITE_BACKEND_URL;

export async function send01SolWithWallet(provider, recipientAddress) {
  if (!provider?.publicKey) throw new Error("Wallet not connected");

  const connection = new Connection(RPC_URL, "confirmed");

  // 0.01 SOL in lamports
  const lamports = 10_000_000;

  // Build tx
  const toPubkey = new PublicKey(recipientAddress);
  const tx = new Transaction();

  // add transfer instruction
  tx.add(
    SystemProgram.transfer({
      fromPubkey: provider.publicKey,
      toPubkey,
      lamports,
    })
  );

  // set feePayer and recent blockhash (necessary before sign)
  tx.feePayer = provider.publicKey;
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;

  // Ask wallet to sign (Phantom/Solflare provide signTransaction)
  // This will prompt the wallet UI for approval
  const signedTx = await provider.signTransaction(tx); // returns Transaction with signature attached

  // Serialize and base64
  const raw = signedTx.serialize();
  const base64 = Buffer.from(raw).toString("base64");

  // POST to backend for broadcasting
  const res = await fetch(`${BACKEND}/api/solana/broadcast-signed`, {
    method: "POST",
    credentials: "include", // keep session for auth
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ signedTxBase64: base64 }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || "Failed to broadcast transaction");
  }

  const json = await res.json();
  return json; // { signature, explorerUrl }
}
