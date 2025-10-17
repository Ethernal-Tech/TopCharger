import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { TopchargerProgram } from "../target/types/topcharger_program";
import { expect } from "chai";
import { Buffer } from "buffer";

describe("topcharger-program-multi", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider() as anchor.AnchorProvider;
  const program = anchor.workspace.topchargerProgram as Program<TopchargerProgram>;
  const systemProgram = anchor.web3.SystemProgram.programId;

  it("allows a host to add multiple chargers and multiple drivers to reserve and confirm them", async () => {
    const host = anchor.web3.Keypair.generate();

    // host id hash (32 bytes)
    const hostUserHash = Buffer.alloc(32, 0);
    hostUserHash[0] = 7;

    // register the host
    const [hostUserPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("user"), hostUserHash],
      program.programId
    );

    await program.methods
      .registerUser(1, Array.from(hostUserHash))
      .accounts({
        user: hostUserPda,
        wallet: host.publicKey,
        authority: provider.wallet.publicKey,
        systemProgram,
      } as any)
      .rpc();

    const hostAccount = await program.account.userAccount.fetch(hostUserPda);
    expect(Buffer.from(hostAccount.userIdHash)).to.deep.equal(hostUserHash);

    // create multiple chargers
    const numChargers = 3;
    const chargerPdas: anchor.web3.PublicKey[] = [];

    for (let i = 0; i < numChargers; i++) {
      const chargerId = new BN(i + 1);
      const powerKw = 11 + i;
      const supplyType = i % 2;
      const price = new BN(500 + i * 100);

      const chargerIdBuf = chargerId.toArrayLike(Buffer, "le", 8);
      const [chargerPda] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("charger"), hostUserHash, chargerIdBuf],
        program.programId
      );

      await program.methods
        .createCharger(Array.from(hostUserHash), chargerId, powerKw, supplyType, price)
        .accounts({
          charger: chargerPda,
          wallet: host.publicKey,
          authority: provider.wallet.publicKey,
          systemProgram,
        } as any)
        .rpc();

      const chargerAccount = await program.account.chargerAccount.fetch(chargerPda);
      expect(Buffer.from(chargerAccount.userIdHash)).to.deep.equal(hostUserHash);
      expect(chargerAccount.chargerId.toNumber()).to.equal(chargerId.toNumber());
      expect(chargerAccount.status).to.equal(0);

      chargerPdas.push(chargerPda);
    }

    // create drivers and reserve each charger
    const numDrivers = numChargers;
    for (let i = 0; i < numDrivers; i++) {
      const dHash = Buffer.alloc(32, 0);
      dHash[0] = 20 + i;

      // reserve the i-th charger using 32-byte match_id
      const chargerPda = chargerPdas[i];
      const matchIdBuf = Buffer.alloc(32, 0);
      matchIdBuf[0] = 100 + i; // simple uniqueness for test
      const [matchPda] = await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("match"), matchIdBuf],
        program.programId
      );

      await program.methods
        .reserveCharger(Array.from(matchIdBuf), Array.from(dHash))
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
      expect(Buffer.from(matchAccount.matchId)).to.deep.equal(matchIdBuf);
      expect(Buffer.from(matchAccount.driverUserHash)).to.deep.equal(dHash);
      expect(matchAccount.charger.toBase58()).to.equal(chargerPda.toBase58());
      expect(matchAccount.status).to.equal(0);

      // confirm charge
      await program.methods
        .confirmCharge(true)
        .accounts({ matchAccount: matchPda, charger: chargerPda } as any)
        .rpc();

      const matchAfterConfirm = await program.account.matchAccount.fetch(matchPda);
  expect(matchAfterConfirm.status).to.equal(1);
  expect(matchAfterConfirm.confirmedCorrect).to.equal(true);
  // Charger should be freed for next reservations
  const chargerAfterConfirm = await program.account.chargerAccount.fetch(chargerPda);
  expect(chargerAfterConfirm.status).to.equal(0);
    }
  });
});
