import { useState, useEffect } from "react";
import WalletContext from "./WalletContext.jsx";

export default function WalletProvider({ children }) {
    const [walletAddress, setWalletAddress] = useState(null);

    useEffect(() => {
        if (window.solana && window.solana.isPhantom) {
            window.solana.connect({ onlyIfTrusted: true })
                .then((resp) => setWalletAddress(resp.publicKey.toString()))
                .catch(() => { });
        }
    }, []);

    const connectWallet = async () => {
        const { solana } = window;
        if (!solana) return alert("Phantom wallet not found!");
        const resp = await solana.connect();
        setWalletAddress(resp.publicKey.toString());
    };

    const disconnectWallet = async () => {
        const { solana } = window;
        if (solana) await solana.disconnect();
        setWalletAddress(null);
    };

    return (
        <WalletContext.Provider value={{ walletAddress, connectWallet, disconnectWallet }}>
            {children}
        </WalletContext.Provider>
    );
}
