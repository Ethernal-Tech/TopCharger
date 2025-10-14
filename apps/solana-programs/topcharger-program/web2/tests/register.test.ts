import { expect } from "chai";
import { registerUser, createCharger, reserveCharger, confirmCharge } from "../src/register.ts";
import crypto from "crypto";
import { Connection, PublicKey } from "@solana/web3.js";
import path from "path";
import fs from "fs";

describe("web2 register + create charger + reserve flow", function () {
  this.timeout(200000);

  it("registers host & driver, creates charger, reserves it", async function () {
    // This test expects ANCHOR_PROVIDER_URL and ANCHOR_WALLET to be set in the env.
    if (!process.env.ANCHOR_PROVIDER_URL || !process.env.ANCHOR_WALLET) {
      // Skip the test with a friendly message
      this.skip();
      return;
    }

  // Host user (role 1?)
  const hostUserHashArr = Array(32).fill(129);
  const res = await registerUser(1, hostUserHashArr);
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
  expect(Array.from(userHash)).to.deep.equal(hostUserHashArr);
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
      hostUserHashArr,
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

  expect(Array.from(c_userHash)).to.deep.equal(hostUserHashArr);
    expect(c_chargerId).to.equal(chargerId);
    expect(c_powerKw).to.equal(powerKw);
    expect(c_supplyType).to.equal(supplyType);
    expect(c_price).to.equal(price);
    // Driver user (different hash) registers
    const driverUserHashArr = Array(32).fill(130);
    const driverRes = await registerUser(2, driverUserHashArr); // role 2 for driver
    expect(driverRes).to.have.property("userPda");

    // Reserve the charger with driver user hash
    const reserveRes = await reserveCharger(chargerRes.chargerPda, driverUserHashArr);
    expect(reserveRes).to.have.property("matchPda");
    console.log("reserve tx:", reserveRes.tx);
    console.log("matchPda:", reserveRes.matchPda);

    // Fetch match account and verify driver hash & charger pubkey inside raw data (pre-confirm)
    const matchPdaPk = new PublicKey(reserveRes.matchPda);
    let matchAcct = await conn.getAccountInfo(matchPdaPk, "confirmed");
    expect(matchAcct).to.not.be.null;
    if (!matchAcct) return;
    let mdata = matchAcct.data;
    if (mdata.length < 8 + 32 + 32 + 1 + 1) {
      throw new Error(`unexpected match account size: ${mdata.length}`);
    }
    let moff = 8;
    let m_driverHash = mdata.slice(moff, moff + 32); moff += 32;
    let m_chargerPub = new PublicKey(mdata.slice(moff, moff + 32)); moff += 32;
    let m_status = mdata[moff]; moff += 1;
    let m_confirmed = mdata[moff] === 1;
    expect(Array.from(m_driverHash)).to.deep.equal(driverUserHashArr);
    expect(m_chargerPub.toBase58()).to.equal(chargerRes.chargerPda);
    expect(m_status).to.be.lessThan(10);
    expect(m_confirmed).to.be.false;

    // Confirm charge (was correct)
    const confirmRes = await confirmCharge(reserveRes.matchPda, true);
    expect(confirmRes).to.have.property("tx");
    console.log("confirm tx:", confirmRes.tx);

    // Refetch and assert confirmed flag flipped
    matchAcct = await conn.getAccountInfo(matchPdaPk, "confirmed");
    expect(matchAcct).to.not.be.null;
    if (!matchAcct) return;
    mdata = matchAcct.data;
    moff = 8;
    m_driverHash = mdata.slice(moff, moff + 32); moff += 32;
    m_chargerPub = new PublicKey(mdata.slice(moff, moff + 32)); moff += 32;
    m_status = mdata[moff]; moff += 1;
    m_confirmed = mdata[moff] === 1;
    expect(m_confirmed).to.be.true;
  });
});
