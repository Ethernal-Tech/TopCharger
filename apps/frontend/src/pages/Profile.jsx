// apps/frontend/src/pages/Profile.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/UseAuth";
import FullScreenLoader from "../components/FullScreenLoader.jsx";
import { detectWallets } from "../utils/solanaWallet";
import { send01SolWithWallet } from "../utils/sendSignedTx";
import { BACKEND } from "../context/Constants.js";

const TEST_RECIPIENT = "7zfP1d9RDwUrw6iWaSsKPi8E13jC6igUApa5NDyxYyNV";

export default function Profile() {
  const { user, role, wallet } = useAuth(); // role is "HOST" | "DRIVER" | "UNSET"
  const [profile, setProfile] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        if (!user) throw new Error("Not logged in");
        if (role === "UNSET") throw new Error("Please choose a role first.");

        const pathRole = role === "HOST" ? "hosts" : "drivers";
        const endpoint = `${BACKEND}/api/${pathRole}/profile`;

        // Profile
        const res = await fetch(endpoint, {
          method: "GET",
          credentials: "include",
          signal: ac.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch profile");
        const data = await res.json();
        setProfile({ ...data, role });

        // Linked wallets (account-level)
        const wRes = await fetch(`${BACKEND}/api/auth/wallets`, {
          credentials: "include",
          signal: ac.signal,
        });
        if (wRes.ok) {
          const json = await wRes.json();
          setWallets(Array.isArray(json.wallets) ? json.wallets : []);
        }
      } catch (err) {
        if (!ac.signal.aborted) setError(err.message || "Unknown error");
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [user, role]);

  // Prefer live wallet, fall back to first linked
  const displayPk = wallet || (wallets?.length ? wallets[0] : null);
  const shortDisplay = displayPk
    ? `${displayPk.slice(0, 4)}…${displayPk.slice(-4)}`
    : null;

  // Refresh linked list when live wallet changes
  useEffect(() => {
    const ac = new AbortController();
    (async () => {
      try {
        const wRes = await fetch(`${BACKEND}/api/auth/wallets`, {
          credentials: "include",
          signal: ac.signal,
        });
        if (wRes.ok) {
          const json = await wRes.json();
          setWallets(Array.isArray(json.wallets) ? json.wallets : []);
        }
      } catch {}
    })();
    return () => ac.abort();
  }, [wallet]);

  const handleSendTestTx = async () => {
    try {
      setSending(true);
      const candidates = detectWallets();
      if (!candidates.length) {
        alert("No supported wallet detected (install Phantom or Solflare).");
        return;
      }
      const provider =
        candidates.find((w) => w.id === "phantom")?.provider ||
        candidates.find((w) => w.id === "solflare")?.provider ||
        candidates[0].provider;

      const res = await send01SolWithWallet(provider, TEST_RECIPIENT);
      alert(`✅ Sent 0.01 SOL\nSig: ${res.signature}`);
      if (res.explorerUrl) window.open(res.explorerUrl, "_blank");
    } catch (e) {
      alert(`❌ ${e?.message || "Failed to send transaction"}`);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <FullScreenLoader />;

  if (error) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/top_charger.png')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/70 via-emerald-900/40 to-emerald-900/70" />
        <p className="relative z-10 text-red-500 p-4 sm:p-6 bg-white/30 rounded text-center">
          {error}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/top_charger.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/70 via-emerald-900/40 to-emerald-900/70" />
      <div className="relative z-10 backdrop-blur-sm bg-white/90 p-6 sm:p-10 rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg">
        <div className="flex flex-col items-center mb-6">
          <div className="bg-green-700 text-white p-4 sm:p-6 rounded-full text-3xl sm:text-4xl mb-3 shadow">
            👤
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-green-900 text-center">
            {role === "HOST" ? "Host Profile" : "Driver Profile"}
          </h1>
        </div>

        <div className="space-y-4">
          {role === "HOST" ? (
            <>
              <ProfileField
                label="Business Name"
                value={profile.host?.businessName}
              />
              <ProfileField
                label="Bank Account IBAN"
                value={profile.host?.bankAccountIban}
              />
              <ProfileField
                label="Bank Account Name"
                value={profile.host?.bankAccountName}
              />
              <ProfileField
                label="Wallet"
                value={shortDisplay || "No wallet linked"}
              />
            </>
          ) : (
            <>
              <ProfileField
                label="Full Name"
                value={profile.driver?.fullName}
              />
              <ProfileField label="Phone" value={profile.driver?.phone} />
              <ProfileField
                label="Wallet"
                value={shortDisplay || "No wallet linked"}
              />
            </>
          )}

          <div className="pt-2">
            <button
              onClick={handleSendTestTx}
              disabled={sending}
              className="w-full bg-green-700 text-white py-2 px-4 rounded hover:bg-green-800 disabled:opacity-50"
            >
              {sending ? "Sending 0.01 SOL…" : "Send 0.01 SOL Test Tx"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileField({ label, value }) {
  return (
    <div className="border-b pb-2">
      <span className="block text-green-800 font-semibold text-sm sm:text-base">
        {label}
      </span>
      <span className="text-green-900 text-sm sm:text-base">
        {value || "—"}
      </span>
    </div>
  );
}
