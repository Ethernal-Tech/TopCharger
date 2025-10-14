import { PublicKey } from "@solana/web3.js";
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

// Provide CommonJS-like globals in ESM context
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function registerUser(role: number, userIdHashArr?: number[] | Buffer) {
  // Ensure required env vars
  if (!process.env.ANCHOR_PROVIDER_URL) {
    throw new Error("ANCHOR_PROVIDER_URL not set. Set it to your RPC (e.g. http://127.0.0.1:8899)");
  }
  if (!process.env.ANCHOR_WALLET) {
    throw new Error("ANCHOR_WALLET not set. Set it to your wallet keypair path (e.g. ~/.config/solana/id.json)");
  }

  // If Anchor.toml isn't in cwd, change to program root so Anchor can find the workspace files
  // Ascend directories until we find Anchor.toml (expected at program root)
  function findAnchorRoot(startDir: string): string | null {
    let current = startDir;
    for (let i = 0; i < 5; i++) { // safety depth
      const candidate = path.join(current, "Anchor.toml");
      if (fs.existsSync(candidate)) return current;
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
    return null;
  }
  const anchorRoot = findAnchorRoot(__dirname);
  if (anchorRoot) {
    process.chdir(anchorRoot);
  }

  // dynamic import to avoid Anchor trying to read workspace at module load time from the web2 folder
  const anchor: any = await import("@coral-xyz/anchor");
  const idl = require(path.join(process.cwd(), "target", "idl", "topcharger_program.json"));

  anchor.setProvider(anchor.AnchorProvider.env());
  const provider: any = anchor.getProvider();
  //const programId = new PublicKey(idl.metadata?.address ?? (idl.address as string));
    const programId = new PublicKey(
    process.env.TOPCHARGER_PROGRAM_ID ?? idl.metadata?.address ?? (idl.address as string)
  );


  // We avoid constructing `new anchor.Program(...)` because Anchor's Program constructor
  // initializes account clients and may require full IDL account type information.
  // Instead, build the instruction data manually using the IDL's instruction discriminator
  // (first 8 bytes) and the raw Borsh-compatible argument layout for this instruction.

  // Create or normalize a 32-byte user id hash buffer
  let userHashBuf: Buffer;
  if (!userIdHashArr) {
    userHashBuf = Buffer.alloc(32, 0);
    userHashBuf[0] = 1;
  } else if (Array.isArray(userIdHashArr)) {
    userHashBuf = Buffer.from(userIdHashArr);
  } else {
    userHashBuf = Buffer.from(userIdHashArr);
  }

  if (userHashBuf.length !== 32) {
    const tmp = Buffer.alloc(32, 0);
    userHashBuf.copy(tmp, 0, 0, Math.min(userHashBuf.length, 32));
    userHashBuf = tmp;
  }

  const [userPda] = await PublicKey.findProgramAddress([Buffer.from("user"), userHashBuf], programId);

  // Build instruction data: 8-byte discriminator + serialized args
  // Find the instruction descriptor in the IDL
  const ixDesc = idl.instructions.find((ix: any) => ix.name === "register_user");
  if (!ixDesc) throw new Error("register_user instruction not found in IDL");

  const discriminator = Buffer.from(ixDesc.discriminator);

  // Serialize args: role: u8, user_id_hash: [u8;32]
  const argsBuf = Buffer.concat([Buffer.from([role & 0xff]), Buffer.from(userHashBuf)]);

  const data = Buffer.concat([discriminator, argsBuf]);

  const keys = [
    { pubkey: userPda, isSigner: false, isWritable: true },
    { pubkey: provider.wallet.publicKey, isSigner: false, isWritable: false },
    { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: true },
    { pubkey: anchor.web3.SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  const ix = new anchor.web3.TransactionInstruction({
    programId,
    keys,
    data,
  });

  const tx = new anchor.web3.Transaction().add(ix);
  tx.feePayer = provider.wallet.publicKey;
  // Populate a recent blockhash so the wallet can sign.
  // Use a small retry helper to provide clearer diagnostics if the RPC is unreachable.
  async function getLatestBlockhashWithRetry(retries = 3, delayMs = 500) {
    let lastErr: any;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await provider.connection.getLatestBlockhash();
      } catch (err: any) {
        lastErr = err;
        console.error(
          `getLatestBlockhash attempt ${attempt} failed (url=${process.env.ANCHOR_PROVIDER_URL}):`,
          err && err.message ? err.message : err
        );
        if (attempt < retries) await new Promise((r) => setTimeout(r, delayMs * attempt));
      }
    }
    throw new Error(
      `failed to get recent blockhash after ${retries} attempts: ${lastErr?.message || lastErr}`
    );
  }

  const latest = await getLatestBlockhashWithRetry(3, 500);
  tx.recentBlockhash = latest.blockhash;

  const signed = await provider.wallet.signTransaction(tx);
  const sig = await provider.connection.sendRawTransaction(signed.serialize());
  await provider.connection.confirmTransaction({ signature: sig, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight });

  return { tx: sig, userPda: userPda.toBase58() };
}

// Determine if this file is executed directly (similar to require.main === module in CJS)
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  (async () => {
    try {
      const result = await registerUser(1);
      console.log("Registered user:", result);
    } catch (err: any) {
      console.error(err);
      process.exit(1);
    }
  })();
}

export async function createCharger(
  userIdHashArr: number[] | Buffer,
  chargerId: number | bigint,
  powerKw: number,
  supplyType: number,
  price: number | bigint
) {
  if (!process.env.ANCHOR_PROVIDER_URL) {
    throw new Error("ANCHOR_PROVIDER_URL not set. Set it to your RPC (e.g. http://127.0.0.1:8899)");
  }
  if (!process.env.ANCHOR_WALLET) {
    throw new Error("ANCHOR_WALLET not set. Set it to your wallet keypair path (e.g. ~/.config/solana/id.json)");
  }

  const probableProgramRoot = path.resolve(__dirname, "..", "..");
  const anchorTomlPath = path.join(probableProgramRoot, "Anchor.toml");
  if (fs.existsSync(anchorTomlPath)) {
    process.chdir(probableProgramRoot);
  }

  const anchor: any = await import("@coral-xyz/anchor");
  const idl = require(path.join(process.cwd(), "target", "idl", "topcharger_program.json"));

  anchor.setProvider(anchor.AnchorProvider.env());
  const provider: any = anchor.getProvider();
  const programId = new PublicKey(
    process.env.TOPCHARGER_PROGRAM_ID ?? idl.metadata?.address ?? (idl.address as string)
  );

  // Normalize user_id_hash
  let userHashBuf: Buffer;
  if (Array.isArray(userIdHashArr)) {
    userHashBuf = Buffer.from(userIdHashArr);
  } else {
    userHashBuf = Buffer.from(userIdHashArr);
  }
  if (userHashBuf.length !== 32) {
    const tmp = Buffer.alloc(32, 0);
    userHashBuf.copy(tmp, 0, 0, Math.min(userHashBuf.length, 32));
    userHashBuf = tmp;
  }

  // charger_id as u64 le
  const chargerIdBuf = Buffer.alloc(8);
  chargerIdBuf.writeBigUInt64LE(BigInt(chargerId));
  // power_kw as u16 le
  const powerKwBuf = Buffer.alloc(2);
  powerKwBuf.writeUInt16LE(powerKw);
  // supply_type as u8
  const supplyTypeBuf = Buffer.from([supplyType & 0xff]);
  // price as u64 le
  const priceBuf = Buffer.alloc(8);
  priceBuf.writeBigUInt64LE(BigInt(price));

  // PDA: ["charger", user_id_hash, charger_id.to_le_bytes()]
  const [chargerPda] = await PublicKey.findProgramAddress(
    [Buffer.from("charger"), userHashBuf, chargerIdBuf],
    programId
  );

  // Find the instruction descriptor in the IDL
  const ixDesc = idl.instructions.find((ix: any) => ix.name === "create_charger");
  if (!ixDesc) throw new Error("create_charger instruction not found in IDL");
  const discriminator = Buffer.from(ixDesc.discriminator);

  // Build args: user_id_hash [32], charger_id u64, power_kw u16, supply_type u8, price u64, location [u8; 64]
  const argsBuf = Buffer.concat([
    userHashBuf,
    chargerIdBuf,
    powerKwBuf,
    supplyTypeBuf,
    priceBuf
  ]);
  const data = Buffer.concat([discriminator, argsBuf]);

  const keys = [
    { pubkey: chargerPda, isSigner: false, isWritable: true },
    { pubkey: provider.wallet.publicKey, isSigner: false, isWritable: false }, // wallet
    { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: true },   // authority
    { pubkey: anchor.web3.SystemProgram.programId, isSigner: false, isWritable: false },
  ];

  const ix = new anchor.web3.TransactionInstruction({
    programId,
    keys,
    data,
  });

  const tx = new anchor.web3.Transaction().add(ix);
  tx.feePayer = provider.wallet.publicKey;

  async function getLatestBlockhashWithRetry(retries = 3, delayMs = 500) {
    let lastErr: any;
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await provider.connection.getLatestBlockhash();
      } catch (err: any) {
        lastErr = err;
        console.error(
          `getLatestBlockhash attempt ${attempt} failed (url=${process.env.ANCHOR_PROVIDER_URL}):`,
          err && err.message ? err.message : err
        );
        if (attempt < retries) await new Promise((r) => setTimeout(r, delayMs * attempt));
      }
    }
    throw new Error(
      `failed to get recent blockhash after ${retries} attempts: ${lastErr?.message || lastErr}`
    );
  }

  const latest = await getLatestBlockhashWithRetry(3, 500);
  tx.recentBlockhash = latest.blockhash;

  const signed = await provider.wallet.signTransaction(tx);
  const sig = await provider.connection.sendRawTransaction(signed.serialize());
  await provider.connection.confirmTransaction({ signature: sig, blockhash: latest.blockhash, lastValidBlockHeight: latest.lastValidBlockHeight });

  return { tx: sig, chargerPda: chargerPda.toBase58() };
}
