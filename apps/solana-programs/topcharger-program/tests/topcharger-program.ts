import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { TopchargerProgram } from "../target/types/topcharger_program";
import { expect } from "chai";
import { Buffer } from "buffer";

describe("topcharger-program", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program = anchor.workspace.topchargerProgram as Program<TopchargerProgram>;
  const systemProgram = anchor.web3.SystemProgram.programId;

  it("registers a user, creates a charger, reserves it and confirms charge", async () => {
    // Prepare identities
    const host = anchor.web3.Keypair.generate();
    const driver = anchor.web3.Keypair.generate();

    // Make 32-byte hashes for user and driver (deterministic test values)
    const hostUserHash = Buffer.alloc(32, 0);
    hostUserHash[0] = 1;
    const driverUserHash = Buffer.alloc(32, 0);
    driverUserHash[0] = 2;
    // Derive user PDA for host using 32-byte hash
    const [hostUserPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("user"), hostUserHash],
      program.programId
    );

    // 1) Register host user (userIdHash is a 32-byte array)
    await program.methods
      .registerUser(1, Array.from(hostUserHash)) // role = 1 (host)
      .accounts({
        user: hostUserPda,
        wallet: host.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram,
      } as any)
      .rpc();

    const hostAccount = await program.account.userAccount.fetch(hostUserPda);
    expect(Buffer.from(hostAccount.userIdHash)).to.deep.equal(hostUserHash);
    expect(hostAccount.role).to.equal(1);
    expect(hostAccount.wallet.toBase58()).to.equal(host.publicKey.toBase58());

    // 2) Create a charger for that host
    const chargerId = new BN(1);
    const powerKw = 22;
    const supplyType = 0;
    const price = new BN(1000);
    const location = "Test Location";

    const chargerIdBuf = chargerId.toArrayLike(Buffer, "le", 8);
    // Charger PDA uses the 32-byte host id hash
    const [chargerPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("charger"), hostUserHash, chargerIdBuf],
      program.programId
    );

    await program.methods
      .createCharger(Array.from(hostUserHash), chargerId, powerKw, supplyType, price, location)
      .accounts({
        charger: chargerPda,
        wallet: host.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram,
      } as any)
      .rpc();

    const chargerAccount = await program.account.chargerAccount.fetch(chargerPda);
    expect(Buffer.from(chargerAccount.userIdHash)).to.deep.equal(hostUserHash);
    //expect(chargerAccount.hostWallet.toBase58()).to.equal(host.publicKey.toBase58());
    expect(chargerAccount.chargerId.toNumber()).to.equal(chargerId.toNumber());
    expect(chargerAccount.powerKw).to.equal(powerKw);
    expect(chargerAccount.supplyType).to.equal(supplyType);
    expect(chargerAccount.price.toNumber()).to.equal(price.toNumber());
    expect(chargerAccount.status).to.equal(0);

    // 3) Reserve the charger (driver)
    const [matchPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("match"), chargerPda.toBuffer()],
      program.programId
    );

    await program.methods
      .reserveCharger(Array.from(driverUserHash))
      .accounts({
        charger: chargerPda,
        matchAccount: matchPda,
        authority: provider.wallet.publicKey,
        systemProgram,
      } as any)
      .rpc();

    const chargerAfterReserve = await program.account.chargerAccount.fetch(chargerPda);
    expect(chargerAfterReserve.status).to.equal(1);

  const matchAccount = await program.account.matchAccount.fetch(matchPda);
  expect(Buffer.from(matchAccount.driverUserHash)).to.deep.equal(driverUserHash);
  expect(matchAccount.charger.toBase58()).to.equal(chargerPda.toBase58());
  expect(matchAccount.status).to.equal(0);

    // 4) Confirm charge completed
    await program.methods
      .confirmCharge(true)
      .accounts({ matchAccount: matchPda } as any)
      .rpc();

    const matchAfterConfirm = await program.account.matchAccount.fetch(matchPda);
    expect(matchAfterConfirm.status).to.equal(1);
    expect(matchAfterConfirm.confirmedCorrect).to.equal(true);
  });
});
