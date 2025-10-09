import { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext.jsx";

export default function RegisterSeller() {
    const { walletAddress } = useWallet(); // ✅ get wallet from navbar/context
    const [company, setCompany] = useState("");
    const [submitStatus, setSubmitStatus] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!walletAddress) return alert("Please connect your wallet first!");

        const sellerData = { company, wallet: walletAddress };
        // call backend API
        console.log("Registering seller:", sellerData);
        setSubmitStatus("✅ Seller registered successfully!");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-green-100 p-4">
            <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-green-900 mb-6 text-center">
                    Register as Seller
                </h2>

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-green-900 mb-1">Company Name</label>
                        <input
                            type="text"
                            placeholder="Company Name"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            className="w-full p-2 rounded bg-green-100 border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>

                    {/* Wallet Address Field */}
                    <div>
                        <label className="block text-green-900 mb-1">Connected Wallet</label>
                        <input
                            type="text"
                            value={walletAddress || ""}
                            readOnly
                            className="w-full p-2 rounded bg-green-50 border border-green-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-700 text-white py-2 rounded font-semibold hover:bg-green-800 transition-colors"
                        disabled={!walletAddress} // disable if not connected
                    >
                        Register Seller
                    </button>

                    {submitStatus && (
                        <p className="mt-2 text-center text-green-900 font-semibold">{submitStatus}</p>
                    )}
                </form>
            </div>
        </div>
    );
}
