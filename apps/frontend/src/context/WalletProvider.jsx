// src/context/WalletProvider.jsx
import { useState, useEffect } from "react";
import WalletContext from "./WalletContext";

export default function WalletProvider({ children }) {
    const [walletAddress, setWalletAddress] = useState(null);

    useEffect(() => {
        if (window.solana && window.solana.isPhantom) {
            window.solana
                .connect({ onlyIfTrusted: true })
                .then((resp) => setWalletAddress(resp.publicKey.toString()))
                .catch(() => { });
        }
    }, []);

    const connectWallet = async () => {
        try {
            const { solana } = window;
            if (!solana) return alert("Phantom not found");
            const response = await solana.connect();
            setWalletAddress(response.publicKey.toString());
        } catch (error) {
            console.error(error);
        }
    };

    const disconnectWallet = async () => {
        try {
            const { solana } = window;
            if (solana) await solana.disconnect();
            setWalletAddress(null);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <WalletContext.Provider value={{ walletAddress, connectWallet, disconnectWallet }}>
            {children}
        </WalletContext.Provider>
    );
}
