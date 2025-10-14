import { expect } from "chai";
import { registerUser, createCharger } from "../src/register.ts";
import { Connection, PublicKey } from "@solana/web3.js";
import path from "path";
import fs from "fs";

describe("web2 register script", function () {
  this.timeout(200000);

  it("calls registerUser on chain", async function () {
    // This test expects ANCHOR_PROVIDER_URL and ANCHOR_WALLET to be set in the env.
    if (!process.env.ANCHOR_PROVIDER_URL || !process.env.ANCHOR_WALLET) {
      // Skip the test with a friendly message
      this.skip();
      return;
    }

    const userIdHashArr = Array(32).fill(124);
    const res = await registerUser(1, userIdHashArr);
    expect(res).to.have.property("tx");
    expect(res).to.have.property("userPda");
    console.log("tx:", res.tx);
    console.log("userPda:", res.userPda);

    // Fetch the user account from the RPC and verify contents.
    const rpcUrl = process.env.ANCHOR_PROVIDER_URL!;
    const conn = new Connection(rpcUrl, "confirmed");
    const pda = new PublicKey(res.userPda);
    const acct = await conn.getAccountInfo(pda, "confirmed");
    expect(acct).to.not.be.null;
    if (!acct) return;

    const data = acct.data;
    if (data.length < 8 + 32 + 1 + 32) {
      throw new Error(`unexpected user account size: ${data.length}`);
    }
    const userHash = data.slice(8, 8 + 32);
    const role = data[8 + 32];
    const walletBytes = data.slice(8 + 32 + 1, 8 + 32 + 1 + 32);
    const walletPubkey = new PublicKey(walletBytes);
    expect(Array.from(userHash)).to.deep.equal(userIdHashArr);
    expect(role).to.equal(1);
    //const walletPath = process.env.ANCHOR_WALLET!;
    //const keypair = JSON.parse(fs.readFileSync(path.resolve(walletPath), "utf8"));
    //const expectedPubkey = new PublicKey(keypair[0] ? keypair[0] : keypair);
    //expect(walletPubkey.toBase58()).to.equal(expectedPubkey.toBase58());

    // Now create a charger for this user
    const chargerId = 42;
    const powerKw = 22;
    const supplyType = 1;
    const price = 1000000;
    //const location = Array(64).fill(1);
    const chargerRes = await createCharger(
      userIdHashArr,
      chargerId,
      powerKw,
      supplyType,
      price
    );
    expect(chargerRes).to.have.property("tx");
    expect(chargerRes).to.have.property("chargerPda");
    console.log("charger tx:", chargerRes.tx);
    console.log("chargerPda:", chargerRes.chargerPda);

    // Fetch the charger account and check fields
    const chargerAcct = await conn.getAccountInfo(new PublicKey(chargerRes.chargerPda), "confirmed");
    expect(chargerAcct).to.not.be.null;
    if (!chargerAcct) return;
    const cdata = chargerAcct.data;
    // Discriminator (8) + user_id_hash (32) + charger_id (8) + power_kw (2) + supply_type (1) + price (8) + status (1)
    if (cdata.length < 8 + 32 + 8 + 2 + 1 + 8 + 1) {
      throw new Error(`unexpected charger account size: ${cdata.length}`);
    }
    let offset = 8;
    const c_userHash = cdata.slice(offset, offset + 32); offset += 32;
    const c_chargerId = Number(cdata.readBigUInt64LE(offset)); offset += 8;
    const c_powerKw = cdata.readUInt16LE(offset); offset += 2;
    const c_supplyType = cdata[offset]; offset += 1;
    const c_price = Number(cdata.readBigUInt64LE(offset)); offset += 8;
    const c_status = cdata[offset]; offset += 1;
    //const c_location = cdata.slice(offset, offset + 64).toString("utf8").replace(/\0+$/, "");

    expect(Array.from(c_userHash)).to.deep.equal(userIdHashArr);
    expect(c_chargerId).to.equal(chargerId);
    expect(c_powerKw).to.equal(powerKw);
    expect(c_supplyType).to.equal(supplyType);
    expect(c_price).to.equal(price);
    //expect(c_location).to.include(location);
  });
});
