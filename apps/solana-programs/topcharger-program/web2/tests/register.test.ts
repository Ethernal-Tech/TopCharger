import { expect } from "chai";
import { registerUser } from "../src/register";

describe("web2 register script", function () {
  this.timeout(200000);

  it("calls registerUser on chain", async function () {
    // This test expects ANCHOR_PROVIDER_URL and ANCHOR_WALLET to be set in the env.
    if (!process.env.ANCHOR_PROVIDER_URL || !process.env.ANCHOR_WALLET) {
      // Skip the test with a friendly message
      this.skip();
      return;
    }

    const userIdHashArr = Array(32).fill(2);
    const res = await registerUser(1, userIdHashArr);
    expect(res).to.have.property("tx");
    expect(res).to.have.property("userPda");
    console.log("tx:", res.tx);
    console.log("userPda:", res.userPda);
  });
});
